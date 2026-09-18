/**
 * Inserts one date-only marker at the top of the EV-entry history.
 *
 * Completed records start on row 3. At midnight this function adds the date
 * in A3 and leaves B3 blank. New scans are inserted above that marker, so it
 * moves down with the day's records and remains an easy visual day boundary.
 */
function dailyDateStamper() {
  Logger.log('[EV Entry] Daily date stamper started.');
  const config = EV_ENTRY_CONFIG;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(config.sheetName);

  if (!sheet) {
    const message = `Sheet "${config.sheetName}" was not found.`;
    Logger.log(`[EV Entry] ERROR during daily date stamp: ${message}`);
    throw new Error(message);
  }

  const lock = LockService.getDocumentLock();
  let lockAcquired = false;
  try {
    Logger.log('[EV Entry] Waiting for the document lock for daily date stamp.');
    lock.waitLock(30000);
    lockAcquired = true;
    Logger.log('[EV Entry] Document lock acquired for daily date stamp.');
    Logger.log('[EV Entry] Inserting a date-only marker at row 3.');
    sheet.insertRowsAfter(config.intakeRow, 1);
    sheet.getRange(config.firstRecordRow, config.dateColumn).setValue(new Date())
      .setNumberFormat('yyyy-MM-dd');
    Logger.log('[EV Entry] Daily date marker written to A3 successfully.');
  } catch (error) {
    Logger.log(`[EV Entry] ERROR during daily date stamp: ${getEvEntryErrorMessage(error)}`);
    throw error;
  } finally {
    if (lockAcquired) {
      lock.releaseLock();
      Logger.log('[EV Entry] Document lock released after daily date stamp.');
    }
  }
}
