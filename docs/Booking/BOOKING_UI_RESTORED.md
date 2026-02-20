# Booking Page UI (Restored)

This document records the restored booking page styling and behavior.

## Scope

- Booking list table cells
- Booked slot cards
- CSS-only slider for multiple bookings
- Time-column highlighting for booked durations
- Custom popup (PrimeNG dialog removed)

## Files

- `src/app/components/booking/booking-list/booking-list.component.html`
- `src/app/components/booking/booking-list/booking-list.component.css`
- `src/app/components/booking/booking-list/booking-list.component.ts`

## Booked Slot Layout

- Booked card shows plate + vehicle info.
- Book icon button sits in the top-right of each day cell.
- Card keeps fixed height; no stretching.

## Slider Behavior

- If a time slot has multiple bookings, a CSS-only slider is used.
- One booking per view with line-style pagination.
- Small arrows appear on hover and do not navigate the page.
- Scrollbars are hidden.

## Time Highlighting

- The time column (e.g., 08:00, 08:30) highlights when any booking spans that time.
- Duration uses `estimatedHours` or sums `woServices.serviceHours`.

## Popup

- PrimeNG dialog replaced with custom modal (backdrop + close button).
- Uses grid layout for details and a dedicated description block.

## Notes

- Arrows and close button use HTML entities (`&lsaquo;`, `&rsaquo;`, `&times;`) to avoid encoding issues.
- No PrimeNG is used for the popup; everything is styled in CSS.

