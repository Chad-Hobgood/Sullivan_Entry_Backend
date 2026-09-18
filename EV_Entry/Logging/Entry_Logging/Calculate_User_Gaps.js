/** Made by Chadwick Hobgood, 1/25/2026
 * 
 * This is a function that finds the gaps between visits
 * The goal is to see the amount of people that return at an interval of x days
 * We want to see the ammount of ppl that come back to see if any metrics there
 */

function calculateDetailedVisitGaps() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName("EV Design studio");
  const destSheet = ss.getSheetByName("Dashboard_Data_Link");

  const lastRow = sourceSheet.getLastRow();
  if (lastRow < 2) return;
  
  // Get User IDs (Col B) and Timestamps (Col F)
  const data = sourceSheet.getRange(2, 2, lastRow - 1, 5).getValues();

  // 1. Group timestamps by User ID, filtering out empty timestamps
  let userVisits = {};
  data.forEach(row => {
    let userId = row[0];
    let timestamp = row[4]; // Column F
    
    // DATA CLEANING: Only proceed if there is an ID and a valid Timestamp
    if (userId && timestamp instanceof Date && !isNaN(timestamp)) {
      if (!userVisits[userId]) userVisits[userId] = [];
      userVisits[userId].push(timestamp.getTime());
    }
  });

  // 2. Calculate average gap per user
  let gapCounts = {};
  const OUTLIER_CAP = 90; // Any average gap over 90 days is "cleaned" into one bucket

  for (let id in userVisits) {
    let times = userVisits[id].sort((a, b) => a - b);
    if (times.length > 1) {
      let totalGap = 0;
      for (let i = 1; i < times.length; i++) {
        totalGap += (times[i] - times[i-1]);
      }
      
      let avgGapDays = Math.round(totalGap / (times.length - 1) / (1000 * 60 * 60 * 24));
      
      // DATA CLEANING: Cap the gaps to prevent chart distortion
      let bucketKey = avgGapDays > OUTLIER_CAP ? OUTLIER_CAP : avgGapDays;
      
      gapCounts[bucketKey] = (gapCounts[bucketKey] || 0) + 1;
    }
  }

  // 3. Prepare the output table
  let results = [["Avg Days Between Visits", "Number of Users"]];
  
  for (let i = 0; i <= OUTLIER_CAP; i++) {
    let label = i === OUTLIER_CAP ? "90+ Days" : i + (i === 1 ? " Day" : " Days");
    results.push([label, gapCounts[i] || 0]);
  }

  // 4. Write to Dashboard_Data_Link (Columns L & M)
  destSheet.getRange("L:M").clearContent();
  destSheet.getRange(1, 12, results.length, 2).setValues(results);

  // Formatting
  destSheet.getRange("L1:M1").setFontWeight("bold").setBackground("#f3f3f3");
  
  ss.toast("Cleaned distribution updated (Outliers capped at 90 days).", "Success");
}
