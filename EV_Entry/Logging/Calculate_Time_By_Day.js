/**
 * Builds a day-of-week by time-of-day grid for the EV Entry dashboard.
 *
 * The output begins at Dashboard_Data_Link!U1:
 *   - Column U contains the day labels.
 *   - Columns V:AF contain hourly time buckets from 12 PM through 10 PM.
 *   - Each cell contains the number of valid entries for that day/hour.
 *   - The 20 busiest day/time pairs are listed below the grid.
 */
function calculateTimeOfDayByDay() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName('EV Design studio');
  const dashboardSheet = ss.getSheetByName('Dashboard_Data_Link');

  if (!sourceSheet) {
    throw new Error('Sheet "EV Design studio" was not found.');
  }
  if (!dashboardSheet) {
    throw new Error('Sheet "Dashboard_Data_Link" was not found.');
  }

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const displayOrder = [1, 2, 3, 4, 5, 6, 0];
  const startHour = 12; // 12 PM
  const endHour = 22; // 10 PM
  const hourCount = endHour - startHour + 1;
  const counts = dayNames.map(() => Array(hourCount).fill(0));
  const lastRow = sourceSheet.getLastRow();

  if (lastRow >= 3) {
    const timestamps = sourceSheet.getRange(3, 6, lastRow - 2, 1).getValues();
    timestamps.forEach(([timestamp]) => {
      if (!(timestamp instanceof Date) || isNaN(timestamp)) return;

      const hour = timestamp.getHours();
      if (hour < startHour || hour > endHour) return;

      const dayPosition = displayOrder.indexOf(timestamp.getDay());
      counts[dayPosition][hour - startHour]++;
    });
  }

  const timeHeaders = Array.from({ length: hourCount }, (_, index) => {
    const hour = startHour + index;
    const displayHour = hour % 12 || 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    return `${displayHour} ${ampm}`;
  });

  const output = [
    ['Day / Time', ...timeHeaders],
    ...dayNames.map((dayName, index) => [dayName, ...counts[index]]),
  ];

  // The fixed-size output is overwritten in place on each execution.
  dashboardSheet.getRange(1, 21, output.length, output[0].length).setValues(output);
  dashboardSheet.getRange('U1:AF1')
    .setFontWeight('bold')
    .setBackground('#f3f3f3');
  dashboardSheet.getRange('U2:U8').setFontWeight('bold');

  const rankedPairs = [];
  counts.forEach((dayCounts, dayIndex) => {
    dayCounts.forEach((count, hourIndex) => {
      rankedPairs.push({
        day: dayNames[dayIndex],
        dayIndex,
        hour: startHour + hourIndex,
        count,
      });
    });
  });

  rankedPairs.sort((a, b) =>
    b.count - a.count || a.dayIndex - b.dayIndex || a.hour - b.hour,
  );

  const topPairs = [
    ['Rank', 'Day', 'Time', 'Entries'],
    ...rankedPairs.slice(0, 20).map((pair, index) => [
      index + 1,
      pair.day,
      formatTimeOfDay(pair.hour),
      pair.count,
    ]),
  ];

  // The list always has 20 ranked rows, including zero-count pairs.
  dashboardSheet.getRange(10, 21, topPairs.length, topPairs[0].length).setValues(topPairs);
  dashboardSheet.getRange('U10:X10')
    .setFontWeight('bold')
    .setBackground('#f3f3f3');

  ss.toast('Time-of-day by day grid updated!', 'Success');
}

function formatTimeOfDay(hour) {
  const displayHour = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${displayHour} ${ampm}`;
}
