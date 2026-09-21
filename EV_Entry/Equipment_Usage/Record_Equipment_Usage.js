/**
 * Records an equipment selection made in Equipment Usage!B1.
 *
 * This function is called by the project's shared onEdit handler. It inserts
 * a row below the dropdown, writes the selected equipment to column B and a
 * timestamp to column C, then resets the dropdown for the next selection.
 *
 * @param {GoogleAppsScript.Events.SheetsOnEdit} e The edit event object.
 */
function handleEquipmentUsageEdit(e) {
  if (!e || !e.range) {
    Logger.log('[Equipment Usage] Ignored edit because no event range was supplied.');
    return;
  }

  const range = e.range;
  const sheet = range.getSheet();
  if (
    sheet.getName() !== 'Equipment Usage' ||
    range.getRow() !== 1 ||
    range.getColumn() !== 2 ||
    range.getNumRows() !== 1 ||
    range.getNumColumns() !== 1
  ) {
    return;
  }

  Logger.log('[Equipment Usage] Dropdown edit detected in B1.');
  const lock = LockService.getDocumentLock();
  let lockAcquired = false;

  try {
    Logger.log('[Equipment Usage] Waiting for the document lock.');
    acquireEvEntryDocumentLock(lock, 'equipment-usage recording');
    lockAcquired = true;
    Logger.log('[Equipment Usage] Document lock acquired.');

    const equipment = range.getValue();
    if (equipment === '' || equipment === null) {
      Logger.log('[Equipment Usage] Dropdown was cleared; no record created.');
      return;
    }

    sheet.insertRowsAfter(1, 1);
    sheet.getRange(2, 2, 1, 2)
      .setValues([[equipment, new Date()]])
      .getCell(1, 2)
      .setNumberFormat('MM/dd/yyyy HH:mm:ss');
    range.clearContent();

    Logger.log(`[Equipment Usage] Recorded equipment selection: ${equipment}.`);
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    Logger.log(`[Equipment Usage] ERROR while recording usage: ${message}`);
    console.error(`[Equipment Usage] ${message}`);
    throw error;
  } finally {
    if (lockAcquired) {
      lock.releaseLock();
      Logger.log('[Equipment Usage] Document lock released.');
    }
  }
}
