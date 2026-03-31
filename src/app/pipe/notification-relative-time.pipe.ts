import { Pipe, PipeTransform } from '@angular/core';

/**
 * Compact relative time for notification dropdown (e.g. "2h ago", "Few minutes ago").
 */
@Pipe({
  name: 'notificationRelativeTime',
  standalone: true,
})
export class NotificationRelativeTimePipe implements PipeTransform {
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
      return 'Just now';
    }

    const min = Math.floor(sec / 60);
    if (min < 60) {
      if (min < 5) {
        return 'Few minutes ago';
      }
      return min === 1 ? '1 min ago' : `${min} min ago`;
    }

    const hr = Math.floor(min / 60);
    if (hr < 24) {
      return hr === 1 ? '1h ago' : `${hr}h ago`;
    }

    const day = Math.floor(hr / 24);
    if (day < 7) {
      return day === 1 ? '1d ago' : `${day}d ago`;
    }

    if (day < 30) {
      const w = Math.floor(day / 7);
      return w === 1 ? '1w ago' : `${w}w ago`;
    }

    if (day < 365) {
      const mo = Math.floor(day / 30);
      return mo === 1 ? '1mo ago' : `${mo}mo ago`;
    }

    const y = Math.floor(day / 365);
    return y === 1 ? '1y ago' : `${y}y ago`;
  }
}
