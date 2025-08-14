'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Flame } from 'lucide-react';

const nutritionData = [
  { name: 'Fats', value: 35, color: '#EF4444', calories: 637 },
  { name: 'Protein', value: 25, color: '#3B82F6', calories: 455 },
  { name: 'Carbs', value: 40, color: '#10B981', calories: 728 },
];

const totalCalories = nutritionData.reduce((sum, item) => sum + item.calories, 0);

export default function NutrientBreakdown() {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Flame className="w-5 h-5 text-orange-500" />
          Nutrient Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Pie Chart */}
          <div className="h-48 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={nutritionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  onMouseEnter={(_, index) => setHoveredSegment(nutritionData[index].name)}
                  onMouseLeave={() => setHoveredSegment(null)}
                >
                  {nutritionData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      className={`transition-all duration-300 ${
                        hoveredSegment === entry.name ? 'opacity-100' : hoveredSegment ? 'opacity-60' : 'opacity-90'
                      }`}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Center Total Calories */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalCalories.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Calories</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          {nutritionData.map((item) => (
            <div 
              key={item.name}
              className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:bg-gray-50 cursor-pointer ${
                hoveredSegment === item.name ? 'bg-gray-50 scale-102' : ''
              }`}
              onMouseEnter={() => setHoveredSegment(item.name)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-gray-900">{item.name}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{item.value}%</div>
                <div className="text-sm text-gray-500">{item.calories} cal</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}