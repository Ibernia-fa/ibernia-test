import { Pipe, PipeTransform } from '@angular/core';
import { stripTrailingPeriodForShortUiMessage } from 'src/app/shared/utils/ui-message-format';

/**
 * Use after translate or for raw API strings: `{{ 'KEY' | translate | shortUiMessage }}`
 */
@Pipe({
  name: 'shortUiMessage',
  standalone: true,
  pure: true,
})
export class ShortUiMessagePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return stripTrailingPeriodForShortUiMessage(value);
  }
}
