/**
 * Chart Components for Data Visualization
 *
 * Provides reusable chart components for dashboard analytics.
 * Uses simple SVG-based charts for better performance and no external dependencies.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@truths/ui';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface LineChartDataPoint {
  label: string;
  value: number;
  date?: string;
}

export interface ChartProps {
  data: ChartDataPoint[];
  title?: string;
  height?: number;
  className?: string;
}

/**
 * Simple Bar Chart Component
 */
export function BarChart({ data, title, height = 200, className = '' }: ChartProps) {
  const maxValue = data.length > 0 ? Math.max(...data.map(d => d.value)) : 0;
  const chartHeight = height - 40; // Account for padding

  if (data.length === 0) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle className="text-lg">{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div style={{ height }} className="w-full flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div style={{ height }} className="w-full">
          <svg width="100%" height={chartHeight} className="overflow-visible">
            {data.map((item, index) => {
              const barHeight = maxValue > 0 ? (item.value / maxValue) * (chartHeight - 20) : 0;
              const barWidth = Math.max(20, (100 / data.length) - 2);
              const x = (index * 100) / data.length;
              const y = chartHeight - barHeight - 20;

              return (
                <g key={item.label}>
                  {/* Bar */}
                  <rect
                    x={`${x}%`}
                    y={y}
                    width={`${barWidth}%`}
                    height={barHeight}
                    fill={item.color || `hsl(${(index * 360) / data.length}, 70%, 50%)`}
                    className="transition-all hover:opacity-80"
                  />
                  {/* Value label */}
                  <text
                    x={`${x + barWidth / 2}%`}
                    y={y - 5}
                    textAnchor="middle"
                    className="text-xs fill-muted-foreground"
                  >
                    {item.value}
                  </text>
                  {/* Axis label */}
                  <text
                    x={`${x + barWidth / 2}%`}
                    y={chartHeight}
                    textAnchor="middle"
                    className="text-xs fill-muted-foreground"
                    transform={`rotate(45, ${x + barWidth / 2}%, ${chartHeight})`}
                  >
                    {item.label.length > 10 ? `${item.label.slice(0, 10)}...` : item.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Simple Line Chart Component
 */
export interface LineChartProps {
  data: LineChartDataPoint[];
  title?: string;
  height?: number;
  color?: string;
  className?: string;
}

export function LineChart({
  data,
  title,
  height = 200,
  color = '#3b82f6',
  className = ''
}: LineChartProps) {
  const values = data.map(d => d.value);
  const maxValue = values.length > 0 ? Math.max(...values) : 0;
  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const chartHeight = height - 40;
  const chartWidth = 100;
  
  if (data.length === 0) {
    return (
        <Card className={className}>
            {title && (
                <CardHeader>
                    <CardTitle className="text-lg">{title}</CardTitle>
                </CardHeader>
            )}
            <CardContent>
                <div style={{ height }} className="w-full flex items-center justify-center text-muted-foreground">
                    No data available
                </div>
            </CardContent>
        </Card>
    );
  }

  // Handle single data point or flat line
  const valueRange = maxValue - minValue;
  const effectiveRange = valueRange === 0 ? 1 : valueRange; // Prevent division by zero
  
  // Create path for the line
  const pathData = data.length > 1 ? data.map((point, index) => {
    const x = (index / (data.length - 1)) * chartWidth;
    // If range is 0 (all values same), center the line vertically
    const normalizedValue = valueRange === 0 ? 0.5 : (point.value - minValue) / effectiveRange;
    const y = chartHeight - (normalizedValue * (chartHeight - 20)) - 10;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ') : `M 0 ${chartHeight / 2} L 100 ${chartHeight / 2}`; // Default line if 1 point

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div style={{ height }} className="w-full">
          <svg width="100%" height={chartHeight} className="overflow-visible">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
              const y = chartHeight - (ratio * (chartHeight - 30)) - 10;
              return (
                <g key={ratio}>
                  <line
                    x1="0"
                    y1={y}
                    x2="100%"
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                  <text
                    x="-5"
                    y={y + 3}
                    textAnchor="end"
                    className="text-xs fill-muted-foreground"
                  >
                    {Math.round(minValue + (effectiveRange * ratio))}
                  </text>
                </g>
              );
            })}

            {/* Line */}
            {data.length > 0 && (
                <path
                d={pathData}
                fill="none"
                stroke={color}
                strokeWidth="2"
                className="transition-all"
                />
            )}

            {/* Data points */}
            {data.map((point, index) => {
              const x = data.length > 1 ? (index / (data.length - 1)) * chartWidth : 50; // Center if single point
              const normalizedValue = valueRange === 0 ? 0.5 : (point.value - minValue) / effectiveRange;
              const y = chartHeight - (normalizedValue * (chartHeight - 20)) - 10;

              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="4"
                  fill={color}
                  className="hover:r-6 transition-all cursor-pointer"
                >
                    <title>{point.label}: {point.value}</title>
                </circle>
              );
            })}

            {/* X-axis labels */}
            {data.filter((_, index) => index % Math.ceil(Math.max(1, data.length / 5)) === 0).map((point, index) => {
              const realIndex = data.indexOf(point);
              const x = data.length > 1 ? (realIndex / (data.length - 1)) * chartWidth : 50;
              return (
                <text
                  key={index}
                  x={x}
                  y={chartHeight + 10}
                  textAnchor="middle"
                  className="text-xs fill-muted-foreground"
                >
                  {point.label.length > 8 ? `${point.label.slice(0, 8)}...` : point.label}
                </text>
              );
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Simple Pie Chart Component
 */
export interface PieChartProps {
  data: ChartDataPoint[];
  title?: string;
  height?: number;
  className?: string;
}

export function PieChart({ data, title, height = 200, className = '' }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = Math.min(height / 2 - 20, 80);
  const centerX = height / 2;
  const centerY = height / 2;

  let currentAngle = -90; // Start from top

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div style={{ height }} className="w-full flex items-center justify-center">
          <svg width={height} height={height}>
            {data.map((item, index) => {
              const percentage = item.value / total;
              const angle = percentage * 360;
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;

              const startAngleRad = (startAngle * Math.PI) / 180;
              const endAngleRad = (endAngle * Math.PI) / 180;

              const x1 = centerX + radius * Math.cos(startAngleRad);
              const y1 = centerY + radius * Math.sin(startAngleRad);
              const x2 = centerX + radius * Math.cos(endAngleRad);
              const y2 = centerY + radius * Math.sin(endAngleRad);

              const largeArcFlag = angle > 180 ? 1 : 0;

              const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ');

              currentAngle = endAngle;

              const color = item.color || `hsl(${(index * 360) / data.length}, 70%, 50%)`;

              return (
                <path
                  key={item.label}
                  d={pathData}
                  fill={color}
                  className="hover:opacity-80 transition-all cursor-pointer"
                />
              );
            })}

            {/* Center label */}
            <text
              x={centerX}
              y={centerY - 5}
              textAnchor="middle"
              className="text-sm font-semibold"
            >
              Total
            </text>
            <text
              x={centerX}
              y={centerY + 15}
              textAnchor="middle"
              className="text-lg font-bold"
            >
              {total}
            </text>
          </svg>

          {/* Legend */}
          <div className="ml-6 space-y-2">
            {data.map((item, index) => (
              <div key={item.label} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: item.color || `hsl(${(index * 360) / data.length}, 70%, 50%)`
                  }}
                />
                <span className="text-sm text-muted-foreground">
                  {item.label}: {item.value} ({((item.value / total) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Progress Ring Component (for single metric visualization)
 */
export interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  label?: string;
  className?: string;
}

export function ProgressRing({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  showPercentage = true,
  label,
  className = ''
}: ProgressRingProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {showPercentage && (
        <div className="text-center mt-2">
          <div className="text-2xl font-bold">{Math.round(percentage)}%</div>
          {label && <div className="text-sm text-muted-foreground">{label}</div>}
        </div>
      )}
    </div>
  );
}
