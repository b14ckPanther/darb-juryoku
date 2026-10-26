# Integration with the universe

Darb Juryoku works fully on its own. Everything in this file is the optional, later **Phase 9**. The schema below is the one Darb Budokai already lists in `Darb Budokai/docs/EVENT_CONTRACTS.md` §3.2; keep both in sync. Envelope details (CloudEvents 1.0, Darb Budokai extensions, HMAC) come from Darb Budokai and are **proposed there too, confirm with Nour in Phase 1**.

## 1. What Darb Juryoku sends

Only **aggregates**. Never images, landmarks, masks, features, probabilities or calibration data.

### `posture.session.recorded` v1

Emitted once when a session ends (Nour presses End, closes the app, or the configured idle timeout passes). Long sessions are cut at local midnight so each event belongs to one day.

Payload (`data`):

```json
{
  "sessionId": "01JC8V4Z6Q8X3N2M5K7R9T1W2Y",
  "startedAt": "2026-11-03T08:41:00+02:00",
  "endedAt": "2026-11-03T11:02:00+02:00",
  "goodMinutes": 104,
  "badMinutes": 31,
  "longestBadStreakMinutes": 9,
  "sampleCount": 42180,
  "device": "macbook-pro-14"
}
```

Schema file: `packages/schemas/events/posture.session.recorded/v1.schema.json` (JSON Schema 2020-12), with `examples/valid/*.json` and `examples/invalid/*.json`.

| Field | Type | Required | Rule |
|---|---|---|---|
| `sessionId` | string | yes | Darb Juryoku session id. Natural key for Darb Budokai dedupe. |
| `startedAt`, `endedAt` | date-time | yes | RFC 3339 with offset. `endedAt > startedAt`. |
| `goodMinutes` | integer >= 0 | yes | Minutes whose dominant state was `upright`. |
| `badMinutes` | integer >= 0 | yes | Minutes whose dominant state was any bad class. |
| `longestBadStreakMinutes` | integer >= 0 | yes | Longest run of consecutive bad minutes. |
| `sampleCount` | integer >= 0 | yes | Pose samples taken. |
| `device` | string | no | Device label from Settings (free text Nour sets, not a fingerprint). |

`absent` and `unknown` minutes are not sent; `goodMinutes + badMinutes` can be less than the session length.

Envelope values:

| Field | Value |
|---|---|
| `source` | `urn:budokai:producer:darb-juryoku` |
| `type` | `posture.session.recorded` |
| `dataschema` | `https://github.com/b14ckPanther/darb-budokai/contracts/events/posture.session.recorded/v1.schema.json` |
| `id` | UUIDv7 generated when the event is built; stored in the outbox so retries reuse it |
| `budokaievidence` | `{ "tier": "verified", "ref": "darb-juryoku:session:<sessionId>" }` |
| `budokaimode` | `live`, or `demo` when demo mode is on (demo events are never sent unless Settings says so) |
| `correlationid` | `day:<budokaiuserid>:<local date>` |

Darb Budokai's rulebook turns this into stamina (+0.5 per good minute, capped per day) and Vigor XP, and drains stamina for long bad streaks. Those numbers live in Darb Budokai's config, not here.

### Versioning

- Adding an optional field: same major version.
- Removing or renaming a field, changing a type, or adding a required field: `v2.schema.json`, a new `dataschema` URI, an ADR here and in Darb Budokai, and a Darb Budokai-side consumer update first.
- A contract test in `packages/schemas` validates every example and fails on a breaking change inside `v1` (required fields, types, enums).

## 2. Outbound adapter

`apps/web/src/budokai/`:

1. On session end, build the payload from IndexedDB minute buckets, validate it against the schema (Ajv), wrap it in the CloudEvents envelope, write it to the `outbox` table.
2. A sender (runs when the app is open and online) posts to `POST {ingestUrl}/ingest/v1/events` with headers:
   - `Content-Type: application/cloudevents+json`
   - `X-Budokai-Producer: <keyId>`
   - `X-Budokai-Signature: t=<unix>,v1=<hex hmac-sha256(secret, t + "." + rawBody)>`
3. `202` with the id in `accepted` or `duplicates`: mark sent. `400`: move to `rejected` with details shown in Settings. `401/403`: stop and show "Check your producer key". Network error or `5xx`: retry with backoff from `config/budokai.yaml`.
4. Batch mode (`/ingest/v1/events:batch`) when more than one event is pending.

Configuration: ingest URL, `keyId` and secret are entered in Settings at runtime. The secret becomes a non-extractable WebCrypto `CryptoKey`. Nothing Darb Budokai-related is in the build or the repo. `.env.example` has `VITE_REALM_INGEST_URL_DEFAULT=` (empty) for local testing only.

CORS: Darb Budokai's ingest must allow the Darb Juryoku origin. Record this as a request to the Darb Budokai project when Phase 9 starts.

## 3. What Darb Juryoku consumes

Nothing in v1. A later idea (not planned): read the character's stamina from Darb Budokai's GraphQL API to show it in the sentinel.

## 4. Other siblings

| Sibling | Relationship |
|---|---|
| Darb Budokai | Receives `posture.session.recorded` v1 (stamina, Vigor, The Springs region). |
| Darb Enmacho | Reads the same events from Darb Budokai's Kafka topics. Nothing to do here. |
| Darb Kaioken | Will embed a demo of the live outline in the Darb Juryoku write-up: readers turn on their own webcam, calibrate, and see the glow, fully on-device. Phase 11 builds a standalone embed route (`/embed`) with no storage and no Darb Budokai adapter. |
| Darb Capsule | Shows stamina from Darb Budokai, not from Darb Juryoku. |
| Darb Kaio | May read posture trends from Darb Budokai later. |

## 5. Phase 9 tests

- Contract: every example validates; invalid examples fail for the stated reason.
- Builder: minute buckets fixture produces the expected payload (midnight split, streak calculation).
- Signature: known secret + timestamp + body gives the known hex (test vector shared with Darb Budokai's ingest tests).
- Sender: MSW fixture server returns 202, 400, 401, 503 sequences; outbox states and retries behave per config.
- Privacy: the request body contains only the fields above (Playwright request interception).
- Optional manual check against a locally running Darb Budokai ingest, if Darb Budokai exists by then. Not required to finish the phase.
