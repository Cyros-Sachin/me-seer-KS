'use client';

import React, { useState } from "react";
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
} from "lucide-react";
import { userInfo } from "os";

const Sidebar = () => {
    const [expanded, setExpanded] = useState(true);
    const router = useRouter();
    const data = JSON.parse(localStorage.getItem('userInfo'));
    // Sidebar items with paths
    const items = [
        { icon: <House className="w-5 h-5" />, label: "Space", path: "/space" },
        { icon: <PersonStanding className="w-5 h-5" />, label: "Activity", path: "/activity" },
        { icon: <ChartLine className="w-5 h-5" />, label: "Dashboard", path: "/dashboard" },
        { icon: <CircleHelp className="w-5 h-5" />, label: "Help & Support", path: "/support" },
        { icon: <Goal className="w-5 h-5" />, label: "Goals", path: "/goals" },
    ];

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
                        <div className="bg-white w-10 h-10 p-2 text-lg rounded-full flex justify-center font-black"><User/></div>
                        <div className="ml-2 text-black">
                            {data?.name} <br /> {data?.email}
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-200 w-10 h-10 -ml-2 text-lg font-black rounded-full flex justify-center items-center text-black">?</div>
                )}
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="fixed top-4 p-1 rounded-full bg-white border border-gray-300 shadow-md hover:bg-gray-100 focus:outline-none transition-all duration-300 ease-in-out z-60"
                aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
                style={{
                    left: expanded ? 230 : 56,
                    top: 16,
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
            className="flex items-center justify-between hover:text-gray-500 cursor-pointer"
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
