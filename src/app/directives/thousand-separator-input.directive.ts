// thousand-separator-input.directive.ts
import { Directive, ElementRef, HostListener, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[thousandSeparatorInput]',
  standalone: true
})
export class ThousandSeparatorInputDirective {
  private locale = 'en-US';
  private isRaw = false; // are we showing raw (no commas) right now?

  constructor(private el: ElementRef<HTMLInputElement>, @Optional() private ngControl?: NgControl) {}

  ngAfterViewInit() {
    // format once when the control is shown
    queueMicrotask(() => this.formatView());
  }

  // ✅ Keep commas when focusing the field (no unformat here)
  @HostListener('focus')
  onFocus() {
    // do nothing — keep the formatted value visible
  }

  // ✅ First real edit: switch to raw (no commas) *before* the keystroke is applied
  @HostListener('beforeinput', ['$event'])
  onBeforeInput(e: InputEvent) {
    if (!this.isRaw) {
      this.unformatView();
      this.isRaw = true;
    }
  }

  // Paste should also trigger raw mode
  @HostListener('paste', ['$event'])
  onPaste() {
    if (!this.isRaw) {
      this.unformatView();
      this.isRaw = true;
    }
  }

  // Keep model numeric while typing
  @HostListener('input')
  onInput() {
    const raw = this.el.nativeElement.value.replace(/,/g, '');
    const num = raw === '' ? null : Number(raw);
    this.setControlValue(isNaN(num as number) ? null : num);
  }

  // Reformat with commas on blur
  @HostListener('blur')
  onBlur() {
    this.formatView();
    this.isRaw = false;
  }

  // --- helpers ---
  private formatView() {
    const val = this.controlValue();
    if (val === null || val === undefined || val === '') {
      this.el.nativeElement.value = '';
      return;
    }
    const num = Number(val);
    this.el.nativeElement.value = isNaN(num) ? String(val) : num.toLocaleString(this.locale);
  }

  private unformatView() {
    const current = this.el.nativeElement.value;
    const raw = current.replace(/,/g, '');
    this.el.nativeElement.value = raw;
    // move caret to end for a natural typing feel
    const el = this.el.nativeElement;
    queueMicrotask(() => el.setSelectionRange(el.value.length, el.value.length));
  }

  private controlValue() {
    return this.ngControl?.control?.value;
  }
  private setControlValue(v: any) {
    this.ngControl?.control?.setValue(v, { emitEvent: true });
  }
}
