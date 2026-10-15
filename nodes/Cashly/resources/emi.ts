import type { INodeProperties } from 'n8n-workflow';
import {
	idField,
	paymentAccountField,
	paymentMethodOptions,
	paymentSourceOptions,
	returnAllAndLimit,
	toCalendarDate,
} from '../shared/descriptions';

const R = 'emi';
const show = (operation: string[]) => ({ show: { resource: [R], operation } });
const single = [{ type: 'rootProperty' as const, properties: { property: 'emi' } }];

const emiTypeOptions = [
	{ name: 'Fixed Interest', value: 'fixed' },
	{ name: 'No Cost EMI', value: 'no_cost' },
	{ name: 'Reducing Balance', value: 'reducing' },
];

/** Optional EMI fields used by create and update. */
function emiOptionalFields(includePaymentSource: boolean): INodeProperties[] {
	const fields: INodeProperties[] = [
		{
			displayName: 'Already Paid Months',
			name: 'paidMonths',
			type: 'number',
			typeOptions: { minValue: 0 },
			default: 0,
			description: 'Instalments already paid before adding the EMI to Cashly',
			routing: { send: { type: 'body', property: 'paid_months' } },
		},
		{
			displayName: 'Interest Rate (% per Year)',
			name: 'interestRate',
			type: 'number',
			typeOptions: { minValue: 0, numberPrecision: 3 },
			default: 0,
			routing: { send: { type: 'body', property: 'interest_rate' } },
		},
		{
			displayName: 'Lender',
			name: 'lender',
			type: 'string',
			default: '',
			description: 'Bank or company that gave the loan',
			routing: { send: { type: 'body', property: 'lender' } },
		},
		{
			displayName: 'Start Date',
			name: 'startDate',
			type: 'dateTime',
			default: '',
			description: 'Date of the first instalment',
			routing: { send: { type: 'body', property: 'start_date', value: toCalendarDate } },
		},
	];
	if (includePaymentSource) {
		fields.push(paymentAccountField, {
			displayName: 'Payment Method',
			name: 'paymentMethod',
			type: 'options',
			options: paymentMethodOptions,
			default: 'bank',
			description: 'How the instalments are usually paid',
			routing: { send: { type: 'body', property: 'payment_method' } },
		});
	}
	return fields;
}

export const emiDescription: INodeProperties[] = [
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
				action: 'Create an EMI',
				description: 'Add a loan EMI; Cashly works out the instalment and schedule',
				routing: { request: { method: 'POST', url: '/emis' }, output: { postReceive: single } },
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete an EMI',
				routing: { request: { method: 'DELETE', url: '=/emis/{{$parameter.emiId}}' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get an EMI',
				routing: {
					request: { method: 'GET', url: '=/emis/{{$parameter.emiId}}' },
					output: { postReceive: single },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many EMI records',
				routing: {
					request: { method: 'GET', url: '/emis' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'emis' } }] },
				},
			},
			{
				name: 'Get Payments',
				value: 'getPayments',
				action: 'Get EMI payments',
				description: 'List the instalments already paid',
				routing: {
					request: { method: 'GET', url: '=/emis/{{$parameter.emiId}}/payments' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'payments' } }] },
				},
			},
			{
				name: 'Record Payment',
				value: 'recordPayment',
				action: 'Record an EMI payment',
				description: 'Pay the next instalment and record it as a transaction',
				routing: { request: { method: 'POST', url: '=/emis/{{$parameter.emiId}}/pay' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update an EMI',
				description: 'Change an EMI; the schedule is recalculated',
				routing: {
					request: { method: 'PATCH', url: '=/emis/{{$parameter.emiId}}' },
					output: { postReceive: single },
				},
			},
		],
		default: 'getAll',
	},

	idField('EMI ID', 'emiId', R, ['delete', 'get', 'getPayments', 'recordPayment', 'update'], 'The ID of the EMI'),

	// ---- create ----
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Car loan',
		displayOptions: show(['create']),
		routing: { send: { type: 'body', property: 'name' } },
	},
	{
		displayName: 'EMI Type',
		name: 'emiType',
		type: 'options',
		required: true,
		options: emiTypeOptions,
		default: 'reducing',
		displayOptions: show(['create']),
		routing: { send: { type: 'body', property: 'emi_type' } },
	},
	{
		displayName: 'Principal',
		name: 'principal',
		type: 'number',
		required: true,
		typeOptions: { minValue: 0.01, numberPrecision: 2 },
		default: 0,
		description: 'Loan amount',
		displayOptions: show(['create']),
		routing: { send: { type: 'body', property: 'principal' } },
	},
	{
		displayName: 'Tenure (Months)',
		name: 'tenureMonths',
		type: 'number',
		required: true,
		typeOptions: { minValue: 1 },
		default: 12,
		displayOptions: show(['create']),
		routing: { send: { type: 'body', property: 'tenure_months' } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: show(['create']),
		options: emiOptionalFields(true),
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
			...emiOptionalFields(true),
			{
				displayName: 'EMI Type',
				name: 'emiType',
				type: 'options',
				options: emiTypeOptions,
				default: 'reducing',
				routing: { send: { type: 'body', property: 'emi_type' } },
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				routing: { send: { type: 'body', property: 'name' } },
			},
			{
				displayName: 'Principal',
				name: 'principal',
				type: 'number',
				typeOptions: { minValue: 0.01, numberPrecision: 2 },
				default: 0,
				routing: { send: { type: 'body', property: 'principal' } },
			},
			{
				displayName: 'Tenure (Months)',
				name: 'tenureMonths',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 12,
				routing: { send: { type: 'body', property: 'tenure_months' } },
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
