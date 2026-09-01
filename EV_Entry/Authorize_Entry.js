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
 * authorization steps for the script to run all its functions (like onEdit
 * and dailyDateStamper, which require permissions to edit the spreadsheet).
 *
 * The function itself does nothing functional for the sheet beyond triggering
 * the Google Authorization flow when run manually from the script editor.
 * You will have to accept the request to run the script on the spreadsheet tab to complete the process
 */
function authorizeScript() {
  // Accessing the active spreadsheet forces the script to request the
  // 'Spreadsheet' scope during the authorization process.
  try {
    const ssName = SpreadsheetApp.getActiveSpreadsheet().getName();
    Logger.log(`Successfully accessed spreadsheet: ${ssName}`);
    // Optional: Use a simple UI alert to confirm the function ran successfully
    // after authorization is complete, which is helpful feedback for the user.
    SpreadsheetApp.getUi().alert(
      'Authorization Check Complete', 
      'The script has successfully run the authorization check. If you saw a request for permissions, you should now be fully authorized.', 
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (e) {
    Logger.log('Authorization function failed, usually indicating missing permissions or no active spreadsheet context: ' + e.toString());
    // If the error is caught, the authorization prompt should have already appeared.
  }
}
