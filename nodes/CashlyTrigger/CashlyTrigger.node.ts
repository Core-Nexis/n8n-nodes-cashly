import { createHmac, timingSafeEqual } from 'crypto';
import {
	NodeApiError,
	NodeConnectionTypes,
	type IDataObject,
	type IHookFunctions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
	type JsonObject,
} from 'n8n-workflow';
import { cashlyApiRequest } from '../Cashly/shared/transport';
import { webhookEventOptions as eventOptions } from '../Cashly/resources/webhook';

/** Signed requests older than this are refused, so a captured one cannot be replayed later. */
const SIGNATURE_TOLERANCE_SECONDS = 300;

interface HookState {
	webhookId?: string;
	webhookSecret?: string;
}

/** Checks the Cashly-Signature header: t=<unix seconds>,v1=<HMAC-SHA256 of "t.body">. */
function signatureIsValid(header: string, rawBody: string, secret: string): boolean {
	const parts: Record<string, string> = {};
	for (const piece of header.split(',')) {
		const [key, value] = piece.split('=');
		if (key && value) parts[key.trim()] = value.trim();
	}
	const timestamp = Number(parts.t);
	if (!Number.isFinite(timestamp) || !parts.v1) return false;
	if (Math.abs(Date.now() / 1000 - timestamp) > SIGNATURE_TOLERANCE_SECONDS) return false;
	const expected = createHmac('sha256', secret).update(`${parts.t}.${rawBody}`).digest('hex');
	if (expected.length !== parts.v1.length) return false;
	return timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
}

/**
 * Starts the workflow the moment something changes in Cashly. Activating the
 * workflow registers a webhook on the Cashly account for the chosen events,
 * deactivating it removes the webhook, and every request is checked against
 * the webhook's signing secret before the workflow runs.
 */
export class CashlyTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cashly Trigger',
		name: 'cashlyTrigger',
		icon: { light: 'file:../../icons/cashly.svg', dark: 'file:../../icons/cashly.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow instantly when data changes in Cashly',
		defaults: {
			name: 'Cashly Trigger',
		},
		inputs: [],
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
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName:
					'Cashly must be able to reach this n8n instance over public HTTPS. For an n8n that is not reachable from the internet, use a Schedule Trigger with a Cashly "Get Many" operation instead.',
				name: 'notice',
				type: 'notice',
				default: '',
			},
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
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				options: eventOptions,
				default: ['transaction.created'],
				description: 'The changes that start the workflow. "*" means every event.',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const state = this.getWorkflowStaticData('node') as HookState;
				if (!state.webhookId || !state.webhookSecret) return false;
				const authentication = this.getNodeParameter('authentication', 'apiKey') as string;
				try {
					const response = await cashlyApiRequest.call(
						this,
						authentication,
						'GET',
						`/webhooks/${state.webhookId}`,
					);
					const hook = response.webhook as IDataObject | undefined;
					return hook?.url === this.getNodeWebhookUrl('default') && hook?.active === true;
				} catch (error) {
					if ((error as { httpCode?: string }).httpCode === '404') {
						delete state.webhookId;
						delete state.webhookSecret;
						return false;
					}
					throw new NodeApiError(this.getNode(), error as JsonObject);
				}
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const state = this.getWorkflowStaticData('node') as HookState;
				const authentication = this.getNodeParameter('authentication', 'apiKey') as string;
				const events = this.getNodeParameter('events', []) as string[];
				const workflow = this.getWorkflow();

				// A webhook left behind by an earlier activation is replaced, not duplicated.
				if (state.webhookId) {
					try {
						await cashlyApiRequest.call(this, authentication, 'DELETE', `/webhooks/${state.webhookId}`);
					} catch (error) {
						// A 404 means it is already gone; anything else is a real failure.
						if ((error as { httpCode?: string }).httpCode !== '404') {
							throw new NodeApiError(this.getNode(), error as JsonObject);
						}
					}
				}

				let response: IDataObject;
				try {
					response = await cashlyApiRequest.call(this, authentication, 'POST', '/webhooks', {}, {
						url: this.getNodeWebhookUrl('default'),
						events: events.includes('*') ? ['*'] : events,
						description: `n8n: ${workflow.name ?? workflow.id ?? 'workflow'}`.slice(0, 200),
					});
				} catch (error) {
					throw new NodeApiError(this.getNode(), error as JsonObject, {
						message: 'Cashly could not register the webhook',
					});
				}
				const hook = response.webhook as IDataObject | undefined;
				if (!hook?.id || !hook.secret) return false;
				state.webhookId = String(hook.id);
				state.webhookSecret = String(hook.secret);
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const state = this.getWorkflowStaticData('node') as HookState;
				if (state.webhookId) {
					const authentication = this.getNodeParameter('authentication', 'apiKey') as string;
					try {
						await cashlyApiRequest.call(this, authentication, 'DELETE', `/webhooks/${state.webhookId}`);
					} catch (error) {
						if ((error as { httpCode?: string }).httpCode !== '404') return false;
					}
				}
				delete state.webhookId;
				delete state.webhookSecret;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const state = this.getWorkflowStaticData('node') as HookState;
		const req = this.getRequestObject();
		const res = this.getResponseObject();
		const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody?.toString('utf8') ?? JSON.stringify(req.body);
		const header = String(this.getHeaderData()['cashly-signature'] ?? '');

		if (!state.webhookSecret || !signatureIsValid(header, rawBody, state.webhookSecret)) {
			res.status(401).json({ error: 'invalid_signature' });
			return { noWebhookResponse: true };
		}

		const body = this.getBodyData();
		// "Send test" from Cashly checks the endpoint only; it never runs the workflow.
		if (body.event === 'ping') {
			return { webhookResponse: { ok: true } };
		}
		return { workflowData: [this.helpers.returnJsonArray([body])] };
	}
}
