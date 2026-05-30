'use client';
import loadable from 'next/dynamic';

const DashboardPage = loadable(
  () => import('./DashboardClient'),
  { ssr: false }
);

export default function Page() {
  return <DashboardPage />;
}
