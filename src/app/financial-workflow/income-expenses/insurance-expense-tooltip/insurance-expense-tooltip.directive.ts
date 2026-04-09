import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ScrollDispatcher } from '@angular/cdk/scrolling';
import { InsuranceExpenseTooltipBubbleComponent } from './insurance-expense-tooltip-bubble.component';

/** Insurance tile only: centered above the host, without CDK “push” (fixes sideways shift). */
@Directive({
  standalone: true,
  selector: '[appInsuranceExpenseTooltip]',
})
export class InsuranceExpenseTooltipDirective implements OnDestroy {
  private readonly overlay = inject(Overlay);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly vcr = inject(ViewContainerRef);
  private readonly scrollDispatcher = inject(ScrollDispatcher);

  private overlayRef: OverlayRef | null = null;

  @Input('appInsuranceExpenseTooltip')
  set message(value: string | null | undefined) {
    this._message = (value ?? '').trim();
  }
  get message(): string {
    return this._message;
  }
  private _message = '';

  ngOnDestroy(): void {
    this.detach();
  }

  private detach(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  @HostListener('mouseenter')
  @HostListener('focusin')
  onPointerEnter(): void {
    if (!this._message) return;
    this.attach();
  }

  @HostListener('mouseleave')
  @HostListener('focusout')
  onPointerLeave(): void {
    this.detach();
  }

  private attach(): void {
    if (!this._message || this.overlayRef?.hasAttached()) return;

    const strategy = this.overlay
      .position()
      .flexibleConnectedTo(this.elementRef)
      .withFlexibleDimensions(false)
      .withPush(false)
      .withViewportMargin(8)
      .withScrollableContainers(
        this.scrollDispatcher.getAncestorScrollContainers(this.elementRef),
      )
      .withPositions([
        {
          originX: 'center',
          originY: 'top',
          overlayX: 'center',
          overlayY: 'bottom',
          offsetY: -8,
        },
        {
          originX: 'center',
          originY: 'bottom',
          overlayX: 'center',
          overlayY: 'top',
          offsetY: 8,
        },
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy: strategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition({ scrollThrottle: 20 }),
      panelClass: 'mat-mdc-tooltip-panel',
    });

    const portal = new ComponentPortal(
      InsuranceExpenseTooltipBubbleComponent,
      this.vcr,
    );
    const ref = this.overlayRef.attach(portal);
    ref.instance.message = this._message;
    ref.changeDetectorRef.detectChanges();
  }
}
