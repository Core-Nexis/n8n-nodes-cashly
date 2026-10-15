import type { INodeProperties } from 'n8n-workflow';

const R = 'security';

/** Signed-in devices and connected OAuth apps, read-only (managed in the Cashly app). */
export const securityDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [R] } },
		options: [
			{
				name: 'Get Connected Apps',
				value: 'getConnectedApps',
				action: 'Get connected apps',
				description: 'List apps that have access through OAuth',
				routing: {
					request: { method: 'GET', url: '/me/connected-apps' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'apps' } }] },
				},
			},
			{
				name: 'Get Devices',
				value: 'getDevices',
				action: 'Get signed in devices',
				description: 'List devices signed in to the Cashly account',
				routing: {
					request: { method: 'GET', url: '/me/sessions' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'sessions' } }] },
				},
			},
		],
		default: 'getDevices',
	},
];
