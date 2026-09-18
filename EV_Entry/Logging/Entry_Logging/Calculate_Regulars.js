/**
 * Made by Chadwick Hobgood, 1/25/2026
 * This is bascially how we find the number of regulars
 * or users that have visited the space on a refular interval
 */
function calculateRegularVisitGaps() {
  //get the start and end locations of the data
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName("EV Design studio");
  const destSheet = ss.getSheetByName("Dashboard_Data_Link");

  const lastRow = sourceSheet.getLastRow();
  if (lastRow < 2) return;
  
  // Get User IDs (Col B) and Timestamps (Col F)
  const data = sourceSheet.getRange(2, 2, lastRow - 1, 5).getValues();

  // 1. Map all visit timestamps to each User ID (Ignoring empty timestamps)
  let userVisits = {};
  data.forEach(row => {
    let userId = row[0];
    let timestamp = row[4];
    if (userId && timestamp instanceof Date && !isNaN(timestamp)) {
      if (!userVisits[userId]) userVisits[userId] = [];
      userVisits[userId].push(timestamp.getTime());
    }
  });

  // 2. Calculate the average gap for each user (in days)
  let userAverages = [];
  for (let id in userVisits) {
    let times = userVisits[id].sort((a, b) => a - b);
    if (times.length > 1) {
      let totalGap = 0;
      for (let i = 1; i < times.length; i++) {
        totalGap += (times[i] - times[i-1]);
      }
      let avgGapMs = totalGap / (times.length - 1);
      let avgGapDays = avgGapMs / (1000 * 60 * 60 * 24);
      userAverages.push(avgGapDays);
    }
  }

  // 3. Define Distribution Buckets
  let distribution = {
    "Daily (0-2 days)": 0,
    "Weekly (2-8 days)": 0,
    "Bi-Weekly (8-16 days)": 0,
    "Monthly (16-31 days)": 0,
    "Occasional (31+ days)": 0
  };

  userAverages.forEach(gap => {
    if (gap <= 2) distribution["Daily (0-2 days)"]++;
    else if (gap <= 8) distribution["Weekly (2-8 days)"]++;
    else if (gap <= 16) distribution["Bi-Weekly (8-16 days)"]++;
    else if (gap <= 31) distribution["Monthly (16-31 days)"]++;
    else distribution["Occasional (31+ days)"]++;
  });

  // 4. Prepare Data for Columns O and P
  let results = [["Avg. Days Between Visits", "User Count"]];
  for (let bucket in distribution) {
    results.push([bucket, distribution[bucket]]);
  }

  // 5. Write to Dashboard (Columns O and P)
  destSheet.getRange("O:P").clearContent();
  // Column 15 is O
  destSheet.getRange(1, 15, results.length, 2).setValues(results);
  destSheet.getRange("O1:P1").setFontWeight("bold").setBackground("#f3f3f3");

  ss.toast("Visit frequency distribution updated in Columns O:P!", "Success");
}
