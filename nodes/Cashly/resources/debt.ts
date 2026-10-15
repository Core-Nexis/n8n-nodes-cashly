import type { INodeProperties } from 'n8n-workflow';
import { idField, paymentSourceOptions, returnAllAndLimit, toCalendarDate } from '../shared/descriptions';

const R = 'debt';
const show = (operation: string[]) => ({ show: { resource: [R], operation } });
const single = [{ type: 'rootProperty' as const, properties: { property: 'debt' } }];

export const debtDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [R] } },
		options: [
			{
				name: 'Add Amount',
				value: 'addAmount',
				action: 'Add to a debt',
				description: 'Increase what is owed (lent or borrowed more)',
				routing: {
					request: { method: 'POST', url: '=/debts/{{$parameter.debtId}}/add' },
					output: { postReceive: single },
				},
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a debt',
				description: 'Record money you lent or borrowed. Also records the principal as a transaction.',
				routing: {
					request: { method: 'POST', url: '/debts' },
					output: { postReceive: single },
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a debt',
				description: 'Delete a debt and its linked transactions',
				routing: { request: { method: 'DELETE', url: '=/debts/{{$parameter.debtId}}' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a debt',
				description: 'Get one debt with its payment history',
				routing: {
					request: { method: 'GET', url: '=/debts/{{$parameter.debtId}}' },
					output: { postReceive: single },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many debts',
				description: 'List money lent and borrowed',
				routing: {
					request: { method: 'GET', url: '/debts' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'debts' } }] },
				},
			},
			{
				name: 'Record Payment',
				value: 'recordPayment',
				action: 'Record a debt payment',
				description: 'Record a part payment received or made',
				routing: { request: { method: 'POST', url: '=/debts/{{$parameter.debtId}}/payment' } },
			},
			{
				name: 'Settle',
				value: 'settle',
				action: 'Settle a debt',
				description: 'Mark a debt as fully paid, recording the outstanding amount',
				routing: { request: { method: 'POST', url: '=/debts/{{$parameter.debtId}}/settle' } },
			},
			{
				name: 'Unsettle',
				value: 'unsettle',
				action: 'Reopen a debt',
				description: 'Reopen a settled debt and remove its settlement transaction',
				routing: {
					request: { method: 'POST', url: '=/debts/{{$parameter.debtId}}/unsettle' },
					output: { postReceive: single },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a debt',
				description: 'Change the name, note, due date or direction of a debt',
				routing: {
					request: { method: 'PATCH', url: '=/debts/{{$parameter.debtId}}' },
					output: { postReceive: single },
				},
			},
		],
		default: 'create',
	},

	idField(
		'Debt ID',
		'debtId',
		R,
		['addAmount', 'delete', 'get', 'recordPayment', 'settle', 'unsettle', 'update'],
		'The ID of the debt',
	),

	// ---- create ----
	{
		displayName: 'Direction',
		name: 'entryType',
		type: 'options',
		required: true,
		options: [
			{ name: 'I Borrowed (I Owe Them)', value: 'creditor' },
			{ name: 'I Lent (They Owe Me)', value: 'debtor' },
		],
		default: 'debtor',
		displayOptions: show(['create']),
		routing: { send: { type: 'body', property: 'entry_type' } },
	},
	{
		displayName: 'Person Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		description: 'Who the money was lent to or borrowed from',
		displayOptions: show(['create']),
		routing: { send: { type: 'body', property: 'name' } },
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'number',
		required: true,
		typeOptions: { minValue: 0.01, numberPrecision: 2 },
		default: 0,
		displayOptions: show(['create', 'addAmount', 'recordPayment']),
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
				displayName: 'Due Date',
				name: 'dueDate',
				type: 'dateTime',
				default: '',
				routing: { send: { type: 'body', property: 'due_date', value: toCalendarDate } },
			},
			{
				displayName: 'Note',
				name: 'description',
				type: 'string',
				default: '',
				routing: { send: { type: 'body', property: 'description' } },
			},
			...paymentSourceOptions('payment_method'),
		],
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
				displayName: 'Direction',
				name: 'entryType',
				type: 'options',
				options: [
					{ name: 'I Borrowed (I Owe Them)', value: 'creditor' },
					{ name: 'I Lent (They Owe Me)', value: 'debtor' },
				],
				default: 'debtor',
				description: 'Changing the direction also flips the recorded transactions',
				routing: { send: { type: 'body', property: 'entry_type' } },
			},
			{
				displayName: 'Due Date',
				name: 'dueDate',
				type: 'dateTime',
				default: '',
				routing: { send: { type: 'body', property: 'due_date', value: toCalendarDate } },
			},
			{
				displayName: 'Note',
				name: 'description',
				type: 'string',
				default: '',
				routing: { send: { type: 'body', property: 'description' } },
			},
			{
				displayName: 'Person Name',
				name: 'name',
				type: 'string',
				default: '',
				routing: { send: { type: 'body', property: 'name' } },
			},
		],
	},

	// ---- addAmount / recordPayment / settle ----
	{
		displayName: 'Options',
		name: 'paymentOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['addAmount', 'recordPayment', 'settle']),
		options: [
			...paymentSourceOptions(),
			{
				displayName: 'Note',
				name: 'note',
				type: 'string',
				default: '',
				displayOptions: { show: { '/operation': ['addAmount', 'recordPayment'] } },
				routing: { send: { type: 'body', property: 'note' } },
			},
		],
	},

	// ---- getAll ----
	{
		displayName: 'Status',
		name: 'status',
		type: 'options',
		options: [
			{ name: 'All', value: 'all' },
			{ name: 'Pending', value: 'pending' },
			{ name: 'Settled', value: 'settled' },
		],
		default: 'pending',
		displayOptions: show(['getAll']),
		routing: { send: { type: 'query', property: 'status' } },
	},
	...returnAllAndLimit(R, 'getAll'),
];
