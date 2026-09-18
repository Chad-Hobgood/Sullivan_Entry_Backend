/**
 * Counts each equipment option recorded in Equipment Usage column B.
 * Results are written to Dashboard_Data_Link starting at column AH.
 */
function calculateEquipmentUsageCounts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName('Equipment Usage');
  const dashboardSheet = ss.getSheetByName('Dashboard_Data_Link');

  if (!sourceSheet) {
    throw new Error('Sheet "Equipment Usage" was not found.');
  }
  if (!dashboardSheet) {
    throw new Error('Sheet "Dashboard_Data_Link" was not found.');
  }

  Logger.log('[Equipment Logging] Starting equipment usage count.');
  const lastRow = sourceSheet.getLastRow();
  const counts = {};

  // Seed every configured dropdown option so unused equipment appears with 0.
  getEquipmentDropdownOptions(sourceSheet).forEach((equipment) => {
    counts[equipment] = 0;
  });

  if (lastRow >= 2) {
    const equipmentValues = sourceSheet.getRange(2, 2, lastRow - 1, 1).getValues();
    equipmentValues.forEach(([equipment]) => {
      if (equipment !== '' && equipment !== null) {
        const key = String(equipment).trim();
        if (key !== '') counts[key] = (counts[key] || 0) + 1;
      }
    });
  }

  const output = [['Equipment', 'Usage Count']];
  Object.keys(counts)
    .sort((a, b) => a.localeCompare(b))
    .forEach((equipment) => output.push([equipment, counts[equipment]]));

  dashboardSheet.getRange('AH:AI').clearContent();
  dashboardSheet.getRange(1, 34, output.length, 2).setValues(output);
  dashboardSheet.getRange('AH1:AI1')
    .setFontWeight('bold')
    .setBackground('#f3f3f3');

  Logger.log(`[Equipment Logging] Wrote ${output.length - 1} equipment options to AH:AI.`);
}

/**
 * Reads the options configured on Equipment Usage!B1.
 * Supports both a list of values and a range-backed dropdown.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet Equipment Usage sheet.
 * @return {string[]} Distinct, nonblank dropdown options.
 */
function getEquipmentDropdownOptions(sheet) {
  const validation = sheet.getRange('B1').getDataValidation();
  if (!validation) {
    Logger.log('[Equipment Logging] No dropdown validation found in B1.');
    return [];
  }

  const criteria = validation.getCriteriaType();
  const values = validation.getCriteriaValues();
  let options = [];

  if (criteria === SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST) {
    options = values[0] || [];
  } else if (criteria === SpreadsheetApp.DataValidationCriteria.VALUE_IN_RANGE) {
    const optionRange = values[0];
    options = optionRange ? optionRange.getValues().flat() : [];
  } else {
    Logger.log(`[Equipment Logging] Unsupported B1 validation type: ${criteria}.`);
  }

  return [...new Set(options
    .filter((option) => option !== '' && option !== null)
    .map((option) => String(option).trim())
    .filter((option) => option !== ''))];
}
