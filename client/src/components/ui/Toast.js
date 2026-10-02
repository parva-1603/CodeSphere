import React, { createContext, useContext, useState, useCallback } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import './Toast.css';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, description, type = 'info', duration = 5000 }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type, duration }]);
    
    // Auto remove handled by Radix Toast, but we clean up state
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration + 500); // Buffer for animation
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      <ToastContext.Provider value={{ addToast, dismissToast }}>
        {children}
        
        {toasts.map((toast) => {
          const Icon = {
            success: CheckCircle,
            error: AlertCircle,
            warning: AlertTriangle,
            info: Info
          }[toast.type] || Info;

          return (
            <ToastPrimitive.Root
              key={toast.id}
              className={`toast-root toast-${toast.type}`}
              duration={toast.duration}
              onOpenChange={(open) => {
                if (!open) dismissToast(toast.id);
              }}
            >
              <div className="toast-icon">
                <Icon size={18} />
              </div>
              <div className="toast-content">
                {toast.title && (
                  <ToastPrimitive.Title className="toast-title">
                    {toast.title}
                  </ToastPrimitive.Title>
                )}
                {toast.description && (
                  <ToastPrimitive.Description className="toast-description">
                    {toast.description}
                  </ToastPrimitive.Description>
                )}
              </div>
              <ToastPrimitive.Close className="toast-close" aria-label="Close">
                <X size={14} />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}
        
        <ToastPrimitive.Viewport className="toast-viewport" />
      </ToastContext.Provider>
    </ToastPrimitive.Provider>
  );
};
