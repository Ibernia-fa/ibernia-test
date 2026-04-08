import {
  Directive,
  ElementRef,
  HostListener,
  Optional,
  OnInit,
  OnDestroy
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import {
  APP_DISPLAY_NUMBER_FORMAT,
  localeFromAppLanguage,
} from 'src/app/shared/utils/number-utils';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[thousandSeparatorInput]',
  standalone: true
})
export class ThousandSeparatorInputDirective implements OnInit {

  private thousand = ',';
  private decimal = '.';
  private subs = new Subscription();

  constructor(
    private el: ElementRef<HTMLInputElement>,
    @Optional() private ngControl: NgControl,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.setSeparators();
    this.subs.add(
      this.translate.onLangChange.subscribe(() => {
        this.setSeparators();
        this.formatViewPreserveCursor();
      })
    );

    // Ensure programmatic updates (patchValue, reopening with saved data, toggles)
    // also render with locale-aware grouping.
    this.subs.add(
      this.ngControl?.control?.valueChanges?.subscribe(() => {
        this.formatViewPreserveCursor();
      }) ?? new Subscription()
    );

    setTimeout(() => this.formatViewPreserveCursor());
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
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
    // emitEvent must be true so host templates that also bind [value] to FormControl
    // (e.g. amount | thousandSeparator) sync on the same tick; emit false left them stale
    // and change detection overwrote the input back to the old grouped value.
    this.ngControl?.control?.setValue(
      isNaN(Number(num)) ? null : num,
      { emitEvent: true },
    );

    const formatted = this.formatNumber(raw);

    el.value = formatted;
    const newCursor = this.indexForDigitCount(formatted, digitsBefore);
    queueMicrotask(() => el.setSelectionRange(newCursor, newCursor));
  }

  @HostListener('blur')
  onBlur() {
    this.formatViewPreserveCursor();
  }

  private formatView() {
    const value = this.ngControl?.control?.value;
    if (value === null || value === undefined || value === '') {
      this.el.nativeElement.value = '';
      return;
    }

    this.el.nativeElement.value = new Intl.NumberFormat(
      localeFromAppLanguage(this.translate.currentLang),
      APP_DISPLAY_NUMBER_FORMAT,
    ).format(value);
  }

  private formatViewPreserveCursor(): void {
    const el = this.el.nativeElement;
    const prevValue = el.value ?? '';
    const cursor = el.selectionStart ?? prevValue.length;
    const digitsBefore = this.countDigits(prevValue.slice(0, cursor));

    this.formatView();

    const formatted = el.value ?? '';
    const newCursor = this.indexForDigitCount(formatted, digitsBefore);
    queueMicrotask(() => {
      try {
        el.setSelectionRange(newCursor, newCursor);
      } catch {
        // Ignore if input is not focusable at the moment.
      }
    });
  }

  private formatNumber(raw: string): string {
    if (!raw) return '';
    const [ints, decs] = raw.split('.');
    const intNum = Number(ints);
    const intFmt = isNaN(intNum)
      ? ints
      : intNum.toLocaleString(localeFromAppLanguage(this.translate.currentLang), {
          ...APP_DISPLAY_NUMBER_FORMAT,
          maximumFractionDigits: 0,
          minimumFractionDigits: 0,
        });

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
