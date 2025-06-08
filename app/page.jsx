'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

export default function HomePage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  useEffect(() => {
    if (!isClient) return;
    const token = Cookies.get("token");

    if (token) {
      try {
        const decoded = jwtDecode(token);
        const isExpired = decoded.exp * 1000 < Date.now();

        if (isExpired) {
          Cookies.remove("token");
          Cookies.remove("userInfo");
          router.push("/login");
        } else {
          router.push("/main");
        }
      } catch (err) {
        Cookies.remove("token");
        Cookies.remove("userInfo");
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
  }, [isClient, router]);

  return null;
}
