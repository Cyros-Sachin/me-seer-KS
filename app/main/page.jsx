'use client';
import Sidebar from "../components/SideBar";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MainPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/login");
  }, []);

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-white">
      {/* Sidebar (placeholder) */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md p-4">
          <img src="/icons/image.png" alt="" />
        </div>
      </div>
    </div>
  );
}
