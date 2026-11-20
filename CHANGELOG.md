# Changelog

All notable changes to `@corenexis/n8n-nodes-cashly` are listed here. Versions follow
[semantic versioning](https://semver.org).

## 0.3.0 - 2026-11-20

- New **Transfer** resource: Create records money moved between your own accounts (bank, wallet, prepaid card,
  credit card or cash, including a card bill paid from a bank and card to card balance transfers), with an optional
  fee and note. Transfers are neither income nor expense.
- **Bank Account**: Account Last 4 Digits on create and update.
- **Debit Card**: Card Type (Debit or Prepaid) and Balance for prepaid cards on create and update.
- **Transaction**: Get Many and Get Totals filter by category, payment method, account and source (Auto tracker,
  transfers, other). Outputs document `meta.auto` = `"sms"` for Auto tracker entries and `source_type` `transfer`
  for transfer legs.
- **Insight**: Get Overview returns the currency, timezone, plan and limits, every account with its kind and ID, the
  categories and the payment methods in one call.
- README: transfers, Auto tracker entries and the webhook item shape.

## 0.2.0 - 2026-11-09

- New **Budget** resource: Get the monthly budget with this month's spending against it, days left, three-month
  averages and fixed commitments; Update the total, category limits and warning level; Delete the plan; Compare
  Months side by side, optionally only the days passed so far.
- Budget categories follow the plan limits (Always Free 5, Pro 20, Pro Plus 50); over the limit the API answers
  `403 budget_category_limit`.

## 0.1.2 - 2026-10-15

- First release published from GitHub Actions with npm provenance, as n8n verification requires. No change to
  the nodes.

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
