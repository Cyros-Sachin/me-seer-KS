'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Calendar, CheckCircle2 } from 'lucide-react';

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const mealData = {
  Mon: {
    breakfast: { name: 'Breakfast Sandwich', time: '8:00AM', calories: 420, protein: 18, carbs: 45, fats: 20 },
    lunch: { name: 'Grilled Chicken Bowl', time: '1:00PM', calories: 520, protein: 45, carbs: 25, fats: 18 },
    dinner: { name: 'Paneer Wraps', time: '8:00PM', calories: 380, protein: 22, carbs: 35, fats: 15 },
  },
  Tue: {
    breakfast: { name: 'Breakfast Smoothie', time: '8:00AM', calories: 350, protein: 20, carbs: 40, fats: 12 },
    lunch: { name: 'Grilled Chicken Bowl', time: '1:00PM', calories: 520, protein: 45, carbs: 25, fats: 18 },
    dinner: { name: 'Creamy Spinach Pasta', time: '7:30PM', calories: 450, protein: 18, carbs: 55, fats: 16 },
  },
  // Add more days as needed...
};

const getDayProgress = (day: string) => {
  const meals = mealData[day as keyof typeof mealData];
  if (!meals) return { calories: 0, protein: 0, carbs: 0, fats: 0 };
  
  return Object.values(meals).reduce((total, meal) => ({
    calories: total.calories + meal.calories,
    protein: total.protein + meal.protein,
    carbs: total.carbs + meal.carbs,
    fats: total.fats + meal.fats,
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
};

const CircularProgress = ({ value, max, color, size = 80 }: { 
  value: number; 
  max: number; 
  color: string; 
  size?: number;
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-gray-900">{value}</span>
        <span className="text-xs text-gray-500">Calories</span>
      </div>
    </div>
  );
};

export default function WeeklyMeals() {
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Your Meals This Week
        </CardTitle>
        <p className="text-sm text-gray-600">Track your eating patterns and meal consistency</p>
      </CardHeader>
      <CardContent>
        {/* Meal Details for Selected Day */}
        {mealData[selectedDay as keyof typeof mealData] && (
          <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">{selectedDay} Meal Plan</h3>
            <div className="space-y-3">
              {Object.entries(mealData[selectedDay as keyof typeof mealData]).map(([mealType, meal]) => (
                <div 
                  key={mealType}
                  className="flex justify-between items-center p-3 bg-white rounded-lg border border-blue-100 transition-all duration-200 hover:shadow-md"
                >
                  <div>
                    <h4 className="font-medium text-gray-900 capitalize">{mealType}</h4>
                    <p className="text-sm text-gray-600">{meal.name} • {meal.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{meal.calories} cal</p>
                    <p className="text-xs text-gray-500">
                      P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fats}g
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Progress Circles */}
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day) => {
            const progress = getDayProgress(day);
            const isSelected = selectedDay === day;
            const isHovered = hoveredDay === day;
            
            return (
              <div 
                key={day}
                className={`text-center transition-all duration-300 cursor-pointer ${
                  isSelected ? 'transform scale-110' : ''
                } ${isHovered ? 'transform scale-105' : ''}`}
                onClick={() => setSelectedDay(day)}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <div className="mb-2">
                  <CircularProgress
                    value={progress.calories}
                    max={2000}
                    color={isSelected ? '#3B82F6' : '#10B981'}
                    size={isSelected ? 90 : 80}
                  />
                </div>
                <p className={`text-sm font-medium transition-colors duration-200 ${
                  isSelected ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {day}
                </p>
                {progress.calories > 0 && (
                  <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto mt-1" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}