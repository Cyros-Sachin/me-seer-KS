'use client';
import Sidebar from "../components/SideBar";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MainPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // confirm client-side
  }, []);

  useEffect(() => {
    if (isClient) {
      const token = localStorage.getItem("token");
      if (!token) router.push("/login");
    }
  }, [isClient]);

  if (!isClient) return null; // avoid rendering before client check

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-white">
      <Sidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <img src="/icons/image.png" alt="" />
        </div>
      </div>
    </div>
  );
}
