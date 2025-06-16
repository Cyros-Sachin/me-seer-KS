import { useState, useRef, useEffect } from "react";
import { AlignLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";

export default function ActivitySidebar({ isMobile, ...props }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef();

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
        <button onClick={() => setSidebarOpen(true)}>
          <AlignLeft className="m-4" />
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
            className="fixed z-40 top-0 left-0 h-full w-64 min-w-[220px] bg-white border-r border-gray-300 p-4 flex flex-col gap-4 overflow-y-auto shadow-lg"
          >
            <h2 className="text-xl font-semibold mb-2 mt-2">
              <ChevronRight
                className="w-6 h-6 rotate-180 transform inline-flex mr-2 mb-1 cursor-pointer"
                onClick={() => {
                  setSidebarOpen(false);
                  router.push("/");
                }}
              />
              ACTIVITY
            </h2>

            {/* Error */}
            {props.error && (
              <div className="text-red-500 p-2 bg-red-50 rounded">{props.error}</div>
            )}

            {/* Activity Types */}
            <div className="p-2">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Activity Types</h3>
              <hr />
              {props.loading.activityTypes ? (
                <div className="mt-2 text-sm text-gray-500">Loading...</div>
              ) : (
                <ul className="mt-2 space-y-2">
                  {props.activityTypes.map((type) => (
                    <li
                      key={`type-${type.at_id}`}
                      className={`flex items-center justify-between hover:bg-gray-100 px-2 py-1 rounded cursor-pointer ${props.selectedActivityType === type.at_id ? "bg-gray-100" : ""}`}
                      onClick={() => props.setSelectedActivityType(type.at_id)}
                    >
                      <span className="truncate">{type.name}</span>
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Pinned Activities */}
            {props.selectedActivityType && (
              <div className="p-2">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Pinned Activities</h3>
                <hr />
                {props.loading.pinnedActivities ? (
                  <div className="mt-2 text-sm text-gray-500">Loading...</div>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {props.pinnedActivities.map((activity) => (
                      <li
                        key={`pinned-${activity.a_id}`}
                        className={`flex items-center justify-between hover:bg-gray-100 px-2 py-1 rounded cursor-pointer ${props.selectedPinnedActivity === activity.a_id ? "bg-gray-100" : ""}`}
                        onClick={() => props.handlePinnedActivityClick(activity)}
                      >
                        <span className="truncate">{activity.name}</span>
                        <ChevronRight className="w-4 h-4 flex-shrink-0" />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Activity Items */}
            {props.activeActivity && (
              <div className="p-2">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Activity Items</h3>
                <hr />
                {props.loading.activityItems ? (
                  <div className="mt-2 text-sm text-gray-500">Loading...</div>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {props.activityItems.map((item) => (
                      <li
                        key={`item-${item.a_id}`}
                        className="flex items-center justify-between hover:bg-gray-100 px-2 py-1 rounded cursor-pointer"
                        onClick={() => props.handleActivityItemClick(item)}
                      >
                        <span className="truncate">{item.name}</span>
                        <ChevronRight className="w-4 h-4 flex-shrink-0" />
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
