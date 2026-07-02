'use client';
import loadable from 'next/dynamic';

const ModerationClient = loadable(() => import('./ModerationClient'), { ssr: false });

export default function Page() {
  return <ModerationClient />;
}
