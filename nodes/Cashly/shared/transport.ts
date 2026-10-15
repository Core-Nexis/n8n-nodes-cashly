import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IPollFunctions,
} from 'n8n-workflow';

export const CASHLY_BASE_URL = 'https://cashly.corenexis.com/api/v1';

/**
 * Cashly sits behind a firewall that rejects requests with a missing or
 * generic client User-Agent, so every request names this package.
 */
export const CASHLY_USER_AGENT = 'n8n-nodes-cashly (+https://github.com/Core-Nexis/n8n-nodes-cashly)';

/** The credential type for the node's Authentication setting. */
export function credentialTypeFor(authentication: string): string {
	return authentication === 'oAuth2' ? 'cashlyOAuth2Api' : 'cashlyApi';
}

/** One authenticated call to the Cashly API. */
export async function cashlyApiRequest(
	this: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions | IPollFunctions,
	authentication: string,
	method: IHttpRequestMethods,
	path: string,
	qs: IDataObject = {},
	body: IDataObject | undefined = undefined,
): Promise<IDataObject> {
	const options: IHttpRequestOptions = {
		method,
		url: `${CASHLY_BASE_URL}${path}`,
		qs,
		body,
		json: true,
		headers: {
			Accept: 'application/json',
			'User-Agent': CASHLY_USER_AGENT,
		},
	};

	return (await this.helpers.httpRequestWithAuthentication.call(
		this,
		credentialTypeFor(authentication),
		options,
	)) as IDataObject;
}
