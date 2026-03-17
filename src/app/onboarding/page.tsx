'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Onboarding is now part of the registration flow at /register
export default function OnboardingPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/register'); }, [router]);
  return null;
}
