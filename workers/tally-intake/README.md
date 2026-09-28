# tally-intake

Cloudflare Worker: принимает вебхук Tally с формы «Добавить центр», проверяет
подпись и дергает GitHub `workflow_dispatch` (`tally-submission.yml`), который
создает issue с заявкой. Черновик карточки из issue собирает
`draft-center-pr.yml` по метке `draft-card`.

Отдельный деплой, не часть сборки Astro: папка `workers/` исключена из
корневого `tsconfig.json`.

Поле «Контакт для связи» и поля с «не публикуется» в названии воркер
вырезает - репозиторий публичный, они остаются только в Tally.

## Локальная разработка

```bash
cd workers/tally-intake
bun install
cp .dev.vars.example .dev.vars   # вписать TALLY_SIGNING_SECRET и GITHUB_TOKEN
bun run dev                       # wrangler dev, http://localhost:8787
```

Тест подписи без Tally - HMAC-SHA256 тела на `TALLY_SIGNING_SECRET`, base64,
в заголовке `Tally-Signature`:

```bash
node -e '
const crypto = require("crypto");
const secret = "<TALLY_SIGNING_SECRET>";
const body = JSON.stringify({ data: {
  submissionId: "local-test-1", formId: "test", formName: "tatarverse - центры",
  fields: [{ key: "q1", label: "Название центра", type: "INPUT_TEXT", value: "Тест" }],
} });
console.log(JSON.stringify({ body, sig: crypto.createHmac("sha256", secret).update(body).digest("base64") }));
'
curl -i http://localhost:8787 -H "Tally-Signature: <sig>" -H "Content-Type: application/json" -d '<body>'
```

Без подписи или с неверной - `401`. Верная без рабочего `GITHUB_TOKEN` - `502`.

## Прод-деплой

`-c wrangler.toml` обязателен: иначе wrangler подхватывает корневой
`wrangler.jsonc` сайта.

```bash
bun run deploy
bunx wrangler secret put TALLY_SIGNING_SECRET -c wrangler.toml
bunx wrangler secret put GITHUB_TOKEN -c wrangler.toml
```

`GITHUB_TOKEN` - fine-grained PAT, только репозиторий `proxima812/tatarverse`,
единственное право - `Actions: Read and write`. Issue и PR создает встроенный
токен workflow, не этот.

URL воркера (`https://tatarverse-tally-intake.kamil-mirikhan.workers.dev`) -
в Tally: Integrations → Webhooks, там же signing secret.
