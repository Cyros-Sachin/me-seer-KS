'use client';

import { useState } from 'react';
import {
  Heart,
  Dumbbell,
  DollarSign,
  Target,
  BarChart3,
  Calendar,
  Clock,
  TrendingUp,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import NutritionChart from '../components/dashboard/NutrionChart';
import WeeklyMeals from '../components/dashboard/WeeklyMeals';
import NutrientBreakdown from '../components/dashboard/NutrionBreakdown';
import UpcomingMeals from '../components/dashboard/UpcomingMeals';
import { useRouter } from 'next/navigation';
const menuItems = [
  { id: 'consume', label: 'Consume', icon: Heart, isActive: true },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell, isActive: false },
  { id: 'finance', label: 'Finance', icon: DollarSign, isActive: false },
  { id: 'goals', label: 'Goals', icon: Target, isActive: false },
];

const nutritionStats = [
  { label: 'Avg Calories', value: '1600', unit: 'kcal', progress: 80, color: '#3b82f6' },
  { label: 'Avg Protein', value: '120.5', unit: 'g', progress: 75, color: '#10b981' },
  { label: 'Avg Fats', value: '60.70', unit: 'g', progress: 68, color: '#facc15' },
  { label: 'Avg Carbs', value: '230.40', unit: 'g', progress: 90, color: '#8b5cf6' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overall');
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200 inline-flex">
          <ArrowLeft
            className="w-5 h-5 transform mr-2 cursor-pointer hover:text-gray-600 transition-colors mt-1"
            onClick={() => router.push('/')}
          />
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 hover:bg-gray-100 ${item.isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-600'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Consume</h2>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-md grid-cols-4 lg:grid-cols-4">
              <TabsTrigger value="overall">Overall</TabsTrigger>
              <TabsTrigger value="current">Current</TabsTrigger>
              <TabsTrigger value="meals">Meals</TabsTrigger>
              <TabsTrigger value="records">Records</TabsTrigger>
            </TabsList>

            <TabsContent value="overall" className="space-y-8">
              {/* Nutrition Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {nutritionStats.map((stat, index) => (
                  <Card
                    key={stat.label}
                    className={`transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer border-l-4 ${hoveredStat === stat.label ? 'scale-105' : ''
                      }`}
                    style={{ borderLeftColor: stat.color.replace('bg-', '#') }}
                    onMouseEnter={() => setHoveredStat(stat.label)}
                    onMouseLeave={() => setHoveredStat(null)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        {stat.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900 mb-2">
                        {stat.value}
                        <span className="text-sm font-normal text-gray-500 ml-1">
                          {stat.unit}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Progress
                          value={stat.progress}
                          className="h-2"
                          style={{
                            background: `linear-gradient(to right, ${stat.color.replace('bg-', '')} 0%, ${stat.color.replace('bg-', '')} ${stat.progress}%, #e5e7eb ${stat.progress}%, #e5e7eb 100%)`
                          }}
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{stat.progress}%</span>
                          <span>{Math.round((2000 * stat.progress) / 100)} {stat.unit} left</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Main Dashboard Grid */}
              <div className="grid grid-cols-1">
                {/* Nutrition Chart - Takes 2 columns */}
                <div className=" space-y-6">
                  <NutritionChart />
                  <WeeklyMeals />
                </div>


              </div>
            </TabsContent>

            <TabsContent value="current">
              <Card>
                <CardHeader>
                  <CardTitle>Current Day Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Today's nutrition tracking and real-time updates.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="meals">
              <Card>
                <CardHeader>
                  <CardTitle>Meal Planning</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Plan and manage your daily meals.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="records">
              <Card>
                <CardHeader>
                  <CardTitle>Nutrition Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">View your complete nutrition history and trends.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {/* Right Sidebar */}
      <div className="w-80 border-l bg-white p-6 overflow-y-auto space-y-8 shadow-inner">
        <div className="mb-8 p-2">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Progress Analytics</h2>
        </div>
        <div className="space-y-6">
          <NutrientBreakdown />
          <UpcomingMeals />
        </div>
      </div>
    </div>
  );
}