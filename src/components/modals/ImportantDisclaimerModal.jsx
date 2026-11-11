import React, { useState, useEffect } from "react";
import api from "@/services/api";
import { bookingStore } from "@/store/bookingStore";
import { Loader2, X, AlertCircle } from "lucide-react";

const disclaimerPoints = [
  "You have rechecked all the Details pertaining to traveller’s First Name/ Last Name/ DOB/ Passport Validity as per his Passport /Aadhar Card/ Voter ID or Driving License for domestic & Passport only for international traveller.",
  "Date of Birth is mandatory only in case of international travel or while booking for infant & child up-to 12 Yrs.",
  "Please ensure Passport must have a minimum validity of 6 months from the date of travel in case of International Travel. Roinet shall in no way be held liable for any such boarding denials that may arise due to lack of Validity.",
  "You have checked & the Baggage Policy available in fare rules prior any ticket issuance for onward journeys Domestic & International.",
  "Your international travel, passenger is require to be in possession of valid passport/valid visa/in-transit visa/OTB /entry permits/ Travel Insurance & Vaccine certificates. Roinet shall in no way be held liable for any boarding denials that may arise due to lack of documents required by the immigration/airport authorities.",
  "Passenger should arrive 90 minutes prior for Domestic & 3 hours prior to departure for your international flights for immigration formalities.",
  "Check in counters on all international flights open 2 hours prior to the scheduled departure and close 45 minutes prior to the scheduled departure. Passengers who are not checked in before the closing of the check in counters may be denied boarding by the airline and will be considered to be no shows.",
  "All passengers are requested to confirm the status of the flight with the respective airlines' call centre at least 4 hours prior to scheduled departure, as they may be changed by the airline without any notice to the passenger.",
  "Roinet will not be liable for any claims that may arise due to boarding denial on account of wrongly entered details & late reaching to Airport as per the scheduled departure Or carrying banned items in their Check-in or Hand baggage.",
  "To avail infant fares, the age of the child must be under 24 months throughout the entire itinerary. This includes both onward and return journeys. If the infant is 24 months or above on the return journey, User will be required to make a separate booking using a child fare. Any infants or children must be accompanied by an adult as per the terms of the airlines.",
  "Airlines retains the right to reschedule flight times, route, change or cancel flights or itineraries independent of and without prior intimation to Roinet. As a facilitator Roinet has no control or authority over the logistics of the airlines and therefore is not liable for any loss, direct or incidental, that a User may incur due to such change or cancellation of a flight.",
  "Roinet only acts as a facilitator to enable the User to book a flight ticket. The contract of service for utilization of the flight is always between the User and the concerned airline.",
  "Roinet’s Cancellation service fee up to Rupees 150 per person for Domestic sectors & up to Rupees 300 per person for International sectors will be applicable in case of Cancellation of any confirmed journeys and a flat fees of Rupees 200 will be applicable in case of reissuance of any PNR.",
  "Cancellation charges within the above said limit may vary as per the Airlines or sectors.",
  "Refunds will be processed as per the airline fare rules and cancellation policy. Such refunds shall be subject to Roinet receiving the same from the airlines.",
  "All ticket cancellations made directly with the airline by customer or flight cancelled directly by Airlines due to any such scenario need to be intimated to Roinet by raising an online cancellation request from Roinet’s portal, in order to initiate the process of refund.",
  "Please check Covid related restrictions of the destination Country & City before booking in order to avoid boarding denial by Airlines or Immigration authorities in case the Travel is restricted for some specific nationalities & country.",
];

export default function ImportantDisclaimerModal({
  open,
  onClose,
  onConfirmWallet,
  amount,
  isWalletBookingLoading = false,
  getBookingPayload,
}) {
  const [paymentMode, setPaymentMode] = useState("WALLET"); // "WALLET" | "DEBIT_CARD" | "CREDIT_CARD"
  const [cardNetwork, setCardNetwork] = useState("VISA CARD"); // "VISA CARD" | "MASTER CARD" | "RS CARD"
  const [isPgLoading, setIsPgLoading] = useState(false);
  const [pgError, setPgError] = useState("");

  useEffect(() => {
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

  const handleAcceptAndConfirm = async () => {
    setPgError("");
    if (paymentMode === "WALLET") {
      onConfirmWallet?.();
      return;
    }

    // Capture and save current flight booking payload before PG checkout
    let currentPayload = null;
    if (typeof getBookingPayload === "function") {
      try {
        currentPayload = getBookingPayload();
        if (currentPayload) {
          localStorage.setItem("skyvoo_pending_booking_payload", JSON.stringify(currentPayload));
        }
      } catch (e) {
        console.warn("Failed to capture booking payload:", e);
      }
    }

    // Call Finkeda PG API for Credit Card or Debit Card
    setIsPgLoading(true);

    // Pre-open new tab to avoid browser popup blockers
    let paymentTab = null;
    try {
      paymentTab = window.open("", "_blank");
    } catch (e) {
      console.warn("Could not pre-open new tab:", e);
    }

    try {
      const cardType = paymentMode === "CREDIT_CARD" ? "creditcard" : "debitcard";
      const payload = {
        Amount: Number(amount) || 0,
        CardDetails: {
          CardType: cardType,
          CardNetwork: cardNetwork,
        },
      };

      const res = await api.post("/PG/finkedapayment", payload);
      console.log("[Finkeda PG Response]", res?.data);

      const raw = res?.data;
      const dataObj = raw?.Data || raw?.data || raw;
      const paymentOrderDetails = dataObj?.paymentOrderDetails || dataObj?.PaymentOrderDetails || dataObj;

      const pgTxnId =
        paymentOrderDetails?.PGTransactionId ||
        paymentOrderDetails?.pgTransactionId ||
        dataObj?.PGTransactionId ||
        dataObj?.pgTransactionId ||
        raw?.PGTransactionId;

      if (pgTxnId) {
        bookingStore.set({ pgTransactionId: pgTxnId, PGTransactionId: pgTxnId });
        localStorage.setItem("skyvoo_pg_txn_id", String(pgTxnId));

        // Update stored payload with pgTxnId and isPgTransactionId flag
        if (currentPayload) {
          const updatedPayload = {
            ...currentPayload,
            PGTransactionId: pgTxnId,
            IsPgTransactionId: true,
            isPgTransactionId: true,
            PaymentFlag: true,
          };
          localStorage.setItem("skyvoo_pending_booking_payload", JSON.stringify(updatedPayload));
        }
      }

      let checkoutUrl =
        paymentOrderDetails?.RedirectUrl ||
        paymentOrderDetails?.redirectUrl ||
        paymentOrderDetails?.CheckoutUrl ||
        paymentOrderDetails?.checkoutUrl ||
        paymentOrderDetails?.url ||
        dataObj?.RedirectUrl ||
        dataObj?.redirectUrl ||
        dataObj?.CheckoutUrl ||
        dataObj?.checkoutUrl ||
        dataObj?.url ||
        (typeof raw === "string" ? raw : "");

      if (typeof checkoutUrl === "string") {
        checkoutUrl = checkoutUrl.replace(/^["']|["']$/g, "").trim();
      }

      if (checkoutUrl && checkoutUrl.startsWith("http")) {
        if (paymentTab && !paymentTab.closed) {
          paymentTab.location.href = checkoutUrl;
        } else {
          window.open(checkoutUrl, "_blank", "noopener,noreferrer");
        }
        setIsPgLoading(false);
        onClose();
      } else {
        if (paymentTab && !paymentTab.closed) {
          paymentTab.close();
        }
        throw new Error(
          raw?.ErrorMessage ||
          raw?.errorMessage ||
          dataObj?.ErrorMessage ||
          dataObj?.errorMessage ||
          "Payment initiation failed. No checkout URL received."
        );
      }
    } catch (err) {
      if (paymentTab && !paymentTab.closed) {
        paymentTab.close();
      }
      console.error("Payment Gateway Error:", err);
      const apiMsg =
        err?.response?.data?.ErrorMessage ||
        err?.response?.data?.message ||
        err?.message ||
        "Payment initiation failed. Please try again.";
      setPgError(apiMsg);
      setIsPgLoading(false);
    }
  };

  const isBusy = isWalletBookingLoading || isPgLoading;

  const handlePaymentModeChange = (mode) => {
    setPaymentMode(mode);
    setPgError("");
  };

  const handleCardNetworkChange = (network) => {
    setCardNetwork(network);
    setPgError("");
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
      onClick={(e) => {
        if (!isBusy && e.target === e.currentTarget) {
          setPgError("");
          onClose();
        }
      }}
      style={{ animation: "fadeIn 0.25s ease-out forwards" }}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "scaleIn 0.25s ease-out forwards" }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 sm:px-6 sm:py-3.5 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#78080B]" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
              Important Disclaimer
            </h2>
          </div>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => {
              setPgError("");
              onClose();
            }}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Disclaimer Body - Expanded scroll length */}
        <div className="flex-1 overflow-y-auto px-5 py-3 sm:px-6 sm:py-4 space-y-2.5 text-[11px] sm:text-xs text-slate-600 leading-relaxed max-h-[58vh] divide-y divide-slate-100">
          {disclaimerPoints.map((point, index) => (
            <div key={index} className={`flex items-start gap-2 ${index > 0 ? "pt-2.5" : ""}`}>
              <span className="font-bold text-slate-700 shrink-0 w-5">
                {index + 1}.
              </span>
              <p className="text-slate-600 flex-1">{point}</p>
            </div>
          ))}
        </div>

        {/* Bottom Section - Compact typography & right-aligned content-width buttons */}
        <div className="px-5 py-3 sm:px-6 sm:py-3.5 bg-slate-50/90 border-t border-slate-200 space-y-2.5">
          {/* Confirmation Notice */}
          <div>
            <p className="text-blue-700 font-medium text-[11px] sm:text-xs">
              ✓ I've rechecked all the details as per the Important Disclaimer.
            </p>
          </div>

          {/* Payment Mode Selection */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              PAYMENT MODE
            </span>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              {/* Wallet Option */}
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-800 hover:text-[#78080B] transition">
                <input
                  type="radio"
                  name="paymentMode"
                  value="WALLET"
                  checked={paymentMode === "WALLET"}
                  onChange={() => handlePaymentModeChange("WALLET")}
                  className="w-3.5 h-3.5 text-[#78080B] focus:ring-[#78080B] cursor-pointer accent-[#78080B]"
                />
                <span>WALLET</span>
              </label>

              {/* Debit Card Option */}
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-800 hover:text-[#78080B] transition">
                <input
                  type="radio"
                  name="paymentMode"
                  value="DEBIT_CARD"
                  checked={paymentMode === "DEBIT_CARD"}
                  onChange={() => handlePaymentModeChange("DEBIT_CARD")}
                  className="w-3.5 h-3.5 text-[#78080B] focus:ring-[#78080B] cursor-pointer accent-[#78080B]"
                />
                <span>DEBIT CARD</span>
              </label>

              {/* Credit Card Option */}
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-800 hover:text-[#78080B] transition">
                <input
                  type="radio"
                  name="paymentMode"
                  value="CREDIT_CARD"
                  checked={paymentMode === "CREDIT_CARD"}
                  onChange={() => handlePaymentModeChange("CREDIT_CARD")}
                  className="w-3.5 h-3.5 text-[#78080B] focus:ring-[#78080B] cursor-pointer accent-[#78080B]"
                />
                <span>CREDIT CARD</span>
              </label>
            </div>

            {/* Sub-options for Card Network */}
            {(paymentMode === "CREDIT_CARD" || paymentMode === "DEBIT_CARD") && (
              <div className="mt-2 p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                <span className="text-[11px] font-medium text-slate-500 block">
                  Select Card Network:
                </span>
                <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700 hover:text-[#78080B]">
                    <input
                      type="radio"
                      name="cardNetwork"
                      value="VISA CARD"
                      checked={cardNetwork === "VISA CARD"}
                      onChange={() => handleCardNetworkChange("VISA CARD")}
                      className="w-3 h-3 text-[#78080B] focus:ring-[#78080B] cursor-pointer accent-[#78080B]"
                    />
                    <span>VISA CARD</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700 hover:text-[#78080B]">
                    <input
                      type="radio"
                      name="cardNetwork"
                      value="MASTER CARD"
                      checked={cardNetwork === "MASTER CARD"}
                      onChange={() => handleCardNetworkChange("MASTER CARD")}
                      className="w-3 h-3 text-[#78080B] focus:ring-[#78080B] cursor-pointer accent-[#78080B]"
                    />
                    <span>MASTER CARD</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700 hover:text-[#78080B]">
                    <input
                      type="radio"
                      name="cardNetwork"
                      value="RS CARD"
                      checked={cardNetwork === "RS CARD"}
                      onChange={() => handleCardNetworkChange("RS CARD")}
                      className="w-3 h-3 text-[#78080B] focus:ring-[#78080B] cursor-pointer accent-[#78080B]"
                    />
                    <span>RS CARD</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* PG Error display */}
          {pgError && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
              <span>{pgError}</span>
            </div>
          )}

          {/* Action Buttons - Right aligned & width according to content */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isBusy}
              onClick={onClose}
              className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 active:bg-slate-200 transition cursor-pointer disabled:opacity-50"
            >
              Decline
            </button>

            <button
              type="button"
              disabled={isBusy}
              onClick={handleAcceptAndConfirm}
              className="px-6 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-[#78080B] hover:bg-[#8F0306] active:bg-[#5e0608] text-white shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isBusy ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                "Accept And Confirm"
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.97); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
