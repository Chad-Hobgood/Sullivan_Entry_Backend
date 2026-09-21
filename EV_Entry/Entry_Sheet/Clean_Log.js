/**
 * Removes repeated EV-entry swipes made by the same student within five
 * minutes of their last retained swipe. Intended for an hourly time trigger.
 *
 * The earliest swipe in a five-minute window is retained. Rows are examined
 * by timestamp rather than sheet position, because the newest records appear
 * at the top of this sheet. Date-only separator rows and rows without a valid
 * timestamp are never treated as duplicate entries. Fully empty rows are
 * removed, while any row containing data in any cell is preserved.
 */
function cleanDuplicateEntries() {
  const config = EV_ENTRY_CONFIG;
  const duplicateWindowMs = 5 * 60 * 1000;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(config.sheetName);

  Logger.log('[EV Entry] Duplicate-entry cleanup started.');
  if (!sheet) {
    const message = `Sheet "${config.sheetName}" was not found.`;
    Logger.log(`[EV Entry] ERROR during duplicate-entry cleanup: ${message}`);
    throw new Error(message);
  }

  const lock = LockService.getDocumentLock();
  let lockAcquired = false;
  try {
    Logger.log('[EV Entry] Waiting for the document lock for duplicate-entry cleanup.');
    acquireEvEntryDocumentLock(lock, 'duplicate-entry cleanup');
    lockAcquired = true;
    Logger.log('[EV Entry] Document lock acquired for duplicate-entry cleanup.');

    const lastRow = sheet.getLastRow();
    if (lastRow < config.firstRecordRow) {
      Logger.log('[EV Entry] No history rows exist; duplicate-entry cleanup finished.');
      return;
    }

    const rowCount = lastRow - config.firstRecordRow + 1;
    const lastColumn = sheet.getLastColumn();
    const values = sheet.getRange(config.firstRecordRow, 1, rowCount, lastColumn).getValues();

    const visitsByStudent = new Map();
    let skippedRows = 0;
    const emptyRows = [];
    values.forEach((row, index) => {
      const rowNumber = config.firstRecordRow + index;
      const isEmptyRow = row.every((cell) => cell === '' || cell === null);
      if (isEmptyRow) {
        emptyRows.push(rowNumber);
        return;
      }

      const studentId = row[config.idColumn - 1];
      const timestamp = row[config.timestampColumn - 1];
      const isValidTimestamp = timestamp instanceof Date && !isNaN(timestamp);

      if (studentId === '' || studentId === null || !isValidTimestamp) {
        skippedRows++;
        return;
      }

      const studentKey = String(studentId).trim();
      if (!visitsByStudent.has(studentKey)) visitsByStudent.set(studentKey, []);
      visitsByStudent.get(studentKey).push({
        rowNumber,
        timestampMs: timestamp.getTime(),
      });
    });

    const duplicateRows = [];
    visitsByStudent.forEach((visits) => {
      visits.sort((a, b) => a.timestampMs - b.timestampMs);
      let lastRetainedTimestampMs = null;

      visits.forEach((visit) => {
        if (
          lastRetainedTimestampMs !== null &&
          visit.timestampMs - lastRetainedTimestampMs <= duplicateWindowMs
        ) {
          duplicateRows.push(visit.rowNumber);
          return;
        }

        lastRetainedTimestampMs = visit.timestampMs;
      });
    });

    const rowsToDelete = [...new Set([...emptyRows, ...duplicateRows])];
    if (rowsToDelete.length === 0) {
      Logger.log(
        `[EV Entry] No duplicate or fully empty rows found. Skipped ${skippedRows} non-entry rows.`,
      );
      return;
    }

    deleteRowsInDescendingGroups(sheet, rowsToDelete);
    Logger.log(
      `[EV Entry] Removed ${duplicateRows.length} duplicate entries and ${emptyRows.length} fully empty rows. ` +
      `Skipped ${skippedRows} non-entry rows.`,
    );
  } catch (error) {
    Logger.log(`[EV Entry] ERROR during duplicate-entry cleanup: ${getEvEntryErrorMessage(error)}`);
    throw error;
  } finally {
    if (lockAcquired) {
      lock.releaseLock();
      Logger.log('[EV Entry] Document lock released after duplicate-entry cleanup.');
    }
  }
}

/**
 * Deletes sheet rows in descending contiguous groups so lower row numbers do
 * not change before they are processed.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The EV-entry sheet.
 * @param {number[]} rowNumbers Rows to delete.
 */
function deleteRowsInDescendingGroups(sheet, rowNumbers) {
  const rows = [...new Set(rowNumbers)].sort((a, b) => b - a);
  if (rows.length === 0) return;

  let groupStart = rows[0];
  let groupCount = 1;
  let previousRow = rows[0];

  for (let index = 1; index < rows.length; index++) {
    const row = rows[index];
    if (row === previousRow - 1) {
      groupStart = row;
      groupCount++;
    } else {
      sheet.deleteRows(groupStart, groupCount);
      groupStart = row;
      groupCount = 1;
    }
    previousRow = row;
  }

  sheet.deleteRows(groupStart, groupCount);
}
