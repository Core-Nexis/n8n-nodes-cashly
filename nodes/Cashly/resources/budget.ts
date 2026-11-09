import type { INodeProperties } from 'n8n-workflow';

const R = 'budget';
const show = (operation: string[]) => ({ show: { resource: [R], operation } });

const monthPattern = '^\\d{4}-(0[1-9]|1[0-2])$';

export const budgetDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [R] } },
		options: [
			{
				name: 'Compare Months',
				value: 'compare',
				action: 'Compare two months',
				description: 'Income, expense, savings and spending per category for two months side by side',
				routing: { request: { method: 'GET', url: '/compare' } },
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete the budget',
				description: 'Delete the whole budget plan. Transactions are not touched.',
				routing: { request: { method: 'DELETE', url: '/budget' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get the budget',
				description:
					"The budget plan with this month's spending against it, days left, three-month averages and fixed commitments",
				routing: { request: { method: 'GET', url: '/budget' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Create or update the budget',
				description: 'Create or change the monthly budget plan. Only the fields you set change.',
				routing: { request: { method: 'PATCH', url: '/budget' } },
			},
		],
		default: 'get',
	},

	// ------------------------------------------------------------------ update
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: show(['update']),
		options: [
			{
				displayName: 'Category Limits',
				name: 'categories',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				placeholder: 'Add Category Limit',
				default: {},
				description:
					'Monthly limit per expense category. A limit of 0 removes that category. The number of categories depends on the plan (Always Free 5, Pro 20, Pro Plus 50).',
				options: [
					{
						displayName: 'Limit',
						name: 'limit',
						values: [
							{
								displayName: 'Category Name or ID',
								name: 'category',
								type: 'options',
								typeOptions: { loadOptionsMethod: 'getCategories' },
								default: '',
								description:
									'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
							},
							{
								displayName: 'Amount',
								name: 'amount',
								type: 'number',
								typeOptions: { minValue: 0, numberPrecision: 2 },
								default: 0,
								description: 'Monthly limit in the account currency',
							},
						],
					},
				],
				routing: {
					send: {
						type: 'body',
						property: 'categories',
						value:
							'={{ Object.fromEntries(($value.limit || []).filter(l => l.category).map(l => [l.category, Number(l.amount) || 0])) }}',
					},
				},
			},
			{
				displayName: 'Replace All Categories',
				name: 'replaceCategories',
				type: 'boolean',
				default: false,
				description:
					'Whether the category limits set here become the whole list. Off adds or updates only the categories set here.',
				routing: { send: { type: 'body', property: 'replace_categories' } },
			},
			{
				displayName: 'Total Limit',
				name: 'total',
				type: 'number',
				typeOptions: { minValue: 0, numberPrecision: 2 },
				default: 0,
				description:
					'Monthly spending limit in the account currency. 0 uses the sum of the category limits.',
				routing: { send: { type: 'body', property: 'total' } },
			},
			{
				displayName: 'Warning Level (%)',
				name: 'alertPct',
				type: 'number',
				typeOptions: { minValue: 50, maxValue: 100 },
				default: 80,
				description: 'Warn when this percentage of a limit is used',
				routing: { send: { type: 'body', property: 'alert_pct' } },
			},
		],
	},

	// ----------------------------------------------------------------- compare
	{
		displayName: 'Options',
		name: 'compareOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['compare']),
		options: [
			{
				displayName: 'First Month',
				name: 'a',
				type: 'string',
				default: '',
				placeholder: '2026-10',
				description: 'Month in YYYY-MM format. Defaults to last month.',
				routing: {
					send: {
						type: 'query',
						property: 'a',
						value: `={{ /${monthPattern}/.test(String($value).trim()) ? String($value).trim() : undefined }}`,
					},
				},
			},
			{
				displayName: 'Second Month',
				name: 'b',
				type: 'string',
				default: '',
				placeholder: '2026-11',
				description: 'Month in YYYY-MM format. Defaults to this month.',
				routing: {
					send: {
						type: 'query',
						property: 'b',
						value: `={{ /${monthPattern}/.test(String($value).trim()) ? String($value).trim() : undefined }}`,
					},
				},
			},
			{
				displayName: 'Same Days Only',
				name: 'sameDays',
				type: 'boolean',
				default: false,
				description:
					'Whether to compare only the days passed so far when one of the months is the current one',
				routing: {
					send: { type: 'query', property: 'same_days', value: '={{ $value ? "true" : undefined }}' },
				},
			},
		],
	},
];
