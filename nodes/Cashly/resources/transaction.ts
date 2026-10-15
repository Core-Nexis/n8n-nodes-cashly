import type { INodeProperties } from 'n8n-workflow';
import {
	idField,
	paymentAccountField,
	paymentMethodOptions,
	rangeOptions,
	toCalendarDate,
	toUtcTimestamp,
} from '../shared/descriptions';

const R = 'transaction';
const show = (operation: string[]) => ({ show: { resource: [R], operation } });

/** Fields shared by create and update; Cashly names them the same on both. */
function transactionFields(): INodeProperties[] {
	return [
		{
			displayName: 'Category Name or ID',
			name: 'category',
			type: 'options',
			typeOptions: { loadOptionsMethod: 'getCategories' },
			default: '',
			description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			routing: { send: { type: 'body', property: 'category' } },
		},
		{
			displayName: 'Date',
			name: 'transactionDate',
			type: 'dateTime',
			default: '',
			description: 'When the transaction happened. Leave empty for now.',
			routing: { send: { type: 'body', property: 'transaction_date', value: toUtcTimestamp } },
		},
		{
			displayName: 'Description',
			name: 'description',
			type: 'string',
			default: '',
			routing: { send: { type: 'body', property: 'description' } },
		},
		paymentAccountField,
		{
			displayName: 'Payment Label',
			name: 'methodLabel',
			type: 'string',
			default: '',
			description: 'A free-text label for the payment source, shown on the transaction',
			routing: { send: { type: 'body', property: 'method_label' } },
		},
		{
			displayName: 'Payment Method',
			name: 'paymentMethod',
			type: 'options',
			options: paymentMethodOptions,
			default: 'cash',
			routing: { send: { type: 'body', property: 'payment_method' } },
		},
	];
}

export const transactionDescription: INodeProperties[] = [
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
				action: 'Create a transaction',
				description: 'Record an income or an expense',
				routing: {
					request: { method: 'POST', url: '/transactions' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'transaction' } }] },
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a transaction',
				description: 'Delete a transaction and reverse any EMI, subscription or debt it settled',
				routing: { request: { method: 'DELETE', url: '=/transactions/{{$parameter.transactionId}}' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a transaction',
				description: 'Get one transaction',
				routing: {
					request: { method: 'GET', url: '=/transactions/{{$parameter.transactionId}}' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'transaction' } }] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many transactions',
				description: 'List transactions, newest first',
				routing: {
					request: { method: 'GET', url: '/transactions' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'transactions' } }] },
				},
			},
			{
				name: 'Get Totals',
				value: 'getTotals',
				action: 'Get transaction totals',
				description: 'Total money in and out for a period',
				routing: {
					request: { method: 'GET', url: '/transactions' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'totals' } }] },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a transaction',
				description: 'Change an existing transaction',
				routing: {
					request: { method: 'PATCH', url: '=/transactions/{{$parameter.transactionId}}' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'transaction' } }] },
				},
			},
		],
		default: 'create',
	},

	idField('Transaction ID', 'transactionId', R, ['get', 'update', 'delete'], 'The ID of the transaction'),

	// ---- create ----
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		required: true,
		options: [
			{ name: 'Expense (Money Out)', value: 'debit' },
			{ name: 'Income (Money In)', value: 'credit' },
		],
		default: 'debit',
		displayOptions: show(['create']),
		routing: { send: { type: 'body', property: 'type' } },
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'number',
		required: true,
		typeOptions: { minValue: 0.01, numberPrecision: 2 },
		default: 0,
		description: "Amount in the account's currency, in major units (for example 250.50)",
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
		options: transactionFields(),
	},

	// ---- update ----
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: show(['update']),
		options: [
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'number',
				typeOptions: { minValue: 0.01, numberPrecision: 2 },
				default: 0,
				routing: { send: { type: 'body', property: 'amount' } },
			},
			...transactionFields(),
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				options: [
					{ name: 'Expense', value: 'debit' },
					{ name: 'Income', value: 'credit' },
				],
				default: 'debit',
				description: 'Switch the transaction between income and expense',
				routing: { send: { type: 'body', property: 'type' } },
			},
		],
	},

	// ---- getAll / getTotals ----
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: show(['getAll']),
		routing: { send: { type: 'query', property: 'limit', value: '={{ $value ? 1000 : undefined }}' } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 1000 },
		default: 50,
		description: 'Max number of results to return',
		displayOptions: { show: { resource: [R], operation: ['getAll'], returnAll: [false] } },
		routing: { send: { type: 'query', property: 'limit' } },
	},
	{
		displayName: 'Period',
		name: 'range',
		type: 'options',
		options: rangeOptions,
		default: 'month',
		description: 'Preset period. Ignored when a From or To date is set in Filters.',
		displayOptions: show(['getAll', 'getTotals']),
		routing: { send: { type: 'query', property: 'range' } },
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: show(['getAll', 'getTotals']),
		options: [
			{
				displayName: 'From Date',
				name: 'from',
				type: 'dateTime',
				default: '',
				description: 'First day to include. Replaces the period.',
				routing: { send: { type: 'query', property: 'from', value: toCalendarDate } },
			},
			{
				displayName: 'Search',
				name: 'q',
				type: 'string',
				default: '',
				description: 'Text to find in the description, category or payment label',
				routing: { send: { type: 'query', property: 'q' } },
			},
			{
				displayName: 'To Date',
				name: 'to',
				type: 'dateTime',
				default: '',
				description: 'Last day to include. Replaces the period.',
				routing: { send: { type: 'query', property: 'to', value: toCalendarDate } },
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				options: [
					{ name: 'Expense (Money Out)', value: 'debit' },
					{ name: 'Income (Money In)', value: 'credit' },
				],
				default: 'debit',
				routing: { send: { type: 'query', property: 'type' } },
			},
		],
	},
];
