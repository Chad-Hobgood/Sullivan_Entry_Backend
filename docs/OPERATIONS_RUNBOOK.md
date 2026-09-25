# Operations Runbook

## Before deployment

1. Back up the production spreadsheet before migration or cleanup changes.
2. Copy the repository's Apps Script files into the bound project, preserving their shared global function names.
3. Confirm `EV Design studio`, `Dashboard_Data_Link`, and `Equipment Usage` exist and follow the [workbook contract](PROJECT_GUIDE.md#workbook-contracts).
4. Review `EV_ENTRY_CONFIG` in `Entry_Sheet/OnEdit_Entry.js`. Confirm the private workbook ID, tab names, and ID columns are correct. Do not put private names or lookup records into the entry workbook.
5. If upgrading an older bottom-appending sheet, inspect `prepareTopEntryLayout` and run it manually once before installing the new trigger. This inserts row 2 and rebuilds historical status values; it is not a routine maintenance function.

## Authorization and triggers

Run `authorizeScript` manually as the account that will own production triggers. Accept authorization and confirm logs report access to both the entry workbook and private lookup workbook. Then run `diagnoseEvEntryConfiguration` and confirm the entry tab and lookup tabs are found.

Run `installEvEntryEditTrigger` once as that same account. It removes that account's existing `onEdit` or `processEvEntryEdit` installable triggers and creates one installable spreadsheet edit trigger for `processEvEntryEdit`. Apps Script triggers are user-owned: remove obsolete edit triggers owned by other accounts separately. Do not create a simple `onEdit` function.

Create time-driven triggers owned by an authorized account:

| Schedule | Handler | Purpose |
| --- | --- | --- |
| Once per day, near midnight | `dailyDateStamper` | Adds the daily separator at row 3. |
| Hourly | `cleanDuplicateEntries` | Removes repeated swipes within five minutes and fully empty rows. |
| Scheduled dashboard refresh | `runLoggingUpdates` | Refreshes all entry and equipment dashboard tables in one execution. |

Run `runLoggingUpdates` manually once before scheduling it. Verify tables on `Dashboard_Data_Link`, then remove superseded time triggers for individual metric functions.

## Routine operation

- Staff scan or type an ID into `EV Design studio!B2`; successful records appear in row 3 and the intake cell is cleared.
- Equipment selections are made in `Equipment Usage!B1`; the shared edit trigger records them at row 2 and resets B1.
- Check Apps Script **Executions** for trigger failures and logs. Handler checkpoints use `[Logging Handler]`; entry and equipment scripts use their own prefixes.
- Run one metric manually to refresh its table during diagnosis. Avoid concurrent manual runs and scheduled runs if inspecting output during a refresh.

## Troubleshooting

### Entry is not recorded

Confirm the edit was a single-cell change to `EV Design studio!B2`, the active project is bound to that workbook, and an installable `processEvEntryEdit` trigger is owned by an account with lookup access. Run `diagnoseEvEntryConfiguration`. Confirm `Current_Roster` and `Moodle Certs` exist and contain IDs in the configured columns.

### The intake value remains after an error

Check **Executions** for lookup, authorization, missing-sheet, or lock errors. The handler intentionally clears B2 only after it writes the row, and only if B2 still contains the ID for that event. A newer value is preserved.

### Lock timeout

The five-second setting is a bounded wait. A failed acquisition makes no sheet changes for that operation. Inspect overlapping running, failed, or timed-out executions; do not try to forcibly clear a lock. Locks are owned by executions and are released in `finally` or when the execution terminates.

### Equipment selection is not recorded

Confirm the tab is exactly `Equipment Usage`, the edit is a single-cell selection in B1, and the shared installable `processEvEntryEdit` trigger exists. Confirm B1 has a supported dropdown value and inspect execution logs.

### A logging step fails or dashboard data is stale

Open **Executions** and find the first failed `[Logging Handler]` step; later steps will not have run. Confirm required sheet names and that timestamps are actual dates rather than text. Check that dashboard formulas or another process are not writing inside the metric's owned range. See [metric definitions and ranges](METRIC_REFERENCE.md).

### Duplicate rows remain

Cleanup requires both a nonblank ID and valid timestamp. It retains the earliest event in each rolling five-minute sequence per ID. Date markers, partial rows, and invalid-timestamp rows are preserved; fully empty rows are removed.

## Safe maintenance

- Take a backup before running migration or bulk cleanup.
- Do not edit the active intake cell or perform migration while changing trigger ownership.
- After changing a sheet name, source column, or dashboard range, update `EV_ENTRY_CONFIG` or the metric implementation and this documentation together.
- Never log student IDs or copy private roster fields into diagnostic output.
- This repository has no local Apps Script runtime or test runner. Validate behavior with a non-production workbook or a controlled spreadsheet copy before enabling production triggers.
