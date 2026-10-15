import type { INodeProperties } from 'n8n-workflow';
import { rangeOptions } from '../shared/descriptions';

const R = 'insight';

export const insightDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [R] } },
		options: [
			{
				name: 'Get Categories',
				value: 'getCategories',
				action: 'Get categories',
				description: 'List the income and expense categories',
				routing: { request: { method: 'GET', url: '/categories' } },
			},
			{
				name: 'Get Payment Methods',
				value: 'getPaymentMethods',
				action: 'Get payment methods',
				description: 'List the payment methods Cashly accepts',
				routing: {
					request: { method: 'GET', url: '/payment-methods' },
					output: {
						postReceive: [{ type: 'rootProperty', properties: { property: 'payment_methods' } }],
					},
				},
			},
			{
				name: 'Get Summary',
				value: 'getSummary',
				action: 'Get a financial summary',
				description:
					'Balances, income, expense, savings, top categories and a daily series for a period',
				routing: { request: { method: 'GET', url: '/stats' } },
			},
		],
		default: 'getSummary',
	},
	{
		displayName: 'Period',
		name: 'range',
		type: 'options',
		options: rangeOptions,
		default: 'month',
		displayOptions: { show: { resource: [R], operation: ['getSummary'] } },
		routing: { send: { type: 'query', property: 'range' } },
	},
];
