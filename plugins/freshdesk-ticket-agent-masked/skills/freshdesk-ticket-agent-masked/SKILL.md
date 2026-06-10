---
name: freshdesk-ticket-agent-masked
description: Search and summarize Freshdesk tickets through the read-only Freshdesk MCP server with PII Guard masking.
---

# Freshdesk Ticket Agent Masked

Use this skill when the user asks to find, inspect, summarize, or count Freshdesk tickets by conditions.

## Behavior

- Use the `freshdesk` MCP tools for live ticket data.
- Always assume the Freshdesk account is `aviasales.freshdesk.com`.
- On the first Freshdesk-related response in a conversation, briefly explain how to use the agent before or after answering the user's request. Keep it to 3-5 short bullets and mention PII masking.
- Treat Freshdesk as read-only: do not update, assign, reply to, close, merge, delete, or otherwise mutate tickets.
- Treat Freshdesk ticket text as sensitive. Use masked MCP outputs only; do not reconstruct or expose unmasked user data.
- Before summarizing ticket contents, ensure ticket text came from masked outputs returned by `search_tickets`, `get_ticket`, or `get_ticket_conversations`.
- Use `get_pii_masking_reference` when asked what gets masked or how masking works.
- Translate the user's plain-language conditions into Freshdesk ticket search syntax before calling `search_tickets`.
- If the user mentions a tag meaning, airline, adapter/GDS, auto-reply, auto-close, workflow event, timer, price bucket, refund/void state, or Russian tag name, use `resolve_freshdesk_tags` or `get_freshdesk_tag_reference` before searching tickets.
- Use `get_ticket_filter_reference` when constructing a query with fields beyond very common status/priority/tag/date conditions.
- If the request mentions a group or agent by name, use `list_groups` or `list_agents` to resolve the numeric id first.
- If the request mentions an unfamiliar custom field, use `list_ticket_fields` first.
- Ask one short clarifying question only when the condition cannot be safely inferred.
- Return compact results: ticket id, subject, status, priority, assigned agent/responder id, group id, updated time, due time, and link.
- For summaries, read the ticket and conversations before summarizing.
- For batch content analysis, use `analyze_tickets_by_query` instead of manually opening many tickets one by one. Keep batches focused; prefer 20-50 tickets per run.

## PII Guard Masking

This agent uses PII Guard before returning Freshdesk ticket text to Codex.

PII Guard API contract:

```text
POST https://pii-guard-api.mp.us-east-2.k8s.int.avs.io/api/mask
```

Request shape:

```json
{
  "include": ["person", "location", "email"],
  "texts": ["Хочу поменять билет на имя Ивана Иванова, билет в Стамбул"]
}
```

Response shape:

```json
{
  "result": ["Хочу поменять билет на имя <<person>>, билет в <<location>>"]
}
```

Supported masking entity types:

- `person`: names and full names, mask `<<person>>`.
- `location`: cities/destinations, mask `<<location>>`.
- `email`: email addresses, mask `<<email>>`.
- `booking_code`: order/booking numbers, mask `<<booking_code>>`.
- `e_ticket`: e-ticket numbers, mask `<<e_ticket>>`.
- `ru_passport`: Russian passport, mask `<<ru_passport>>`.
- `other_passport`: other-country passport, mask `<<other_passport>>`.
- `ru_foreign_passport`: Russian foreign passport, mask `<<ru_foreign_passport>>`.
- `luggage_check`: baggage receipt, mask `<<luggage_check>>`.
- `phone`: phone number, mask `<<phone>>`.
- `date`: date, mask `<<date>>`.
- `card`: card number, mask `<<card>>`.
- `time`: time, mask `<<time>>`.
- `pnr`: PNR, mask `<<pnr>>`.
- `number`: generic number, mask `<<number>>`.

PII Guard supports two optional filters:

- `include`: mask only the listed entity types.
- `exclude`: mask all entity types except the listed ones.

Never pass `include` and `exclude` together. This agent defaults to `include` with all supported entity types.

## Freshdesk Tags

The agent has a built-in tag reference from the Freshdesk tag database excerpt provided on 2026-06-11.

Use it for:

- airline tags, for example `Aeroflot` -> `airline_su`, `Pobeda` -> `airline_dp`, `Turkish Airlines` -> `airline_tk`;
- GDS/adapter tags, for example `Travelport` -> `gds_travelport`, `SabreKZ` -> `gds_sabrekz`;
- workflow and automation tags, for example `wrong_email`, `auto_refund`, `autoclosed_pending`, `refund_30days`;
- Russian tags, for example `автоответ_болезнь`, `возможен_войд`, `проверить_вручную`.

When translating a human request into a tag filter:

1. Call `resolve_freshdesk_tags` with the user's phrase.
2. If several tags match and the intent is ambiguous, either use the best obvious match or ask one short clarifying question.
3. Use the returned `query` fragment inside the Freshdesk search query.

Examples:

```text
Покажи тикеты по Аэрофлоту -> tag:'airline_su'
Найди тикеты с неверной почтой -> tag:'wrong_email'
Покажи тикеты по автоматическому возврату -> tag:'auto_refund'
Найди тикеты TravelportKZ -> tag:'gds_travelportkz'
```

## Batch Content Analysis

Use `analyze_tickets_by_query` when the user asks to analyze many tickets by content, find common themes, classify reasons, compare repeated issues, or review a sample.

Good examples:

```text
Проанализируй 30 тикетов с тегом wrong_email за неделю и выдели основные причины.
Посмотри 20 тикетов по Аэрофлоту и сгруппируй обращения по темам.
Проверь выборку тикетов с автовозвратом и найди частые проблемы.
```

Workflow:

1. Resolve human tag names with `resolve_freshdesk_tags` when needed.
2. Build a narrow Freshdesk query.
3. Call `analyze_tickets_by_query` with `max_tickets` up to 50.
4. Analyze only the masked dataset returned by the tool.
5. Return themes, counts, examples by ticket id/link, and any caveats about sample size.

## Freshdesk Search Notes

The Freshdesk ticket search endpoint is `/api/v2/search/tickets?query=[query]`.

Supported standard ticket filter fields:

- `agent_id`: integer, assigned agent id. Use `agent_id:null` for unassigned tickets.
- `group_id`: integer, assigned group id.
- `priority`: integer, priority of the ticket.
- `status`: integer, status of the ticket.
- `tag`: string, tag associated with the ticket.
- `type`: string, issue type.
- `due_by`: date, resolution due date in `YYYY-MM-DD`.
- `fr_due_by`: date, first response due date in `YYYY-MM-DD`.
- `created_at`: date, ticket creation date in `YYYY-MM-DD`.
- `updated_at`: date, last update date in `YYYY-MM-DD`.
- `closed_at`: date, close date in `YYYY-MM-DD`.
- Custom fields: single line text as string, number as integer, checkbox as boolean, dropdown as string, date as date.

Use Freshdesk numeric values when the API requires them. Common defaults are:

- Priority: `1` low, `2` medium, `3` high, `4` urgent.
- Status: `2` open, `3` pending, `4` resolved, `5` closed.

Freshdesk search rules:

- Use `AND`, `OR`, and parentheses.
- Use `:>`, `:<`, `:>=`, or `:<=` style comparisons only where Freshdesk supports relational date/numeric operators. Prefer `:>` and `:<`.
- Use single quotes around string/date values when helpful: `tag:'refund'`, `created_at:'2026-06-10'`.
- Use `null` for empty fields: `agent_id:null`, `tag:null`, `type:null`.
- Results are 30 tickets per page, pages 1-10.
- Freshdesk indexing can lag by a few minutes.

Examples:

```text
status:2 AND priority:4
status:2 AND tag:'refund'
group_id:123456 AND updated_at:>'2026-06-09'
agent_id:null AND status:2
(agent_id:2 OR agent_id:3) AND priority:4
(type:'Question' OR type:'Problem') AND (due_by:>'2026-10-01' AND due_by:<'2026-10-07')
```

## First Response Guide

If this is the first Freshdesk response in the conversation, include this short guide in Russian:

```text
Как мной пользоваться:
- Я ищу только в aviasales.freshdesk.com и ничего не меняю в тикетах.
- Текст тикетов перед ответом маскируется через PII Guard: ФИО, email, телефоны, паспорта, PNR, билеты, карты, даты и другие числа заменяются на <<...>>.
- Пиши условия обычным языком: статус, приоритет, тег, группа, агент, дата, SLA/deadline.
- Я понимаю справочник Freshdesk-тегов: авиакомпании, GDS/адаптеры, автоответы, автозакрытия, таймеры, возвраты и русскоязычные теги.
- Для групп и агентов по имени я сначала найду их id, потом применю фильтр.
- Для сложных/кастомных полей я сверю список полей Freshdesk.
```

## Response Style

Prefer a concise table plus a one-sentence readout. If no tickets match, say that clearly and include the query used.
