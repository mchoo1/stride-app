import { redirect } from 'next/navigation';

// Root / redirects to the dashboard (the single home screen).
// The old landing PageClient has been removed — /dashboard is home.
export default function Page() {
  redirect('/dashboard');
}
