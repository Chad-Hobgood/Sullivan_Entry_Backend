/** Made by Chadwick Hobgood, 1/25/2026
 * 
 * This counts the number of times that people come into the space
 * So that the 
 */

function calculateUserFrequency() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName("EV Design studio");
  const destSheet = ss.getSheetByName("Dashboard_Data_Link");

  // 1. Get User IDs from Column B (Starting row 2)
  const lastRow = sourceSheet.getLastRow();
  if (lastRow < 2) return;
  const userData = sourceSheet.getRange(2, 2, lastRow - 1, 1).getValues();

  // 2. Count occurrences of each User ID
  let userCounts = {};
  userData.forEach(row => {
    let userId = row[0];
    if (userId !== "" && userId !== null) {
      userCounts[userId] = (userCounts[userId] || 0) + 1;
    }
  });

  // 3. Categorize users based on frequency
  let uniqueUsers = Object.keys(userCounts).length;
  let exactlyOnce = 0;
  let betweenTwoAndNine = 0;
  let tenOrMore = 0;

  for (let id in userCounts) {
    let count = userCounts[id];
    if (count === 1) {
      exactlyOnce++;
    } else if (count > 1 && count < 10) {
      betweenTwoAndNine++;
    } else if (count >= 10) {
      tenOrMore++;
    }
  }

  // 4. Prepare the table for Columns F and G
  let results = [
    ["User Metric", "Count"],
    ["Total Unique Users", uniqueUsers],
    ["Visited Exactly Once", exactlyOnce],
    ["Visited 2-9 Times", betweenTwoAndNine],
    ["Visited 10+ Times", tenOrMore]
  ];

  // 5. Write to Dashboard_Data_Link (Columns F & G)
  // We clear F:G first to ensure old data doesn't linger
  destSheet.getRange("F:G").clearContent();
  destSheet.getRange(1, 6, results.length, 2).setValues(results);

  // Formatting
  destSheet.getRange("F1:G1").setFontWeight("bold").setBackground("#f3f3f3");
  
  ss.toast("User frequency metrics updated!", "Success");
}
