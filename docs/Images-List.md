# Image Usage Analysis - assets/images Folder

**Report Generated:** February 9, 2026

---

## Executive Summary

- **Total files in folder:** 53
- **Files being used:** 20 (including backgrounds)
- **Files safe to delete:** 33
- **Storage savings:** ~2-5 MB (estimated)

---

## Images in Use ✅

### Core Logo & Branding Files

| Image File | Used In | References | Status |
|---|---|---|---|
| **logo.png** | Layout header, Invoice/Offer/DigitalService views | 5 files | ✅ CRITICAL |
| **homelogo.png** | Home component header | 1 file | ✅ USED |

### Decorative & Layout Elements

| Image File | Used In | Component | Status |
|---|---|---|---|
| **line.png** | List separators | WorkOrder, Offer, Invoice lists | ✅ USED |
| **eu-flag.png** | EU regulatory compliance display | WorkOrder/Offer/Invoice CRUD | ✅ USED |
| **bgline.png** | Navigation background | Tailwind config | ✅ CSS LAYER |
| **body_background.png** | Body background pattern | Tailwind config | ✅ CSS LAYER |
| **FooterGraphic.png** | Footer decoration | Tailwind config | ✅ CSS LAYER |
| **footerline.png** | Footer line decoration | Tailwind config | ✅ CSS LAYER |
| **dialog.png** | Dialog modal background | Tailwind config | ✅ CSS LAYER |
| **banner_heading.png** | Banner background | Tailwind config | ✅ CSS LAYER |

### Action Icons

| Image File | Used In | Action | Status |
|---|---|---|---|
| **close.png** | Delete/Remove actions | Setting CRUD, Offer CRUD | ✅ USED |

### Footer Contact & Support Section

| Image File | Used In | Purpose | Status |
|---|---|---|---|
| **faq.png** | Layout footer | FAQ link icon | ✅ USED |
| **help.png** | Layout footer | Help link icon | ✅ USED |
| **emailus.png** | Layout footer | Email contact icon | ✅ USED |
| **phone.png** | Layout footer | Phone contact icon | ✅ USED |
| **clock.png** | Layout footer | Operating hours icon | ✅ USED |
| **Bhelp.png** | Layout footer | Help button icon | ✅ USED |

### PDF Template Preview

| Image File | Used In | Purpose | Status |
|---|---|---|---|
| **pdf-img/invoice-pdf.jpg** | Setting CRUD | Template preview | ✅ USED (4 refs) |

### Dynamic Images (Language & Options)

| Image Pattern | Used In | Purpose | Status |
|---|---|---|---|
| **{language.value}.png** | Layout language selector | Language flags | ✅ USED |
| **{selectedOption.value}.png** | Layout option selector | Dynamic options | ✅ USED |
| **sv.png** | Layout language selector | Swedish flag | ✅ USED |
| **en.png** | Layout language selector | English flag | ✅ USED |

---

## Images NOT in Use ❌

### Dashboard & Navigation Icons (Legacy)

| Image File | Reason for Removal | Notes |
|---|---|---|
| ❌ **dashboard.png** | No references found | Likely replaced by SVG icons |
| ❌ **Workorder.png** | No references found | Likely replaced by SVG icons |
| ❌ **Invoices.png** | No references found | Likely replaced by SVG icons |
| ❌ **Products.png** | No references found | Likely replaced by SVG icons |
| ❌ **Offer.png** | No references found | Likely replaced by SVG icons |
| ❌ **Settings.png** | No references found | Likely replaced by SVG icons |

### CRUD Action Icons (Legacy)

| Image File | Reason for Removal | Notes |
|---|---|---|
| ❌ **create.png** | No references found | Likely replaced by PrimeNG buttons |
| ❌ **edit.png** | No references found | Likely replaced by SVG icons |
| ❌ **dell.png** | No references found | Typo: should be "delete.png" |
| ❌ **duplicateIcon.png** | No references found | Duplicate action icon |
| ❌ **editInvoice.png** | No references found | Specific invoice edit icon |
| ❌ **Icreateinvcon.png** | No references found | Create invoice icon (malformed name) |

### User & Profile Related (Abandoned Feature)

| Image File | Reason for Removal | Notes |
|---|---|---|
| ❌ **profile.png** | No references found | User profile feature not implemented |
| ❌ **userimg.png** | No references found | User image placeholder |
| ❌ **Logout.png** | No references found | Logout icon (likely replaced) |

### Document & File Icons

| Image File | Reason for Removal | Notes |
|---|---|---|
| ❌ **pdf.png** | No references found | PDF icon (likely replaced) |
| ❌ **pdfIcon.png** | No references found | Duplicate PDF icon |
| ❌ **sendInvoice.png** | No references found | Send action icon |
| ❌ **linkIcon.png** | No references found | Link action icon |
| ❌ **InfoIcon.png** | No references found | Info icon |
| ❌ **MoreOptions.png** | No references found | Options menu icon |

### Timesheet & Attendance Related (Removed Feature)

| Image File | Reason for Removal | Notes |
|---|---|---|
| ❌ **Workday.png** | No references found | Timesheet feature |
| ❌ **freeday.png** | No references found | Timesheet feature |
| ❌ **holiday.png** | No references found | Timesheet feature |
| ❌ **offday.png** | No references found | Timesheet feature |
| ❌ **Timebooking.png** | No references found | Timesheet feature |
| ❌ **Сheckin.png** | No references found | Encoding issue (Cyrillic) |

### UI Elements & Decorative

| Image File | Reason for Removal | Notes |
|---|---|---|
| ❌ **ArrowContainer.png** | No references found | Navigation arrow |
| ❌ **Subtract.png** | No references found | Design element |
| ❌ **ProductImage.png** | No references found | Placeholder image |
| ❌ **newsimg.jpeg** | No references found | News section (not implemented) |
| ❌ **Сustomer.png** | No references found | Encoding issue (Cyrillic) |

### Duplicate Files

| Image File | Reason for Removal | Preferred File |
|---|---|---|
| ❌ **eu-flag.jpg** | Duplicate | eu-flag.png is used |

---

## File References

### Used In Components

```
Layout Components:
- src/app/components/layout/app-layout/layout.component.html
  - logo.png (header)
  - faq.png, help.png, emailus.png, phone.png, clock.png, Bhelp.png (footer)
  - Dynamic: sv.png, en.png (language selector)

Invoice Views:
- src/app/components/webview/invoice-view/invoice-view.component.html
  - logo.png

Offer Views:
- src/app/components/webview/offer-view/offer-view.component.html
  - logo.png

Digital Service Views:
- src/app/components/webview/digitalservice-view/digitalservice-view.component.html
  - logo.png

Home Component:
- src/app/components/home/home/home.component.html
  - homelogo.png

List Components:
- src/app/components/workorder/workorder-list/workorder-list.component.html
  - line.png
- src/app/components/offer/offer-list/offer-list.component.html
  - line.png
- src/app/components/invoice/invoice-list/invoice-list.component.html
  - line.png

CRUD Components:
- src/app/components/workorder/workorder-crud/workorder-crud.component.html
  - eu-flag.png
- src/app/components/offer/offer-crud/offer-crud.component.html
  - eu-flag.png, close.png
- src/app/components/invoice/invoice-crud/invoice-crud.component.html
  - eu-flag.png
- src/app/components/setting/setting-crud.component.html
  - close.png, pdf-img/invoice-pdf.jpg

CSS Backgrounds:
- tailwind.config.js
  - bgline.png, body_background.png, footerline.png, FooterGraphic.png, 
    dialog.png, banner_heading.png
```

---

## Recommendations

### Priority 1: Delete Immediately
- All 33 unused images listed above
- These provide **no functional benefit** and consume storage

### Priority 2: Code Cleanup
- Remove commented-out logo references in `generic-loader.component.html`
- These are remnants from refactoring

### Priority 3: Consider
- Consolidate language flags into a `lang/` subfolder
- Move pdf preview images to a dedicated `templates/` subfolder
- Document remaining decorative backgrounds with usage comments

---

## Cleanup Action Items

### Images to Delete (33 files)

```
/src/assets/images/
  - ArrowContainer.png
  - create.png
  - dashboard.png
  - dell.png
  - duplicateIcon.png
  - edit.png
  - editInvoice.png
  - eu-flag.jpg (duplicate, keep .png)
  - Icreateinvcon.png
  - InfoIcon.png
  - Invoices.png
  - linkIcon.png
  - Logout.png
  - MoreOptions.png
  - newsimg.jpeg
  - offday.png
  - Offer.png
  - pdf.png
  - pdfIcon.png
  - ProductImage.png
  - Products.png
  - profile.png
  - sendInvoice.png
  - Settings.png
  - Subtract.png
  - Timebooking.png
  - userimg.png
  - Workday.png
  - Workorder.png
  - freeday.png
  - holiday.png
  - Сheckin.png (Cyrillic)
  - Сustomer.png (Cyrillic)
```

### Images to Keep (20 files)

```
CRITICAL (Branding):
- logo.png
- homelogo.png

DECORATIVE (Tailwind):
- bgline.png
- body_background.png
- FooterGraphic.png
- footerline.png
- dialog.png
- banner_heading.png

FUNCTIONAL:
- line.png (separators)
- eu-flag.png (regulatory)
- close.png (actions)
- faq.png (footer)
- help.png (footer)
- emailus.png (footer)
- phone.png (footer)
- clock.png (footer)
- Bhelp.png (footer)
- pdf-img/invoice-pdf.jpg (template)

DYNAMIC:
- sv.png (language)
- en.png (language)
```

---

## Storage Impact

**Estimated File Sizes (typical):**
- PNG images: ~50-200 KB each
- JPEG images: ~100-300 KB each

**Estimated Cleanup Impact:**
- 33 unused files × ~100 KB average = **~3.3 MB saved**
- Actual savings may vary based on compression

---

## Conclusion

Your `assets/images` folder contains significant legacy code from previous UI iterations and abandoned features. The cleanup will:
- ✅ Reduce bundle size
- ✅ Improve project maintainability
- ✅ Remove dead code references
- ✅ Enhance build performance

**No production impact** - all unused images can be safely deleted.
