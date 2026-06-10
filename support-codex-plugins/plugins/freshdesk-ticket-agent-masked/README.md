# Чтение и проверка тикетов во Фрешдеске

Read-only Codex plugin for finding tickets in `aviasales.freshdesk.com` through MCP, with PII Guard masking before ticket text is returned to Codex.

## What It Does

- Searches Freshdesk tickets by conditions.
- Reads a single ticket.
- Reads ticket conversations.
- Masks user data in ticket text through PII Guard.
- Knows the official Freshdesk ticket filter fields.
- Lists live ticket fields, groups, and agents so names can be translated into ids.
- Shows a short usage guide on first use.
- Does not change anything in Freshdesk.

## Setup

1. Create or choose a Freshdesk user with the smallest permissions that still allow ticket reads.
2. In Freshdesk, open the user profile settings and copy the API key.
3. Set the API key environment variable:

```bash
export FRESHDESK_API_KEY="your-api-key"
```

The domain is already fixed in the plugin as `aviasales.freshdesk.com`.

PII Guard is also configured by default:

```bash
export PII_GUARD_URL="https://pii-guard-api.mp.us-east-2.k8s.int.avs.io/api/mask"
export PII_GUARD_FAIL_MODE="block"
```

With `PII_GUARD_FAIL_MODE=block`, the MCP server refuses to return ticket text if masking fails.

4. Install dependencies:

```bash
npm install
```

5. Check the server file:

```bash
npm run check
```

6. Start the MCP server manually for a smoke test:

```bash
npm start
```

In Codex, install/share the plugin from the marketplace entry, then ask:

```text
Find open urgent Freshdesk tickets updated today.
```

## Supported Ticket Filter Fields

The agent knows the Freshdesk search fields supported by `/api/v2/search/tickets`:

- `agent_id`
- `group_id`
- `priority`
- `status`
- `tag`
- `type`
- `due_by`
- `fr_due_by`
- `created_at`
- `updated_at`
- `closed_at`
- custom ticket fields from `/api/v2/ticket_fields`

The MCP tool `get_ticket_filter_reference` returns this reference, examples, and live custom fields from Freshdesk.

## PII Masking

The MCP tool `get_pii_masking_reference` returns the masking configuration and supported entity types.

Supported masks:

- `<<person>>`
- `<<location>>`
- `<<email>>`
- `<<booking_code>>`
- `<<e_ticket>>`
- `<<ru_passport>>`
- `<<other_passport>>`
- `<<ru_foreign_passport>>`
- `<<luggage_check>>`
- `<<phone>>`
- `<<date>>`
- `<<card>>`
- `<<time>>`
- `<<pnr>>`
- `<<number>>`

PII Guard accepts `include` or `exclude`, but not both in one request. This plugin defaults to masking every supported entity type.

## Team Sharing

For team use, share the plugin through Codex and configure the Freshdesk API key as a team/workspace secret instead of putting the key in the repository.
