import type { INodePropertyOptions, INodeProperties } from 'n8n-workflow';

/** Cashly's payment methods, as returned by GET /payment-methods. */
export const paymentMethodOptions: INodePropertyOptions[] = [
	{ name: 'Bank Transfer', value: 'bank' },
	{ name: 'Cash', value: 'cash' },
	{ name: 'Cheque', value: 'cheque' },
	{ name: 'Credit Card', value: 'credit_card' },
	{ name: 'Debit Card', value: 'debit_card' },
	{ name: 'Other', value: 'other' },
	{ name: 'UPI', value: 'upi' },
	{ name: 'Wallet', value: 'wallet' },
];

/** Preset date ranges accepted by the transactions list and the stats endpoint. */
export const rangeOptions: INodePropertyOptions[] = [
	{ name: 'All Time', value: 'all' },
	{ name: 'Last 3 Months', value: '3m' },
	{ name: 'Last 30 Days', value: '30d' },
	{ name: 'Last 7 Days', value: '7d' },
	{ name: 'This Month', value: 'month' },
];

/**
 * Expression that turns an n8n date picker value into the YYYY-MM-DD form
 * Cashly expects for calendar dates (due dates, start dates, ranges).
 */
export const toCalendarDate = '={{ $value ? String($value).slice(0, 10) : undefined }}';

/**
 * Expression for timestamps. Cashly's update endpoints accept only UTC
 * ("...Z") values, so every timestamp is normalised to an ISO UTC string.
 */
export const toUtcTimestamp = '={{ $value ? new Date($value).toISOString() : undefined }}';

/** Body field shared by every operation that records a payment. */
export const paymentAccountField: INodeProperties = {
	displayName: 'Payment Account Name or ID',
	name: 'methodRefId',
	type: 'options',
	typeOptions: {
		loadOptionsMethod: 'getPaymentAccounts',
	},
	default: '',
	description:
		'The bank, card or wallet the money moved through. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	routing: {
		send: {
			type: 'body',
			property: 'method_ref_id',
		},
	},
};

/**
 * The optional "how was it paid" fields used when recording a payment against
 * a debt, EMI, subscription or upcoming bill. Cashly names these method,
 * method_ref_id and method_label on those endpoints; creating a debt uses
 * payment_method instead of method, so the body property can be overridden.
 * When a bank or card method is chosen without an account, Cashly uses the
 * account marked as favourite for that method.
 */
export function paymentSourceOptions(methodProperty = 'method'): INodeProperties[] {
	return [
		{
			displayName: 'Payment Method',
			name: 'method',
			type: 'options',
			options: paymentMethodOptions,
			default: 'cash',
			description: 'How the money moved. For a bank or card without an account chosen, the favourite account is used.',
			routing: {
				send: {
					type: 'body',
					property: methodProperty,
				},
			},
		},
		paymentAccountField,
		{
			displayName: 'Payment Label',
			name: 'methodLabel',
			type: 'string',
			default: '',
			description: 'A free-text label for where the money came from, shown on the transaction',
			routing: {
				send: {
					type: 'body',
					property: 'method_label',
				},
			},
		},
	];
}

/** A required record ID parameter, sent in the URL by the operation's routing. */
export function idField(
	displayName: string,
	name: string,
	resource: string,
	operations: string[],
	description: string,
): INodeProperties {
	return {
		displayName,
		name,
		type: 'string',
		required: true,
		default: '',
		description,
		displayOptions: {
			show: {
				resource: [resource],
				operation: operations,
			},
		},
	};
}

/** Return All plus Limit, for list endpoints that return every row at once. */
export function returnAllAndLimit(resource: string, operation: string): INodeProperties[] {
	return [
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			default: false,
			description: 'Whether to return all results or only up to a given limit',
			displayOptions: { show: { resource: [resource], operation: [operation] } },
		},
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			typeOptions: { minValue: 1 },
			default: 50,
			description: 'Max number of results to return',
			displayOptions: { show: { resource: [resource], operation: [operation], returnAll: [false] } },
			routing: {
				output: {
					maxResults: '={{$value}}',
				},
			},
		},
	];
}
