'use client';
import loadable from 'next/dynamic';

const PageClient = loadable(
  () => import('./PageClient'),
  { ssr: false }
);

export default function Page() {
  return <PageClient />;
}
