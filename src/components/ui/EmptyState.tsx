'use client';

import { 
  CheckCircle2, 
  FileText, 
  Calendar, 
  Target, 
  ListTodo, 
  Inbox,
  Search,
  FolderOpen,
  Sparkles
} from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  type?: 'tasks' | 'goals' | 'calendar' | 'notes' | 'search' | 'folder' | 'completed' | 'default';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const icons = {
  tasks: ListTodo,
  goals: Target,
  calendar: Calendar,
  notes: FileText,
  search: Search,
  folder: FolderOpen,
  completed: CheckCircle2,
  default: Inbox,
};

const colors = {
  tasks: { bg: 'bg-indigo-100', icon: 'text-indigo-600' },
  goals: { bg: 'bg-emerald-100', icon: 'text-emerald-600' },
  calendar: { bg: 'bg-blue-100', icon: 'text-blue-600' },
  notes: { bg: 'bg-amber-100', icon: 'text-amber-600' },
  search: { bg: 'bg-gray-100', icon: 'text-gray-700' },
  folder: { bg: 'bg-purple-100', icon: 'text-purple-600' },
  completed: { bg: 'bg-emerald-100', icon: 'text-emerald-600' },
  default: { bg: 'bg-gray-100', icon: 'text-gray-700' },
};

export function EmptyState({
  type = 'default',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  const Icon = icons[type];
  const color = colors[type];

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      {/* Decorative elements */}
      <div className="relative mb-6">
        <div className={`w-20 h-20 rounded-2xl ${color.bg} flex items-center justify-center`}>
          <Icon size={36} className={color.icon} />
        </div>
        {type === 'completed' && (
          <div className="absolute -top-1 -right-1">
            <Sparkles size={20} className="text-amber-500" />
          </div>
        )}
      </div>

      {/* Text */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-700 max-w-sm mb-6">{description}</p>
      )}

      {/* Action */}
      {action && (
        <Button onClick={action.onClick} size="md">
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Preset Empty States
export function TasksEmptyState({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      type="tasks"
      title="Keine Aufgaben"
      description="Erstelle deine erste Aufgabe und beginne produktiv zu sein."
      action={onAdd ? { label: 'Aufgabe erstellen', onClick: onAdd } : undefined}
    />
  );
}

export function GoalsEmptyState({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      type="goals"
      title="Keine Ziele definiert"
      description="Setze dir ein Ziel und arbeite Schritt für Schritt darauf hin."
      action={onAdd ? { label: 'Ziel erstellen', onClick: onAdd } : undefined}
    />
  );
}

export function SearchEmptyState({ query }: { query: string }) {
  return (
    <EmptyState
      type="search"
      title="Keine Ergebnisse"
      description={`Keine Treffer für "${query}". Versuche andere Suchbegriffe.`}
    />
  );
}

export function CompletedEmptyState() {
  return (
    <EmptyState
      type="completed"
      title="Alles erledigt!"
      description="Du hast alle Aufgaben abgeschlossen. Zeit für eine Pause."
    />
  );
}
