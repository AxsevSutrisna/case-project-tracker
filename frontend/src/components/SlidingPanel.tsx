import React from 'react';
import { X } from 'lucide-react';

interface SlidingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const SlidingPanel: React.FC<SlidingPanelProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
        isOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
      }`}
    >
      {/* Dark backdrop */}
      <div
        className={`absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Slide-over panel container */}
      <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
        <div
          className={`w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-850 flex items-center justify-between shrink-0">
            <h2 className="text-[20px] font-bold text-slate-100">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
