# EV_Entry

Apps Script source for the EV Design Studio attendance workbook. `Entry_Sheet/` captures and maintains visit history, `Equipment_Usage/` records dropdown selections, and `Logging/` refreshes dashboard tables.

The workbook uses `EV Design studio`, `Dashboard_Data_Link`, and `Equipment Usage`. The installable `processEvEntryEdit` trigger reads IDs from the private lookup workbook and stores only status values in the attendance history.

See the [project guide](../docs/PROJECT_GUIDE.md) for architecture and sheet contracts and the [operations runbook](../docs/OPERATIONS_RUNBOOK.md) for deployment and operations.
