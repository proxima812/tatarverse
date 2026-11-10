import type { APIRoute } from "astro";
import { jsonResponse } from "@/lib/api/catalog";

export const prerender = true;

// The OpenAPI document is itself generated as a static JSON asset at build time.
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const ok = (schema: object) => ({
  description: "Successful response",
  content: { "application/json": { schema } },
});

export const GET: APIRoute = () =>
  jsonResponse({
    openapi: "3.1.0",
    info: {
      title: "tatarverse Public Catalog API",
      version: "1.0.0",
      description:
        "Static, read-only catalog generated during the Astro build. Center content is CC BY 4.0 and requires attribution.",
      license: {
        name: "CC BY 4.0 (content)",
        url: "https://creativecommons.org/licenses/by/4.0/",
      },
    },
    servers: [{ url: "https://tatarverse.cc" }],
    paths: {
      "/api/v1/centers.json": {
        get: { summary: "List centers in Russian", responses: { "200": ok(ref("CenterList")) } },
      },
      "/api/v1/centers.en.json": {
        get: { summary: "List available English translations", responses: { "200": ok(ref("CenterList")) } },
      },
      "/api/v1/centers/{id}.json": {
        get: {
          summary: "Get a center by its stable ID",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" }, example: "tbk-1" },
          ],
          responses: { "200": ok(ref("CenterResponse")), "404": { description: "No static file for this ID" } },
        },
      },
      "/api/v1/countries.json": {
        get: { summary: "List countries and center counts", responses: { "200": ok(ref("CountryList")) } },
      },
      "/api/v1/countries/{country}.json": {
        get: {
          summary: "List centers by country (URL-encode the country name)",
          parameters: [
            { name: "country", in: "path", required: true, schema: { type: "string" }, example: "Казахстан" },
          ],
          responses: { "200": ok(ref("CountryCenters")), "404": { description: "Unknown country" } },
        },
      },
      "/api/v1/stats.json": {
        get: { summary: "Catalog statistics", responses: { "200": ok(ref("StatsResponse")) } },
      },
    },
    components: {
      schemas: {
        Location: {
          type: "object",
          properties: {
            flag: { type: "string" },
            city: { type: "string" },
            country: { type: "string" },
            region: { type: "string" },
            district: { type: "string" },
          },
          additionalProperties: false,
        },
        Center: {
          type: "object",
          required: ["id", "language", "title", "type", "category", "summary", "source", "pubDate", "location", "url"],
          properties: {
            id: { type: "string", example: "tbk-1" },
            language: { type: "string", enum: ["ru", "en"] },
            title: { type: "string" },
            type: { type: ["string", "null"] },
            category: { type: ["string", "null"] },
            summary: { type: ["string", "null"] },
            source: { type: ["string", "null"], format: "uri" },
            pubDate: { type: ["string", "null"] },
            location: { anyOf: [ref("Location"), { type: "null" }] },
            url: { type: "string", format: "uri" },
          },
          additionalProperties: false,
        },
        CenterList: {
          type: "object",
          required: ["version", "language", "total", "data"],
          properties: {
            version: { type: "string" },
            language: { type: "string", enum: ["ru", "en"] },
            total: { type: "integer" },
            data: { type: "array", items: ref("Center") },
          },
        },
        CenterResponse: {
          type: "object",
          required: ["version", "data"],
          properties: { version: { type: "string" }, data: ref("Center") },
        },
        CountryList: {
          type: "object",
          required: ["version", "total", "data"],
          properties: {
            version: { type: "string" },
            total: { type: "integer" },
            data: {
              type: "array",
              items: {
                type: "object",
                required: ["name", "count", "url"],
                properties: {
                  name: { type: "string" },
                  count: { type: "integer" },
                  url: { type: "string" },
                },
              },
            },
          },
        },
        CountryCenters: {
          type: "object",
          required: ["version", "country", "total", "data"],
          properties: {
            version: { type: "string" },
            country: { type: "string" },
            total: { type: "integer" },
            data: { type: "array", items: ref("Center") },
          },
        },
        StatsResponse: {
          type: "object",
          required: ["version", "data"],
          properties: {
            version: { type: "string" },
            data: {
              type: "object",
              required: ["count", "countries", "regions", "withoutCountry", "byCountry"],
              properties: {
                count: { type: "integer" },
                countries: { type: "integer" },
                regions: { type: "integer" },
                withoutCountry: { type: "integer" },
                byCountry: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["country", "count"],
                    properties: { country: { type: "string" }, count: { type: "integer" } },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
