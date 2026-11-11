import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertTriangle, AlertCircle, Plane, ArrowRight, RefreshCw } from 'lucide-react';
import api from '@/services/api';
import { bookingStore } from '@/store/bookingStore';

export default function PaymentCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'pending' | 'failed'
    const [statusMessage, setStatusMessage] = useState('Verifying your payment...');
    const [currentStep, setCurrentStep] = useState(1);
    const [errorMessage, setErrorMessage] = useState('');
    const [pgTxnIdState, setPgTxnIdState] = useState('');

    const hasExecutedRef = useRef(false);

    useEffect(() => {
        if (hasExecutedRef.current) return;
        hasExecutedRef.current = true;

        const processPaymentAndBooking = async () => {
            try {
                // 1. Extract status query param from URL
                const statusParam = searchParams.get('status') || searchParams.get('Status') || '';
                const urlPgTxnId =
                    searchParams.get('PGTransactionId') ||
                    searchParams.get('pgTransactionId') ||
                    searchParams.get('transactionId') ||
                    searchParams.get('TransactionId') ||
                    searchParams.get('txnId') ||
                    searchParams.get('orderId') ||
                    searchParams.get('order_id');

                const storedPgTxnId = localStorage.getItem('skyvoo_pg_txn_id') || bookingStore.get()?.pgTransactionId;
                let finalPgTxnId = urlPgTxnId || storedPgTxnId || '';

                // Try to extract transactionID from base64 status if available
                if (!finalPgTxnId && statusParam) {
                    try {
                        const decoded = JSON.parse(atob(statusParam));
                        finalPgTxnId = decoded?.apiResponseData?.data?.transactionID || decoded?.transactionID || decoded?.data?.transactionID || '';
                    } catch (e) {
                        // Not base64 or JSON
                    }
                }

                setPgTxnIdState(finalPgTxnId);

                // 2. Track & Verify Payment Status using Webhook API
                setStatusMessage('Verifying payment status with gateway...');
                setCurrentStep(1);

                if (statusParam) {
                    let webhookRes;
                    try {
                        webhookRes = await api.post(
                            `/pg/finkedapaymentwebhook?status=${encodeURIComponent(statusParam)}`,
                            { status: statusParam }
                        );
                        console.log('[Webhook Verification Response]', webhookRes?.data);
                    } catch (whErr) {
                        const whMsg =
                            whErr?.response?.data?.ErrorMessage ||
                            whErr?.response?.data?.Data?.ErrorMessage ||
                            whErr?.response?.data?.message ||
                            whErr?.message ||
                            'Failed to verify payment with payment gateway.';
                        throw new Error(whMsg);
                    }

                    const webhookData = webhookRes?.data?.Data || webhookRes?.data?.data || webhookRes?.data;
                    const webhookStatus = String(
                        webhookData?.Status ||
                        webhookData?.status ||
                        webhookData?.PaymentStatus ||
                        webhookData?.pgStatus ||
                        ''
                    ).toUpperCase();

                    // If transaction is not SUCCESS, do not hit instant booking
                    if (webhookStatus !== 'SUCCESS') {
                        const isPending = webhookStatus === 'PENDING' || webhookStatus === 'PROCESSING' || webhookStatus === 'NOT_FOUND';
                        if (isPending) {
                            setStatus('pending');
                            setStatusMessage(webhookData?.SuccessMessage || 'Payment is processing or pending verification.');
                            setErrorMessage(webhookData?.ErrorMessage || 'Transaction status is pending. Please check My Bookings or contact support.');
                        } else {
                            setStatus('failed');
                            setErrorMessage(webhookData?.ErrorMessage || `Payment verification failed (Status: ${webhookStatus || 'FAILED'}).`);
                        }
                        return;
                    }

                    // Extract verified PGTransactionId if returned from webhook
                    if (webhookData?.PGTransactionId || webhookData?.transactionID) {
                        finalPgTxnId = String(webhookData.PGTransactionId || webhookData.transactionID);
                        setPgTxnIdState(finalPgTxnId);
                    }
                }

                // Step 2: Payment is SUCCESS -> Connect to Airline
                setStatusMessage('Payment verified successfully! Connecting to airline reservation system...');
                setCurrentStep(2);

                // 3. Retrieve stored flight booking payload
                const rawPayload = localStorage.getItem('skyvoo_pending_booking_payload');
                let bookingPayload = null;
                try {
                    bookingPayload = rawPayload ? JSON.parse(rawPayload) : null;
                } catch (e) {
                    console.error('Failed to parse stored booking payload:', e);
                }

                if (!bookingPayload) {
                    throw new Error('Booking session data not found. If amount was deducted, please check My Bookings or contact support with Transaction ID.');
                }

                // Prepare final payload with PG flags
                const finalPayload = {
                    ...bookingPayload,
                    ...(finalPgTxnId ? { PGTransactionId: finalPgTxnId } : {}),
                    IsPgTransactionId: true,
                    isPgTransactionId: true,
                    PaymentFlag: true,
                };

                console.log('[PaymentCallback] Status SUCCESS -> Executing /flight/InstantBooking with payload:', finalPayload);

                setStatusMessage('Confirming your flight ticket with airline system...');
                setCurrentStep(3);

                // 4. Trigger Instant Booking API from Frontend
                let res;
                try {
                    res = await api.post('/flight/InstantBooking', finalPayload);
                } catch (axiosErr) {
                    const apiMsg =
                        axiosErr?.response?.data?.ErrorMessage ||
                        axiosErr?.response?.data?.message ||
                        axiosErr?.message ||
                        'Airline booking request failed.';
                    throw new Error(apiMsg);
                }

                if (!res.data?.IsSuccess) {
                    throw new Error(res.data?.ErrorMessage || 'Booking failed on airline system.');
                }

                // Step 3: Success handling
                const bookingData = res.data?.Data;
                let bookingId = '';
                let bookingStatus = '';
                try {
                    const raw = bookingData?.BookingResponse;
                    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                    bookingId = parsed?.Order?.BookingId || '';
                    bookingStatus = parsed?.Order?.BookingStatus || '';
                } catch {
                    // fallback
                }

                const txId = bookingData?.TransactionId || bookingData?.FlightTransactionId || '';
                const vendor = bookingData?.Vendor || bookingPayload?.Vendor || '';

                // Clear cached booking payload and booking store on success
                localStorage.removeItem('skyvoo_pending_booking_payload');
                localStorage.removeItem('skyvoo_pg_txn_id');
                bookingStore.reset();
                localStorage.removeItem('skyvoo_booking');
                sessionStorage.removeItem('skyvoo_booking');

                setStatus('success');
                setStatusMessage('Flight Confirmed! Redirecting to your booking ticket...');

                // Redirect to Booking Details
                setTimeout(() => {
                    navigate(
                        `/booking-details?TransactionId=${txId}&BookingId=${encodeURIComponent(bookingId)}&BookingStatus=${encodeURIComponent(bookingStatus)}&Vendor=${encodeURIComponent(vendor)}`,
                        { replace: true }
                    );
                }, 1500);

            } catch (err) {
                console.error('[PaymentCallback Error]', err);
                const rawMsg = String(err?.message || '').trim();
                const isQueued = /queued|queue|pending/i.test(rawMsg);

                if (isQueued) {
                    setStatus('pending');
                    setStatusMessage('Your booking is currently in pending state.');
                    setErrorMessage('The airline is processing your booking. Please check My Bookings after a few minutes.');
                } else {
                    setStatus('failed');
                    setErrorMessage(rawMsg || 'Unable to confirm flight booking. If your money was deducted, our team will process the ticket or refund.');
                }
            }
        };

        processPaymentAndBooking();
    }, [searchParams, navigate]);

    const handleRetryBooking = () => {
        hasExecutedRef.current = false;
        setStatus('processing');
        setStatusMessage('Retrying airline booking confirmation...');
        setErrorMessage('');
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-7 sm:p-9 text-center">

                {/* Status: Processing */}
                {status === 'processing' && (
                    <div className="space-y-6">
                        {/* Animated Airplane Circle */}
                        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-4 border-[#811919]/10 border-t-[#811919] animate-spin" />
                            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-[#811919] shadow-inner">
                                <Plane className="w-8 h-8 animate-pulse" />
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                                Booking in Progress
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-xs mx-auto">
                                {statusMessage}
                            </p>
                        </div>

                        {/* Step Progress Indicators */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 text-left">
                            <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep >= 1 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                    ✓
                                </div>
                                <span className={`text-xs font-medium ${currentStep >= 1 ? 'text-slate-800' : 'text-slate-400'}`}>
                                    Payment Verified
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep >= 2 ? (currentStep > 2 ? 'bg-emerald-500 text-white' : 'bg-[#811919] text-white animate-pulse') : 'bg-slate-200 text-slate-500'}`}>
                                    {currentStep > 2 ? '✓' : '2'}
                                </div>
                                <span className={`text-xs font-medium ${currentStep >= 2 ? 'text-slate-800' : 'text-slate-400'}`}>
                                    Connecting to Airline (Instant Booking)
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep >= 3 ? 'bg-[#811919] text-white animate-pulse' : 'bg-slate-200 text-slate-500'}`}>
                                    3
                                </div>
                                <span className={`text-xs font-medium ${currentStep >= 3 ? 'text-slate-800' : 'text-slate-400'}`}>
                                    Generating PNR & E-Ticket
                                </span>
                            </div>
                        </div>

                        <p className="text-[11px] text-slate-400">
                            Please do not refresh the page or click back.
                        </p>
                    </div>
                )}

                {/* Status: Success */}
                {status === 'success' && (
                    <div className="space-y-6">
                        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm animate-bounce">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">
                                Booking Confirmed!
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">
                                {statusMessage}
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                            <Loader2 className="w-4 h-4 animate-spin text-[#811919]" />
                            <span>Opening your E-Ticket...</span>
                        </div>
                    </div>
                )}

                {/* Status: Pending */}
                {status === 'pending' && (
                    <div className="space-y-6">
                        <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 border-4 border-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                            <AlertTriangle className="w-10 h-10" />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">
                                Booking Pending
                            </h2>
                            <p className="text-sm text-slate-600 mt-1.5">
                                {errorMessage}
                            </p>
                        </div>

                        {pgTxnIdState && (
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                                <span className="font-semibold text-slate-700">Transaction ID: </span>
                                <span className="font-mono text-slate-800">{pgTxnIdState}</span>
                            </div>
                        )}

                        <div className="pt-2 flex flex-col gap-2.5">
                            <Link
                                to="/my-bookings"
                                className="w-full py-3 px-5 rounded-xl bg-[#811919] hover:bg-[#681010] text-white font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2"
                            >
                                <span>Go to My Bookings</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Status: Failed */}
                {status === 'failed' && (
                    <div className="space-y-6">
                        <div className="w-20 h-20 mx-auto rounded-full bg-rose-50 border-4 border-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
                            <AlertCircle className="w-10 h-10" />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">
                                Booking Failed
                            </h2>
                            <p className="text-xs sm:text-sm text-rose-700 bg-rose-50/70 border border-rose-200 p-3 rounded-xl mt-3 text-left">
                                {errorMessage}
                            </p>
                        </div>

                        {pgTxnIdState && (
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 text-left">
                                <span className="font-semibold text-slate-700">Payment Reference ID: </span>
                                <span className="font-mono text-slate-800">{pgTxnIdState}</span>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    If payment was deducted from your account, please quote this reference ID to support for instant resolution.
                                </p>
                            </div>
                        )}

                        <div className="pt-2 flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={handleRetryBooking}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-[#811919] hover:bg-[#681010] text-white font-semibold text-xs sm:text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span>Retry Booking</span>
                            </button>

                            <Link
                                to="/"
                                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition flex items-center justify-center"
                            >
                                Search Again
                            </Link>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
