# Attendance Register & Settings UI Updates

## Attendance Register date filter popup
- Added `appendTo="body"` for the From/To date pickers so the calendar overlay is not clipped by scrollable containers.
- Introduced a custom panel style (`timesheet-date-panel`) with a cleaner, more polished look (rounded panel, subtle gradient, clearer header, refined hover/selected states).
- Hooked the component stylesheet for `TimesheetListComponent` to load the custom date picker styles.

Files touched:
- src/app/components/employee/timesheet/timesheet-list.component.html
- src/app/components/employee/timesheet/timesheet-list.component.ts
- src/app/components/employee/timesheet/timesheet-list.component.css

## Settings (Company page) layout refresh
- Reorganized Company settings into a two-column grid of cards with equal gaps and consistent spacing.
- Company Name, Organization Number, and VAT Registration Number are on a single horizontal row.
- Approved for F-tax and prisMod are on a single horizontal row using select buttons.
- Removed the �Automatic (based on customertype)� option from prisMod.
- Kontaktuppgifter inputs are on a single horizontal row.
- Address section expanded with a locked Country field (default: Sweden).
- Standardized input sizing across sections to match Kontaktuppgifter input width.
- Matched card heights within each grid row for visual alignment.

Files touched:
- src/app/components/setting/setting-crud.component.html
- src/app/components/setting/setting-crud.component.css
- src/app/components/setting/setting-crud.component.ts
- src/app/sharedimports.ts
