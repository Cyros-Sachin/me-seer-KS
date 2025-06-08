'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Pencil, Plus } from 'lucide-react';

const SidebarPanel = ({
  mounted,
  error,
  loading,
  spaces,
  subspaces,
  activeSpace,
  activeSubspace,
  setActiveSpace,
  setActiveSubspace,
  setShowSubspaceModal,
  setSubspaceAction,
  showTodoMenu,
  setShowTodoMenu,
  showWordpadMenu,
  setShowWordpadMenu,
  refreshTypes,
  handleCreateTodoWithType,
  handleCreateWordpad,
  dropdownVariants,
  dropdownRef
}) => {
  const router = useRouter();

  return (
    <div className="bg-white w-64 min-w-[220px] border-r border-gray-300 p-4 flex flex-col gap-4 overflow-auto">
      <h2 className="text-xl font-semibold mb-2 mt-2">
        <ChevronRight
          className="w-6 h-6 rotate-180 transform inline-flex mr-15 mb-1 cursor-pointer"
          onClick={() => router.push('/')}
        />
        SPACE
      </h2>
      {!mounted ? (
        <div className="text-center py-4">Loading user data...</div>
      ) : error ? (
        <div className="text-red-500 p-2 bg-red-50 rounded">{error}</div>
      ) : (
        <>
          {/* Spaces Section */}
          <div className='p-2'>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Spaces</h3>
            <hr />
            {loading.spaces ? (
              <div className="mt-2 text-sm text-gray-500">Loading...</div>
            ) : (
              <ul className="mt-2 space-y-2">
                {spaces.map((space) => (
                  <li
                    key={space.space_id}
                    className={`flex items-center justify-between hover:bg-gray-100 px-2 py-1 rounded cursor-pointer ${activeSpace?.space_id === space.space_id ? 'bg-gray-100' : ''}`}
                    onClick={() => setActiveSpace(space)}
                  >
                    <span className="truncate">{space.name}</span>
                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Subspaces Section */}
          <div className='p-2'>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500">Subspaces</h3>
              <button
                onClick={() => {
                  setShowSubspaceModal(true);
                  setSubspaceAction(null);
                }}
                className="text-gray-500 hover:text-black"
                title="Manage subspaces"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            <hr />
            {loading.subspaces ? (
              <div className="mt-2 text-sm text-gray-500">Loading...</div>
            ) : (
              <ul className="mt-2 space-y-2">
                {(() => {
                  const seen = new Set();
                  const filtered = subspaces.filter((s) => {
                    const key = s.name.toLowerCase() === 'default' ? 'default' : s.subspace_id;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                  });
                  return filtered.map((subspace) => (
                    <li
                      key={subspace.subspace_id}
                      className={`flex items-center justify-between hover:bg-gray-100 px-2 py-1 rounded cursor-pointer ${activeSubspace?.subspace_id === subspace.subspace_id ? 'bg-gray-100' : ''}`}
                      onClick={() => setActiveSubspace(subspace)}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="truncate">{subspace.name}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    </li>
                  ));
                })()}
              </ul>
            )}
          </div>

          {/* Add Section */}
          <div className='p-2'>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Add</h3>
            <hr />
            <div className="mt-2 space-y-2 relative">
              {/* Todo Button */}
              <button
                className="flex items-center justify-between w-full hover:bg-gray-100 px-2 py-1 rounded text-left"
                onClick={() => setShowTodoMenu((prev) => !prev)}
              >
                <span>Todo</span>
                <Plus className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {showTodoMenu && (
                  <motion.div
                    key="todo-menu"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={dropdownVariants}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 mt-1 w-full bg-white border rounded shadow z-10"
                  >
                    {refreshTypes.map((type) => (
                      <button
                        key={type}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 capitalize inline-flex justify-between"
                        onClick={() => handleCreateTodoWithType(type)}
                      >
                        {type}
                        <ChevronRight />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Wordpad Button */}
              <button
                className="flex items-center justify-between w-full hover:bg-gray-100 px-2 py-1 rounded text-left"
                onClick={() => setShowWordpadMenu((prev) => !prev)}
              >
                <span>Wordpad</span>
                <Plus className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {showWordpadMenu && (
                  <motion.div
                    key="wordpad-menu"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={dropdownVariants}
                    transition={{ duration: 0.2 }}
                    ref={dropdownRef}
                    className="absolute left-0 mt-1 w-full bg-white border rounded shadow z-10"
                  >
                    <div className="py-1">
                      {refreshTypes.map((type) => (
                        <button
                          key={type}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 capitalize inline-flex justify-between"
                          onClick={() => {
                            handleCreateWordpad(type);
                            setShowWordpadMenu(false);
                          }}
                        >
                          {type}
                          <ChevronRight />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SidebarPanel;
