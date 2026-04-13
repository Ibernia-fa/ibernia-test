import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

/**
 * Compact relative time for notification dropdown (e.g. "2h ago", "Few minutes ago").
 */
@Pipe({
  name: 'notificationRelativeTime',
  standalone: true,
})
export class NotificationRelativeTimePipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(value: Date | string | number | null | undefined): string {
    if (value == null || value === '') {
      return '';
    }
    const date = new Date(value);
    const time = date.getTime();
    if (Number.isNaN(time)) {
      return '';
    }

    const diffMs = Date.now() - time;
    const sec = Math.floor(diffMs / 1000);

    if (sec < 60) {
      return this.translate.instant('TIME.JUST_NOW');
    }

    const min = Math.floor(sec / 60);
    if (min < 60) {
      if (min < 5) {
        return this.translate.instant('TIME.FEW_MINUTES_AGO');
      }
      return min === 1
        ? this.translate.instant('TIME.SHORT.MIN_AGO_SINGLE')
        : this.translate.instant('TIME.SHORT.MIN_AGO_MULTI', { value: min });
    }

    const hr = Math.floor(min / 60);
    if (hr < 24) {
      return hr === 1
        ? this.translate.instant('TIME.SHORT.H_AGO_SINGLE')
        : this.translate.instant('TIME.SHORT.H_AGO_MULTI', { value: hr });
    }

    const day = Math.floor(hr / 24);
    if (day < 7) {
      return day === 1
        ? this.translate.instant('TIME.SHORT.D_AGO_SINGLE')
        : this.translate.instant('TIME.SHORT.D_AGO_MULTI', { value: day });
    }

    if (day < 30) {
      const w = Math.floor(day / 7);
      return w === 1
        ? this.translate.instant('TIME.SHORT.W_AGO_SINGLE')
        : this.translate.instant('TIME.SHORT.W_AGO_MULTI', { value: w });
    }

    if (day < 365) {
      const mo = Math.floor(day / 30);
      return mo === 1
        ? this.translate.instant('TIME.SHORT.MO_AGO_SINGLE')
        : this.translate.instant('TIME.SHORT.MO_AGO_MULTI', { value: mo });
    }

    const y = Math.floor(day / 365);
    return y === 1
      ? this.translate.instant('TIME.SHORT.Y_AGO_SINGLE')
      : this.translate.instant('TIME.SHORT.Y_AGO_MULTI', { value: y });
  }
}
