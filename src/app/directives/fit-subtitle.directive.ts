import {
  AfterViewInit,
  DestroyRef,
  Directive,
  ElementRef,
  NgZone,
  OnDestroy,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';

/**
 * Keeps a subtitle on a single line whenever the available container width
 * can fit the natural text width. Falls back to normal wrapping only when the
 * text genuinely doesn't fit (no font-size reduction is performed).
 *
 * Used across School slide subtitles to prevent premature/awkward wrapping
 * caused by tight `max-width` constraints, while still letting long
 * translations (typically Italian) wrap cleanly when truly necessary.
 *
 * The directive forces `max-width: 100%` on the host element so any author
 * `max-width` is treated as a soft hint, not a hard cap.
 *
 * Usage:
 *   <p class="my-subtitle" appFitSubtitle>{{ key | translate }}</p>
 */
@Directive({
  selector: '[appFitSubtitle]',
  standalone: true,
})
export class FitSubtitleDirective implements AfterViewInit, OnDestroy {
  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private rafId: number | null = null;

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService, { optional: true });

  ngAfterViewInit(): void {
    const node = this.el.nativeElement;
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

    // First, try to render on a single line. If the text actually fits the
    // available container width, we keep `nowrap`; otherwise we revert to
    // normal wrapping so the text stays fully visible.
    node.style.whiteSpace = 'nowrap';
    if (node.scrollWidth <= node.clientWidth + 0.5) {
      return;
    }
    node.style.whiteSpace = 'normal';
  }
}
