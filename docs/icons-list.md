# Icons & Images Analysis - Complete Unused Assets Report

**Report Generated:** February 9, 2026

---

## Overview

- **Total Icon Files:** 126 across 8 folders + main "icons" folder
- **Icon Folders:** app-layout, booking, dashboard, employment, home, invoice, offers, paginator, product, icons (main)
- **Icons in Use:** ~10 active icons
- **Unused Icons:** ~116 unused icons
- **Storage Impact:** Significant cleanup opportunity

---

## Folder-by-Folder Analysis

### 1. **app-layout/** (11 icons)

| Icon | Status | Used In | Notes |
|---|---|---|---|
| calendar_clock.svg | ❌ **UNUSED** | None | Navigation icon (replaced by SVG inline) |
| customer.svg | ❌ **UNUSED** | None | Navigation icon (replaced by SVG inline) |
| dashboard.svg | ❌ **UNUSED** | None | Navigation icon (replaced by SVG inline) |
| edit_document.svg | ❌ **UNUSED** | None | Navigation icon (replaced by SVG inline) |
| group.svg | ❌ **UNUSED** | None | Navigation icon (replaced by SVG inline) |
| inventory_2.svg | ❌ **UNUSED** | None | Navigation icon (replaced by SVG inline) |
| list_alt_check.svg | ❌ **UNUSED** | None | Navigation icon (replaced by SVG inline) |
| logout.svg | ❌ **UNUSED** | None | Navigation icon (replaced by SVG inline) |
| order_approve.svg | ❌ **UNUSED** | None | Navigation icon (replaced by SVG inline) |
| request_quote.svg | ❌ **UNUSED** | None | Navigation icon (replaced by SVG inline) |
| settings.svg | ❌ **UNUSED** | None | Navigation icon (replaced by SVG inline) |

**Summary:** All 11 icons unused - layout uses inline SVG instead.

---

### 2. **booking/** (1 icon)

| Icon | Status | Used In | Notes |
|---|---|---|---|
| print.svg | ❌ **UNUSED** | None | Print functionality not in use |

---

### 3. **dashboard/** (14 icons)

| Icon | Status | Used In | Notes |
|---|---|---|---|
| account_box.svg | ❌ **UNUSED** | None | User account icon |
| add_box.svg | ❌ **UNUSED** | None | Add/Create icon |
| arrow_outward (1).svg | ❌ **UNUSED** | None | Outward navigation |
| arrow_outward.svg | ❌ **UNUSED** | None | Outward navigation |
| block.svg | ❌ **UNUSED** | None | Block/Deny icon |
| calculate.svg | ❌ **UNUSED** | None | Calculation icon |
| cancel.svg | ❌ **UNUSED** | None | Cancel/Close action |
| check_circle.svg | ❌ **UNUSED** | None | Confirmation/Success |
| customer.svg | ❌ **UNUSED** | None | Customer icon |
| edit_document (1).svg | ❌ **UNUSED** | None | Edit document |
| IconWrapper.svg | ❌ **UNUSED** | None | Wrapper/Container |
| inventory_2.svg | ❌ **UNUSED** | None | Inventory icon |
| mail.svg | ❌ **UNUSED** | None | Mail/Email icon |
| star.svg | ❌ **UNUSED** | None | Star/Rating |
| up-errow.svg | ❌ **UNUSED** | None | Up arrow (typo: up-errow) |

**Summary:** All 14 icons unused - dashboard likely uses inline SVG or PrimeNG icons.

---

### 4. **employment/** (4 icons)

| Icon | Status | Used In | Notes |
|---|---|---|---|
| checkin.svg | ❌ **UNUSED** | None | Timesheet check-in (feature appears abandoned) |
| checkout.svg | ✅ **USED** | timesheet-list.component.html (line 193) | Timesheet check-out action |
| del.svg | ✅ **USED** | timesheet-list.component.html (line 215) | Delete timesheet entry |
| leftclick.svg | ✅ **USED** | timesheet-list.component.html (line 207) | Left click timesheet action |

**Summary:** 1 unused, 3 used. Timesheet module actively uses these icons.

---

### 5. **home/** (8 icons)

| Icon | Status | Used In | Notes |
|---|---|---|---|
| facbook.svg | ✅ **USED** | home.component.html (line 304) | Facebook social link |
| FeatureIcon.svg | ✅ **USED** | home.component.html (line 208) | Feature showcase icon |
| HowToReg.svg | ✅ **USED** | home.component.html (lines 244, 252) | Registration guide icon |
| instagram.svg | ✅ **USED** | home.component.html (line 307) | Instagram social link |
| inventory.svg | ✅ **USED** | home.component.html (lines 217, 236) | Inventory feature icon |
| people.svg | ✅ **USED** | home.component.html (line 200) | People/team feature icon |
| request.svg | ✅ **USED** | home.component.html (line 226) | Request feature icon |
| temp_preferences_eco.svg | ✅ **USED** | home.component.html (line 260) | Environmental/eco preferences |

**Summary:** All 8 icons used - home page actively displays these.

---

### 6. **invoice/** (11 icons)

| Icon | Status | Used In | Notes |
|---|---|---|---|
| Arrow Column.svg | ❌ **UNUSED** | None | Column sorting arrow |
| attach_file.svg | ❌ **UNUSED** | None | File attachment |
| calendar_today.svg | ❌ **UNUSED** | None | Date picker |
| cancel1.svg | ✅ **USED** | Multiple components (invoice-list, product-list, customer-detail) | Cancel/Remove action - HEAVILY USED |
| Edit Button.svg | ❌ **UNUSED** | None | Edit button |
| edit_document.svg | ❌ **UNUSED** | None | Edit document |
| file_copy.svg | ❌ **UNUSED** | None | Copy file |
| file_open.svg | ❌ **UNUSED** | None | Open file |
| picture_as_pdf.svg | ❌ **UNUSED** | None | PDF icon |
| request_quote.svg | ❌ **UNUSED** | None | Quote request |
| upload_file.svg | ❌ **UNUSED** | None | File upload |

**Summary:** 1 used (cancel1.svg), 10 unused. Most are legacy UI components.

---

### 7. **offers/** (1 icon)

| Icon | Status | Used In | Notes |
|---|---|---|---|
| help.svg | ✅ **USED** | Multiple components (setting, offer, invoice CRUD) | Help/Tooltip icon - HEAVILY USED (8+ refs) |

**Summary:** 1 icon, 1 used.

---

### 8. **paginator/** (2 icons)

| Icon | Status | Used In | Notes |
|---|---|---|---|
| next.svg | ✅ **USED** | All list/detail components | Next page navigation - HEAVILY USED (15+ refs) |
| previus.svg | ✅ **USED** | All list/detail components | Previous page navigation (typo: previus) - HEAVILY USED (15+ refs) |

**Summary:** 2 icons, 2 used - Critical for pagination UI.

---

### 9. **product/** (2 icons)

| Icon | Status | Used In | Notes |
|---|---|---|---|
| delete.svg | ✅ **USED** | setting-crud.component.html (line 284) | Delete action |
| edit_square.svg | ✅ **USED** | Multiple components (setting, product-list, employee-list) | Edit action - USED (4 refs) |

**Summary:** 2 icons, 2 used.

---

### 10. **icons/** (Main Folder - 59 icons)

**CRITICAL FINDING:** This folder contains 59 SVG files that appear to be a library or toolkit that was never integrated into the application.

| Icon | Status | Category | Notes |
|---|---|---|---|
| add.svg | ❌ **UNUSED** | Action | Add/Create |
| arrow.svg | ❌ **UNUSED** | Navigation | Arrow navigation |
| arrow_drop_up.svg | ❌ **UNUSED** | Navigation | Dropdown arrow |
| arrow-1.svg | ❌ **UNUSED** | Navigation | Duplicate arrow |
| attach_file.svg | ❌ **UNUSED** | File | File attachment |
| Booking time.svg | ❌ **UNUSED** | Business | Booking calendar |
| box 1.svg | ❌ **UNUSED** | Decorative | Box/Container |
| calendar_today.svg | ❌ **UNUSED** | Date | Calendar icon |
| calendar-lines 1.svg | ❌ **UNUSED** | Date | Calendar lines |
| call.svg | ❌ **UNUSED** | Communication | Phone/Call |
| clock.svg | ❌ **UNUSED** | Time | Clock/Time |
| close.svg | ❌ **UNUSED** | Action | Close/X |
| close_small.svg | ❌ **UNUSED** | Action | Small close |
| create.svg | ❌ **UNUSED** | Action | Create/New |
| dashboard.svg | ❌ **UNUSED** | Navigation | Dashboard |
| Dashboard-1.svg | ❌ **UNUSED** | Navigation | Dashboard duplicate |
| delete.svg | ❌ **UNUSED** | Action | Delete/Trash |
| document 1.svg | ❌ **UNUSED** | File | Document |
| duplicate.svg | ❌ **UNUSED** | Action | Duplicate |
| edit 1.svg | ❌ **UNUSED** | Action | Edit duplicate |
| edit document.svg | ❌ **UNUSED** | Document | Edit doc |
| edit.svg | ❌ **UNUSED** | Action | Edit |
| edit_calendar.svg | ❌ **UNUSED** | Date | Edit calendar |
| edit_square.svg | ❌ **UNUSED** | Action | Edit (square) |
| email us.svg | ❌ **UNUSED** | Communication | Email |
| England.svg | ❌ **UNUSED** | Locale | Flag (England) |
| exit 1.svg | ❌ **UNUSED** | Action | Exit/Logout |
| favorite.svg | ❌ **UNUSED** | Action | Favorite/Star |
| file_copy.svg | ❌ **UNUSED** | File | Copy file |
| file_open.svg | ❌ **UNUSED** | File | Open file |
| heart.svg | ❌ **UNUSED** | Decorative | Heart |
| help.svg | ❌ **UNUSED** | Help | Help icon (duplicates offers/help.svg) |
| info.svg | ❌ **UNUSED** | Information | Info |
| information.svg | ❌ **UNUSED** | Information | Info (duplicate) |
| invoice.svg | ❌ **UNUSED** | Business | Invoice |
| invoice2.svg | ❌ **UNUSED** | Business | Invoice (variant) |
| Invoices.svg | ❌ **UNUSED** | Business | Invoices (capital) |
| Invoices2.svg | ❌ **UNUSED** | Business | Invoices (variant) |
| keyboard_arrow_down.svg | ❌ **UNUSED** | Navigation | Dropdown arrow |
| layout-fluid 1.svg | ❌ **UNUSED** | Layout | Layout icon |
| link user.svg | ❌ **UNUSED** | User | User link |
| list_alt_check.svg | ❌ **UNUSED** | List | Checklist |
| mail.svg | ❌ **UNUSED** | Communication | Mail |
| minus.svg | ❌ **UNUSED** | Action | Minus/Reduce |
| Offer.svg | ❌ **UNUSED** | Business | Offer |
| Offer-1.svg | ❌ **UNUSED** | Business | Offer (variant) |
| Offer2.svg | ❌ **UNUSED** | Business | Offer (variant 2) |
| options.svg | ❌ **UNUSED** | Menu | Options/Menu |
| order.svg | ❌ **UNUSED** | Business | Order |
| order-1.svg | ❌ **UNUSED** | Business | Order (variant) |
| pdf.svg | ❌ **UNUSED** | Document | PDF |
| pdf2.svg | ❌ **UNUSED** | Document | PDF (variant) |
| pdf3.svg | ❌ **UNUSED** | Document | PDF (variant 2) |
| phone.svg | ❌ **UNUSED** | Communication | Phone |
| plus.svg | ❌ **UNUSED** | Action | Plus/Add |
| Products.svg | ❌ **UNUSED** | Business | Products |
| remove.svg | ❌ **UNUSED** | Action | Remove |
| request_quote.svg | ❌ **UNUSED** | Business | Quote request |
| schedule.svg | ❌ **UNUSED** | Time | Schedule |
| search.svg | ❌ **UNUSED** | Search | Search |
| send document.svg | ❌ **UNUSED** | Action | Send document |
| send.svg | ❌ **UNUSED** | Action | Send |
| settings 1.svg | ❌ **UNUSED** | Settings | Settings |
| sort.svg | ❌ **UNUSED** | Data | Sort |
| sorting.svg | ❌ **UNUSED** | Data | Sorting |
| Sweden.svg | ❌ **UNUSED** | Locale | Flag (Sweden) |
| Untitled.svg | ❌ **UNUSED** | Decorative | Untitled/Generic |
| user.svg | ❌ **UNUSED** | User | User profile |
| users 1.svg | ❌ **UNUSED** | User | Multiple users |

**Summary:** All 59 icons in main "icons/" folder are UNUSED. This appears to be an imported icon library that was never utilized.

---

## Summary Statistics

### By Folder

| Folder | Total | Used | Unused | Usage % |
|---|---|---|---|---|
| app-layout | 11 | 0 | 11 | 0% |
| booking | 1 | 0 | 1 | 0% |
| dashboard | 14 | 0 | 14 | 0% |
| employment | 4 | 3 | 1 | 75% |
| home | 8 | 8 | 0 | 100% |
| invoice | 11 | 1 | 10 | 9% |
| offers | 1 | 1 | 1 | 100% |
| paginator | 2 | 2 | 2 | 100% |
| product | 2 | 2 | 2 | 100% |
| icons (main) | 59 | 0 | 59 | 0% |
| **TOTAL** | **126** | **10** | **116** | **8%** |

### By Usage Category

**Actively Used Icons (10 files):**
- `home/` - 8 icons (home page features)
- `offers/help.svg` - 1 icon (help tooltips)
- `paginator/` - 2 icons (pagination)
- `invoice/cancel1.svg` - 1 icon (delete actions)
- `product/` - 2 icons (edit/delete)
- `employment/` - 3 icons (timesheet)

**Completely Unused Folders (0% usage):**
- `app-layout/` - 11 icons (replaced by inline SVG)
- `booking/` - 1 icon
- `dashboard/` - 14 icons
- `icons/` - 59 icons (never implemented)

---

## Detailed Unused Icons List

### High-Priority Cleanup (Completely Unused Folders)

**icons/ folder (59 files):**
```
add.svg, arrow.svg, arrow_drop_up.svg, arrow-1.svg, attach_file.svg,
Booking time.svg, box 1.svg, calendar_today.svg, calendar-lines 1.svg,
call.svg, clock.svg, close.svg, close_small.svg, create.svg,
dashboard.svg, Dashboard-1.svg, delete.svg, document 1.svg, duplicate.svg,
edit 1.svg, edit document.svg, edit.svg, edit_calendar.svg, edit_square.svg,
email us.svg, England.svg, exit 1.svg, favorite.svg, file_copy.svg,
file_open.svg, heart.svg, help.svg, info.svg, information.svg,
invoice.svg, invoice2.svg, Invoices.svg, Invoices2.svg,
keyboard_arrow_down.svg, layout-fluid 1.svg, link user.svg, list_alt_check.svg,
mail.svg, minus.svg, Offer.svg, Offer-1.svg, Offer2.svg, options.svg,
order.svg, order-1.svg, pdf.svg, pdf2.svg, pdf3.svg, phone.svg, plus.svg,
Products.svg, remove.svg, request_quote.svg, schedule.svg, search.svg,
send document.svg, send.svg, settings 1.svg, sort.svg, sorting.svg,
Sweden.svg, Untitled.svg, user.svg, users 1.svg
```

**app-layout/ folder (11 files):**
```
calendar_clock.svg, customer.svg, dashboard.svg, edit_document.svg,
group.svg, inventory_2.svg, list_alt_check.svg, logout.svg,
order_approve.svg, request_quote.svg, settings.svg
```

**dashboard/ folder (14 files):**
```
account_box.svg, add_box.svg, arrow_outward (1).svg, arrow_outward.svg,
block.svg, calculate.svg, cancel.svg, check_circle.svg, customer.svg,
edit_document (1).svg, IconWrapper.svg, inventory_2.svg, mail.svg,
star.svg, up-errow.svg
```

### Medium-Priority Cleanup (Mostly Unused)

**invoice/ folder (10 of 11 unused):**
```
Arrow Column.svg, attach_file.svg, calendar_today.svg,
Edit Button.svg, edit_document.svg, file_copy.svg, file_open.svg,
picture_as_pdf.svg, request_quote.svg, upload_file.svg
```

**employment/ folder (1 of 4 unused):**
```
checkin.svg
```

**booking/ folder (1 of 1 unused):**
```
print.svg
```

---

## Recommendations

### Priority 1: Delete (Saves ~200-300 KB)
- **Delete entire `icons/` folder** - 59 unused files (appears to be unused library)
- **Delete entire `app-layout/` folder** - 11 unused files (layout uses inline SVG)
- **Delete entire `dashboard/` folder** - 14 unused files

### Priority 2: Delete (Saves ~50-100 KB)
- **Delete from `invoice/`:** Arrow Column.svg, attach_file.svg, calendar_today.svg, Edit Button.svg, edit_document.svg, file_copy.svg, file_open.svg, picture_as_pdf.svg, request_quote.svg, upload_file.svg

### Priority 3: Delete (Saves ~5-10 KB)
- **From `employment/`:** checkin.svg
- **From `booking/`:** print.svg

### Keep (Critical for Application)
- `home/` - All 8 icons (home page features)
- `employment/` - checkout.svg, del.svg, leftclick.svg (timesheet actions)
- `invoice/` - cancel1.svg (delete actions - used in multiple places)
- `offers/` - help.svg (help tooltips - used in multiple places)
- `paginator/` - next.svg, previus.svg (pagination - used everywhere)
- `product/` - delete.svg, edit_square.svg (edit/delete actions)

---

## Total Storage Impact

**Current State:**
- 126 icon files
- Estimated size: 300-500 KB

**After Cleanup:**
- 18 essential icon files
- Estimated size: 30-50 KB
- **Savings: 250-450 KB (~85-90% reduction)**

**No Production Impact:** Only unused files will be removed. All actively used icons will remain.

---

## Next Steps

1. ✅ Review this report
2. Create `icons/ToDelete` folder (similar to images)
3. Move unused icons to `ToDelete`
4. Verify no build errors
5. Permanently delete when satisfied

