/**
 * Counts entry swipes and distinct users by school-year month (August-July).
 * Values are grouped by month of year across all available entry history.
 * Reads student IDs from column B and timestamps from column F.
 * Writes Month, Total Swipes, and Unique Users to Dashboard_Data_Link!AH:AJ.
 */
function calculateMonthlyEntryCounts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName('EV Design studio');
  const dashboardSheet = ss.getSheetByName('Dashboard_Data_Link');

  if (!sourceSheet) throw new Error('Sheet "EV Design studio" was not found.');
  if (!dashboardSheet) throw new Error('Sheet "Dashboard_Data_Link" was not found.');

  const months = [
    'August', 'September', 'October', 'November', 'December',
    'January', 'February', 'March', 'April', 'May', 'June', 'July',
  ];
  const buckets = months.map(() => ({ swipes: 0, users: new Set() }));
  const lastRow = sourceSheet.getLastRow();

  if (lastRow >= 2) {
    // Read B:F to capture the user ID and timestamp in one range.
    const rows = sourceSheet.getRange(2, 2, lastRow - 1, 5).getValues();
    rows.forEach((row) => {
      const userId = row[0];
      const timestamp = row[4];
      if (!(timestamp instanceof Date) || Number.isNaN(timestamp.getTime())) return;

      const month = timestamp.getMonth();
      const schoolMonthIndex = (month + 5) % 12; // August=0 ... July=11
      buckets[schoolMonthIndex].swipes++;
      const normalizedUserId = userId === '' || userId === null ? '' : String(userId).trim();
      if (normalizedUserId !== '') buckets[schoolMonthIndex].users.add(normalizedUserId);
    });
  }

  const output = [['Month', 'Total Swipes', 'Unique Users']];
  buckets.forEach((bucket, index) => {
    output.push([months[index], bucket.swipes, bucket.users.size]);
  });

  dashboardSheet.getRange('AH:AJ').clearContent();
  dashboardSheet.getRange(1, 34, output.length, 3).setValues(output);
  dashboardSheet.getRange('AH1:AJ1').setFontWeight('bold').setBackground('#f3f3f3');
  Logger.log('[Monthly Entry Logging] Wrote August-July monthly counts to AH:AJ.');
}
