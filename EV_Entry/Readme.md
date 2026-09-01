# EV Entry automation

## Layout

Row 1 contains headers. Row 2 is a permanent intake buffer: staff enter or
scan a student ID into `B2`. Completed records begin at row 3, with the newest
record always at row 3.

| Column | Purpose |
| --- | --- |
| A | Entry date |
| B | Student ID |
| C | Engineering Village roster status |
| D | Training status |
| F | Entry timestamp |

`onEdit` accepts only a one-cell edit to `B2`. It adds a row below the intake
buffer, writes the entry to row 3, adds the two lookup formulas and timestamp,
and clears `B2`. Older records move down without being overwritten.

`dailyDateStamper` inserts one date-only row in Column A at midnight. During
the day, new records are inserted above it; the marker therefore moves down
with that day's records and clearly separates it from the preceding day.

`cleanDuplicateEntries` is designed for an hourly time trigger. For each
student, it keeps the earliest valid timestamp and removes later swipes made
within five minutes of that retained swipe. It ignores date markers and rows
without both an ID and a valid timestamp.

## One-time deployment

1. Back up the spreadsheet.
2. Replace the EV Entry project files with this folder's current scripts.
3. Run `prepareTopEntryLayout` manually once and authorize it. This inserts
   the Row 2 intake buffer and replaces the old C/D `ARRAYFORMULA`s with
   equivalent formulas stored on each existing record.
4. Ensure `onEdit` is an **installable** spreadsheet edit trigger, because it
   inserts rows. Keep the existing daily trigger pointed at `dailyDateStamper`.
   Add an hourly time trigger for `cleanDuplicateEntries`.
5. Test with a non-production or known test ID: it should appear in row 3 with
   its C/D statuses and timestamp, while B2 becomes blank again. Run
   `dailyDateStamper` once manually to verify the date-only separator row.

Do not place `ARRAYFORMULA`s in C or D after migration. Row-local formulas are
what allow data records to be inserted at the top safely.

## Logging and error handling

The intake, migration, and daily-stamp functions log their major checkpoints
and errors with an `[EV Entry]` prefix. Review them in the Apps Script editor's
**Executions** view when troubleshooting. Student IDs are intentionally not
written to logs.
