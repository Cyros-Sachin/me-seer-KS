'use client';
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from 'react';
import { Mic, ChevronRight, ChevronDown, Plus, Edit, Hash, Eye, Repeat, Trash2, Settings, Pencil, CirclePlus, SquareChevronRight, SquareChevronLeft, Maximize2, Trash, Trash2Icon, SquareCheck, Cookie } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from "react";
import { WordpadEditor } from "../components/WordpadEditor";
import { FoodItemForm } from "../components/FoodItem";
// API Base URL
const API_BASE_URL = 'https://meseer.com/dog';

type ActivityAction = 'create' | 'edit' | 'delete' | null;
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
};

type PinnedActivity = {
    a_id: number;
    name: string;
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
        const response = await fetch(`${API_BASE_URL}/generic/pinned-activity/${user_id}/${at_id}`, {
            headers: ActivityService.getHeaders()
        });
        const data = await response.json();
        return data.pinned_activity || [];
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
        ua_id: number;
        flag: string;
        a_id: number;
        at_id: number;
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
    const [foodItems, setFoodItems] = useState<any[]>([]);
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [editedValues, setEditedValues] = useState<{ value2: string; value3: string }>({ value2: '', value3: '' });
    const [showMealDialog, setShowMealDialog] = useState(false);
    const [showFoodform, setshowFoodform] = useState(false);
    const [newMealName, setNewMealName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [activityAction, setActivityAction] = useState<ActivityAction>(null);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [maximizedItem, setMaximizedItem] = useState<any>(null);
    const [contentMap, setContentMap] = useState<{ [key: string]: string }>({});
    const [editingContentId, setEditingContentId] = useState<string | null>(null);
    const getUserId = (): string => {
        const userInfo = Cookies.get("userInfo");
        if (!userInfo) throw new Error('User not authenticated');
        return (JSON.parse(userInfo) as UserInfo).user_id;
    };
    useEffect(() => {
        console.log("showFoodform changed →", showFoodform);
    }, [showFoodform]);

    const handleActivityItemClick = (item: ActivityItem) => {
        switch (item.name.toLowerCase()) {
            case 'assign meal':
                const userId = getUserId();
                break;
            case 'food item':
                console.log(item.name.toLowerCase());
                setshowFoodform(true);
                // setShowFoodItemModal(true);
                break;
            case 'exercise set':
                // setShowAssignMealModal(true);
                console.log(item.name.toLowerCase());
                break;
            case 'exercise circuit reps':
                console.log(item.name.toLowerCase());
                // setShowFoodItemModal(true);
                break;
            case 'exercise circuit time':
                // setShowAssignMealModal(true);
                console.log(item.name.toLowerCase());
                break;
            case 'warmup reps':
                console.log(item.name.toLowerCase());
                // setShowFoodItemModal(true);
                break;
            case 'cool down reps':
                // setShowAssignMealModal(true);
                console.log(item.name.toLowerCase());
                break;
            case 'warmup time':
                console.log(item.name.toLowerCase());
                // setShowFoodItemModal(true);
                break;
            case 'cool down time':
                // setShowAssignMealModal(true);
                console.log(item.name.toLowerCase());
                break;
            case 'circuit sets':
                console.log(item.name.toLowerCase());
                // setShowFoodItemModal(true);
                break;
            case 'build budget':
                // setShowAssignMealModal(true);
                console.log(item.name.toLowerCase());
                break;
            case 'budget setting':
                console.log(item.name.toLowerCase());
                // setShowFoodItemModal(true);
                break;
            case 'goal metadata':
                // setShowAssignMealModal(true);
                console.log(item.name.toLowerCase());
                break;
            case 'build goal':
                console.log(item.name.toLowerCase());
                // setShowFoodItemModal(true);
                break;
            default:
                fetchTemplateData(item.a_id);
                break;
        }
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
    useEffect(() => {
        fetchFoodItems();
    }, [activeActivity]);

    useEffect(() => {
        setMounted(true);
    }, []);

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
        if (!selectedActivityType) return;

        const fetchActivityItems = async () => {
            try {
                setLoading(prev => ({ ...prev, activityItems: true }));
                const items = await ActivityService.getActivityItemsByType(selectedActivityType);
                setActivityItems(items);
            } catch (err) {
                console.error('Error fetching activity items:', err);
                setError('Failed to load activity items');
            } finally {
                setLoading(prev => ({ ...prev, activityItems: false }));
            }
        };

        fetchActivityItems();
    }, [selectedActivityType]);

    // Fetch pinned activities when activity type changes
    useEffect(() => {
        if (!selectedActivityType) return;

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


    const handleCreateFoodItem = async (meal_id: number) => {
        try {
            const userId = getUserId();
            const now = new Date().toISOString();
            await ActivityService.createFoodItemActivity({
                user_id: userId,
                meal_id,
                f_id: 1, // Example food item ID
                event_time: now
            });

            // Refresh activities
            const activities = await ActivityService.getUserActivities(
                userId,
                selectedActivityType!,
            );
            setUserActivities(activities);
        } catch (err) {
            console.error('Error creating food item:', err);
            setError('Failed to create food item');
        }
    };

    const handleCreatePinnedActivity = async (at_id: number, a_id: number, name: string) => {
        try {
            const userId = getUserId();
            const now = new Date().toISOString();
            await ActivityService.createPinnedActivity({
                user_id: userId,
                at_id,
                a_id,
                flag: 'P',
                trigger: name,
                is_active: 'Y',
                description: `Adding ${name}`,
                event_time: now,
                cat_qty_id2: 28, // Example category quantity ID
                value2: name
            });

            // Refresh pinned activities
            const pinned = await ActivityService.getPinnedActivities(userId, at_id);
            setPinnedActivities(pinned);
        } catch (err) {
            console.error('Error creating pinned activity:', err);
            setError('Failed to create pinned activity');
        }
    };

    const renderActivityItem = (activity: UserActivity) => {
        const contentKey = `activity-${activity.ua_id}`;
        const isEditing = editingContentId === contentKey;
        const content = contentMap[contentKey] ?? activity.description;

        return (
            <motion.div
                key={activity.ua_id}
                layout
                className="bg-white rounded-xl border border-gray-300 shadow text-sm flex flex-col overflow-hidden"
            >
                <div className="flex items-center justify-between px-3 py-2 border-b">
                    <span className="font-semibold truncate">
                        {activity.description}
                    </span>
                    <div className="flex gap-2">
                        <Trash2Icon
                            className="w-4 h-4 text-red-500 opacity-50 hover:opacity-100 cursor-pointer"
                            onClick={() => console.log('Delete', activity.ua_id)}
                        />
                    </div>
                </div>

                <div className="px-3 py-2 space-y-2">
                    {isEditing ? (
                        <WordpadEditor
                            content={content}
                            onSave={(updatedHtml) => {
                                // Handle save logic here
                                setContentMap(prev => {
                                    const updated = { ...prev };
                                    delete updated[contentKey];
                                    return updated;
                                });
                                setEditingContentId(null);
                            }}
                            onVoiceInput={(transcript) => {
                                setContentMap(prev => ({
                                    ...prev,
                                    [contentKey]: (prev[contentKey] || content) + ' ' + transcript,
                                }));
                            }}
                        />
                    ) : (
                        <div
                            className="p-2 text-sm text-gray-800 cursor-text min-h-[100px]"
                            onClick={() => {
                                setEditingContentId(contentKey);
                                setContentMap(prev => ({
                                    ...prev,
                                    [contentKey]: content || '<p></p>',
                                }));
                            }}
                            dangerouslySetInnerHTML={{ __html: content || '<p class="text-gray-400 italic">Click to add content</p>' }}
                        />
                    )}
                </div>

                <div className="flex items-center justify-between border-t px-3 py-2">
                    <div className="text-xs text-gray-500">
                        {new Date(activity.event_time).toLocaleString()}
                    </div>
                    <div className="flex gap-2 text-gray-600 items-center">
                        <Mic
                            className="w-4 h-4 text-blue-600 cursor-pointer"
                            onClick={() => {
                                setEditingContentId(contentKey);
                                setContentMap(prev => ({
                                    ...prev,
                                    [contentKey]: content || '<p></p>',
                                }));
                            }}
                        />
                        <Maximize2
                            className="w-4 h-4 cursor-pointer"
                            onClick={() => setMaximizedItem(activity)}
                        />
                    </div>
                </div>
            </motion.div>
        );
    };

    const handlePinnedActivityClick = (activity: PinnedActivity) => {
        // Don't select it by default
        console.log("Pinned clicked:", activity.name.toLowerCase());

        switch (activity.name.toLowerCase()) {
            case 'create meal':
                // Handle meal/food logic
                setShowMealDialog(true);
                break;
            case 'create workout':
                console.log('Show exercise related UI');
                break;
            case 'create budget':
                console.log('Launch budget module');
                break;
            case 'create goal':
                console.log('Launch budget module');
                break;
            case 'add task':
                console.log('Launch budget module');
                break;
            default:
                console.log('No action mapped yet');
                break;
        }
    };

    const handleDeleteData = async (activity: UserActivity) => {
        try {
            await ActivityService.updateOrDeletePrimaryMWBData({
                ua_id: activity.ua_id,
                flag: activity.flag,      // usually 'P'
                a_id: activity.a_id,      // 8 for meal
                at_id: activity.at_id,    // 1 for meal-type
                action: "DELETE"
            });

            // ✅ Optional: refresh list after deletion
            await fetchUserActivities();
        } catch (err) {
            console.error("Error deleting activity:", err);
            setError("Failed to delete activity");
        }
    };

    const handleUpdateFoodItem = async (
        item: any,
        updated: { value2: string; value3: string }
    ) => {
        try {
            const userId = getUserId();

            // ✅ Extract selected unit_id from cat_qty_id3 array
            const selectedUnitId =
                Array.isArray(item.cat_qty_id3)
                    ? item.cat_qty_id3.find((u: any) => u?.Selected)?.unit_id ?? "None"
                    : item.cat_qty_id3 ?? "None";

            await ActivityService.updatePrimaryMWBData({
                ua_id: item.ua_id,
                a_id: 9,
                at_id: item.at_id || 1,
                flag: item.flag || "PN",
                trigger: "meal",
                is_active: true,
                user_id: userId,
                description: `updating ${updated.value2}`,
                action: "UPDATE",
                cat_qty_id1: item.cat_qty_id1 ?? "None",
                cat_qty_id2: item.cat_qty_id2 ?? "None",
                cat_qty_id3: selectedUnitId,
                cat_qty_id4: "None",
                cat_qty_id5: "None",
                cat_qty_id6: "None",
                value1: "None",
                value2: updated.value2 || "None",
                value3: updated.value3 || "None",
                value4: "None",
                value5: "None",
                value6: "None",
            });
            await fetchFoodItems(); // ✅ this works now
            setEditingItemId(null);
        } catch (err) {
            console.error("Error updating item:", err);
            setError("Failed to update item");
        }
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-white text-black">
            {/* Left Panel */}
            <div className="w-64 min-w-[220px] border-r border-gray-300 p-4 flex flex-col gap-4 overflow-scroll">
                <h2 className="text-xl font-semibold mb-2 mt-2">
                    <ChevronRight
                        className="w-6 h-6 rotate-180 transform inline-flex mr-15 mb-1"
                        onClick={() => router.push('/')}
                    />
                    ACTIVITY
                </h2>

                {error && (
                    <div className="text-red-500 p-2 bg-red-50 rounded">{error}</div>
                )}

                {/* Activity Types */}
                <div className="p-2">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Activity Types</h3>
                    <hr />
                    {loading.activityTypes ? (
                        <div className="mt-2 text-sm text-gray-500">Loading...</div>
                    ) : (
                        <ul className="mt-2 space-y-2">
                            {activityTypes.map((type) => (
                                <li
                                    key={`type-${type.at_id}`}
                                    className={`flex items-center justify-between hover:bg-gray-100 px-2 py-1 rounded cursor-pointer ${selectedActivityType === type.at_id ? 'bg-gray-100' : ''}`}
                                    onClick={() => setSelectedActivityType(type.at_id)}
                                >
                                    <span className="truncate">{type.name}</span>
                                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Pinned Activities */}
                {selectedActivityType && (
                    <div className="p-2">
                        <h3 className="text-sm font-medium text-gray-500 mb-3">Pinned Activities</h3>
                        <hr />
                        {loading.pinnedActivities ? (
                            <div className="mt-2 text-sm text-gray-500">Loading...</div>
                        ) : (
                            <ul className="mt-2 space-y-2">
                                {pinnedActivities.map((activity) => (
                                    <li
                                        key={`pinned-${activity.a_id}`}
                                        className={`flex items-center justify-between hover:bg-gray-100 px-2 py-1 rounded cursor-pointer ${selectedPinnedActivity === activity.a_id ? 'bg-gray-100' : ''}`}
                                        onClick={() => handlePinnedActivityClick(activity)}
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
                {activeActivity && (
                    <div className="p-2">
                        <h3 className="text-sm font-medium text-gray-500 mb-3">Activity Items</h3>
                        <hr />
                        {loading.activityItems ? (
                            <div className="mt-2 text-sm text-gray-500">Loading...</div>
                        ) : (
                            <ul className="mt-2 space-y-2">
                                {activityItems.map((item) => (
                                    <li
                                        key={`item-${item.a_id}`}
                                        className="flex items-center justify-between hover:bg-gray-100 px-2 py-1 rounded cursor-pointer"
                                        onClick={() => handleActivityItemClick(item)}
                                    >
                                        <span className="truncate">{item.name}</span>
                                        <ChevronRight className="w-4 h-4 flex-shrink-0" />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
            {/* Main Content */}
            <div className={`flex-1 p-6 overflow-auto ${activeActivity ? 'hidden' : ''}`}>
                {/* Breadcrumbs */}
                <div className="flex items-center text-sm text-gray-500 mb-4">
                    {selectedActivityType && (
                        <span className="text-black">
                            {activityTypes.find(t => t.at_id === selectedActivityType)?.name}
                        </span>
                    )}
                    {selectedPinnedActivity && (
                        <>
                            <span className="mx-2">/</span>
                            <span className="text-black">
                                {pinnedActivities.find(a => a.a_id === selectedPinnedActivity)?.name}
                            </span>
                        </>
                    )}
                </div>
                {selectedActivityType && (
                    <div className="p-4">
                        {loading.userActivities ? (
                            // 🔄 Loading Spinner
                            <div className="flex justify-center items-center h-40">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500" />
                            </div>
                        ) : userActivities && Array.isArray(userActivities) && userActivities.length > 0 ? (
                            // ✅ Actual content
                            <div className="grid grid-cols-3 gap-4">
                                {userActivities.map((activity) => (
                                    <div
                                        key={activity.ua_id}
                                        className="bg-white rounded-xl shadow relative overflow-hidden group p-4"
                                        onClick={() => setActiveActivity(activity)}
                                    >
                                        <div className="aspect-square bg-gray-100 relative rounded-t-xl overflow-hidden">
                                            <Trash2Icon
                                                className="w-4 h-4 text-red-500 opacity-50 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer absolute top-2 right-2 z-10"
                                                onClick={() => handleDeleteData(activity)}
                                            />

                                            {(() => {
                                                const key = (activity.name || activity.description || "").toLowerCase();
                                                const image = activityImageMap[key];

                                                return image ? (
                                                    <img
                                                        src={image}
                                                        alt={key}
                                                        className="absolute inset-0 w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full w-full text-4xl text-gray-300">📋</div>
                                                );
                                            })()}
                                        </div>

                                        <div className="p-2 text-md font-bold text-center truncate">
                                            {activity.description || activity.name || 'Unnamed'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // ❌ No activities fallback
                            <div className="text-center text-sm text-gray-500">No activities found.</div>
                        )}
                    </div>
                )}
            </div>
            {/* Maximized Item Modal */}
            {maximizedItem && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 relative max-h-[90vh] flex flex-col">
                        <button
                            onClick={() => setMaximizedItem(null)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-black"
                        >
                            ✕
                        </button>

                        <div className="flex items-center justify-between border-b pb-2 mb-4">
                            <span className="text-xl font-bold truncate">
                                {maximizedItem.description}
                            </span>
                        </div>

                        <div className="flex-1 overflow-auto mb-4">
                            <WordpadEditor
                                content={maximizedItem.description}
                                onSave={(updatedHtml) => {
                                    // Handle save logic here
                                    setMaximizedItem(null);
                                }}
                                onVoiceInput={(transcript) => {
                                    // Handle voice input
                                }}
                            />
                        </div>

                        <div className="flex justify-between items-center border-t pt-4">
                            <div className="text-sm text-gray-500">
                                {new Date(maximizedItem.event_time).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showMealDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg space-y-4">
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
                                onClick={() => setShowMealDialog(false)}
                                className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateMeal}
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <AnimatePresence>
                {activeActivity && (
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="fixed top-0 right-0 h-full w-full sm:w-[calc(100%-16rem)] bg-white z-50 shadow-xl overflow-y-auto p-6"
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
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Meal</label>
                                <input
                                    type="text"
                                    value={activeActivity.name || ""}
                                    readOnly
                                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-2">Food items</h3>
                                <div className="space-y-4">
                                    {foodItems.length > 0 ? (
                                        foodItems.map((item) => {
                                            const selectedUnit = item.cat_qty_id3?.find((u: any) => u?.Selected)?.name || "";

                                            const isEditing = editingItemId === item.ua_id;

                                            return (
                                                <div key={item.ua_id} className="grid grid-cols-6 gap-2 items-center">
                                                    {isEditing ? (
                                                        <>
                                                            <input
                                                                value={editedValues.value2}
                                                                onChange={(e) => setEditedValues({ ...editedValues, value2: e.target.value })}
                                                                className="col-span-3 border border-blue-400 rounded px-2 py-1 text-sm focus:outline-none"
                                                            />
                                                            <input
                                                                value={editedValues.value3}
                                                                onChange={(e) => setEditedValues({ ...editedValues, value3: e.target.value })}
                                                                className="col-span-1 border border-blue-400 rounded px-2 py-1 text-sm focus:outline-none"
                                                            />
                                                            <input
                                                                value={selectedUnit}
                                                                readOnly
                                                                className="col-span-1 border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100"
                                                            />
                                                            <button
                                                                className="text-green-600 hover:text-green-800 text-sm"
                                                                title="Save"
                                                                onClick={() => handleUpdateFoodItem(item, editedValues)}
                                                            >
                                                                <SquareCheck className="h-5 w-5" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <input
                                                                value={item.value2 || "Unnamed"}
                                                                readOnly
                                                                className="col-span-3 border border-gray-300 rounded px-2 py-1 text-sm"
                                                            />
                                                            <input
                                                                value={item.value3 || ""}
                                                                readOnly
                                                                className="col-span-1 border border-gray-300 rounded px-2 py-1 text-sm"
                                                            />
                                                            <input
                                                                value={selectedUnit}
                                                                readOnly
                                                                className="col-span-1 border border-gray-300 rounded px-2 py-1 text-sm"
                                                            />
                                                            <button
                                                                className="text-gray-500 hover:text-black text-sm"
                                                                title="Edit"
                                                                onClick={() => {
                                                                    setEditingItemId(item.ua_id);
                                                                    setEditedValues({
                                                                        value2: item.value2 || '',
                                                                        value3: item.value3 || '',
                                                                    });
                                                                }}
                                                            >
                                                                <Pencil className="h-5 w-5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-sm text-gray-400">No food items found.</div>
                                    )}

                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {showFoodform && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-60 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg space-y-4">
                        <FoodItemForm
                            userId={getUserId()}
                            cat_qty_id1={activeActivity?.collective_id}
                            cat_qty_id2={348}
                            collective_id={activeActivity?.collective_id ?? 123}
                            onClose={() => {
                                setshowFoodform(false);
                                fetchFoodItems();
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default ActivityPage;