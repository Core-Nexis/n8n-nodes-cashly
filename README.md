# n8n-nodes-cashly

An [n8n](https://n8n.io) community node for [Cashly](https://cashly.corenexis.com), the personal expense, EMI and
debt tracker by Corenexis. Record expenses and income, manage bank accounts, cards, wallets, EMIs, subscriptions,
debts and upcoming bills, and start workflows the moment something changes in Cashly.

[Installation](#installation) | [Credentials](#credentials) | [Nodes](#nodes) | [Cashly Trigger](#cashly-trigger) |
[Cashly Polling Trigger](#cashly-polling-trigger) | [Examples](#examples) | [Compatibility](#compatibility) |
[Resources](#resources)

## Installation

In n8n, open **Settings > Community nodes > Install** and enter:

```
@corenexis/n8n-nodes-cashly
```

See the n8n guide to [installing community nodes](https://docs.n8n.io/integrations/community-nodes/installation/).

## Credentials

Cashly's API is part of **Cashly Pro and Pro Plus**. On the Always Free plan every call is refused with
`402 upgrade_required`.

The node supports two ways to sign in. Choose one with the **Authentication** field on each node.

### API key (simplest)

1. In Cashly open **Settings > Developer > API keys** and create a key. Choose **Read and write** unless the
   workflow only reads.
2. In n8n create a **Cashly API** credential and paste the key.

### OAuth2

1. In Cashly open **Settings > Developer > OAuth apps** and create an app. Use the **OAuth Redirect URL** shown
   by the n8n credential as the redirect URL.
2. In n8n create a **Cashly OAuth2 API** credential, paste the client ID and secret, and connect. Cashly asks
   you to allow access; tick **Read only** if the workflow never changes anything.

## Nodes

### Cashly

| Resource | Operations |
|---|---|
| Transaction | Create, Delete, Get, Get Many, Get Totals, Update (amount, type, category, date, payment method and account) |
| Lend and Borrow | Create (with payment method and account), Add Amount, Record Payment, Settle, Unsettle, Update (including direction), Delete, Get, Get Many |
| Bank Account, Credit Card, Debit Card, Wallet | Create, Delete, Get Many, Update |
| EMI | Create, Delete, Get, Get Many, Get Payments, Record Payment, Update (including payment method and account) |
| Subscription | Create, Delete, Get, Get Many, Get Payments, Record Payment, Update |
| Upcoming Bill | Get Many, Record Payment, Skip |
| Insight | Get Summary, Get Categories, Get Payment Methods |
| Profile | Get, Get Billing History, Get Billing Status, Get Usage, Update Timezone, Update Notifications |
| Security | Get Devices, Get Connected Apps (read only) |
| Webhook | Create, Delete, Get, Get Many, Get Deliveries, Rotate Secret, Send Test, Update |

Payment methods are `cash`, `upi`, `bank`, `credit_card`, `debit_card`, `wallet`, `cheque` and `other`. For a bank
or card method, choose the account in **Payment Account**; leave it empty and Cashly uses the account marked as
favourite for that method.

Account settings such as name, email, currency and billing are changed in the Cashly app only.

The node can also be used as a tool by n8n AI agents.

### Cashly Trigger

Starts the workflow **instantly** when data changes in Cashly. Choose the events, for example
`Transaction Created` or `Lend or Borrow Updated`, or `*` for all of them.

When the workflow is activated the node registers a webhook on the Cashly account, and removes it when the workflow
is deactivated. Every request is checked against the webhook's signing secret before the workflow runs, and
requests older than 5 minutes are refused.

Cashly must be able to reach your n8n instance over **public HTTPS**. For an n8n running on your own computer,
use the Cashly Polling Trigger instead.

Each item looks like this:

```json
{
  "id": "7c0e2f4a-1b9d-4e6a-9c3f-5d8b2a7e1f04",
  "event": "transaction.created",
  "created_at": "2026-10-15T09:12:02.481Z",
  "data": {
    "id": "3a91...",
    "type": "debit",
    "amount": "450.00",
    "category": "Food",
    "description": "Lunch",
    "payment_method": "upi",
    "transaction_date": "2026-10-15T09:11:58.000Z"
  }
}
```

`data` is the record after the change (for a `.deleted` event, the record just before it was deleted). Webhooks
are part of Cashly Pro and Pro Plus. More detail: [Cashly webhooks guide](https://cashly.corenexis.com/developer/api#webhooks).

### Cashly Polling Trigger

Checks Cashly on a schedule (set the interval in the node) and starts the workflow for:

- **New Transaction** (optionally only expenses or only income)
- **New Lend or Borrow**
- **Upcoming Bill Due** within a chosen number of days; each bill triggers once

Use it when Cashly cannot reach your n8n, or for reminders about bills that fall due.

## Examples

- **Expense alert**: Cashly Trigger (`Transaction Created`) > IF amount is over 5,000 > send a message to Slack or
  Telegram.
- **Bill reminder**: Cashly Polling Trigger (`Upcoming Bill Due`, 3 days ahead) > send an email with the bill name,
  amount and due date.
- **Log card spends from email**: Gmail Trigger > extract the amount and merchant > Cashly (Transaction > Create,
  payment method `credit_card`).
- **Monthly summary**: Schedule Trigger (1st of the month) > Cashly (Insight > Get Summary, last month) > send the
  totals by email.

## Compatibility

Built with the n8n node CLI and tested with n8n 1.x and 2.x. Requires a Cashly Pro or Pro Plus account.

## Resources

- [Cashly API documentation](https://cashly.corenexis.com/developer/api)
- [Cashly webhooks guide](https://cashly.corenexis.com/developer/api#webhooks)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

## Support

Maintained by [Corenexis](https://corenexis.com). Questions and issues: support@corenexis.com or
[GitHub issues](https://github.com/Core-Nexis/n8n-nodes-cashly/issues).

## License

[MIT](LICENSE)
