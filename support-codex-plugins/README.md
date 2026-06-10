# Support Codex Plugins

Командный marketplace для Codex-плагинов Support Team.

## Плагины

- `freshdesk-ticket-agent-masked`: агент «Чтение и проверка тикетов во Фрешдеске».

## Установка

После публикации репозитория в GitHub:

```bash
codex plugin marketplace add KosyanMedia/<repo-name> --ref main
codex plugin add freshdesk-ticket-agent-masked@support-team
```

Для работы агента нужен secret/env:

```bash
FRESHDESK_API_KEY
```

Не коммитьте реальный Freshdesk API key в репозиторий.
