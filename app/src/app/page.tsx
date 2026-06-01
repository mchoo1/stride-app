import { redirect } from 'next/navigation';

// Send everyone straight to the home/discovery page — no login required.
export default function Page() {
  redirect('/dashboard');
}
