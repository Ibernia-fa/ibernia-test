import { Pipe, PipeTransform } from '@angular/core';
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'timeAgo',
})
export class TimeAgoPipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(value: Date | string | number): string {
    if (!value) return this.translate.instant('TIME.INVALID');

    const date = new Date(value);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60 && diffInSeconds > 0) {
      return this.translate.instant('TIME.SECONDS_AGO', {
        value: diffInSeconds,
      });
    } else if (diffInMinutes < 60) {
      return this.translate.instant('TIME.MINUTES_AGO', {
        value: diffInMinutes,
      });
    } else if (diffInHours < 24) {
      return this.translate.instant('TIME.HOURS_AGO', {
        value: diffInHours,
      });
    } else {
      return this.translate.instant('TIME.DAYS_AGO', {
        value: diffInDays,
      });
    }
  }
}
