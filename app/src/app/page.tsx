'use client';
import loadable from 'next/dynamic';

// Home page — food discovery, no login required.
// Loaded client-side only to avoid Turbopack TDZ issues in production.
const PageClient = loadable(
  () => import('./PageClient'),
  { ssr: false }
);

export default function Page() {
  return <PageClient />;
}
