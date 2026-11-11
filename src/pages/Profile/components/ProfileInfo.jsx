import React from 'react';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Coins,
    Languages,
    Plane,
    Save,
    Edit3,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Lock,
} from 'lucide-react';
import WorldMapDots from '@/assets/imgs/world_map_dots.jpg';

const ProfileInfo = ({
    userData,
    editData,
    isEditing,
    isSaving,
    saveError,
    saveSuccess,
    handleChange,
    handleEdit,
    handleSave,
}) => {
    // If phone number already exists, it cannot be edited. If empty/no data, the user can fill it.
    const hasExistingPhone = Boolean(userData?.phone && String(userData.phone).trim() !== '');
    const isPhoneDisabled = !isEditing || hasExistingPhone;

    return (
        <div className="relative bg-white rounded-3xl p-5 sm:p-7 lg:p-8 border border-gray-100 shadow-sm overflow-hidden">
            {/* Status alerts */}
            {saveSuccess && (
                <div className="mb-6 flex items-center gap-2 p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-sm font-medium animate-fadeIn">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                    <span>{saveSuccess}</span>
                </div>
            )}
            {saveError && (
                <div className="mb-6 flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-sm font-medium animate-fadeIn">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                    <span>{saveError}</span>
                </div>
            )}

            {/* Header with Seamless Dotted World Map & Pure Flying Jet Arc */}
            <div className="relative mb-8 pb-3 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Seamless Background: Dotted World Map + Flying Plane (Zero Square Edge Artifacts) */}
                <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden flex items-center justify-center">
                    {/* Dotted World Map with soft radial fade */}
                    <div
                        className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-[0.25]"
                        style={{
                            backgroundImage: `url(${WorldMapDots})`,
                            maskImage: 'radial-gradient(ellipse 75% 65% at 50% 50%, black 30%, transparent 85%)',
                            WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 50%, black 30%, transparent 85%)',
                        }}
                    />

                    {/* Flying Compact Commercial Airliner with Curved Dashed Flight Trajectory */}
                    <div className="absolute right-[140px] sm:right-[165px] md:right-[195px] top-1/2 -translate-y-1/2 w-[120px] h-[46px] hidden sm:block">
                        <svg viewBox="0 0 120 46" className="w-full h-full overflow-visible">
                            {/* Smooth upward curving dashed trajectory */}
                            <path
                                d="M 6 40 C 40 38 68 30 90 14"
                                fill="none"
                                stroke="#2F3C48"
                                strokeWidth="1.6"
                                strokeDasharray="4 3.5"
                                strokeLinecap="round"
                                className="opacity-75"
                            />
                            {/* Compact Commercial Passenger Airplane Silhouette */}
                            <g transform="translate(94, 11) rotate(42) scale(0.55)">
                                <path
                                    d="M 0,-16 C 1.2,-16 2.5,-12 2.5,-4 L 14,2.5 C 15,3.2 14.8,4.5 13.2,4.5 L 2.5,3.2 L 2.5,10.5 L 6.2,13.8 C 6.8,14.3 6.6,15.2 5.6,15.2 L 0,13.8 L -5.6,15.2 C -6.6,15.2 -6.8,14.3 -6.2,13.8 L -2.5,10.5 L -2.5,3.2 L -13.2,4.5 C -14.8,4.5 -15,3.2 -14,2.5 L -2.5,-4 C -2.5,-12 -1.2,-16 0,-16 Z"
                                    fill="#2F3C48"
                                />
                            </g>
                        </svg>
                    </div>
                </div>

                {/* Left Text */}
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-5 h-[2.5px] bg-[#811919] rounded-full inline-block" />
                        <span className="text-[10px] sm:text-xs font-bold tracking-widest text-[#1E293B] uppercase">
                            ACCOUNT DETAILS
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D1527] tracking-tight">
                        Personal Information
                    </h1>
                    <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                        Manage your account details for a better travel experience.
                    </p>
                </div>

                {/* Right Edit Button */}
                <div className="relative z-10">
                    <button
                        onClick={handleEdit}
                        className={`cursor-pointer px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all ${isEditing
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-[#811919] hover:bg-[#681010] text-white shadow-red-900/15'
                            }`}
                    >
                        <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>{isEditing ? 'Editing Profile' : 'Edit Profile'}</span>
                    </button>
                </div>
            </div>

            {/* Form Fields - Full Width */}
            <div className="relative z-10 space-y-6">
                {/* Row 1: Full Name & Email Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-[#1E293B] mb-1.5">
                            <User className="w-4 h-4 text-[#811919]" />
                            <span>Full Name</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={editData.name ?? ''}
                            onChange={handleChange}
                            disabled={!isEditing}
                            placeholder="Enter your full name"
                            className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all outline-none ${isEditing
                                ? 'bg-white border border-gray-300 text-[#0F172A] focus:border-[#811919] focus:ring-2 focus:ring-[#811919]/15'
                                : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B]'
                                }`}
                        />
                    </div>

                    {/* Email Address */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-[#1E293B] mb-1.5">
                            <Mail className="w-4 h-4 text-[#811919]" />
                            <span>Email Address</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={editData.email ?? ''}
                            onChange={handleChange}
                            disabled={!isEditing}
                            placeholder="name@example.com"
                            className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all outline-none ${isEditing
                                ? 'bg-white border border-gray-300 text-[#0F172A] focus:border-[#811919] focus:ring-2 focus:ring-[#811919]/15'
                                : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B]'
                                }`}
                        />
                    </div>
                </div>

                {/* Row 2: Phone Number & Country */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Phone Number */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-[#1E293B] mb-1.5">
                            <Phone className="w-4 h-4 text-[#811919]" />
                            <span>Phone Number</span>
                        </label>
                        <div className="flex items-center rounded-xl overflow-hidden bg-[#F8FAFC] border border-[#E2E8F0] cursor-not-allowed">
                            {/* Indian Flag Dropdown */}
                            <div className="flex items-center gap-1.5 px-3 py-2.5 border-r border-[#E2E8F0] select-none shrink-0 bg-[#F8FAFC]">
                                <svg className="w-5 h-3.5 rounded-[2px] shadow-2xs overflow-hidden" viewBox="0 0 640 480">
                                    <path fill="#f93" d="M0 0h640v160H0z" />
                                    <path fill="#fff" d="M0 160h640v160H0z" />
                                    <path fill="#128807" d="M0 320h640v160H0z" />
                                    <g transform="translate(320 240) scale(3.2)">
                                        <circle r="20" fill="none" stroke="#000088" strokeWidth="2" />
                                        <circle r="3.5" fill="#000088" />
                                        <g id="d">
                                            <g id="c">
                                                <g id="b">
                                                    <g id="a">
                                                        <line x1="0" y1="0" x2="0" y2="20" stroke="#000088" strokeWidth="0.8" />
                                                    </g>
                                                    <use href="#a" transform="rotate(15)" />
                                                </g>
                                                <use href="#b" transform="rotate(30)" />
                                            </g>
                                            <use href="#c" transform="rotate(60)" />
                                        </g>
                                        <use href="#d" transform="rotate(120)" />
                                        <use href="#d" transform="rotate(240)" />
                                    </g>
                                </svg>
                                <span className="text-gray-400 text-xs font-semibold">▾</span>
                            </div>
                            <input
                                type="tel"
                                name="phone"
                                value={editData.phone ?? ''}
                                readOnly
                                disabled
                                placeholder="+91 9876543210"
                                className="w-full px-3.5 py-2.5 text-sm bg-transparent outline-none text-[#1E293B] cursor-not-allowed select-none"
                            />
                        </div>
                    </div>

                    {/* Country */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-[#1E293B] mb-1.5">
                            <MapPin className="w-4 h-4 text-[#811919]" />
                            <span>Country</span>
                        </label>
                        <div className="relative">
                            <select
                                name="country"
                                value={editData.country || 'India'}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className={`w-full px-4 py-2.5 rounded-xl text-sm appearance-none transition-all outline-none cursor-pointer ${isEditing
                                    ? 'bg-white border border-gray-300 text-[#0F172A] focus:border-[#811919] focus:ring-2 focus:ring-[#811919]/15'
                                    : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B]'
                                    }`}
                            >
                                <option value="India">India</option>
                                <option value="United Arab Emirates">United Arab Emirates</option>
                                <option value="United States">United States</option>
                                <option value="United Kingdom">United Kingdom</option>
                                <option value="Singapore">Singapore</option>
                                <option value="Thailand">Thailand</option>
                                <option value="Canada">Canada</option>
                                <option value="Australia">Australia</option>
                            </select>
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                                ▾
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sub-section: Travel Preferences */}
                <div className="pt-5 border-t border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                        <Plane className="w-5 h-5 text-[#811919] transform -rotate-45" />
                        <div>
                            <h2 className="text-sm font-bold text-[#0F172A] leading-snug">
                                Travel Preferences <span className="text-[#64748B] font-normal text-xs">(Optional)</span>
                            </h2>
                            <p className="text-xs text-[#64748B]">
                                Help us personalise your travel experience
                            </p>
                        </div>
                    </div>

                    {/* Currency, Language & Date of Birth in Clean Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Preferred Currency */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-[#1E293B] mb-1.5">
                                <Coins className="w-4 h-4 text-[#811919]" />
                                <span>Preferred Currency</span>
                            </label>
                            <div className="relative">
                                <select
                                    name="preferredCurrency"
                                    value={editData.preferredCurrency || 'INR (₹)'}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-2.5 rounded-xl text-sm appearance-none transition-all outline-none cursor-pointer ${isEditing
                                        ? 'bg-white border border-gray-300 text-[#0F172A] focus:border-[#811919] focus:ring-2 focus:ring-[#811919]/15'
                                        : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B]'
                                        }`}
                                >
                                    <option value="INR (₹)">INR (₹)</option>
                                    <option value="USD ($)">USD ($)</option>
                                    <option value="EUR (€)">EUR (€)</option>
                                    <option value="AED (د.إ)">AED (د.إ)</option>
                                    <option value="GBP (£)">GBP (£)</option>
                                </select>
                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                                    ▾
                                </span>
                            </div>
                        </div>

                        {/* Preferred Language */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-[#1E293B] mb-1.5">
                                <Languages className="w-4 h-4 text-[#811919]" />
                                <span>Preferred Language</span>
                            </label>
                            <div className="relative">
                                <select
                                    name="preferredLanguage"
                                    value={editData.preferredLanguage || 'English'}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-2.5 rounded-xl text-sm appearance-none transition-all outline-none cursor-pointer ${isEditing
                                        ? 'bg-white border border-gray-300 text-[#0F172A] focus:border-[#811919] focus:ring-2 focus:ring-[#811919]/15'
                                        : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B]'
                                        }`}
                                >
                                    <option value="English">English</option>
                                    <option value="Hindi">Hindi</option>
                                    <option value="Spanish">Spanish</option>
                                    <option value="French">French</option>
                                    <option value="Arabic">Arabic</option>
                                </select>
                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                                    ▾
                                </span>
                            </div>
                        </div>

                        {/* Date of Birth */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-[#1E293B] mb-1.5">
                                <Calendar className="w-4 h-4 text-[#811919]" />
                                <span>Date of Birth</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={isEditing ? "date" : "text"}
                                    name="dateOfBirth"
                                    value={editData.dateOfBirth ?? ''}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    placeholder="DD / MM / YYYY"
                                    className={`w-full pl-4 pr-10 py-2.5 rounded-xl text-sm transition-all outline-none ${isEditing
                                        ? 'bg-white border border-gray-300 text-[#0F172A] focus:border-[#811919] focus:ring-2 focus:ring-[#811919]/15'
                                        : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B]'
                                        }`}
                                />
                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <Calendar className="w-4 h-4" />
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button & Footer Tagline */}
                <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !isEditing}
                        className={`cursor-pointer px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2.5 shadow-sm transition-all ${isEditing
                            ? 'bg-[#811919] hover:bg-[#681010] text-white shadow-red-900/20'
                            : 'bg-[#811919] hover:bg-[#681010] text-white shadow-sm'
                            }`}
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
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

export default React.memo(ProfileInfo);
