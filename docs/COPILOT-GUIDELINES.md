# GitHub Copilot Instructions
## SaaS Project – Angular 21 + PrimeNG 21 + Tailwind CSS v4

---

# 1. Project Overview

This is a SaaS application built with:

- Angular 21 (Standalone Components)
- PrimeNG 21 (UI Component Library)
- Tailwind CSS v4 (Layout Utilities Only)

The application uses a **token-based theming architecture**.

The system must support:

- Runtime theme switching
- Primary color override
- Future dark/light mode
- White-label multi-tenant customization
- Zero hardcoded colors

All UI must be color-independent and driven by semantic tokens.

---

# 2. Core Styling Philosophy

## 🔵 PrimeNG is responsible for component styling.
## 🟢 Tailwind is responsible for layout only.

There must be strict separation between them.

---

# 3. PrimeNG Styling Rules (STRICT)

PrimeNG components MUST:

- Use PrimeNG built-in styling
- Use PrimeNG semantic tokens
- Be customized only via standard CSS when required
- Never use Tailwind color utilities

## ❌ Forbidden Examples

```html
<p-button class="bg-blue-500 text-white"></p-button>
<p-card class="border-red-400"></p-card>
<p-inputText class="text-green-600"></p-inputText>
