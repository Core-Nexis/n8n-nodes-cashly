import type { INodeProperties } from 'n8n-workflow';
import {
	idField,
	paymentAccountField,
	paymentMethodOptions,
	paymentSourceOptions,
	returnAllAndLimit,
	toCalendarDate,
} from '../shared/descriptions';

const R = 'subscription';
const show = (operation: string[]) => ({ show: { resource: [R], operation } });
const single = [{ type: 'rootProperty' as const, properties: { property: 'subscription' } }];

const cycleOptions = [
	{ name: 'Custom (Every N Days)', value: 'custom' },
	{ name: 'Half Yearly', value: 'half_yearly' },
	{ name: 'Monthly', value: 'monthly' },
	{ name: 'Quarterly', value: 'quarterly' },
	{ name: 'Weekly', value: 'weekly' },
	{ name: 'Yearly', value: 'yearly' },
];

/** Optional fields shared by create and update. */
function subscriptionOptionalFields(): INodeProperties[] {
	return [
		{
			displayName: 'Auto Pay',
			name: 'autoPay',
			type: 'boolean',
			default: false,
			description: 'Whether the payment is taken automatically, for example by a card mandate',
			routing: { send: { type: 'body', property: 'auto_pay' } },
		},
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
			displayName: 'Custom Days',
			name: 'customDays',
			type: 'number',
			typeOptions: { minValue: 1 },
			default: 30,
			description: 'Days between payments when the cycle is Custom',
			routing: { send: { type: 'body', property: 'custom_days' } },
		},
		{
			displayName: 'Next Billing Date',
			name: 'nextBillingDate',
			type: 'dateTime',
			default: '',
			routing: { send: { type: 'body', property: 'next_billing_date', value: toCalendarDate } },
		},
		paymentAccountField,
		{
			displayName: 'Payment Method',
			name: 'paymentMethod',
			type: 'options',
			options: paymentMethodOptions,
			default: 'credit_card',
			routing: { send: { type: 'body', property: 'payment_method' } },
		},
	];
}

export const subscriptionDescription: INodeProperties[] = [
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
				action: 'Create a subscription',
				description: 'Track a recurring payment such as a streaming plan or rent',
				routing: { request: { method: 'POST', url: '/subscriptions' }, output: { postReceive: single } },
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a subscription',
				description: 'Delete a subscription and its linked transactions',
				routing: { request: { method: 'DELETE', url: '=/subscriptions/{{$parameter.subscriptionId}}' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a subscription',
				routing: {
					request: { method: 'GET', url: '=/subscriptions/{{$parameter.subscriptionId}}' },
					output: { postReceive: single },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many subscriptions',
				routing: {
					request: { method: 'GET', url: '/subscriptions' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'subscriptions' } }] },
				},
			},
			{
				name: 'Get Payments',
				value: 'getPayments',
				action: 'Get subscription payments',
				description: 'List the payments already made',
				routing: {
					request: { method: 'GET', url: '=/subscriptions/{{$parameter.subscriptionId}}/payments' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'payments' } }] },
				},
			},
			{
				name: 'Record Payment',
				value: 'recordPayment',
				action: 'Record a subscription payment',
				description: 'Record this cycle as paid and move the next billing date forward',
				routing: { request: { method: 'POST', url: '=/subscriptions/{{$parameter.subscriptionId}}/pay' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a subscription',
				description: 'Change, pause or cancel a subscription',
				routing: {
					request: { method: 'PATCH', url: '=/subscriptions/{{$parameter.subscriptionId}}' },
					output: { postReceive: single },
				},
			},
		],
		default: 'getAll',
	},

	idField(
		'Subscription ID',
		'subscriptionId',
		R,
		['delete', 'get', 'getPayments', 'recordPayment', 'update'],
		'The ID of the subscription',
	),

	// ---- create ----
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Netflix',
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
		displayOptions: show(['create']),
		routing: { send: { type: 'body', property: 'amount' } },
	},
	{
		displayName: 'Billing Cycle',
		name: 'cycle',
		type: 'options',
		required: true,
		options: cycleOptions,
		default: 'monthly',
		displayOptions: show(['create']),
		routing: { send: { type: 'body', property: 'cycle' } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: show(['create']),
		options: subscriptionOptionalFields(),
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
			...subscriptionOptionalFields(),
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'number',
				typeOptions: { minValue: 0.01, numberPrecision: 2 },
				default: 0,
				routing: { send: { type: 'body', property: 'amount' } },
			},
			{
				displayName: 'Billing Cycle',
				name: 'cycle',
				type: 'options',
				options: cycleOptions,
				default: 'monthly',
				routing: { send: { type: 'body', property: 'cycle' } },
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				routing: { send: { type: 'body', property: 'name' } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Active', value: 'active' },
					{ name: 'Cancelled', value: 'cancelled' },
					{ name: 'Paused', value: 'paused' },
				],
				default: 'active',
				routing: { send: { type: 'body', property: 'status' } },
			},
		],
	},

	// ---- recordPayment ----
	{
		displayName: 'Options',
		name: 'paymentOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['recordPayment']),
		options: paymentSourceOptions(),
	},

	...returnAllAndLimit(R, 'getAll'),
];
