# Public JSON API

The tatarverse catalog is published as **static JSON** during each Astro build.
There is no backend API server, API key, or per-request database query.

## Endpoints

| URL | Description |
| --- | --- |
| `/api/v1/centers.json` | All Russian source centers |
| `/api/v1/centers.en.json` | Available English center translations |
| `/api/v1/centers/tbk-1.json` | One center by stable ID |
| `/api/v1/countries.json` | Countries, counts and links to per-country JSON |
| `/api/v1/countries/%D0%9A%D0%B0%D0%B7%D0%B0%D1%85%D1%81%D1%82%D0%B0%D0%BD.json` | Centers in Kazakhstan |
| `/api/v1/stats.json` | Counts of centers, countries and regions |
| `/openapi.json` | OpenAPI 3.1 specification |

Base URL: `https://tatarverse.cc`

Example:

```sh
curl https://tatarverse.cc/api/v1/centers.json
curl https://tatarverse.cc/api/v1/centers/tbk-1.json
curl https://tatarverse.cc/api/v1/countries.json
```

Country URLs are **provided by `countries.json`**. Use those links rather than guessing
a slug; country names are used as path segments and are URL-encoded by clients.

## Response shape

List responses contain `version`, `total`, and `data`; the center lists also have
`language`. Individual center and statistics responses have `version` and `data`.

Each center includes its stable `tbk-*` ID, language, title, category, type,
summary, source URL, publication date, location, and canonical page URL.
Optional source fields are returned as `null` when absent.

Only frontmatter metadata is included, **not the complete MDX body**. Follow
the `url` field to read the full entry and its original citations.
English translations come from `centersEn` and may have fewer entries than the
Russian source collection. Country names in English records are localized.

## Static API constraints

- No runtime search, pagination, arbitrary query parameters or mutation.
- Filter the full JSON client-side, or use the prebuilt country endpoints.
- Data changes only when the site is rebuilt and deployed.
- Nonexistent IDs or countries return a normal static-file 404.
- Cloudflare Pages configures CORS (`Access-Control-Allow-Origin: *`) and
  one-hour browser caching in `public/_headers`. No user data or secrets are returned.

## License and attribution

Data is published under **CC BY 4.0** unless otherwise stated.
Attribute `tatarverse.cc`, link to the source and
[license](https://creativecommons.org/licenses/by/4.0/), and indicate changes.
Third-party content and brand assets are excluded from the content license.
See [Content License](../CONTENT-LICENSE.md).

## Development

Run `bun run build` to regenerate the JSON files. They appear under
`dist/api/v1/` along with `dist/openapi.json`. Cloudflare Pages serves them
directly from the CDN. The API route files live under `src/pages/api/v1/`.
