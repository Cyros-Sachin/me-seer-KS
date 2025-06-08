'use client';
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from 'react';
import { Mic, ChevronRight, ChevronDown, Plus, Edit, Hash, Eye, Repeat, Trash2, Settings, Pencil, CirclePlus, SquareChevronRight, SquareChevronLeft, Maximize2, Trash, Trash2Icon, Sidebar, AlignLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from "react";
import SidebarPanel from "../components/SpaceSidebar"
import { WordpadEditor } from "../components/WordpadEditor"
// API Base URL
import SideBar from "../components/SideBar";
const API_BASE_URL = 'https://meseer.com/dog';
type SubspaceAction = 'create' | 'edit' | 'delete' | null;
type UserInfo = {
  access_token: string;
  email: string;
  message: string;
  name: string;
  payment_details: string;
  payment_type: string;
  phone: string;
  user_id: string;
};
type Todo = {
  todo_id: string;
  name: string;
  content?: string;
  checked?: boolean;
  refresh_type?: string;
};
type Wordpad = {
  wordpad_id: string;
  name: string;
  refresh_type?: string;
  contents?: WordpadContent[];
};

type WordpadContent = {
  wc_id: string;
  content: string;
  version: string;
  created_date: string;
  last_updated: string;
};
type Subspace = {
  subspace_id: string;
  name: string;
};

type Space = {
  space_id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
};

const SpaceService = {
  getHeaders: () => {
    if (typeof window === 'undefined') {
      throw new Error('Running on server, cannot access cookie');
    }

    const userInfo = Cookies.get('userInfo');
    if (!userInfo) throw new Error('User not authenticated');

    const access_token = Cookies.get('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`
    };
  },

  getSpaces: async (): Promise<Space[]> => {
    const response = await fetch(`${API_BASE_URL}/spaces`, {
      headers: SpaceService.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // The API returns the spaces array directly in the response
    // (based on the sample you provided earlier)
    if (Array.isArray(data)) {
      return data;
    }

    // If the spaces are nested under a 'spaces' property
    if (data.spaces && Array.isArray(data.spaces)) {
      return data.spaces;
    }

    throw new Error('Invalid API response format');
  },

  getSubspacesBySpaceId: async (spaceId: string, userId: string): Promise<Subspace[]> => {
    const response = await fetch(`${API_BASE_URL}/subspaces/${spaceId}/${userId}`, {
      headers: SpaceService.getHeaders()
    });
    const data = await response.json();
    return data;
  },

  createSubspace: async (payload: { space_id: string; user_id: string; name: string }) => {
    const response = await fetch(`${API_BASE_URL}/subspaces`, {
      method: 'POST',
      headers: SpaceService.getHeaders(),
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  getTodoDataBySubspace: async (subspaceId: string, userId: string): Promise<Todo[]> => {
    const response = await fetch(`${API_BASE_URL}/get-todo-wordpad/lastest-version/${userId}/${subspaceId}`, {
      headers: SpaceService.getHeaders()
    });
    const data = await response.json();
    // Defensive check
    if (!data.todo_data || !Array.isArray(data.todo_data)) {
      return [];
    }

    // Flatten the nested todo_data structure into a flat array of todo items
    const todos: Todo[] = [];
    data.todo_data.forEach((todoObj: Record<string, Todo[]>) => {
      Object.values(todoObj).forEach(todoArray => {
        todos.push(...todoArray);
      });
    });
    return todos;
  },
  getWordpadsBySubspace: async (subspaceId: string, userId: string): Promise<Wordpad[]> => {
    const response = await fetch(`${API_BASE_URL}/wordpads/${userId}`, {
      headers: SpaceService.getHeaders()
    });
    const data = await response.json();
    return Array.isArray(data)
      ? data.filter(wp => wp.subspace_id === subspaceId)
      : [];
  },

  getWordpadContent: async (wordpadId: string, userId: string): Promise<WordpadContent[]> => {
    const response = await fetch(`${API_BASE_URL}/get-versions/wordpads/${wordpadId}/${userId}/5`, {
      headers: SpaceService.getHeaders(),
    });
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  createWordpad: async (payload: {
    space_id: string;
    subspace_id: string;
    user_id: string;
    name: string;
    refresh_type: string;
    last_state: boolean;
  }) => {
    const response = await fetch(`${API_BASE_URL}/wordpads`, {
      method: 'POST',
      headers: SpaceService.getHeaders(),
      body: JSON.stringify({
        ...payload,
        created_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      }),
    });
    return response.json();
  },

  createWordpadContent: async (payload: {
    wordpad_id: string;
    user_id: string;
    content: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/wordpad-content`, {
      method: 'POST',
      headers: SpaceService.getHeaders(),
      body: JSON.stringify({
        ...payload,
        version: "v1",
        created_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      }),
    });
    return response.json();
  },

  updateWordpadContent: async (wcId: string, content: string) => {
    const response = await fetch(`${API_BASE_URL}/wordpad-content/${wcId}`, {
      method: 'PUT',
      headers: SpaceService.getHeaders(),
      body: JSON.stringify({
        content,
        last_updated: new Date().toISOString(),
      }),
    });
    return response.json();
  },

  deleteWordpad: async (wordpadId: string, userId: string) => {
    const response = await fetch(`${API_BASE_URL}/wordpads/${wordpadId}/${userId}`, {
      method: 'DELETE',
      headers: SpaceService.getHeaders(),
    });
    return response.json();
  },

  createTodo: async (data: {
    space_id: string;
    subspace_id: string;
    user_id: string;
    name: string;
    refresh_type: string;
    last_state: boolean;
  }) => {
    const created_date = new Date().toISOString();
    const last_updated = created_date;

    // Add created_date and last_updated to payload
    const payload = {
      ...data,
      created_date,
      last_updated,
    };

    const response = await fetch(`${API_BASE_URL}/todos`, {
      method: 'POST',
      headers: SpaceService.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Error Response:", text);
      throw new Error(`Request failed with status ${response.status}`);
    }

    return response.json();
  },

  deleteTodo: async (todoId: string, userId: string) => {
    const response = await fetch(`${API_BASE_URL}/todos/${todoId}/${userId}`, {
      method: 'DELETE',
      headers: SpaceService.getHeaders(),
      body: JSON.stringify(todoId)
    });
    return response.json();
  },
};

export default function SpacePage() {
  const editorRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [activeSpace, setActiveSpace] = useState<Space | null>(null);
  const [activeSubspace, setActiveSubspace] = useState<Subspace | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [subspaces, setSubspaces] = useState<Subspace[]>([]);
  const [wordpads, setWordpads] = useState<Wordpad[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState({
    spaces: false,
    subspaces: false,
    todos: false,
    wordpads: false
  });
  const refreshTypes: ('daily' | 'weekly' | 'monthly')[] = ['daily', 'weekly', 'monthly'];
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showSubspaceModal, setShowSubspaceModal] = useState(false);
  const [subspaceAction, setSubspaceAction] = useState<SubspaceAction>(null);
  const [currentSubspace, setCurrentSubspace] = useState<Subspace | null>(null);
  const [newSubspaceName, setNewSubspaceName] = useState('');
  const [maximizedTodo, setMaximizedTodo] = useState<Todo | null>(null);
  const [maximizedWordpad, setMaximizedWordpad] = useState<Wordpad | null>(null);
  const [collapsedTodos, setCollapsedTodos] = useState<string[]>([]);
  const [collapsedWordpads, setCollapsedWordpads] = useState<string[]>([]);
  const [newTaskContentMap, setNewTaskContentMap] = useState<{ [key: string]: string }>({});
  const [wordpadContentMap, setWordpadContentMap] = useState<{ [key: string]: string }>({});
  const [todoViewMap, setTodoViewMap] = React.useState<{ [todoId: string]: 'unchecked' | 'checked' | 'history' }>({});
  const [wordpadViewMap, setWordpadViewMap] = React.useState<{ [wordpadId: string]: 'current' | 'history' }>({});
  const [editingTodoId, setEditingTodoId] = React.useState<string | null>(null);
  const [editingWordpadId, setEditingWordpadId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [showTodoMenu, setShowTodoMenu] = useState(false);
  const [showWordpadMenu, setShowWordpadMenu] = useState(false);
  const [editingContentWordpadId, setEditingContentWordpadId] = useState<string | null>(null);
  const dropdownRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const dropdownVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setShowSidebar(false);
      }
    };

    if (showSidebar) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSidebar]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 786);   // Mobile nav if <786px
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getUserId = (): string => {
    const userInfo = Cookies.get('userInfo');
    if (!userInfo) throw new Error('User not authenticated');
    return (JSON.parse(userInfo) as UserInfo).user_id;
  };

  // Fetch spaces on component mount
  useEffect(() => {
    if (!mounted) return;

    const fetchSpaces = async () => {
      try {
        setLoading(prev => ({ ...prev, spaces: true }));
        setError(null);
        const data = await SpaceService.getSpaces();
        setSpaces(data);
      } catch (err) {
        console.error('Error fetching spaces:', err);
        setError(`Failed to load spaces: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(prev => ({ ...prev, spaces: false }));
      }
    };

    fetchSpaces();
  }, [mounted]);

  // Fetch subspaces when activeSpace changes
  useEffect(() => {
    if (!activeSpace) return;

    const fetchSubspaces = async () => {
      try {
        setLoading(prev => ({ ...prev, subspaces: true }));
        const userId = getUserId();
        let data = await SpaceService.getSubspacesBySpaceId(activeSpace.space_id, userId);

        if (data.length === 0) {
          await SpaceService.createSubspace({
            space_id: activeSpace.space_id,
            user_id: userId,
            name: 'default'
          });
          data = await SpaceService.getSubspacesBySpaceId(activeSpace.space_id, userId);
        }
        setSubspaces(data);
        setActiveSubspace(data[0]);
      } catch (err) {
        setError('Failed to load subspaces');
        console.error('Error fetching subspaces:', err);
      } finally {
        setLoading(prev => ({ ...prev, subspaces: false }));
      }
    };

    fetchSubspaces();
  }, [activeSpace]);

  // Fetch todos when activeSubspace changes
  useEffect(() => {
    if (!activeSubspace) return;

    const fetchData = async () => {
      try {
        setLoading(prev => ({ ...prev, todos: true, wordpads: true }));
        const userId = getUserId();

        // Fetch todos
        const todosData = await SpaceService.getTodoDataBySubspace(activeSubspace.subspace_id, userId);
        setTodos(todosData);

        // Fetch wordpads
        const wordpadsData = await SpaceService.getWordpadsBySubspace(activeSubspace.subspace_id, userId);
        // Fetch content for each wordpad
        const wordpadsWithContent = await Promise.all(wordpadsData.map(async (wordpad: Wordpad) => {
          const content = await SpaceService.getWordpadContent(wordpad.wordpad_id, userId);
          return { ...wordpad, contents: content };
        }));
        setWordpads(wordpadsWithContent);
      } catch (err) {
        setError('Failed to load data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(prev => ({ ...prev, todos: false, wordpads: false }));
      }
    };

    fetchData();
  }, [activeSubspace]);

  const wordpadContentMapRef = useRef(wordpadContentMap);
  useEffect(() => {
    wordpadContentMapRef.current = wordpadContentMap;
  }, [wordpadContentMap]);

  useEffect(() => {
    if (!wordpads.length) return;
    const allReady = wordpads.every(w => editorRefs.current[w.wordpad_id]);
    if (!allReady) return;

    const handleClickOutside = (event: MouseEvent) => {
      wordpads.forEach(wordpad => {
        const ref = editorRefs.current[wordpad.wordpad_id];
        if (ref && !ref.contains(event.target as Node)) {
          const content = wordpadContentMapRef.current[wordpad.wordpad_id];
          if (content !== undefined) {
            handleSaveWordpadContent(wordpad.wordpad_id, content);
            setWordpadContentMap(prev => {
              const updated = { ...prev };
              delete updated[wordpad.wordpad_id];
              return updated;
            });
          }
          if (editingContentWordpadId === wordpad.wordpad_id) {
            setEditingWordpadId(null);
          }
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wordpads, editingContentWordpadId]);

  const handleCreateTodoWithType = async (refreshType: 'daily' | 'weekly' | 'monthly') => {
    if (!activeSpace || !activeSubspace) return;

    const userId = getUserId();

    const todoData = {
      space_id: activeSpace.space_id,
      subspace_id: activeSubspace.subspace_id,
      user_id: userId,
      name: 'TODO',
      refresh_type: refreshType,
      last_state: false,
    };


    try {
      await SpaceService.createTodo(todoData);
      const data = await SpaceService.getTodoDataBySubspace(activeSubspace.subspace_id, userId);
      setTodos(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error("Error creating todo:", message);
      setError('Failed to create todo');
    }
  };

  const handleToggleCheck = async (todoId: string, tcId: number) => {
    setTodos(prevTodos =>
      prevTodos.map(todo => {
        if (todo.todo_id !== todoId) return todo;

        const updatedContents = (todo as any).contents.map((item: any) => {
          if (item.tc_id === tcId) {
            const updatedItem = {
              ...item,
              checked: !item.checked
            };

            // Send full data to backend
            updateCheckStatus(updatedItem);

            return updatedItem;
          }
          return item;
        });

        return { ...todo, contents: updatedContents };
      })
    );
    setMaximizedTodo(prev => {
      if (!prev || prev.todo_id !== todoId) return prev;

      const updatedContents = (prev as any).contents.map((item: any) => {
        if (item.tc_id === tcId) {
          return { ...item, checked: !item.checked };
        }
        return item;
      });

      return { ...prev, contents: updatedContents };
    });
  };

  const updateCheckStatus = async (item: any) => {
    try {
      await fetch(`https://meseer.com/dog/todo_content/${item.tc_id}`, {
        method: 'PUT',
        headers: SpaceService.getHeaders(),
        body: JSON.stringify({
          content: item.content,
          checked: item.checked,
          urgent: item.urgent ?? false,
          important: item.important ?? false
        })
      });
    } catch (err) {
      console.error('Failed to update todo:', err);
    }
  };
  const handleDeleteTodo = async (todoId: string) => {
    if (!confirm('Are you sure you want to delete this todo?')) return;

    try {
      const userId = getUserId();
      await SpaceService.deleteTodo(todoId, userId);

      if (activeSubspace) {
        const data = await SpaceService.getTodoDataBySubspace(activeSubspace.subspace_id, userId);
        setTodos(data);
      }
    } catch (err) {
      setError('Failed to delete todo');
      console.error('Error deleting todo:', err);
    }
  };
  const handleSubspaceAction = (action: SubspaceAction, subspace?: Subspace) => {
    setSubspaceAction(action);
    setCurrentSubspace(subspace || null);
    setNewSubspaceName(subspace?.name || '');
  };

  const handleSaveSubspace = async () => {
    if (!activeSpace || !newSubspaceName.trim()) return;

    try {
      const userId = getUserId();

      if (subspaceAction === 'create') {
        await SpaceService.createSubspace({
          space_id: activeSpace.space_id,
          user_id: userId,
          name: newSubspaceName
        });
      } else if (subspaceAction === 'edit' && currentSubspace) {
        // Implement update functionality
        const response = await fetch(`${API_BASE_URL}/subspaces/${currentSubspace.subspace_id}`, {
          method: 'PUT',
          headers: SpaceService.getHeaders(),
          body: JSON.stringify({
            space_id: activeSpace.space_id,
            user_id: userId,
            name: newSubspaceName
          }),
        });
        if (!response.ok) throw new Error('Failed to update subspace');
      }

      // Refresh subspaces
      const data = await SpaceService.getSubspacesBySpaceId(activeSpace.space_id, userId);
      setSubspaces(data);
      setShowSubspaceModal(false);
    } catch (err) {
      setError(`Failed to ${subspaceAction} subspace`);
      console.error(`Error ${subspaceAction}ing subspace:`, err);
    }
  };

  const handleDeleteSubspace = async () => {
    if (!currentSubspace || !activeSpace) return;

    try {
      const userId = getUserId();
      const response = await fetch(`${API_BASE_URL}/subspaces/${currentSubspace.subspace_id}/${userId}`, {
        method: 'DELETE',
        headers: SpaceService.getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete subspace');

      // Refresh subspaces
      const data = await SpaceService.getSubspacesBySpaceId(activeSpace.space_id, userId);
      setSubspaces(data);
      setShowSubspaceModal(false);
      setActiveSubspace(null);
    } catch (err) {
      setError('Failed to delete subspace');
      console.error('Error deleting subspace:', err);
    }
  };
  const handleViewSwitch = (todoId: string, direction: 'left' | 'right') => {
    const views: ('unchecked' | 'checked' | 'history')[] = ['unchecked', 'checked', 'history'];
    const current = todoViewMap[todoId] || 'unchecked';
    const index = views.indexOf(current);
    const nextIndex = direction === 'left' ? Math.max(0, index - 1) : Math.min(views.length - 1, index + 1);

    setTodoViewMap(prev => ({
      ...prev,
      [todoId]: views[nextIndex],
    }));
  };

  const handleRenameTodo = async (todoId: string, newName: string) => {
    try {
      // Find the todo in your current todos list
      const todo = todos.find(t => t.todo_id === todoId);
      if (!todo) return;

      // Prepare data for PUT request
      const data = {
        space_id: activeSpace?.space_id,         // existing space_id from todo
        subspace_id: currentSubspace?.subspace_id,   // existing subspace_id
        user_id: getUserId(),             // get user_id however you do in your app
        refresh_type: todo.refresh_type, // keep current refresh_type
        name: newName,                   // new name from input
        last_state: false     // keep current last_state
      };

      // Send PUT request to update todo name
      const res = await fetch(`https://meseer.com/dog/todos/${todoId}`, {
        method: "PUT",
        headers: SpaceService.getHeaders(),
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        throw new Error("Failed to update todo");
      }

      // Update local state
      setTodos(prev =>
        prev.map(t => (t.todo_id === todoId ? { ...t, name: newName } : t))
      );
    } catch (error) {
      console.error("Rename failed:", error);
    }
  };
  const handleCreateWordpad = async (refreshType: 'daily' | 'weekly' | 'monthly') => {
    if (!activeSpace || !activeSubspace) return;

    const userId = getUserId();

    try {
      await SpaceService.createWordpad({
        space_id: activeSpace.space_id,
        subspace_id: activeSubspace.subspace_id,
        user_id: userId,
        name: 'Wordpad',
        refresh_type: refreshType,
        last_state: true
      });

      // Refresh wordpads
      const wordpadsData = await SpaceService.getWordpadsBySubspace(activeSubspace.subspace_id, userId);
      const wordpadsWithContent = await Promise.all(wordpadsData.map(async (wordpad: Wordpad) => {
        const content = await SpaceService.getWordpadContent(wordpad.wordpad_id, userId);
        return { ...wordpad, contents: content };
      }));
      setWordpads(wordpadsWithContent);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error("Error creating wordpad:", message);
      setError('Failed to create wordpad');
    }
  };

  const handleDeleteWordpad = async (wordpadId: string) => {
    if (!confirm('Are you sure you want to delete this wordpad?')) return;

    try {
      const userId = getUserId();
      await SpaceService.deleteWordpad(wordpadId, userId);

      if (activeSubspace) {
        const wordpadsData = await SpaceService.getWordpadsBySubspace(activeSubspace.subspace_id, userId);
        const wordpadsWithContent = await Promise.all(wordpadsData.map(async (wordpad: Wordpad) => {
          const content = await SpaceService.getWordpadContent(wordpad.wordpad_id, userId);
          return { ...wordpad, contents: content };
        }));
        setWordpads(wordpadsWithContent);
      }
    } catch (err) {
      setError('Failed to delete wordpad');
      console.error('Error deleting wordpad:', err);
    }
  };

  const handleSaveWordpadContent = async (wordpadId: string, content: string) => {
    try {
      const userId = getUserId();

      // Check if there's existing content to update or if we need to create new
      const wordpad = wordpads.find(w => w.wordpad_id === wordpadId);
      const existingContent = wordpad?.contents?.[0];

      if (existingContent) {
        await SpaceService.updateWordpadContent(existingContent.wc_id, content);
      } else {
        await SpaceService.createWordpadContent({
          wordpad_id: wordpadId,
          user_id: userId,
          content
        });
      }

      // Refresh wordpad content
      const updatedContent = await SpaceService.getWordpadContent(wordpadId, userId);
      setWordpads(prev => prev.map(w =>
        w.wordpad_id === wordpadId ? { ...w, contents: updatedContent } : w
      ));

      if (maximizedWordpad?.wordpad_id === wordpadId) {
        setMaximizedWordpad(prev => prev ? { ...prev, contents: updatedContent } : null);
      }
    } catch (err) {
      console.error('Failed to save wordpad content:', err);
      setError('Failed to save wordpad content');
    }
  };

  const handleRenameWordpad = async (wordpadId: string, newName: string) => {
    try {
      const wordpad = wordpads.find(w => w.wordpad_id === wordpadId);
      if (!wordpad) return;

      const userId = getUserId();
      const response = await fetch(`${API_BASE_URL}/wordpads/${wordpadId}`, {
        method: "PUT",
        headers: SpaceService.getHeaders(),
        body: JSON.stringify({
          name: newName,
          refresh_type: wordpad.refresh_type,
          subspace_id: activeSubspace?.subspace_id,
          user_id: userId
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update wordpad");
      }

      // Update wordpads list
      setWordpads(prev =>
        prev.map(w => (w.wordpad_id === wordpadId ? { ...w, name: newName } : w))
      );

      // Update maximized wordpad if it's the current one
      if (maximizedWordpad?.wordpad_id === wordpadId) {
        setMaximizedWordpad(prev => prev ? { ...prev, name: newName } : null);
      }

      // Reset editing state
    } catch (error) {
      console.error("Rename failed:", error);
      // Revert to original name if rename fails
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white text-black">
      {/* Left Panel */}

      {isMobile ?
        (<>
          <SideBar />
          <AlignLeft
            className="absolute top-12 left-4 z-500 w-6 h-6 cursor-pointer text-black"
            onClick={() => setShowSidebar(!showSidebar)}
          />
          <div
            ref={sidebarRef}
            className={`fixed top-15 left-0 z-100  h-full transition-transform duration-300 ease-in-out ${showSidebar ? 'translate-x-0' : '-translate-x-full'
              }`}
          >
            <SidebarPanel
              mounted={mounted}
              error={error}
              loading={loading}
              spaces={spaces}
              subspaces={subspaces}
              activeSpace={activeSpace}
              setActiveSpace={setActiveSpace}
              activeSubspace={activeSubspace}
              setActiveSubspace={setActiveSubspace}
              setShowSubspaceModal={setShowSubspaceModal}
              setSubspaceAction={setSubspaceAction}
              showTodoMenu={showTodoMenu}
              setShowTodoMenu={setShowTodoMenu}
              showWordpadMenu={showWordpadMenu}
              setShowWordpadMenu={setShowWordpadMenu}
              dropdownRef={dropdownRef}
              refreshTypes={refreshTypes}
              handleCreateTodoWithType={handleCreateTodoWithType}
              handleCreateWordpad={handleCreateWordpad}
              dropdownVariants={dropdownRef}
            />
          </div>
        </>)
        :
        <SidebarPanel
          mounted={mounted}
          error={error}
          loading={loading}
          spaces={spaces}
          subspaces={subspaces}
          activeSpace={activeSpace}
          setActiveSpace={setActiveSpace}
          activeSubspace={activeSubspace}
          setActiveSubspace={setActiveSubspace}
          setShowSubspaceModal={setShowSubspaceModal}
          setSubspaceAction={setSubspaceAction}
          showTodoMenu={showTodoMenu}
          setShowTodoMenu={setShowTodoMenu}
          showWordpadMenu={showWordpadMenu}
          setShowWordpadMenu={setShowWordpadMenu}
          dropdownRef={dropdownRef}
          refreshTypes={refreshTypes}
          handleCreateTodoWithType={handleCreateTodoWithType}
          handleCreateWordpad={handleCreateWordpad}
          dropdownVariants={dropdownRef}
        />
      }

      {/* Main Content */}
      <div className="flex-2 p-6 overflow-auto mt-15">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-2 font-bold"
              >
                ×
              </button>
            </div>
            {error.includes('Invalid API response') && (
              <div className="mt-2 text-xs">
                Please check the API response format or contact support.
              </div>
            )}
          </div>
        )}

        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          {activeSpace && (
            <>
              <span
                className="hover:text-black cursor-pointer"
                onClick={() => setActiveSubspace(null)}
              >
                {activeSpace.name}
              </span>
              {activeSubspace && (
                <>
                  <ChevronRight className="w-4 h-4 mx-1" />
                  <span className="text-black">{activeSubspace.name}</span>
                </>
              )}
            </>
          )}
        </div>

        {/* Todo Cards */}
        {loading.todos || loading.wordpads ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {todos.length > 0 ? (
                todos.map((todo) => {
                  const isCollapsed = collapsedTodos.includes(todo.todo_id);
                  const currentView = todoViewMap[todo.todo_id] || 'unchecked';
                  return (
                    <motion.div
                      key={todo.todo_id}
                      layout
                      transition={{ duration: 0.4 }}
                      className={`bg-white rounded-xl border border-gray-300 shadow text-sm flex flex-col overflow-hidden transition-[max-80] duration-400 ease-in-out ${isCollapsed ? "max-h-20" : "h-80"}`}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between px-3 py-2 border-b group">
                        {editingTodoId === todo.todo_id ? (
                          <input
                            className="font-semibold truncate w-full border-b border-gray-300 focus:outline-none"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => {
                              if (editingName.trim() && editingName !== todo.name) {
                                handleRenameTodo(todo.todo_id, editingName.trim());
                              }
                              setEditingTodoId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                if (editingName.trim() && editingName !== todo.name) {
                                  handleRenameTodo(todo.todo_id, editingName.trim());
                                }
                                setEditingTodoId(null);
                              } else if (e.key === "Escape") {
                                setEditingName(todo.name);
                                setEditingTodoId(null);
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <span
                            className="font-semibold truncate cursor-pointer"
                            onClick={() => {
                              setEditingTodoId(todo.todo_id);
                              setEditingName(todo.name);
                            }}
                            title="Click to rename"
                          >
                            {todo.name}
                          </span>
                        )}
                        <Trash2Icon
                          className="w-4 h-4 text-red-500 opacity-50 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                          onClick={() => handleDeleteTodo(todo.todo_id)}
                        />
                      </div>

                      {/* Collapsible Content */}
                      <AnimatePresence initial={false}>
                        {!isCollapsed && (
                          <motion.div
                            key={todo.todo_id}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 py-2 space-y-2 h-80 overflow-y-auto">
                              {(() => {
                                const filteredItems = (todo as any).contents?.filter((item: any) => {
                                  if (currentView === "unchecked") return !item.checked;
                                  if (currentView === "checked") return item.checked;
                                  if (currentView === "history") return item.refresh_type === "archived";
                                  return true;
                                }) || [];

                                return filteredItems.length > 0 ? (
                                  filteredItems.map((item: any) => (
                                    <motion.div
                                      key={`${todo.todo_id}-${item.tc_id}`}
                                      initial={{ opacity: 0, y: 5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -5 }}
                                      transition={{ duration: 0.2 }}
                                      className="group flex items-center justify-between px-3 py-2 rounded-xl bg-white shadow-sm hover:shadow-md transition-all"
                                    >
                                      <div className="flex items-center gap-3 overflow-hidden w-full">
                                        <input
                                          type="checkbox"
                                          checked={item.checked}
                                          onChange={() => handleToggleCheck(todo.todo_id, item.tc_id)}
                                          className="accent-blue-600 w-4 h-4 rounded"
                                        />
                                        <span className="text-sm text-gray-800 truncate w-full">
                                          {item.content}
                                        </span>
                                      </div>

                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={async () => {
                                          try {
                                            await fetch(`https://meseer.com/dog/todo_content/${item.tc_id}`, {
                                              method: "DELETE",
                                              headers: SpaceService.getHeaders(),
                                            });

                                            const userId = getUserId();
                                            if (activeSubspace) {
                                              const updatedTodos = await SpaceService.getTodoDataBySubspace(
                                                activeSubspace.subspace_id,
                                                userId
                                              );
                                              setTodos(updatedTodos);
                                            }
                                          } catch (err) {
                                            console.error("Failed to delete task:", err);
                                          }
                                        }}
                                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 text-sm transition ml-2"
                                        title="Delete Task"
                                      >
                                        ❌
                                      </motion.button>
                                    </motion.div>
                                  ))
                                ) : (
                                  <p className="text-gray-400 italic">No tasks in this view</p>
                                );
                              })()}

                              {/* New Task Input */}
                              {newTaskContentMap[todo.todo_id] !== undefined && (
                                <input
                                  type="text"
                                  className="w-full border px-2 py-1 text-sm rounded"
                                  placeholder="Enter task and press Enter"
                                  value={newTaskContentMap[todo.todo_id]}
                                  onChange={(e) =>
                                    setNewTaskContentMap((prev) => ({
                                      ...prev,
                                      [todo.todo_id]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={async (e) => {
                                    if (e.key === "Enter") {
                                      const content = newTaskContentMap[todo.todo_id].trim();
                                      if (!content) return;

                                      try {
                                        const userId = getUserId();
                                        const now = new Date().toISOString();
                                        const refresh_type = todo.refresh_type || "daily"; // default fallback
                                        const version = "v1"; // hardcoded or adjust as needed

                                        await fetch(`https://meseer.com/dog/todo_content`, {
                                          method: "POST",
                                          headers: SpaceService.getHeaders(),
                                          body: JSON.stringify({
                                            todo_id: todo.todo_id,
                                            user_id: userId,
                                            content,
                                            checked: false,
                                            urgent: true,
                                            important: false,
                                            version,
                                            created_date: now,
                                            last_updated: now,
                                            refresh_type,
                                          }),
                                        });

                                        if (activeSubspace) {
                                          const updatedTodos = await SpaceService.getTodoDataBySubspace(
                                            activeSubspace.subspace_id,
                                            userId
                                          );
                                          setTodos(updatedTodos);
                                        }

                                        setNewTaskContentMap((prev) => {
                                          const updated = { ...prev };
                                          delete updated[todo.todo_id];
                                          return updated;
                                        });

                                      }
                                      catch (err) {
                                        console.error("Failed to add task:", err);
                                      }
                                    }
                                    if (e.key === "Escape") {
                                      setNewTaskContentMap((prev) => {
                                        const updated = { ...prev };
                                        delete updated[todo.todo_id];
                                        return updated;
                                      });
                                    }
                                  }}
                                />
                              )}

                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Footer */}
                      <div className="flex items-center justify-between border-t px-3 py-2">
                        <div className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full">
                          {todo.refresh_type}
                        </div>
                        <div className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full">
                          {currentView}
                        </div>
                        <div className="flex gap-2 text-gray-600 items-center">
                          <CirclePlus
                            className="w-4 h-4 cursor-pointer"
                            onClick={() => {
                              setNewTaskContentMap((prev) => ({ ...prev, [todo.todo_id]: '' }));
                            }}
                          />
                          <SquareChevronLeft
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => handleViewSwitch(todo.todo_id, "left")}
                          />
                          <SquareChevronRight
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => handleViewSwitch(todo.todo_id, "right")}
                          />

                          <Maximize2 className="w-3 h-3 cursor-pointer" onClick={() => setMaximizedTodo(todo)} />
                          <button
                            onClick={() =>
                              setCollapsedTodos((prev: string[]) =>
                                prev.includes(todo.todo_id)
                                  ? prev.filter((id) => id !== todo.todo_id)
                                  : [...prev, todo.todo_id]
                              )
                            }
                            className="text-xs"
                          >
                            {isCollapsed ? "🔼" : "🔽"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <></>
                // <div className="col-span-full text-center py-10 text-gray-500">
                //   {activeSubspace ? "No todos found in this subspace" : "Select a subspace to view todos"}
                // </div>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-5">
              {wordpads.length > 0 && activeSubspace ? (
                wordpads.map((wordpad) => {
                  const isCollapsed = collapsedWordpads.includes(wordpad.wordpad_id);
                  const currentView = wordpadViewMap[wordpad.wordpad_id] || 'current';
                  const latestContent = wordpad.contents?.[0]?.content || '';

                  return (
                    <motion.div
                      ref={(el) => { editorRefs.current[wordpad.wordpad_id] = el; }} // ✅ ref goes here!                    
                      key={wordpad.wordpad_id}
                      layout
                      transition={{ duration: 0.4 }}
                      className={`bg-white rounded-xl border border-gray-300 shadow text-sm flex flex-col overflow-hidden transition-[height-80] duration-400 ease-in-out ${isCollapsed ? "max-h-20" : "h-80"}`}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between px-3 py-2 border-b group">
                        {editingWordpadId === wordpad.wordpad_id ? (
                          <input
                            className="font-semibold truncate w-full border-b border-gray-300 focus:outline-none"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => {
                              if (editingName.trim() && editingName !== wordpad.name) {
                                handleRenameWordpad(wordpad.wordpad_id, editingName.trim());
                              }

                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                if (editingName.trim() && editingName !== wordpad.name) {
                                  handleRenameWordpad(wordpad.wordpad_id, editingName.trim());
                                }

                                setEditingWordpadId(null);
                              } else if (e.key === "Escape") {
                                setEditingName(wordpad.name);

                                setEditingWordpadId(null);
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <span
                            className="font-semibold truncate cursor-pointer"
                            onClick={() => {
                              setEditingWordpadId(wordpad.wordpad_id);
                              setEditingName(wordpad.name);
                            }}
                            title="Click to rename"
                          >
                            {wordpad.name}
                          </span>
                        )}
                        <Trash2Icon
                          className="w-4 h-4 text-red-500 opacity-50 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                          onClick={() => handleDeleteWordpad(wordpad.wordpad_id)}
                        />
                      </div>

                      {/* Collapsible Content */}
                      <AnimatePresence initial={false}>
                        {!isCollapsed && (
                          <motion.div
                            key={wordpad.wordpad_id}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 py-2 space-y-2 h-80 overflow-y-auto">
                              {currentView === 'current' ? (
                                wordpadContentMap[wordpad.wordpad_id] !== undefined ? (
                                  <WordpadEditor
                                    content={wordpadContentMap[wordpad.wordpad_id] ?? latestContent}
                                    onSave={(updatedHtml) => {
                                      setWordpadContentMap((prev) => ({
                                        ...prev,
                                        [wordpad.wordpad_id]: updatedHtml,
                                      }));
                                      handleSaveWordpadContent(wordpad.wordpad_id, updatedHtml);
                                    }}
                                    onVoiceInput={(transcript) => {
                                      setWordpadContentMap(prev => ({
                                        ...prev,
                                        [wordpad.wordpad_id]: (prev[wordpad.wordpad_id] || latestContent) + ' ' + transcript,
                                      }));
                                    }}
                                  />
                                ) : (
                                  <>
                                    {latestContent ? (
                                      <div
                                        dangerouslySetInnerHTML={{ __html: latestContent }}
                                        className="p-2 text-sm text-gray-800 cursor-text min-h-[100px]"
                                        onClick={() => {
                                          setEditingContentWordpadId(wordpad.wordpad_id);
                                          setWordpadContentMap((prev) => ({
                                            ...prev,
                                            [wordpad.wordpad_id]: latestContent,
                                          }));
                                        }}
                                      />
                                    ) : (
                                      <div
                                        className="p-2 text-sm text-gray-400 italic cursor-text min-h-[100px]"
                                        onClick={() => {
                                          setEditingContentWordpadId(wordpad.wordpad_id);
                                          setWordpadContentMap((prev) => ({
                                            ...prev,
                                            [wordpad.wordpad_id]: latestContent || '<p></p>',
                                          }));
                                        }}
                                      >
                                        Click to add content
                                      </div>
                                    )}
                                  </>
                                )
                              ) : (
                                <div className="p-3 border rounded min-h-[300px]">
                                  <h3 className="font-semibold mb-2">Version History</h3>
                                  {wordpad.contents?.length ? (
                                    <div className="space-y-3">
                                      {wordpad.contents.map((content, index) => (
                                        <div key={content.wc_id} className="border-b pb-3">
                                          <div className="text-xs text-gray-500 mb-1">
                                            Version: {content.version} | {new Date(content.last_updated).toLocaleString()}
                                          </div>
                                          <div className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: content.content }} />
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-gray-400 italic">No history available</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Footer */}
                      <div className="flex items-center justify-between border-t px-3 py-2">
                        <div className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full">
                          {wordpad.refresh_type}
                        </div>
                        <div className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full uppercase">
                          {currentView}
                        </div>
                        <div className="flex gap-2 text-gray-600 items-center">
                          <SquareChevronLeft
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => {
                              setWordpadViewMap(prev => ({
                                ...prev,
                                [wordpad.wordpad_id]: 'current',
                              }));
                            }}
                          />
                          <SquareChevronRight
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => {
                              setWordpadViewMap(prev => ({
                                ...prev,
                                [wordpad.wordpad_id]: 'history',
                              }));
                            }}
                          />
                          <Maximize2
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => setMaximizedWordpad(wordpad)}
                          />
                          <button
                            onClick={() =>
                              setCollapsedWordpads((prev: string[]) =>
                                prev.includes(wordpad.wordpad_id)
                                  ? prev.filter((id) => id !== wordpad.wordpad_id)
                                  : [...prev, wordpad.wordpad_id]
                              )
                            }
                            className="text-xs"
                          >
                            {isCollapsed ? "🔼" : "🔽"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <></>
                // <div className="col-span-full text-center py-10 text-gray-500">
                //   {activeSubspace ? "No wordpads found in this subspace" : "Select a subspace to view wordpads"}
                // </div>
              )}
            </div>
          </>
        )}
      </div>
      {maximizedWordpad && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl p-6 relative h-[80vh] flex flex-col">
            <button
              onClick={() => setMaximizedWordpad(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
            >
              ✕
            </button>

            {/* ✅ WORDPAD NAME EDITING FIX */}
            <div className="flex items-center justify-between border-b pb-2 mb-4">
              {editingWordpadId === maximizedWordpad.wordpad_id ? (
                <input
                  className="text-xl font-bold border-b border-gray-300 focus:outline-none flex-1 mr-2"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => {
                    if (editingName.trim() && editingName !== maximizedWordpad.name) {
                      handleRenameWordpad(maximizedWordpad.wordpad_id, editingName.trim());
                    }

                    setEditingWordpadId(null); // ✅ Ensure exit edit mode
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (editingName.trim() && editingName !== maximizedWordpad.name) {
                        handleRenameWordpad(maximizedWordpad.wordpad_id, editingName.trim());
                      }

                      setEditingWordpadId(null);
                    } else if (e.key === "Escape") {
                      setEditingName(maximizedWordpad.name);

                      setEditingWordpadId(null);
                    }
                  }}
                  autoFocus
                />
              ) : (
                <span
                  className="text-xl font-bold truncate cursor-pointer"
                  onClick={() => {
                    setEditingName(maximizedWordpad.name); // ✅ Set name
                    setEditingWordpadId(maximizedWordpad.wordpad_id); // ✅ Activate edit
                  }}
                  title="Click to rename"
                >
                  {maximizedWordpad.name}
                </span>
              )}

              <Trash2Icon
                className="w-4 h-4 text-red-500 opacity-50 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                onClick={() => {
                  handleDeleteWordpad(maximizedWordpad.wordpad_id);
                  setMaximizedWordpad(null);
                }}
              />
            </div>



            {/* Content Area */}
            <div className="flex-1 overflow-auto mb-4">
              {(wordpadViewMap[maximizedWordpad.wordpad_id] || 'current') === 'current' ? (
                <WordpadEditor
                  content={
                    wordpadContentMap[maximizedWordpad.wordpad_id] ??
                    (maximizedWordpad.contents?.[0]?.content || '')
                  }
                  onSave={(updatedHtml) => {
                    setWordpadContentMap((prev) => ({
                      ...prev,
                      [maximizedWordpad.wordpad_id]: updatedHtml,
                    }));
                    handleSaveWordpadContent(maximizedWordpad.wordpad_id, updatedHtml);
                  }}
                  onVoiceInput={(transcript) => {
                    setWordpadContentMap((prev) => ({
                      ...prev,
                      [maximizedWordpad.wordpad_id]:
                        (prev[maximizedWordpad.wordpad_id] ??
                          (maximizedWordpad.contents?.[0]?.content || '')) + ' ' + transcript,
                    }));
                  }}
                />
              ) : (
                <div className="p-3 border rounded min-h-[300px]">
                  <h3 className="font-semibold mb-2">Version History</h3>
                  {maximizedWordpad.contents?.length ? (
                    <div className="space-y-3">
                      {maximizedWordpad.contents.map((content, index) => (
                        <div key={content.wc_id} className="border-b pb-3">
                          <div className="text-xs text-gray-500 mb-1">
                            Version: {content.version} |{" "}
                            {new Date(content.last_updated).toLocaleString()}
                          </div>
                          <div
                            className="text-sm border border-gray-200 rounded p-2"
                            dangerouslySetInnerHTML={{ __html: content.content }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">No history available</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer Controls */}
            <div className="flex justify-between items-center border-t pt-4">
              <div className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full">
                {maximizedWordpad.refresh_type}
              </div>
              <div className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full uppercase">
                {wordpadViewMap[maximizedWordpad.wordpad_id] || 'current'}
              </div>
              <div className="flex gap-3 text-gray-600">
                <SquareChevronLeft
                  className="w-4 h-4 cursor-pointer"
                  onClick={() => {
                    setWordpadViewMap((prev) => ({
                      ...prev,
                      [maximizedWordpad.wordpad_id]: 'current',
                    }));
                  }}
                />
                <SquareChevronRight
                  className="w-4 h-4 cursor-pointer"
                  onClick={() => {
                    setWordpadViewMap((prev) => ({
                      ...prev,
                      [maximizedWordpad.wordpad_id]: 'history',
                    }));
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {showSubspaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
          <div className="bg-zinc-900 text-white rounded-xl shadow-2xl w-full max-w-4xl h-[60vh] flex overflow-hidden">

            {/* Left Panel: Subspaces List */}
            <div className="w-1/3 bg-zinc-800 border-r border-zinc-700 overflow-y-auto">
              <div className="p-4 border-b border-zinc-700 text-lg font-semibold">
                Subspaces
              </div>
              <div className="divide-y divide-zinc-700">
                {subspaces.map((subspace) => (
                  <div key={subspace.subspace_id} className="flex justify-between items-center p-3 hover:bg-zinc-700 cursor-pointer">
                    <span
                      onClick={() => setCurrentSubspace(subspace)}
                      className="truncate cursor-pointer"
                    >
                      {subspace.name}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => handleSubspaceAction('edit', subspace)}>
                        <Edit className="w-4 h-4 text-blue-400 hover:text-blue-500" />
                      </button>
                      <button onClick={() => handleSubspaceAction('delete', subspace)}>
                        <Trash2 className="w-4 h-4 text-red-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel: Form or Action */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">
                  {subspaceAction === 'edit'
                    ? 'Editing Subspace'
                    : subspaceAction === 'create'
                      ? 'Creating New Subspace'
                      : 'Subspace Details'}
                </h3>
                <button onClick={() => setShowSubspaceModal(false)} className="text-white hover:text-gray-300 text-xl">
                  ✕
                </button>
              </div>

              {/* Create/Edit Form */}
              {(subspaceAction === 'create' || subspaceAction === 'edit') && (
                <>
                  <label className="block text-sm font-medium mb-2">Subspace</label>
                  <input
                    type="text"
                    value={newSubspaceName}
                    onChange={(e) => setNewSubspaceName(e.target.value)}
                    className="w-full px-4 py-2 mb-6 placeholder:text-white rounded-md border-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter subspace name"
                    autoFocus
                  />
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => setSubspaceAction(null)}
                      className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleSaveSubspace}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      {subspaceAction === 'create' ? 'Submit' : 'Update'}
                    </button>
                  </div>
                </>
              )}

              {/* Delete Confirmation */}
              {subspaceAction === 'delete' && (
                <>
                  <p className="mb-4">
                    Are you sure you want to delete <strong>{currentSubspace?.name}</strong>?
                  </p>
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => setSubspaceAction(null)}
                      className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteSubspace}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </>
              )}

              {/* Idle State */}
              {!subspaceAction && (
                <button
                  onClick={() => handleSubspaceAction('create')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  + Create New Subspace
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {maximizedTodo && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setMaximizedTodo(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
            >
              ✕
            </button>

            {/* Header */}
            <div className="flex items-center justify-between border-b pb-2 mb-4">
              <h2 className="text-xl font-bold">{maximizedTodo.name}</h2>
              <Trash2Icon
                className="w-4 h-4 text-red-500 opacity-50 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                onClick={() => handleDeleteTodo(maximizedTodo.todo_id)}
              />
            </div>

            {/* Filtered Todo List */}
            <div className="space-y-2 mb-4">
              {(() => {
                const currentView = todoViewMap[maximizedTodo.todo_id] || 'unchecked';
                const filteredItems = (maximizedTodo as any).contents?.filter((item: any) => {
                  if (currentView === 'unchecked') return !item.checked;
                  if (currentView === 'checked') return item.checked;
                  if (currentView === 'history') return item.refresh_type === 'archived';
                  return true;
                }) || [];

                return filteredItems.length > 0 ? (
                  filteredItems.map((item: any) => (
                    <motion.div
                      key={`${maximizedTodo.todo_id}-${item.tc_id}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                      className="group flex items-center justify-between px-3 py-2 rounded-xl bg-white shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3 overflow-hidden w-full">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() =>
                            handleToggleCheck(maximizedTodo.todo_id, item.tc_id)
                          }
                          className="accent-blue-600 w-4 h-4 rounded"
                        />
                        <span className="text-sm text-gray-800 truncate w-full">
                          {item.content}
                        </span>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={async () => {
                          try {
                            await fetch(`https://meseer.com/dog/todo_content/${item.tc_id}`, {
                              method: "DELETE",
                              headers: SpaceService.getHeaders(),
                            });

                            setMaximizedTodo((prev: any) => {
                              const newContents = prev.contents.filter((c: any) => c.tc_id !== item.tc_id);
                              return { ...prev, contents: newContents };
                            });

                            setTodos((prev: any) =>
                              prev.map((todo: any) =>
                                todo.todo_id === maximizedTodo.todo_id
                                  ? {
                                    ...todo,
                                    contents: todo.contents.filter((c: any) => c.tc_id !== item.tc_id),
                                  }
                                  : todo
                              )
                            );
                          } catch (err) {
                            console.error("Failed to delete task:", err);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 text-sm transition ml-2"
                        title="Delete Task"
                      >
                        ❌
                      </motion.button>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-gray-400 italic">No tasks in this view</p>
                );
              })()}

              {newTaskContentMap[maximizedTodo.todo_id] !== undefined && (
                <input
                  type="text"
                  className="w-full border px-2 py-1 text-sm rounded"
                  placeholder="Enter task and press Enter"
                  value={newTaskContentMap[maximizedTodo.todo_id]}
                  onChange={(e) =>
                    setNewTaskContentMap((prev) => ({
                      ...prev,
                      [maximizedTodo.todo_id]: e.target.value,
                    }))
                  }
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      const content = newTaskContentMap[maximizedTodo.todo_id].trim();
                      if (!content) return;

                      try {
                        const userId = getUserId();
                        const now = new Date().toISOString();
                        const refresh_type = maximizedTodo.refresh_type || "daily";
                        const version = "v1";

                        const newTask = {
                          tc_id: crypto.randomUUID(),
                          content,
                          checked: false,
                          urgent: true,
                          important: false,
                          refresh_type,
                          created_date: now,
                          last_updated: now,
                        };

                        setMaximizedTodo((prev: any) =>
                          prev ? { ...prev, contents: [newTask, ...prev.contents] } : prev
                        );

                        setTodos((prev: any) =>
                          prev.map((todo: any) =>
                            todo.todo_id === maximizedTodo.todo_id
                              ? { ...todo, contents: [newTask, ...todo.contents] }
                              : todo
                          )
                        );

                        await fetch(`https://meseer.com/dog/todo_content`, {
                          method: "POST",
                          headers: SpaceService.getHeaders(),
                          body: JSON.stringify({
                            todo_id: maximizedTodo.todo_id,
                            user_id: userId,
                            content,
                            checked: false,
                            urgent: true,
                            important: false,
                            version,
                            created_date: now,
                            last_updated: now,
                            refresh_type,
                          }),
                        });

                        setNewTaskContentMap((prev) => {
                          const updated = { ...prev };
                          delete updated[maximizedTodo.todo_id];
                          return updated;
                        });
                      } catch (err) {
                        console.error("Failed to add task:", err);
                      }
                    }

                    if (e.key === "Escape") {
                      setNewTaskContentMap((prev) => {
                        const updated = { ...prev };
                        delete updated[maximizedTodo.todo_id];
                        return updated;
                      });
                    }
                  }}
                />
              )}
            </div>

            {/* Footer Controls */}
            <div className="flex justify-between items-center border-t pt-4">
              <div className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full">
                {maximizedTodo.refresh_type}
              </div>
              <div className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full">
                {todoViewMap[maximizedTodo.todo_id] || 'unchecked'}
              </div>
              <div className="flex gap-3 text-gray-600">
                <CirclePlus
                  className="w-4 h-4 cursor-pointer"
                  onClick={() => {
                    setNewTaskContentMap((prev) => ({
                      ...prev,
                      [maximizedTodo.todo_id]: '',
                    }));
                  }}
                />
                <SquareChevronLeft
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => handleViewSwitch(maximizedTodo.todo_id, "left")}
                />
                <SquareChevronRight
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => handleViewSwitch(maximizedTodo.todo_id, "right")}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}