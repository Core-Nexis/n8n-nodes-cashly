import type { IDataObject, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { cashlyApiRequest } from './transport';

/** The node's Authentication setting, read the way load-options functions can. */
function authOf(context: ILoadOptionsFunctions): string {
	return context.getNodeParameter('authentication', 'apiKey') as string;
}

const FAMILIES: Array<[string, string]> = [
	['banks', 'Bank'],
	['credit_cards', 'Credit Card'],
	['debit_cards', 'Debit Card'],
	['wallets', 'Wallet'],
];

/** Every bank, card and wallet on the account, for the "Payment Account" dropdowns. */
export async function getPaymentAccounts(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const response = await cashlyApiRequest.call(this, authOf(this), 'GET', '/accounts');
	const options: INodePropertyOptions[] = [];

	for (const [key, label] of FAMILIES) {
		const rows = (response[key] as IDataObject[] | undefined) ?? [];
		for (const row of rows) {
			const last4 = row.last4 ? ` ****${row.last4 as string}` : '';
			options.push({
				name: `${label}: ${row.name as string}${last4}`,
				value: row.id as string,
			});
		}
	}

	return options.sort((a, b) => a.name.localeCompare(b.name));
}

/** Cashly's expense and income categories, for the "Category" dropdowns. */
export async function getCategories(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const response = await cashlyApiRequest.call(this, authOf(this), 'GET', '/categories');
	const names = new Set<string>([
		...(((response.expense as string[] | undefined) ?? []) as string[]),
		...(((response.income as string[] | undefined) ?? []) as string[]),
	]);

	return [...names]
		.sort((a, b) => a.localeCompare(b))
		.map((name) => ({ name, value: name }));
}

/** The user's banks only, for linking a debit card to its bank. */
export async function getBanks(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const response = await cashlyApiRequest.call(this, authOf(this), 'GET', '/banks');
	const rows = (response.banks as IDataObject[] | undefined) ?? [];
	return rows.map((row) => ({ name: row.name as string, value: row.id as string }));
}
