import { X } from "lucide-react";
import { C, display, mono } from "../theme";

export function Modal({ isOpen, onClose, title, children, actions }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200"
        style={{ backgroundColor: C.paper, border: `1px solid ${C.line}` }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: C.line }}>
          <h3 className="text-xl font-medium" style={{ ...display, color: C.ink }}>
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/5 transition-colors"
            style={{ color: "rgba(58,42,32,0.6)" }}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 text-sm" style={{ ...mono, color: C.ink }}>
          {children}
        </div>
        
        {actions && (
          <div className="px-6 py-4 flex items-center justify-end gap-3 bg-black/5">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
