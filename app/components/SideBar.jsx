'use client';
import Cookies from "js-cookie";
import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import {
    User,
    ChartLine,
    CircleHelp,
    Goal,
    House,
    PersonStanding,
    ChevronRight,
    ChevronLeft,
    LogOut,
    Settings,
    Menu,
    X,
} from "lucide-react";

const Sidebar = () => {
    const [expanded, setExpanded] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const router = useRouter();
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeItem, setActiveItem] = useState("");

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setExpanded(width >= 1024);
            setIsMobile(width < 768);
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        setActiveItem(window.location.pathname);
    }, []);

    let data = null;
    try {
        const userInfoRaw = Cookies.get("userInfo");
        if (userInfoRaw) {
            data = JSON.parse(userInfoRaw);
        }
    } catch (err) {
        console.error("Failed to parse userInfo cookie:", err);
    }

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
        { icon: <House className="w-5 h-5" />, label: "Space", path: "/space" },
        { icon: <PersonStanding className="w-5 h-5" />, label: "Activity", path: "/activity" },
        { icon: <ChartLine className="w-5 h-5" />, label: "Dashboard", path: "/dashboard" },
        { icon: <Goal className="w-5 h-5" />, label: "Goals", path: "/goals" },
        { icon: <CircleHelp className="w-5 h-5" />, label: "Help", path: "/support" },
    ];

    const handleNavigation = (path) => {
        router.push(path);
        setActiveItem(path);
        if (isMobile) setExpanded(false);
    };

    if (isMobile) {
        return (
            <>
                {/* Mobile Header */}
                <div className="fixed top-0 left-0 w-full bg-white border-b border-gray-100 flex justify-between items-center p-4 z-50 shadow-sm">
                    <div className="flex items-center">
                        <img src="/icons/logo.png" className="h-6 w-6" alt="Logo" />
                        <h2 className="ml-2 text-lg font-semibold text-gray-800">MeSeer</h2>
                    </div>
                    
                    <div className="relative dropdown-profile">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600"
                        >
                            <User className="w-4 h-4" />
                        </button>

                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-lg shadow-lg z-50 overflow-hidden">
                                <div className="p-3 bg-gray-50">
                                    <p className="text-gray-800 font-medium">{data?.name}</p>
                                    <p className="text-gray-500 text-sm truncate">{data?.email}</p>
                                </div>
                                <div className="p-1">
                                    <button
                                        onClick={() => handleNavigation("/settings")}
                                        className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-md text-gray-700 flex items-center"
                                    >
                                        <Settings className="w-4 h-4 mr-2" />
                                        Settings
                                    </button>
                                    <button
                                        onClick={() => {
                                            Cookies.remove("token");
                                            Cookies.remove("userInfo");
                                            router.push("/login");
                                        }}
                                        className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md flex items-center"
                                    >
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Bottom Nav */}
                <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 flex justify-around py-2 z-50 shadow-lg">
                    {items.slice(0, 4).map((item, index) => (
                        <button
                            key={index}
                            onClick={() => handleNavigation(item.path)}
                            className={`flex flex-col items-center p-2 rounded-lg ${activeItem === item.path ? 'text-blue-600' : 'text-gray-500'}`}
                        >
                            {item.icon}
                            <span className="text-xs mt-1">{item.label}</span>
                        </button>
                    ))}
                </div>
            </>
        );
    }

    return (
        <>
            <div
                className={`fixed top-0 left-0 h-full bg-white z-50 flex flex-col justify-between transition-all duration-300 ease-in-out ${expanded ? "w-64 shadow-lg" : "w-20"} border-r border-gray-100`}
            >
                <div>
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <div className="flex items-center">
                            <img
                                src="/icons/logo.png"
                                alt="Logo"
                                className="h-6 w-6"
                            />
                            {expanded && (
                                <h1 className="ml-2 text-lg font-semibold text-gray-800">MeSeer</h1>
                            )}
                        </div>
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
                        >
                            {expanded ? (
                                <ChevronLeft className="w-5 h-5" />
                            ) : (
                                <ChevronRight className="w-5 h-5" />
                            )}
                        </button>
                    </div>

                    <div className="p-4">
                        <ul className="space-y-1">
                            {items.map((item, index) => (
                                <li key={index}>
                                    <button
                                        onClick={() => handleNavigation(item.path)}
                                        className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeItem === item.path ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'} ${expanded ? 'justify-start' : 'justify-center'}`}
                                    >
                                        <span className={`${expanded ? 'mr-3' : ''} ${activeItem === item.path ? 'text-blue-500' : 'text-gray-500'}`}>
                                            {item.icon}
                                        </span>
                                        {expanded && item.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100">
                    <div className={`flex items-center ${expanded ? 'justify-between' : 'justify-center'}`}>
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className={`flex items-center ${expanded ? 'w-full' : ''}`}
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-blue-600">
                                <User className="w-4 h-4" />
                            </div>
                            {expanded && (
                                <div className="ml-3 text-left" onClick={() => router.push('/settings')}>
                                    <p className="text-sm font-medium text-gray-800 truncate">{data?.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{data?.email}</p>
                                </div>
                            )}
                        </button>
                    </div>

                    {showDropdown && expanded && (
                        <div className="absolute bottom-16 left-4 w-56 bg-white border border-gray-100 rounded-lg shadow-lg z-50 overflow-hidden">
                            <div className="p-1">
                                <button
                                    onClick={() => handleNavigation("/settings")}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-md text-gray-700 flex items-center"
                                >
                                    <Settings className="w-4 h-4 mr-2" />
                                    Settings
                                </button>
                                <button
                                    onClick={() => {
                                        Cookies.remove("token");
                                        Cookies.remove("userInfo");
                                        router.push("/login");
                                    }}
                                    className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md flex items-center"
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Sidebar;