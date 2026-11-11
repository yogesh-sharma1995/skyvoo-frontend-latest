import React, { useState } from 'react';
import {
    Bell,
    ShieldCheck,
    Lock,
    KeyRound,
    Smartphone,
    Mail,
    AlertTriangle,
    ChevronRight,
    Save,
    CheckCircle2,
    Laptop,
    HelpCircle,
} from 'lucide-react';
import WorldMapDots from '@/assets/imgs/world_map_dots.jpg';

const SettingsPanel = () => {
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [smsAlerts, setSmsAlerts] = useState(true);
    const [promoAlerts, setPromoAlerts] = useState(false);
    const [twoFactor, setTwoFactor] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState('');

    const handleSaveSettings = () => {
        setSaveSuccess('Settings preferences updated successfully!');
        setTimeout(() => setSaveSuccess(''), 4000);
    };

    return (
        <div className="relative bg-white rounded-3xl p-5 sm:p-7 lg:p-8 border border-gray-100 shadow-sm overflow-hidden">
            {/* Success Alert */}
            {saveSuccess && (
                <div className="mb-6 flex items-center gap-2 p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-sm font-medium animate-fadeIn">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                    <span>{saveSuccess}</span>
                </div>
            )}

            {/* Header with Dotted World Map & Trajectory */}
            <div className="relative mb-8 pb-3 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100">
                {/* Dotted World Map Background */}
                <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-[0.22]"
                        style={{
                            backgroundImage: `url(${WorldMapDots})`,
                            maskImage: 'radial-gradient(ellipse 75% 65% at 50% 50%, black 30%, transparent 85%)',
                            WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 50%, black 30%, transparent 85%)',
                        }}
                    />
                </div>

                {/* Left Header Info */}
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-5 h-[2.5px] bg-[#811919] rounded-full inline-block" />
                        <span className="text-[10px] sm:text-xs font-bold tracking-widest text-[#1E293B] uppercase">
                            PREFERENCES & SECURITY
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D1527] tracking-tight">
                        Account Settings
                    </h1>
                    <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                        Manage your notifications, security preferences, and account controls.
                    </p>
                </div>
            </div>

            <div className="relative z-10 space-y-7">
                {/* 1. Notifications Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-red-50 text-[#811919] flex items-center justify-center">
                            <Bell className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-[#0F172A]">Notifications & Alerts</h2>
                            <p className="text-xs text-[#64748B]">Choose how you want to receive booking and promotional updates.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <SettingToggleCard
                            icon={Mail}
                            title="Email Notifications"
                            description="Receive flight tickets, e-receipts, and web check-in reminders."
                            checked={emailAlerts}
                            onChange={() => setEmailAlerts(prev => !prev)}
                        />
                        <SettingToggleCard
                            icon={Smartphone}
                            title="SMS & WhatsApp Alerts"
                            description="Get instant alerts for flight gate changes, delays, and PNR status."
                            checked={smsAlerts}
                            onChange={() => setSmsAlerts(prev => !prev)}
                        />
                        <SettingToggleCard
                            icon={Bell}
                            title="Promotions & Special Offers"
                            description="Receive exclusive member discounts, coupons, and seasonal offers."
                            checked={promoAlerts}
                            onChange={() => setPromoAlerts(prev => !prev)}
                        />
                    </div>
                </div>

                {/* 2. Security & Privacy Section */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-red-50 text-[#811919] flex items-center justify-center">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-[#0F172A]">Security & Privacy</h2>
                            <p className="text-xs text-[#64748B]">Protect your account credentials and login sessions.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <SettingActionCard
                            icon={KeyRound}
                            title="Change Password"
                            description="Update your account password regularly to keep your credentials secure."
                            badge="Recommended"
                            onClick={() => alert("Change Password modal / flow")}
                        />
                        <SettingActionCard
                            icon={Lock}
                            title="Two-Factor Authentication (2FA)"
                            description="Require OTP verification via mobile SMS during login."
                            badge={twoFactor ? "Active" : "Disabled"}
                            onClick={() => setTwoFactor(prev => !prev)}
                        />
                        <SettingActionCard
                            icon={Laptop}
                            title="Active Login Sessions"
                            description="Review and terminate sessions logged in on other devices or browsers."
                            badge="1 Active Device"
                            onClick={() => alert("Currently logged in from this Chrome browser.")}
                        />
                    </div>
                </div>

                {/* 3. Danger Zone Section */}
                <div className="pt-4 border-t border-gray-100">
                    <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                                <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-rose-900">Deactivate or Delete Account</h3>
                                <p className="text-xs text-rose-700/90 mt-0.5 max-w-xl">
                                    Once deleted, your profile data and booking history cannot be recovered.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                                    alert("Account deletion request submitted.");
                                }
                            }}
                            className="cursor-pointer px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 shadow-xs"
                        >
                            Delete Account
                        </button>
                    </div>
                </div>

                {/* Save Button & Tagline Footer */}
                <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-gray-100">
                    <button
                        onClick={handleSaveSettings}
                        className="cursor-pointer px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2.5 shadow-sm transition-all bg-[#811919] hover:bg-[#681010] text-white shadow-red-900/20"
                    >
                        <Save className="w-4 h-4" />
                        <span>Save Preferences</span>
                    </button>

                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium select-none">
                        <span className="w-4 h-[2px] bg-[#811919] rounded-full inline-block" />
                        <span className="italic font-serif text-gray-600">A Smarter Way to See the World</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ---------- Subcomponents ---------- */

const SettingToggleCard = ({ icon: Icon, title, description, checked, onChange }) => (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-gray-300 transition-all">
        <div className="flex items-center gap-3.5 pr-4">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#811919] shrink-0">
                <Icon className="w-4 h-4" />
            </div>
            <div>
                <p className="text-sm font-semibold text-[#0F172A]">{title}</p>
                <p className="text-xs text-[#64748B] mt-0.5">{description}</p>
            </div>
        </div>

        {/* Custom iOS Toggle Switch */}
        <button
            type="button"
            onClick={onChange}
            className={`cursor-pointer relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-[#811919]' : 'bg-[#CBD5E1]'
                }`}
        >
            <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-0.5 ${checked ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
            />
        </button>
    </div>
);

const SettingActionCard = ({ icon: Icon, title, description, badge, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-white hover:border-gray-300 hover:shadow-xs transition-all text-left group cursor-pointer"
    >
        <div className="flex items-center gap-3.5 pr-4">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#811919] group-hover:scale-105 transition-transform shrink-0">
                <Icon className="w-4 h-4" />
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#0F172A] group-hover:text-[#811919] transition-colors">
                        {title}
                    </p>
                    {badge && (
                        <span className="px-2 py-0.5 bg-red-50 text-[#811919] text-[10px] font-bold rounded-full border border-red-100">
                            {badge}
                        </span>
                    )}
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">{description}</p>
            </div>
        </div>

        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#811919] group-hover:translate-x-0.5 transition-all shrink-0" />
    </button>
);

export default React.memo(SettingsPanel);

