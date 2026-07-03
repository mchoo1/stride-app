/**
 * Daypart / time-based menu availability (Singapore time).
 *
 * McDonald's serves breakfast ~04:00 until 11:00 on weekdays (12:00 on weekends
 * & public holidays), then the regular menu. Items tagged `all_day` always show.
 *
 * Always anchored to Asia/Singapore — never the device clock (users may travel).
 * Filtering applies to the BROWSE menu only; search and logging must stay
 * unrestricted so a user can still log a breakfast item eaten earlier.
 *
 * See planning/DAYPART_DISPLAY_SPEC.md.
 */
import type { Daypart, SGMenuItem, SGRestaurant } from './sgFoodDb';

type DaypartCfg = {
  breakfastStart?: string;       // 'HH:mm' SGT, default '04:00'
  breakfastEnd?: string;         // weekday cutoff, default '11:00'
  breakfastEndWeekend?: string;  // weekend/PH cutoff, default '12:00'
};

const toMin = (s: string) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};

/** Current serving daypart in Singapore time. Weekends/PH use the later cutoff. */
export function currentDaypart(
  now: Date = new Date(),
  cfg?: DaypartCfg,
  isPublicHoliday = false,
): 'breakfast' | 'regular' {
  // weekday in SGT (0 = Sun … 6 = Sat)
  const sgtNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Singapore' }));
  const dow = sgtNow.getDay();
  const isWeekend = dow === 0 || dow === 6 || isPublicHoliday;

  const start = toMin(cfg?.breakfastStart ?? '04:00');
  const end = toMin(isWeekend ? (cfg?.breakfastEndWeekend ?? '12:00') : (cfg?.breakfastEnd ?? '11:00'));

  // minutes-of-day in SGT, independent of device timezone
  const [h, m] = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Singapore', hour12: false, hour: '2-digit', minute: '2-digit',
  }).format(now).split(':').map(Number);
  const mins = h * 60 + m;

  return mins >= start && mins < end ? 'breakfast' : 'regular';
}

/** Whether an item should appear in the browse menu right now. `all_day` always shows. */
export function isAvailableNow(
  item: Pick<SGMenuItem, 'availability'>,
  now: Date = new Date(),
  cfg?: DaypartCfg,
  isPublicHoliday = false,
): boolean {
  const dp: Daypart = item.availability ?? 'all_day';
  if (dp === 'all_day') return true;
  return dp === currentDaypart(now, cfg, isPublicHoliday);
}

/** Filter a restaurant's menu to what's served now. Browse view ONLY — never gate search/logging. */
export function availableMenu(
  restaurant: Pick<SGRestaurant, 'menu' | 'dayparts'>,
  now: Date = new Date(),
  isPublicHoliday = false,
): SGMenuItem[] {
  return restaurant.menu.filter((i) => isAvailableNow(i, now, restaurant.dayparts, isPublicHoliday));
}

/** Header-chip label for the current daypart. */
export function daypartLabel(
  now: Date = new Date(),
  cfg?: DaypartCfg,
  isPublicHoliday = false,
): string {
  return currentDaypart(now, cfg, isPublicHoliday) === 'breakfast' ? 'Breakfast menu' : 'Regular menu';
}
