// src/app/shared/directives/integer-only.directive.ts
import { Directive, ElementRef, HostListener, Input, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appIntegerOnly]' // keep the same selector for backwards-compat
})
export class IntegerOnlyDirective implements OnInit {
  // existing options …
  @Input() integerMin?: number;
  @Input() integerMax?: number;
  @Input() integerMaxLength?: number; // counts digits only

  // NEW: decimals support
  @Input() allowDecimal = false;
  @Input() decimalMaxPlaces?: number; // e.g. 2 for 2dp

  private readonly allowedKeys = new Set([
    'Backspace','Delete','Tab','Escape','Enter',
    'Home','End','ArrowLeft','ArrowRight'
  ]);

  constructor(private el: ElementRef<HTMLInputElement>, private r: Renderer2) {}

  ngOnInit(): void {
    this.r.setAttribute(this.el.nativeElement, 'inputmode', this.allowDecimal ? 'decimal' : 'numeric');
    this.r.setAttribute(this.el.nativeElement, 'pattern', this.allowDecimal ? '[0-9]+([.][0-9]+)?' : '[0-9]*');
    if (!this.el.nativeElement.getAttribute('type')) {
      this.r.setAttribute(this.el.nativeElement, 'type', 'text');
    }
  }

  @HostListener('keydown', ['$event'])
  onKeydown(e: KeyboardEvent) {
    // allow ctrl/cmd shortcuts
    if ((e.ctrlKey || e.metaKey) && ['a','c','v','x','z','y'].includes(e.key.toLowerCase())) return;
    if (this.allowedKeys.has(e.key)) return;

    // allow one dot if decimals are enabled
    if (this.allowDecimal && (e.key === '.' || e.key === 'Decimal')) {
      const { value, selectionStart, selectionEnd } = this.el.nativeElement;
      const hasDot = value.includes('.');
      const selection = value.substring(selectionStart ?? 0, selectionEnd ?? 0);
      if (hasDot && !selection.includes('.')) e.preventDefault();
      return;
    }

    // digits only
    if (!/^[0-9]$/.test(e.key)) e.preventDefault();

    // enforce max length (digits only)
    if (this.integerMaxLength && /^[0-9]$/.test(e.key)) {
      const input = this.el.nativeElement;
      const { selectionStart, selectionEnd, value } = input;
      const currentDigits = value.replace(/\D/g, '');
      const selectedDigits = (value.substring(selectionStart ?? 0, selectionEnd ?? 0)).replace(/\D/g, '');
      const nextLen = currentDigits.length - selectedDigits.length + 1;
      if (nextLen > this.integerMaxLength) e.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(e: ClipboardEvent) {
    e.preventDefault();
    let txt = (e.clipboardData?.getData('text') ?? '').replace(/[^\d.]/g, '');
    if (this.allowDecimal) {
      const i = txt.indexOf('.');
      if (i !== -1) txt = txt.slice(0, i + 1) + txt.slice(i + 1).replace(/\./g, '');
    } else {
      txt = txt.replace(/\./g, '');
    }
    this.insertAtCursor(txt);
    this.sanitizeAndClamp();
  }

  @HostListener('drop', ['$event']) onDrop(e: DragEvent) { e.preventDefault(); }

  @HostListener('input') onInput() { this.sanitizeAndClamp(); }

//   private sanitizeAndClamp() {
//     const input = this.el.nativeElement;
//     let s = (input.value ?? '').replace(/[^\d.]/g, '');

//     if (!this.allowDecimal) {
//       s = s.replace(/\./g, '');
//     } else {
//       // keep only first dot
//       const i = s.indexOf('.');
//       if (i !== -1) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '');

//       // trim decimals to max places
//       if (this.decimalMaxPlaces != null && i !== -1) {
//         const [intPart, fracPart = ''] = s.split('.');
//         s = intPart + '.' + fracPart.slice(0, this.decimalMaxPlaces);
//       }
//     }

//     // enforce max digits (ignore dot)
//     if (this.integerMaxLength) {
//       const digits = s.replace(/\D/g, '').slice(0, this.integerMaxLength);
//       const dot = this.allowDecimal && s.includes('.') ? '.' : '';
//       const intLen = s.split('.')[0].length;
//       // reconstruct preferring original order
//       if (dot) {
//         const [intPart, fracPart = ''] = s.split('.');
//         const needed = this.integerMaxLength - intPart.replace(/\D/g, '').length;
//         s = intPart.replace(/\D/g, '').slice(0, this.integerMaxLength) +
//             (needed > 0 ? '.' + fracPart.replace(/\D/g, '').slice(0, Math.min(needed, this.decimalMaxPlaces ?? fracPart.length)) : '');
//       } else {
//         s = digits;
//       }
//     }

//     // clamp min/max
//     if (s !== '' && s !== '.') {
//       let n = parseFloat(s);
//       if (Number.isFinite(n)) {
//         if (this.integerMin != null && n < this.integerMin) n = this.integerMin;
//         if (this.integerMax != null && n > this.integerMax) n = this.integerMax;
//         // keep at most decimalMaxPlaces (if set)
//         s = (this.decimalMaxPlaces != null && this.allowDecimal)
//           ? n.toFixed(this.decimalMaxPlaces).replace(/\.?0+$/,'')  // strip trailing zeros
//           : String(n);
//       }
//     } else if (s === '.') {
//       // a lone dot is awkward; turn into "0." so the user can keep typing
//       s = this.allowDecimal ? '0.' : '';
//     }

//     if (input.value !== s) {
//       const pos = s.length;
//       input.value = s;
//       input.dispatchEvent(new Event('input', { bubbles: true }));
//       input.setSelectionRange(pos, pos);
//     }
//   }

private sanitizeAndClamp() {
  const input = this.el.nativeElement;
  let s = (input.value ?? '').replace(/[^\d.]/g, '');

  // keep only first dot
  const i = s.indexOf('.');
  if (i !== -1) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '');

  if (!this.allowDecimal) {
    s = s.replace(/\./g, '');
  }

  // NEW: detect "ends with dot" (e.g., "12.")
  const endsWithDot =
    this.allowDecimal &&
    input.value.endsWith('.') &&
    s.includes('.') &&
    (s.split('.')[1] ?? '') === '';

  // (optional) trim fractional digits to max places, but NOT when endsWithDot
  if (this.allowDecimal && !endsWithDot && this.decimalMaxPlaces != null && i !== -1) {
    const [intPart, fracPart = ''] = s.split('.');
    s = intPart + '.' + fracPart.slice(0, this.decimalMaxPlaces);
  }

  // clamp only when we have a numeric value AND not in the "12." state
  if (!endsWithDot && s !== '' && s !== '.') {
    let n = parseFloat(s);
    if (Number.isFinite(n)) {
      if (this.integerMin != null && n < this.integerMin) n = this.integerMin;
      if (this.integerMax != null && n > this.integerMax) n = this.integerMax;

      // IMPORTANT: do NOT use toFixed() here (it kills "12.")
      // Keep user's precision, and (optionally) trim extra decimals by slicing.
      s = String(n);
      if (this.allowDecimal && this.decimalMaxPlaces != null) {
        const [ip, fp = ''] = s.split('.');
        s = fp ? ip + '.' + fp.slice(0, this.decimalMaxPlaces) : ip;
      }
    }
  } else if (s === '.') {
    s = this.allowDecimal ? '0.' : '';
  }

  if (input.value !== s) {
    const pos = s.length;
    input.value = s;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.setSelectionRange(pos, pos);
  }
}


  private insertAtCursor(text: string) {
    const input = this.el.nativeElement;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    let next = input.value.slice(0, start) + text + input.value.slice(end);
    input.value = next;
    const caret = start + text.length;
    input.setSelectionRange(caret, caret);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
