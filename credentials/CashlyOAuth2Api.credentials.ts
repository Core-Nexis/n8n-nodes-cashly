import type { Icon, ICredentialType, INodeProperties } from 'n8n-workflow';

/**
 * Sign in with a Cashly OAuth app (Authorization Code with PKCE).
 *
 * Create the app in Cashly under Settings > Developer > OAuth apps and add the
 * OAuth Redirect URL that n8n shows on this credential as a redirect URI.
 * Access tokens last one hour and are refreshed automatically; Cashly rotates
 * the refresh token on every refresh.
 */
export class CashlyOAuth2Api implements ICredentialType {
	name = 'cashlyOAuth2Api';

	extends = ['oAuth2Api'];

	displayName = 'Cashly OAuth2 API';

	icon: Icon = { light: 'file:../icons/cashly.svg', dark: 'file:../icons/cashly.dark.svg' };

	documentationUrl = 'https://cashly.corenexis.com/developer/api';

	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'pkce',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: 'https://cashly.corenexis.com/oauth/authorize',
			required: true,
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: 'https://cashly.corenexis.com/api/oauth/token',
			required: true,
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: 'read write',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
	];
}
