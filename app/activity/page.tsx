'use client';
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from 'react';
import { Mic, ChevronRight, ChevronDown, Plus, Edit, Hash, Eye, Repeat, Trash2, Settings, Pencil, CirclePlus, SquareChevronRight, SquareChevronLeft, Maximize2, Trash, Trash2Icon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from "react";
import { WordpadEditor } from "../components/WordpadEditor";

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
    collective_id: number;
    name: string;
};

type UserActivity = {
    ua_id: number;
    user_id: string;
    flag: string;
    at_id: number;
    a_id: number;
    cat_qty_id1?: number;
    value1?: string;
    cat_qty_id2?: number;
    value2?: string;
    cat_qty_id3?: number;
    value3?: string;
    trigger: string;
    is_active: string;
    description: string;
    event_time: string;
};

type Meal = {
    meal_id: number;
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
    getUserActivities: async (user_id: string, at_id: number, pa_id?: number, collective_id?: number): Promise<UserActivity[]> => {
        let url = `${API_BASE_URL}/generic/get-it/${user_id}`;
        if (pa_id !== undefined && collective_id !== undefined) {
            url += `/${pa_id}/${collective_id}`;
        } else if (at_id !== undefined) {
            url += `/${at_id}`;
        }

        const response = await fetch(url, {
            headers: ActivityService.getHeaders()
        });
        return await response.json();
    },

    // Create Meal Activity
    createMealActivity: async (payload: {
        user_id: string;
        meal_name: string;
        type?: string;
        event_time: string;
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
    }
};

function ActivityPage() {
    const router = useRouter();
    const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
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
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [activityAction, setActivityAction] = useState<ActivityAction>(null);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [maximizedItem, setMaximizedItem] = useState<any>(null);
    const [contentMap, setContentMap] = useState<{ [key: string]: string }>({});
    const [editingContentId, setEditingContentId] = useState<string | null>(null);
    const handleActivityItemClick = (item: ActivityItem) => {
        switch (item.name.toLowerCase()) {
            case 'assign meal':
                // setShowAssignMealModal(true);
                console.log(item.name.toLowerCase());
                break;
            case 'food item':
                console.log(item.name.toLowerCase());
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

    useEffect(() => {
        setMounted(true);
    }, []);

    const getUserId = (): string => {
        const userInfo = Cookies.get("userInfo");
        if (!userInfo) throw new Error('User not authenticated');
        return (JSON.parse(userInfo) as UserInfo).user_id;
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
                if (pinned.length > 0) {
                    setSelectedPinnedActivity(pinned[0].collective_id);
                }
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
        if (!selectedActivityType || !selectedPinnedActivity) return;

        const fetchUserActivities = async () => {
            try {
                setLoading(prev => ({ ...prev, userActivities: true }));
                const userId = getUserId();
                const activities = await ActivityService.getUserActivities(
                    userId,
                    selectedActivityType,
                    selectedPinnedActivity,
                    0 // collective_id (adjust as needed)
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
    }, [selectedActivityType, selectedPinnedActivity]);

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
            const now = new Date().toISOString();
            await ActivityService.createMealActivity({
                user_id: userId,
                meal_name: 'New Meal',
                event_time: now
            });

            // Refresh activities
            const activities = await ActivityService.getUserActivities(
                userId,
                selectedActivityType!,
                selectedPinnedActivity!,
                0
            );
            setUserActivities(activities);
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
                selectedPinnedActivity!,
                0
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
                                        key={`pinned-${activity.collective_id}`}
                                        className={`flex items-center justify-between hover:bg-gray-100 px-2 py-1 rounded cursor-pointer ${selectedPinnedActivity === activity.collective_id ? 'bg-gray-100' : ''}`}
                                        onClick={() => setSelectedPinnedActivity(activity.collective_id)}
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
                {selectedActivityType && (
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
            <div className="flex-1 p-6 overflow-auto">
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
                                {pinnedActivities.find(a => a.collective_id === selectedPinnedActivity)?.name}
                            </span>
                        </>
                    )}
                </div>

                {/* Template Data */}
                {loading.templateData && (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500"></div>
                    </div>
                )}

                {Object.keys(templateData).length > 0 && (
                    <div className="bg-white rounded-lg shadow p-4 mb-6">
                        <h3 className="text-lg font-semibold mb-4">Template Data</h3>
                        <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                            {JSON.stringify(templateData, null, 2)}
                        </pre>
                    </div>
                )}

                {/* User Activities */}
                {loading.userActivities ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {userActivities.map(activity => (
                            <div key={activity.ua_id}>
                                {renderActivityItem(activity)}
                            </div>
                        ))}
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
        </div>
    );
}

export default ActivityPage;