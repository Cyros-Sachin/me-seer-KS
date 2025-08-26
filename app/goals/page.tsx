'use client';
import Cookies from 'js-cookie';
import MiniCalendar from '../components/ui/MiniCalendar';
import { getUserId, getUserToken } from "../utils/auth";
import { Calendar as CalendarIcon, Maximize2 } from 'lucide-react';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Dot, ChevronRight, Plus, X, Settings, List, Grid, Edit, Trash2, Clock, Tag, Check, ChevronDown, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import { resetEvents, resetGoals } from '../features/calendar/calendarSlice';
import {
    setSelectedDate,
    setViewMode,
    addEvent,
    updateEvent,
    deleteEvent,
    addGoal,
} from '../features/calendar/calendarSlice';
import {
    fetchGoalsAndTasks,
    createCalendarEvent,
    fetchActionsForTasks,
    fetchEvents
} from "../lib/api";
import { Calendar as ReactCalendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Action } from '@reduxjs/toolkit';
import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import toast from "react-hot-toast";

type ViewMode = 'day' | 'week' | 'month';
type EventCategory = 'exercise' | 'eating' | 'work' | 'relax' | 'family' | 'social';

interface Event {
    isaction_log?: boolean;
    id: string;
    title: string;
    start: string;
    end: string;
    goalId?: string;
    taskId?: string;
    color?: string;
    repeat?: 'none' | 'daily' | 'weekly' | 'monthly' | 'once' | 'log';
    allDay?: boolean;
    ua_id?: string;
    action_id?: number;
    action_log_id?: number;
}

interface TaskAction {
    a_id: number;
    at_id: number;
    ua_id: number;
    value1: string | null;
    value2: string | null;
    value3: string | null;
    value4: string | null;
    value5: string | null;
    value6: string | null;
    cat_qty_id1?: any;
    cat_qty_id2?: any;
    cat_qty_id3?: any[];
    cat_qty_id4?: any[];
    cat_qty_id5?: any[];
    cat_qty_id6?: any[];
    start?: string;
    end?: string;
}

export interface Task {
    id: string;
    title: string;
    goalId: string;
    collective_id: string;
    completed: boolean;
    color: string;
    todo_id?: number | null;
    actions?: TaskAction[];
}

interface Goal {
    id: string;
    title: string;
    color: string;
    tasks: Task[];
    effort: string;
    effort_unit: string;
}

interface TodoContent {
    tc_id: number;
    content: string;
    checked: boolean;
    urgent?: boolean;
    important?: boolean;
    version?: string;
    created_date?: string;
    last_updated?: string;
    refresh_type?: string;
}

interface Todo {
    todo_id: string;
    name: string;
    refresh_type?: string;
    contents?: TodoContent[];
}

interface DailyBreakdownItem {
    date: string;
    hour_spent: number;
}

interface MapStats {
    average: number;
    daily_breakdown: DailyBreakdownItem[];
    peak: number;
    total_hours: number;
    weekly_breakdown: any;
}

type CalendarEvent = {
    id: string;
    title: string;
    start: string;
    end: string;
    color: string;
    repeat?: string;
    allDay: boolean;
    goalId?: string | number;
    taskId?: string;
    ua_id?: string | number;
    action_id?: string | number;
    isaction_log?: boolean;
    action_log_id?: string | number;
};

const GoalsPage = () => {
    const router = useRouter();
    const dispatch = useDispatch();
    const {
        selectedDate: selectedDateStr,
        viewMode,
        events,
        goals,
    } = useSelector((state: RootState) => state.calendar);

    const selectedDate = useMemo(() => new Date(selectedDateStr), [selectedDateStr]);
    const goalsFromRedux = useSelector((state: RootState) => state.calendar.goals);

    // State declarations
    const [showEventModal, setShowEventModal] = useState(false);
    const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
    const [showEventOnlyModal, setShowEventOnlyModal] = useState(false);
    const [newEventData, setNewEventData] = useState<Event | null>(null);
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    const [timeSlotClicked, setTimeSlotClicked] = useState<{ time: Date; day: Date } | null>(null);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [allActions, setAllActions] = useState<Record<string, any[]>>({});
    const [sidebarDate, setSidebarDate] = useState<Date>(new Date());
    const [selectedTaskTodo, setSelectedTaskTodo] = useState<Todo | null>(null);
    const [newTaskContent, setNewTaskContent] = useState("");
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
    const [editingTaskContent, setEditingTaskContent] = useState("");
    const [todoView, setTodoView] = useState<'unchecked' | 'checked' | 'history'>('unchecked');
    const [expandedGoalIds, setExpandedGoalIds] = useState<string[]>([]);
    const [showMiniCalendar, setShowMiniCalendar] = useState(false);
    const [maximizedTodo, setMaximizedTodo] = useState<Todo | null>(null);
    const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
    const [goalProgress, setGoalProgress] = useState<Record<string, any>>({});
    const [taskProgressMap, setTaskProgressMap] = useState<Record<string, Record<string, any>>>({});
    const [currentMapStats, setCurrentMapStats] = useState<MapStats>({
        average: 0,
        daily_breakdown: [],
        peak: 0,
        total_hours: 0,
        weekly_breakdown: null,
    });
    const [currentViewName, setCurrentViewName] = useState<string>("All Goals");
    const [draggedAction, setDraggedAction] = useState<Event | null>(null);
    const [dropTarget, setDropTarget] = useState<{ day: Date; time: Date } | null>(null);
    const [showSavePopup, setShowSavePopup] = useState(false);
    const [draggingActionId, setDraggingActionId] = useState<string | null>(null);
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
    const [calendarApi, setCalendarApi] = useState<any>(null);

    const timeGridRef = useRef<HTMLDivElement>(null);
    const calendarButtonRef = useRef<HTMLButtonElement>(null);
    const calendarRef = useRef<any>(null);
    const [showGoalDialog, setShowGoalDialog] = useState(false);
    const [goalForm, setGoalForm] = useState({
        value2: '',     // Name
        value3: '',     // By date
        value4: '',     // Effort
        value5: '',     // Completed
        value6: '',     // optional
        cat_qty_id2: 23,
        cat_qty_id3: 47,
        cat_qty_id4: 54,
        cat_qty_id5: 2,
    });
    const [showTaskDialog, setShowTaskDialog] = useState(false);
    const [taskForm, setTaskForm] = useState({
        value3: '', // task name/title
    });
    // Helper functions
    const toLocalDateTimeInputValue = (dateStr: string): string => {
        const d = new Date(dateStr);
        const offset = d.getTimezoneOffset();
        const localDate = new Date(d.getTime() - offset * 60000);
        return localDate.toISOString().slice(0, 16);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const formatTimes = (input: string | Date): string => {
        const date = typeof input === "string"
            ? new Date(`1970-01-01T${input}:00`)
            : input;

        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const normalizeDailyBreakdown = (data: any) => {
        const map = new Map(
            (data.daily_breakdown || []).map((item: any) => [item.date, item.hour_spent])
        );

        const today = new Date();
        const past7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const formatted = d.toLocaleDateString('en-GB').split('/').join('-');
            past7Days.push({
                date: formatted,
                hour_spent: map.get(formatted) || 0
            });
        }

        return {
            ...data,
            daily_breakdown: past7Days
        };
    };

    const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    const isAfterOrSameDay = (target: Date, base: Date) =>
        target.setHours(0, 0, 0, 0) >= base.setHours(0, 0, 0, 0);

    const addMinutes = (date: Date, minutes: number): Date => {
        return new Date(date.getTime() + minutes * 60000);
    };

    const scrollToCurrentTime = () => {
        const container = timeGridRef.current;
        if (!container) return;

        const now = new Date();
        const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();

        const startMinutes = 5 * 60 + 30;
        const endMinutes = 20 * 60 + 30;
        const totalVisibleMinutes = endMinutes - startMinutes;

        const containerHeight = container.scrollHeight;
        const relativeMinutes = minutesSinceMidnight - startMinutes;

        const topOffset = (relativeMinutes / totalVisibleMinutes) * containerHeight;
        container.scrollTop = topOffset - container.clientHeight / 2;
    };

    // Data fetching functions
    const fetchTaskProgress = async (goalId: string) => {
        try {
            const res = await fetch(`https://meseer.com/dog/get-progress`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${getUserToken()}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    stats_type: "task_level",
                    goal_id: goalId
                })
            });
            const data = await res.json();
            setTaskProgressMap(prev => ({ ...prev, [goalId]: data || {} }));

            const response = await fetch('https://meseer.com/dog/get-timely-stats', {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${getUserToken()}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    flag: 2,
                    goal_id: goalId,
                    task_id: 0
                })
            });
            const stats = await response.json();
            setCurrentMapStats(normalizeDailyBreakdown(stats));
        } catch (err) {
            console.error(`Task progress fetch failed for goal ${goalId}:`, err);
        }
    };

    const fetchAllGoalsStats = async () => {
        try {
            const res = await fetch(`https://meseer.com/dog/get-timely-stats`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${getUserToken()}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    flag: 4,
                    goal_id: null,
                    task_id: null
                })
            });

            if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`);
            const stats = await res.json();
            setCurrentMapStats(normalizeDailyBreakdown(stats));
        } catch (err) {
            console.error("Failed to fetch all goals stats:", err);
        }
    };

    const handleTaskClick = async (taskId: string) => {
        const userId = getUserId();
        const token = getUserToken();
        setSelectedTaskId(taskId);

        const allTasks = goals.flatMap(g => g.tasks);
        const task = allTasks.find(t => t.id === taskId);

        if (!task || !task.todo_id) {
            setSelectedTaskTodo(null);
            return;
        }

        try {
            const todoRes = await fetch(`https://meseer.com/dog/todos/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!todoRes.ok) throw new Error(`Todo fetch failed: ${todoRes.status}`);
            const todoData = await todoRes.json();

            const matchedTodo = Array.isArray(todoData)
                ? todoData.find(item => item.todo_id?.toString() === task.todo_id?.toString())
                : null;

            if (!matchedTodo) {
                console.warn("Todo ID not found in response.");
                setSelectedTaskTodo({
                    todo_id: task.todo_id.toString(),
                    name: "Untitled",
                    contents: [],
                    refresh_type: "daily"
                });
                return;
            }

            const contentRes = await fetch(`https://meseer.com/dog/todo_content/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!contentRes.ok) throw new Error(`Content fetch failed: ${contentRes.status}`);
            const allContents = await contentRes.json();

            const filteredContents = Array.isArray(allContents)
                ? allContents.filter(content => content.todo_id?.toString() === task.todo_id?.toString())
                : [];

            const finalTodo: Todo = {
                todo_id: matchedTodo.todo_id.toString(),
                name: matchedTodo.name || "Untitled",
                contents: filteredContents,
                refresh_type: matchedTodo.refresh_type || "daily"
            };

            setSelectedTaskTodo(finalTodo);

            const response = await fetch('https://meseer.com/dog/get-timely-stats', {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${getUserToken()}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    flag: 1,
                    goal_id: 0,
                    task_id: taskId
                })
            });
            const stats = await response.json();
            setCurrentMapStats(normalizeDailyBreakdown(stats));
        } catch (err) {
            console.error("Error fetching todo or content:", err);
            setSelectedTaskTodo({
                todo_id: task.todo_id.toString(),
                name: "Untitled",
                contents: [],
                refresh_type: "daily"
            });
        }
    };

    const handleToggleCheck = async (tcId: number) => {
        setSelectedTaskTodo(prev => {
            if (!prev) return prev;

            const updatedContents = prev?.contents?.map(item => {
                if (item.tc_id === tcId) {
                    const updatedItem = { ...item, checked: !item.checked };
                    updateCheckStatus(updatedItem);
                    return updatedItem;
                }
                return item;
            });

            return { ...prev, contents: updatedContents };
        });

        setMaximizedTodo(prev => {
            if (!prev) return prev;

            const updatedContents = prev?.contents?.map(item => {
                if (item.tc_id === tcId) {
                    return { ...item, checked: !item.checked };
                }
                return item;
            });

            return { ...prev, contents: updatedContents };
        });
    };

    const updateCheckStatus = async (item: TodoContent) => {
        try {
            const token = getUserToken();
            await fetch(`https://meseer.com/dog/todo_content/${item.tc_id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
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

    const handleAddTask = async () => {
        const userId = getUserId();
        const token = getUserToken();
        const now = new Date().toISOString();

        try {
            const response = await fetch(`https://meseer.com/dog/todo_content`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    todo_id: maximizedTodo?.todo_id || selectedTaskTodo?.todo_id,
                    user_id: userId,
                    content: newTaskContent.trim(),
                    checked: false,
                    urgent: true,
                    important: false,
                    version: "v1",
                    created_date: now,
                    last_updated: now,
                    refresh_type: maximizedTodo?.refresh_type || selectedTaskTodo?.refresh_type || "daily",
                }),
            });

            if (response.ok) {
                const contentRes = await fetch(`https://meseer.com/dog/todo_content/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                const allContents = await contentRes.json();
                const refreshedContents = Array.isArray(allContents)
                    ? allContents.filter(content => (content.todo_id?.toString() === maximizedTodo?.todo_id?.toString()) || (content.todo_id?.toString() === selectedTaskTodo?.todo_id?.toString()))
                    : [];

                if (maximizedTodo?.todo_id) {
                    setMaximizedTodo(prev => ({
                        ...prev!,
                        contents: refreshedContents
                    }));
                }
                setSelectedTaskTodo(prev => ({
                    ...prev!,
                    contents: refreshedContents
                }));
                setNewTaskContent("");
            }
        } catch (err) {
            console.error("Failed to add task:", err);
        }
    };

    const handleDeleteTask = async (tcId: number) => {
        if (!selectedTaskTodo) return;

        try {
            const token = getUserToken();
            await fetch(`https://meseer.com/dog/todo_content/${tcId}`, {
                method: "DELETE",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            setSelectedTaskTodo(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    contents: (prev as any).contents.filter((item: any) => item.tc_id !== tcId)
                };
            });
        } catch (err) {
            console.error("Failed to delete task:", err);
        }
    };

    const handleDeleteContent = async (tc_id: number) => {
        if (!maximizedTodo) return;

        const token = getUserToken();
        try {
            const response = await fetch(`https://meseer.com/dog/todo_content/${tc_id}`, {
                method: "DELETE",
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setMaximizedTodo(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        contents: (prev.contents ?? []).map(item =>
                            item.tc_id === tc_id ? { ...item, checked: !item.checked } : item
                        ),
                    };
                });
            }
        } catch (err) {
            console.error("Failed to delete task:", err);
        }
    };

    const loadData = async () => {
        try {
            dispatch(resetGoals());
            const userId = getUserId();
            const token = getUserToken();

            const goals = await fetchGoalsAndTasks(userId, token);

            if (!Array.isArray(goals)) {
                console.error("❌ goals is not an array", goals);
                return;
            }

            const existingGoalIds = new Set(goalsFromRedux.map(g => g.id));
            const filteredGoals = goals.filter(g => !existingGoalIds.has(g.id));
            const allTaskIds = filteredGoals.flatMap(goal => goal.tasks.map(task => task.id));
            const actionsMap = await fetchActionsForTasks(allTaskIds, userId, token);
            setAllActions(actionsMap);

            filteredGoals.forEach(g => dispatch(addGoal(g)));

            for (const goal of filteredGoals) {
                for (const task of goal.tasks) {
                    const collectiveId = task.collective_id;

                    if (!collectiveId) continue;

                    try {
                        const eventsData = await fetchEvents(userId, collectiveId);
                        if (Array.isArray(eventsData)) {
                            const transformedEvents: Event[] = eventsData.map((item) => {
                                return {
                                    id: `event-${item.ua_id}`,
                                    title: item.value3 || "Untitled Event",
                                    start: item.value4,
                                    end: item.value4,
                                    ua_id: item.ua_id,
                                    goalId: goal.id,
                                    taskId: task.collective_id,
                                    color: task.color || '#3b82f6',
                                    repeat: 'none',
                                    allDay: true
                                };
                            });
                            transformedEvents.forEach(evt => dispatch(addEvent(evt)));
                        }
                    } catch (error) {
                        console.error(`❌ Failed to fetch events for collectiveId ${collectiveId}`, error);
                    }
                }
            }

        } catch (err) {
            console.error("🚨 Error in loadData:", err);
        }
    };

    const reload = async () => {
        try {
            dispatch(resetGoals());
            const userId = getUserId();
            const token = getUserToken();

            const goals = await fetchGoalsAndTasks(userId, token);
            if (!Array.isArray(goals)) {
                console.error("❌ goals is not an array", goals);
                return;
            }

            goals.forEach(goal => dispatch(addGoal(goal)));

            const allTaskIds = goals.flatMap(goal => goal.tasks.map(task => task.id));
            const actionsMap = await fetchActionsForTasks(allTaskIds, userId, token);
            setAllActions(actionsMap);

            for (const goal of goals) {
                for (const task of goal.tasks) {
                    const collectiveId = task.collective_id;
                    if (!collectiveId) continue;

                    try {
                        const eventsData = await fetchEvents(userId, collectiveId);

                        if (Array.isArray(eventsData)) {
                            dispatch(resetEvents());
                            const transformedEvents = eventsData.map((item) => {
                                const startDate = new Date(item.value4);
                                const endDate = new Date(startDate);

                                return {
                                    id: `event-${item.a_id}`,
                                    title: item.value3 || "Untitled Event",
                                    start: startDate.toISOString(),
                                    end: endDate.toISOString(),
                                    goalId: goal.id,
                                    taskId: task.id,
                                    ua_id: item.ua_id,
                                    color: task.color || '#3b82f6',
                                    repeat: 'none',
                                    allDay: true,
                                };
                            });
                            transformedEvents.forEach(evt => dispatch(addEvent(evt)));
                        }
                    } catch (error) {
                        console.error(`❌ Failed to fetch events for collectiveId ${collectiveId}`, error);
                    }
                }
            }
        } catch (err) {
            console.error("🚨 Error in loadData:", err);
        }
    };

    // Calendar navigation and view functions
    const getWeekDays = () => {
        const startOfWeek = new Date(selectedDate);
        startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            return date;
        });
    };

    const weekDays = getWeekDays();

    const navigateDate = (direction: 'prev' | 'next') => {
        const newDate = new Date(selectedDate);

        if (viewMode === 'day') {
            newDate.setDate(newDate.getDate() + (direction === 'prev' ? -1 : 1));
        } else if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + (direction === 'prev' ? -7 : 7));
        } else if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
        }

        // ✅ Update Redux
        dispatch(setSelectedDate(newDate.toISOString()));

        // ✅ Update FullCalendar view
        if (calendarRef.current) {
            const api = calendarRef.current.getApi();
            api.gotoDate(newDate); // ✅ Forces FullCalendar to move
        }
    };


    const handleViewModeChange = (mode: ViewMode) => {
        dispatch(setViewMode(mode));
    };

    // Event handling functions
    const repeatToAidMap: Record<string, number> = {
        daily: 30,
        weekly: 31,
        monthly: 32,
        once: 30,
        log: 30
    };

    const handleEventSave = async () => {
        if (!currentEvent) return;
        console.log(currentEvent);
        const { start, end, title, taskId, repeat, id } = currentEvent;
        const dayToCatIdMap: Record<
            "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday",
            number
        > = {
            Monday: 76,
            Tuesday: 77,
            Wednesday: 78,
            Thursday: 79,
            Friday: 80,
            Saturday: 81,
            Sunday: 82,
        };

        const aid = repeatToAidMap[repeat ?? "once"];
        const startDate = new Date(start);
        const endDate = new Date(end);
        const start_time = toLocalDateTimeInputValue(start).slice(11, 16);
        const start_day = startDate.toLocaleDateString("en-US", { weekday: "long" });
        const start_date = toLocalDateTimeInputValue(start).split("T")[0].split("-")[2];
        const diffInMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
        const duration = diffInMinutes % 60 === 0 ? diffInMinutes / 60 : Math.round(diffInMinutes);
        const duration_unit = diffInMinutes % 60 === 0 ? "hour" : "minutes";

        const event_time = new Date().toISOString().slice(0, 19);
        const isUpdate = id?.startsWith("event-") && id.length > 6;

        const payload: any = {
            a_id: aid,
            at_id: 302,
            flag: "PT",
            trigger: "action",
            is_active: "Y",
            user_id: getUserId(),
            event_time,
            description: isUpdate ? "update action" : "add action",
            cat_qty_id1: isUpdate ? Number(currentEvent.action_id) : Number(taskId),
            value1: "",
            value2: "",
            value3: title,
            value4: "",
            value5: "",
            value6: "",
            cat_qty_id2: repeat === "once" || repeat === "log" ? 129 : 128,
            cat_qty_id3: 23,
            cat_qty_id4: 0,
            cat_qty_id5: 0,
            cat_qty_id6: 0,
            by_datetime_value: "",
        };

        if (isUpdate || currentEvent.isaction_log) {
            payload.action = "UPDATE";
            payload.ua_id = Number(currentEvent.ua_id);
        }
        if (currentEvent.isaction_log) {
            payload.cat_qty_id1 = currentEvent.action_log_id;
        }

        // One-time
        if (aid === 30) {
            payload.cat_qty_id4 = 58;
            payload.value4 = toLocalDateTimeInputValue(start);
            payload.cat_qty_id5 = duration_unit === "hour" ? 57 : 56;
            payload.value5 = String(duration);
            payload.action_timestamp = event_time;
            payload.by_datetime_value = payload.value4;
        }

        // Weekly
        if (aid === 31) {
            const selectedDayCatId = dayToCatIdMap[start_day as keyof typeof dayToCatIdMap];
            const selectedTime = start_time;
            const dayNameMap: Record<number, number> = {
                76: 1, 77: 2, 78: 3, 79: 4, 80: 5, 81: 6, 82: 0,
            };
            const targetDayIndex = dayNameMap[selectedDayCatId];

            if (!isNaN(targetDayIndex) && selectedTime) {
                const now = new Date();
                const currentDay = now.getDay();
                const daysUntilTarget = (targetDayIndex + 7 - currentDay) % 7 || 7;
                const targetDate = new Date();
                targetDate.setDate(now.getDate() + daysUntilTarget);

                const [hourStr, minStr] = selectedTime.split(":");
                const hour = parseInt(hourStr, 10);
                const minute = parseInt(minStr, 10);

                if (!isNaN(hour) && !isNaN(minute)) {
                    targetDate.setHours(hour, minute, 0, 0);
                    payload.by_datetime_value = targetDate.toISOString().slice(0, 16);
                    payload.action_timestamp = event_time;
                    payload.cat_qty_id4 = selectedDayCatId;
                    payload.cat_qty_id5 = 59;
                    payload.value5 = start_time;
                    payload.cat_qty_id6 = duration_unit === "hour" ? 57 : 56;
                    payload.value6 = String(duration);
                }
            }
        }

        // Monthly
        if (aid === 32) {
            const selectedDay = Number(start_date);
            const selectedTime = start_time;

            if (selectedDay && selectedTime && /^\d{2}:\d{2}$/.test(selectedTime)) {
                const now = new Date();
                const targetDate = new Date(now.getFullYear(), now.getMonth(), selectedDay);
                const [hourStr, minuteStr] = selectedTime.split(":");
                const hour = parseInt(hourStr, 10);
                const minute = parseInt(minuteStr, 10);

                if (!isNaN(hour) && !isNaN(minute)) {
                    targetDate.setHours(hour, minute, 0, 0);
                    const yyyy = targetDate.getFullYear();
                    const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
                    const dd = String(targetDate.getDate()).padStart(2, "0");
                    const hh = String(targetDate.getHours()).padStart(2, "0");
                    const min = String(targetDate.getMinutes()).padStart(2, "0");

                    payload.by_datetime_value = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
                    payload.action_timestamp = event_time;
                    payload.cat_qty_id4 = 39;
                    payload.value4 = start_date;
                    payload.cat_qty_id5 = 59;
                    payload.value5 = start_time;
                    payload.cat_qty_id6 = duration_unit === "hour" ? 57 : 56;
                    payload.value6 = String(duration);
                }
            }
        }
        try {
            const endpoint = currentEvent?.isaction_log
                ? `https://meseer.com/dog/update_delete_actionlogs/${currentEvent.action_log_id}`
                : isUpdate
                    ? "https://meseer.com/dog/update-delete-data/primary-mwb"
                    : "https://meseer.com/dog/add-data/primary-mwb/";

            await fetch(endpoint, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${getUserToken()}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            console.log(payload);
            console.log(endpoint);
            setShowEventModal(false);
            await reload();
            setCurrentEvent(null);
        } catch (err) {
            console.error("Submission failed", err);
        }
    };

    const handleEventUpdateDrag = async (data: any) => {
        const token = getUserToken();

        const payload: any = {
            a_id: 33,
            at_id: 302,
            flag: "PT",
            trigger: "Event",
            is_active: "Y",
            user_id: getUserId(),
            event_time: new Date().toISOString().slice(0, 19),
            description: "Event",
            cat_qty_id1: Number(data.taskId),
            value1: "",
            value2: "",
            value3: data.title,
            value4: data.start,
            value5: "",
            value6: "",
            cat_qty_id2: 0,
            cat_qty_id3: 23,
            cat_qty_id4: 58,
            cat_qty_id5: 0,
            cat_qty_id6: 0,
            ua_id: data.ua_id,
            action: "UPDATE"
        };

        try {
            const endpoint = 'https://meseer.com/dog/update-delete-data/primary-mwb'
            await fetch(endpoint, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            await reload();
        } catch (err) {
            console.error(err);
        }
    };

    const handleEventDelete = async () => {
        try {
            const isActionLog = !!currentEvent?.action_log_id;

            const payload = {
                ua_id: currentEvent?.ua_id,
                a_id: repeatToAidMap[currentEvent?.repeat ?? "once"],
                at_id: 302,
                flag: "PT",
                action: "DELETE",
                cat_qty_id1: isActionLog ? currentEvent?.action_log_id : currentEvent?.action_id,
            };

            const endpoint = isActionLog
                ? `https://meseer.com/dog/update_delete_actionlogs/${currentEvent.action_log_id}`
                : `https://meseer.com/dog/update-delete-data/primary-mwb`;

            await fetch(endpoint, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            await reload();
            setShowEventModal(false);
            setCurrentEvent(null);
        } catch (err) {
            console.error("Failed to delete item", err);
        }
    };

    const parseToLiteral = (dateStr: string): Date => {
        if (!dateStr) return new Date(NaN);

        // Case 1: GMT-style string (e.g. "Fri, 22 Aug 2025 22:00:00 GMT")
        if (dateStr.includes("GMT")) {
            const parts = dateStr.replace(",", "").split(" ");
            // ["Fri", "22", "Aug", "2025", "22:00:00", "GMT"]

            if (parts.length >= 5) {
                const day = parseInt(parts[1], 10);
                const monthStr = parts[2];
                const year = parseInt(parts[3], 10);
                const [hour, minute, second] = parts[4].split(":").map(Number);

                const monthMap: Record<string, number> = {
                    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
                    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
                };

                const month = monthMap[monthStr] ?? 0;

                // 👇 Create a "literal" local Date (no timezone shift)
                return new Date(year, month, day, hour, minute, second || 0);
            }
        }

        // Case 2: ISO-like without timezone (e.g. "2025-08-22T17:00:00")
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(dateStr)) {
            const [datePart, timePart] = dateStr.split("T");
            const [year, month, day] = datePart.split("-").map(Number);
            const [hour, minute, second = "0"] = timePart.split(":");
            return new Date(year, month - 1, day, parseInt(hour), parseInt(minute), parseInt(second));
        }

        // Fallback
        return new Date(dateStr);
    };

    const generateActionEvents = (
        start: Date,
        end: Date,
        allActions: Record<string, any[]>,
        goals: Goal[]
    ) => {
        const events: any[] = [];
        const seen = new Set<string>();

        const durationUnitMap: Record<number, string> = { 57: "hours", 56: "minutes" };
        const dayWeekMap: Record<number, string> = {
            76: "Monday", 77: "Tuesday", 78: "Wednesday",
            79: "Thursday", 80: "Friday", 81: "Saturday", 82: "Sunday",
        };

        // ---- helpers ----
        const startOfLocalDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const sameLocalDay = (a: Date, b: Date) =>
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate();
        const onOrAfterLocalDay = (a: Date, b: Date) =>
            startOfLocalDay(a).getTime() >= startOfLocalDay(b).getTime();

        // 🔑 Parse backend timestamps safely (GMT → local literal)
        const parseActionDate = (v: string) => {
            if (!v) return new Date(NaN);

            // ISO without timezone → treat as local
            const isoLocalNoTZ =
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v) && !/[zZ]|GMT/.test(v);
            if (isoLocalNoTZ) {
                const [d, t] = v.split("T");
                const [Y, M, D] = d.split("-").map(Number);
                const [hh, mm, ss = "0"] = t.split(":");
                return new Date(Y, M - 1, D, Number(hh), Number(mm), Number(ss));
            }

            // RFC1123 like "Fri, 22 Aug 2025 22:00:00 GMT"
            const rfcMatch = v.match(
                /(\d{1,2}) (\w{3}) (\d{4}) (\d{2}):(\d{2}):(\d{2})/
            );
            if (rfcMatch) {
                const [, dd, mon, yyyy, hh, mm, ss] = rfcMatch;
                const monthNames = [
                    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                ];
                const month = monthNames.indexOf(mon);
                return new Date(
                    Number(yyyy),
                    month,
                    Number(dd),
                    Number(hh),
                    Number(mm),
                    Number(ss)
                );
            }

            // fallback
            return new Date(v);
        };

        // normalize loop bounds
        let current = startOfLocalDay(start);
        const endLocal = startOfLocalDay(end);
        const today = startOfLocalDay(new Date());

        while (current <= endLocal) {
            const weekdayName = current.toLocaleDateString("en-US", { weekday: "long" });

            for (const goal of goals) {
                for (const task of goal.tasks) {
                    const taskActions = allActions[task.id?.toString()] || [];

                    for (const action of taskActions) {
                        const parsed = parseActionDate(action.by_datetime_value);
                        if (isNaN(parsed.getTime())) continue;

                        const actionDayLocal = startOfLocalDay(parsed);
                        const isRepeating = action.repeat_status === "128";
                        const isActionLog = !!action.action_log_id;

                        let shouldRender = false;

                        if (isActionLog) {
                            if (action.validity_flag !== "valid") continue;

                            if (current < actionDayLocal) {
                                // future logs never shown
                                shouldRender = false;
                            } else if (sameLocalDay(current, actionDayLocal)) {
                                if (isRepeating) {
                                    // repeating log: skip if today
                                    shouldRender = !sameLocalDay(actionDayLocal, today);
                                } else {
                                    // non-repeating log: always show its original day
                                    shouldRender = true;
                                }
                            } else if (current < today) {
                                // past logs repeat until yesterday following pattern
                                if (isRepeating) {
                                    const dayWeekName = dayWeekMap[action.day_week];
                                    const isWeekly = !!dayWeekName;
                                    const dayMonth = Number(action.day_month);
                                    const isMonthly = !isWeekly && dayMonth >= 1 && dayMonth <= 31;
                                    const isDaily = !isWeekly && !isMonthly;

                                    if (
                                        isWeekly && dayWeekName === weekdayName && onOrAfterLocalDay(current, actionDayLocal)
                                    ) {
                                        shouldRender = true;
                                    } else if (
                                        isMonthly && current.getDate() === dayMonth && onOrAfterLocalDay(current, actionDayLocal)
                                    ) {
                                        shouldRender = true;
                                    } else if (isDaily && onOrAfterLocalDay(current, actionDayLocal)) {
                                        shouldRender = true;
                                    }
                                }
                            } else if (sameLocalDay(current, today)) {
                                // today only if log was created today
                                shouldRender = sameLocalDay(actionDayLocal, today);
                            }
                        } else if (isRepeating) {
                            // normal repeating templates (future allowed)
                            const dayWeekName = dayWeekMap[action.day_week];
                            const isWeekly = !!dayWeekName;
                            const dayMonth = Number(action.day_month);
                            const isMonthly = !isWeekly && dayMonth >= 1 && dayMonth <= 31;
                            const isDaily = !isWeekly && !isMonthly;

                            if (
                                isWeekly && dayWeekName === weekdayName && onOrAfterLocalDay(current, actionDayLocal)
                            ) {
                                shouldRender = true;
                            } else if (
                                isMonthly && current.getDate() === dayMonth && onOrAfterLocalDay(current, actionDayLocal)
                            ) {
                                shouldRender = true;
                            } else if (isDaily && onOrAfterLocalDay(current, actionDayLocal)) {
                                shouldRender = true;
                            }
                        } else {
                            // one-time non-repeating
                            shouldRender = sameLocalDay(current, actionDayLocal);
                        }

                        if (!shouldRender) continue;

                        // unique ID — logs need special uniqueness
                        const uniqueId = isActionLog
                            ? `log-${action.action_log_id}`
                            : `${action.ua_id ?? action.action_id}-${current.getFullYear()}-${current.getMonth() + 1}-${current.getDate()}`;

                        if (seen.has(uniqueId)) continue;
                        seen.add(uniqueId);

                        // duration
                        let duration = parseInt(action.duration_value || "30", 10);
                        const unit = durationUnitMap[action.duration_unit];
                        if (unit === "hours") duration *= 60;

                        // event start: current day + parsed time
                        const eventStart = new Date(
                            current.getFullYear(),
                            current.getMonth(),
                            current.getDate(),
                            parsed.getHours(),
                            parsed.getMinutes(),
                            parsed.getSeconds() || 0,
                            0
                        );
                        const eventEnd = new Date(eventStart);
                        eventEnd.setMinutes(eventStart.getMinutes() + duration);
                        events.push({
                            id: uniqueId,
                            title: action.name || "Untitled Action",
                            start: eventStart,
                            end: eventEnd,
                            allDay: false,
                            color: task.color || "#3b82f6",
                            extendedProps: {
                                type: "action",
                                goalId: goal.id,
                                taskId: task.id,
                                ua_id: action.ua_id,
                                action_id: action.action_id,
                                isaction_log: isActionLog,
                                action_log_id: action.action_log_id,
                                repeatType: isRepeating
                                    ? action.day_week
                                        ? "weekly"
                                        : action.day_month
                                            ? "monthly"
                                            : "daily"
                                    : isActionLog
                                        ? "log"
                                        : "once",
                                durationMinutes: duration,
                            },
                        });
                    }
                }
            }

            current.setDate(current.getDate() + 1);
        }

        return events;
    };

    const formatEventsForCalendar = () => {
        return events.map(event => {
            return {
                id: `event-${event.ua_id}`,
                title: event.title || "Untitled Event",
                start: event.start,  // FullCalendar all-day wants date-only string
                end: event.end, // exclusive end
                allDay: true,
                color: event.color || "#3b82f6",
                extendedProps: {
                    type: "event",
                    goalId: event.goalId,
                    taskId: event.taskId,
                    ua_id: event.ua_id,
                    startString: event.start,
                    endString: event.end
                }
            };
        });
    };


    const fetchEventsForVisibleRange = useCallback((start: Date, end: Date) => {
        const actionEvents = generateActionEvents(start, end, allActions, goals);
        return actionEvents;
    }, [allActions, goals]);

    const handleEventClick = (arg: any) => {
        const event = arg.event;
        const extendedProps = event.extendedProps;
        if (extendedProps.type === 'action') {
            setCurrentEvent({
                id: `event-${event.id}`,
                title: event.title,
                start: event.start.toISOString(),
                end: event.end.toISOString(),
                color: event.backgroundColor,
                goalId: extendedProps.goalId,
                taskId: extendedProps.taskId,
                ua_id: extendedProps.ua_id,
                action_id: extendedProps.action_id,
                isaction_log: extendedProps.isaction_log,
                action_log_id: extendedProps.action_log_id,
                repeat: extendedProps.repeatType === 'log' ? 'once' : (extendedProps.repeatType || 'once'),
                allDay: false
            });
            setShowEventModal(true);

        } else {
            setNewEventData({
                id: `event-${event.id}`,
                title: event.title,
                start: event.start,
                end: event.end,
                color: event.backgroundColor,
                goalId: extendedProps.goalId,
                taskId: extendedProps.taskId,
                ua_id: extendedProps.ua_id,
                allDay: true
            });
            setShowEventOnlyModal(true);
        }

    };

    const handleEventChange = async (arg: any) => {
        const event = arg.event;
        const extendedProps = event.extendedProps;
        if (event.allDay) {
            const data = {
                title: event.title,
                start: toLocalDateTimeInputValue(event.start),
                taskId: extendedProps.taskId,
                ua_id: extendedProps.ua_id,
            };
            await handleEventUpdateDrag(data);
        } else {
            const updatedEvent = {
                id: `event-${event.id}`,
                title: event.title,
                start: event.start,
                end: event.end,
                color: event.backgroundColor,
                goalId: extendedProps.goalId,
                taskId: extendedProps.taskId,
                ua_id: extendedProps.ua_id,
                action_id: extendedProps.action_id,
                isaction_log: extendedProps.isaction_log,
                action_log_id: extendedProps.action_log_id,
                repeat: extendedProps.repeatType || extendedProps.repeat || 'once',
                allDay: event.allDay
            };
            // console.log(updatedEvent);
            setCurrentEvent(updatedEvent);
            await handleEventSave();
        }
    };

    const handleDateClick = (arg: any) => {
        const clickedDate = arg.date;
        const selectedGoalObj = goals.find(g => g.id === selectedGoalId);
        const selectedTaskObj = selectedGoalObj?.tasks?.find(
            (t) => t.id === selectedTaskId
        );
        const startDate = new Date(clickedDate);
        const endDate = new Date(startDate);
        endDate.setHours(startDate.getHours() + 1);
        if (arg.allDay) {
            const payload = {
                id: ``,
                goalId: selectedGoalId || goals[0]?.id || '',
                taskId: selectedTaskId || selectedTaskObj?.collective_id || selectedGoalObj?.tasks?.[0]?.collective_id,
                title: "",
                start: arg.date.toISOString(),
                end: arg.date.toISOString(),
                allDay: true,
            };
            setNewEventData(payload);
            setShowEventOnlyModal(true);
        } else {

            setCurrentEvent({
                goalId: selectedGoalId || goals[0]?.id || '',
                taskId: selectedTaskId || selectedGoalObj?.id,
                id: '',
                title: '',
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                color: '#3b82f6',
                repeat: "once"
            });

            setShowEventModal(true);
        }
    };

    const renderEventContent = (eventInfo: any) => {
        const isHovered = hoveredTaskId === eventInfo.event.extendedProps.taskId;

        return (
            <div
                className={`fc-event-content transition-all duration-300 ${isHovered ? "animate-hoverPulse" : ""
                    }`}
            >
                <div className="fc-event-title">{eventInfo.event.title}</div>
                {!eventInfo.event.allDay && (
                    <div className="fc-event-time">{eventInfo.timeText}</div>
                )}
            </div>
        );
    };


    // Effects
    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const res = await fetch(`https://meseer.com/dog/get-progress`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${getUserToken()}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        stats_type: "goal_level",
                        goal_id: "0"
                    })
                });
                const data = await res.json();
                setCurrentViewName("All Goals");
                setGoalProgress(data || {});
            } catch (err) {
                console.error("Progress fetch failed:", err);
            }
        };
        fetchProgress();
    }, []);

    useEffect(() => {
        fetchAllGoalsStats();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isTyping = document.activeElement && (
                document.activeElement.tagName === 'INPUT' ||
                document.activeElement.tagName === 'TEXTAREA' ||
                (document.activeElement as HTMLElement).isContentEditable
            );

            if (isTyping) return;

            if (e.key === 'm' || e.key === 'M') {
                dispatch(setViewMode('month'));
            } else if (e.key === 'w' || e.key === 'W') {
                dispatch(setViewMode('week'));
            } else if (e.key === 'd' || e.key === 'D') {
                dispatch(setViewMode('day'));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [dispatch]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (!showEventModal || !goals.length) return;

        setCurrentEvent(prev => {
            if (!prev) return prev;

            const fallbackGoalId = prev.goalId || goals[0]?.id;
            const goal = goals.find(g => g.id === fallbackGoalId);
            const fallbackTaskId = prev.taskId || goal?.tasks?.[0]?.id || "";

            return {
                ...prev,
                goalId: fallbackGoalId,
                taskId: fallbackTaskId,
            } as Event;
        });
    }, [showEventModal, goals]);

    useEffect(() => {
        if (viewMode === 'day' || viewMode === 'week') {
            setTimeout(() => {
                scrollToCurrentTime();
            }, 100);
        }
    }, [viewMode, selectedDate]);

    useEffect(() => {
        scrollToCurrentTime();
    }, []);

    useEffect(() => {
        if (calendarRef.current) {
            const api = calendarRef.current.getApi();
            let newView;
            switch (viewMode) {
                case 'day': newView = 'timeGridDay'; break;
                case 'week': newView = 'timeGridWeek'; break;
                case 'month': newView = 'dayGridMonth'; break;
                default: newView = 'timeGridWeek';
            }
            api.changeView(newView);
            api.gotoDate(selectedDate);
        }
    }, [viewMode, selectedDate]);


    useEffect(() => {
        if (typeof document !== 'undefined') {
            const draggableEl = document.getElementById('draggable-tasks');
            if (draggableEl) {
                new Draggable(draggableEl, {
                    itemSelector: '.fc-draggable-task',
                    eventData: function (eventEl: any) {
                        const taskId = eventEl.getAttribute('data-task-id');
                        const task = goals.flatMap(g => g.tasks).find(t => t.id === taskId);

                        return {
                            title: task?.title || 'Unknown Task',
                            duration: '01:00',
                            extendedProps: {
                                type: 'task',
                                taskId: taskId,
                                color: task?.color || '#3b82f6'
                            }
                        };
                    }
                });
            }
        }
    }, [goals]);

    // Generate time slots from 5:30 AM to 8:30 PM
    const timeSlots = Array.from({ length: 24 }, (_, i) => {
        const date = new Date(selectedDate);
        date.setHours(i, 0, 0, 0);
        return date;
    });

    const handleSubmitGoal = async () => {
        try {
            const userId = getUserId();
            const now = new Date().toISOString().slice(0, 19);

            const payload = {
                user_id: userId,
                flag: "P",
                at_id: 301,
                a_id: 24,
                cat_qty_id1: 0,
                cat_qty_id2: goalForm.cat_qty_id2,
                cat_qty_id3: goalForm.cat_qty_id3,
                cat_qty_id4: goalForm.cat_qty_id4,
                cat_qty_id5: goalForm.cat_qty_id5,
                cat_qty_id6: 0,
                value1: "",
                value2: goalForm.value2,
                value3: goalForm.value3,
                value4: goalForm.value4,
                value5: goalForm.value5,
                value6: "",
                cat_qty_undefined: 0,
                valueundefined: "",
                trigger: "goal",
                is_active: true,
                description: `Goal is added at ${now}`,
                event_time: now
            };
            // console.log(payload);
            const res = await fetch('https://meseer.com/dog/add-data/primary-mwb/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getUserToken()}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to create goal");

            setShowGoalDialog(false);
            await reload();
        } catch (err) {
            console.error("Goal creation failed", err);
            alert("Error creating goal");
        }
    };

    const handleSubmitTask = async () => {
        try {
            const userId = getUserId();
            const now = new Date().toISOString().slice(0, 19);

            const payload = {
                user_id: userId,
                flag: "PP",
                at_id: 301,
                a_id: 27,
                cat_qty_id1: 0,
                cat_qty_id2: selectedGoalId,
                cat_qty_id3: 23,
                cat_qty_id4: 0,
                cat_qty_id5: 0,
                cat_qty_id6: 0,
                value1: "0",
                value2: "",
                value3: taskForm.value3,
                value4: "",
                value5: "",
                value6: "",
                cat_qty_undefined: 0,
                valueundefined: "",
                trigger: "task",
                is_active: "Y",
                description: `Task is added at ${now}`,
                event_time: now
            };
            console.log(payload);
            // const res = await fetch('https://meseer.com/dog/add-data/primary-mwb/', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'Authorization': `Bearer ${getUserToken()}`
            //     },
            //     body: JSON.stringify(payload),
            // });

            // if (!res.ok) throw new Error("Failed to create task");
            // 
            // setSelectedGoalId('');
            // setShowTaskDialog(false);
            // await reload();
        } catch (err) {
            console.error("Task creation failed", err);
            alert("Error creating task");
        }
    };
    
    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-64 border-r bg-white p-4 overflow-y-auto custom-scrollbar">
                <div className="flex justify items-center mb-6">
                    <ChevronLeft className='mr-3 text-black' onClick={() => router.push('/main')} />
                    <h2 className="text-xl font-bold text-gray-800">Goals</h2>
                </div>
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">My Goals</h2>
                        <button
                            onClick={() => {
                                setShowGoalDialog(true);
                            }}
                            className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Create Goal
                        </button>
                    </div>
                    <div className="space-y-1">
                        {goals.map(goal => {
                            const isExpanded = expandedGoalIds.includes(goal.id);
                            const progressData = goalProgress[goal.id] || {};
                            const timeSpent = progressData.time_spent ?? 0;
                            const timeAllotted = progressData.time_allotted ?? goal.effort ?? 0;
                            const progressPercent = progressData.progress ?? 0;
                            const goalUnit = progressData.goal_unit ?? goal.effort_unit ?? 0;

                            return (
                                <div key={goal.id} className="mb-3">
                                    {/* Goal Header */}
                                    <div
                                        className="flex items-center justify-between px-2 py-2 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => {
                                            setExpandedGoalIds(prev =>
                                                prev.includes(goal.id)
                                                    ? prev.filter(id => id !== goal.id)
                                                    : [...prev, goal.id]
                                            );
                                            setCurrentViewName(goal.title);
                                            fetchTaskProgress(goal.id);
                                            setSelectedGoalId(goal.id);
                                        }
                                        }
                                    >
                                        <div>
                                            <span className="truncate font-medium text-gray-800">{goal.title}</span>
                                            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                                <span>{timeSpent}h / {timeAllotted}h</span>
                                                <span>•</span>
                                                <span>{progressPercent}%</span>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800`}>
                                                    {goalUnit}
                                                </span>
                                            </div>
                                        </div>
                                        <motion.div
                                            animate={{ rotate: isExpanded ? 180 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <ChevronDown className="w-4 h-4 text-gray-500" />
                                        </motion.div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full bg-gray-200 h-2 rounded mt-1">
                                        <div
                                            className="bg-blue-500 h-2 rounded transition-all duration-300"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>

                                    {/* Tasks */}
                                    <AnimatePresence initial={false}>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                                className="overflow-hidden"
                                            >
                                                <div className="ml-4 mt-1 space-y-1 border-l border-gray-300 pl-3">
                                                    {goal.tasks.map(task => {
                                                        const taskStats = taskProgressMap[goal.id]?.[task.id] || {};
                                                        const timeSpent = taskStats.time_spent ?? 0;
                                                        const timeAllotted = taskStats.time_allotted ?? task.effort ?? 0;
                                                        const progressPercent = taskStats.progress ?? 0;
                                                        const taskUnit = taskStats.task_unit ?? task.effort_unit ?? 0;

                                                        let priorityLabel = "Low";
                                                        let priorityColor = "bg-green-100 text-green-800";
                                                        if (timeAllotted < 3) {
                                                            priorityLabel = "High";
                                                            priorityColor = "bg-red-100 text-red-800";
                                                        } else if (timeAllotted < 6) {
                                                            priorityLabel = "Medium";
                                                            priorityColor = "bg-yellow-100 text-yellow-800";
                                                        }

                                                        return (
                                                            <div
                                                                key={task.id}
                                                                className={`text-sm text-gray-700 py-1 flex items-center gap-2 ${selectedTaskId === task.id ? 'bg-gray-100 font-medium rounded' : ''
                                                                    }`}
                                                                draggable
                                                                onClick={() => {
                                                                    setCurrentViewName(task.title);
                                                                    handleTaskClick(task.id);
                                                                }}
                                                                onMouseEnter={() => {
                                                                    setHoveredTaskId(task.id);
                                                                }}
                                                                onMouseLeave={() => {
                                                                    setHoveredTaskId(null);
                                                                }}
                                                            >
                                                                <div>
                                                                    <div className="text-sm font-medium text-gray-800">{task.title}</div>
                                                                    <div className="text-xs text-gray-500 flex items-center gap-2">
                                                                        <span>{timeSpent}h / {timeAllotted}h</span>
                                                                        <span>•</span>
                                                                        <span>{progressPercent}%</span>
                                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800`}>
                                                                            {taskUnit}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityColor}`}>
                                                                    {priorityLabel}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                    <button
                                                        onClick={() => {
                                                            console.log("Add Task clicked for goal:", goal.id);
                                                            setShowTaskDialog(true);
                                                        }}
                                                        className="flex items-center text-sm text-blue-600 hover:underline mt-2"
                                                    >
                                                        <Plus className="w-4 h-4 mr-1" />
                                                        Add Task
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}

                    </div>
                </div>
                {/* Selected Task Todo Section */}
                {selectedTaskTodo && (
                    <div className="mt-4">
                        {/* Header */}
                        <h2 className="text-base font-semibold text-gray-900">To-do List</h2>
                        <p className="text-xs text-gray-500 mt-0.5">{selectedTaskTodo.name}</p>

                        {/* Todo Container */}
                        <div className="bg-white rounded-md border border-gray-200 mt-2 overflow-hidden">
                            {/* Task List */}
                            <div className="max-h-56 overflow-y-auto px-2 py-1.5 space-y-2">
                                {(() => {
                                    const items = selectedTaskTodo?.contents || [];
                                    const filteredItems =
                                        todoView === 'history'
                                            ? items
                                            : items.filter((item) =>
                                                todoView === 'unchecked' ? !item.checked : item.checked
                                            );

                                    if (todoView === 'history') {
                                        const grouped = items.reduce((acc: Record<string, TodoContent[]>, item: TodoContent) => {
                                            const dateObj = new Date(item.last_updated || '');
                                            let groupKey = '';

                                            if (selectedTaskTodo.refresh_type === 'monthly') {
                                                groupKey = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
                                            }
                                            else if (selectedTaskTodo.refresh_type === 'weekly') {
                                                const startOfYear = new Date(dateObj.getFullYear(), 0, 1);
                                                const days = Math.floor((dateObj.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
                                                const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);

                                                groupKey = `Week ${weekNum}, ${dateObj.getFullYear()}`;
                                            }
                                            else {
                                                groupKey = dateObj.toLocaleDateString();
                                            }

                                            if (!acc[groupKey]) acc[groupKey] = [];
                                            acc[groupKey].push(item);

                                            return acc;
                                        }, {});

                                        return Object.entries(grouped).map(([date, tasks]) => (
                                            <div key={date} className="mb-2">
                                                <div className="text-[10px] text-gray-500 font-medium mb-0.5">{date}</div>
                                                {tasks.map((task) => (
                                                    <label
                                                        key={task.tc_id}
                                                        className="group flex items-center justify-between py-0.5 cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <input
                                                                type="checkbox"
                                                                checked={task.checked}
                                                                onChange={() => handleToggleCheck(task.tc_id)}
                                                                className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <span
                                                                className={`${task.checked ? 'line-through text-gray-400' : 'text-gray-700'} text-xs`}
                                                            >
                                                                {task.content}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteTask(task.tc_id)}
                                                            className="text-gray-400 hover:text-red-500 text-[10px] opacity-0 group-hover:opacity-100 transition"
                                                        >
                                                            ×
                                                        </button>
                                                    </label>
                                                ))}
                                            </div>
                                        ));
                                    } else {
                                        return filteredItems.map((item) => (
                                            <div
                                                key={item.tc_id}
                                                className="group flex items-center justify-between py-0.5"
                                            >
                                                <label className="flex items-center gap-1.5 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.checked}
                                                        onChange={() => handleToggleCheck(item.tc_id)}
                                                        className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    {editingTaskId === item.tc_id ? (
                                                        <input
                                                            type="text"
                                                            value={editingTaskContent}
                                                            onChange={(e) => setEditingTaskContent(e.target.value)}
                                                            onBlur={() => {
                                                                if (editingTaskContent.trim() && editingTaskContent !== item.content) {
                                                                    updateCheckStatus({ ...item, content: editingTaskContent });
                                                                }
                                                                setEditingTaskId(null);
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    if (editingTaskContent.trim() && editingTaskContent !== item.content) {
                                                                        updateCheckStatus({ ...item, content: editingTaskContent });
                                                                    }
                                                                    setEditingTaskId(null);
                                                                } else if (e.key === 'Escape') {
                                                                    setEditingTaskId(null);
                                                                }
                                                            }}
                                                            className="text-xs border-b border-gray-300 focus:outline-none w-full"
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span
                                                            className={`${item.checked ? 'line-through text-gray-400' : 'text-gray-700'} text-xs`}
                                                            onClick={() => {
                                                                setEditingTaskId(item.tc_id);
                                                                setEditingTaskContent(item.content);
                                                            }}
                                                        >
                                                            {item.content}
                                                        </span>
                                                    )}
                                                </label>
                                                <button
                                                    onClick={() => handleDeleteTask(item.tc_id)}
                                                    className="text-gray-400 hover:text-red-500 text-[10px] opacity-0 group-hover:opacity-100 transition"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ));
                                    }
                                })()}

                                {/* Add task */}
                                <div className="flex gap-1 mt-1">
                                    <input
                                        type="text"
                                        value={newTaskContent || ''}
                                        onChange={(e) => setNewTaskContent(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleAddTask();
                                        }}
                                        placeholder="Add Task"
                                        className="w-40 text-black text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={handleAddTask}
                                        className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                    >
                                        Add
                                    </button>
                                </div>

                            </div>

                            {/* Footer */}
                            <div className="px-2 py-1 bg-gray-50 border-t text-[10px] text-gray-500 flex justify-between items-center">
                                <div className="flex gap-1 items-center">
                                    <button className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">
                                        {selectedTaskTodo.refresh_type}
                                    </button>
                                </div>
                                <div className="flex gap-0.5 text-black">
                                    <button
                                        onClick={() =>
                                            setTodoView((prev) =>
                                                prev === 'unchecked'
                                                    ? 'checked'
                                                    : prev === 'checked'
                                                        ? 'history'
                                                        : 'unchecked'
                                            )
                                        }
                                        className="p-0.5 hover:text-blue-600"
                                        title="Previous view"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <span>
                                        {todoView === 'unchecked'
                                            ? 'Pending Tasks'
                                            : todoView === 'checked'
                                                ? 'Completed Tasks'
                                                : 'Task History'}
                                    </span>
                                    <button
                                        onClick={() =>
                                            setTodoView((prev) =>
                                                prev === 'unchecked'
                                                    ? 'checked'
                                                    : prev === 'checked'
                                                        ? 'history'
                                                        : 'unchecked'
                                            )
                                        }
                                        className="p-0.5 hover:text-blue-600"
                                        title="Next view"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                                <button onClick={() => setMaximizedTodo(selectedTaskTodo)}>
                                    <Maximize2 className='h-4 w-4 text-gray-700' />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden custom-scrollbar">
                {/* Calendar Header */}
                <div className="border-b bg-white p-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-xl font-bold text-gray-800">Planner</h1>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => navigateDate('prev')}
                                    className="p-1 rounded-full hover:bg-gray-100 text-black"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={() => dispatch(setSelectedDate(new Date().toISOString()))}
                                    className="px-3 py-1 text-sm text-black font-medium rounded-md bg-blue-50 hover:bg-blue-100"
                                >
                                    Today
                                </button>
                                <button
                                    onClick={() => navigateDate('next')}
                                    className="p-1 rounded-full hover:bg-gray-100 text-black"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>

                            <span className="text-lg font-semibold text-black">
                                {viewMode === 'day' && formatDate(selectedDate)}
                                {viewMode === 'week' && `
                  ${formatDate(weekDays[0])} - 
                  ${formatDate(weekDays[6])}
                `}
                                {viewMode === 'month' && new Date(selectedDate).toLocaleDateString([], {
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="relative">
                                <button
                                    ref={calendarButtonRef}
                                    onClick={() => setShowMiniCalendar(prev => !prev)}
                                    className="p-2 rounded-md hover:bg-gray-100 text-black"
                                    title="Open calendar"
                                >
                                    <CalendarIcon size={18} />
                                </button>

                                {showMiniCalendar && (
                                    <div className="absolute top-10 right-0 z-50">
                                        <MiniCalendar
                                            selectedDate={selectedDate}
                                            onChange={(date) => {
                                                dispatch(setSelectedDate(date.toISOString()));
                                                setShowMiniCalendar(false);
                                            }}
                                        />
                                    </div>
                                )}

                            </div>

                            <button
                                onClick={() => handleViewModeChange('day')}
                                className={`px-3 py-1 text-sm text-black rounded-md ${viewMode === 'day' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                            >
                                Day
                            </button>
                            <button
                                onClick={() => handleViewModeChange('week')}
                                className={`px-3 py-1 text-sm text-black rounded-md ${viewMode === 'week' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                            >
                                Week
                            </button>
                            <button
                                onClick={() => handleViewModeChange('month')}
                                className={`px-3 py-1 text-sm text-black rounded-md ${viewMode === 'month' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                            >
                                Month
                            </button>
                        </div>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 overflow-hidden">
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                        initialView={viewMode === 'day' ? 'timeGridDay' : viewMode === 'week' ? 'timeGridWeek' : 'dayGridMonth'}
                        initialDate={selectedDate}
                        headerToolbar={false}
                        events={(fetchInfo, successCallback) => {
                            const regularEvents = formatEventsForCalendar();
                            const actionEvents = fetchEventsForVisibleRange(fetchInfo.start, fetchInfo.end);

                            const seen = new Set();
                            const uniqueEvents = [...regularEvents, ...actionEvents].filter(evt => {
                                if (seen.has(evt.id)) return false;
                                seen.add(evt.id);
                                return true;
                            });
                            successCallback(uniqueEvents);
                        }}
                        nowIndicator={true}
                        editable={true}
                        droppable={true}
                        selectable={true}
                        selectMirror={true}
                        height="100%"
                        expandRows={false}
                        scrollTime="06:00:00"
                        slotMinTime="00:00:00"
                        slotMaxTime="23:59:00"
                        dayMaxEvents={3}
                        eventDisplay="block"
                        eventTimeFormat={{
                            hour: "numeric",
                            minute: "2-digit",
                            meridiem: "short",
                        }}
                        weekends={true}
                        eventClick={handleEventClick}
                        dateClick={handleDateClick}
                        eventDrop={handleEventChange}
                        eventResize={handleEventChange}
                        allDaySlot={true}
                        eventContent={renderEventContent}
                        datesSet={(arg) => {
                            if (arg.view.type === 'dayGridMonth') {
                                dispatch(setViewMode('month'));
                            } else if (arg.view.type === 'timeGridWeek') {
                                dispatch(setViewMode('week'));
                            } else if (arg.view.type === 'timeGridDay') {
                                dispatch(setViewMode('day'));
                            }

                            dispatch(setSelectedDate(arg.view.currentStart.toISOString()));
                        }}
                        eventDidMount={(arg) => {
                            const taskId = arg.event.extendedProps.taskId;
                            if (hoveredTaskId === taskId) {
                                arg.el.classList.add("animate-hoverPulse");
                            } else {
                                arg.el.classList.remove("animate-hoverPulse");
                            }
                        }}
                    />
                </div>
            </div>
            {/* Right Content */}
            <div className="w-80 border-l bg-white p-6 overflow-y-auto space-y-8 shadow-inner custom-scrollbar">
                {/* Header */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Progress Analytics</h2>
                    <p className="text-sm text-gray-500 mt-1">Viewing: <span className="font-medium">{currentViewName}</span></p>
                </div>

                <div className="w-full h-40 flex items-end justify-between bg-white rounded-xl px-4 py-4 border shadow-sm">
                    {currentMapStats.daily_breakdown.map((day, i) => (
                        <div key={i} className="flex flex-col items-center group relative">
                            {/* Hover Value */}
                            <div className="absolute -top-6 text-xs text-gray-700 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                {day.hour_spent}h
                            </div>

                            {/* Bar */}
                            <div
                                className="w-6 rounded-t-xl bg-gradient-to-t from-blue-500 to-blue-400 shadow-md group-hover:scale-105 transition-transform duration-200"
                                style={{
                                    height: `${day.hour_spent * 15}px`,
                                    minHeight: "4px"
                                }}
                            />

                            {/* Date Label */}
                            <span className="text-[9px] text-gray-500 mt-2 font-medium">
                                {day.date?.slice(0, 5)}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm text-gray-700">
                    <div>
                        <p className="font-semibold text-xl">{currentMapStats?.total_hours || 0}</p>
                        <p className="text-md text-gray-500">Total</p>
                    </div>
                    <div>
                        <p className="font-semibold text-xl">{currentMapStats?.average || 0}</p>
                        <p className="text-md text-gray-500">Average</p>
                    </div>
                    <div>
                        <p className="font-semibold text-xl">{currentMapStats?.peak || 0}</p>
                        <p className="text-md text-gray-500">Peak</p>
                    </div>
                </div>
                <div className='inline-flex gap-20'>
                    <p className="text-md text-gray-500">Avg. Effort</p>
                    <p className="font-semibold text-xl text-black">{currentMapStats?.average || 0}</p>
                </div>

                {/* Upcoming Actions Section */}
                <div className="bg-white rounded-lg shadow p-4 h-full overflow-y-auto">
                    <h2 className="text-lg font-semibold mb-3 text-black">Upcoming Actions</h2>

                    {allActions && Object.keys(allActions).length > 0 ? (
                        <div className="space-y-6">
                            {Object.entries(allActions).map(([goalId, actions]: [string, any[]]) => {
                                const upcoming = actions.filter(
                                    (a) => !a.validity_flag || a.validity_flag === "valid"
                                );

                                if (upcoming.length === 0) return null;

                                return (
                                    <div key={goalId}>

                                        <div className="space-y-3">
                                            {upcoming.map((action, idx) => {
                                                const dateStr = action.by_datetime_value
                                                    ? new Date(action.by_datetime_value).toLocaleString()
                                                    : new Date(action.action_timestamp).toLocaleString();

                                                return (
                                                    <div
                                                        key={idx}
                                                        className="border rounded-lg p-3 flex justify-between items-center"
                                                    >
                                                        <div>
                                                            <div className="font-medium text-gray-900">{action.name}</div>
                                                            <div className="text-xs text-gray-500">{dateStr}</div>
                                                            <div className="text-xs text-gray-400">
                                                                {action.duration_value} hour
                                                            </div>
                                                        </div>
                                                        <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-green-100 text-green-800">
                                                            Upcoming
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No upcoming actions</p>
                    )}
                </div>
            </div>

            {/* Event Modal */}
            <AnimatePresence>
                {showEventModal && currentEvent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50"
                        onClick={() => setShowEventModal(false)}
                    >
                        <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 30, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-5 border-b border-gray-200">
                                <h3 className="text-xl font-semibold text-gray-800">
                                    {currentEvent.id ? 'Edit Action' : 'Create Action'}
                                </h3>
                            </div>

                            <div className="p-5 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Goal</label>
                                    <select
                                        value={currentEvent.goalId}
                                        onChange={(e) => {
                                            const newGoalId = e.target.value;
                                            const newTaskId = goals.find(g => g.id === newGoalId)?.tasks?.[0]?.id || "";

                                            setCurrentEvent(prev => {
                                                if (!prev) return prev;
                                                return {
                                                    ...prev,
                                                    goalId: newGoalId,
                                                    taskId: newTaskId,
                                                } as Event;
                                            });
                                        }}
                                        className="w-full border rounded-lg px-4 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        {goals.map(goal => (
                                            <option key={goal.id} value={goal.id}>
                                                {goal.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Task</label>
                                    <select
                                        value={currentEvent.taskId}
                                        onChange={(e) => {
                                            const newTaskId = e.target.value;
                                            setCurrentEvent(prev => {
                                                if (!prev) return prev;
                                                return {
                                                    ...prev,
                                                    taskId: newTaskId,
                                                } as Event;
                                            });
                                        }}
                                        className="w-full border rounded-lg px-4 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        {(goals.find(g => g.id === currentEvent.goalId)?.tasks || []).map(task => (
                                            <option key={task.collective_id} value={task.id}>
                                                {task.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={currentEvent.title}
                                        onChange={(e) =>
                                            setCurrentEvent({ ...currentEvent, title: e.target.value })
                                        }
                                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800"
                                        placeholder="Event title"
                                        autoFocus
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Start Time</label>
                                        <input
                                            type="datetime-local"
                                            value={toLocalDateTimeInputValue(currentEvent.start)}
                                            onChange={(e) =>
                                                setCurrentEvent({ ...currentEvent, start: new Date(e.target.value).toISOString() })
                                            }
                                            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">End Time</label>
                                        <input
                                            type="datetime-local"
                                            value={toLocalDateTimeInputValue(currentEvent.end)}
                                            onChange={(e) =>
                                                setCurrentEvent({ ...currentEvent, end: new Date(e.target.value).toISOString() })
                                            }
                                            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Repeat</label>
                                    <select
                                        value={currentEvent.repeat ?? 'once'}
                                        onChange={(e) => {
                                            const newRepeat = e.target.value as Event['repeat'];
                                            setCurrentEvent(prev => {
                                                if (!prev) return prev;
                                                return {
                                                    ...prev,
                                                    repeat: newRepeat,
                                                } as Event;
                                            });
                                        }}
                                        className="w-full border rounded-lg px-4 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="once">Just once</option>
                                    </select>
                                </div>


                            </div>

                            <div className="flex justify-between items-center border-t border-gray-200 p-4">
                                {currentEvent.id && (
                                    <button
                                        onClick={handleEventDelete}
                                        className="text-sm text-red-600 hover:underline"
                                    >
                                        Delete
                                    </button>
                                )}
                                <div className="flex gap-2 ml-auto">
                                    <button
                                        onClick={() => setShowEventModal(false)}
                                        className="px-4 py-2 text-sm rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleEventSave}
                                        className="px-4 py-2 text-sm rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        {currentEvent.id ? "Update" : "Save"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showEventOnlyModal && newEventData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50"
                        onClick={() => setShowEventOnlyModal(false)}
                    >
                        <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 30, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-5 border-b border-gray-200">
                                <h3 className="text-xl font-semibold text-gray-800">
                                    {newEventData?.id ? "Edit Event" : "Create Event"}
                                </h3>

                            </div>

                            <div className="p-5 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Goal</label>
                                    <select
                                        value={newEventData.goalId}
                                        onChange={(e) => {
                                            const newGoalId = e.target.value;
                                            const newTaskId = goals.find(g => g.id === newGoalId)?.tasks?.[0]?.id || '';
                                            setNewEventData(prev => ({ ...prev!, goalId: newGoalId, taskId: newTaskId }));
                                        }}
                                        className="w-full border rounded-lg px-4 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        {goals.map(goal => (
                                            <option key={goal.id} value={goal.id}>
                                                {goal.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Task</label>
                                    <select
                                        value={newEventData.taskId}
                                        onChange={(e) =>
                                            setNewEventData(prev => ({ ...prev!, taskId: e.target.value }))
                                        }
                                        className="w-full border rounded-lg px-4 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        {(goals.find(g => g.id === newEventData.goalId)?.tasks || []).map(task => (
                                            <option key={task.id} value={task.id}>
                                                {task.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={newEventData.title}
                                        onChange={(e) =>
                                            setNewEventData(prev => ({ ...prev!, title: e.target.value }))
                                        }
                                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800"
                                        placeholder="Event title"
                                        autoFocus
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Event Day-Time</label>
                                        <input
                                            type="datetime-local"
                                            value={toLocalDateTimeInputValue(newEventData.start)}
                                            onChange={(e) =>
                                                setNewEventData(prev => ({ ...prev!, start: e.target.value }))
                                            }
                                            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end items-center border-t border-gray-200 p-4 gap-2">
                                {newEventData.id && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                const payload = {
                                                    ua_id: newEventData?.ua_id,
                                                    a_id: 33,
                                                    at_id: 302,
                                                    flag: "PT",
                                                    action: "DELETE",
                                                    cat_qty_id1: newEventData.taskId
                                                };
                                                await fetch(`https://meseer.com/dog/update-delete-data/primary-mwb`, {
                                                    method: "POST",
                                                    headers: {
                                                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                                                        "Content-Type": "application/json",
                                                    },
                                                    body: JSON.stringify(payload),
                                                });
                                                setShowEventOnlyModal(false);
                                                setNewEventData(null);
                                                await reload();
                                            } catch (err) {
                                                console.error("Failed to delete item", err);
                                            }
                                        }}
                                        className="px-4 py-2 text-sm rounded-lg  bg-gray-100 hover:bg-gray-200 text-red-600 hover:underline"
                                    >
                                        Delete
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowEventOnlyModal(false)}
                                    className="px-4 py-2 text-sm rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        const token = getUserToken();
                                        const isEditing = !!newEventData?.id;

                                        const payload: any = {
                                            a_id: 33,
                                            at_id: 302,
                                            flag: "PT",
                                            trigger: "Event",
                                            is_active: "Y",
                                            user_id: getUserId(),
                                            event_time: new Date().toISOString().slice(0, 19),
                                            description: "Event",
                                            cat_qty_id1: Number(newEventData.taskId),
                                            value1: "",
                                            value2: "",
                                            value3: newEventData.title,
                                            value4: newEventData.start,
                                            value5: "",
                                            value6: "",
                                            cat_qty_id2: 0,
                                            cat_qty_id3: 23,
                                            cat_qty_id4: 58,
                                            cat_qty_id5: 0,
                                            cat_qty_id6: 0,
                                        };
                                        if (isEditing) {
                                            payload.ua_id = newEventData.ua_id;
                                            payload.action = "UPDATE";
                                        }
                                        try {
                                            const endpoint = isEditing
                                                ? 'https://meseer.com/dog/update-delete-data/primary-mwb'
                                                : 'https://meseer.com/dog/add-data/primary-mwb/';

                                            await fetch(endpoint, {
                                                method: 'POST',
                                                headers: {
                                                    Authorization: `Bearer ${token}`,
                                                    'Content-Type': 'application/json',
                                                },
                                                body: JSON.stringify(payload),
                                            });

                                            setShowEventOnlyModal(false);
                                            setNewEventData(null);
                                            await reload();
                                        } catch (err) {
                                            console.error(isEditing ? "Failed to update event" : "Failed to create event", err);
                                        }
                                    }}
                                    className="px-4 py-2 text-sm rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    {newEventData?.id ? "Update" : "Save"}
                                </button>


                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {maximizedTodo && (
                <div className="fixed inset-0 z-50 flex justify-center backdrop-brightness-50 items-center bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[85vh] overflow-auto relative p-5">

                        {/* Close & View Switch */}
                        <button
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                            onClick={() => setMaximizedTodo(null)}
                        >
                            ✕
                        </button>

                        {/* Title */}
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">To-do List</h2>
                        <p className="text-sm text-gray-500 mb-4">{maximizedTodo.name}</p>

                        {/* Task List */}
                        <div className="space-y-2">
                            {(() => {
                                const items = maximizedTodo.contents ?? [];
                                if (todoView === "history") {
                                    const grouped = items.reduce((acc: Record<string, TodoContent[]>, item: TodoContent) => {
                                        const dateObj = new Date(item.last_updated || '');
                                        let groupKey = '';

                                        if (maximizedTodo.refresh_type === 'monthly') {
                                            groupKey = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
                                        }
                                        else if (maximizedTodo.refresh_type === 'weekly') {
                                            const startOfYear = new Date(dateObj.getFullYear(), 0, 1);
                                            const days = Math.floor((dateObj.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
                                            const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);

                                            groupKey = `Week ${weekNum}, ${dateObj.getFullYear()}`;
                                        }
                                        else {
                                            groupKey = dateObj.toLocaleDateString();
                                        }

                                        if (!acc[groupKey]) acc[groupKey] = [];
                                        acc[groupKey].push(item);

                                        return acc;
                                    }, {});

                                    return Object.entries(grouped).map(([date, tasks]) => (
                                        <div key={date}>
                                            <div className="text-[10px] text-gray-500 font-medium mb-0.5">{date}</div>
                                            {tasks.map((task) => (
                                                <div
                                                    key={task.tc_id}
                                                    className="group flex items-center justify-between px-3 py-2 rounded-md bg-gray-50 hover:bg-gray-100 transition"
                                                >
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={task.checked}
                                                            onChange={() => handleToggleCheck(task.tc_id)}
                                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span
                                                            className={`text-sm ${task.checked ? "line-through text-gray-400" : "text-gray-700"
                                                                }`}
                                                        >
                                                            {task.content}
                                                        </span>
                                                    </label>
                                                    <button
                                                        onClick={() => handleDeleteContent(task.tc_id)}
                                                        className="text-gray-400 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ));
                                } else {
                                    return items
                                        .filter((item) => (todoView === "unchecked" ? !item.checked : item.checked))
                                        .map((item) => (
                                            <div
                                                key={item.tc_id}
                                                className="group flex items-center justify-between px-3 py-2 rounded-md bg-gray-50 hover:bg-gray-100 transition"
                                            >
                                                <div className="flex items-center gap-2 w-full">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.checked}
                                                        onChange={() => handleToggleCheck(item.tc_id)}
                                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    {editingTaskId === item.tc_id ? (
                                                        <input
                                                            type="text"
                                                            value={editingTaskContent}
                                                            onChange={(e) => setEditingTaskContent(e.target.value)}
                                                            onBlur={() => {
                                                                if (
                                                                    editingTaskContent.trim() &&
                                                                    editingTaskContent !== item.content
                                                                ) {
                                                                    updateCheckStatus({ ...item, content: editingTaskContent });
                                                                }
                                                                setEditingTaskId(null);
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    if (
                                                                        editingTaskContent.trim() &&
                                                                        editingTaskContent !== item.content
                                                                    ) {
                                                                        updateCheckStatus({ ...item, content: editingTaskContent });
                                                                    }
                                                                    setEditingTaskId(null);
                                                                } else if (e.key === "Escape") {
                                                                    setEditingTaskId(null);
                                                                }
                                                            }}
                                                            className="text-sm border-b border-gray-300 focus:outline-none w-full"
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span
                                                            className={`cursor-pointer text-sm ${item.checked ? "line-through text-gray-400" : "text-gray-700"
                                                                }`}
                                                            onClick={() => {
                                                                setEditingTaskId(item.tc_id);
                                                                setEditingTaskContent(item.content);
                                                            }}
                                                        >
                                                            {item.content}
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteContent(item.tc_id)}
                                                    className="text-gray-400 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ));
                                }
                            })()}
                        </div>

                        {/* Add Task */}
                        {todoView === "unchecked" && (
                            <div className="flex gap-2 mt-4 p-2 bg-gray-100 rounded-md">
                                <input
                                    value={newTaskContent}
                                    onChange={(e) => setNewTaskContent(e.target.value)}
                                    placeholder="Add Task"
                                    className="flex-1 border text-black rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleAddTask();
                                        else if (e.key === "Escape") setNewTaskContent("");
                                    }}
                                />
                                <button
                                    onClick={handleAddTask}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
                                >
                                    Add
                                </button>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="flex justify-between items-center mt-5 text-xs text-gray-500 border-t pt-3">
                            <div className="flex gap-1 items-center">
                                <button className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">
                                    {maximizedTodo.refresh_type}
                                </button>
                            </div>
                            <div className="flex gap-0.5 text-black">
                                <button
                                    onClick={() =>
                                        setTodoView((prev) =>
                                            prev === 'unchecked'
                                                ? 'checked'
                                                : prev === 'checked'
                                                    ? 'history'
                                                    : 'unchecked'
                                        )
                                    }
                                    className="p-0.5 hover:text-blue-600"
                                    title="Previous view"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <span>
                                    {todoView === 'unchecked'
                                        ? 'Pending Tasks'
                                        : todoView === 'checked'
                                            ? 'Completed Tasks'
                                            : 'Task History'}
                                </span>
                                <button
                                    onClick={() =>
                                        setTodoView((prev) =>
                                            prev === 'unchecked'
                                                ? 'checked'
                                                : prev === 'checked'
                                                    ? 'history'
                                                    : 'unchecked'
                                        )
                                    }
                                    className="p-0.5 hover:text-blue-600"
                                    title="Next view"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showGoalDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-5000 flex items-center justify-center">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!goalForm.value2.trim()) {
                                toast.error("Goal name is required");
                                return;
                            }
                            if (!goalForm.value3) {
                                toast.error("Date is required");
                                return;
                            }
                            if (!goalForm.value4 || isNaN(Number(goalForm.value4))) {
                                toast.error("Effort is required");
                                return;
                            }
                            if (!goalForm.cat_qty_id4) {
                                toast.error("Please select a time unit");
                                return;
                            }
                            if (!goalForm.value5 || isNaN(Number(goalForm.value5))) {
                                toast.error("Percentage complete is required");
                                return;
                            }
                            handleSubmitGoal();
                        }}
                        className="bg-white rounded-xl shadow-lg max-w-3xl w-full p-6 space-y-4"
                    >
                        <h2 className="text-2xl font-semibold text-gray-800">Create Goal</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Name (e.g., SEM 3)"
                                value={goalForm.value2}
                                onChange={(e) => setGoalForm({ ...goalForm, value2: e.target.value })}
                                title="Name or title for a given entity"
                                className="w-full border px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
                            />

                            <input
                                type="date"
                                value={goalForm.value3
                                    ? (() => {
                                        const [dd, mm, yyyy] = goalForm.value3.split("/");
                                        return `${yyyy}-${mm}-${dd}`;
                                    })()
                                    : ""}
                                onChange={(e) => {
                                    const raw = e.target.value; // YYYY-MM-DD
                                    const [yyyy, mm, dd] = raw.split("-");
                                    const formatted = `${dd}/${mm}/${yyyy}`;
                                    setGoalForm({ ...goalForm, value3: formatted });
                                }}
                                title="Add a date"
                                className="w-full border px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
                            />

                            <input
                                type="number"
                                placeholder="Effort"
                                value={goalForm.value4}
                                onChange={(e) => setGoalForm({ ...goalForm, value4: e.target.value })}
                                title="Effort needed to achieve the goal"
                                className="w-full border px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
                            />

                            <select
                                value={goalForm.cat_qty_id4}
                                onChange={(e) =>
                                    setGoalForm({ ...goalForm, cat_qty_id4: parseInt(e.target.value) })
                                }
                                title="Choose the time unit for effort (e.g., hpd, hpw, hpm)"
                                className="w-32 border px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={53}>hpd</option>
                                <option value={54}>hpw</option>
                                <option value={55}>hpm</option>
                            </select>

                            <input
                                type="number"
                                placeholder="Completed (%)"
                                value={goalForm.value5}
                                onChange={(e) => setGoalForm({ ...goalForm, value5: e.target.value })}
                                title="Percentage complete"
                                className="w-full border px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                type="button"
                                onClick={() => setShowGoalDialog(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Submit
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {showTaskDialog && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!taskForm.value3.trim()) {
                                toast.error("Task name is required");
                                return;
                            }
                            handleSubmitTask();
                        }}
                        className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg space-y-4"
                    >
                        <h2 className="text-2xl font-semibold text-gray-800">Create Task</h2>
                        <div className="space-y-2">
                            <label className="text-sm text-gray-600">Task Name</label>
                            <input
                                type="text"
                                placeholder="e.g., Make notes"
                                value={taskForm.value3}
                                onChange={(e) => setTaskForm({ ...taskForm, value3: e.target.value })}
                                title="name of the task to be completed"
                                className="w-full border px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                type="button"
                                onClick={() => setShowTaskDialog(false)}
                                className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Submit
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default GoalsPage;