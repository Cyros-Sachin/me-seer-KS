'use client';
import Sidebar from "../components/SideBar";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

export default function MainPage() {
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      router.push("/login");
    } else {
      try {
        const decoded = jwtDecode(token);
        const isExpired = decoded.exp * 1000 < Date.now();
        if (isExpired) {
          Cookies.remove("token");
          Cookies.remove("userInfo");
          router.push("/login");
        }
      } catch (err) {
        Cookies.remove("token");
        Cookies.remove("userInfo");
        router.push("/login");
      }
    }
  }, [router]);

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-white">
      <Sidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md p-4">
          <img src="/icons/image.png" alt="" />
        </div>
      </div>
    </div>
  );
}
