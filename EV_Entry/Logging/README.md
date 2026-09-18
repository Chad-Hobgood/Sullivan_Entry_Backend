# Logging

This directory coordinates logging-related automation.

- `Logging_Handler.js` is the single trigger entry point for refreshing all entry metrics.
- `Entry_Logging/` contains the individual analytics functions.
- `Equipment Logging/` is reserved for future equipment metrics.

Create one time-driven trigger for `runLoggingUpdates`. Do not create separate triggers for the functions in `Entry_Logging`; they remain available for manual runs and future reuse.

The handler writes start, completion, step, and error messages to the Apps Script execution log with the `[Logging Handler]` prefix. Open **Executions** in the Apps Script editor to follow a run.
