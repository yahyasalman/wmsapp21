// theme.service.ts
import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

type Shade = 50|100|200|300|400|500|600|700|800|900|950;
const SHADES: Shade[] = [50,100,200,300,400,500,600,700,800,900,950];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private styleEl: HTMLStyleElement;

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.styleEl = this.document.getElementById('dynamic-primary') as HTMLStyleElement;
    if (!this.styleEl) {
      this.styleEl = this.document.createElement('style');
      this.styleEl.id = 'dynamic-primary';
      this.document.head.appendChild(this.styleEl);
    }
  }

  // Option A: Use a built-in palette name (e.g., 'rose', 'indigo', 'emerald', 'violet', etc.)
  setPrimaryPalette(paletteName: string) {
    // Remap semantic primary to the selected palette’s base tokens.
    const css = `:root{${SHADES
      .map(s => `--p-primary-${s}: var(--p-${paletteName}-${s});`)
      .join('')}}`;
    this.styleEl.textContent = css;
  }
  // Toggle dark mode for the preset
  setDarkMode(enable: boolean) {
    // Prime’s token themes apply dark variants when 'p-dark' is present on the root
    this.document.documentElement.classList.toggle('p-dark', enable);    
    // Apply 'dark' class to html element for Tailwind dark: utilities
    this.document.documentElement.classList.toggle('dark', enable);
    
    // Log for debugging
    console.log('Dark mode class applied:', enable);
    console.log('HTML element has p-dark:', this.document.documentElement.classList.contains('p-dark'));
    console.log('HTML element has dark:', this.document.documentElement.classList.contains('dark'));
  }

}
