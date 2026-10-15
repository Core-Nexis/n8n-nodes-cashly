import type { INodeProperties } from 'n8n-workflow';
import { idField, returnAllAndLimit } from '../shared/descriptions';

/**
 * Banks, credit cards, debit cards and wallets share one shape in Cashly:
 * list, create, update and delete, each under its own path, with family
 * specific fields. One factory builds all four resources.
 */
interface AccountFamily {
	resource: string;
	path: string;
	listKey: string;
	singular: string;
	plural: string;
	fields: INodeProperties[];
}

const favorite = (singular: string): INodeProperties => ({
	displayName: 'Favorite',
	name: 'isFavorite',
	type: 'boolean',
	default: false,
	description: `Whether this is the default ${singular} (only one can be the favorite)`,
	routing: { send: { type: 'body', property: 'is_favorite' } },
});

const cardFields: INodeProperties[] = [
	{
		displayName: 'Issuer',
		name: 'issuer',
		type: 'string',
		default: '',
		description: 'The bank that issued the card',
		routing: { send: { type: 'body', property: 'issuer' } },
	},
	{
		displayName: 'Last 4 Digits',
		name: 'last4',
		type: 'string',
		default: '',
		description: 'Last four digits of the card number, for display only',
		routing: { send: { type: 'body', property: 'last4' } },
	},
	{
		displayName: 'Network',
		name: 'network',
		type: 'string',
		default: '',
		placeholder: 'Visa',
		description: 'Card network, such as Visa, Mastercard or RuPay',
		routing: { send: { type: 'body', property: 'network' } },
	},
];

const FAMILIES: AccountFamily[] = [
	{
		resource: 'bank',
		path: '/banks',
		listKey: 'banks',
		singular: 'bank account',
		plural: 'bank accounts',
		fields: [
			{
				displayName: 'Account Label',
				name: 'accountLabel',
				type: 'string',
				default: '',
				description: 'A short label such as "Salary" or "Savings"',
				routing: { send: { type: 'body', property: 'account_label' } },
			},
			{
				displayName: 'Balance',
				name: 'balance',
				type: 'number',
				typeOptions: { numberPrecision: 2 },
				default: 0,
				routing: { send: { type: 'body', property: 'balance' } },
			},
			favorite('bank account'),
		],
	},
	{
		resource: 'creditCard',
		path: '/credit-cards',
		listKey: 'credit_cards',
		singular: 'credit card',
		plural: 'credit cards',
		fields: [
			...cardFields,
			{
				displayName: 'Credit Limit',
				name: 'creditLimit',
				type: 'number',
				typeOptions: { numberPrecision: 2 },
				default: 0,
				routing: { send: { type: 'body', property: 'credit_limit' } },
			},
			{
				displayName: 'Due Day',
				name: 'dueDay',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 31 },
				default: 1,
				description: 'Day of the month the bill is due',
				routing: { send: { type: 'body', property: 'due_day' } },
			},
			favorite('credit card'),
			{
				displayName: 'Outstanding',
				name: 'outstanding',
				type: 'number',
				typeOptions: { numberPrecision: 2 },
				default: 0,
				description: 'Amount currently owed on the card',
				routing: { send: { type: 'body', property: 'outstanding' } },
			},
			{
				displayName: 'Statement Day',
				name: 'statementDay',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 31 },
				default: 1,
				description: 'Day of the month the statement is generated',
				routing: { send: { type: 'body', property: 'statement_day' } },
			},
		],
	},
	{
		resource: 'debitCard',
		path: '/debit-cards',
		listKey: 'debit_cards',
		singular: 'debit card',
		plural: 'debit cards',
		fields: [
			...cardFields,
			{
				displayName: 'Linked Bank Name or ID',
				name: 'bankId',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getBanks' },
				default: '',
				description:
					'The bank account this card draws from. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
				routing: { send: { type: 'body', property: 'bank_id' } },
			},
			favorite('debit card'),
		],
	},
	{
		resource: 'wallet',
		path: '/wallets',
		listKey: 'wallets',
		singular: 'wallet',
		plural: 'wallets',
		fields: [
			{
				displayName: 'Balance',
				name: 'balance',
				type: 'number',
				typeOptions: { numberPrecision: 2 },
				default: 0,
				routing: { send: { type: 'body', property: 'balance' } },
			},
			favorite('wallet'),
		],
	},
];

function familyDescription(f: AccountFamily): INodeProperties[] {
	const idName = `${f.resource}Id`;
	const show = (operation: string[]) => ({ show: { resource: [f.resource], operation } });
	const single = [{ type: 'rootProperty' as const, properties: { property: 'account' } }];

	return [
		{
			displayName: 'Operation',
			name: 'operation',
			type: 'options',
			noDataExpression: true,
			displayOptions: { show: { resource: [f.resource] } },
			options: [
				{
					name: 'Create',
					value: 'create',
					action: `Create a ${f.singular}`,
					description: `Add a ${f.singular}`,
					routing: { request: { method: 'POST', url: f.path }, output: { postReceive: single } },
				},
				{
					name: 'Delete',
					value: 'delete',
					action: `Delete a ${f.singular}`,
					description: `Remove a ${f.singular}`,
					routing: { request: { method: 'DELETE', url: `=${f.path}/{{$parameter.${idName}}}` } },
				},
				{
					name: 'Get Many',
					value: 'getAll',
					action: `Get many ${f.plural}`,
					description: `List ${f.plural}, the favorite first`,
					routing: {
						request: { method: 'GET', url: f.path },
						output: { postReceive: [{ type: 'rootProperty', properties: { property: f.listKey } }] },
					},
				},
				{
					name: 'Update',
					value: 'update',
					action: `Update a ${f.singular}`,
					description: `Change a ${f.singular}`,
					routing: {
						request: { method: 'PATCH', url: `=${f.path}/{{$parameter.${idName}}}` },
						output: { postReceive: single },
					},
				},
			],
			default: 'getAll',
		},
		idField(
			`${f.singular.replace(/\b\w/g, (c) => c.toUpperCase())} ID`,
			idName,
			f.resource,
			['delete', 'update'],
			`The ID of the ${f.singular}`,
		),
		{
			displayName: 'Name',
			name: 'name',
			type: 'string',
			required: true,
			default: '',
			description: `Name of the ${f.singular}`,
			displayOptions: show(['create']),
			routing: { send: { type: 'body', property: 'name' } },
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			displayOptions: show(['create']),
			options: f.fields,
		},
		{
			displayName: 'Update Fields',
			name: 'updateFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			description: 'Set at least one field; an empty update is rejected by Cashly',
			displayOptions: show(['update']),
			options: [
				...f.fields,
				{
					displayName: 'Name',
					name: 'name',
					type: 'string',
					default: '',
					routing: { send: { type: 'body', property: 'name' } },
				},
			],
		},
		...returnAllAndLimit(f.resource, 'getAll'),
	];
}

export const accountResources = FAMILIES.map((f) => ({ resource: f.resource, path: f.path }));

export const accountsDescription: INodeProperties[] = FAMILIES.flatMap(familyDescription);
