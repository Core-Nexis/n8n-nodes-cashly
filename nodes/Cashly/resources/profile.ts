import type { INodeProperties } from 'n8n-workflow';

const R = 'profile';
const show = (operation: string[]) => ({ show: { resource: [R], operation } });

/**
 * The profile is read-only through the node except for the timezone and the
 * email notification switches. Name, currency, billing and the account itself
 * are changed in the Cashly app.
 */

const notificationSwitch = (displayName: string, name: string, description: string): INodeProperties => ({
	displayName,
	name,
	type: 'boolean',
	default: true,
	description,
	routing: { send: { type: 'body', property: name } },
});

export const profileDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [R] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get the profile',
				description: 'Name, email, country, currency, timezone and notification settings',
				routing: {
					request: { method: 'GET', url: '/me' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'user' } }] },
				},
			},
			{
				name: 'Get Billing History',
				value: 'getBillingHistory',
				action: 'Get billing history',
				description: 'Invoices for the Cashly plan',
				routing: {
					request: { method: 'GET', url: '/me/payments' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'payments' } }] },
				},
			},
			{
				name: 'Get Billing Status',
				value: 'getBillingStatus',
				action: 'Get plan status',
				description: 'Current plan, renewal date and next charge',
				routing: { request: { method: 'GET', url: '/me/subscription' } },
			},
			{
				name: 'Get Usage',
				value: 'getUsage',
				action: 'Get API and plan usage',
				description: 'Plan, transactions used this period and the API rate limit',
				routing: { request: { method: 'GET', url: '/usage' } },
			},
			{
				name: 'Update Notifications',
				value: 'updateNotifications',
				action: 'Update email notifications',
				description: 'Turn Cashly email notifications on or off',
				routing: { request: { method: 'PATCH', url: '/me/notifications' } },
			},
			{
				name: 'Update Timezone',
				value: 'updateTimezone',
				action: 'Update the timezone',
				description: 'Change the timezone that decides what "today" means for new entries',
				routing: {
					request: { method: 'PATCH', url: '/me' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'user' } }] },
				},
			},
		],
		default: 'get',
	},
	{
		displayName: 'Timezone',
		name: 'timezone',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Asia/Kolkata',
		description: 'An IANA timezone name, such as Asia/Kolkata or Europe/London',
		displayOptions: show(['updateTimezone']),
		routing: { send: { type: 'body', property: 'timezone' } },
	},
	{
		displayName: 'Notifications',
		name: 'notifications',
		type: 'collection',
		placeholder: 'Add Notification',
		default: {},
		displayOptions: show(['updateNotifications']),
		options: [
			notificationSwitch('Credit Card Reminder', 'credit_card_reminder', 'Whether to send credit card bill reminder emails'),
			notificationSwitch('Daily Reminder', 'daily_reminder', 'Whether to send the daily reminder to log expenses'),
			notificationSwitch('Monthly Snapshot', 'monthly_snapshot', 'Whether to send the monthly summary email'),
			notificationSwitch('Transaction Alert', 'transaction_alert', 'Whether to send transaction alert emails'),
			notificationSwitch('Transaction Email', 'transaction_email', 'Whether to email a receipt for each new transaction'),
		],
	},
];
