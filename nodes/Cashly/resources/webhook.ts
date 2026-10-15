import type { INodeProperties, INodePropertyOptions } from 'n8n-workflow';
import { idField } from '../shared/descriptions';

const R = 'webhook';
const show = (operation: string[]) => ({ show: { resource: [R], operation } });
const single = [{ type: 'rootProperty' as const, properties: { property: 'webhook' } }];

/** Records Cashly sends events for, with the label shown in the event picker. */
const RESOURCES: [string, string][] = [
	['bank_account', 'Bank Account'],
	['bill', 'Upcoming Bill'],
	['credit_card', 'Credit Card'],
	['debit_card', 'Debit Card'],
	['debt', 'Lend or Borrow'],
	['emi', 'EMI'],
	['subscription', 'Subscription'],
	['transaction', 'Transaction'],
	['wallet', 'Wallet'],
];

export const webhookEventOptions: INodePropertyOptions[] = [
	{ name: '*', value: '*', description: 'Every event' },
	...RESOURCES.flatMap(([value, label]) =>
		(['created', 'updated', 'deleted'] as const).map((action) => ({
			name: `${label} ${action.charAt(0).toUpperCase()}${action.slice(1)}`,
			value: `${value}.${action}`,
		})),
	),
];

/**
 * Webhooks registered on the Cashly account. To start a workflow from Cashly
 * events, the Cashly Trigger node manages its own webhook; these operations
 * are for managing endpoints elsewhere. The signing secret is returned only by
 * Create and Rotate Secret.
 */
export const webhookDescription: INodeProperties[] = [
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
				action: 'Create a webhook',
				description: 'Register an HTTPS endpoint. The signing secret is returned only now.',
				routing: { request: { method: 'POST', url: '/webhooks' }, output: { postReceive: single } },
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a webhook',
				routing: { request: { method: 'DELETE', url: '=/webhooks/{{$parameter.webhookId}}' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a webhook',
				routing: {
					request: { method: 'GET', url: '=/webhooks/{{$parameter.webhookId}}' },
					output: { postReceive: single },
				},
			},
			{
				name: 'Get Deliveries',
				value: 'getDeliveries',
				action: 'Get webhook deliveries',
				description: 'Recent deliveries to one webhook, newest first (30 days kept)',
				routing: {
					request: { method: 'GET', url: '=/webhooks/{{$parameter.webhookId}}/deliveries' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'deliveries' } }] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many webhooks',
				routing: {
					request: { method: 'GET', url: '/webhooks' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'webhooks' } }] },
				},
			},
			{
				name: 'Rotate Secret',
				value: 'rotateSecret',
				action: 'Rotate a webhook secret',
				description: 'Issue a new signing secret; the old one stops working at once',
				routing: {
					request: { method: 'POST', url: '=/webhooks/{{$parameter.webhookId}}/rotate-secret' },
					output: { postReceive: single },
				},
			},
			{
				name: 'Send Test',
				value: 'sendTest',
				action: 'Send a test event',
				description: 'Queue a signed ping event to the endpoint',
				routing: { request: { method: 'POST', url: '=/webhooks/{{$parameter.webhookId}}/test' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a webhook',
				description: 'Change the URL, events or description, or pause it',
				routing: {
					request: { method: 'PATCH', url: '=/webhooks/{{$parameter.webhookId}}' },
					output: { postReceive: single },
				},
			},
		],
		default: 'getAll',
	},

	idField(
		'Webhook ID',
		'webhookId',
		R,
		['delete', 'get', 'getDeliveries', 'rotateSecret', 'sendTest', 'update'],
		'The ID of the webhook',
	),

	// ---- create ----
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://example.com/cashly-webhook',
		description: 'A public HTTPS address that receives the events',
		displayOptions: show(['create']),
		routing: { send: { type: 'body', property: 'url' } },
	},
	{
		displayName: 'Events',
		name: 'events',
		type: 'multiOptions',
		required: true,
		options: webhookEventOptions,
		default: ['transaction.created'],
		description: 'The changes to send. "*" means every event.',
		displayOptions: show(['create']),
		routing: { send: { type: 'body', property: 'events' } },
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
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				routing: { send: { type: 'body', property: 'description' } },
			},
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
				displayName: 'Active',
				name: 'active',
				type: 'boolean',
				default: true,
				description: 'Whether deliveries are sent. Turning it on again clears an automatic shutdown.',
				routing: { send: { type: 'body', property: 'active' } },
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				routing: { send: { type: 'body', property: 'description' } },
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				options: webhookEventOptions,
				default: [],
				description: 'Replaces the current list',
				routing: { send: { type: 'body', property: 'events' } },
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				routing: { send: { type: 'body', property: 'url' } },
			},
		],
	},

	// ---- getDeliveries ----
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 100 },
		default: 50,
		description: 'Max number of results to return',
		displayOptions: show(['getDeliveries']),
		routing: { send: { type: 'query', property: 'limit' } },
	},
];
