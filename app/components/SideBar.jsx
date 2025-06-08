'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import {
    User,
    ChartLine,
    CircleHelp,
    Goal,
    House,
    PersonStanding,
    SquareChevronRight,
    SquareChevronLeft,
    LogOut,
    Settings,
} from "lucide-react";

const Sidebar = () => {
    const [expanded, setExpanded] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const router = useRouter();
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setExpanded(width >= 1024); // Expand if ≥1024px
            setIsMobile(width < 786);   // Mobile nav if <786px
        };

        handleResize(); // Initial check
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const data = JSON.parse(localStorage.getItem('userInfo'));
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest(".dropdown-profile")) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const items = [
        { icon: <House className="w-7 h-7" />, label: "Space", path: "/space" },
        { icon: <PersonStanding className="w-7 h-7" />, label: "Activity", path: "/activity" },
        { icon: <ChartLine className="w-7 h-7" />, label: "Dashboard", path: "/dashboard" },
        { icon: <CircleHelp className="w-7 h-7" />, label: "Help & Support", path: "/support" },
        { icon: <Goal className="w-7 h-7" />, label: "Goals", path: "/goals" },
    ];

    if (isMobile) {
        return (
            <>
                {/* Top logo */}
                <div className="fixed top-0 left-0 w-full bg-white border-b border-gray-200 flex justify-between p-4 py-2 z-50 space-x-3">
                    <img src="/icons/logo.png" className="h-6 w-6" alt="Logo" />
                    <h2 className="text-xl font-black text-gray-800">MeSeer</h2>
                    <div className="relative dropdown-profile">
                        <div
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="bg-gray-400 w-8 h-8 p-2 text-lg rounded-full flex justify-center items-center font-black cursor-pointer"
                        >
                            <User className="w-4 h-4" />
                        </div>

                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3 text-sm">
                                <p className="text-gray-800 font-semibold mb-1">{data?.name}</p>
                                <p className="text-gray-600 mb-2 truncate">{data?.email}</p>
                                <hr className="my-2" />
                                <button
                                    onClick={() => router.push("/settings")}
                                    className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded inline-flex text-gray-400"
                                >
                                    <Settings className="w-7 h-7 mr-2" />
                                    Open Settings
                                </button>
                                <button
                                    onClick={() => {
                                        localStorage.removeItem("token");
                                        localStorage.removeItem("userInfo");
                                        router.push("/login");
                                    }}
                                    className="w-full text-left px-2 py-1 text-red-600 hover:bg-red-50 rounded inline-flex"
                                >
                                    <LogOut className="w-7 h-7 mr-2" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Nav */}
                <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around py-2 z-50 h-15">
                    {items.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => router.push(item.path)}
                            className="flex flex-col items-center text-xs text-black"
                        >
                            {item.icon}
                        </button>
                    ))}
                </div>
            </>
        );
    }

    return (
        <>
            <div
                className={`fixed top-0 left-0 h-full bg-white z-50 p-6 border-r border-[#1a1a1a] flex flex-col justify-between transition-all duration-300 ease-in-out ${expanded ? "w-[250px]" : "w-16"}`}
            >
                <div>
                    <div className="text-2xl font-bold mb-6 flex items-center text-black">
                        <img
                            src="/icons/logo.png"
                            alt="Logo"
                            className={`mr-2 transition-opacity duration-300 ${expanded ? "h-6 w-6" : "h-4 w-4"}`}
                        />
                        {expanded && "MeSeer"}
                    </div>
                    <hr className="border-[#2a2a2a]" />

                    <ul className="mt-8 space-y-6 text-sm text-black">
                        {items.map((item, index) => (
                            <SidebarItem
                                key={index}
                                icon={item.icon}
                                label={item.label}
                                expanded={expanded}
                                onClick={() => router.push(item.path)}
                            />
                        ))}
                    </ul>
                </div>

                <hr />

                {expanded ? (
                    <div className="text-xs text-gray-500 bg-gray-300 rounded-full p-3 inline-flex items-center transition-all duration-300 w-55">
                        <div className="bg-white w-10 h-10 p-2 text-lg rounded-full flex justify-center font-black"><User /></div>
                        <div className="ml-2 text-black">
                            {data?.name} <br /> {data?.email}
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-200 w-10 h-10 -ml-2 text-lg font-black rounded-full flex justify-center items-center text-black">?</div>
                )}
            </div>

            {/* Toggle Button for larger screens */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="fixed top-4 p-1 rounded-full bg-white border border-gray-300 shadow-md hover:bg-gray-100 focus:outline-none transition-all duration-300 ease-in-out z-60"
                aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
                style={{
                    left: expanded ? 230 : 56,
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {expanded ? (
                    <SquareChevronLeft className="w-6 h-6 text-black" />
                ) : (
                    <SquareChevronRight className="w-6 h-6 text-black" />
                )}
            </button>
        </>
    );
};

const SidebarItem = ({ icon, label, expanded, onClick }) => {
    return (
        <li
            className="flex items-center justify-between hover:text-gray-500 cursor-pointer text-lg"
            title={!expanded ? label : undefined}
            onClick={onClick}
        >
            <div className="flex items-center gap-2">
                {icon}
                {expanded && <span>{label}</span>}
            </div>
            {expanded && <SquareChevronRight className="w-4 h-4 text-black" />}
        </li>
    );
};

export default Sidebar;
