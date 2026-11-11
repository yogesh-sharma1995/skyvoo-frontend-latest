import React from "react";
import { AlertTriangle, ArrowRight, TrendingUp, TrendingDown, CheckCircle, X } from "lucide-react";

/**
 * FareAlertModal
 * Modal displayed when the backend FareReview API returns a price change alert (AlertType: FAREALERT).
 *
 * Props:
 *  - open       {boolean}  - Modal visibility state
 *  - oldFare    {number}   - Original flight fare before review
 *  - newFare    {number}   - Updated flight fare after review
 *  - onAccept   {function} - Callback when user accepts the new fare and continues
 *  - onCancel   {function} - Callback when user declines / wants to go back
 */
export default function FareAlertModal({
  open,
  oldFare = 0,
  newFare = 0,
  onAccept,
  onCancel,
}) {
  React.useEffect(() => {
    if (open) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [open]);

  if (!open) return null;

  const numOld = Number(oldFare) || 0;
  const numNew = Number(newFare) || 0;
  const fareDiff = numNew - numOld;
  const isIncrease = fareDiff > 0;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && onCancel) onCancel();
      }}
    >
      <div
        className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-100"
        style={{ animation: "fareModalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
      >
        <style>{`
          @keyframes fareModalIn {
            from { opacity: 0; transform: scale(0.92) translateY(20px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        {/* Top Decorative Header */}
        <div className="bg-[#78080B] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight text-white">Price Change Alert</h3>
              <p className="text-xs text-white/80 font-medium">Airline fare has updated</p>
            </div>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          <p className="text-sm text-slate-600 leading-relaxed">
            The airline has updated the ticket price for your selected flight. Please review the updated fare before continuing with your booking.
          </p>

          {/* Fare Comparison Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
              {/* Old Fare */}
              <div className="flex-1 text-center">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                  Original Fare
                </span>
                <span className="text-base font-bold text-slate-400 line-through">
                  ₹ {Math.ceil(numOld).toLocaleString("en-IN")}
                </span>
              </div>

              {/* Arrow */}
              <div className="shrink-0 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-slate-200/80 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                </div>
              </div>

              {/* New Fare */}
              <div className="flex-1 text-center">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#78080B] block mb-1">
                  Updated Fare
                </span>
                <span className="text-lg font-extrabold text-[#78080B]">
                  ₹ {Math.ceil(numNew).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Difference Pill */}
            {fareDiff !== 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-center justify-center gap-1.5 text-xs font-semibold">
                {isIncrease ? (
                  <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                    <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                    Increased by ₹ {Math.ceil(Math.abs(fareDiff)).toLocaleString("en-IN")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                    Decreased by ₹ {Math.ceil(Math.abs(fareDiff)).toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 text-center">
            Do you want to continue booking with the updated price?
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition cursor-pointer text-center flex items-center justify-center"
            >
              Choose Another Flight
            </button>
            <button
              type="button"
              onClick={onAccept}
              className="flex-1 py-3 px-4 rounded-xl bg-[#78080B] hover:bg-[#600608] active:bg-[#4d0506] text-white font-semibold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-center whitespace-nowrap"
            >
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Continue with New Price</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
