/**
 * EV entry intake
 *
 * Row 2 is a permanent intake row: staff scan or type a student ID into B2.
 * Each completed entry is placed in row 3, which pushes every older record
 * down one row. The daily script adds one date-only row, so Column A remains
 * a readable separator between log days rather than repeating every entry.
 *
 * Columns C and D deliberately use one formula per record rather than an
 * ARRAYFORMULA. An ARRAYFORMULA needs to own the cells below it and therefore
 * cannot safely coexist with rows inserted at the top of the data table.
 */

const EV_ENTRY_CONFIG = {
  sheetName: 'EV Design studio',
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
 * rows and writing formulas require spreadsheet authorization.
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

    // Existing records start at row 3, so they all move down while B2 remains
    // the next ready-to-scan cell.
    Logger.log('[EV Entry] Inserting a new record row at row 3.');
    sheet.insertRowsAfter(config.intakeRow, 1);

    const recordRow = config.firstRecordRow;
    sheet.getRange(recordRow, config.idColumn).setValue(studentId);
    sheet.getRange(recordRow, config.evStatusColumn)
      .setFormula(getEvStatusFormula(recordRow));
    sheet.getRange(recordRow, config.trainingStatusColumn)
      .setFormula(getTrainingStatusFormula(recordRow));
    sheet.getRange(recordRow, config.timestampColumn).setValue(timestamp)
      .setNumberFormat('MM/dd/yyyy HH:mm:ss');
    Logger.log('[EV Entry] Record values, lookup formulas, and timestamp written to row 3.');

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

/** @param {number} row The record row. @return {string} EV status formula. */
function getEvStatusFormula(row) {
  return `=IF(LEN(B${row}),IF(ISNA(XLOOKUP(B${row},'Engineering Village roster'!$D$2:$D,'Engineering Village roster'!$C$2:$C)),"Not EV Student","EV Student"),"")`;
}

/** @param {number} row The record row. @return {string} training status formula. */
function getTrainingStatusFormula(row) {
  return `=IF(LEN(B${row}),IF(ISNA(XLOOKUP(B${row},'Students who have passed the Quiz'!$D$3:$D,'Students who have passed the Quiz'!$C$3:$C)),"Not Done Training","Completed Training"),"")`;
}

/**
 * One-time migration for the existing downward-growing sheet.
 *
 * Run this manually once, after backing up the spreadsheet, before enabling
 * the updated onEdit trigger. It adds the Row 2 intake buffer, replaces the
 * two ARRAYFORMULAs with equivalent formulas on existing records, and keeps
 * all ID, date, and timestamp values intact.
 */
function prepareTopEntryLayout() {
  const config = EV_ENTRY_CONFIG;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(config.sheetName);
  if (!sheet) {
    const message = `Sheet "${config.sheetName}" was not found.`;
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
    // shift down unchanged before C/D formulas are rebuilt. This migration
    // does not add a date marker; the daily trigger adds one per day.
    sheet.insertRowBefore(config.intakeRow);
    const lastRow = sheet.getLastRow();
    Logger.log(`[EV Entry] Intake row inserted. Rebuilding formulas through row ${lastRow}.`);
    if (lastRow >= config.firstRecordRow) {
      const recordCount = lastRow - config.firstRecordRow + 1;
      const ids = sheet.getRange(config.firstRecordRow, config.idColumn, recordCount, 1).getValues();
      const formulas = ids.map((row, index) => {
        const recordRow = config.firstRecordRow + index;
        return row[0] === '' || row[0] === null
          ? ['', '']
          : [getEvStatusFormula(recordRow), getTrainingStatusFormula(recordRow)];
      });

      // This removes the former ARRAYFORMULA and writes row-local formulas.
      sheet.getRange(config.firstRecordRow, config.evStatusColumn, recordCount, 2)
        .clearContent()
        .setFormulas(formulas);
      Logger.log(`[EV Entry] Rebuilt C/D formulas for ${recordCount} rows.`);
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
