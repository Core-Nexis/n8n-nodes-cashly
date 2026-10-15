import {
	NodeConnectionTypes,
	type IDataObject,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	type IPollFunctions,
} from 'n8n-workflow';
import { cashlyApiRequest } from '../Cashly/shared/transport';

/** How many already-delivered record IDs are remembered between polls. */
const SEEN_LIMIT = 500;

/** Calendar date (YYYY-MM-DD) offset by a number of days from today, in UTC. */
function isoDay(offsetDays: number): string {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() + offsetDays);
	return d.toISOString().slice(0, 10);
}

/**
 * Polls Cashly instead of receiving webhooks: for n8n instances Cashly cannot
 * reach (a local install, for example) and for bills falling due, which is a
 * matter of time rather than a change to the data. On activation it
 * records what already exists and only emits records that appear afterwards;
 * "Fetch Test Event" returns the most recent record so the output can be
 * mapped. Delivered IDs are kept in the workflow's static data so a record is
 * never emitted twice.
 */
export class CashlyPollingTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cashly Polling Trigger',
		name: 'cashlyPollingTrigger',
		icon: { light: 'file:../../icons/cashly.svg', dark: 'file:../../icons/cashly.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Checks Cashly on a schedule for new records and bills falling due',
		defaults: {
			name: 'Cashly Polling Trigger',
		},
		polling: true,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'cashlyApi',
				required: true,
				displayOptions: { show: { authentication: ['apiKey'] } },
			},
			{
				name: 'cashlyOAuth2Api',
				required: true,
				displayOptions: { show: { authentication: ['oAuth2'] } },
			},
		],
		properties: [
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				options: [
					{ name: 'API Key', value: 'apiKey' },
					{ name: 'OAuth2', value: 'oAuth2' },
				],
				default: 'apiKey',
			},
			{
				displayName: 'Trigger On',
				name: 'event',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'New Lend or Borrow',
						value: 'newDebt',
						description: 'A new record of money lent or borrowed',
					},
					{
						name: 'New Transaction',
						value: 'newTransaction',
						description: 'An income or expense is added',
					},
					{
						name: 'Upcoming Bill Due',
						value: 'billDue',
						description: 'A pending bill falls due within the chosen number of days',
					},
				],
				default: 'newTransaction',
			},
			{
				displayName: 'Transaction Type',
				name: 'transactionType',
				type: 'options',
				options: [
					{ name: 'Any', value: 'any' },
					{ name: 'Expense (Money Out)', value: 'debit' },
					{ name: 'Income (Money In)', value: 'credit' },
				],
				default: 'any',
				displayOptions: { show: { event: ['newTransaction'] } },
			},
			{
				displayName: 'Days Ahead',
				name: 'daysAhead',
				type: 'number',
				typeOptions: { minValue: 0, maxValue: 60 },
				default: 3,
				description: 'Trigger for bills due today or within this many days. Each bill triggers once.',
				displayOptions: { show: { event: ['billDue'] } },
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const authentication = this.getNodeParameter('authentication', 'apiKey') as string;
		const event = this.getNodeParameter('event') as string;
		const state = this.getWorkflowStaticData('node') as { seen?: string[]; primed?: boolean };
		const isManual = this.getMode() === 'manual';

		let rows: IDataObject[] = [];

		if (event === 'newTransaction') {
			const type = this.getNodeParameter('transactionType', 'any') as string;
			const qs: IDataObject = { range: '7d', limit: 200 };
			if (type !== 'any') qs.type = type;
			const response = await cashlyApiRequest.call(this, authentication, 'GET', '/transactions', qs);
			rows = (response.transactions as IDataObject[] | undefined) ?? [];
		} else if (event === 'newDebt') {
			const response = await cashlyApiRequest.call(this, authentication, 'GET', '/debts', {
				status: 'all',
			});
			rows = (response.debts as IDataObject[] | undefined) ?? [];
		} else {
			const daysAhead = this.getNodeParameter('daysAhead', 3) as number;
			const response = await cashlyApiRequest.call(this, authentication, 'GET', '/upcoming-bills', {
				status: 'pending',
				from: isoDay(0),
				to: isoDay(daysAhead),
			});
			rows = (response.bills as IDataObject[] | undefined) ?? [];
		}

		// Newest first, by creation time where the record has one.
		rows.sort((a, b) =>
			String(b.created_at ?? b.due_date ?? '').localeCompare(String(a.created_at ?? a.due_date ?? '')),
		);

		if (isManual) {
			return rows.length ? [this.helpers.returnJsonArray(rows.slice(0, 1))] : null;
		}

		const seen = new Set(state.seen ?? []);
		const fresh = rows.filter((row) => !seen.has(String(row.id)));
		for (const row of rows) seen.add(String(row.id));
		state.seen = [...seen].slice(-SEEN_LIMIT);

		// The first poll after activation only records what already exists, except
		// for bills: a bill already inside the window is exactly what to report.
		if (!state.primed) {
			state.primed = true;
			if (event !== 'billDue') return null;
		}

		return fresh.length ? [this.helpers.returnJsonArray(fresh.reverse())] : null;
	}
}
