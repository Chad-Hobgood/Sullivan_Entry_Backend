/** Made by Chadwick Hobgood, 1/25/2026
 * 
 * This is designed to see how many people we have seen in the studio over the last interval
 * We do this dynamically with the timestamps
 */

function calculateRollingUserCounts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName("EV Design studio");
  const destSheet = ss.getSheetByName("Dashboard_Data_Link");

  // 1. Get IDs and Timestamps (Columns B and F)
  const lastRow = sourceSheet.getLastRow();
  if (lastRow < 2) return;
  // We get B through F to capture both ID (index 0) and Timestamp (index 4)
  const data = sourceSheet.getRange(2, 2, lastRow - 1, 5).getValues();

  // 2. Define Time Windows (Current time minus days)
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
  const twoWeeksAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
  const oneMonthAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

  // 3. Sets to store unique IDs for each period
  let last7Days = new Set();
  let last14Days = new Set();
  let last30Days = new Set();

  // 4. Loop through data
  data.forEach(row => {
    let userId = row[0];
    let timestamp = row[4]; // Column F

    if (userId && timestamp instanceof Date && !isNaN(timestamp)) {
      if (timestamp >= oneWeekAgo) last7Days.add(userId);
      if (timestamp >= twoWeeksAgo) last14Days.add(userId);
      if (timestamp >= oneMonthAgo) last30Days.add(userId);
    }
  });

  // 5. Prepare results for Columns I and J
  let results = [
    ["Time Period", "Unique Users"],
    ["Last 7 Days", last7Days.size],
    ["Last 14 Days", last14Days.size],
    ["Last 30 Days", last30Days.size]
  ];

  // 6. Write to Dashboard_Data_Link
  destSheet.getRange("I:J").clearContent();
  destSheet.getRange(1, 9, results.length, 2).setValues(results);

  // Formatting
  destSheet.getRange("I1:J1").setFontWeight("bold").setBackground("#f3f3f3");
  
  ss.toast("Rolling user counts updated!", "Success");
}
