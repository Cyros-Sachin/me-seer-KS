'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChartNoAxesColumnIncreasing, GitGraph, TrendingUp, TrendingUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
const chartData = [
  { date: 'Feb 14', fats: 45, protein: 55, carbs: 40 },
  { date: 'Feb 15', fats: 52, protein: 48, carbs: 65 },
  { date: 'Feb 16', fats: 38, protein: 45, carbs: 45 },
  { date: 'Feb 17', fats: 60, protein: 52, carbs: 25 },
  { date: 'Feb 18', fats: 42, protein: 58, carbs: 55 },
  { date: 'Feb 19', fats: 55, protein: 45, carbs: 50 },
  { date: 'Feb 20', fats: 48, protein: 62, carbs: 45 },
];

const nutrients = [
  { key: 'fats', label: 'Fats', color: '#10B981', visible: true },
  { key: 'protein', label: 'Protein', color: '#3B82F6', visible: true },
  { key: 'carbs', label: 'Carbs', color: '#F59E0B', visible: true },
];

const timeRanges = ['7D', '28D', '3M', '1Y', 'Max'];
const chartTypes = ['line', 'bar'];

export default function NutritionChart() {
  const [visibleLines, setVisibleLines] = useState(
    nutrients.reduce((acc, nutrient) => ({ ...acc, [nutrient.key]: true }), {} as Record<string, boolean>)
  );
  const [timeRange, setTimeRange] = useState('7D');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  const toggleLine = (key: string) => {
    setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const router = useRouter();
  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Title */}
        <div>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Nutrition Trends
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Track your daily nutrient intake over time
          </p>
        </div>

        {/* Filter + Chart Type */}
        <div className="flex items-center gap-2">
          {/* Time Range */}
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2 py-1 text-sm rounded-md border transition ${
                timeRange === range
                  ? 'bg-blue-400 text-white border-blue-400'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
              }`}
            >
              {range}
            </button>
          ))}

          {/* Chart Type Toggle */}
          {chartTypes.map((type) => (
            <button
              key={type}
              onClick={() => setChartType(type as 'line' | 'bar')}
              className={`px-2 py-1 text-sm rounded-md border transition ${
                chartType === type
                  ? 'bg-gray-200 text-gray-600 border-gray-100'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
              }`}
            >
              {type === 'line' ?<TrendingUpDown/> : <ChartNoAxesColumnIncreasing/>}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6">
          {nutrients.map((nutrient) => (
            <button
              key={nutrient.key}
              onClick={() => toggleLine(nutrient.key)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 ${
                visibleLines[nutrient.key]
                  ? 'bg-white border-2 shadow-sm'
                  : 'bg-gray-100 text-gray-400'
              }`}
              style={{
                borderColor: visibleLines[nutrient.key]
                  ? nutrient.color
                  : '#e5e7eb',
              }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: nutrient.color }}
              />
              {nutrient.label}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                }}
              />
              {nutrients.map(
                (nutrient) =>
                  visibleLines[nutrient.key] && (
                    <Line
                      key={nutrient.key}
                      type="monotone"
                      dataKey={nutrient.key}
                      stroke={nutrient.color}
                      strokeWidth={3}
                      dot={{
                        fill: nutrient.color,
                        strokeWidth: 2,
                        stroke: 'white',
                        r: 4,
                      }}
                      activeDot={{
                        r: 8,
                        stroke: nutrient.color,
                        strokeWidth: 2,
                        fill: 'white',
                      }}
                    />
                  )
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
