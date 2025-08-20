'use client';
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from 'react';
import { Mic, ChevronRight, ChevronDown, Plus, Edit, Hash, Eye, Repeat, Trash2, Settings, Pencil, CirclePlus, SquareChevronRight, SquareChevronLeft, Maximize2, Trash, Trash2Icon, SquareCheck, Cookie, Sidebar, AlignLeft, XCircle, X, ArrowLeft, Flag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from "react";
import SideBar from "../components/SideBar";
import DynamicActivityDetails from "../components/DynamicActivityDetails";
import DynamicActivityItemForm from "../components/DynamicActivityItemForm";
import toast from "react-hot-toast";

// API Base URL
const API_BASE_URL = 'https://meseer.com/dog';
type ExtendedActivityItem = ActivityItem & {
    flag: string;
    trigger: string;
};

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

type ActivityType = {
    at_id: number;
    name: string;
    description?: string;
};

type ActivityItem = {
    a_id: number;
    at_id: number;
    name: string;
    ua_id: number;
};

type PinnedActivity = {
    a_id: number;
    name: string;
    flag: string;
};

type UserActivity = {
    ua_id: number;
    user_id: string;
    flag: string;                  // e.g., "P" or "PN"
    at_id: number;                 // Activity Type ID
    a_id: number;                  // Activity ID (refers to item)
    cat_qty_id1?: number;
    value1?: string;
    cat_qty_id2?: number;
    value2?: string;
    cat_qty_id3?: number;
    value3?: string;
    name?: string;
    trigger: string;              // Usually "Yes"/"No"
    is_active: string;           // "Y" or "N"
    description: string;         // Activity label (e.g., "Breakfast")
    event_time: string;          // ISO timestamp
    collective_id: number;
    // Optional future-ready fields
    metadata?: Record<string, any>;      // for extra structured data
    tags?: string[];                     // e.g. ["fitness", "morning"]
    image_url?: string;                  // if activity links to an image
};

type Meal = {
    user_id: string;
    ua_id: number;
    group_id: number;
    meal_name: string;
    type?: string;
};

type TemplateData = {
    items?: any[];
    category?: any[];
    units?: any[];
};

const activityImageMap: { [key: string]: string } = {
    breakfast: "/images/breakfast.png",
    lunch: "/images/lunch.png",
    dinner: "/images/dinner.png",
    workout: "/images/workout.png",
    budget: "/images/budget.png",
    consume: "/images/consume.png",
    gym: "/images/GYM.png"
};

const ActivityService = {
    getHeaders: () => {
        const userInfo = Cookies.get("userInfo");
        if (!userInfo) throw new Error('User not authenticated');

        const { access_token } = JSON.parse(userInfo) as UserInfo;
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`
        };
    },

    // Activity Types
    getActivityTypes: async (): Promise<ActivityType[]> => {
        const response = await fetch(`${API_BASE_URL}/get-activity-type`, {
            headers: ActivityService.getHeaders()
        });
        return await response.json();
    },

    // Activity Items by Type
    getActivityItemsByType: async (at_id: number): Promise<ActivityItem[]> => {
        const response = await fetch(`${API_BASE_URL}/pinned-activities-items/${at_id}`, {
            headers: ActivityService.getHeaders()
        });
        return await response.json();
    },

    // Pinned Activity Items
    getPinnedActivityItems: async (at_id: number, pinned_id: number): Promise<ActivityItem[]> => {
        const response = await fetch(`${API_BASE_URL}/pinned-activities-items/${at_id}?id=${pinned_id}`, {
            headers: ActivityService.getHeaders()
        });
        return await response.json();
    },

    // Template Data
    getTemplateData: async (a_id: number): Promise<TemplateData> => {
        const response = await fetch(`${API_BASE_URL}/generic/templates/${a_id}`, {
            headers: ActivityService.getHeaders()
        });
        return await response.json();
    },

    // Pinned Activities
    getPinnedActivities: async (user_id: string, at_id: number): Promise<PinnedActivity[]> => {
        const response = await fetch(`${API_BASE_URL}/activities-items/${at_id}`, {
            headers: ActivityService.getHeaders()
        });
        const data = await response.json();
        return data || [];
    },

    // User Activities
    getUserActivities: async (user_id: string, at_id: number): Promise<UserActivity[]> => {
        const url = `${API_BASE_URL}/generic/pinned-activity/user-data/${user_id}/${at_id}`;

        try {
            const response = await fetch(url, {
                headers: ActivityService.getHeaders(),
            });

            if (response.status === 404) {
                return []; // Gracefully return empty
            }

            if (!response.ok) {
                throw new Error(`API error ${response.status}`);
            }

            const data = await response.json();
            return Array.isArray(data.pinned_activity) ? data.pinned_activity : [];
        } catch (error) {
            return []; // Fallback: return empty list on error
        }
    },

    // Create Meal Activity
    createMealActivity: async (payload: {
        user_id: string;
        ua_id: number;
        group_id: number;
        meal_name: string;
        type?: string;
    }): Promise<Meal> => {
        const response = await fetch(`${API_BASE_URL}/meals/activity/`, {
            method: 'POST',
            headers: ActivityService.getHeaders(),
            body: JSON.stringify(payload),
        });
        return await response.json();
    },

    // Create Food Item Activity
    createFoodItemActivity: async (payload: {
        user_id: string;
        meal_id: number;
        f_id: number;
        cat_qty_id3?: number;
        value3?: string;
        event_time: string;
    }): Promise<UserActivity> => {
        const response = await fetch(`${API_BASE_URL}/dog/meals/food-item/activity/`, {
            method: 'POST',
            headers: ActivityService.getHeaders(),
            body: JSON.stringify({
                user_id: payload.user_id,
                flag: 'PN',
                at_id: 1,
                a_id: 9,
                cat_qty_id1: payload.meal_id,
                value1: null,
                cat_qty_id2: payload.f_id,
                value2: null,
                cat_qty_id3: payload.cat_qty_id3,
                value3: payload.value3,
                trigger: "No",
                is_active: 'Y',
                description: 'Adding a Food item',
                event_time: payload.event_time
            }),
        });
        return await response.json();
    },

    // Create Pinned Activity
    createPinnedActivity: async (payload: {
        user_id: string;
        at_id: number;
        a_id: number;
        flag: string;
        trigger: string;
        is_active: string;
        description: string;
        event_time: string;
        cat_qty_id1?: number;
        value1?: string;
        cat_qty_id2?: number;
        value2?: string;
        cat_qty_id3?: number;
        value3?: string;
        cat_qty_id4?: number;
        value4?: string;
        cat_qty_id5?: number;
        value5?: string;
        cat_qty_id6?: number;
        value6?: string;
    }): Promise<UserActivity> => {
        const response = await fetch(`${API_BASE_URL}/dog/user_activity_insert`, {
            method: 'POST',
            headers: ActivityService.getHeaders(),
            body: JSON.stringify(payload),
        });
        return await response.json();
    },

    // Search Food Items
    searchFoodItems: async (query: string): Promise<any[]> => {
        const response = await fetch(`${API_BASE_URL}/dog/food-items/search/${query}`, {
            headers: ActivityService.getHeaders()
        });
        return await response.json();
    },

    // Get Meal Templates
    getMealTemplates: async (): Promise<any[]> => {
        const response = await fetch(`${API_BASE_URL}/dog/meal/templates`, {
            headers: ActivityService.getHeaders()
        });
        return await response.json();
    },

    // Assign Meal Activity
    assignMealActivity: async (meal_id: number, user_id: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/dog/meals/assign/activity/${meal_id}/${user_id}`, {
            headers: ActivityService.getHeaders()
        });
        return await response.json();
    },

    addPrimaryMWBData: async (data: {
        a_id: number;
        user_id: string;
        name: string;
        event_time: string;
        group_id: number;
        type: string; // "meal" or "workout"
        instructions?: string | null;
    }) => {
        const response = await fetch(`${API_BASE_URL}/add-data/primary-mwb/`, {
            method: 'POST',
            headers: ActivityService.getHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed with status ${response.status}`);
        }

        return await response.json();
    },

    updateOrDeletePrimaryMWBData: async (payload: {
        ua_id?: number;
        flag: string;
        a_id: number;
        at_id: number;
        cat_qty_id1?: number;
        action: "DELETE";
    }) => {
        const response = await fetch(`${API_BASE_URL}/update-delete-data/primary-mwb`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Failed with status ${response.status}`);
        }

        return await response.json();
    },
    updatePrimaryMWBData: async (payload: {
        ua_id: number;
        a_id: number;
        at_id: number;
        flag: string;
        trigger: string;
        is_active: boolean | string;
        user_id: string;
        description: string;
        action: "UPDATE" | "DELETE";
        cat_qty_id1: number | "None";
        cat_qty_id2: number | "None";
        cat_qty_id3: number | "None";
        cat_qty_id4: number | "None";
        cat_qty_id5: number | "None";
        cat_qty_id6: number | "None";
        value1: string;
        value2: string;
        value3: string | number;
        value4: string;
        value5: string;
        value6: string;
    }) => {
        const response = await fetch(`${API_BASE_URL}/update-delete-data/primary-mwb`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Failed with status ${response.status}`);
        }

        return await response.json();
    },

};

function ActivityPage() {
    const router = useRouter();
    const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
    const [activeActivity, setActiveActivity] = useState<UserActivity | null>(null);
    const [selectedActivityType, setSelectedActivityType] = useState<number | null>(null);
    const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
    const [pinnedActivities, setPinnedActivities] = useState<PinnedActivity[]>([]);
    const [selectedPinnedActivity, setSelectedPinnedActivity] = useState<number | null>(null);
    const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
    const [templateData, setTemplateData] = useState<TemplateData>({});
    const [loading, setLoading] = useState({
        activityTypes: false,
        activityItems: false,
        pinnedActivities: false,
        userActivities: false,
        templateData: false
    });
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
    const [goalTasksData, setGoalTasksData] = useState<Record<string, any[]> | null>(null);
    const [showDynamicForm, setShowDynamicForm] = useState(false);
    const [dynamicItem, setDynamicItem] = useState<ActivityItem | null>(null);
    const [foodItems, setFoodItems] = useState<any[]>([]);
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [editedValues, setEditedValues] = useState<{ value2: string; value3: string }>({ value2: '', value3: '' });
    const [showMealDialog, setShowMealDialog] = useState(false);
    const [showFoodform, setshowFoodform] = useState(false);
    const [newMealName, setNewMealName] = useState('');
    const [selectedGoalId, setSelectedGoalId] = useState('');
    const [showWorkoutDialog, setShowWorkoutDialog] = useState(false);
    const [showGoal, setShowGoal] = useState(false);
    const [showTask, setShowTask] = useState(false);
    const [newWorkoutName, setNewWorkoutName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const iconRef = useRef<HTMLDivElement | null>(null);
    const sidebarRef = useRef<HTMLDivElement | null>(null);
    const isPlanType = selectedActivityType === 301;
    const [selectedGoalDetails, setSelectedGoalDetails] = useState<any | null>(null);
    const [selectedTaskDetails, setSelectedTaskDetails] = useState<any | null>(null);

    const getUserId = (): string => {
        const userInfo = Cookies.get("userInfo");
        if (!userInfo) throw new Error('User not authenticated');
        return (JSON.parse(userInfo) as UserInfo).user_id;
    };

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
        const handleClickOutside = (event: MouseEvent) => {
            const clickedOutsideSidebar =
                sidebarRef.current && !sidebarRef.current.contains(event.target as Node);
            const clickedOnIcon =
                iconRef.current && iconRef.current.contains(event.target as Node);

            if (clickedOutsideSidebar && !clickedOnIcon) {
                setSidebarOpen(false);
            }
        };

        if (sidebarOpen && isMobile) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [sidebarOpen, isMobile]);

    useEffect(() => {
        fetchFoodItems();
    }, [activeActivity]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        fetchGoalsTasks();
    }, [selectedActivityType]);

    const fetchGoalsTasks = async () => {
        if (!selectedActivityType) return;
        const activity = activityTypes.find(a => a.at_id === selectedActivityType);
        if (!activity || activity.name.toLowerCase() !== "plan") return;

        try {
            const userId = getUserId();
            const res = await fetch(`https://meseer.com/dog/get_all_goals_tasks/${userId}`);
            const data = await res.json();
            setGoalTasksData(data);
        } catch (err) {
            console.error("Failed to fetch goals/tasks", err);
        }
    };
    const hardfetch = async () => {
        try {
            const userId = getUserId();
            const res = await fetch(`https://meseer.com/dog/get_all_goals_tasks/${userId}`);
            const data = await res.json();
            setGoalTasksData(data);
        } catch (err) {
            console.error("Failed to fetch goals/tasks", err);
        }
    };

    const handleCreateWorkout = async () => {
        try {
            const userId = getUserId();

            if (!newWorkoutName.trim()) {
                setError('Workout name is required');
                return;
            }

            const now = new Date().toISOString().slice(0, 19);

            await ActivityService.addPrimaryMWBData({
                user_id: userId,
                name: newWorkoutName.trim(),
                event_time: now,
                instructions: null,
                group_id: 0,
                type: "Flexibility", // or any type like "Strength", etc.
                a_id: 11,
            });

            await fetchUserActivities(); // refresh data
            setNewWorkoutName('');
            setShowWorkoutDialog(false);
        } catch (err) {
            console.error('Error creating workout:', err);
            setError('Failed to create workout');
        }
    };

    const handleActivityItemClick = (item: ActivityItem) => {
        setDynamicItem(item);
        setShowDynamicForm(true);
    };

    const fetchFoodItems = async () => {
        if (!activeActivity?.collective_id || !activeActivity?.a_id) return;

        const userId = getUserId();
        const pa_id = 9;
        const collective_id = activeActivity.collective_id;

        try {
            const response = await fetch(
                `https://meseer.com/dog/generic/get-it/${userId}/${pa_id}/${collective_id}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            if (!response.ok) throw new Error("Failed to fetch food items");
            const data = await response.json();
            setFoodItems(data || []);
        } catch (error) {
            console.error("Error fetching food items:", error);
            setFoodItems([]); // fallback to empty
        }
    };

    // Fetch all activity data on component mount
    useEffect(() => {
        if (!mounted) return;

        const fetchInitialData = async () => {
            try {
                setLoading(prev => ({ ...prev, activityTypes: true }));
                setError(null);

                const userId = getUserId();
                const types = await ActivityService.getActivityTypes();
                setActivityTypes(types);

                // Select first activity type by default
                if (types.length > 0) {
                    setSelectedActivityType(types[0].at_id);
                }
            } catch (err) {
                console.error('Error fetching activity data:', err);
                setError(`Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`);
            } finally {
                setLoading(prev => ({ ...prev, activityTypes: false }));
            }
        };

        fetchInitialData();
    }, [mounted]);

    // Fetch activity items when activity type changes
    useEffect(() => {
        const effectiveActivityType = showTask ? 302 : selectedActivityType;

        if (!effectiveActivityType) return;
        if (activeActivity) setActiveActivity(null);

        const fetchActivityItems = async () => {
            try {
                setLoading(prev => ({ ...prev, activityItems: true }));
                const items = await ActivityService.getActivityItemsByType(effectiveActivityType);
                setActivityItems(items);
            } catch (err) {
                console.error('Error fetching activity items:', err);
                setError('Failed to load activity items');
            } finally {
                setLoading(prev => ({ ...prev, activityItems: false }));
            }
        };

        fetchActivityItems();
    }, [selectedActivityType, showTask]);


    // Fetch pinned activities when activity type changes
    useEffect(() => {
        if (!selectedActivityType) return;
        setShowGoal(false);
        setShowTask(false);
        const fetchPinnedActivities = async () => {
            try {
                setLoading(prev => ({ ...prev, pinnedActivities: true }));
                const userId = getUserId();
                const pinned = await ActivityService.getPinnedActivities(userId, selectedActivityType);
                setPinnedActivities(pinned);

                // Select first pinned activity by default if available
                // if (pinned.length > 0) {
                //     setSelectedPinnedActivity(pinned[0].a_id);
                // }
            } catch (err) {
                console.error('Error fetching pinned activities:', err);
                setError('Failed to load pinned activities');
            } finally {
                setLoading(prev => ({ ...prev, pinnedActivities: false }));
            }
        };

        fetchPinnedActivities();
    }, [selectedActivityType]);

    // Fetch user activities when pinned activity is selected
    useEffect(() => {
        if (!selectedActivityType) return;

        const fetchUserActivities = async () => {
            try {
                setLoading(prev => ({ ...prev, userActivities: true }));
                const userId = getUserId();
                const activities = await ActivityService.getUserActivities(
                    userId,
                    selectedActivityType,
                );
                setUserActivities(activities);
            } catch (err) {
                console.error('Error fetching user activities:', err);
                setError('Failed to load user activities');
            } finally {
                setLoading(prev => ({ ...prev, userActivities: false }));
            }
        };

        fetchUserActivities();
    }, [selectedActivityType]);

    const fetchUserActivities = async () => {
        try {
            setLoading((prev) => ({ ...prev, userActivities: true }));
            const userId = getUserId();
            const activities = await ActivityService.getUserActivities(userId, selectedActivityType!);
            setUserActivities(activities);
        } catch (err) {
            console.error("Failed to fetch user activities:", err);
            setError("Failed to load user activities");
        } finally {
            setLoading((prev) => ({ ...prev, userActivities: false }));
        }
    };

    // Fetch template data when activity item is selected
    const fetchTemplateData = async (a_id: number) => {
        try {
            setLoading(prev => ({ ...prev, templateData: true }));
            const data = await ActivityService.getTemplateData(a_id);
            setTemplateData(data);
        } catch (err) {
            console.error('Error fetching template data:', err);
            setError('Failed to load template data');
        } finally {
            setLoading(prev => ({ ...prev, templateData: false }));
        }
    };

    const handleCreateMeal = async () => {
        try {
            const userId = getUserId();

            if (!newMealName.trim()) {
                setError('Meal name is required');
                return;
            }

            const now = new Date().toISOString().slice(0, 19);

            await ActivityService.addPrimaryMWBData({
                user_id: userId,
                name: newMealName.trim(),
                event_time: now,
                group_id: 0,
                type: "VEG", // required for backend to distinguish between meal/workout
                a_id: 8,
            });
            await fetchUserActivities();
            setNewMealName('');
            setShowMealDialog(false);
        } catch (err) {
            console.error('Error creating meal:', err);
            setError('Failed to create meal');
        }
    };

    const handlePinnedActivityClick = (activity: PinnedActivity) => {
        // Don't select it by default

        switch (activity.name.toLowerCase()) {
            case 'create meal':
                // Handle meal/food logic
                setShowMealDialog(true);
                break;
            case 'create workout':
                setShowWorkoutDialog(true);
                break;
            case 'create budget':
                // console.log('Launch budget module');
                break;
            case 'create goal':
                setShowGoalDialog(true);
                break;
            default:
                // console.log('No action mapped yet');
                break;
        }
    };

    const handleDeleteData = async (activity: UserActivity) => {
        try {
            await ActivityService.updateOrDeletePrimaryMWBData({
                ua_id: activity.ua_id,
                flag: activity.flag,      // usually 'P'
                a_id: activity.a_id,      // 8 for meal
                at_id: activity.at_id,
                cat_qty_id1: activity.collective_id,  // 1 for meal-type
                action: "DELETE"
            });

            // ✅ Optional: refresh list after deletion
            await fetchUserActivities();
        } catch (err) {
            console.error("Error deleting activity:", err);
            setError("Failed to delete activity");
        }
    };

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

            const res = await fetch('https://meseer.com/dog/add-data/primary-mwb/', {
                method: 'POST',
                headers: ActivityService.getHeaders(),
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to create goal");

            setShowGoalDialog(false);
            await fetchGoalsTasks();
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

            const res = await fetch('https://meseer.com/dog/add-data/primary-mwb/', {
                method: 'POST',
                headers: ActivityService.getHeaders(),
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to create task");
            setSelectedGoalId('');
            setShowTaskDialog(false);
            await fetchGoalsTasks();
        } catch (err) {
            console.error("Task creation failed", err);
            alert("Error creating task");
        }
    };

    const enrichedItems: ExtendedActivityItem[] = activityItems.map((item) => ({
        ...item,
        flag: "PN",
        trigger: "food_item",
    }));

    const handleDeleteGoal = async () => {
        try {
            const userId = getUserId();
            await ActivityService.updateOrDeletePrimaryMWBData({
                a_id: 24,
                at_id: 301,
                flag: 'P',
                action: "DELETE",
                cat_qty_id1: parseInt(selectedGoalDetails?.goalId),
                ua_id: (selectedGoalDetails.ua_id)
            });

            setShowGoal(false);
            setSelectedGoalDetails(null);
            await fetchGoalsTasks();
        } catch (err) {
            console.error("Failed to delete goal", err);
            alert("Error deleting goal");
        }
    };

    const handleDeleteTask = async (taskId: any) => {
        try {
            const userId = getUserId();
            await ActivityService.updateOrDeletePrimaryMWBData({
                a_id: 27,             // Task a_id
                at_id: 301,
                flag: "PP",
                action: "DELETE",
                cat_qty_id1: taskId,
            });

            setShowTask(false);
            setSelectedTaskDetails(null);
            await fetchGoalsTasks();
        } catch (err) {
            console.error("Failed to delete task", err);
            alert("Error deleting task");
        }
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-gray-50 text-gray-900">
            {/* Left Panel */}
            {isMobile ? (
                <>
                    <SideBar />
                    <AlignLeft
                        className="absolute top-12 left-4 z-500 w-6 h-6 cursor-pointer text-black"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    />
                    <AnimatePresence>
                        {sidebarOpen && (
                            <motion.div
                                ref={sidebarRef}
                                initial={{ x: -300 }}
                                animate={{ x: 0 }}
                                exit={{ x: -300 }}
                                transition={{ duration: 0.3 }}
                                className="fixed top-20 left-0 h-full w-64 bg-white z-500 border-r border-gray-200 p-4 flex flex-col gap-4 overflow-y-auto shadow-lg"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                                        <ChevronRight
                                            className="w-5 h-5 rotate-180 transform mr-2 cursor-pointer hover:text-gray-600 transition-colors"
                                            onClick={() => router.push('/')}
                                        />
                                        ACTIVITY
                                    </h2>
                                </div>

                                {error && (
                                    <div className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-md">
                                        {error}
                                    </div>
                                )}

                                {/* Activity Types */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Activity Types
                                        </h3>
                                    </div>
                                    <div className="space-y-1">
                                        {loading.activityTypes ? (
                                            <div className="flex items-center justify-center py-3">
                                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-400" />
                                            </div>
                                        ) : (
                                            <ul className="space-y-1">
                                                {activityTypes.map((type) => (
                                                    <li key={`type-${type.at_id}`}>
                                                        <button
                                                            onClick={() => setSelectedActivityType(type.at_id)}
                                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${selectedActivityType === type.at_id
                                                                ? 'bg-blue-50 text-blue-600 font-medium'
                                                                : 'text-gray-700 hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            <span>{type.name}</span>
                                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>

                                {/* Pinned Activities */}
                                {selectedActivityType && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">
                                                Pinned Activities
                                            </h3>
                                        </div>
                                        <div className="space-y-1">
                                            {loading.pinnedActivities ? (
                                                <div className="flex items-center justify-center py-3">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-400" />
                                                </div>
                                            ) : (
                                                <ul className="space-y-1">
                                                    {pinnedActivities
                                                        .filter((activity) => activity.flag === 'P')
                                                        .map((activity) => (
                                                            <li key={`pinned-${activity.a_id}`}>
                                                                <button
                                                                    onClick={() => handlePinnedActivityClick(activity)}
                                                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${selectedPinnedActivity === activity.a_id
                                                                        ? 'bg-blue-50 text-blue-600 font-medium'
                                                                        : 'text-gray-700 hover:bg-gray-50'
                                                                        }`}
                                                                >
                                                                    <span>{activity.name}</span>
                                                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                                                </button>
                                                            </li>
                                                        ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Activity Items */}
                                {(activeActivity || showGoal || showTask) && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">
                                                Activity Items
                                            </h3>
                                        </div>
                                        <div className="space-y-1">
                                            {loading.activityItems ? (
                                                <div className="flex items-center justify-center py-3">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-400" />
                                                </div>
                                            ) : (
                                                <ul className="space-y-1">
                                                    {activityItems.map((item) => (
                                                        <li key={`item-${item.a_id}`}>
                                                            <button
                                                                onClick={() => handleActivityItemClick(item)}
                                                                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                            >
                                                                <span>{item.name}</span>
                                                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            ) : (
                <div className="w-64 min-w-[220px] border-r border-gray-200 p-4 flex flex-col gap-4 overflow-y-auto bg-white">
                    {/* Desktop sidebar content (same as mobile but without animations) */}
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                            <ArrowLeft
                                className="w-5 h-5 transform mr-2 cursor-pointer hover:text-gray-600 transition-colors"
                                onClick={() => router.push('/')}
                            />
                            ACTIVITY
                        </h2>
                    </div>

                    {error && (
                        <div className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-md">
                            {error}
                        </div>
                    )}

                    {/* Activity Types */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">
                                Activity Types
                            </h3>
                        </div>
                        <div className="space-y-1">
                            {loading.activityTypes ? (
                                <div className="flex items-center justify-center py-3">
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-400" />
                                </div>
                            ) : (
                                <ul className="space-y-1">
                                    {activityTypes.map((type) => (
                                        <li key={`type-${type.at_id}`}>
                                            <button
                                                onClick={() => setSelectedActivityType(type.at_id)}
                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${selectedActivityType === type.at_id
                                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                                    : 'text-gray-700 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <span>{type.name}</span>
                                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Pinned Activities */}
                    {selectedActivityType && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Pinned Activities
                                </h3>
                            </div>
                            <div className="space-y-1">
                                {loading.pinnedActivities ? (
                                    <div className="flex items-center justify-center py-3">
                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-400" />
                                    </div>
                                ) : (
                                    <ul className="space-y-1">
                                        {pinnedActivities
                                            .filter((activity) => activity.flag === 'P')
                                            .map((activity) => (
                                                <li key={`pinned-${activity.a_id}`}>
                                                    <button
                                                        onClick={() => handlePinnedActivityClick(activity)}
                                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${selectedPinnedActivity === activity.a_id
                                                            ? 'bg-blue-50 text-blue-600 font-medium'
                                                            : 'text-gray-700 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <span>{activity.name}</span>
                                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                                    </button>
                                                </li>
                                            ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Activity Items */}
                    {(activeActivity || showGoal || showTask) && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Activity Items
                                </h3>
                            </div>
                            <div className="space-y-1">
                                {loading.activityItems ? (
                                    <div className="flex items-center justify-center py-3">
                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-400" />
                                    </div>
                                ) : (
                                    <ul className="space-y-1">
                                        {activityItems.map((item) => (
                                            <li key={`item-${item.a_id}`}>
                                                <button
                                                    onClick={() => handleActivityItemClick(item)}
                                                    className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                    <span>{item.name}</span>
                                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-auto">
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
                    {selectedActivityType && (
                        <span className="text-blue-600 font-medium">
                            {activityTypes.find(t => t.at_id === selectedActivityType)?.name}
                        </span>
                    )}
                </div>

                {/* Activity Content */}
                {loading.userActivities ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500"></div>
                    </div>
                ) : isPlanType ? (
                    // Plan Type UI (Goals/Tasks)
                    goalTasksData && Object.entries(goalTasksData).length > 0 ? (
                        <div className="space-y-6">
                            {Object.entries(goalTasksData).map(([key, tasks]) => {
                                const [goalId, goalName] = key.replace(/\[|\]/g, '').split(',');

                                return (
                                    <div key={goalId} className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                                        <div className="flex justify-between items-center">
                                            <div className="mb-4" onClick={() => {
                                                setSelectedGoalDetails({ goalId, goalName, tasks }); // for goal
                                                setShowGoal(true);
                                            }}>
                                                <h2 className="text-xl font-bold text-gray-800">{goalName}</h2>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    setSelectedGoalId(goalId);
                                                    setShowTaskDialog(true);
                                                }}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Add Task
                                            </button>
                                        </div>
                                        <div className="space-y-3 pl-4 border-l-4 border-blue-500">
                                            {tasks.map((task, index) => (
                                                <div
                                                    key={index}
                                                    className="bg-gray-50 px-4 py-3 rounded-md shadow-sm flex justify-between items-center hover:bg-blue-50 transition cursor-pointer"
                                                    onClick={() => {
                                                        setSelectedTaskDetails(task);
                                                        setShowTask(true);
                                                    }}
                                                >
                                                    <div>
                                                        <div className="font-medium text-gray-800">{task.task_name}</div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {new Date(task.created_timestamp).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    {task.todo_id === null && (
                                                        <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                                                            Unlinked
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            No goals found. Create your first goal to get started.
                        </div>
                    )
                ) : (
                    <div className="space-y-3">
                        {userActivities.map((activity) => {
                            const key = (activity.name || activity.description || "").toLowerCase();
                            const image = activityImageMap[key];

                            return (
                                <motion.div
                                    key={activity.ua_id}
                                    whileHover={{ scale: 1.01 }}
                                    className="flex items-center max-w-xl justify-between px-4 py-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer group"
                                >
                                    {/* Left side: Image or emoji */}
                                    <div className="flex items-center gap-3">
                                        {image ? (
                                            <img src={image} alt={key} className="w-10 h-10 rounded-md object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-md text-lg">🍽️</div>
                                        )}
                                        <div className="flex flex-col">
                                            <div className="font-medium text-gray-800">{activity.description || activity.name}</div>

                                        </div>
                                    </div>

                                    {/* Right side: actions */}
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                                        <button
                                            onClick={() => setActiveActivity(activity)}
                                            className="text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            View
                                        </button>
                                        <Trash2
                                            className="w-4 h-4 text-red-500 hover:text-red-700"
                                            onClick={() => handleDeleteData(activity)}
                                        />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                )}
            </div>


            {showMealDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-5000 flex items-center justify-center p-4">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!newMealName.trim()) {
                                toast.error("Meal name is required");
                                return;
                            }
                            handleCreateMeal();
                        }}
                        className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg space-y-4"
                    >
                        <h2 className="text-xl font-semibold">Create New Meal</h2>
                        <input
                            type="text"
                            placeholder="Enter meal name"
                            value={newMealName}
                            onChange={(e) => setNewMealName(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                type="button"
                                onClick={() => setShowMealDialog(false)}
                                className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Create
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {showWorkoutDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-5000 flex items-center justify-center p-4">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!newWorkoutName.trim()) {
                                toast.error("Workout name is required");
                                return;
                            }
                            handleCreateWorkout();
                        }}
                        className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg space-y-4"
                    >
                        <h2 className="text-xl font-semibold">Create New Workout</h2>
                        <input
                            type="text"
                            placeholder="Enter workout name"
                            value={newWorkoutName}
                            onChange={(e) => setNewWorkoutName(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                type="button"
                                onClick={() => setShowWorkoutDialog(false)}
                                className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Create
                            </button>
                        </div>
                    </form>
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


            <AnimatePresence>
                {activeActivity && (
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="fixed top-20 md:top-0 right-0 h-full w-full sm:w-[calc(100%-16rem)] bg-white z-50 shadow-xl overflow-y-auto p-6"
                    // 100%-sidebar (16rem) if sidebar is 64px wide
                    >
                        <div className="max-w-4xl mx-auto space-y-6 py-5">
                            {/* Close Button */}
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">
                                    {activeActivity.description || activeActivity.name}
                                </h2>
                                <button
                                    onClick={() => setActiveActivity(null)}
                                    className="text-gray-500 hover:text-red-600 text-lg transition"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Editable Content (Meal name + Food items etc.) */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    {selectedActivityType === 1 ? "Meal" : "Activity Name"}
                                </label>
                                <input
                                    type="text"
                                    value={activeActivity.name || ""}
                                    readOnly
                                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <DynamicActivityDetails
                                userId={getUserId()}
                                collectiveId={activeActivity.collective_id}
                                activityItems={enrichedItems}
                            />

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {showDynamicForm && dynamicItem && (
                <DynamicActivityItemForm
                    a_id={dynamicItem.a_id}
                    at_id={selectedActivityType ?? 0} // fallback to 0
                    trigger={dynamicItem.name}
                    userId={getUserId()}
                    collectiveId={activeActivity?.collective_id ?? 0} // fallback to 0
                    isOpen={showDynamicForm}
                    onClose={() => setShowDynamicForm(false)}
                    onSuccess={async () => {
                        if (dynamicItem.a_id === 29) {
                            await hardfetch();

                            // Use latest updated data — goalTasksData is async set, so better to refetch from the fetch result
                            const userId = getUserId();
                            const res = await fetch(`https://meseer.com/dog/get_all_goals_tasks/${userId}`);
                            const data = await res.json();
                            setGoalTasksData(data); // Update state

                            // Flatten all tasks from grouped keys
                            const allTasks = Object.values(data).flat();

                            // Find the updated version of the currently opened task
                            const updatedTask = allTasks.find(
                                (task: any) => task.task_id === selectedTaskDetails.task_id
                            );

                            if (updatedTask) {
                                setSelectedTaskDetails(updatedTask); // ✅ Triggers re-render
                                // console.log("✅ Task details updated and re-selected:", updatedTask);
                            } else {
                                console.warn("⚠️ Could not find updated task after hardfetch.");
                            }
                        } else {
                            // console.log("other")
                            fetchUserActivities();
                        }
                    }}
                    selectedTaskDetails={selectedTaskDetails}
                    selectedGoalDetails={selectedGoalDetails}
                />
            )}

            {/* Bottom Slide-Up for Goal */}
            <AnimatePresence>
                {showGoal && selectedGoalDetails && (
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="fixed top-0 right-0 h-full w-full sm:w-[calc(100%-16rem)] bg-white z-50 shadow-xl overflow-y-auto p-6"
                    >
                        <div className="max-w-4xl mx-auto space-y-6 py-12">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">{selectedGoalDetails.goalName}</h2>
                                <div className="flex gap-2 items-center">
                                    <button
                                        onClick={handleDeleteGoal}
                                        className="text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded text-sm"
                                    >
                                        Delete Goal
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowGoal(false);
                                            setSelectedGoalDetails(null);
                                        }}
                                        className="text-gray-500 hover:text-red-600 text-lg transition"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>


                            <div className="space-y-2">
                                {selectedGoalDetails.tasks.map((task: any, index: number) => (
                                    <div key={index} className="border p-3 rounded-md bg-gray-50">
                                        <div className="font-medium">{task.task_name}</div>
                                        <div className="text-sm text-gray-500">
                                            {new Date(task.created_timestamp).toLocaleString()}
                                        </div>
                                        {task.todo_id === null && (
                                            <span className="text-xs text-red-500">Unlinked</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <DynamicActivityDetails
                                userId={getUserId()}
                                collectiveId={selectedGoalDetails.goalId}
                                activityItems={enrichedItems}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Slide-In Panel for Task */}
            <AnimatePresence>
                {showTask && selectedTaskDetails && (
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="fixed top-0 right-0 h-full w-full sm:w-[calc(100%-16rem)] bg-white z-50 shadow-xl overflow-y-auto p-6"
                    >
                        <div className="max-w-4xl mx-auto space-y-6 py-5">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">{selectedTaskDetails.task_name}</h2>
                                <div className="flex gap-2 items-center">
                                    <button
                                        onClick={() => handleDeleteTask(selectedTaskDetails.task_id)}
                                        className="text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded text-sm"
                                    >
                                        Delete Task
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowTask(false);
                                            setSelectedTaskDetails(null);
                                        }}
                                        className="text-gray-500 hover:text-red-600 text-lg transition"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>


                            <div className="space-y-2 text-gray-700 text-sm">
                                <p><strong>Created:</strong> {new Date(selectedTaskDetails.created_timestamp).toLocaleString()}</p>
                                {selectedTaskDetails.todo_id === null && (
                                    <p className="text-red-500">This task is not linked to any To-Do.</p>
                                )}
                            </div>
                            <DynamicActivityDetails
                                userId={getUserId()}
                                collectiveId={selectedTaskDetails.task_id}
                                activityItems={enrichedItems}
                                realCollectiveId={selectedTaskDetails.collective_id}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default ActivityPage;