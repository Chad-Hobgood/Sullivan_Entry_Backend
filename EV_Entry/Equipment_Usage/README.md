# Equipment_Usage

Scripts for recording equipment selections from the `Equipment Usage` sheet.

`Record_Equipment_Usage.js` watches `Equipment Usage!B1` through the shared
installable `onEdit` handler. A selected value is inserted at row 2 in column
B, timestamped in column C, and then cleared from the dropdown.
