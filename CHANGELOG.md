# Changelog

All notable changes to `@corenexis/n8n-nodes-cashly` are listed here. Versions follow
[semantic versioning](https://semver.org).

## 0.1.1 - 2026-10-15

- One Cashly entry in the n8n nodes panel: the Cashly Polling Trigger is removed. Use the instant Cashly Trigger,
  or a Schedule Trigger with a Cashly "Get Many" operation for an n8n that Cashly cannot reach.
- Package description and README links updated.

## 0.1.0 - 2026-10-15

First release.

- **Cashly** node: transactions, lend and borrow, bank accounts, credit and debit cards, wallets, EMIs,
  subscriptions, upcoming bills, insights, profile (timezone and notifications), security (read only) and
  webhooks. Payment method and account on every operation that moves money; the favourite account is used when
  none is chosen. Usable as a tool by n8n AI agents.
- **Cashly Trigger**: starts a workflow instantly from Cashly webhooks; registers and removes its own webhook and
  checks every signature.
- **Cashly Polling Trigger**: new transactions, new lend or borrow records and upcoming bills due, for n8n
  instances Cashly cannot reach.
- Credentials: Cashly API key, or OAuth2 with PKCE.
