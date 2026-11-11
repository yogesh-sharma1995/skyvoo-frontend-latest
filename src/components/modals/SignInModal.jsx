import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Phone, ShieldCheck, User, Mail, ArrowLeft, Loader2, X, CheckCircle2, ChevronDown, Search } from "lucide-react";
import { defaultCountries, parseCountry, FlagImage } from "react-international-phone";
import "react-international-phone/style.css";
import { isValidPhoneNumber } from "libphonenumber-js";
import { toast } from "react-toastify";
import { sendOtpSkyvooUser, verifyOtpSkyvooUser, registerSkyvooUser } from "@/services/auth";
import { useAuth, getAndClearReturnUrl } from "@/contexts/AuthContext";

const allCountriesList = defaultCountries.map(parseCountry);

export default function SignInModal({ onClose, onSuccess }) {
    const { login } = useAuth();
    const navigate = useNavigate();

    // Steps: 'MOBILE' | 'OTP' | 'REGISTER'
    const [step, setStep] = useState("MOBILE");
    const [selectedCountry, setSelectedCountry] = useState(() => {
        const india = allCountriesList.find((c) => c.iso2 === "in");
        return india || { name: "India", iso2: "in", dialCode: "91" };
    });
    const [mobile, setMobile] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchCountry, setSearchCountry] = useState("");
    const [otp, setOtp] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [resendTimer, setResendTimer] = useState(0);
    const [submitted, setSubmitted] = useState(false);

    const otpInputRef = useRef(null);
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    // Lock page scroll while modal is open
    useEffect(() => {
        const originalBodyOverflow = document.body.style.overflow;
        const originalHtmlOverflow = document.documentElement.style.overflow;
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalBodyOverflow;
            document.documentElement.style.overflow = originalHtmlOverflow;
        };
    }, []);

    // Reset validation state on step switch
    useEffect(() => {
        setSubmitted(false);
        setError("");
    }, [step]);

    // Filtered countries for dropdown search
    const filteredCountries = useMemo(() => {
        if (!searchCountry.trim()) return allCountriesList;
        const q = searchCountry.toLowerCase().trim();
        return allCountriesList.filter(
            (c) => c.name.toLowerCase().includes(q) || c.dialCode.includes(q) || c.iso2.toLowerCase().includes(q)
        );
    }, [searchCountry]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isDropdownOpen]);

    // Country-specific phone validation using libphonenumber-js
    const isPhoneValid = (num, dialCode) => {
        if (!num || !num.trim()) return false;
        const clean = num.trim();
        if (dialCode === "91") {
            return clean.length === 10;
        }
        const full = `+${dialCode}${clean}`;
        try {
            return isValidPhoneNumber(full);
        } catch {
            return clean.length >= 7 && clean.length <= 15;
        }
    };

    // Resend countdown timer
    useEffect(() => {
        let interval;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    // Auto-focus OTP input when entering OTP step
    useEffect(() => {
        if (step === "OTP" && otpInputRef.current) {
            otpInputRef.current.focus();
        }
    }, [step]);

    // ── Handle Send OTP ───────────────────────────────────────────────────────
    const handleSendOtp = async (e) => {
        if (e) e.preventDefault();
        setError("");
        setSubmitted(true);

        const cleanMobile = mobile.replace(/\D/g, "");

        if (!cleanMobile || !isPhoneValid(cleanMobile, selectedCountry.dialCode)) {
            return;
        }

        setLoading(true);
        try {
            // API receives ONLY the mobile number without country code (+91)
            const res = await sendOtpSkyvooUser(cleanMobile);
            const dataObj = res?.Data || res;

            // Check if status is explicitly FAILED or error message is returned in Data
            const isExplicitlyFailed =
                dataObj?.Status === "FAILED" ||
                res?.Status === "FAILED" ||
                res?.IsSuccess === false ||
                (dataObj?.ErrorMessage && dataObj?.ErrorMessage.trim().length > 0 && dataObj?.Status !== "SUCCESS") ||
                (res?.ErrorMessage && res?.ErrorMessage.trim().length > 0 && res?.Status !== "SUCCESS");

            const isSuccess = !isExplicitlyFailed && (
                dataObj?.Status === "SUCCESS" ||
                res?.Status === "SUCCESS" ||
                (res?.IsSuccess === true && dataObj?.Status !== "FAILED" && !dataObj?.ErrorMessage)
            );

            if (isSuccess) {
                setStep("OTP");
                setResendTimer(30);
                setOtp("");
            } else {
                const errorMsg =
                    dataObj?.ErrorMessage ||
                    res?.ErrorMessage ||
                    res?.message ||
                    dataObj?.message ||
                    "Failed to send OTP. Please try again.";
                setError(errorMsg);
            }
        } catch (err) {
            console.error("Send OTP Error:", err);
            setError(
                err?.response?.data?.Data?.ErrorMessage ||
                err?.response?.data?.ErrorMessage ||
                err?.response?.data?.message ||
                "Failed to send OTP. Please check your network connection."
            );
        } finally {
            setLoading(false);
        }
    };

    // ── Handle Verify OTP ─────────────────────────────────────────────────────
    const handleVerifyOtp = async (e) => {
        if (e) e.preventDefault();
        setError("");
        setSubmitted(true);

        const cleanOtp = otp.trim();
        if (!cleanOtp || cleanOtp.length < 4) {
            return;
        }

        const cleanMobile = mobile.replace(/\D/g, "");
        let authData = null;
        let isSuccess = false;
        let isRegistered = null;

        setLoading(true);
        try {
            // API receives ONLY the mobile number without country code (+91)
            const res = await verifyOtpSkyvooUser({ mobile: cleanMobile, otp: cleanOtp });
            const dataObj = res?.Data || res;

            // Check if status is explicitly FAILED or error message is returned
            const isExplicitlyFailed =
                dataObj?.Status === "FAILED" ||
                res?.Status === "FAILED" ||
                res?.IsSuccess === false ||
                (dataObj?.ErrorMessage && dataObj?.ErrorMessage.trim().length > 0 && dataObj?.Status !== "SUCCESS");

            // Successful only if not failed and status is SUCCESS or valid Token/IsRegistered is returned
            isSuccess = !isExplicitlyFailed && (
                dataObj?.Status === "SUCCESS" ||
                res?.Status === "SUCCESS" ||
                (Boolean(dataObj?.Token) || dataObj?.IsRegistered === true || dataObj?.IsRegistered === false)
            );

            if (isSuccess) {
                authData = dataObj;
                if (!authData.Mobile) {
                    authData.Mobile = cleanMobile;
                }
                isRegistered = authData?.IsRegistered;
            } else {
                const errorMsg =
                    dataObj?.ErrorMessage ||
                    res?.ErrorMessage ||
                    res?.message ||
                    dataObj?.message ||
                    "Invalid or expired OTP. Please try again.";
                setError(errorMsg);
                return;
            }
        } catch (err) {
            console.error("Verify OTP Error:", err);
            setError(
                err?.response?.data?.Data?.ErrorMessage ||
                err?.response?.data?.ErrorMessage ||
                err?.response?.data?.message ||
                "Verification failed. Please check the OTP and try again."
            );
            return;
        } finally {
            setLoading(false);
        }

        if (isSuccess && authData) {
            if (isRegistered === false) {
                // New verified user -> Show Registration Form
                setStep("REGISTER");
            } else if (authData?.Token) {
                // Existing registered user -> Log in
                handleAuthSuccess(authData);
            } else {
                // Fallback: If no token and not a new user, show error instead of opening register
                setError(authData?.ErrorMessage || "Invalid or expired OTP. Please try again.");
            }
        }
    };

    // ── Handle Registration ───────────────────────────────────────────────────
    const handleRegister = async (e) => {
        if (e) e.preventDefault();
        setError("");
        setSubmitted(true);

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!name.trim() || !email.trim() || !emailRegex.test(email.trim())) {
            return;
        }

        const cleanMobile = mobile.replace(/\D/g, "");
        let authData = null;
        let isSuccess = false;

        setLoading(true);
        try {
            const res = await registerSkyvooUser({
                name: name.trim(),
                mobile: cleanMobile,
                email: email.trim(),
                userType: "b2c", // UserType is b2c by default
            });
            const dataObj = res?.Data || res;

            const isExplicitlyFailed =
                dataObj?.Status === "FAILED" ||
                res?.Status === "FAILED" ||
                res?.IsSuccess === false ||
                (dataObj?.ErrorMessage && dataObj?.ErrorMessage.trim().length > 0 && dataObj?.Status !== "SUCCESS") ||
                (res?.ErrorMessage && res?.ErrorMessage.trim().length > 0 && res?.Status !== "SUCCESS");

            isSuccess = !isExplicitlyFailed && (
                dataObj?.Status === "SUCCESS" ||
                res?.Status === "SUCCESS" ||
                (res?.IsSuccess === true && dataObj?.Status !== "FAILED" && !dataObj?.ErrorMessage)
            );

            if (isSuccess) {
                authData = dataObj;
            } else {
                const errorMsg =
                    dataObj?.ErrorMessage ||
                    res?.ErrorMessage ||
                    res?.message ||
                    dataObj?.message ||
                    "Registration failed. Please try again.";
                setError(errorMsg);
                return;
            }
        } catch (err) {
            console.error("Registration Error:", err);
            setError(
                err?.response?.data?.Data?.ErrorMessage ||
                err?.response?.data?.ErrorMessage ||
                err?.response?.data?.message ||
                "Registration failed. Please try again."
            );
            return;
        } finally {
            setLoading(false);
        }

        if (isSuccess && authData) {
            handleAuthSuccess({
                ...authData,
                UserName: name.trim(),
                Mobile: cleanMobile,
                Email: email.trim(),
            });
        }
    };

    // ── Auth Success Handler ──────────────────────────────────────────────────
    const handleAuthSuccess = (authData) => {
        try {
            login(authData);
        } catch (e) {
            console.error("Login context error:", e);
        }

        try {
            const displayName = authData?.UserName || authData?.Name;
            toast.success(displayName && displayName !== "Skyvoo User" ? `Welcome, ${displayName}! Logged in successfully.` : "Logged in successfully!");
        } catch (e) {
            console.error("Toast error:", e);
        }

        try {
            const returnUrl = getAndClearReturnUrl();
            if (onSuccess) {
                onSuccess();
            } else if (onClose) {
                onClose();
            }
            if (returnUrl && window.location.pathname !== returnUrl) {
                navigate(returnUrl, { replace: true });
            }
        } catch (e) {
            console.error("Close modal error:", e);
            if (onClose) onClose();
        }
    };

    if (typeof document === "undefined") return null;

    return createPortal(
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="rounded-3xl shadow-2xl shadow-black/40 p-6 sm:p-8 w-full max-w-md relative animate-in zoom-in-95 duration-200 border border-[#78080B]"
                style={{
                    background: "linear-gradient(175deg, #D4D5DC 0%, #FFFFFF 24%, #F6F7FA 72%, #CBCCD4 100%)",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.9), inset 0 -1px 2px rgba(0, 0, 0, 0.08)"
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    className="cursor-pointer absolute top-5 right-5 text-gray-400 hover:text-gray-800 p-1.5 rounded-full hover:bg-gray-100 transition"
                    onClick={onClose}
                    aria-label="Close modal"
                >
                    <X size={20} />
                </button>

                {/* Back button for OTP & Register step */}
                {step !== "MOBILE" && (
                    <button
                        className="cursor-pointer absolute top-5 left-5 text-gray-400 hover:text-gray-800 p-1.5 rounded-full hover:bg-gray-100 transition flex items-center gap-1 text-xs font-medium"
                        onClick={() => {
                            setError("");
                            if (step === "REGISTER") setStep("OTP");
                            else setStep("MOBILE");
                        }}
                    >
                        <ArrowLeft size={18} />
                    </button>
                )}

                {/* Top Icon */}
                <div className="flex justify-center mb-5 mt-2">
                    <div className="bg-gradient-to-br from-[#78080B]/15 to-[#c40d12]/10 border border-[#78080B]/20 rounded-2xl p-4 flex items-center justify-center text-[#78080B] shadow-inner">
                        {step === "MOBILE" && <Phone className="w-8 h-8" />}
                        {step === "OTP" && <ShieldCheck className="w-8 h-8" />}
                        {step === "REGISTER" && <User className="w-8 h-8" />}
                    </div>
                </div>

                {/* ── STEP 1: MOBILE NUMBER ─────────────────────────────────────── */}
                {step === "MOBILE" && (
                    <>
                        <h2 className="text-lg sm:text-xl font-bold text-center text-gray-900 mb-1">
                            Sign In / Sign Up
                        </h2>
                        <p className="text-gray-500 text-center text-xs sm:text-[13px] whitespace-nowrap mb-6">
                            Enter your mobile number to receive a verification code.
                        </p>

                        {error && (
                            <div className="mb-4 px-3.5 py-2.5 bg-red-50 border border-red-200 text-red-600 text-xs sm:text-sm rounded-xl text-center font-medium">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-0.5">
                                    Phone Number
                                </label>
                                <div className="relative" ref={dropdownRef}>
                                    <div className={`flex items-center bg-white border rounded-xl focus-within:border-[#78080B] focus-within:ring-2 focus-within:ring-[#78080B]/10 shadow-sm transition ${
                                        submitted && (!mobile.trim() || !isPhoneValid(mobile.replace(/\D/g, ""), selectedCountry.dialCode))
                                            ? "border-red-500 bg-red-50/20"
                                            : "border-gray-300"
                                    }`}>
                                        {/* Country Selector Button */}
                                        <button
                                            type="button"
                                            onClick={() => setIsDropdownOpen((prev) => !prev)}
                                            className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50/50 hover:bg-gray-100 rounded-l-xl transition border-r border-gray-200 select-none cursor-pointer shrink-0"
                                        >
                                            <FlagImage iso2={selectedCountry.iso2} size="22px" className="rounded-xs shrink-0" />
                                            <span className="text-[10px] text-gray-500 font-bold">▾</span>
                                            <span className="text-sm font-semibold text-gray-800 ml-0.5 select-none">
                                                +{selectedCountry.dialCode}
                                            </span>
                                        </button>

                                        {/* Mobile Input */}
                                        <input
                                            id="mobile-input"
                                            type="tel"
                                            placeholder="Enter your mobile number"
                                            maxLength={selectedCountry.dialCode === "91" ? 10 : 15}
                                            value={mobile}
                                            onChange={(e) => {
                                                const maxLen = selectedCountry.dialCode === "91" ? 10 : 15;
                                                const val = e.target.value.replace(/\D/g, "").slice(0, maxLen);
                                                setMobile(val);
                                                setSubmitted(false);
                                                if (error) setError("");
                                            }}
                                            className="bg-transparent w-full outline-none text-sm text-gray-900 font-medium px-3.5 py-2.5"
                                            autoComplete="tel"
                                            autoFocus
                                            disabled={loading}
                                        />
                                    </div>

                                    {/* Country Dropdown */}
                                    {isDropdownOpen && (
                                        <div className="absolute top-full left-0 mt-1.5 w-72 max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-gray-200 z-[9999999] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                            {/* Search Input */}
                                            <div className="p-2 border-b border-gray-100 bg-gray-50/50">
                                                <div className="flex items-center bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
                                                    <Search size={14} className="text-gray-400 mr-2 shrink-0" />
                                                    <input
                                                        ref={searchInputRef}
                                                        type="text"
                                                        placeholder="Search country..."
                                                        value={searchCountry}
                                                        onChange={(e) => setSearchCountry(e.target.value)}
                                                        className="w-full bg-transparent outline-none text-xs text-gray-800 font-medium"
                                                    />
                                                </div>
                                            </div>

                                            {/* Country List */}
                                            <div className="max-h-56 overflow-y-auto custom-scrollbar divide-y divide-gray-50">
                                                {filteredCountries.length === 0 ? (
                                                    <div className="p-4 text-center text-xs text-gray-400 font-medium">
                                                        No country found
                                                    </div>
                                                ) : (
                                                    filteredCountries.map((c) => {
                                                        const isSelected = c.iso2 === selectedCountry.iso2 && c.dialCode === selectedCountry.dialCode;
                                                        return (
                                                            <button
                                                                key={`${c.iso2}-${c.dialCode}`}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedCountry(c);
                                                                    setIsDropdownOpen(false);
                                                                    setSearchCountry("");
                                                                }}
                                                                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left hover:bg-gray-50 transition cursor-pointer ${
                                                                    isSelected ? "bg-[#78080B]/5 font-semibold text-[#78080B]" : "text-gray-700"
                                                                }`}
                                                            >
                                                                <FlagImage iso2={c.iso2} size="20px" className="rounded-xs shrink-0" />
                                                                <span className="text-xs font-medium truncate flex-1">{c.name}</span>
                                                                <span className="text-xs text-gray-500 font-semibold shrink-0">+{c.dialCode}</span>
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {submitted && !mobile.trim() && (
                                    <span className="text-[11px] text-red-600 font-medium ml-1 mt-1 block">Phone number is required</span>
                                )}
                                {submitted && mobile.trim() && !isPhoneValid(mobile.replace(/\D/g, ""), selectedCountry.dialCode) && (
                                    <span className="text-[11px] text-red-600 font-medium ml-1 mt-1 block">
                                        {selectedCountry.dialCode === "91" && mobile.replace(/\D/g, "").length < 10
                                            ? "Please enter a valid 10-digit mobile number"
                                            : "Please enter a valid phone number"}
                                    </span>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    background: "linear-gradient(90deg, #78080B 0%, #DE0F15 100%)",
                                }}
                                className="w-full text-white py-3 rounded-[6px] font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-80 shadow-md hover:brightness-110 active:scale-[0.99] cursor-pointer mt-2 uppercase"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sending OTP...
                                    </>
                                ) : (
                                    "Get OTP"
                                )}
                            </button>
                        </form>
                    </>
                )}

                {/* ── STEP 2: VERIFY OTP ────────────────────────────────────────── */}
                {step === "OTP" && (
                    <>
                        <h2 className="text-lg sm:text-xl font-bold text-center text-gray-900 mb-1">
                            Verify OTP
                        </h2>
                        <p className="text-gray-500 text-center text-xs sm:text-[13px] mb-6">
                            Enter the 6-digit OTP sent to <span className="font-semibold text-gray-800">+{selectedCountry.dialCode} {mobile}</span>
                        </p>

                        {error && (
                            <div className="mb-4 px-3.5 py-2.5 bg-red-50 border border-red-200 text-red-600 text-xs sm:text-sm rounded-xl text-center font-medium">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-0.5">
                                    One Time Password (OTP)
                                </label>
                                <div className={`flex items-center bg-white border rounded-xl px-4 py-2.5 focus-within:border-[#78080B] focus-within:ring-2 focus-within:ring-[#78080B]/10 shadow-sm transition ${
                                    submitted && (!otp.trim() || otp.trim().length < 4)
                                        ? "border-red-500 bg-red-50/20"
                                        : "border-gray-300"
                                }`}>
                                    <input
                                        ref={otpInputRef}
                                        id="otp-input"
                                        type="text"
                                        maxLength={6}
                                        placeholder="• • • • • •"
                                        value={otp}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                                            setOtp(val);
                                            setSubmitted(false);
                                            if (error) setError("");
                                        }}
                                        className="bg-transparent w-full outline-none text-center text-lg font-bold tracking-[0.4em] text-gray-900"
                                        autoComplete="one-time-code"
                                        disabled={loading}
                                    />
                                </div>
                                {submitted && !otp.trim() && (
                                    <span className="text-[11px] text-red-600 font-medium ml-1 mt-1 text-center block">OTP is required</span>
                                )}
                                {submitted && otp.trim() && otp.trim().length < 4 && (
                                    <span className="text-[11px] text-red-600 font-medium ml-1 mt-1 text-center block">Please enter a valid OTP</span>
                                )}
                            </div>

                            <div className="flex items-center justify-between text-xs px-1">
                                {resendTimer > 0 ? (
                                    <span className="text-gray-500">
                                        Resend OTP in <span className="font-semibold text-[#78080B]">{resendTimer}s</span>
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleSendOtp}
                                        disabled={loading}
                                        className="text-[#78080B] font-semibold hover:underline cursor-pointer"
                                    >
                                        Resend OTP
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setError("");
                                        setStep("MOBILE");
                                    }}
                                    className="text-gray-500 hover:text-gray-800"
                                >
                                    Change Number
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    background: "linear-gradient(90deg, #78080B 0%, #DE0F15 100%)",
                                }}
                                className="w-full text-white py-3 rounded-[6px] font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-80 shadow-md hover:brightness-110 active:scale-[0.99] cursor-pointer mt-2 uppercase"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    "Verify & Continue"
                                )}
                            </button>
                        </form>
                    </>
                )}

                {/* ── STEP 3: REGISTER NEW USER ─────────────────────────────────── */}
                {step === "REGISTER" && (
                    <>
                        <h2 className="text-lg sm:text-xl font-bold text-center text-gray-900 mb-1">
                            Complete Profile
                        </h2>
                        <p className="text-gray-500 text-center text-xs sm:text-[13px] mb-6">
                            Tell us your name & email to complete your registration.
                        </p>

                        {error && (
                            <div className="mb-4 px-3.5 py-2.5 bg-red-50 border border-red-200 text-red-600 text-xs sm:text-sm rounded-xl text-center font-medium">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleRegister} className="space-y-3.5">
                            {/* Full Name */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1 ml-0.5">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <div className={`flex items-center bg-white border rounded-xl px-3 py-2.5 focus-within:border-[#78080B] focus-within:ring-2 focus-within:ring-[#78080B]/10 shadow-sm transition ${
                                    submitted && !name.trim()
                                        ? "border-red-500 bg-red-50/20"
                                        : "border-gray-300"
                                }`}>
                                    <User size={18} className="text-gray-400 mr-2.5 shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Enter your full name"
                                        value={name}
                                        onChange={(e) => {
                                            setName(e.target.value);
                                            setSubmitted(false);
                                            if (error) setError("");
                                        }}
                                        className="bg-transparent w-full outline-none text-sm text-gray-900 font-medium"
                                        autoFocus
                                        disabled={loading}
                                    />
                                </div>
                                {submitted && !name.trim() && (
                                    <span className="text-[11px] text-red-600 font-medium ml-1 mt-1 block">Full Name is required</span>
                                )}
                            </div>

                            {/* Mobile Number (Readonly Verified) */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1 ml-0.5">
                                    Mobile Number
                                </label>
                                <div className="flex items-center bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-600">
                                    <Phone size={18} className="text-gray-400 mr-2.5 shrink-0" />
                                    <input
                                        type="text"
                                        value={`+${selectedCountry.dialCode} ${mobile}`}
                                        disabled
                                        className="bg-transparent w-full outline-none text-sm text-gray-700 font-medium cursor-not-allowed"
                                    />
                                    <span className="flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-md shrink-0">
                                        <CheckCircle2 size={13} /> Verified
                                    </span>
                                </div>
                            </div>

                            {/* Email Address */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1 ml-0.5">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <div className={`flex items-center bg-white border rounded-xl px-3 py-2.5 focus-within:border-[#78080B] focus-within:ring-2 focus-within:ring-[#78080B]/10 shadow-sm transition ${
                                    submitted && (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
                                        ? "border-red-500 bg-red-50/20"
                                        : "border-gray-300"
                                }`}>
                                    <Mail size={18} className="text-gray-400 mr-2.5 shrink-0" />
                                    <input
                                        type="email"
                                        placeholder="Enter your email address"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setSubmitted(false);
                                            if (error) setError("");
                                        }}
                                        className="bg-transparent w-full outline-none text-sm text-gray-900 font-medium"
                                        disabled={loading}
                                    />
                                </div>
                                {submitted && !email.trim() && (
                                    <span className="text-[11px] text-red-600 font-medium ml-1 mt-1 block">Email Address is required</span>
                                )}
                                {submitted && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && (
                                    <span className="text-[11px] text-red-600 font-medium ml-1 mt-1 block">Please enter a valid email address</span>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    background: "linear-gradient(90deg, #78080B 0%, #DE0F15 100%)",
                                }}
                                className="w-full text-white py-3 rounded-[6px] font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-80 shadow-md hover:brightness-110 active:scale-[0.99] cursor-pointer mt-3 uppercase"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Completing Profile...
                                    </>
                                ) : (
                                    "Complete Registration"
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
}
