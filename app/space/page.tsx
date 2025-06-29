'use client';
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from 'react';
import { Mic, ChevronRight, ChevronDown, Plus, Edit, Hash, Eye, Repeat, Trash2, Settings, Pencil, CirclePlus, SquareChevronRight, SquareChevronLeft, Maximize2, Trash, Trash2Icon, Sidebar, AlignLeft, XCircle, X, ChevronLeft, ChevronUp, FileText, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from "react";
import SidebarPanel from "../components/SpaceSidebar"
import { WordpadEditor } from "../components/WordpadEditor"
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from "@hello-pangea/dnd";
import { LayoutGrid } from "lucide-react"; // use any icon you like

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
    console.log(data);
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
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskContent, setEditingTaskContent] = useState<string>('');
  const [gridCols, setGridCols] = useState(3); // default: 3 per row
  
  const cycleGridCols = () => {
    setGridCols((prev) => (prev >= 3 ? 1 : prev + 1)); // 1 → 2 → 3 → 4 → 1 ...
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const reordered = Array.from(todos);
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);

    setTodos(reordered);
  };

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

  const groupByRefreshTypeDate = (items: any[], type: 'daily' | 'weekly' | 'monthly') => {
    return items.reduce((acc: Record<string, any[]>, item) => {
      const date = new Date(item.last_updated);

      let key = '';
      if (type === 'daily') {
        key = date.toLocaleDateString("en-GB", {
          weekday: "long",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }); // e.g., "Monday, 17/06/2025"
      } else if (type === 'weekly') {
        const firstDayOfWeek = new Date(date);
        firstDayOfWeek.setDate(date.getDate() - date.getDay());
        key = `Week of ${firstDayOfWeek.toLocaleDateString("en-GB")}`;
      } else if (type === 'monthly') {
        key = date.toLocaleDateString("en-GB", { year: "numeric", month: "long" });
      }

      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  };

  const allCollapsed = todos.length > 0 && todos.every(todo =>
    collapsedTodos.includes(String(todo.todo_id))
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50 text-gray-900">
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
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <XCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-gray-600 mb-6">
          {activeSpace && (
            <>
              <span
                className="hover:text-blue-600 cursor-pointer transition-colors"
                onClick={() => setActiveSubspace(null)}
              >
                {activeSpace.name}
              </span>
              {activeSubspace && (
                <>
                  <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                  <span className="text-blue-600 font-medium">{activeSubspace.name}</span>
                </>
              )}
            </>
          )}
        </div>
        <div className="flex justify-end mb-4">
          <button
            onClick={cycleGridCols}
            className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded shadow-sm transition"
            title={`Change layout (${gridCols} per row)`}
          >
            <LayoutGrid className="w-4 h-4 text-gray-700" />
            <span className="text-sm font-medium text-gray-700">{gridCols}</span>
          </button>
          <button
            onClick={() => {
              const allCollapsed = todos.every((todo) =>
                collapsedTodos.includes(String(todo.todo_id))
              );
              if (allCollapsed) {
                setCollapsedTodos([]); // expand all
              } else {
                setCollapsedTodos(todos.map((todo) => String(todo.todo_id))); // collapse all
              }
            }}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded shadow-sm transition text-gray-700 text-sm"
          >
            {todos.every((todo) => collapsedTodos.includes(String(todo.todo_id))) ? (
              <>
                <ChevronDown className="w-4 h-4" />
                Expand All
              </>
            ) : (
              <>
                <ChevronUp className="w-4 h-4" />
                Collapse All
              </>
            )}
          </button>
        </div>

        {/* Todo Cards */}
        {loading.todos || loading.wordpads ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {todos.length > 0 ? (
                < DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="todo-grid" direction="vertical">
                    {(provided) => (
                      <div
                        className={`
    grid gap-4
    ${gridCols === 1 ? 'grid-cols-1' : ''}
    ${gridCols === 2 ? 'grid-cols-2 gap-x-60' : ''}
    ${gridCols === 3 ? 'grid-cols-3 gap-x-100' : ''}
  `}
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {todos.map((todo, index) => {
                          const isCollapsed = collapsedTodos.includes(String(todo.todo_id));
                          const currentView = todoViewMap[todo.todo_id] || 'unchecked';
                          return (
                            <Draggable key={String(todo.todo_id)} draggableId={String(todo.todo_id)} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  {/* ✅ Render your existing todo card here */}
                                  <motion.div
                                    key={todo.todo_id}
                                    layout
                                    transition={{ duration: 0.4 }}
                                    className={`bg-white min-w-[320px] rounded-xl border border-gray-300 shadow text-sm flex flex-col overflow-hidden transition-[max-80] duration-400 ease-in-out ${isCollapsed ? "max-h-20" : "h-80"}`}
                                  >
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-lg group">
                                      <div className="flex items-center min-w-0">
                                        {editingTodoId === todo.todo_id ? (
                                          <input
                                            className="font-medium text-gray-800 truncate w-full border-b border-gray-300 focus:outline-none focus:border-blue-500 bg-transparent"
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
                                            className="font-medium text-gray-800 truncate cursor-pointer hover:text-blue-600 transition-colors"
                                            onClick={() => {
                                              setEditingTodoId(todo.todo_id);
                                              setEditingName(todo.name);
                                            }}
                                            title="Click to rename"
                                          >
                                            {todo.name}
                                          </span>
                                        )}
                                      </div>
                                      <Trash2
                                        className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
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
                                          <div className="px-3 py-4 space-y-2 h-60 overflow-y-auto">
                                            {(() => {
                                              const historyItems = (todo as any).contents || [];
                                              const validRefreshType = ['daily', 'weekly', 'monthly'].includes(todo.refresh_type || '')
                                                ? (todo.refresh_type as 'daily' | 'weekly' | 'monthly')
                                                : 'daily';

                                              const grouped = groupByRefreshTypeDate(historyItems, validRefreshType);

                                              return currentView === "history" ? (
                                                Object.entries(grouped).map(([date, items]) => (
                                                  <div key={date} className="mb-4 ">
                                                    <div className="bg-gray-200 px-2 py-1 text-sm font-semibold rounded">{date}</div>
                                                    <ul className="mt-2 space-y-1">
                                                      {items.map((item: any) => (
                                                        <li key={item.tc_id} className="flex items-center gap-2">
                                                          <input type="checkbox" checked={item.checked} readOnly />
                                                          <span className={`text-sm ${item.checked ? 'line-through text-gray-600' : ''}`}>
                                                            {item.content}
                                                          </span>
                                                        </li>
                                                      ))}
                                                    </ul>
                                                  </div>
                                                ))
                                              ) : (
                                                // fallback to your existing view logic for unchecked/checked
                                                (todo as any).contents?.filter((item: any) => {
                                                  const now = new Date();
                                                  const itemDate = new Date(item.last_updated);

                                                  const isCurrent = (() => {
                                                    if (todo.refresh_type === 'daily') {
                                                      return now.toDateString() === itemDate.toDateString();
                                                    } else if (todo.refresh_type === 'weekly') {
                                                      const startOfWeek = new Date(now);
                                                      startOfWeek.setDate(now.getDate() - now.getDay());
                                                      const endOfWeek = new Date(startOfWeek);
                                                      endOfWeek.setDate(startOfWeek.getDate() + 6);
                                                      return itemDate >= startOfWeek && itemDate <= endOfWeek;
                                                    } else if (todo.refresh_type === 'monthly') {
                                                      return now.getMonth() === itemDate.getMonth() &&
                                                        now.getFullYear() === itemDate.getFullYear();
                                                    }
                                                    return true;
                                                  })();

                                                  if (!isCurrent) return false;
                                                  if (currentView === "unchecked") return !item.checked;
                                                  if (currentView === "checked") return item.checked;
                                                  return true;
                                                })
                                                  .map((item: any) => (
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
                                                        {editingTaskId === item.tc_id ? (
                                                          <input
                                                            className="text-sm text-gray-800 truncate w-full border-b border-gray-300 focus:outline-none"
                                                            value={editingTaskContent}
                                                            onChange={(e) => setEditingTaskContent(e.target.value)}
                                                            onBlur={async () => {
                                                              if (editingTaskContent.trim() && editingTaskContent !== item.content) {
                                                                await updateCheckStatus({ ...item, content: editingTaskContent });
                                                                const userId = getUserId();
                                                                if (activeSubspace) {
                                                                  const updatedTodos = await SpaceService.getTodoDataBySubspace(activeSubspace.subspace_id, userId);
                                                                  setTodos(updatedTodos);
                                                                }
                                                              }
                                                              setEditingTaskId(null);
                                                            }}
                                                            onKeyDown={async (e) => {
                                                              if (e.key === 'Enter') {
                                                                if (editingTaskContent.trim() && editingTaskContent !== item.content) {
                                                                  await updateCheckStatus({ ...item, content: editingTaskContent });
                                                                  const userId = getUserId();
                                                                  if (activeSubspace) {
                                                                    const updatedTodos = await SpaceService.getTodoDataBySubspace(activeSubspace.subspace_id, userId);
                                                                    setTodos(updatedTodos);
                                                                  }
                                                                }
                                                                setEditingTaskId(null);
                                                              } else if (e.key === 'Escape') {
                                                                setEditingTaskId(null);
                                                                setEditingTaskContent(item.content);
                                                              }
                                                            }}
                                                            autoFocus
                                                          />
                                                        ) : (
                                                          <span
                                                            className="text-sm text-gray-800 truncate w-full cursor-pointer"
                                                            onClick={() => {
                                                              setEditingTaskId(item.tc_id);
                                                              setEditingTaskContent(item.content);
                                                            }}
                                                          >
                                                            {item.content}
                                                          </span>
                                                        )}

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
                                    <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50">
                                      <div className="flex gap-2">
                                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                          {todo.refresh_type}
                                        </span>
                                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                                          {todoViewMap[todo.todo_id] || 'unchecked'}
                                        </span>
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => setNewTaskContentMap(prev => ({ ...prev, [todo.todo_id]: '' }))}
                                          className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                                          title="Add task"
                                        >
                                          <Plus className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleViewSwitch(todo.todo_id, "left")}
                                          className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                                          title="Previous view"
                                        >
                                          <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleViewSwitch(todo.todo_id, "right")}
                                          className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                                          title="Next view"
                                        >
                                          <ChevronRight className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => setMaximizedTodo(todo)}
                                          className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                                          title="Maximize"
                                        >
                                          <Maximize2 className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            setCollapsedTodos((prev) => {
                                              const id = String(todo.todo_id);
                                              return prev.includes(id)
                                                ? prev.filter((existingId) => existingId !== id)
                                                : [...prev, id];
                                            })
                                          }
                                          className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                                          title={collapsedTodos.includes(String(todo.todo_id)) ? "Expand" : "Collapse"}
                                        >
                                          {collapsedTodos.includes(String(todo.todo_id)) ? (
                                            <ChevronDown className="w-4 h-4" />
                                          ) : (
                                            <ChevronUp className="w-4 h-4" />
                                          )}
                                        </button>

                                      </div>
                                    </div>
                                  </motion.div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
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
                      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-lg group">
                        <div className="flex items-center min-w-0">
                          {editingWordpadId === wordpad.wordpad_id ? (
                            <input
                              className="font-medium text-gray-800 truncate w-full border-b border-gray-300 focus:outline-none focus:border-blue-500 bg-transparent"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onBlur={() => {
                                if (editingName.trim() && editingName !== wordpad.name) {
                                  handleRenameWordpad(wordpad.wordpad_id, editingName.trim());
                                }
                                setEditingWordpadId(null);
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
                              className="font-medium text-gray-800 truncate cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => {
                                setEditingWordpadId(wordpad.wordpad_id);
                                setEditingName(wordpad.name);
                              }}
                              title="Click to rename"
                            >
                              {wordpad.name}
                            </span>
                          )}
                        </div>
                        <Trash2
                          className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
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
                      <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50">
                        <div className="flex gap-2">
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                            {wordpad.refresh_type}
                          </span>
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-800 uppercase">
                            {wordpadViewMap[wordpad.wordpad_id] || 'current'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setWordpadViewMap(prev => ({
                                ...prev,
                                [wordpad.wordpad_id]: 'current',
                              }));
                            }}
                            className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                            title="Current version"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setWordpadViewMap(prev => ({
                                ...prev,
                                [wordpad.wordpad_id]: 'history',
                              }));
                            }}
                            className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                            title="Version history"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setMaximizedWordpad(wordpad)}
                            className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                            title="Maximize"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setCollapsedWordpads(prev =>
                              prev.includes(wordpad.wordpad_id)
                                ? prev.filter(id => id !== wordpad.wordpad_id)
                                : [...prev, wordpad.wordpad_id]
                            )}
                            className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                            title={collapsedWordpads.includes(wordpad.wordpad_id) ? "Expand" : "Collapse"}
                          >
                            {collapsedWordpads.includes(wordpad.wordpad_id) ?
                              <ChevronDown className="w-4 h-4" /> :
                              <ChevronUp className="w-4 h-4" />
                            }
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center min-w-0">
                {editingWordpadId === maximizedWordpad.wordpad_id ? (
                  <input
                    className="text-xl font-semibold text-gray-800 border-b border-gray-300 focus:outline-none focus:border-blue-500 bg-transparent"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => {
                      if (editingName.trim() && editingName !== maximizedWordpad.name) {
                        handleRenameWordpad(maximizedWordpad.wordpad_id, editingName.trim());
                      }
                      setEditingWordpadId(null);
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
                  <h2
                    className="text-xl font-semibold text-gray-800 truncate cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => {
                      setEditingWordpadId(maximizedWordpad.wordpad_id);
                      setEditingName(maximizedWordpad.name);
                    }}
                    title="Click to rename"
                  >
                    {maximizedWordpad.name}
                  </h2>
                )}
              </div>
              <button
                onClick={() => setMaximizedWordpad(null)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Content Area */}
            <div className="flex-1 overflow-auto p-4">
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
            <div className="flex items-center justify-between p-4 border-t">
              <div className="flex gap-2">
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  {maximizedWordpad.refresh_type}
                </span>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-800 uppercase">
                  {wordpadViewMap[maximizedWordpad.wordpad_id] || 'current'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setWordpadViewMap(prev => ({
                      ...prev,
                      [maximizedWordpad.wordpad_id]: 'current',
                    }));
                  }}
                  className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setWordpadViewMap(prev => ({
                      ...prev,
                      [maximizedWordpad.wordpad_id]: 'history',
                    }));
                  }}
                  className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <Clock className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSubspaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {subspaceAction === 'create' ? 'Create New Subspace' :
                  subspaceAction === 'edit' ? 'Edit Subspace' :
                    subspaceAction === 'delete' ? 'Delete Subspace' : 'Subspaces'}
              </h3>
              <button
                onClick={() => setShowSubspaceModal(false)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              {(subspaceAction === 'create' || subspaceAction === 'edit') && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subspace Name
                    </label>
                    <input
                      type="text"
                      value={newSubspaceName}
                      onChange={(e) => setNewSubspaceName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter subspace name"
                      autoFocus
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setSubspaceAction(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveSubspace}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      {subspaceAction === 'create' ? 'Create' : 'Update'}
                    </button>
                  </div>
                </>
              )}
              {subspaceAction === 'delete' && (
                <>
                  <div className="mb-4">
                    <p className="text-gray-700">
                      Are you sure you want to delete <span className="font-semibold">"{currentSubspace?.name}"</span>?
                      This action cannot be undone.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setSubspaceAction(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteSubspace}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
              {!subspaceAction && (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleSubspaceAction('create')}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Subspace
                  </button>
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Subspaces</h4>
                    <div className="space-y-2">
                      {subspaces.map((subspace) => (
                        <div key={subspace.subspace_id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                          <span>{subspace.name}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSubspaceAction('edit', subspace)}
                              className="p-1 text-gray-500 hover:text-blue-600"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSubspaceAction('delete', subspace)}
                              className="p-1 text-gray-500 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {maximizedTodo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">           <button
            onClick={() => setMaximizedTodo(null)}
            className="absolute top-2 right-2 text-gray-500 hover:text-black"
          >
            ✕
          </button>

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center min-w-0">
                {editingTodoId === maximizedTodo.todo_id ? (
                  <input
                    className="text-xl font-semibold text-gray-800 border-b border-gray-300 focus:outline-none focus:border-blue-500 bg-transparent"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => {
                      if (editingName.trim() && editingName !== maximizedTodo.name) {
                        handleRenameTodo(maximizedTodo.todo_id, editingName.trim());
                      }
                      setEditingTodoId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (editingName.trim() && editingName !== maximizedTodo.name) {
                          handleRenameTodo(maximizedTodo.todo_id, editingName.trim());
                        }
                        setEditingTodoId(null);
                      } else if (e.key === "Escape") {
                        setEditingName(maximizedTodo.name);
                        setEditingTodoId(null);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <h2
                    className="text-xl font-semibold text-gray-800 truncate cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => {
                      setEditingTodoId(maximizedTodo.todo_id);
                      setEditingName(maximizedTodo.name);
                    }}
                    title="Click to rename"
                  >
                    {maximizedTodo.name}
                  </h2>
                )}
              </div>
              <button
                onClick={() => setMaximizedTodo(null)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filtered Todo List */}
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-2 mb-4">
                {(() => {
                  const currentView = todoViewMap[maximizedTodo.todo_id] || 'unchecked';
                  const items = (maximizedTodo as any).contents || [];

                  if (currentView === 'history') {
                    // ✅ Type-safe and scoped refresh type check
                    const refreshType = ['daily', 'weekly', 'monthly'].includes(maximizedTodo.refresh_type ?? '')
                      ? (maximizedTodo.refresh_type as 'daily' | 'weekly' | 'monthly')
                      : 'daily';

                    const grouped = groupByRefreshTypeDate(items, refreshType);

                    return Object.entries(grouped).map(([date, group]) => (
                      <div key={date}>
                        <div className="bg-gray-200 px-2 py-1 text-sm font-semibold rounded">{date}</div>
                        <ul className="mt-2 space-y-1">
                          {group.map((item: any) => (
                            <li key={item.tc_id} className="flex items-center gap-2">
                              <input type="checkbox" checked={item.checked} readOnly />
                              <span className={`text-sm ${item.checked ? 'line-through text-gray-600' : ''}`}>
                                {item.content}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ));
                  }

                  // ✅ Show only current day's/week's/month's items in checked/unchecked
                  const now = new Date();
                  const filteredItems = items.filter((item: any) => {
                    const itemDate = new Date(item.last_updated);

                    const isCurrent = (() => {
                      if (maximizedTodo.refresh_type === 'daily') {
                        return now.toDateString() === itemDate.toDateString();
                      } else if (maximizedTodo.refresh_type === 'weekly') {
                        const start = new Date(now);
                        start.setDate(now.getDate() - now.getDay());
                        const end = new Date(start);
                        end.setDate(start.getDate() + 6);
                        return itemDate >= start && itemDate <= end;
                      } else if (maximizedTodo.refresh_type === 'monthly') {
                        return now.getMonth() === itemDate.getMonth() && now.getFullYear() === itemDate.getFullYear();
                      }
                      return true;
                    })();

                    if (!isCurrent) return false;
                    if (currentView === 'unchecked') return !item.checked;
                    if (currentView === 'checked') return item.checked;
                    return true;
                  });

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
                            onChange={() => handleToggleCheck(maximizedTodo.todo_id, item.tc_id)}
                            className="accent-blue-600 w-4 h-4 rounded"
                          />
                          <span className="text-sm text-gray-800 truncate w-full">{item.content}</span>
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
            </div>

            {/* Footer Controls */}
            <div className="flex items-center justify-between p-4 border-t">
              <div className="flex gap-2">
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  {maximizedTodo.refresh_type}
                </span>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                  {todoViewMap[maximizedTodo.todo_id] || 'unchecked'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setNewTaskContentMap(prev => ({ ...prev, [maximizedTodo.todo_id]: '' }))}
                  className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleViewSwitch(maximizedTodo.todo_id, "left")}
                  className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleViewSwitch(maximizedTodo.todo_id, "right")}
                  className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}