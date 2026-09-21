/**
 * EV Entry authorization helper.
 *
 * Operational layout and deployment instructions are maintained in
 * EV_Entry/Readme.md. The sheet now uses B2 as a permanent intake cell and
 * inserts completed records at the top of the history; it does not append
 * entries at the bottom.
 */



/**
 * This function is included solely to force the user to complete the necessary
 * authorization steps for the script to run all its functions (like
 * processEvEntryEdit
 * and dailyDateStamper, which require permissions to edit the spreadsheet).
 *
 * The function itself does nothing functional for the sheet beyond triggering
 * the Google Authorization flow when run manually from the script editor.
 * You will have to accept the request to run the script on the spreadsheet tab to complete the process
 */
function authorizeScript() {
  // Access both the entry workbook and the private lookup workbook. This
  // verifies the full spreadsheet scope required by the installable edit
  // trigger; merely accessing the active workbook is not enough evidence.
  try {
    const ssName = SpreadsheetApp.getActiveSpreadsheet().getName();
    const lookupName = SpreadsheetApp.openById(EV_ENTRY_CONFIG.lookupSpreadsheetId).getName();
    Logger.log(`Successfully accessed entry workbook: ${ssName}`);
    Logger.log(`Successfully accessed private lookup workbook: ${lookupName}`);
    // Optional: Use a simple UI alert to confirm the function ran successfully
    // after authorization is complete, which is helpful feedback for the user.
    SpreadsheetApp.getUi().alert(
      'Authorization Check Complete',
      'The script can access both the entry and private lookup workbooks. You can now create the installable edit trigger.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (e) {
    Logger.log('Authorization function failed, usually indicating missing permissions or no active spreadsheet context: ' + e.toString());
    // If the error is caught, the authorization prompt should have already appeared.
  }
}
