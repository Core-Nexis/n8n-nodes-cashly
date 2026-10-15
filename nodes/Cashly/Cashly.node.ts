import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { accountsDescription } from './resources/accounts';
import { billDescription } from './resources/bill';
import { debtDescription } from './resources/debt';
import { emiDescription } from './resources/emi';
import { insightDescription } from './resources/insight';
import { profileDescription } from './resources/profile';
import { securityDescription } from './resources/security';
import { subscriptionDescription } from './resources/subscription';
import { transactionDescription } from './resources/transaction';
import { webhookDescription } from './resources/webhook';
import { getBanks, getCategories, getPaymentAccounts } from './shared/loadOptions';
import { CASHLY_BASE_URL, CASHLY_USER_AGENT } from './shared/transport';

export class Cashly implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cashly',
		name: 'cashly',
		icon: { light: 'file:../../icons/cashly.svg', dark: 'file:../../icons/cashly.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Track expenses, income, lend and borrow, accounts, EMIs, subscriptions and bills in Cashly',
		defaults: {
			name: 'Cashly',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'cashlyApi',
				required: true,
				displayOptions: { show: { authentication: ['apiKey'] } },
			},
			{
				name: 'cashlyOAuth2Api',
				required: true,
				displayOptions: { show: { authentication: ['oAuth2'] } },
			},
		],
		requestDefaults: {
			baseURL: CASHLY_BASE_URL,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				'User-Agent': CASHLY_USER_AGENT,
			},
		},
		properties: [
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				options: [
					{ name: 'API Key', value: 'apiKey' },
					{ name: 'OAuth2', value: 'oAuth2' },
				],
				default: 'apiKey',
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Bank Account', value: 'bank' },
					{ name: 'Credit Card', value: 'creditCard' },
					{ name: 'Debit Card', value: 'debitCard' },
					{ name: 'EMI', value: 'emi', description: 'Loan instalments' },
					{ name: 'Insight', value: 'insight', description: 'Summaries, categories and payment methods' },
					{ name: 'Lend and Borrow', value: 'debt', description: 'Money lent to or borrowed from people' },
					{ name: 'Profile', value: 'profile', description: 'Profile, plan, usage and notifications' },
					{ name: 'Security', value: 'security', description: 'Signed-in devices and connected apps' },
					{ name: 'Subscription', value: 'subscription', description: 'Recurring payments' },
					{ name: 'Transaction', value: 'transaction', description: 'Income and expenses' },
					{ name: 'Upcoming Bill', value: 'upcomingBill' },
					{ name: 'Wallet', value: 'wallet' },
					{ name: 'Webhook', value: 'webhook', description: 'Endpoints Cashly notifies when data changes' },
				],
				default: 'transaction',
			},
			...transactionDescription,
			...debtDescription,
			...accountsDescription,
			...emiDescription,
			...subscriptionDescription,
			...billDescription,
			...insightDescription,
			...profileDescription,
			...securityDescription,
			...webhookDescription,
		],
	};

	methods = {
		loadOptions: {
			getBanks,
			getCategories,
			getPaymentAccounts,
		},
	};
}
