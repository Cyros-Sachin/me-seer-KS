'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Pencil, Plus, ArrowLeft, Folder, FolderPlus, FileText, CheckSquare } from 'lucide-react';

const SpaceSidebar = ({
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
    <div className="bg-white w-72 min-w-[240px] border-r border-gray-200 p-5 flex flex-col gap-6 overflow-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <h2 className="text-xl font-semibold">SPACE</h2>
        </button>
      </div>

      {!mounted ? (
        <div className="flex justify-center items-center h-20">
          <div className="text-gray-500 animate-pulse">Loading user data...</div>
        </div>
      ) : error ? (
        <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-red-600 text-sm">
          {error}
        </div>
      ) : (
        <>
          {/* Spaces Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center">
                <Folder className="w-4 h-4 mr-2" />
                Spaces
              </h3>
            </div>
            <div className="border-t border-gray-100 pt-2">
              {loading.spaces ? (
                <div className="flex justify-center py-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-300"></div>
                </div>
              ) : (
                <ul className="space-y-1">
                  {spaces.map((space) => (
                    <li key={space.space_id}>
                      <button
                        onClick={() => setActiveSpace(space)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${activeSpace?.space_id === space.space_id ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        <span className="truncate">{space.name}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Subspaces Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center">
                <FolderPlus className="w-4 h-4 mr-2" />
                Subspaces
              </h3>
              <button
                onClick={() => {
                  setShowSubspaceModal(true);
                  setSubspaceAction(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                title="Manage subspaces"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            <div className="border-t border-gray-100 pt-2">
              {loading.subspaces ? (
                <div className="flex justify-center py-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-300"></div>
                </div>
              ) : (
                <ul className="space-y-1">
                  {(() => {
                    const seen = new Set();
                    const filtered = subspaces.filter((s) => {
                      const key = s.name.toLowerCase() === 'default' ? 'default' : s.subspace_id;
                      if (seen.has(key)) return false;
                      seen.add(key);
                      return true;
                    });
                    return filtered.map((subspace) => (
                      <li key={subspace.subspace_id}>
                        <button
                          onClick={() => setActiveSubspace(subspace)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${activeSubspace?.subspace_id === subspace.subspace_id ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="truncate">{subspace.name}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </button>
                      </li>
                    ));
                  })()}
                </ul>
              )}
            </div>
          </div>

          {/* Add Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Create New
            </h3>
            <div className="border-t border-gray-100 pt-2 relative">
              {/* Todo Button */}
              <div className="mb-2">
                <button
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${showTodoMenu ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => setShowTodoMenu((prev) => !prev)}
                >
                  <div className="flex items-center">
                    <CheckSquare className="w-4 h-4 mr-2" />
                    <span>Todo</span>
                  </div>
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
                      className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden"
                    >
                      {refreshTypes.map((type) => (
                        <button
                          key={type}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 capitalize flex items-center justify-between text-gray-700"
                          onClick={() => handleCreateTodoWithType(type)}
                        >
                          <span>{type}</span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Wordpad Button */}
              <div>
                <button
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${showWordpadMenu ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => setShowWordpadMenu((prev) => !prev)}
                >
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    <span>Wordpad</span>
                  </div>
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
                      className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden"
                    >
                      <div className="py-1">
                        {refreshTypes.map((type) => (
                          <button
                            key={type}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 capitalize flex items-center justify-between text-gray-700"
                            onClick={() => {
                              handleCreateWordpad(type);
                              setShowWordpadMenu(false);
                            }}
                          >
                            <span>{type}</span>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SpaceSidebar;