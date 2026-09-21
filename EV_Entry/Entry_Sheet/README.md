# Entry_Sheet

Scripts for capturing and maintaining EV Design Studio visits.

- `OnEdit_Entry.js`: processes a single ID entered in `B2`, checks private lookup lists, and inserts the newest record at row 3.
- `Daily_Date_Stamper.js`: inserts a date-only marker at row 3 for a new day.
- `Clean_Log.js`: removes duplicate swipes within five minutes and fully empty rows.

These scripts use the shared `EV_ENTRY_CONFIG` in `OnEdit_Entry.js`. `processEvEntryEdit` must run as the single installable spreadsheet edit trigger; do not rename it to the reserved simple-trigger name `onEdit`.
