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
//   @HostListener('input')
//   onInput() {
//     const raw = this.el.nativeElement.value.replace(/,/g, '');
//     const num = raw === '' ? null : Number(raw);
//     this.setControlValue(isNaN(num as number) ? null : num);
//   }

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

  @HostListener('input')
onInput() {
  const el = this.el.nativeElement;
  const prevDisplay = el.value;
  const prevCursor = el.selectionStart ?? prevDisplay.length;

  // how many digits were before the old caret?
  const prevDigitsBeforeCaret = this.countDigits(prevDisplay.slice(0, prevCursor));

  // sanitize: keep digits and a single dot; strip commas/spaces
  const raw = prevDisplay.replace(/,/g, '').replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');

  // update the model as a number (or null if empty)
  const num = raw === '' || raw === '.' ? null : Number(raw);
  this.setControlValue(isNaN(Number(num)) ? null : num);

  // reformat for display (group integer part only)
  const nextDisplay = this.formatWithCommas(raw);

  if (nextDisplay !== prevDisplay) {
    el.value = nextDisplay;

    // restore caret to the position that has the same digit-count to the left
    const nextCursor = this.indexForDigitCount(nextDisplay, prevDigitsBeforeCaret);
    queueMicrotask(() => el.setSelectionRange(nextCursor, nextCursor));
  }
}

private formatWithCommas(raw: string): string {
  if (!raw) return '';
  const [ints, decs] = raw.split('.');
  const intsNum = ints ? Number(ints) : 0;
  const intsFmt = ints ? intsNum.toLocaleString(this.locale) : '';
  return decs !== undefined ? `${intsFmt}.${decs}` : intsFmt;
}

private countDigits(s: string): number {
  return (s.match(/\d/g) ?? []).length;
}

private indexForDigitCount(s: string, targetDigits: number): number {
  if (targetDigits <= 0) return 0;
  let count = 0;
  for (let i = 0; i < s.length; i++) {
    if (/\d/.test(s[i])) count++;
    if (count === targetDigits) return i + 1; // caret after that digit
  }
  return s.length;
}

}
