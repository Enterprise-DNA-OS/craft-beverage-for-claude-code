# Bring your records from Vinsight

Checked 29 September 2026. Vinsight documents downloading CSV from the bottom of a list. Its vessel example names the columns `Vessel Code` and `Description`: [bulk editing with spreadsheets](https://docs.vinsight.net/bulk-editing-information-using-spreadsheets).

1. In Vinsight, open the vessel list, select the required records and use Download, then CSV. Keep the original export unchanged.
2. Save the file in a dedicated import folder with a name starting with `Vessels`, such as `Vessels - All Report.csv`.
3. Run `npm run beverage -- import vinsight ./imports --dry-run`.
4. Review the counts, then repeat without `--dry-run`. Check `vessels --json` against the source.

The whole folder imports in one transaction. A failure rolls back every row. Repeating an import updates names using stable codes. No stock movements are created by an import.

## Supported files

| File prefix | Required columns | Result |
|---|---|---|
| Vessels | Vessel Code, Description | Vessel reference and description |
| StockItems | Stock Item Code, Description, Kind, Litres Per Unit | Product reference, description, classification and individual sale-unit volume |
| Contacts | Contact Code, Name | Contact reference and name; Email is optional |

Only the vessel headings above are verified from the vendor's published example. Product and contact headings are this importer’s mapping contract, not a claim about every Vinsight account's export. `Kind` and `Litres Per Unit` must be deliberately supplied or mapped after checking what the stock unit means. Kind is wine, cider, spirit or beer. A carton needs conversion into individual units before loading quantities.

For differing headings, provide `--map=column-map.json`:

```json
{
  "products": {"Stock Item Code": "Your actual code heading", "Description": "Your actual description heading", "Kind": "Your reviewed category", "Litres Per Unit": "Your verified litre size"},
  "contacts": {"Contact Code": "Your actual customer code", "Name": "Your actual name heading"}
}
```

Mapping values are column names, not constants. Add a reviewed classification column to a working copy if the export has none. Unsupported files, malformed CSV, missing required fields, invalid unit sizes and a changed size on an existing product fail the transaction. BOM, CRLF, quoted commas, embedded newlines and doubled quotes are supported. Fixtures under tests/fixtures are synthetic examples, never presented as real customer exports.

## Records that need a migration plan

The importer does not bring across production operations, blends, analyses, batch composition, purchase orders, sales history, stock balances, attachments, WET settings or excise returns. Preserve those exports and supporting documents. Add batches with their source references, add verified opening stock as receipt movements, and reconcile batch/location quantities before dispatching anything. Enterprise DNA scopes the mapping of deeper history as part of customisation. A one-command reference-data import is not a promise of a complete same-day switch.

Run both systems until product counts, stock units, batches, sales evidence and the records required by your adviser reconcile. Keep Vinsight accessible until that review is complete. Never cancel it solely because the importer passed.
