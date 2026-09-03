# Sullivan-Automation-Backend
This is a series of Javascript automation tools made for google sheets that I made. It automates the inventory tracking and integrates with a dashboard service, resuling lab assistant overhead and empowering students to 3D print more!

These are separate files with multiple connected functions in them, each of which ties to a specific Google spreadsheet, so they can have functions of the same name.
A good amount of this is designed so we can pass this over to the next generation of lab assistants, which is why there is the permission handling stuff in the code.
This was written in Javascript, as that is unfortunately the only langauage that google scripts support atm

## Queue Automation
### Why did we need this:
1. We wanted to automatee the 3d printing resources
2. Most of the lab assistant tasks were very repative, which cut down on those
3. We wanted to have a better understanding of how the lab was being used 

### How does it work?
The basic idea is this:
1. User submits a form, this populates the things in a row that they entered.
2. onFormSubmit sets the status to "In Queue" and adds VLOOKUP formulas.
3. When the status changes to "In Progress" or "Flagged/Completed", a timestamp is added.
4. When marked as "Completed" or "Flagged," the script acquires a lock, sends the email, archives the data, and immediately deletes the original row.
5. Everynight we make sure the archive has no duplicate data, and add in some spreadsheet functions to make sure that the data we need is there

`runEvEntryMaintenance` can be run manually or used as a maintenance trigger
for the EV Entry workflow. It calls the EV Entry log cleaner, which removes
duplicate swipes and fully empty rows while preserving any partially populated
rows. It does not call the 3D print queue's archive or pending-status functions.

## Timestamping and Entry Statistics Automation
### Why did we need this:
1. KPI for space usage
2. Automated things for data collection
3. Allowed us to have a better understanding of when we needed to staff the lab

### How does it work?
The basic idea is this,
1. At Midnight, make a new date stamp
2. Everytime that someone swipes in, collect a time stamp so we have that information 
