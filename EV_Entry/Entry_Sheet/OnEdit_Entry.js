/**
 * EV entry intake
 *
 * Row 2 is a permanent intake row: staff scan or type a student ID into B2.
 * Each completed entry is placed in row 3, which pushes every older record
 * down one row. The daily script adds one date-only row, so Column A remains
 * a readable separator between log days rather than repeating every entry.
 *
 * Columns C and D are written as status values after a private server-side
 * lookup. No roster or certification formulas are placed in the entry sheet.
 */

const EV_ENTRY_CONFIG = {
  sheetName: 'EV Design studio',
  // The script owner must have access to this workbook. Lab assistants do
  // not need access to it because the installable trigger reads it directly.
  lookupSpreadsheetId: '1Dka0vN0agkMPPL1JIHRnJBXHtxX-r9wUc64YGornzdE',
  rosterSheetName: 'Current_Roster',
  // Current_Roster: A = first name, B = last name, C = swipe student ID,
  // D = email address.
  rosterIdColumn: 3,
  rosterFirstDataRow: 2,
  certsSheetName: 'Moodle Certs',
  certsIdColumn: 4,
  certsFirstDataRow: 3,
  intakeRow: 2,
  firstRecordRow: 3,
  dateColumn: 1,
  idColumn: 2,
  evStatusColumn: 3,
  trainingStatusColumn: 4,
  timestampColumn: 6,
};

/**
 * Moves a single ID entered in B2 into a new record at row 3.
 *
 * This must be an installable edit trigger, not a simple trigger: inserting
 * rows and reading the private lookup workbook require spreadsheet authorization.
 *
 * @param {GoogleAppsScript.Events.SheetsOnEdit} e The edit event object.
 */
function onEdit(e) {
  if (!e || !e.range) {
    Logger.log('[EV Entry] Ignored edit because no event range was supplied.');
    return;
  }

  const range = e.range;
  const sheet = range.getSheet();
  const config = EV_ENTRY_CONFIG;

  // Only a single-cell entry in the designated intake cell creates a record.
  // Edits to historical rows intentionally do not alter their timestamps.
  if (
    sheet.getName() !== config.sheetName ||
    range.getRow() !== config.intakeRow ||
    range.getColumn() !== config.idColumn ||
    range.getNumRows() !== 1 ||
    range.getNumColumns() !== 1
  ) {
    return;
  }

  Logger.log('[EV Entry] Intake edit detected in B2.');
  const lock = LockService.getDocumentLock();
  let lockAcquired = false;
  try {
    Logger.log('[EV Entry] Waiting for the document lock.');
    lock.waitLock(30000);
    lockAcquired = true;
    Logger.log('[EV Entry] Document lock acquired.');

    // Read after acquiring the lock in case two scans happen nearly together.
    const studentId = range.getValue();
    if (studentId === '' || studentId === null) {
      Logger.log('[EV Entry] Intake cell was cleared or empty; no record created.');
      return;
    }

    const timestamp = new Date();

    // Read only identifier columns from the private lookup workbook. Statuses
    // are written as values, so the entry workbook never contains an
    // IMPORTRANGE/XLOOKUP formula or copied personal data.
    const lookupData = getEvEntryLookupData();
    const statuses = getEvEntryStatuses(studentId, lookupData);

    // Existing records start at row 3, so they all move down while B2 remains
    // the next ready-to-scan cell.
    Logger.log('[EV Entry] Inserting a new record row at row 3.');
    sheet.insertRowsAfter(config.intakeRow, 1);

    const recordRow = config.firstRecordRow;
    sheet.getRange(recordRow, config.idColumn).setValue(studentId);
    sheet.getRange(recordRow, config.evStatusColumn, 1, 2)
      .setValues([[statuses.evStatus, statuses.trainingStatus]]);
    sheet.getRange(recordRow, config.timestampColumn).setValue(timestamp)
      .setNumberFormat('MM/dd/yyyy HH:mm:ss');
    Logger.log('[EV Entry] Record values, private lookup statuses, and timestamp written to row 3.');

    // Clear only the scanned value. The daily date marker is a separate row
    // in Column A and moves down with the day's records.
    range.clearContent();
    Logger.log('[EV Entry] Intake cell cleared; entry processing completed.');
  } catch (error) {
    Logger.log(`[EV Entry] ERROR while processing intake: ${getEvEntryErrorMessage(error)}`);
    console.error(`Unable to process EV entry: ${getEvEntryErrorMessage(error)}`);
    throw error;
  } finally {
    if (lockAcquired) {
      lock.releaseLock();
      Logger.log('[EV Entry] Document lock released.');
    }
  }
}

/** @param {*} error @return {string} A safe, useful Apps Script error message. */
function getEvEntryErrorMessage(error) {
  return error && error.message ? error.message : String(error);
}

/**
 * Run manually from Apps Script when setup or permissions are unclear.
 * Logs workbook/tab access only; it never logs student IDs or roster values.
 */
function diagnoseEvEntryConfiguration() {
  const config = EV_ENTRY_CONFIG;
  Logger.log(`[EV Entry] Effective user: ${Session.getEffectiveUser().getEmail() || '(email unavailable)'}`);

  const entrySpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!entrySpreadsheet) {
    Logger.log('[EV Entry] FAIL: no active spreadsheet. Bind this project to the attendance workbook.');
  } else {
    Logger.log(`[EV Entry] Entry workbook: "${entrySpreadsheet.getName()}" (${entrySpreadsheet.getId()})`);
    Logger.log(`[EV Entry] Entry tabs: ${getEvEntrySheetNames(entrySpreadsheet).join(', ')}`);
    Logger.log(`[EV Entry] Entry tab "${config.sheetName}": ${entrySpreadsheet.getSheetByName(config.sheetName) ? 'FOUND' : 'MISSING'}`);
  }

  try {
    const lookupSpreadsheet = SpreadsheetApp.openById(config.lookupSpreadsheetId);
    Logger.log(`[EV Entry] Lookup workbook access: OK ("${lookupSpreadsheet.getName()}")`);
    Logger.log(`[EV Entry] Lookup tabs: ${getEvEntrySheetNames(lookupSpreadsheet).join(', ')}`);
    Logger.log(`[EV Entry] Lookup tab "${config.rosterSheetName}": ${lookupSpreadsheet.getSheetByName(config.rosterSheetName) ? 'FOUND' : 'MISSING'}`);
    Logger.log(`[EV Entry] Lookup tab "${config.certsSheetName}": ${lookupSpreadsheet.getSheetByName(config.certsSheetName) ? 'FOUND' : 'MISSING'}`);
  } catch (error) {
    Logger.log(`[EV Entry] FAIL: lookup workbook access: ${getEvEntryErrorMessage(error)}`);
  }
}

/** @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet @return {string[]} */
function getEvEntrySheetNames(spreadsheet) {
  return spreadsheet.getSheets().map((sheet) => sheet.getName());
}

/** @return {{rosterIds: Object, certIds: Object}} Private lookup sets. */
function getEvEntryLookupData() {
  const config = EV_ENTRY_CONFIG;
  const lookupSpreadsheet = SpreadsheetApp.openById(config.lookupSpreadsheetId);
  return {
    rosterIds: getEvEntryIdSet(
      lookupSpreadsheet, config.rosterSheetName,
      config.rosterIdColumn, config.rosterFirstDataRow
    ),
    certIds: getEvEntryIdSet(
      lookupSpreadsheet, config.certsSheetName,
      config.certsIdColumn, config.certsFirstDataRow
    ),
  };
}

/**
 * Read only one ID column from a private lookup sheet.
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet
 * @param {string} sheetName
 * @param {number} column
 * @param {number} firstDataRow
 * @return {Object} Set-like object keyed by student ID.
 */
function getEvEntryIdSet(spreadsheet, sheetName, column, firstDataRow) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) throw new Error(`Lookup sheet "${sheetName}" was not found.`);
  const lastRow = sheet.getLastRow();
  if (lastRow < firstDataRow) return {};

  const values = sheet
    .getRange(firstDataRow, column, lastRow - firstDataRow + 1, 1)
    .getValues();
  return values.reduce((ids, row) => {
    const id = getEvEntryIdKey(row[0]);
    if (id !== '') ids[id] = true;
    return ids;
  }, {});
}

/** @param {*} value @return {string} Stable comparison key for an ID. */
function getEvEntryIdKey(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

/**
 * @param {*} studentId
 * @param {{rosterIds: Object, certIds: Object}} lookupData
 * @return {{evStatus: string, trainingStatus: string}}
 */
function getEvEntryStatuses(studentId, lookupData) {
  const id = getEvEntryIdKey(studentId);
  return {
    evStatus: lookupData.rosterIds[id] ? 'EV Student' : 'Not EV Student',
    trainingStatus: lookupData.certIds[id]
      ? 'Completed Training'
      : 'Not Done Training',
  };
}

/**
 * One-time migration for the existing downward-growing sheet.
 *
 * Run this manually once, after backing up the spreadsheet, before enabling
 * the updated onEdit trigger. It adds the Row 2 intake buffer, replaces the
 * two ARRAYFORMULAs with equivalent status values on existing records, and keeps
 * all ID, date, and timestamp values intact.
 */
function prepareTopEntryLayout() {
  const config = EV_ENTRY_CONFIG;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(config.sheetName);
  if (!sheet) {
    const availableTabs = getEvEntrySheetNames(ss).join(', ');
    const message = `Sheet "${config.sheetName}" was not found in "${ss.getName()}". Available tabs: ${availableTabs}`;
    Logger.log(`[EV Entry] ERROR during layout migration: ${message}`);
    throw new Error(message);
  }

  Logger.log('[EV Entry] Starting one-time top-entry layout migration.');
  const lock = LockService.getDocumentLock();
  let lockAcquired = false;
  try {
    Logger.log('[EV Entry] Waiting for the document lock for migration.');
    lock.waitLock(30000);
    lockAcquired = true;
    Logger.log('[EV Entry] Document lock acquired for migration.');

    // A new Row 2 becomes the permanent ID intake area. All existing records
    // shift down unchanged before C/D statuses are rebuilt. This migration
    // does not add a date marker; the daily trigger adds one per day.
    sheet.insertRowBefore(config.intakeRow);
    const lastRow = sheet.getLastRow();
    Logger.log(`[EV Entry] Intake row inserted. Rebuilding statuses through row ${lastRow}.`);
    if (lastRow >= config.firstRecordRow) {
      const recordCount = lastRow - config.firstRecordRow + 1;
      const ids = sheet.getRange(config.firstRecordRow, config.idColumn, recordCount, 1).getValues();
      const lookupData = getEvEntryLookupData();
      const statuses = ids.map((row) => {
        return row[0] === '' || row[0] === null
          ? ['', '']
          : (() => {
              const status = getEvEntryStatuses(row[0], lookupData);
              return [status.evStatus, status.trainingStatus];
            })();
      });

      // This removes the former ARRAYFORMULA and writes status values instead
      // of formulas that could expose another workbook.
      sheet.getRange(config.firstRecordRow, config.evStatusColumn, recordCount, 2)
        .clearContent()
        .setValues(statuses);
      Logger.log(`[EV Entry] Rebuilt C/D statuses for ${recordCount} rows.`);
    }

    sheet.getRange(config.intakeRow, config.dateColumn, 1, 5).clearContent();
    Logger.log('[EV Entry] Migration completed successfully.');
  } catch (error) {
    Logger.log(`[EV Entry] ERROR during layout migration: ${getEvEntryErrorMessage(error)}`);
    throw error;
  } finally {
    if (lockAcquired) {
      lock.releaseLock();
      Logger.log('[EV Entry] Document lock released after migration.');
    }
  }
}
