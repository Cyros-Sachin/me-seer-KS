'use client';
import { useState, useRef, useEffect } from "react";
import { AlignLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ActivitySidebar({ isMobile, router, ...props }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef()

  // Close sidebar on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    }
    if (sidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen]);

  return (
    <>
      {isMobile && (
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800"
        >
          <AlignLeft className="w-5 h-5" />
        </button>
      )}

      <AnimatePresence>
        {(sidebarOpen || !isMobile) && (
          <motion.div
            ref={sidebarRef}
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.3 }}
            className="fixed z-40 top-0 left-0 h-full w-64 min-w-[220px] bg-white border-r border-gray-100 p-4 flex flex-col gap-4 overflow-y-auto shadow-lg"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <ChevronRight
                className="w-5 h-5 rotate-180 transform inline-flex mr-2 cursor-pointer text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setSidebarOpen(false);
                  router.push("/");
                }}
              />
              ACTIVITY
            </h2>

            {/* Error */}
            {props.error && (
              <div className="text-sm text-red-600 p-2 bg-red-50 rounded-md border border-red-100">
                {props.error}
              </div>
            )}

            {/* Activity Types */}
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Activity Types
              </h3>
              <hr className="border-gray-100" />
              {props.loading.activityTypes ? (
                <div className="mt-2 text-sm text-gray-400">Loading...</div>
              ) : (
                <ul className="mt-2 space-y-1">
                  {props.activityTypes.map((type) => (
                    <li
                      key={`type-${type.at_id}`}
                      className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${
                        props.selectedActivityType === type.at_id
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => props.setSelectedActivityType(type.at_id)}
                    >
                      <span className="truncate">{type.name}</span>
                      <ChevronRight className="w-4 h-4 flex-shrink-0 text-gray-400" />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Pinned Activities */}
            {props.selectedActivityType && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pinned Activities
                </h3>
                <hr className="border-gray-100" />
                {props.loading.pinnedActivities ? (
                  <div className="mt-2 text-sm text-gray-400">Loading...</div>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {props.pinnedActivities.map((activity) => (
                      <li
                        key={`pinned-${activity.a_id}`}
                        className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${
                          props.selectedPinnedActivity === activity.a_id
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                        onClick={() => props.handlePinnedActivityClick(activity)}
                      >
                        <span className="truncate">{activity.name}</span>
                        <ChevronRight className="w-4 h-4 flex-shrink-0 text-gray-400" />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Activity Items */}
            {props.activeActivity && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity Items
                </h3>
                <hr className="border-gray-100" />
                {props.loading.activityItems ? (
                  <div className="mt-2 text-sm text-gray-400">Loading...</div>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {props.activityItems.map((item) => (
                      <li
                        key={`item-${item.a_id}`}
                        className="flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors text-gray-700 hover:bg-gray-50"
                        onClick={() => props.handleActivityItemClick(item)}
                      >
                        <span className="truncate">{item.name}</span>
                        <ChevronRight className="w-4 h-4 flex-shrink-0 text-gray-400" />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}