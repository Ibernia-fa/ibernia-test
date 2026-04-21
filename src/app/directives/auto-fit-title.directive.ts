import {
  AfterViewInit,
  DestroyRef,
  Directive,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';

/**
 * Forces a title element to render on a single line, scaling its font-size
 * down (from a desired max) until the text fits the available width.
 *
 * Used across School slide titles to guarantee consistent, single-line headings
 * in every supported language without manual per-string tuning.
 *
 * The "max" font size is the element's stylesheet/computed font-size — meaning
 * each slide can declare its preferred title size (and responsive variants) in
 * its own SCSS, and this directive only scales it down when needed.
 *
 * Usage:
 *   <h1 class="my-hero" appAutoFitTitle>{{ title | translate }}</h1>
 *   <h1 appAutoFitTitle [autoFitMin]="16">…</h1>
 */
@Directive({
  selector: '[appAutoFitTitle]',
  standalone: true,
})
export class AutoFitTitleDirective implements AfterViewInit, OnDestroy {
  /** Minimum font-size in px before we stop shrinking. */
  @Input() autoFitMin = 14;

  /** Step (px) used while shrinking. Smaller values = more precise fit. */
  @Input() autoFitStep = 0.5;

  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private rafId: number | null = null;

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService, { optional: true });

  ngAfterViewInit(): void {
    const node = this.el.nativeElement;
    node.style.whiteSpace = 'nowrap';
    node.style.overflow = 'hidden';
    node.style.textOverflow = 'clip';
    node.style.maxWidth = '100%';

    this.zone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => this.scheduleFit());
      const parent = node.parentElement ?? node;
      this.resizeObserver.observe(parent);

      this.mutationObserver = new MutationObserver(() => this.scheduleFit());
      this.mutationObserver.observe(node, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    });

    this.translate?.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.scheduleFit());

    const fontFaces = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
    fontFaces?.ready?.then(() => this.scheduleFit()).catch(() => undefined);

    this.scheduleFit();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
  }

  private scheduleFit(): void {
    if (this.rafId !== null) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.fit();
    });
  }

  private fit(): void {
    const node = this.el.nativeElement;
    if (!node?.isConnected) return;

    // Reset inline override so we can read the stylesheet's intended (max) size.
    node.style.fontSize = '';
    const computed = parseFloat(getComputedStyle(node).fontSize);
    const max = Number.isFinite(computed) && computed > 0 ? computed : 24;
    const min = Math.max(8, this.autoFitMin);
    const step = Math.max(0.25, this.autoFitStep);

    if (node.scrollWidth <= node.clientWidth + 0.5) {
      // Already fits at the CSS-declared size; leave inline style empty so
      // responsive breakpoints continue to control the title size.
      return;
    }

    let size = max;
    while (size > min && node.scrollWidth > node.clientWidth + 0.5) {
      size = Math.max(min, +(size - step).toFixed(2));
      node.style.fontSize = `${size}px`;
      if (size <= min) break;
    }
  }
}
