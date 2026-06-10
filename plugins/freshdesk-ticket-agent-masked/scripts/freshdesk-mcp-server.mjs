#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const DEFAULT_FRESHDESK_DOMAIN = "aviasales.freshdesk.com";
const DEFAULT_PII_GUARD_URL =
  "https://pii-guard-api.mp.us-east-2.k8s.int.avs.io/api/mask";
const PII_ENTITY_TYPES = [
  "person",
  "location",
  "email",
  "booking_code",
  "e_ticket",
  "ru_passport",
  "other_passport",
  "ru_foreign_passport",
  "luggage_check",
  "phone",
  "date",
  "card",
  "time",
  "pnr",
  "number",
];

const tagReferenceSource = "User-provided Freshdesk tag database excerpt, 2026-06-11";

const airlineTags = {
  "2s": "Southwind Airlines",
  "3l": "Air Arabia Abu Dhabi",
  "3u": "Sichuan Airlines",
  "5f": "FlyOne",
  "5g": "Smartavia/Nordavia",
  "5j": "Cebu Pacific",
  "5n": "Smartavia",
  "5w": "Wizz Air Abu Dhabi",
  "6e": "IndiGo",
  "6r": "AeroUnion",
  "7r": "RusLine",
  "9c": "Spring Airlines",
  a3: "Aegean Airlines",
  a4: "Azimuth",
  a9: "Georgian Airways",
  ak: "Alaska Airlines",
  at: "Royal Air Maroc",
  b2: "Belavia",
  ba: "British Airways",
  ca: "Air China",
  cz: "China Southern Airlines",
  d2: "Severstal Air Company",
  d7: "AirAsia X",
  dd: "Nok Air",
  dp: "Pobeda",
  dv: "SCAT Airlines",
  ek: "Emirates",
  ew: "Eurowings",
  ey: "Etihad Airways",
  f7: "iFly Airlines",
  fd: "Thai AirAsia",
  fz: "flydubai",
  g9: "Air Arabia",
  gq: "SKY express",
  h4: "HiSky",
  hh: "TABAN AIR",
  hu: "Hainan Airlines",
  hv: "Transavia",
  hy: "Uzbekistan Airways",
  hz: "Aurora Airlines",
  ij: "Air Liberte ?",
  io: "Indonesian Airlines",
  iq: "Qazaq Air",
  j2: "Azerbaijan Airlines",
  j9: "Jazeera Airways",
  jd: "Capital Airlines",
  ji: "Armenian Airlines",
  ju: "Air Serbia",
  kc: "Air Astana",
  kv: "Krasavia",
  ly: "EL AL Israel Airlines Limited",
  ms: "Egyptair",
  mu: "China Eastern Airlines",
  n4: "Nordwind Airlines",
  od: "Batik Air Malaysia",
  pc: "Pegasus Airlines",
  pr: "Philippine Airlines",
  qr: "Qatar Airways",
  qz: "Indonesia AirAsia",
  r3: "Yakutia Airlines",
  rj: "The Royal Jordanian Airline",
  rt: "UVT Aero",
  s7: "S7 Airlines",
  sl: "Thai Lion Air",
  su: "Aeroflot",
  sz: "Somon Air",
  tg: "Thai Airways International",
  tk: "Turkish Airlines",
  to: "Avianca Peru",
  u2: "easyJet",
  u6: "Ural Airlines",
  uo: "Hong Kong Express Airways",
  ut: "UTair",
  vf: "Valuair",
  vj: "Vietjet",
  vy: "Vueling Airlines",
  vz: "Thai VietJet Air",
  w2: "Flexflight",
  w4: "Wizz Air Malta",
  w6: "Wizz Air",
  w9: "Wizz Air UK",
  wy: "Oman Air",
  wz: "Red Wings Airlines",
  xj: "Thai AirAsia X",
  xq: "SunExpress",
  y7: "NordStar",
  yc: "Yamal Airlines",
  yk: "Avia Traffic",
  zf: "Azur Air",
};

const gdsTags = {
  gds_aeroflotaer: "Адаптер AeroflotAer",
  gds_aeroflotvs: "Адаптер AeroflotVS",
  gds_aviacentr: "Адаптер Aviacentr",
  gds_baosheng: "Адаптер Baosheng",
  gds_berlogicde: "Адаптер BerlogicDE",
  gds_flydubai: "Адаптер FlyDubai",
  gds_mixvel: "Адаптер Mixvel",
  gds_mixvelji: "Адаптер MixvelJI",
  gds_mixveln4: "Адаптер MixvelN4",
  gds_pobeda: "Адаптер Pobeda",
  gds_s7: "Адаптер S7",
  gds_sabre: "Адаптер Sabre",
  gds_sabreil: "Адаптер SabreIL",
  gds_sabrekz: "Адаптер SabreKZ",
  gds_sig: "Адаптер SIG",
  gds_sig_charter: "Адаптер SIG Charter",
  gds_sigut: "Адаптер SIGUT",
  gds_travelfusion: "Адаптер Travelfusion",
  gds_travelport: "Адаптер Travelport",
  gds_travelport2: "Адаптер Travelport2",
  gds_travelportaer: "Адаптер TravelportAer",
  gds_travelportde: "Адаптер TravelportDE",
  gds_travelportin: "Адаптер TravelportIN",
  gds_travelportkz: "Адаптер TravelportKZ",
  gds_travelportkz2: "Адаптер TravelportKZ2",
  gds_travelportpk: "Адаптер TravelportPK",
  gds_travelportpt: "Адаптер TravelportPT",
  gds_travelportsp: "Адаптер TravelportSP",
};

const workflowTags = [
  ["2_to_3lite", "Тикет был переведен со 2 линии на 3 линию lite"],
  ["2line_b2b", "Все тикеты, которые побывали на группе B2B 2 линии"],
  ["2line_b2b_not", "Передача с B2B 2 линии на 2 линию: не назначился на B2B 2 линии в течение часа"],
  ["2line_b2b_routing", "Роутинг на группу B2B 2 линии"],
  ["2line_b2b_to_2line", "Передача с B2B 2 линии на 2 линию по таймеру"],
  ["3lite_to_3", "Тикет передан с 3 линии lite на 3 линию"],
  ["3lite_to_3line", "Передача тикета с 3 линии lite на 3 линию"],
  ["approving_changes", "Изменения в рейсах/багаже согласованы с пассажиром и поставщиком"],
  ["assignment_changed", "Исполнитель был изменен внутри группы"],
  ["auto_refund", "Произведен автовозврат"],
  ["autoclosed_bad", "Закрытие тикетов с оценкой Плохо"],
  ["autoclosed_docs", "Отправлен автоответ на неверную почту"],
  ["autoclosed_pending", "Автозакрытие после ожидания ответа клиента"],
  ["autoclosed_receipt", "Тикет закрыт автоответом про чеки"],
  ["autoclosed_s7", "Тикет автоматически закрыт апдейтом от S7"],
  ["autoclosed_services", "Тикет автоматически закрыт автоответом про дополнительные услуги"],
  ["autoemail_1", "Отправлена ночная отбивка Авиасейлс"],
  ["autoemail_2", "Отправлена отбивка в день вылета Авиасейлс"],
  ["autoemail_3", "Отправлена отбивка в день до вылета Авиасейлс"],
  ["autoemail_5", "Отправлена отбивка на остальные дни Авиасейлс"],
  ["automated_processing_autoclosed", "Автозакрытие уведомлений по автоматическим возвратам"],
  ["automated_processing_check", "Произведен автоматический возврат в GDS, необходимо проверить"],
  ["autoterms", "Автотермс"],
  ["backofficeevent", "Системный тип: уведомление из бэкофиса"],
  ["bill", "Системный тип: счет оплачен"],
  ["bug_feature", "Передача багов в PIPEC"],
  ["cancelonlinecheckin", "Системный тип: отмена онлайн-регистрации"],
  ["closed_by_merge", "Закрыт с помощью мержа в другой тикет"],
  ["closed_by_rule", "Тикет закрыт одним из правил на автозакрытие"],
  ["created_from_cc", "Тикет создан из КЦ"],
  ["created_via_ff", "Тикет создан через FF"],
  ["dp_vol_refund", "Добровольный обмен или добровольный возврат для Победы"],
  ["duty", "Разметка тикетов-передач из Меты для дежурства"],
  ["emergent_timer_inprogress", "Идет экстренный таймер"],
  ["ev_autoterms", "EV автотермс"],
  ["flightrefund", "Возврат авиабилета"],
  ["flightservice_custombaggage", "Дополнительный багаж"],
  ["flightservice_seatselection", "Выбор места"],
  ["high_tbank", "Срочный тикет от организации Т-Банк"],
  ["insurance_flight_on_bg_zv_ns500", "Страховка flight on bg zv ns500"],
  ["insurance_on_marketflight_own", "Страховка on marketflight own"],
  ["insurance_vzr_classic", "Страховка ВЗР classic"],
  ["involuntary_refund", "Вынужденный возврат"],
  ["involuntary_refund_approved", "Вынужденный возврат одобрен, клиент согласен"],
  ["manual_unassignment", "Агент вручную снял тикет с себя и перевел на группу"],
  ["marking_orgs", "Разметка организаций"],
  ["mego_autoemail1", "Отправлена отбивка МЕГО на запрос вылет сегодня-завтра"],
  ["metacase", "Метакейс"],
  ["monitoring", "Системный тип: мониторинг PNR"],
  ["otherwise", "Системный тип: другие системные"],
  ["package_optimumaviasales", "Пакет optimum aviasales"],
  ["partnerrequest", "Системный тип: запрос партнерам"],
  ["partnerrequest_out", "Исходящий запрос партнерам"],
  ["payment_refund_success_mc", "Успешный возврат платежа"],
  ["payment_waiting_autoclosed", "Закрытие неоплаченных счетов"],
  ["price_0_49999", "Стоимость заказа от 0 до 49999"],
  ["price_50000_99999", "Стоимость заказа от 50000 до 99999"],
  ["price_100000_199999", "Стоимость заказа от 100000 до 199999"],
  ["price_200000_up", "Стоимость заказа от 200000"],
  ["product_escalation_2h", "Эскалация продукта 2 часа"],
  ["queueevent", "Системный тип: очередь"],
  ["refund_6days", "Ожидание возврата 6 дней"],
  ["refund_30days", "Ожидание возвращения средств по возврату 30 дней"],
  ["refund_gds_error_mc", "Ошибка автоматического возврата в GDS"],
  ["refund_gds_success_mc", "Произведен автоматический возврат в GDS"],
  ["refund_waiting", "Отправлена отбивка о получении денег или ожидании возврата"],
  ["reprice", "Системный тип: репрайсинг"],
  ["request_from_form_ota", "Тикет пришел из формы Авиасейлс ОТА"],
  ["robot_flight_change", "Ошибка отправки изменений по заказу"],
  ["robot_payment_processing", "Уведомления об оплаченных счетах или ошибках подтверждения платежа"],
  ["robot_pnr_tracking", "Мониторинг PNR: проблемы с бронью"],
  ["rv_autoterms", "RV автотермс"],
  ["service_flight_flexbooking", "Услуга Flex booking"],
  ["service_flight_notification", "Услуга уведомления о рейсе"],
  ["service_flight_refundmoney", "Услуга возврата денег"],
  ["service_flight_synthrefundmoney", "Услуга синтетического возврата денег"],
  ["service_freesupport", "Услуга бесплатной поддержки"],
  ["service_onlineregistration", "Услуга онлайн-регистрации"],
  ["spprtns_31", "SPPRTNS 31"],
  ["tbank", "Тикет от организации Т-Банк"],
  ["tech_error", "Техническая ошибка при отправке ФОС"],
  ["to_csi", "Разметка для отправки на запрос CSI"],
  ["to_slack", "Разметка для отправки в Slack"],
  ["type_claim", "Тип тикета: претензия"],
  ["type_incident", "Тип тикета: инцидент"],
  ["type_question", "Тип тикета: вопрос"],
  ["type_request", "Тип тикета: запрос"],
  ["u6_vol_refund", "Добровольный возврат Ural Airlines"],
  ["unassigned_by_emergent_rule", "Экстренный тикет снят с исполнителя и отправлен обратно на группу"],
  ["unassigned_by_rule", "Тикет снят с исполнителя и отправлен обратно по таймеру/правилу"],
  ["unassigned_by_rule_2line", "Снято с исполнителя по правилу 2 линии"],
  ["unassigned_timer_ended", "Таймер на снятие с исполнителя закончился"],
  ["unexchangeable", "Билет в заказе необменный"],
  ["unrefundable", "Билет в заказе невозвратный"],
  ["void_gds_success_mc", "Произведен автоматический void в GDS"],
  ["void_success", "Void успешно произведен"],
  ["waiting_10m", "Таймер на 10 минут"],
  ["waiting_20m", "Таймер на 20 минут"],
  ["waiting_24h", "Таймер на 24 часа"],
  ["waiting_48h", "Таймер на 48 часов"],
  ["waiting_60days", "Таймер на 60 дней"],
  ["wrong_email", "Почта в заказе отличается от почты, с которой пишет клиент"],
  ["автозапрос_оценки", "Запрос оценки качества сервиса"],
  ["автоответ_болезнь", "Автоответ для вынужденного возврата по болезни"],
  ["автоответ_дети_dp", "Автоответ: оформление детского билета на Победу невозможно"],
  ["автоответ_обмен_dp", "Автоответ: добровольный обмен билета Победа"],
  ["автоответ_смерть", "Автоответ для вынужденного возврата по смерти"],
  ["автоответ_согл_изм", "Закрытие тикетов, где получено согласие с изменениями"],
  ["автоответ_услуги_ак", "Автоответ: добавить услуги АК"],
  ["автоприоритет_проверить", "Автоприоритет: проверить"],
  ["без_оценки", "Без оценки"],
  ["возможен_войд", "Для заказа возможен void"],
  ["не_согласовано", "Не согласовано"],
  ["проверен_автоматически", "Тикет проверен автоматически на бэке"],
  ["проверить_вручную", "Проверить вручную"],
  ["согласовано", "Согласовано"],
  ["спам", "Спам"],
];

const explicitTagAliases = {
  airline_a4: ["Азимут", "Azimuth"],
  airline_dp: ["Победа"],
  airline_fz: ["Flydubai", "FlyDubai"],
  airline_pc: ["Pegasus"],
  airline_s7: ["S7", "С7"],
  airline_su: ["Аэрофлот"],
  airline_tk: ["Turkish", "Турецкие авиалинии"],
  airline_u6: ["Ural Airlines", "Уральские авиалинии"],
  auto_refund: ["автовозврат", "автоматический возврат"],
  autoclosed_docs: ["неверная почта", "wrong email auto reply"],
  autoclosed_pending: ["автозакрытие ожидания", "закрываем ваш вопрос"],
  closed_by_merge: ["мерж", "merge", "объединение тикетов"],
  dp_vol_refund: ["добровольный возврат Победа", "добровольный обмен Победа"],
  gds_travelportkz: ["TravelportKZ"],
  gds_travelportkz2: ["TravelportKZ2"],
  involuntary_refund: ["вынужденный возврат"],
  refund_30days: ["возврат 30 дней", "таймер 30 дней"],
  unrefundable: ["невозвратный билет"],
  waiting_10m: ["таймер 10 минут"],
  waiting_20m: ["таймер 20 минут"],
  waiting_24h: ["таймер 24 часа"],
  waiting_48h: ["таймер 48 часов"],
  waiting_60days: ["таймер 60 дней"],
  wrong_email: ["wrong email", "неверная почта", "почта отличается"],
};

const freshdeskTagReference = [
  ...Object.entries(airlineTags).map(([code, description]) => ({
    tag: `airline_${code}`,
    description,
    category: "airline",
    aliases: [code, description, ...(explicitTagAliases[`airline_${code}`] || [])],
  })),
  ...Object.entries(gdsTags).map(([tag, description]) => ({
    tag,
    description,
    category: "gds",
    aliases: [tag.replace(/^gds_/, ""), description, ...(explicitTagAliases[tag] || [])],
  })),
  ...workflowTags.map(([tag, description]) => ({
    tag,
    description,
    category: "workflow",
    aliases: [description, ...(explicitTagAliases[tag] || [])],
  })),
];

const domain = cleanDomain(process.env.FRESHDESK_DOMAIN || DEFAULT_FRESHDESK_DOMAIN);
const apiKey = process.env.FRESHDESK_API_KEY;
const piiGuardUrl = process.env.PII_GUARD_URL || DEFAULT_PII_GUARD_URL;
const piiGuardFailMode = process.env.PII_GUARD_FAIL_MODE || "block";

if (!apiKey) {
  throw new Error(
    "Set FRESHDESK_API_KEY before starting the Freshdesk MCP server."
  );
}

const baseUrl = `https://${domain}`;
const authHeader = `Basic ${Buffer.from(`${apiKey}:X`).toString("base64")}`;

const server = new McpServer({
  name: "freshdesk",
  version: "0.1.0",
});

const ticketFilterReference = {
  domain,
  endpoint: "/api/v2/search/tickets?query=[query]",
  documentation:
    "https://developers.freshdesk.com/api/#filter_tickets",
  rules: [
    "Search is read-only and excludes archived tickets.",
    "Wrap the full query in double quotes when calling Freshdesk directly; this MCP server does that automatically.",
    "Use AND, OR, and parentheses to combine conditions.",
    "Use :> and :< with date and numeric fields.",
    "Use UTC dates in YYYY-MM-DD format.",
    "Use null for empty values, for example agent_id:null or tag:null.",
    "Freshdesk returns 30 tickets per page and supports pages 1 through 10.",
    "Freshdesk indexing can lag by a few minutes after ticket updates.",
  ],
  standardFields: [
    {
      name: "agent_id",
      type: "integer",
      description: "ID of the assigned agent. Use agent_id:null for unassigned tickets.",
    },
    {
      name: "group_id",
      type: "integer",
      description: "ID of the group assigned to the ticket.",
    },
    {
      name: "priority",
      type: "integer",
      description: "Ticket priority: 1 low, 2 medium, 3 high, 4 urgent.",
    },
    {
      name: "status",
      type: "integer",
      description:
        "Ticket status. Common defaults: 2 open, 3 pending, 4 resolved, 5 closed. Accounts may have custom statuses.",
    },
    {
      name: "tag",
      type: "string",
      description: "Ticket tag, for example tag:'refund'.",
    },
    {
      name: "type",
      type: "string",
      description: "Ticket type, for example type:'Question'.",
    },
    {
      name: "due_by",
      type: "date",
      description: "Resolution due date in YYYY-MM-DD.",
    },
    {
      name: "fr_due_by",
      type: "date",
      description: "First response due date in YYYY-MM-DD.",
    },
    {
      name: "created_at",
      type: "date",
      description: "Ticket creation date in YYYY-MM-DD.",
    },
    {
      name: "updated_at",
      type: "date",
      description: "Last ticket update date in YYYY-MM-DD.",
    },
    {
      name: "closed_at",
      type: "date",
      description: "Ticket close date in YYYY-MM-DD.",
    },
  ],
  customFieldTypes: [
    { type: "single_line_text", queryType: "string" },
    { type: "number", queryType: "integer" },
    { type: "checkbox", queryType: "boolean" },
    { type: "dropdown", queryType: "string" },
    { type: "date", queryType: "date" },
  ],
  examples: [
    "priority:4",
    "priority:>3 AND group_id:11 AND status:2",
    "(type:'Question' OR type:'Problem') AND (due_by:>'2026-06-01' AND due_by:<'2026-06-07')",
    "type:'Problem' AND tag:'marketing'",
    "tag:null",
    "agent_id:null",
    "(agent_id:2 OR agent_id:3) AND priority:4",
  ],
};

const usageGuide = {
  domain,
  quickStart:
    "Я ищу тикеты только в aviasales.freshdesk.com через read-only MCP. Перед ответом я маскирую пользовательские данные через PII Guard. Напиши условие обычным языком, а я переведу его в Freshdesk query и верну таблицу тикетов.",
  examples: [
    "Найди открытые urgent тикеты за сегодня.",
    "Покажи unassigned тикеты без тегов.",
    "Найди тикеты группы Payments с priority high или urgent.",
    "Покажи тикеты по тегу refund, обновленные после 2026-06-01.",
    "Суммаризируй тикет 12345 по переписке.",
  ],
  output:
    "Обычно верну: id, subject, status, priority, agent/responder, group, updated_at, due_by и ссылку.",
  limitations:
    "Я ничего не меняю во Freshdesk: не отвечаю клиентам, не закрываю тикеты, не назначаю агентов. Если PII Guard недоступен, по умолчанию я блокирую выдачу текста тикета.",
};

server.tool(
  "get_usage_guide",
  "Return a short user-facing guide for using this Freshdesk ticket agent.",
  {},
  async () => jsonResult(usageGuide)
);

server.tool(
  "get_ticket_filter_reference",
  "Return all Freshdesk ticket fields and syntax supported by this agent for ticket filtering.",
  {
    include_custom_fields: z.boolean().default(true),
  },
  async ({ include_custom_fields }) => {
    const reference = { ...ticketFilterReference };

    if (include_custom_fields) {
      const ticketFields = await freshdeskGet("/api/v2/ticket_fields");
      reference.customFields = Array.isArray(ticketFields)
        ? ticketFields.map(slimTicketField)
        : ticketFields;
    }

    return jsonResult(reference);
  }
);

server.tool(
  "get_freshdesk_tag_reference",
  "Search the built-in Freshdesk tag reference from the PMO tag database excerpt.",
  {
    search: z
      .string()
      .optional()
      .describe("Optional free-text search over tag, description, category, and aliases."),
    category: z.enum(["airline", "gds", "workflow"]).optional(),
    limit: z.number().int().min(1).max(250).default(50),
  },
  async ({ search, category, limit }) => {
    const matches = searchTagReference(search, category).slice(0, limit);
    return jsonResult({
      source: tagReferenceSource,
      total_known_tags: freshdeskTagReference.length,
      returned: matches.length,
      tags: matches,
      query_examples: [
        "tag:'airline_su'",
        "tag:'gds_travelport'",
        "(tag:'wrong_email' OR tag:'autoclosed_docs')",
      ],
    });
  }
);

server.tool(
  "resolve_freshdesk_tags",
  "Resolve a human phrase to known Freshdesk tags and return a ready-to-use Freshdesk query fragment.",
  {
    text: z
      .string()
      .min(1)
      .describe("Human phrase, tag, airline, adapter, or workflow description."),
    category: z.enum(["airline", "gds", "workflow"]).optional(),
    operator: z.enum(["OR", "AND"]).default("OR"),
    limit: z.number().int().min(1).max(50).default(10),
  },
  async ({ text, category, operator, limit }) => {
    const matches = searchTagReference(text, category).slice(0, limit);
    return jsonResult({
      source: tagReferenceSource,
      input: text,
      operator,
      matches,
      query: buildTagQuery(matches.map((match) => match.tag), operator),
    });
  }
);

server.tool(
  "get_pii_masking_reference",
  "Return PII Guard masking configuration and supported entity types.",
  {},
  async () =>
    jsonResult({
      piiGuardUrl,
      failMode: piiGuardFailMode,
      defaultBehavior:
        "Mask all supported entity types before returning Freshdesk ticket text to Codex.",
      supportedEntities: PII_ENTITY_TYPES.map((type) => ({
        type,
        mask: `<<${type}>>`,
      })),
      apiContract: {
        method: "POST",
        endpoint: piiGuardUrl,
        body: {
          include: PII_ENTITY_TYPES,
          texts: ["Хочу поменять билет на имя Ивана Иванова, билет в Стамбул"],
        },
        response: {
          result: [
            "Хочу поменять билет на имя <<person>>, билет в <<location>>",
          ],
        },
      },
      filters:
        "Use either include or exclude. Do not send both in one PII Guard request.",
    })
);

server.tool(
  "mask_texts",
  "Mask arbitrary text through PII Guard. Use include or exclude, never both.",
  {
    texts: z.array(z.string()).min(1),
    include: z.array(z.enum(PII_ENTITY_TYPES)).optional(),
    exclude: z.array(z.enum(PII_ENTITY_TYPES)).optional(),
  },
  async ({ texts, include, exclude }) => {
    if (include?.length && exclude?.length) {
      return jsonResult({
        error: true,
        message: "PII Guard accepts include or exclude, not both.",
      });
    }

    const result = await maskTexts(texts, { include, exclude });
    return jsonResult({ result });
  }
);

server.tool(
  "search_tickets",
  "Search Freshdesk tickets with Freshdesk search syntax. Read-only.",
  {
    query: z
      .string()
      .min(1)
      .describe('Freshdesk ticket search query, for example: status:2 AND priority:4'),
    page: z.number().int().min(1).max(10).default(1),
  },
  async ({ query, page }) => {
    const result = await freshdeskGet("/api/v2/search/tickets", {
      query: quoteFreshdeskQuery(query),
      page: String(page),
    });

    if (result.error) return jsonResult(result);

    const tickets = Array.isArray(result.results)
      ? result.results.map(slimTicket)
      : [];
    const maskedTickets = await maskFreshdeskPayload(tickets);

    return jsonResult({
      total: result.total,
      page,
      pii_masking: maskingMetadata(),
      tickets: maskedTickets,
    });
  }
);

server.tool(
  "analyze_tickets_by_query",
  "Fetch a batch of Freshdesk tickets and masked conversations for content analysis. Read-only.",
  {
    query: z
      .string()
      .min(1)
      .describe("Freshdesk ticket search query, for example: status:2 AND tag:'wrong_email'"),
    max_tickets: z.number().int().min(1).max(50).default(20),
    include_conversations: z.boolean().default(true),
    conversation_limit_per_ticket: z.number().int().min(1).max(20).default(10),
    text_limit_per_message: z.number().int().min(200).max(5000).default(1200),
  },
  async ({
    query,
    max_tickets,
    include_conversations,
    conversation_limit_per_ticket,
    text_limit_per_message,
  }) => {
    const searchResult = await collectSearchTickets(query, max_tickets);
    if (searchResult.error) return jsonResult(searchResult);

    const records = [];
    const errors = [];

    for (const ticket of searchResult.tickets) {
      const ticketRecord = await buildTicketAnalysisRecord(ticket.id, {
        includeConversations: include_conversations,
        conversationLimit: conversation_limit_per_ticket,
        textLimit: text_limit_per_message,
      });

      if (ticketRecord.error) {
        errors.push(ticketRecord);
      } else {
        records.push(ticketRecord);
      }
    }

    return jsonResult({
      query,
      requested_limit: max_tickets,
      found_total: searchResult.total,
      fetched: records.length,
      errors,
      pii_masking: maskingMetadata(),
      analysis_notes: [
        "Ticket text and conversations are masked before being returned.",
        "Use this dataset to identify themes, repeated causes, automation issues, and examples.",
        "For large studies, run several narrower queries instead of one broad query.",
      ],
      tickets: await maskFreshdeskPayload(records),
    });
  }
);

server.tool(
  "get_ticket",
  "Get one Freshdesk ticket by id. Read-only.",
  {
    ticket_id: z.number().int().positive(),
    include: z
      .array(z.enum(["conversations", "requester", "stats"]))
      .optional()
      .describe("Optional Freshdesk include values."),
  },
  async ({ ticket_id, include }) => {
    const result = await freshdeskGet(`/api/v2/tickets/${ticket_id}`, {
      ...(include?.length ? { include: include.join(",") } : {}),
    });

    if (result.error) return jsonResult(result);
    return jsonResult({
      pii_masking: maskingMetadata(),
      ticket: await maskFreshdeskPayload(result),
    });
  }
);

server.tool(
  "get_ticket_conversations",
  "Get public/private conversation entries for one Freshdesk ticket. Read-only.",
  {
    ticket_id: z.number().int().positive(),
  },
  async ({ ticket_id }) => {
    const result = await freshdeskGet(`/api/v2/tickets/${ticket_id}/conversations`);
    if (result.error) return jsonResult(result);
    return jsonResult({
      pii_masking: maskingMetadata(),
      conversations: await maskFreshdeskPayload(result),
    });
  }
);

server.tool(
  "list_ticket_fields",
  "List Freshdesk ticket fields, including custom fields. Read-only.",
  {},
  async () => {
    const result = await freshdeskGet("/api/v2/ticket_fields");
    return jsonResult(result);
  }
);

server.tool(
  "list_groups",
  "List Freshdesk support groups so a group name can be mapped to group_id. Read-only.",
  {},
  async () => {
    const result = await freshdeskGet("/api/v2/groups");
    return jsonResult(result.map(({ id, name, description }) => ({ id, name, description })));
  }
);

server.tool(
  "list_agents",
  "List Freshdesk agents so a person name can be mapped to responder_id. Read-only.",
  {},
  async () => {
    const result = await freshdeskGet("/api/v2/agents");
    return jsonResult(
      result.map((agent) => ({
        id: agent.id,
        contact_id: agent.contact?.id,
        name: agent.contact?.name,
        active: agent.contact?.active,
        occasional: agent.occasional,
      }))
    );
  }
);

async function freshdeskGet(path, params = {}) {
  const url = new URL(path, baseUrl);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: authHeader,
      Accept: "application/json",
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    return {
      error: true,
      status: response.status,
      statusText: response.statusText,
      body,
    };
  }

  return body;
}

async function collectSearchTickets(query, maxTickets) {
  const tickets = [];
  let total = null;

  for (let page = 1; page <= 10 && tickets.length < maxTickets; page += 1) {
    const result = await freshdeskGet("/api/v2/search/tickets", {
      query: quoteFreshdeskQuery(query),
      page: String(page),
    });

    if (result.error) return result;

    if (typeof result.total === "number") total = result.total;

    const pageTickets = Array.isArray(result.results) ? result.results : [];
    tickets.push(...pageTickets.map(slimTicket));

    if (pageTickets.length < 30) break;
  }

  return {
    total,
    tickets: tickets.slice(0, maxTickets),
  };
}

async function buildTicketAnalysisRecord(ticketId, {
  includeConversations,
  conversationLimit,
  textLimit,
}) {
  const ticket = await freshdeskGet(`/api/v2/tickets/${ticketId}`, {
    include: "requester,stats",
  });

  if (ticket.error) {
    return {
      error: true,
      ticket_id: ticketId,
      stage: "get_ticket",
      details: ticket,
    };
  }

  let conversations = [];
  if (includeConversations) {
    const conversationResult = await freshdeskGet(`/api/v2/tickets/${ticketId}/conversations`);
    if (conversationResult.error) {
      return {
        error: true,
        ticket_id: ticketId,
        stage: "get_ticket_conversations",
        details: conversationResult,
      };
    }

    conversations = Array.isArray(conversationResult)
      ? conversationResult.slice(0, conversationLimit).map((conversation) =>
          slimConversation(conversation, textLimit)
        )
      : [];
  }

  return {
    id: ticket.id,
    url: `${baseUrl}/a/tickets/${ticket.id}`,
    subject: truncateText(ticket.subject, textLimit),
    status: ticket.status,
    priority: ticket.priority,
    type: ticket.type,
    source: ticket.source,
    tags: ticket.tags || [],
    group_id: ticket.group_id,
    responder_id: ticket.responder_id,
    requester_id: ticket.requester_id,
    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
    due_by: ticket.due_by,
    fr_due_by: ticket.fr_due_by,
    is_escalated: ticket.is_escalated,
    stats: ticket.stats,
    custom_fields: ticket.custom_fields,
    description_text: truncateText(
      ticket.description_text || stripHtml(ticket.description || ""),
      textLimit
    ),
    conversations,
  };
}

function slimConversation(conversation, textLimit) {
  return {
    id: conversation.id,
    user_id: conversation.user_id,
    source: conversation.source,
    incoming: conversation.incoming,
    private: conversation.private,
    support_email: conversation.support_email,
    created_at: conversation.created_at,
    updated_at: conversation.updated_at,
    body_text: truncateText(
      conversation.body_text || stripHtml(conversation.body || ""),
      textLimit
    ),
  };
}

async function maskFreshdeskPayload(value) {
  const jobs = [];
  const clone = collectMaskJobs(value, jobs, []);

  if (!jobs.length) return clone;

  const maskedTexts = await maskTexts(jobs.map((job) => job.value), {
    include: PII_ENTITY_TYPES,
  });

  for (let index = 0; index < jobs.length; index += 1) {
    jobs[index].setter(maskedTexts[index]);
  }

  return unwrapMaskHolders(clone);
}

function collectMaskJobs(value, jobs, path) {
  if (value === null || value === undefined) return value;

  if (typeof value === "string") {
    if (shouldMaskPath(path) && value.trim()) {
      const holder = { value };
      jobs.push({
        value,
        setter: (maskedValue) => {
          holder.value = maskedValue;
        },
      });
      return holder;
    }
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    if (isCustomFieldPath(path)) {
      const holder = { value: String(value) };
      jobs.push({
        value: String(value),
        setter: (maskedValue) => {
          holder.value = maskedValue;
        },
      });
      return holder;
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      collectMaskJobs(item, jobs, path.concat(String(index)))
    );
  }

  if (typeof value === "object") {
    const output = {};
    for (const [key, child] of Object.entries(value)) {
      output[key] = collectMaskJobs(child, jobs, path.concat(key));
    }
    return output;
  }

  return value;
}

function unwrapMaskHolders(value) {
  if (Array.isArray(value)) {
    return value.map(unwrapMaskHolders);
  }

  if (value && typeof value === "object") {
    if (Object.prototype.hasOwnProperty.call(value, "value") && Object.keys(value).length === 1) {
      return value.value;
    }

    for (const [key, child] of Object.entries(value)) {
      value[key] = unwrapMaskHolders(child);
    }
  }

  return value;
}

async function maskTexts(texts, { include, exclude } = {}) {
  const body = { texts };
  if (include?.length) body.include = include;
  if (exclude?.length) body.exclude = exclude;

  let response;
  try {
    response = await fetch(piiGuardUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    return handleMaskingFailure(`PII Guard request failed: ${error.message}`, texts);
  }

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    return handleMaskingFailure(
      `PII Guard returned ${response.status} ${response.statusText}: ${JSON.stringify(payload)}`,
      texts
    );
  }

  if (!Array.isArray(payload?.result)) {
    return handleMaskingFailure("PII Guard response did not contain result array.", texts);
  }

  if (payload.result.length !== texts.length) {
    return handleMaskingFailure("PII Guard result length did not match request length.", texts);
  }

  return payload.result;
}

function handleMaskingFailure(message, originalTexts) {
  if (piiGuardFailMode === "passthrough") {
    return originalTexts;
  }

  throw new Error(
    `${message} Refusing to return unmasked Freshdesk text because PII_GUARD_FAIL_MODE=${piiGuardFailMode}.`
  );
}

function shouldMaskPath(path) {
  const key = path.at(-1);
  if (!key) return false;
  if (isCustomFieldPath(path)) return true;

  return new Set([
    "subject",
    "description",
    "description_text",
    "body",
    "body_text",
    "plain_body",
    "html_body",
    "summary",
    "text",
    "name",
    "email",
    "phone",
    "mobile",
    "address",
  ]).has(key);
}

function isCustomFieldPath(path) {
  return path.includes("custom_fields");
}

function maskingMetadata() {
  return {
    enabled: true,
    service: "pii-guard",
    fail_mode: piiGuardFailMode,
    entities: PII_ENTITY_TYPES,
  };
}

function cleanDomain(value) {
  if (!value) return "";
  return value
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")
    .trim();
}

function truncateText(value, limit) {
  if (!value) return "";
  const text = String(value).replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1)}…`;
}

function stripHtml(value) {
  return String(value)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function searchTagReference(search, category) {
  const normalizedSearch = normalizeSearch(search || "");
  const tokens = normalizedSearch.split(" ").filter(Boolean);

  return freshdeskTagReference
    .filter((entry) => !category || entry.category === category)
    .map((entry) => ({
      ...entry,
      score: scoreTagEntry(entry, normalizedSearch, tokens),
    }))
    .filter((entry) => !normalizedSearch || entry.score > 0)
    .sort((a, b) => b.score - a.score || a.tag.localeCompare(b.tag, "ru"))
    .filter((entry, index, entries) => entries[0]?.score >= 100 ? entry.score >= 100 : true)
    .map(({ score, ...entry }) => entry);
}

function scoreTagEntry(entry, normalizedSearch, tokens) {
  if (!normalizedSearch) return 1;

  const haystack = normalizeSearch(
    [entry.tag, entry.description, entry.category, ...(entry.aliases || [])].join(" ")
  );

  let score = 0;
  if (normalizeSearch(entry.tag) === normalizedSearch) score += 100;
  for (const alias of entry.aliases || []) {
    if (normalizeSearch(alias) === normalizedSearch) score += 100;
  }
  if (haystack.includes(normalizedSearch)) score += 30;
  for (const token of tokens) {
    if (haystack.includes(token)) score += 5;
  }
  return score;
}

function normalizeSearch(value) {
  return String(value)
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[_\-]+/g, " ")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildTagQuery(tags, operator = "OR") {
  const uniqueTags = [...new Set(tags.filter(Boolean))];
  if (!uniqueTags.length) return "";
  const parts = uniqueTags.map((tag) => `tag:'${tag}'`);
  return parts.length === 1 ? parts[0] : `(${parts.join(` ${operator} `)})`;
}

function quoteFreshdeskQuery(query) {
  const trimmed = query.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed;
  return `"${trimmed}"`;
}

function jsonResult(value) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

function slimTicket(ticket) {
  return {
    id: ticket.id,
    subject: ticket.subject,
    status: ticket.status,
    priority: ticket.priority,
    source: ticket.source,
    requester_id: ticket.requester_id,
    responder_id: ticket.responder_id,
    group_id: ticket.group_id,
    tags: ticket.tags,
    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
    due_by: ticket.due_by,
    fr_due_by: ticket.fr_due_by,
    is_escalated: ticket.is_escalated,
    url: `${baseUrl}/a/tickets/${ticket.id}`,
  };
}

function slimTicketField(field) {
  return {
    id: field.id,
    label: field.label,
    name: field.name,
    type: field.type,
    default: field.default,
    required_for_agents: field.required_for_agents,
    required_for_customers: field.required_for_customers,
    choices: field.choices,
  };
}

await server.connect(new StdioServerTransport());
