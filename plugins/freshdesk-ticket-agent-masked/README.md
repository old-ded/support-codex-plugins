# Чтение и проверка тикетов во Фрешдеске

Плагин Codex в режиме только для чтения: ищет тикеты в `aviasales.freshdesk.com` через MCP и маскирует персональные данные через PII Guard перед тем, как вернуть текст тикета в Codex.

## Что умеет

- Ищет тикеты Freshdesk по условиям.
- Читает отдельный тикет.
- Читает переписку в тикете.
- Маскирует пользовательские данные в тексте тикетов через PII Guard.
- Знает официальные поля Freshdesk для фильтрации тикетов.
- Получает актуальные поля тикетов, группы и агентов, чтобы переводить названия в id.
- При первом использовании показывает короткую инструкцию.
- Ничего не изменяет во Freshdesk.

# Установка Freshdesk-агента в Codex

Файл с инструкцией можно скачать из репозитория:

plugins/freshdesk-ticket-agent-masked/skills/freshdesk-ticket-agent-masked/SKILL.md

## Установка

```bash
codex plugin marketplace add old-ded/support-codex-plugins --ref main
codex plugin add freshdesk-ticket-agent-masked@support-team

## Настройка

1. Создайте или выберите пользователя Freshdesk с минимальными правами, достаточными для чтения тикетов.
2. В Freshdesk откройте настройки профиля пользователя и скопируйте API key.
3. Задайте переменную окружения с API key:

```bash
export FRESHDESK_API_KEY="your-api-key"

