import { Directive, ElementRef, Input, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appRemovePlaceholderOnFocus]'
})
export class RemovePlaceholderOnFocusDirective {
  @Input('appRemovePlaceholderOnFocus') placeholderText: string | null = '';

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('focus')
  onFocus() {
    this.renderer.setAttribute(this.el.nativeElement, 'placeholder', '');
  }

  @HostListener('blur')
  onBlur() {
    if (!this.el.nativeElement.value) {
      this.renderer.setAttribute(this.el.nativeElement, 'placeholder', this.placeholderText ?? '');
    }
  }

  ngOnInit() {
    if (this.placeholderText) {
      this.renderer.setAttribute(this.el.nativeElement, 'placeholder', this.placeholderText);
    }
  }
}
