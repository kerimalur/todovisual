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
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="p-2 rounded-lg bg-indigo-100">
            <MoveRight size={16} className="text-indigo-600" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-gray-500 mb-1">
              {itemType === 'task' ? 'Aufgabe' : 'Termin'} verschieben
            </div>
            <div className="font-medium text-gray-800">{itemTitle}</div>
          </div>
        </div>

        {/* Move Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Verschieben als</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMoveType('date')}
              className={`
                flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${moveType === 'date'
                  ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              <Calendar size={16} className="inline mr-2" />
              Nur Datum
            </button>
            <button
              type="button"
              onClick={() => setMoveType('datetime')}
              className={`
                flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${moveType === 'datetime'
                  ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              <Clock size={16} className="inline mr-2" />
              Datum & Uhrzeit
            </button>
          </div>
        </div>

        {/* Date Selection */}
        <div className="space-y-2">
          <label htmlFor="move-date" className="text-sm font-medium text-gray-700">
            Neues Datum
          </label>
          <input
            id="move-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-gray-50"
          />
        </div>

        {/* Time Selection (conditional) */}
        {moveType === 'datetime' && (
          <div className="space-y-2">
            <label htmlFor="move-time" className="text-sm font-medium text-gray-700">
              Uhrzeit
            </label>
            <input
              id="move-time"
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-gray-50"
            />
          </div>
        )}

        {/* Preview */}
        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <div className="text-xs text-indigo-600 font-medium mb-1">Vorschau</div>
          <div className="text-sm text-indigo-900">
            Wird verschoben zu:{' '}
            <span className="font-semibold">
              {format(new Date(selectedDate), 'EEEE, d. MMMM yyyy', { locale: de })}
              {moveType === 'datetime' && selectedTime && (
                <> um {selectedTime} Uhr</>
              )}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          {/* Delete Button */}
          {onDelete && !showDeleteConfirm && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} />
              Löschen
            </Button>
          )}

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-900 font-medium">Wirklich löschen?</span>
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
