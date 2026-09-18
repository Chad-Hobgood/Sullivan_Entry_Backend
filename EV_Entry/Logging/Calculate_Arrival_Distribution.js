/** Made by Chadwick Hobgood, 1/25/2026
 * 
 * This is a function that finds the times that people are coming into the space
 * We also have a smaller function to init the hours so its just an array addition
 */

function calculateArrivalDistribution() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName("EV Design studio");
  
  // 1. Setup the Destination Sheet
  let destSheet = ss.getSheetByName("Dashboard_Data_Link");
  if (!destSheet) {
    destSheet = ss.insertSheet("Dashboard_Data_Link");
  }

  // 2. Get the Source Data
  const lastRow = sourceSheet.getLastRow();
  if (lastRow < 2) return; 
  const data = sourceSheet.getRange(2, 6, lastRow - 1, 1).getValues();

  // 3. Initialize Buckets
  let augDec = initializeHours(); // Updated for Aug-Dec
  let janMay = initializeHours();
  let wholeYear = initializeHours();

  // 4. Process the Data (Ignoring Year)
  // we ignore the year so that as the school years change that the data is consistent
  data.forEach(row => {
    let timestamp = row[0];
    
    if (timestamp instanceof Date && !isNaN(timestamp)) {
      let hour = timestamp.getHours();
      let month = timestamp.getMonth(); // 0 = Jan, 11 = Dec

      // Whole Year (Always increments)
      wholeYear[hour]++;

      // Jan to May (0 through 4)
      if (month >= 0 && month <= 4) {
        janMay[hour]++;
      }

      // August to December (7 through 11)
      if (month >= 7 && month <= 11) {
        augDec[hour]++;
      }
    }
  });

  // 5. Prepare Output (Header + 24 rows)
  let output = [["Hour of Day", "Whole Year", "Jan - May", "Aug - Dec"]];
  for (let i = 0; i < 24; i++) {
    output.push([
      i + ":00", 
      wholeYear[i], 
      janMay[i], 
      augDec[i]
    ]);
  }

  // 6. Write specifically to Columns A-D
  destSheet.getRange("A:D").clearContent(); 
  destSheet.getRange(1, 1, output.length, output[0].length).setValues(output);
  
  // Clean up formatting
  destSheet.getRange("A1:D1").setFontWeight("bold").setBackground("#f3f3f3");
  
  // Non-intrusive notification instead of a widget
  ss.toast("Distribution data updated successfully.", "Script Run", 3);
}

function initializeHours() {
  let obj = {};
  for (let i = 0; i < 24; i++) { obj[i] = 0; }
  return obj;
}
