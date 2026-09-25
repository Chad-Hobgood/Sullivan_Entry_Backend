# Dashboard Metric Reference

All tables below are written to `Dashboard_Data_Link` and are part of the workbook interface. Entry metrics read `EV Design studio` IDs from B and timestamps from F unless stated otherwise. Rows without valid JavaScript date timestamps are excluded from timestamp-based metrics. The month logger counts a swipe with a valid timestamp even if its ID is blank; that row does not contribute to unique-user counts.

| Function | Output | Calculation |
| --- | --- | --- |
| `calculateArrivalDistribution` | `A:D` | 24 hour rows with whole-history, January-May, and August-December swipe totals. Months are month-of-year across all history; June and July are present only in Whole Year. |
| `calculateUserFrequency` | `F:G` | Counts IDs across the sheet (including rows without timestamps), then reports total unique IDs and how many IDs appear once, 2-9 times, or 10+ times. |
| `calculateRollingUserCounts` | `I:J` | Distinct IDs with valid timestamps at or after execution time minus 7, 14, and 30×24 hours. Windows are inclusive at the lower bound and are not calendar weeks/months. |
| `calculateDetailedVisitGaps` | `L:M` | For each ID with at least two valid visits, computes the mean elapsed gap in days, rounds to nearest whole day, caps values above 90 into the `90+ Days` bucket, and reports the number of users per bucket. |
| `calculateRegularVisitGaps` | `O:P` | For each ID with at least two valid visits, groups its unrounded mean elapsed gap into Daily (≤2), Weekly (>2 to 8), Bi-Weekly (>8 to 16), Monthly (>16 to 31), or Occasional (>31) days. |
| `calculateDayOfWeekDistribution` | `R:S` | Total valid timestamped swipes per weekday divided by the number of distinct observed calendar dates for that weekday. Display order is Monday-Sunday. |
| `calculateTimeOfDayByDay` | `U:AF`; ranked list `U10:X30` | A Monday-Sunday grid of swipe counts in the 12 PM through 10 PM hours inclusive, plus all 20 day/hour combinations ranked by count. Ties retain Monday-first, then earlier-hour order. |
| `calculateMonthlyEntryCounts` | `AH:AJ` | Twelve rows ordered August-July. Groups all available history by month-of-year (not by a single school-year instance); columns contain swipe count and distinct nonblank IDs. The same person in different school years is one unique user in that month bucket. |
| `calculateEquipmentUsageCounts` | `AL:AM` | Counts values from `Equipment Usage!B2:B`. Includes configured nonblank dropdown options with zero counts and sorts labels alphabetically. |

## Refresh and clearing behavior

Most functions clear their owned full columns before writing. `calculateTimeOfDayByDay` overwrites its fixed-sized grid and top-pairs table. `calculateMonthlyEntryCounts` clears AH:AJ and writes 13 rows (header plus 12 months); equipment clears AL:AM and writes one row per configured/recorded option plus a header. Keep unrelated dashboard formulas and tables outside these owned ranges.

`runLoggingUpdates` invokes the eight entry metrics and the equipment metric sequentially. A failed step is logged with its function name and error and is rethrown, so later metrics do not run in that execution. Each function can also be run manually from the Apps Script editor.

## Interpretation notes

- Counts describe rows/swipes, not necessarily distinct visits after data cleanup. Run the cleanup trigger to suppress same-person repeats within five minutes.
- The all-history month table is intended for seasonal month-of-year comparison. It does not represent only the current August-to-July school year.
- `calculateDayOfWeekDistribution` uses the timestamp's local `Date` fields for weekday, then derives observed date strings through `toISOString()`. Review spreadsheet timezone behavior if date boundaries appear shifted.
- Some older metrics return early when the source has no data, leaving their previous output visible. Monthly counts explicitly write zero buckets when no valid history is found.
- The time/day grid includes hours 12:00 through 22:00 only; earlier and later entries do not appear there.
