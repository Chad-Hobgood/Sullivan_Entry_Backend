# Sullivan EV Entry: Project Guide

## Purpose

Sullivan EV Entry is a Google Apps Script project for recording visits to the EV Design Studio and turning that history into dashboard-ready usage metrics. It is designed to reduce manual lab-assistant work while preserving a simple, readable attendance log.

The scripts are intended to be copied into or maintained as a bound Apps Script project for the entry workbook. They are not a standalone Node.js application and do not have a local package or test runner.

## Repository layout

```text
EV_Entry/
├── Authorize_Entry.js       Manual authorization check
├── Entry_Sheet/             Intake and log-maintenance scripts
├── Equipment_Usage/         Reserved for future automation
└── Logging/                 Dashboard metric scripts
docs/                        Project documentation
```

Each source file is a separate Apps Script file. Functions share the spreadsheet context and can therefore refer to the same workbook tabs.

## Workbook contract

The active entry workbook must contain these tabs:

| Tab | Role |
| --- | --- |
| `EV Design studio` | Entry history and intake area |
| `Dashboard_Data_Link` | Dashboard source tables |

The entry sheet uses this layout:

| Location | Meaning |
| --- | --- |
| Row 1 | Headers |
| `B2` | Permanent intake cell for a scanned or typed student ID |
| Row 3 onward | History, with newest records inserted at row 3 |
| Column A | Date-only daily separator rows |
| Column B | Student ID |
| Column C | Engineering Village roster status |
| Column D | Training status |
| Column F | Visit timestamp |

The shared configuration is defined at the top of `Entry_Sheet/OnEdit_Entry.js`. It contains the entry tab name, lookup workbook ID, lookup tab names, and source columns. Update that configuration if the workbook structure changes.

## Entry workflow

1. A staff member scans or types an ID into `EV Design studio!B2`.
2. The installable `onEdit` handler accepts only a single-cell edit to that exact cell.
3. The script obtains a document lock so simultaneous scans do not collide.
4. It reads only IDs from the configured private roster and certification sheets.
5. It inserts a row below the intake row, writes the new record at row 3, and clears `B2`.
6. Existing history moves down; no existing record is overwritten.

The script writes two derived values: `EV Student` or `Not EV Student`, and `Completed Training` or `Not Done Training`. Names, email addresses, and other lookup fields are not copied into the entry workbook.

`dailyDateStamper` should run once per day, normally at midnight. It inserts a date-only row at row 3, so scans made that day appear above the marker and the marker moves down with the day's records.

`cleanDuplicateEntries` should run hourly. For each student, it sorts valid timestamps chronologically, keeps the earliest swipe in each five-minute window, and removes later duplicates. It also removes fully empty rows. Date markers, partial rows, and rows without valid timestamps are preserved.

## Logging and dashboard outputs

The logging scripts read IDs from column B and timestamps from column F unless noted otherwise. Most functions clear their destination columns before writing a fresh table.

| Function | Output | Description |
| --- | --- | --- |
| `calculateArrivalDistribution` | `A:D` | Counts entries by hour for the whole year, January-May, and August-December. |
| `calculateUserFrequency` | `F:G` | Counts unique users and groups them into 1, 2-9, and 10+ visits. |
| `calculateRollingUserCounts` | `I:J` | Counts unique users in the last 7, 14, and 30 days. |
| `calculateDetailedVisitGaps` | `L:M` | Counts users by average gap between visits, capped at a 90+ day bucket. |
| `calculateRegularVisitGaps` | `O:P` | Groups users by daily, weekly, bi-weekly, monthly, or occasional average visit gaps. |
| `calculateDayOfWeekDistribution` | `R:S` | Reports average users per weekday, normalized by the number of observed dates. |
| `calculateTimeOfDayByDay` | `U:AF`, then `U10:X30` | Writes a Monday-Sunday by 12 PM-10 PM grid and the 20 busiest day/time pairs. |

The analytics functions expect valid JavaScript `Date` values in the timestamp column. Invalid or missing timestamps are ignored. The rolling counts use the execution time as “now,” so results change depending on when the function runs.

## Deployment

Before changing a production workbook, make a spreadsheet backup.

1. Copy the current files into the bound Apps Script project.
2. Confirm the entry tab is named `EV Design studio` and the dashboard tab is named `Dashboard_Data_Link`.
3. Confirm the lookup workbook ID and lookup sheet names in `EV_ENTRY_CONFIG`.
4. Run `authorizeScript` manually and accept the requested permissions.
5. Run `prepareTopEntryLayout` once if migrating an older bottom-appending layout. Review the function comments and back up first; it inserts the intake row and rebuilds columns C and D as values.
6. Create an installable spreadsheet “On edit” trigger for `onEdit`.
7. Point a daily time-driven trigger at `dailyDateStamper`.
8. Point an hourly time-driven trigger at `cleanDuplicateEntries`.
9. Run the logging functions manually once to confirm that the dashboard tables populate, then schedule only the refreshes the dashboard needs.

The account authorizing the script must be able to open the private lookup workbook. Lab assistants who only use the entry workbook do not need direct access to that lookup workbook.

## Privacy and data handling

The lookup integration intentionally reads only student-ID columns and converts matches into two status values. Do not replace this with `IMPORTRANGE`, `ARRAYFORMULA`, or other formulas that expose the private workbook to entry-workbook editors.

Historical status values are snapshots. If roster or training membership changes later, old rows do not automatically recalculate. A separate, deliberate refresh process would be needed if historical statuses must be updated.

Student IDs are not written to the diagnostic and operational log messages. Use the Apps Script editor's **Executions** view to inspect errors and checkpoints.

## Troubleshooting

### A scan does nothing

Check that the edit is a single-cell edit to `B2`, the sheet name matches exactly, and the trigger is installable rather than a simple trigger. Then inspect the execution log. The trigger owner also needs access to the private lookup workbook.

### A missing-sheet error appears

Verify `EV Design studio`, `Dashboard_Data_Link`, `Current_Roster`, and `Moodle Certs` against the configured names. `diagnoseEvEntryConfiguration` reports the active workbook, available tabs, and lookup access without logging IDs.

### Duplicate rows remain

`cleanDuplicateEntries` only considers rows with both a student ID and a valid timestamp. It keeps the earliest timestamp and removes later timestamps within five minutes. Partial rows and date-only markers are intentionally retained.

### Dashboard values look stale

Run the relevant logging function manually and confirm that its output range is not being overwritten by another sheet formula or process. Check that timestamps are stored as dates, not text.

## Safe change guidelines

- Keep `B2` as the intake cell unless the configuration and deployment instructions are updated together.
- Preserve the document lock around operations that insert or delete rows.
- Treat `Dashboard_Data_Link` as an interface: changing an output range can break dashboard charts.
- Test with a known non-production ID before enabling a trigger.
- Back up the workbook before running migration or cleanup changes.
