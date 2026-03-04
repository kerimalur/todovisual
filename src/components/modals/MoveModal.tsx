'use client';

import { useState } from 'react';
import { Modal, Button } from '../ui/Modal';
import { Calendar, Clock, MoveRight, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface MoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (date: Date, hour?: number) => void;
  onDelete?: () => void;
  itemTitle: string;
  itemType: 'task' | 'event';
  currentDate?: Date;
}

export function MoveModal({
  isOpen,
  onClose,
  onMove,
  onDelete,
  itemTitle,
  itemType,
  currentDate
}: MoveModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    currentDate ? format(currentDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  );
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [moveType, setMoveType] = useState<'date' | 'datetime'>('date');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleMove = () => {
    const date = new Date(selectedDate);

    if (moveType === 'datetime' && selectedTime) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
      onMove(date, hours);
    } else {
      date.setHours(0, 0, 0, 0);
      onMove(date);
    }

    onClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Verschieben" size="md">
      <div className="space-y-4">
        {/* Item Info */}
        <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="p-2 rounded-lg" style={{ background: 'rgba(124,58,237,0.15)' }}>
            <MoveRight size={16} className="text-violet-400" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-white/40 mb-1">
              {itemType === 'task' ? 'Aufgabe' : 'Termin'} verschieben
            </div>
            <div className="font-medium text-white">{itemTitle}</div>
          </div>
        </div>

        {/* Move Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">Verschieben als</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMoveType('date')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                moveType === 'date' ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white/70'
              }`}
              style={moveType !== 'date' ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' } : {}}
            >
              <Calendar size={16} className="inline mr-2" />
              Nur Datum
            </button>
            <button
              type="button"
              onClick={() => setMoveType('datetime')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                moveType === 'datetime' ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white/70'
              }`}
              style={moveType !== 'datetime' ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' } : {}}
            >
              <Clock size={16} className="inline mr-2" />
              Datum & Uhrzeit
            </button>
          </div>
        </div>

        {/* Date Selection */}
        <div className="space-y-2">
          <label htmlFor="move-date" className="text-sm font-medium text-white/70">
            Neues Datum
          </label>
          <input
            id="move-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', colorScheme: 'dark' }}
          />
        </div>

        {/* Time Selection (conditional) */}
        {moveType === 'datetime' && (
          <div className="space-y-2">
            <label htmlFor="move-time" className="text-sm font-medium text-white/70">
              Uhrzeit
            </label>
            <input
              id="move-time"
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', colorScheme: 'dark' }}
            />
          </div>
        )}

        {/* Preview */}
        <div className="p-3 rounded-lg" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.20)' }}>
          <div className="text-xs text-violet-400 font-medium mb-1">Vorschau</div>
          <div className="text-sm text-white/70">
            Wird verschoben zu:{' '}
            <span className="font-semibold text-white">
              {format(new Date(selectedDate), 'EEEE, d. MMMM yyyy', { locale: de })}
              {moveType === 'datetime' && selectedTime && (
                <> um {selectedTime} Uhr</>
              )}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Delete Button */}
          {onDelete && !showDeleteConfirm && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-400 hover:bg-red-500/10"
            >
              <Trash2 size={16} />
              Löschen
            </Button>
          )}

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-white font-medium">Wirklich löschen?</span>
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                className="text-sm"
              >
                Ja, löschen
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                className="text-sm"
              >
                Abbrechen
              </Button>
            </div>
          )}

          {/* Move/Cancel Buttons */}
          {!showDeleteConfirm && (
            <div className="flex items-center gap-3 ml-auto">
              <Button type="button" variant="ghost" onClick={onClose}>
                Abbrechen
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleMove}
                disabled={!selectedDate || (moveType === 'datetime' && !selectedTime)}
              >
                <MoveRight size={16} />
                Verschieben
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
