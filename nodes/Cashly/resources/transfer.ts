import type { INodeProperties, INodePropertyOptions } from 'n8n-workflow';
import { toUtcTimestamp } from '../shared/descriptions';

const R = 'transfer';
const show = (operation: string[]) => ({ show: { resource: [R], operation } });

/** The account kinds a transfer can start or end at. A plain debit card uses its bank. */
const kindOptions: INodePropertyOptions[] = [
	{ name: 'Bank Account', value: 'bank' },
	{ name: 'Cash', value: 'cash' },
	{ name: 'Credit Card', value: 'credit_card' },
	{ name: 'Prepaid Card', value: 'prepaid' },
	{ name: 'Wallet', value: 'wallet' },
];

/** One end of the transfer: its kind and, except for cash, the account. */
function endpoint(side: 'from' | 'to', label: string, help: string): INodeProperties[] {
	const kindName = `${side}Kind`;
	return [
		{
			displayName: `${label} Kind`,
			name: kindName,
			type: 'options',
			required: true,
			options: kindOptions,
			default: 'bank',
			description: help,
			displayOptions: show(['create']),
			routing: { send: { type: 'body', property: `${side}.kind` } },
		},
		{
			displayName: `${label} Account Name or ID`,
			name: `${side}Id`,
			type: 'options',
			typeOptions: { loadOptionsMethod: side === 'from' ? 'getFromAccounts' : 'getToAccounts', loadOptionsDependsOn: [kindName] },
			required: true,
			default: '',
			description:
				'The account of the chosen kind. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			displayOptions: { show: { resource: [R], operation: ['create'], [kindName]: ['bank', 'credit_card', 'prepaid', 'wallet'] } },
			routing: { send: { type: 'body', property: `${side}.id` } },
		},
	];
}

export const transferDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [R] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a transfer',
				description:
					'Record money moved between two of your own accounts: bank to bank, a wallet top-up, a cash withdrawal, a card bill paid from a bank or a card to card balance transfer. Neither income nor expense.',
				routing: {
					request: { method: 'POST', url: '/transfers' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'transfer' } }] },
				},
			},
		],
		default: 'create',
	},
	...endpoint('from', 'From', 'Where the money leaves'),
	...endpoint('to', 'To', 'Where the money arrives (a different account)'),
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'number',
		required: true,
		typeOptions: { minValue: 0.01, numberPrecision: 2 },
		default: 0,
		description: "Amount in the account's currency, in major units (for example 2000)",
		displayOptions: show(['create']),
		routing: { send: { type: 'body', property: 'amount' } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: show(['create']),
		options: [
			{
				displayName: 'Date',
				name: 'transactionDate',
				type: 'dateTime',
				default: '',
				description: 'When the transfer happened. Leave empty for now.',
				routing: { send: { type: 'body', property: 'transaction_date', value: toUtcTimestamp } },
			},
			{
				displayName: 'Fee',
				name: 'fee',
				type: 'number',
				typeOptions: { minValue: 0, numberPrecision: 2 },
				default: 0,
				description: 'Charges for the transfer, saved as a Fees expense on the source account',
				routing: { send: { type: 'body', property: 'fee' } },
			},
			{
				displayName: 'Note',
				name: 'note',
				type: 'string',
				default: '',
				routing: { send: { type: 'body', property: 'note' } },
			},
		],
	},
];
