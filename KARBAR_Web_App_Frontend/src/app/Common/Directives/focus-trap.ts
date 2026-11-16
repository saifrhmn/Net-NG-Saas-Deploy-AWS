import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appFocusTrap]',
  standalone: true
})
export class FocusTrapDirective {
  constructor(private el: ElementRef<HTMLElement>) {}

  private getFocusable(): HTMLElement[] {
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];
    return Array.from(
      this.el.nativeElement.querySelectorAll<HTMLElement>(selectors.join(','))
    ).filter(e => e.offsetParent !== null);
  }

  @HostListener('keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;
    const items = this.getFocusable();
    if (!items.length) {
      e.preventDefault();
      return;
    }
    const current = document.activeElement as HTMLElement;
    const idx = items.indexOf(current);
    if (e.shiftKey) {
      // backwards
      if (idx <= 0) {
        e.preventDefault();
        items[items.length - 1].focus();
      }
    } else {
      // forwards
      if (idx === items.length - 1) {
        e.preventDefault();
        items[0].focus();
      }
    }
  }
}