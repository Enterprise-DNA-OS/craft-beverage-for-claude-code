# Craft Beverage for Claude Code: operating instructions

## Who this is for

Business: [your winery, cidery or distillery]. Operator: [name and role]. Jurisdiction: [NZ or AU]. Locations and licence conditions: [references]. Accounting and statutory returns: [system and responsible adviser].

Read current records through `npm run beverage -- <command> --json` before answering. Never invent production evidence, strength, recipients, licences or tax classification. Resolve ambiguous names using the listed candidates. Use litres per individual unit, not an assumed carton conversion.

## Routing

- Product list: `/products`.
- Licensed storage locations: `/locations`.
- Vessel register: `/vessels`.
- Customer register: `/customers`.
- Batch register: `/batches`.
- Stock by batch and location: `/stock`.
- Orders to dispatch: `/dispatch-board`.
- Orders without enough stock: `/shortages`.
- Batch holds and analysis dates: `/cellar-round`.
- Stock older than ninety days: `/stock-age`.
- Movement evidence for the excise period: `/excise-prep`.
- Orders classified for Australian wine tax review: `/wet-review`.
- Missing record evidence: `/compliance`.
- Overdue work and missing evidence: `/attention`.
- Recorded order values by currency: `/sales-book`.
- Recorded losses with supporting evidence: `/losses`.
- One batch and its history: `/batch`.
- Trace a lot to dispatched customers: `/trace`.
- Receive stock with a unique source reference: `/receive`.
- Record a stock loss: `/loss`.
- Record a batch alcohol test: `/analyse`.
- Release a held batch: `/release`.
- Dispatch an order: `/dispatch`.
- Record delivery confirmation: `/delivery`.
- Add a note to a batch: `/log`.
- Create a product, batch or order: `/add`.
- Bring across supported Vinsight exports: `/import`.
- Export all domain records: `/export`.
- Draft a batch trace review: `/draft-recall`.
- Monday review: `/weekly-review`.
- Change a field or rule: `/customise`.
- Add a read-only report: `/new-view`.
- Paperwork: `npm run docs`.

## Rules

Movements are append-only. Never bypass dispatch checks or silently rewrite historical measurements. Read docs/compliance.md before discussing legal obligations. Checks flag gaps, not legal compliance. The 30-day analysis and 90-day ageing rules are local policies, not law.

No sends, tax filings, carrier bookings or payments. Drafts stay in drafts/. No deletion without an explicit instruction. Use migrations for structural changes and preserve prior evidence. Test in a temporary database before live work. Run npm test after functional changes.

## Layout

The one CLI is scripts/beverage.mjs. Database migrations and seed data live in supabase/. The adapter supports PostgreSQL and embedded PGlite. Read-only report definitions are views.json and documents.json. brand.json owns document branding.

Enterprise DNA installs and operates this through Omni by Enterprise DNA: https://enterprisedna.co/omni/instead-of/vinsight
