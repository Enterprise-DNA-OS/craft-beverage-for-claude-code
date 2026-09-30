# Craft Beverage for Claude Code

Your batches, stock movements and dispatch evidence in a database you own.

Built by Enterprise DNA for small wineries, cideries and distilleries. This is an operational starting point, not a full copy of Vinsight's cellar production or accounting integrations.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free under MIT. Install and adapt the database. | Your fields, rules, Vinsight migration, web front end or a different stack if needed. | Installed, connected and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |
| [Quick start](#quick-start) | [Book a call](https://enterprisedna.co/omni/book?offer=replace-software&utm_medium=readme&utm_campaign=vinsight) | [How it works](https://enterprisedna.co/omni/instead-of/vinsight?utm_source=github&utm_medium=readme&utm_campaign=vinsight) |

Works with Claude Code, Codex, OpenCode or Cursor. Read AGENTS.md and CLAUDE.md.

## Quick start

Requires Node 20 or later. No database server needed for the demo.

```bash
npm install
npm test
npm run demo
npm run view
npm run docs
```

The fictional Kauri Coast Drinks demo has three batches, two storage locations and three orders. One wine order is overdue. The cider order needs 96 units against 60 available. The gin batch lacks strength and source evidence and cannot dispatch. Seeds are idempotent and do not reset operational changes.

PGlite persists to `.data/db`. For a shared PostgreSQL database, set `DATABASE_URL` in your environment or `.env`, then run `npm run migrate`. `npm run demo` always seeds fictional records, so use it only in a separate demo database. Production access, backups, role permissions and hosting location require operator configuration. Never connect this demo to an existing production database.

## The weekly work

Use `/dispatch-board`, `/cellar-round`, `/shortages`, `/excise-prep` and `/weekly-review`. `/compliance` finds missing records with sources in [docs/compliance.md](docs/compliance.md). `/customise` adds your own rules, and `/new-view` adds a read-only HTML view.

| Command | Work |
|---|---|
| `/products` | Product list |
| `/locations` | Licensed storage locations |
| `/vessels` | Vessel register |
| `/customers` | Customer register |
| `/batches` | Batch register |
| `/stock` | Stock by batch and location |
| `/dispatch-board` | Orders to dispatch |
| `/shortages` | Orders without enough stock |
| `/cellar-round` | Batch holds and analysis dates |
| `/stock-age` | Stock older than ninety days |
| `/excise-prep` | Movement evidence for the excise period |
| `/wet-review` | Orders classified for Australian wine tax review |
| `/compliance` | Missing record evidence |
| `/attention` | Overdue work and missing evidence |
| `/sales-book` | Recorded order values by currency |
| `/losses` | Recorded losses with supporting evidence |
| `/batch` | One batch and its history |
| `/trace` | Trace a lot to dispatched customers |
| `/receive` | Receive stock with a unique source reference |
| `/loss` | Record a stock loss |
| `/analyse` | Record a batch alcohol test |
| `/release` | Release a held batch |
| `/dispatch` | Dispatch an order |
| `/delivery` | Record delivery confirmation |
| `/log` | Add a note to a batch |
| `/add` | Create a product, batch or order |
| `/import` | Bring across supported Vinsight exports |
| `/export` | Export all domain records |
| `/draft-recall` | Draft a batch trace review |

All reads support `--json`. Names match without case sensitivity; a partial ID or code works only when unique. Ambiguity lists the candidates and exits with status 1.

## Create and update records

```bash
npm run beverage -- add product NEW-WINE "New Wine 750ml" --kind=wine --litres=0.75
npm run beverage -- add location CELLAR "Main cellar" --country=NZ --licence=YOUR-REFERENCE
npm run beverage -- add vessel TK03 "Third tank"
npm run beverage -- add customer NEW-CUSTOMER "New Customer"
npm run beverage -- add batch NEW26 --product=NEW-WINE --vessel=TK03 --date=2026-09-29 --source=YOUR-PRODUCTION-RECORD
npm run beverage -- analyse NEW26 12.5 --date=2026-09-29 --evidence=YOUR-LAB-RECORD
npm run beverage -- release NEW26
npm run beverage -- receive NEW26 CELLAR 120 --ref=RECEIPT-001 --evidence=YOUR-RECEIPT
npm run beverage -- add order SALE-001 --customer=NEW-CUSTOMER --location=CELLAR --due=2026-10-01 --tax=NZ-excise
npm run beverage -- add line SALE-001 NEW26 --units=24 --price=18 --currency=NZD
npm run beverage -- dispatch SALE-001 --carrier="Your carrier" --consignment=YOUR-CONSIGNMENT --duty=YOUR-REVIEWED-DUTY-REFERENCE
npm run beverage -- delivery SALE-001 --date=2026-10-01
npm run beverage -- loss NEW26 CELLAR 1 --ref=LOSS-001 --evidence="Breakage report reference"
npm run beverage -- log NEW26 "Operator note"
```

These are syntax examples. Replace every example reference and date with actual evidence. Product units mean individual sale units, not cartons. `litres_per_unit` converts them into liquid litres. Litres of alcohol equal liquid litres times measured ABV divided by 100. This is a physical volume, not a duty calculation. The free base does not model blends, fermentation inputs, recipes, purchase accounting, stock transfers or packaging conversion. Keep those source records and map them during customisation.

Dispatch is transactional and cannot overdraw a lot. A unique movement reference stops duplicate receipts. Movements cannot be updated or deleted. There is no CLI deletion route. Database owners can still alter their own database, so restricted database roles and external backups matter. Alcohol strength cannot be changed after dispatch because that would rewrite historical volume calculations. Correct disputed historical measurements through a reviewed migration that retains the original evidence.

## Ten questions to ask beyond a fixed dashboard

These are demonstrated queries in this build, not claims that Vinsight cannot produce a custom report.

1. Which overdue orders can we fill from released stock today? `dispatch-board`.
2. Which cider orders exceed the stock on hand? `shortages`.
3. Which held batches are missing alcohol strength or source evidence? `compliance`.
4. Which wine lots have sat more than ninety days, and where? `stock-age`.
5. Who received this lot, with which consignment reference? `trace PN26`.
6. Which losses have a recorded supporting document? `losses`.
7. What alcohol volume is represented by each stock movement? `excise-prep`.
8. Which orders need wine tax classification review? `wet-review`.
9. Which batches have no analysis in the last month? `cellar-round`.
10. What is due, held or missing evidence before the weekly meeting? `attention`.

## Your first hour: ten things to ask for

1. Set our business name and colours in brand.json.
2. Import our vessel list and compare the count.
3. Map our product export headings.
4. Define each sale unit in litres.
5. Add our storage sites and licence references.
6. Add a field for the winemaker responsible for each lot.
7. Change the analysis reminder to our documented house policy.
8. Add a view for our next dispatch day.
9. Add our own wording to the batch record.
10. Review our backup and restore procedure.

## Documents and views

`npm run docs` writes batch records, dispatch notes and excise evidence worksheets under `docs-out/`. `npm run view` writes stock, weekly work and record checks under `views/`. Both use `brand.json`, and print to PDF in a browser. They are static reports, without forms or a running web app. [Why no front end](docs/why-no-front-end.md) covers mobile, offline and drag-and-drop differences.

## Instead of Vinsight

[The switching guide](docs/replace-vinsight.md) explains the supported CSV imports and records that need mapping. Export your records using `npm run beverage -- export ./backup`. This is a JSON data snapshot, not a complete database backup or a tested restore operation. Retain separate database backups and test restoration before relying on them.

No return is filed, no tax payment is made and nothing is sent. The compliance command checks selected record evidence only. Tax classification, WET taxable value, exemptions, remissions, rates and statutory returns remain with the operator and their adviser.

## Licence

MIT. Not affiliated with or endorsed by Vinsight. Agent subscriptions, hosting and operations have their own costs.
