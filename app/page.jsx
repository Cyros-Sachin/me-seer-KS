'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {jwtDecode} from 'jwt-decode';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const decoded = jwtDecode(token);
        const isExpired = decoded.exp * 1000 < Date.now();

        if (isExpired) {
          localStorage.removeItem('token');
          router.push('/login');
        } else {
          router.push('/main');
        }
      } catch (err) {
        // Invalid token
        localStorage.removeItem('token');
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  return null;
}
