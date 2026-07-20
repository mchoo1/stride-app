import dynamic from 'next/dynamic';

const PageClient = dynamic(() => import('./PageClient'), { ssr: false });
export default function Page() { return <PageClient />; }

