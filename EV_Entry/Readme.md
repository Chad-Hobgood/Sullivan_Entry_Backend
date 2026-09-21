# EV_Entry

Google Apps Script for the EV Design Studio entry workbook.

`Entry_Sheet/` contains the live intake workflow: scan an ID into `B2`, create a timestamped record at row 3, add daily date markers, and remove duplicate swipes. `Logging/` contains the functions that read the visit history and refresh dashboard data.

The entry workflow expects a tab named `EV Design studio` and writes analytics to `Dashboard_Data_Link`. Its single installable `processEvEntryEdit` trigger reads only student-ID columns from the private lookup workbook and writes status values, not roster details, into the entry workbook.

See [`../docs/README.md`](../docs/README.md) for deployment, trigger configuration, sheet layout, and troubleshooting.
