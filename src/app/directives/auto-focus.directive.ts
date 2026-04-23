import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';

/**
 * Programmatically focuses the host input/textarea once it becomes visible,
 * to remove a click for the user when the next obvious action is to type.
 *
 * Usage:
 *   <input matInput formControlName="amount" appAutoFocus />
 *   <input matInput formControlName="name" [appAutoFocus]="!isEditMode" />
 *   <input matInput formControlName="amount" appAutoFocus autoFocusSelect />
 *
 * Behaviour:
 *  - Fires once after the host is mounted (so it works for fields revealed by
 *    `*ngIf`/`@if` after a form-state change).
 *  - When the bound condition transitions from false → true at runtime it
 *    focuses again (e.g. a field unhides without being remounted).
 *  - Skips when the field is disabled, read-only or visually hidden.
 *  - Skips when the user has already moved focus to a different element that
 *    is not part of MatDialog's default focus landing.
 *  - Optional `autoFocusSelect` selects existing text/numeric value so the
 *    user can overwrite it without first clearing.
 */
@Directive({
  selector: '[appAutoFocus]',
  standalone: true,
})
export class AutoFocusDirective implements AfterViewInit, OnChanges, OnDestroy {
  /**
   * When truthy, schedules a focus call. Empty string (`appAutoFocus`)
   * is treated as `true` so the directive can be used with no value.
   */
  @Input('appAutoFocus') enabled: boolean | string | null | undefined = true;

  /**
   * Selects the current value after focusing. Useful for numeric inputs that
   * already display a default value the user is likely to overwrite.
   */
  @Input() autoFocusSelect: boolean | string = false;

  /**
   * Delay (ms) before attempting focus. The default leaves enough time for
   * MatDialog's open animation (~225ms) and conditional `@if` blocks to settle
   * before we move focus, otherwise the browser may scroll/restyle around us.
   */
  @Input() autoFocusDelay = 200;

  private hasFocusedOnce = false;
  private pendingTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private host: ElementRef<HTMLElement>,
    private zone: NgZone,
  ) {}

  ngAfterViewInit(): void {
    if (this.isEnabled()) {
      this.scheduleFocus();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const change = changes['enabled'];
    if (!change || change.firstChange) {
      return;
    }
    if (this.isEnabled() && !this.toBool(change.previousValue)) {
      this.hasFocusedOnce = false;
      this.scheduleFocus();
    }
  }

  ngOnDestroy(): void {
    if (this.pendingTimer != null) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }
  }

  private isEnabled(): boolean {
    return this.toBool(this.enabled);
  }

  private toBool(value: unknown): boolean {
    return value === '' || value === true || value === 'true';
  }

  private scheduleFocus(): void {
    if (this.hasFocusedOnce) return;
    if (this.pendingTimer != null) {
      clearTimeout(this.pendingTimer);
    }
    this.zone.runOutsideAngular(() => {
      this.pendingTimer = setTimeout(() => {
        this.pendingTimer = null;
        this.tryFocus();
      }, this.autoFocusDelay);
    });
  }

  private tryFocus(): void {
    const el = this.host.nativeElement as HTMLElement | null;
    if (!el) return;
    if (!this.isFocusableNow(el)) return;

    const active = (typeof document !== 'undefined' ? document.activeElement : null) as HTMLElement | null;
    if (active && active !== el && !this.canTakeFocusFrom(active, el)) {
      // The user has deliberately moved focus elsewhere — don't steal it.
      return;
    }

    try {
      el.focus({ preventScroll: false });
    } catch {
      return;
    }

    if (this.toBool(this.autoFocusSelect)) {
      const input = el as HTMLInputElement;
      const value = (input.value ?? '').toString();
      if (value !== '' && value !== '0' && typeof input.select === 'function') {
        try {
          input.select();
        } catch {
          /* element may not support selection (e.g. non-text input) */
        }
      }
    }

    this.hasFocusedOnce = true;
  }

  private isFocusableNow(el: HTMLElement): boolean {
    const input = el as HTMLInputElement;
    if (input.disabled) return false;
    if (input.readOnly) return false;
    if (el.hasAttribute('hidden')) return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    // offsetParent is null for elements with display:none, or detached nodes.
    if (el.offsetParent === null) {
      const style = typeof getComputedStyle === 'function' ? getComputedStyle(el) : null;
      if (!style || style.position !== 'fixed') return false;
    }
    return true;
  }

  private canTakeFocusFrom(active: HTMLElement, target: HTMLElement): boolean {
    if (active.tagName === 'BODY') return true;
    if (active.classList.contains('mat-mdc-dialog-container')) return true;
    if (active.classList.contains('cdk-overlay-pane')) return true;
    if (active.classList.contains('cdk-overlay-container')) return true;

    const dialog = target.closest(
      '.mat-mdc-dialog-container, .cdk-dialog-container, .cdk-overlay-pane',
    );

    // If our target lives in a dialog/overlay and the current focus is OUTSIDE
    // that overlay (typically the trigger button that opened the dialog), it's
    // safe — and expected — to move focus into the freshly opened dialog.
    if (dialog && !dialog.contains(active)) return true;

    // Focus currently sits inside the same dialog → assume MatDialog's default
    // autoFocus put it there (or another control we just rendered) and the user
    // hasn't typed yet, so it's safe to override.
    if (dialog && dialog.contains(active)) {
      const tag = active.tagName;
      const isTextEntry =
        (tag === 'INPUT' || tag === 'TEXTAREA') &&
        !!(active as HTMLInputElement).value;
      // Don't yank focus out of a field the user has already started filling.
      return !isTextEntry;
    }

    // Target is not inside a dialog (inline form). Only steal from non-form
    // controls (e.g. buttons) so we never interrupt typing in another input.
    const tag = active.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return false;
    return true;
  }
}
