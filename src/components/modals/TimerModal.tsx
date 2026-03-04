'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, Select, Button } from '../ui/Modal';
import { useTimerStore, useDataStore } from '@/store';

interface TimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TimerModal({ isOpen, onClose }: TimerModalProps) {
  const { startTimer } = useTimerStore();
  const { tasks } = useDataStore();
  
  const [minutes, setMinutes] = useState('25');
  const [taskId, setTaskId] = useState('');

  const incompleteTasks = tasks.filter(t => t.status !== 'completed');

  useEffect(() => {
    if (isOpen) {
      setMinutes('25');
      setTaskId('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTimer(parseInt(minutes) || 25, taskId || undefined);
    onClose();
  };

  const presetTimes = [15, 25, 45, 60, 90];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Fokus-Timer starten"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Preset Times */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-white/70">
            Schnellauswahl
          </label>
          <div className="flex gap-2 flex-wrap">
            {presetTimes.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => setMinutes(time.toString())}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  minutes === time.toString()
                    ? 'bg-violet-600 text-white'
                    : 'text-white/50 hover:text-white/70'
                }`}
                style={minutes === time.toString()
                  ? {}
                  : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }
                }
              >
                {time} min
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Oder eigene Zeit (Minuten)"
          type="number"
          min="1"
          max="180"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
        />

        <Select
          label="Aufgabe verknüpfen (optional)"
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          options={[
            { value: '', label: 'Keine Aufgabe' },
            ...incompleteTasks.map(t => ({ value: t.id, label: t.title }))
          ]}
        />

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit">
            🎯 Fokus starten
          </Button>
        </div>
      </form>
    </Modal>
  );
}
