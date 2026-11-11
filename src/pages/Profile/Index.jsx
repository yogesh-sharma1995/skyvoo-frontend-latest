import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plane, Globe, Award, ReceiptIndianRupee } from 'lucide-react';
import getCroppedImg from '@/utils/getCroppedImg.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ProfileStats from './components/ProfileStats';
import ImageCropModal from './components/ImageCropModal';
import ProfileSidebar from './components/ProfileSidebar';
import ProfileInfo from './components/ProfileInfo';
import BookingHistory from './components/BookingHistory';
import SettingsPanel from './components/SettingsPanel';
import ProfileBg from '@/assets/imgs/myaccount.png';

function Profile() {
    const navigate = useNavigate();
    const { user, updateUserProfile } = useAuth();

    const [userData, setUserData] = useState(() => {
        const raw = typeof window !== "undefined" ? localStorage.getItem("skyvoo_user") : null;
        const stored = raw ? JSON.parse(raw) : null;
        const activeUser = user || stored;

        return {
            name: activeUser?.Name || activeUser?.UserName || activeUser?.OutletName,
            email: activeUser?.Email,
            phone: activeUser?.Mobile ? (String(activeUser.Mobile).startsWith('+') ? activeUser.Mobile : `+91 ${activeUser.Mobile}`) : '',
            country: activeUser?.Country || activeUser?.country || 'India',
            preferredCurrency: activeUser?.PreferredCurrency || activeUser?.preferredCurrency || 'INR (₹)',
            preferredLanguage: activeUser?.PreferredLanguage || activeUser?.preferredLanguage || 'English',
            dateOfBirth: activeUser?.DateOfBirth || activeUser?.dob || '',
            passportNumber: activeUser?.PassportNumber || '',
            memberSince: activeUser?.CreatedDate ? new Date(activeUser.CreatedDate).getFullYear().toString() : '2025',
            tier: activeUser?.Tier
        };
    });

    // Sync with active user context
    useEffect(() => {
        if (user) {
            setUserData(prev => ({
                ...prev,
                name: user.Name || user.UserName || user.OutletName || prev.name,
                email: user.Email !== undefined ? user.Email : prev.email,
                phone: user.Mobile ? (String(user.Mobile).startsWith('+') ? user.Mobile : `+91 ${user.Mobile}`) : prev.phone,
                country: user.Country || user.country || prev.country,
                preferredCurrency: user.PreferredCurrency || user.preferredCurrency || prev.preferredCurrency,
                preferredLanguage: user.PreferredLanguage || user.preferredLanguage || prev.preferredLanguage,
                dateOfBirth: user.DateOfBirth || user.dob || prev.dateOfBirth,
                passportNumber: user.PassportNumber || prev.passportNumber,
                memberSince: user.CreatedDate ? new Date(user.CreatedDate).getFullYear().toString() : prev.memberSince,
                tier: user.Tier || prev.tier,
            }));
        }
    }, [user]);

    const [profilePic, setProfilePic] = useState(null);
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [cropping, setCropping] = useState(false);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('profile');

    const [editData, setEditData] = useState({ ...userData });

    // Sync editData when userData updates and not actively editing
    useEffect(() => {
        if (!isEditing) {
            setEditData({ ...userData });
        }
    }, [userData, isEditing]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageSrc(reader.result);
                setCropping(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const onCropComplete = useCallback((_, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleCropConfirm = async () => {
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            setProfilePic(croppedImage);
            setCropping(false);
        } catch (e) {
            console.error(e);
        }
    };

    const handleCropCancel = () => {
        setCropping(false);
        setImageSrc(null);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
    };

    const handleEdit = () => {
        setIsEditing(prev => !prev);
        setSaveError('');
        setSaveSuccess('');
        setEditData({ ...userData });
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveError('');
        setSaveSuccess('');

        try {
            const rawMobile = editData.phone ? String(editData.phone).replace(/\D/g, '').slice(-10) : '';
            const mobileToSend = rawMobile || (user?.Mobile ? String(user.Mobile).replace(/\D/g, '').slice(-10) : '');

            const payload = {
                Name: editData.name,
                Email: editData.email,
                Mobile: mobileToSend,
            };

            const res = await updateUserProfile(payload);
            const isSuccess = res?.Status === "SUCCESS" || res?.IsSuccess === true || res?.Status === 1 || !!res?.Data;

            if (isSuccess || !res?.ErrorMessage) {
                setUserData(prev => ({
                    ...prev,
                    name: editData.name,
                    email: editData.email,
                    phone: mobileToSend ? (mobileToSend.startsWith('+') ? mobileToSend : `+91 ${mobileToSend}`) : prev.phone,
                    country: editData.country,
                    preferredCurrency: editData.preferredCurrency,
                    preferredLanguage: editData.preferredLanguage,
                    dateOfBirth: editData.dateOfBirth,
                }));

                setSaveSuccess('Profile updated successfully!');
                setIsEditing(false);
                setTimeout(() => setSaveSuccess(''), 4000);
            } else {
                setSaveError(res?.ErrorMessage || res?.message || 'Failed to update profile. Please try again.');
            }
        } catch (err) {
            console.error("Failed to update profile:", err);
            setSaveError(
                err?.response?.data?.ErrorMessage ||
                err?.response?.data?.message ||
                'Failed to update profile. Please try again.'
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (e) => {
        setEditData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const firstName = useMemo(() => {
        const full = userData?.name || 'User';
        return full.split(' ')[0];
    }, [userData?.name]);

    return (
        <>
            {cropping && imageSrc && (
                <ImageCropModal
                    imageSrc={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    setCrop={setCrop}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    setZoom={setZoom}
                    onCropComplete={onCropComplete}
                    onCancel={handleCropCancel}
                    onConfirm={handleCropConfirm}
                />
            )}

            <div className="min-h-screen bg-white relative py-5 sm:py-6 lg:py-7 px-4 sm:px-6 lg:px-8">
                {/* Hero Scenic Aviation & Mountain Background Image: exactly matching mockup */}
                <div
                    className="absolute -top-[56px] left-0 right-0 h-[330px] sm:h-[350px] lg:h-[370px] bg-no-repeat pointer-events-none z-0 overflow-hidden"
                    style={{
                        backgroundImage: `url(${ProfileBg})`,
                        // backgroundPosition: 'right 48%',
                        backgroundSize: 'cover',
                    }}
                >
                    {/* Bottom fade into 100% pure white right below the 4 stat cards */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent 35% via-white/60 65% to-white" />
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    {/* Explore Book Fly Artistic Badge at Top Right (matching mockup) */}
                    <div className="absolute -top-2 right-2 sm:right-6 lg:right-20 hidden md:flex items-center gap-2 pointer-events-none select-none z-20">
                        <div className="text-right">
                            <div className="font-serif italic text-xs sm:text-[13px] text-gray-700 tracking-wide leading-tight">
                                Explore
                            </div>
                            <div className="font-serif italic font-semibold text-xs sm:text-[13px] text-gray-800 tracking-wide leading-tight">
                                Book
                            </div>
                            <div className="font-serif italic font-bold text-xs sm:text-[13px] text-[#811919] tracking-wide leading-tight">
                                Fly
                            </div>
                        </div>
                        <div className="relative w-9 h-9 flex items-center justify-center">
                            <svg viewBox="0 0 40 40" className="w-full h-full overflow-visible">
                                <path
                                    d="M 4 34 C 14 30 24 16 32 8"
                                    fill="none"
                                    stroke="#811919"
                                    strokeWidth="1.6"
                                    strokeDasharray="2.5 2"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute top-0 right-0 transform rotate-45 text-[#811919]">
                                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
                        {/* Left Sidebar Column */}
                        <div className="w-full lg:w-[280px] xl:w-[295px] shrink-0">
                            <ProfileSidebar
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                userData={userData}
                                profilePic={profilePic}
                                onUploadClick={() => document.getElementById('profile-upload').click()}
                            />
                            <input
                                id="profile-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </div>

                        {/* Right Main Content Column */}
                        <div className="flex-1 min-w-0 space-y-6">
                            {/* Greeting Top Header matching reference mockup */}
                            {
                                firstName && <div>
                                    <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-normal text-[#1E293B] tracking-tight">
                                        Hello, <span className="font-extrabold text-[#0F172A]">{firstName}!</span>
                                    </h1>
                                    <div className="flex items-center gap-2.5 mt-1.5">
                                        <span className="w-5 h-[2.5px] bg-[#811919] rounded-full inline-block shrink-0" />
                                        <p className="text-xs sm:text-[13px] text-[#64748B] font-medium tracking-normal">
                                            Manage your profile and keep your travel experience seamless.
                                        </p>
                                    </div>
                                </div>
                            }


                            {/* 4 Stats Cards */}
                            <ProfileStats />

                            {/* Active Tab View */}
                            {activeTab === 'profile' && (
                                <ProfileInfo
                                    userData={userData}
                                    editData={editData}
                                    isEditing={isEditing}
                                    isSaving={isSaving}
                                    saveError={saveError}
                                    saveSuccess={saveSuccess}
                                    handleChange={handleChange}
                                    handleEdit={handleEdit}
                                    handleSave={handleSave}
                                />
                            )}

                            {activeTab === 'bookings' && (
                                <BookingHistory />
                            )}

                            {activeTab === 'settings' && (
                                <SettingsPanel />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Profile;