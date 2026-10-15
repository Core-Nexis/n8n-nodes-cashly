import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class CashlyApi implements ICredentialType {
	name = 'cashlyApi';

	displayName = 'Cashly API';

	icon: Icon = { light: 'file:../icons/cashly.svg', dark: 'file:../icons/cashly.dark.svg' };

	documentationUrl = 'https://cashly.corenexis.com/developer/api';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			placeholder: 'cn_cashly_...',
			description:
				'Create a key in Cashly under Settings > Developer > API keys. API access needs a Pro or Pro Plus plan. Choose "Read and write" to use the create, update and delete operations.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-api-key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://cashly.corenexis.com/api/v1',
			url: '/health',
			method: 'GET',
			headers: {
				'User-Agent': 'n8n-nodes-cashly',
			},
		},
	};
}
