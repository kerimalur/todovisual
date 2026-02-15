'use client';

import { useMotivationStore } from '@/store';
import { Flame } from 'lucide-react';

export function MotivationToast() {
  const { showToast, currentMessage, hideToast } = useMotivationStore();

  if (!showToast) return null;

  return (
    <div 
      className={`
        fixed bottom-24 right-8 z-50
        max-w-sm
        animate-in slide-in-from-right-5 fade-in duration-300
      `}
    >
      <div className="bg-[var(--text-primary)] text-white rounded-xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
              <Flame size={20} className="text-orange-400" />
            </div>
            <div className="flex-1 pt-1">
              <p className="text-sm font-medium leading-relaxed">
                {currentMessage}
              </p>
            </div>
          </div>
        </div>
        
        {/* Progress bar for auto-dismiss */}
        <div className="h-1 bg-gray-700">
          <div 
            className="h-full bg-orange-500 animate-shrink"
            style={{
              animation: 'shrink 4s linear forwards'
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
