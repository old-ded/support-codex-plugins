# Чтение и проверка тикетов во Фрешдеске

Read-only Codex-плагин для поиска и проверки тикетов в `aviasales.freshdesk.com` через MCP. Перед возвратом текста тикетов в Codex плагин маскирует пользовательские данные через PII Guard.

## Что умеет

- Ищет тикеты Freshdesk по условиям.
- Читает отдельный тикет.
- Читает переписку в тикете.
- Загружает выборку тикетов и замаскированные переписки для массового анализа.
- Маскирует пользовательские данные в тексте тикетов через PII Guard.
- Знает официальные поля Freshdesk для фильтрации тикетов.
- Получает актуальные поля тикетов, группы и агентов, чтобы переводить названия в id.
- Понимает справочник Freshdesk-тегов.
- При первом использовании показывает короткую инструкцию.
- Ничего не изменяет во Freshdesk.

## Быстрая установка

```bash
codex plugin marketplace add old-ded/support-codex-plugins --ref main
codex plugin add freshdesk-ticket-agent-masked@support-team
```

Файл навыка, который можно скачать или открыть отдельно:

```text
plugins/freshdesk-ticket-agent-masked/skills/freshdesk-ticket-agent-masked/SKILL.md
```

## Настройка

Создайте или выберите пользователя Freshdesk с минимальными правами на чтение тикетов. В профиле пользователя Freshdesk скопируйте API key и задайте переменную окружения:

```bash
export FRESHDESK_API_KEY="your-api-key"
```

Домен уже зафиксирован внутри плагина:

```text
aviasales.freshdesk.com
```

PII Guard настроен по умолчанию:

```bash
export PII_GUARD_URL="https://pii-guard-api.mp.us-east-2.k8s.int.avs.io/api/mask"
export PII_GUARD_FAIL_MODE="block"
```

При `PII_GUARD_FAIL_MODE=block` MCP-сервер не вернет текст тикета, если маскирование не сработало.

## Проверка локально

```bash
npm install
npm run check
npm start
```

После установки в Codex можно спросить:

```text
Найди открытые срочные тикеты Freshdesk, обновленные сегодня.
```

## Массовый анализ тикетов

Для анализа содержимого выборки используйте tool `analyze_tickets_by_query`. Он загружает ограниченную выборку тикетов и замаскированные переписки.

Практичный размер одной выборки: 20-50 тикетов.

Пример запроса:

```text
Проанализируй 30 тикетов с тегом wrong_email за последнюю неделю и сгруппируй основные причины обращений.
```

## Поддерживаемые поля фильтрации

Агент знает поля Freshdesk Search API `/api/v2/search/tickets`:

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
- custom ticket fields из `/api/v2/ticket_fields`

MCP tool `get_ticket_filter_reference` возвращает справку, примеры и live custom fields из Freshdesk.

## Маскирование PII

MCP tool `get_pii_masking_reference` возвращает настройки маскирования и поддерживаемые типы сущностей.

Поддерживаемые маски:

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

PII Guard принимает `include` или `exclude`, но не оба параметра в одном запросе. По умолчанию плагин маскирует все поддерживаемые типы сущностей.

## Для команды

Для командного использования настройте Freshdesk API key как team/workspace secret в Codex. Не кладите реальный API key в репозиторий.
