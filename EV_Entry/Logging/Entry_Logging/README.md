# Logging

Analytics functions that read timestamps and student IDs from `EV Design studio` and overwrite metric tables in `Dashboard_Data_Link`.

The scripts produce arrival-by-hour, rolling-user, visit-frequency, visit-gap, regular-visitor, day-of-week, day/time, and monthly entry-count results. Monthly counts group all available history by month of year in August-July order. `../Logging_Handler.js` calls them in one Apps Script execution. Use the handler for scheduled refreshes; individual functions are still available for manual runs. The detailed output ranges are documented in [`../../../docs/PROJECT_GUIDE.md`](../../../docs/PROJECT_GUIDE.md).
