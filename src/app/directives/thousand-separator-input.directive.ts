import {
  Directive,
  ElementRef,
  HostListener,
  Optional,
  OnInit
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

@Directive({
  selector: '[thousandSeparatorInput]',
  standalone: true
})
export class ThousandSeparatorInputDirective implements OnInit {

  private thousand = ',';
  private decimal = '.';

  constructor(
    private el: ElementRef<HTMLInputElement>,
    @Optional() private ngControl: NgControl,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.setSeparators();
    this.translate.onLangChange.subscribe(() => {
      this.setSeparators();
      this.formatView();
    });
  }

  private setSeparators() {
    if (this.translate.currentLang === 'it') {
      this.thousand = '.';
      this.decimal = ',';
    } else {
      this.thousand = ',';
      this.decimal = '.';
    }
  }


  @HostListener('input')
  onInput() {
    const el = this.el.nativeElement;
    const prevValue = el.value;
    const cursor = el.selectionStart ?? prevValue.length;

    const digitsBefore = this.countDigits(prevValue.slice(0, cursor));

    const raw = prevValue
      .split(this.thousand).join('')
      .replace(this.decimal, '.')
      .replace(/[^\d.]/g, '')
      .replace(/(\..*)\./g, '$1');

    const num = raw === '' || raw === '.' ? null : Number(raw);
    this.ngControl?.control?.setValue(
      isNaN(Number(num)) ? null : num,
      { emitEvent: false }
    );

    const formatted = this.formatNumber(raw);

    el.value = formatted;
    const newCursor = this.indexForDigitCount(formatted, digitsBefore);
    queueMicrotask(() => el.setSelectionRange(newCursor, newCursor));
  }

  @HostListener('blur')
  onBlur() {
    this.formatView();
  }

  private formatView() {
    const value = this.ngControl?.control?.value;
    if (value === null || value === undefined || value === '') {
      this.el.nativeElement.value = '';
      return;
    }

    this.el.nativeElement.value = new Intl.NumberFormat(
      this.translate.currentLang === 'it' ? 'it-IT' : 'en-US'
    ).format(value);
  }

  private formatNumber(raw: string): string {
    if (!raw) return '';
    const [ints, decs] = raw.split('.');
    const intNum = Number(ints);
    const intFmt = isNaN(intNum)
      ? ints
      : intNum.toLocaleString(
          this.translate.currentLang === 'it' ? 'it-IT' : 'en-US'
        );

    return decs !== undefined ? `${intFmt}${this.decimal}${decs}` : intFmt;
  }

  private countDigits(s: string): number {
    return (s.match(/\d/g) ?? []).length;
  }

  private indexForDigitCount(s: string, target: number): number {
    if (target <= 0) return 0;
    let count = 0;
    for (let i = 0; i < s.length; i++) {
      if (/\d/.test(s[i])) count++;
      if (count === target) return i + 1;
    }
    return s.length;
  }
}
