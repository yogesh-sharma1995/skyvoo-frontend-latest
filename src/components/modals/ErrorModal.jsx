import React from "react";
import { XCircle, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

/**
 * Reusable error/success/warning modal.
 *
 * Props:
 *  - open        {boolean}  — controls visibility
 *  - onClose     {function} — called when user dismisses
 *  - title       {string}   — heading text  (default: "Something went wrong")
 *  - message     {string}   — full error/success body
 *  - type        {string}   — "error" | "success" | "warning" | "pending" (default: "error")
 *  - buttonText  {string}   — primary button text
 *  - onAction    {function} — optional secondary action handler
 *  - actionText  {string}   — optional secondary action text
 */
const ErrorModal = ({
  open,
  onClose,
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  type = "error",
  buttonText,
  onAction,
  actionText,
}) => {
  if (!open) return null;

  const isSuccess = type === "success";
  const isWarning = type === "warning" || type === "pending";
  const isError = !isSuccess && !isWarning;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
        style={{ animation: "errModalIn 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        <style>{`
          @keyframes errModalIn {
            from { opacity: 0; transform: scale(0.92) translateY(20px); }
            to   { opacity: 1; transform: scale(1)    translateY(0);    }
          }
        `}</style>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 pt-5 pb-6">
          {/* Icon + title + close */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              {isSuccess ? (
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
              ) : isWarning ? (
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5 text-[#78080B]" />
                </div>
              )}
              <h2 className="text-base font-bold text-slate-800 leading-snug">
                {title}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="shrink-0 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              aria-label="Close modal"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Full message — no truncation */}
          <p className="text-sm text-slate-600 leading-relaxed break-words bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
            {message}
          </p>

          {/* Action buttons */}
          <div className="mt-5 flex gap-2">
            {onAction && actionText && (
              <button
                onClick={onAction}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-all duration-200 cursor-pointer text-sm"
              >
                {actionText}
              </button>
            )}
            <button
              onClick={onClose}
              className={`flex-1 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 cursor-pointer text-sm ${
                isSuccess
                  ? "bg-green-600 hover:bg-green-700"
                  : isWarning
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-[#78080B] hover:bg-[#a01014]"
              }`}
            >
              {buttonText || (isError ? "Dismiss" : "Got it")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
