"use client";
import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

/**
 * Toast Notification Provider. Wraps the app layout.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Add a self-dismissing toast
  const addToast = useCallback((message, type = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 3.5s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastStyles = {
    success: {
      bg: "#ECFDF5",
      border: "rgba(16,185,129,0.2)",
      text: "#065F46",
      icon: <CheckCircle2 size={16} color="#10B981" />
    },
    error: {
      bg: "#FEF2F2",
      border: "rgba(239,68,68,0.2)",
      text: "#991B1B",
      icon: <AlertCircle size={16} color="#EF4444" />
    },
    info: {
      bg: "#EEF2FF",
      border: "rgba(99,102,241,0.2)",
      text: "#3730A3",
      icon: <Info size={16} color="#6366F1" />
    }
  };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      {/* Toast Portal Container */}
      <div style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        maxWidth: 360,
        width: "calc(100% - 48px)",
        pointerEvents: "none"
      }}>
        {toasts.map((toast) => {
          const style = toastStyles[toast.type] || toastStyles.info;
          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: "auto",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 18px",
                background: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: 10,
                color: style.text,
                fontSize: 13,
                fontWeight: 600,
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.03)",
                animation: "toastSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              }}
            >
              {style.icon}
              <div style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: style.text,
                  opacity: 0.6,
                  display: "flex",
                  alignItems: "center",
                  padding: 4
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes toastSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

/**
 * Access the toast function to trigger user alerts
 * @returns {(message: string, type?: "success" | "error" | "info") => void}
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
