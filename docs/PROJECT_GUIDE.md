# Sullivan EV Entry Project Guide

## Purpose and boundaries

Sullivan EV Entry is a bound Google Apps Script project for capturing visits to the EV Design Studio, maintaining the attendance history, and refreshing dashboard source tables. It runs in the spreadsheet's Apps Script environment; this repository has no local package manager or automated test runner.

The repository contains script source and operational documentation. It does not contain the production workbook or the private roster workbook. Apps Script files in this repository are separate files in one bound project and share global functions and configuration.

## Repository map

| Path | Responsibility |
| --- | --- |
| `EV_Entry/Entry_Sheet/` | Entry trigger, daily date markers, duplicate cleanup, and one-time top-entry migration. |
| `EV_Entry/Equipment_Usage/` | Records equipment dropdown selections and timestamps. |
| `EV_Entry/Logging/Logging_Handler.js` | Sequential refresh entry point for all dashboard metrics. |
| `EV_Entry/Logging/Entry_Logging/` | Attendance and entry analytics. |
| `EV_Entry/Logging/Equipment_Logging/` | Equipment usage summary. |
| `EV_Entry/Authorize_Entry.js` | Manual authorization check for the active and private lookup workbooks. |
| `docs/` | Detailed system, metric, and operations documentation. |

The short README files beside source areas summarize the files and link here. Use the [metric reference](METRIC_REFERENCE.md) for formulas, inputs, and output contracts, and the [operations runbook](OPERATIONS_RUNBOOK.md) for setup and incident response.

## Workbook contracts

### Entry workbook

The bound workbook must include these tabs:

| Tab | Role |
| --- | --- |
| `EV Design studio` | Scan intake and visit history. |
| `Dashboard_Data_Link` | Tables consumed by dashboard charts. |
| `Equipment Usage` | Equipment dropdown intake and equipment history. |

`EV_ENTRY_CONFIG` in `Entry_Sheet/OnEdit_Entry.js` is the authoritative configuration for entry and private lookup names/columns.

| Location in `EV Design studio` | Contract |
| --- | --- |
| Row 1 | Column labels. |
| `B2` | Permanent scan/type intake cell. |
| Row 3 onward | Visit history and date-only markers; newest records/markers are inserted at the top. |
| A | Date-only daily separators. |
| B | Student ID. |
| C | Roster status snapshot (`Approved Entry` or `Not Approved Entry`). |
| D | Training status snapshot (`Completed Training` or `Not Done Training`). |
| F | Visit timestamp. |

Column E is currently unused by this workflow. Preserve IDs in B and real date values in F for analytics. Marker rows have a date in A and no visit timestamp; analytics ignore them.

### Private lookup workbook

The lookup workbook ID and tab details are held in `EV_ENTRY_CONFIG`. The script reads only the configured student-ID columns: `Current_Roster!C2:C` and `Moodle Certs!D3:D`. It writes only derived status strings into the entry workbook. The installable trigger owner must have access to the private workbook; ordinary entry operators do not need that access.

### Equipment workbook tab

`Equipment Usage!B1` is the selection dropdown. Each selection is recorded in B with its timestamp in C, newest first from row 2 onward. Dropdown choices can be inline or range-backed; the summary logger seeds the configured choices so unused items have zero counts.

## Data flow

1. An installable spreadsheet edit trigger calls `processEvEntryEdit` for edits. It first offers the same event to `handleEquipmentUsageEdit`, which ignores all but `Equipment Usage!B1`.
2. For `EV Design studio!B2`, the entry handler captures the event's ID, reads lookup IDs and derives statuses, then takes a document lock for inserting row 3 and writing the record. It clears B2 only if it still contains the ID processed by that event, protecting a newer scan.
3. `dailyDateStamper` inserts a date-only row at row 3 once daily. New visits later insert above it.
4. `cleanDuplicateEntries` examines history by timestamp, keeps the earliest swipe among repeated same-ID swipes within five minutes, and removes fully empty rows.
5. `runLoggingUpdates` runs metric functions in order. Each metric writes its own table to `Dashboard_Data_Link`; see the [metric reference](METRIC_REFERENCE.md).

The entry handler, date stamper, cleanup, and equipment recording use a shared document lock for sheet mutations. Lock acquisition is bounded by `lockWaitMs` (currently five seconds); it limits waiting, not the lifetime of a lock.

## Design constraints

- Keep the intake address (`B2`), sheet names, and source columns aligned with `EV_ENTRY_CONFIG` and this workbook contract.
- Keep `processEvEntryEdit` as a non-reserved name and configure it as an installable edit trigger. Do not add or retain an `onEdit` simple trigger for the same workflow.
- Preserve the document lock around row insertion/deletion and associated writes.
- Treat dashboard ranges as a public interface to charts. Coordinate any output-range change with dashboard consumers and update the metric reference.
- Do not log student IDs or copy roster names/email addresses into this workbook.
- `prepareTopEntryLayout` is a one-time migration with sheet-changing behavior; back up first and follow the runbook.

## Further reading

- [Metric reference](METRIC_REFERENCE.md): calculation definitions, assumptions, and exact output ranges.
- [Operations runbook](OPERATIONS_RUNBOOK.md): deployment, trigger ownership, routine refresh, and troubleshooting.

## Documentation maintenance map

| Change | Update |
| --- | --- |
| Entry tab name, intake cell, or source columns | `EV_ENTRY_CONFIG`, this guide's workbook contract, and the runbook checks. |
| A dashboard metric, its meaning, or its destination | The metric implementation, handler list if scheduled, and `METRIC_REFERENCE.md`. |
| Trigger installation or schedule | `OPERATIONS_RUNBOOK.md` and the relevant short area README if its entry point changes. |
| New folder or script responsibility | The root repository map and the corresponding area README. |
