# Equipment_Logging

Logging functions for equipment usage data.

`Calculate_Equipment_Usage.js` reads the options configured in `Equipment Usage!B1`, counts the recorded equipment values in `B2:B`, and writes every option—including unused options with a count of `0`—to `Dashboard_Data_Link!AH:AI`. The function is called by `runLoggingUpdates()`.
