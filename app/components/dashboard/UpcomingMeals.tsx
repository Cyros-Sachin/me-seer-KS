'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Clock, Utensils } from 'lucide-react';

const upcomingMeals = [
  {
    id: 1,
    name: 'Breakfast Sandwich',
    time: '8:00 AM',
    type: 'Breakfast',
    ingredients: ['Bread', 'Egg', 'Cheese'],
    nutrition: { calories: 420, protein: 60, fats: 10, carbs: 100 },
    color: 'bg-orange-100 text-orange-800',
  },
  {
    id: 2,
    name: 'Chicken Salad',
    time: '1:00 PM',
    type: 'Lunch',
    ingredients: ['Salad', 'Chicken Breast', 'Egg'],
    nutrition: { calories: 420, protein: 60, fats: 10, carbs: 100 },
    color: 'bg-green-100 text-green-800',
  },
  {
    id: 3,
    name: 'Creamy Chicken & Rice',
    time: '8:00 PM',
    type: 'Dinner',
    ingredients: ['Chicken Breast', 'Rice', 'Spinach', 'Cream'],
    nutrition: { calories: 420, protein: 60, fats: 10, carbs: 100 },
    color: 'bg-blue-100 text-blue-800',
  },
];

export default function UpcomingMeals() {
  const [hoveredMeal, setHoveredMeal] = useState<number | null>(null);

  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Clock className="w-5 h-5 text-green-600" />
          Upcoming Meals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingMeals.map((meal) => (
          <div
            key={meal.id}
            className={`p-4 border border-gray-200 rounded-lg transition-all duration-300 cursor-pointer hover:shadow-md hover:border-gray-300 ${
              hoveredMeal === meal.id ? 'transform scale-105 shadow-lg' : ''
            }`}
            onMouseEnter={() => setHoveredMeal(meal.id)}
            onMouseLeave={() => setHoveredMeal(null)}
          >
            {/* Meal Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{meal.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{meal.time}</span>
                </div>
              </div>
              <Badge className={`${meal.color} border-0`}>
                {meal.type}
              </Badge>
            </div>

            {/* Ingredients */}
            <div className="flex flex-wrap gap-1 mb-3">
              {meal.ingredients.map((ingredient) => (
                <Badge 
                  key={ingredient} 
                  variant="outline" 
                  className="text-xs bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                >
                  {ingredient}
                </Badge>
              ))}
            </div>

            {/* Nutrition Grid */}
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="space-y-1">
                <div className="text-lg font-bold text-gray-900">{meal.nutrition.calories}</div>
                <div className="text-xs text-gray-500">Calories</div>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-blue-600">{meal.nutrition.protein}g</div>
                <div className="text-xs text-gray-500">Protein</div>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-yellow-600">{meal.nutrition.fats}g</div>
                <div className="text-xs text-gray-500">Fats</div>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-green-600">{meal.nutrition.carbs}g</div>
                <div className="text-xs text-gray-500">Carbs</div>
              </div>
            </div>
          </div>
        ))}

        {/* Add Meal Button
        <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-all duration-200 hover:bg-blue-50">
          <div className="flex items-center justify-center gap-2">
            <Utensils className="w-5 h-5" />
            <span className="font-medium">Add New Meal</span>
          </div>
        </button> */}
      </CardContent>
    </Card>
  );
}