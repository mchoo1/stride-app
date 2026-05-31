'use client';
/**
 * /eat — server-safe route entry point.
 *
 * The full eat page closes over many module-level `const` values inside
 * `function` declarations. Turbopack's SSR bundle hoists those functions
 * before the consts are initialised, causing a TDZ crash during static
 * prerendering. Wrapping with ssr:false means the implementation file
 * is never executed on the server — only in the browser.
 */
import loadable from 'next/dynamic';

const EatPage = loadable(
  () => import('./EatPageClient'),
  { ssr: false }
);

export default function Page() {
  return <EatPage />;
}
