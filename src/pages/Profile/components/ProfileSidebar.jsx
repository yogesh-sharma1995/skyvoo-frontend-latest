import React from 'react';
import {
    User,
    Plane,
    Settings,
    Tag,
    Gift,
    Headphones,
    FileText,
    LogOut,
    ChevronRight,
    Camera,
    Crown,
} from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ProfileWingCover from '@/assets/imgs/profile_wing_cover.jpg';
import MountainFooter from '@/assets/imgs/mountain_footer.jpg';

const ProfileSidebar = ({
    activeTab,
    setActiveTab,
    userData,
    profilePic,
    onUploadClick,
}) => {
    const navigate = useNavigate();
    const { logout, user, isB2B: authIsB2B } = useAuth();

    const rawUserType = (user?.UserType || user?.userType || user?.Role || user?.role || "").toLowerCase();
    const isB2C = rawUserType === "b2c";
    const showMarkup = (authIsB2B || rawUserType === "b2b") && !isB2C;

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to log out?")) {
            logout();
            navigate('/');
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between h-full">
            <div>
                {/* Header Cover Banner */}
                <div
                    className="relative h-28 sm:h-32 bg-cover bg-center"
                    style={{
                        backgroundImage: `url(${ProfileWingCover})`,
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35" />
                </div>

                {/* Profile Avatar & Info */}
                <div className="relative px-5 pt-0 pb-3 text-center">
                    {/* Avatar with Camera badge */}
                    <div className="flex justify-center -mt-12 sm:-mt-14 mb-3">
                        <div className="relative group">
                            <div className="w-24 h-24 sm:w-26 sm:h-26 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-100 flex items-center justify-center">
                                {profilePic ? (
                                    <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-12 h-12 text-gray-400" />
                                )}
                            </div>

                            {/* Camera upload badge button */}
                            <button
                                onClick={onUploadClick}
                                title="Change photo"
                                aria-label="Upload profile picture"
                                className="absolute bottom-0 right-0 w-7 h-7 sm:w-8 sm:h-8 bg-[#811919] hover:bg-[#681010] text-white rounded-full flex items-center justify-center shadow-md transition cursor-pointer border-2 border-white"
                            >
                                <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Name & Member details */}
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                        {userData.name || 'User Name'}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Member since {userData.memberSince || '2025'}
                    </p>

                    {/* Badge */}
                    <div className="mt-2.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-[#811919] border border-red-100/80 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase">
                            <Crown className="w-3 h-3 text-[#811919]" />
                            {userData.tier || 'SKYVOO TRAVELER'}
                        </span>
                    </div>

                    {/* Quote */}
                    <p className="text-xs italic text-gray-400 font-serif mt-3 select-none">
                        “Collect Moments Not Things”
                    </p>

                    {/* Navigation Menu */}
                    <div className="space-y-1.5 pt-4 mt-3 border-t border-gray-100 text-left">
                        <SidebarButton
                            icon={User}
                            label="Profile Info"
                            active={activeTab === 'profile'}
                            onClick={() => setActiveTab('profile')}
                        />

                        <SidebarButton
                            icon={Plane}
                            label="My Bookings"
                            active={activeTab === 'bookings'}
                            onClick={() => setActiveTab('bookings')}
                        />

                        <SidebarButton
                            icon={Settings}
                            label="Settings"
                            active={activeTab === 'settings'}
                            onClick={() => setActiveTab('settings')}
                        />

                        {showMarkup && (
                            <SidebarLink icon={Tag} label="Mark Ups" onClick={() => navigate('/mark-up')} />
                        )}
                        <SidebarLink icon={Gift} label="Coupons & Offers" onClick={() => navigate('/coupons-and-offers')} />
                        <SidebarLink icon={Headphones} label="Complaint Register" onClick={() => navigate('/complaint-register')} />
                        <SidebarLink icon={FileText} label="Statement" onClick={() => navigate('/statement')} />

                        <SidebarLink icon={LogOut} label="Log Out" onClick={handleLogout} danger />
                    </div>
                </div>
            </div>

            {/* Sidebar Bottom / Footer with Mountain ("Phar") exactly matching mockup */}
            <div className="relative pt-6 pb-5 px-5 overflow-hidden border-t border-gray-50/80 min-h-[110px] sm:min-h-[120px] flex items-end justify-between bg-white rounded-b-3xl">
                {/* Mountain artwork spanning from the right bottom */}
                <div className="absolute -bottom-1 -right-2 w-[72%] h-[115px] sm:h-[125px] pointer-events-none select-none z-0">
                    <img
                        src={MountainFooter}
                        alt="Mountain"
                        className="w-full h-full object-cover object-bottom"
                    />
                </div>

                {/* Text on bottom-left */}
                <div className="relative z-10 flex flex-col items-start pb-1">
                    <span className="text-[10px] font-extrabold tracking-widest text-[#596A7D] uppercase leading-tight">
                        TRAVEL
                    </span>
                    <span className="text-[10px] font-extrabold tracking-widest text-[#596A7D] uppercase leading-tight mt-0.5">
                        BEYOND BORDERS
                    </span>
                    <div className="w-5 h-[2.5px] bg-[#811919] rounded-full mt-2" />
                </div>
            </div>
        </div>
    );
};

const SidebarButton = ({ icon: Icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={clsx(
            'group w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition cursor-pointer text-sm font-medium',
            active
                ? 'bg-[#FEF2F2] text-[#811919] font-bold border-l-4 border-[#811919] shadow-2xs'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        )}
    >
        <div className="flex items-center gap-3">
            <Icon className={clsx('w-4 h-4 transition-colors', active ? 'text-[#811919]' : 'text-gray-400 group-hover:text-gray-600')} />
            <span>{label}</span>
        </div>
        <ChevronRight className={clsx('w-4 h-4 transition-transform', active ? 'text-[#811919]' : 'text-gray-300 group-hover:translate-x-0.5 group-hover:text-gray-500')} />
    </button>
);

const SidebarLink = ({ icon: Icon, label, onClick, danger }) => (
    <button
        onClick={onClick}
        className={clsx(
            'group w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition cursor-pointer text-sm font-medium',
            danger
                ? 'text-red-600 hover:bg-red-50'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        )}
    >
        <div className="flex items-center gap-3">
            <Icon className={clsx('w-4 h-4', danger ? 'text-red-500' : 'text-gray-400 group-hover:text-gray-600')} />
            <span>{label}</span>
        </div>
        <ChevronRight className={clsx('w-4 h-4', danger ? 'text-red-300' : 'text-gray-300 group-hover:translate-x-0.5 group-hover:text-gray-500')} />
    </button>
);

export default React.memo(ProfileSidebar);
