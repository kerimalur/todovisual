'use client';

import { useMemo } from 'react';
import { Flame, Target, Zap, Trophy, TrendingUp, CheckCircle2, Clock, Star } from 'lucide-react';

/* Circular Progress Ring */
interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  showPercentage?: boolean;
  icon?: React.ReactNode;
}

export function CircularProgress({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  color = 'var(--accent-green)',
  label,
  showPercentage = true,
  icon
}: CircularProgressProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.8s ease-out',
          }}
        />
      </svg>
      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {icon && <div className="mb-1">{icon}</div>}
        {showPercentage && (
          <span className="text-2xl font-bold text-[var(--text-primary)]">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
      {label && (
        <span className="mt-2 text-sm text-[var(--text-secondary)]">{label}</span>
      )}
    </div>
  );
}

/* Streak Counter with Fire Animation */
interface StreakCounterProps {
  days: number;
  isActive?: boolean;
}

export function StreakCounter({ days, isActive = true }: StreakCounterProps) {
  return (
    <div className={`
      relative flex items-center gap-3 px-4 py-3 rounded-xl
      ${isActive
        ? 'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200'
        : 'bg-gray-50 border border-gray-200'
      }
    `}>
      <div className={`
        w-12 h-12 rounded-xl flex items-center justify-center
        ${isActive
          ? 'bg-gradient-to-br from-orange-500 to-amber-500'
          : 'bg-gray-300'
        }
      `}>
        <Flame
          size={24}
          className={`text-white ${isActive ? 'animate-pulse-soft' : ''}`}
        />
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-bold ${isActive ? 'text-orange-600' : 'text-gray-400'}`}>
            {days}
          </span>
          <span className={`text-sm ${isActive ? 'text-orange-500' : 'text-gray-400'}`}>
            Tage
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          {isActive ? 'Aktive Streak!' : 'Streak starten'}
        </p>
      </div>
      {isActive && days >= 7 && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center animate-bounce-subtle">
          <Star size={12} className="text-white" />
        </div>
      )}
    </div>
  );
}

/* Weekly Progress Bar Chart */
interface WeeklyProgressProps {
  data: { day: string; completed: number; total: number }[];
}

export function WeeklyProgress({ data }: WeeklyProgressProps) {
  const maxValue = Math.max(...data.map(d => d.total), 1);

  return (
    <div className="p-4 bg-white rounded-xl border border-[var(--border)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <TrendingUp size={16} className="text-[var(--accent-blue)]" />
          Wochenübersicht
        </h3>
      </div>
      <div className="flex items-end justify-between gap-2 h-32">
        {data.map((item, index) => {
          const heightPercent = (item.total / maxValue) * 100;
          const completedPercent = item.total > 0 ? (item.completed / item.total) * 100 : 0;

          return (
            <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full relative rounded-t-md overflow-hidden bg-[var(--border-light)]"
                style={{ height: `${heightPercent}%`, minHeight: '8px' }}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[var(--accent-green)] to-emerald-400 transition-all duration-500"
                  style={{
                    height: `${completedPercent}%`,
                    animationDelay: `${index * 100}ms`
                  }}
                />
              </div>
              <span className="text-xs text-[var(--text-muted)]">{item.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Achievement Badge */
interface AchievementBadgeProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  unlocked: boolean;
  progress?: number;
}

export function AchievementBadge({ icon, title, description, unlocked, progress }: AchievementBadgeProps) {
  return (
    <div className={`
      relative p-4 rounded-xl border transition-all duration-300
      ${unlocked
        ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 shadow-sm'
        : 'bg-gray-50 border-gray-200 opacity-60'
      }
    `}>
      <div className={`
        w-12 h-12 rounded-xl flex items-center justify-center mb-3
        ${unlocked
          ? 'bg-gradient-to-br from-amber-400 to-yellow-500'
          : 'bg-gray-300'
        }
      `}>
        <div className={unlocked ? 'text-white' : 'text-gray-500'}>
          {icon}
        </div>
      </div>
      <h4 className={`font-semibold text-sm ${unlocked ? 'text-amber-800' : 'text-gray-500'}`}>
        {title}
      </h4>
      <p className="text-xs text-[var(--text-muted)] mt-1">{description}</p>

      {!unlocked && progress !== undefined && (
        <div className="mt-3">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 mt-1">{Math.round(progress)}%</span>
        </div>
      )}

      {unlocked && (
        <div className="absolute -top-1 -right-1">
          <CheckCircle2 size={20} className="text-amber-500" fill="white" />
        </div>
      )}
    </div>
  );
}

/* Daily Goal Progress */
interface DailyGoalProgressProps {
  completed: number;
  goal: number;
  label?: string;
}

export function DailyGoalProgress({ completed, goal, label = "Tagesziel" }: DailyGoalProgressProps) {
  const percentage = goal > 0 ? Math.min((completed / goal) * 100, 100) : 0;
  const isCompleted = completed >= goal;

  return (
    <div className={`
      p-4 rounded-xl border transition-all duration-300
      ${isCompleted
        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
        : 'bg-white border-[var(--border)]'
      }
    `}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target size={18} className={isCompleted ? 'text-green-600' : 'text-[var(--text-muted)]'} />
          <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
        </div>
        <span className={`text-sm font-bold ${isCompleted ? 'text-green-600' : 'text-[var(--text-secondary)]'}`}>
          {completed}/{goal}
        </span>
      </div>

      <div className="h-3 bg-[var(--border-light)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden
            ${isCompleted
              ? 'bg-gradient-to-r from-green-500 to-emerald-400'
              : 'bg-gradient-to-r from-[var(--accent-blue)] to-blue-400'
            }
          `}
          style={{ width: `${percentage}%` }}
        >
          {!isCompleted && <div className="absolute inset-0 progress-shimmer" />}
        </div>
      </div>

      {isCompleted && (
        <div className="flex items-center gap-2 mt-3 text-green-600">
          <Trophy size={14} />
          <span className="text-xs font-medium">Geschafft!</span>
        </div>
      )}
    </div>
  );
}

/* Focus Time Display */
interface FocusTimeProps {
  minutes: number;
  target?: number;
}

export function FocusTimeDisplay({ minutes, target = 120 }: FocusTimeProps) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const percentage = (minutes / target) * 100;

  return (
    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
          <Clock size={16} className="text-white" />
        </div>
        <span className="text-sm font-medium text-[var(--text-primary)]">Fokuszeit heute</span>
      </div>

      <div className="flex items-baseline gap-1 mb-3">
        {hours > 0 && (
          <>
            <span className="text-3xl font-bold text-blue-600">{hours}</span>
            <span className="text-sm text-blue-500">h</span>
          </>
        )}
        <span className="text-3xl font-bold text-blue-600">{mins}</span>
        <span className="text-sm text-blue-500">min</span>
      </div>

      <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className="text-xs text-blue-600 mt-2">
        {percentage >= 100 ? 'Tagesziel erreicht!' : `${Math.round(percentage)}% von ${target} min`}
      </p>
    </div>
  );
}

/* Productivity Score */
interface ProductivityScoreProps {
  score: number; // 0-100
  trend?: 'up' | 'down' | 'stable';
  change?: number;
}

export function ProductivityScore({ score, trend = 'stable', change = 0 }: ProductivityScoreProps) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-600';
    if (s >= 60) return 'text-blue-600';
    if (s >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return 'Excellent';
    if (s >= 60) return 'Gut';
    if (s >= 40) return 'Okay';
    return 'Verbesserbar';
  };

  return (
    <div className="p-5 bg-white rounded-xl border border-[var(--border)] relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-muted)] mb-1">Produktivitäts-Score</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}</span>
            <span className="text-lg text-[var(--text-muted)]">/100</span>
          </div>
          <p className={`text-sm font-medium mt-1 ${getScoreColor(score)}`}>
            {getScoreLabel(score)}
          </p>
        </div>

        <div className="flex flex-col items-end">
          <div className={`
            flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
            ${trend === 'up' ? 'bg-green-100 text-green-700' :
              trend === 'down' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-600'}
          `}>
            {trend === 'up' && <TrendingUp size={12} />}
            {trend === 'down' && <TrendingUp size={12} className="rotate-180" />}
            {change !== 0 && <span>{trend === 'up' ? '+' : ''}{change}%</span>}
            {change === 0 && <span>Stabil</span>}
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div
        className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full opacity-10"
        style={{
          background: `conic-gradient(${getScoreColor(score).replace('text-', '')} ${score}%, transparent ${score}%)`
        }}
      />
    </div>
  );
}

/* Mini Stats Card */
interface MiniStatProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color?: string;
  trend?: { value: number; isPositive: boolean };
}

export function MiniStat({ icon, value, label, color = 'var(--accent-blue)', trend }: MiniStatProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[var(--border)] hover:border-[var(--text-muted)] transition-all">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${color}15` }}
      >
        <div style={{ color }}>{icon}</div>
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-[var(--text-primary)]">{value}</span>
          {trend && (
            <span className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
      </div>
    </div>
  );
}
