/**Made by Chadwick Hobgood, 1/25/2026
 * 
 * This is so that we can see when most of the users are coming in by day of the week
 * This is so we have insight on which days we can be more lenient on staffing for
 */


function calculateDayOfWeekDistribution() {
  //get the spreadsheets
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName("EV Design studio");
  const destSheet = ss.getSheetByName("Dashboard_Data_Link");

  const lastRow = sourceSheet.getLastRow();
  if (lastRow < 2) return;
  
  // Get Timestamps from Column F
  const data = sourceSheet.getRange(2, 6, lastRow - 1, 1).getValues();

  // 1. Initialize the Day Map
  // JavaScript Date.getDay() returns 0 for Sunday, 1 for Monday, etc.
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  let dayCounts = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0};
  let uniqueDates = new Set();

  // 2. Count visits per day and track how many unique dates are in the data
  data.forEach(row => {
    let timestamp = row[0];
    if (timestamp instanceof Date && !isNaN(timestamp)) {
      let dayIndex = timestamp.getDay();
      dayCounts[dayIndex]++;
      
      // Track the date string (YYYY-MM-DD) to calculate the average later
      let dateString = timestamp.toISOString().split('T')[0];
      uniqueDates.add(dateString);
    }
  });

  // 3. Calculate how many of each specific weekday have passed in your dataset
  // This ensures that if you have 5 Mondays but only 4 Tuesdays in your data, the average stays fair.
  let weekdayOccurrences = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0};
  uniqueDates.forEach(dateStr => {
    let d = new Date(dateStr);
    weekdayOccurrences[d.getDay()]++;
  });

  // 4. Prepare Data for Columns R and S
  let results = [["Day of Week", "Avg. Users Per Day"]];
  
  // We'll loop Monday (1) through Saturday (6), then Sunday (0) to match a standard work week
  const displayOrder = [1, 2, 3, 4, 5, 6, 0];
  
  displayOrder.forEach(i => {
    let avg = weekdayOccurrences[i] > 0 ? (dayCounts[i] / weekdayOccurrences[i]).toFixed(1) : 0;
    results.push([dayNames[i], avg]);
  });

  // 5. Write to Dashboard (Columns R and S)
  destSheet.getRange("R:S").clearContent();
  destSheet.getRange(1, 18, results.length, 2).setValues(results);
  destSheet.getRange("R1:S1").setFontWeight("bold").setBackground("#f3f3f3");

  ss.toast("Day of week averages updated!", "Success");
}
