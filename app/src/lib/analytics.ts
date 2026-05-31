/**
 * Stride Analytics — structured event tracking
 *
 * Usage pattern: all events are typed and logged to the console in dev.
 * Drop in Mixpanel or Amplitude by replacing the `send()` implementation.
 *
 * To enable Mixpanel:
 *   npm install mixpanel-browser
 *   import mixpanel from 'mixpanel-browser';
 *   mixpanel.init('YOUR_TOKEN');
 *   // then replace send() below with mixpanel.track(event, props)
 */

type Properties = Record<string, string | number | boolean | null | undefined>;

// ── Event catalogue ──────────────────────────────────────────────────────────

export const Events = {
  // Onboarding
  ONBOARDING_STARTED:    'onboarding_started',
  ONBOARDING_COMPLETED:  'onboarding_completed',
  ONBOARDING_SKIPPED:    'onboarding_skipped',

  // Auth
  USER_REGISTERED:       'user_registered',
  USER_LOGGED_IN:        'user_logged_in',
  USER_LOGGED_OUT:       'user_logged_out',

  // Dashboard
  DASHBOARD_VIEWED:      'dashboard_viewed',

  // Food logging
  MEAL_LOGGED:           'meal_logged',
  MEAL_LOG_FAILED:       'meal_log_failed',
  SCAN_OPENED:           'scan_opened',
  SCAN_COMPLETED:        'scan_completed',
  SCAN_FAILED:           'scan_failed',

  // Eat page
  EAT_PAGE_VIEWED:       'eat_page_viewed',
  EAT_SEARCHED:          'eat_searched',
  EAT_FILTER_APPLIED:    'eat_filter_applied',
  EAT_SORT_CHANGED:      'eat_sort_changed',
  EAT_ITEM_EXPANDED:     'eat_item_expanded',
  EAT_ORDER_LINK_TAPPED: 'eat_order_link_tapped',
  EAT_MAP_LINK_TAPPED:   'eat_map_link_tapped',

  // Water / activity
  WATER_LOGGED:          'water_logged',
  ACTIVITY_LOGGED:       'activity_logged',

  // Profile
  PROFILE_UPDATED:       'profile_updated',
  WEIGHT_LOGGED:         'weight_logged',
} as const;

export type EventName = (typeof Events)[keyof typeof Events];

// ── Core implementation ──────────────────────────────────────────────────────

let _userId: string | null = null;

/** Call after sign-in with Firebase UID. Persists for the session. */
export function identify(uid: string, traits?: Properties): void {
  _userId = uid;
  if (process.env.NODE_ENV === 'development') {
    console.info(`[Analytics] identify`, { uid, ...traits });
  }
  // TODO: mixpanel.identify(uid); mixpanel.people.set(traits);
}

/** Track a single event with optional properties. */
export function track(event: EventName, properties?: Properties): void {
  const payload = {
    event,
    userId: _userId,
    timestamp: new Date().toISOString(),
    ...properties,
  };

  if (process.env.NODE_ENV === 'development') {
    console.info(`[Analytics] ${event}`, payload);
  }
  // TODO: mixpanel.track(event, payload);
}

/** Track a page view. Call in useEffect on each page. */
export function page(pageName: string, properties?: Properties): void {
  track('dashboard_viewed' as EventName, { page: pageName, ...properties });
  if (process.env.NODE_ENV === 'development') {
    console.info(`[Analytics] page: ${pageName}`, properties);
  }
}

/** Reset identity on sign-out. */
export function reset(): void {
  _userId = null;
  if (process.env.NODE_ENV === 'development') {
    console.info('[Analytics] reset');
  }
  // TODO: mixpanel.reset();
}
