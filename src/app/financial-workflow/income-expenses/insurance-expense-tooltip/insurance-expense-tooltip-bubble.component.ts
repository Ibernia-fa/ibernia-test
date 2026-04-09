import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';

/** Content only; overlay positioning is handled by `InsuranceExpenseTooltipDirective`. */
@Component({
  selector: 'app-insurance-expense-tooltip-bubble',
  standalone: true,
  template: `
    <div
      role="tooltip"
      class="mat-mdc-tooltip-surface mdc-tooltip__surface"
    >
      {{ message }}
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsuranceExpenseTooltipBubbleComponent {
  message = '';
}
