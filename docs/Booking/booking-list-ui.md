# Booking List UI Notes

## Overview
The booking list UI lives in the BookingList component. It renders the weekly calendar, booking cards, and the booking detail modal.

- Component template: `src/app/components/booking/booking-list/booking-list.component.html`
- Component styles: `src/app/components/booking/booking-list/booking-list.component.css`
- Color tokens: `src/app/components/booking/booking-list/booking-list.colors.css`

## Color Tokens
All reusable colors are defined as CSS variables in `booking-list.colors.css` and consumed in the component stylesheet.

Common tokens:
- `--booking-primary`, `--booking-primary-dark`, `--booking-primary-ink`
- `--booking-primary-light`, `--booking-primary-soft`
- `--booking-gray-50` .. `--booking-gray-900`
- `--booking-weekend`, `--booking-weekend-header`

Update the variables in the colors file to adjust the UI palette without changing layout rules.

## Print Dropdown (Per Cell)
Each booked cell shows a print icon at the top-left. Clicking it opens a dropdown that lists each booking in that cell.

- Toggle state key: `openMenuKey` in the component TS.
- Label for each entry: `bookingLabel(booking)` (currently uses plate/manufacturer/model/year).
- Print action: `printBooking($event, booking)` triggers a single work order PDF.

## Current Day / Weekend Highlight
- Current day column uses `booking-current-day`.
- Weekend (Saturday) uses `booking-weekend` and `booking-weekend-header`.

Adjust those classes in the component CSS or tweak the color variables for final tuning.
