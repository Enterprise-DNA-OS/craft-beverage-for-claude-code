# Record checks for drinks makers

Sources checked 29 September 2026. This system prepares records for review. It does not certify compliance, calculate excise or WET, decide eligibility for exemptions, lodge a return or pay tax.

## New Zealand

[NZ Customs: alcohol record keeping](https://www.customs.govt.nz/business/excise/alcohol-and-excise/record-keeping-obligations-for-alcohol-licenced-manufacturing-areas-and-off-site-storage) describes production, stock, loss, sales and transport evidence. It requires records to be retained for at least seven years, backed up and accessible. Check the location of stored records and any overseas-storage permission. The CLI preserves movement history and exports all domain records, but does not enforce retention or verify backups.

[NZ Customs: moving excise-unpaid products](https://www.customs.govt.nz/business/excise/alcohol-and-excise/moving-products-excise-unpaid) explains when approval is needed and the evidence to retain for movements between controlled areas. The free base does not implement underbond transfers. Carrier, consignment and delivery checks also serve as a conservative dispatch checklist. A missing delivery date is not itself proof of a statutory breach.

[Customs changes effective 10 September 2026](https://www.customs.govt.nz/about-us/news/important-notices/amended-customs-regulations-take-effect-on-10-september-2026) modernise access to electronic records. This build does not calculate filing or payment deadlines.

## Australia

[ATO: distillation, section 11.3.5](https://www.ato.gov.au/law/view/document?LocID=%22SAV%2FALCOHOL%2FFT11.3.1%22&PiT=99991231235958) describes records of receipts, production inputs and outputs, waste, holdings, deliveries and duty evidence. Keep the detailed production records outside this base as well as the linked reference. A filled-in reference does not prove a document exists or is sufficient.

[ATO: wine](https://www.ato.gov.au/law/view/document?LocID=%22SAV%2FALCOHOL%2FFT14.4.1%22&PiT=99991231235958) distinguishes wine tax from excise. The `AU-WET` label is an operator decision. The wine tax review shows recorded line values by currency, not taxable wholesale value, tax payable or rebate entitlement. The operator must verify the treatment of each product and dealing. Do not classify cider solely from its name.

## Implemented checks

| Rule | Checks | Source or scope |
|---|---|---|
| BATCH-EVIDENCE | Missing measured strength or source production reference | Record preparation supporting the NZ and ATO sources above |
| LICENCE-REFERENCE | Missing licence reference on a location | Operator evidence checklist; does not validate licence status |
| DISPATCH-EVIDENCE | Missing carrier, consignment or reviewed duty reference on dispatched orders | NZ transport evidence and ATO delivery records |
| TAX-CLASSIFICATION | Orders still marked for review | Internal block against assuming tax treatment |
| STOCK-NEGATIVE | Negative batch/location movement balance | Internal reconciliation check supporting stock records |
| DELIVERY-CONFIRMATION | Dispatched order without a delivery date | Internal follow-up supporting movement evidence |

`release` requires source evidence, measured strength and a test within the previous 30 days. The 30-day reminder and 90-day stock ageing report are house rules, not statutory limits. Set them to the documented policy of your business. Dispatch checks release, quantities, location country and evidence references in one transaction. It cannot validate a permit or decide whether a sale is authorised.

Before operating, agree jurisdiction-specific obligations with the responsible adviser, configure database access, document backup and restore, reconcile all opening stock and retain original evidence.
