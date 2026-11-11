import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Menu, X, Headphones, User } from 'lucide-react';
import Home from '@/assets/vectors/SidebarHome.svg';
import Flights from '@/assets/vectors/SidebarFlight.svg';
import Cabs from '@/assets/vectors/SidebarCab.svg';
import Hotels from '@/assets/vectors/SidebarHotels.svg';
import Bus from '@/assets/vectors/SidebarBus.svg';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '@/assets/imgs/logo.png';
import comingSoon from '@/assets/imgs/comingSoon.png';
import { useAuth } from '@/contexts/AuthContext';

const Header = ({ onOpen }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoggedIn, user, logout, isB2B: authIsB2B } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef(null);

    // Prevent body scrolling when mobile drawer is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [mobileOpen]);

    // Close profile dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setProfileOpen(false);
            }
        };

        if (profileOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [profileOpen]);

    const rawUserType = (user?.UserType || user?.userType || user?.Role || user?.role || "").toLowerCase();
    const isB2C = rawUserType === "b2c";
    const isB2B = (authIsB2B || rawUserType === "b2b") && !isB2C;

    const navItems = [
        { label: 'Home', url: '/', icon: Home },
        { label: 'Flights', url: '/flight-results', icon: Flights },
        { label: 'Hotels', url: '/hotels', icon: Hotels },
        { label: 'Bus', url: '/bus', icon: Bus },
        { label: 'Cab', url: '/cab', icon: Cabs },
    ];

    const isItemActive = (itemUrl) => {
        if (itemUrl === '/') {
            return location.pathname === '/';
        }
        return location.pathname === itemUrl || location.pathname.startsWith(itemUrl);
    };

    const handleLogout = () => {
        logout();
        setProfileOpen(false);
        navigate('/');
    };
    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-[9999] bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_2px_15px_rgba(0,0,0,0.04)] transition-all">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-1.5 sm:py-2">
                {/* Logo */}
                <div className="flex items-center">
                    <img
                        onClick={() => navigate('/')}
                        src={Logo}
                        className="cursor-pointer h-8 sm:h-8.5 md:h-9 w-auto"
                        alt="SkyVoo Logo"
                    />
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 text-black text-sm md:text-[15px] font-semibold">
                    {/* --- OLD PILL NAVIGATION (COMMENTED OUT) ---
                    {navItems.map((item) => {
                        const isComingSoon = ['Hotels', 'Bus', 'Cab'].includes(item.label);
                        return (
                            <button
                                key={item.label}
                                disabled={isComingSoon}
                                onClick={() => !isComingSoon && navigate(item.url)}
                                className={`relative px-3.5 py-1 sm:px-4.5 sm:py-1 rounded-full transition bg-white/55 backdrop-blur-md border border-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_2px_8px_rgba(0,0,0,0.04)] ${isComingSoon
                                    ? '!cursor-not-allowed opacity-75'
                                    : 'cursor-pointer hover:bg-black hover:text-white hover:border-black'
                                    }`}
                            >
                                {item.label}
                                {isComingSoon && (
                                    <img
                                        src={comingSoon}
                                        alt="coming soon"
                                        className="absolute bottom-0 -right-0 w-10 h-4"
                                    />
                                )}
                            </button>
                        );
                    })}
                    --- END OLD PILL NAVIGATION --- */}

                    {/* NEW SIMPLE NAVIGATION (ACTIVE COLOR + HALF-WIDTH BOTTOM BORDER) */}
                    {navItems.map((item) => {
                        const isComingSoon = ['Hotels', 'Bus', 'Cab'].includes(item.label);
                        const isActive = isItemActive(item.url);

                        return (
                            <button
                                key={item.label}
                                disabled={isComingSoon}
                                onClick={() => !isComingSoon && navigate(item.url)}
                                className={`relative px-2.5 py-1.5 text-sm md:text-[15px] font-semibold tracking-wide transition-colors flex flex-col items-start justify-center ${isComingSoon
                                        ? '!cursor-not-allowed text-gray-400'
                                        : isActive
                                            ? 'text-[#811919] font-bold cursor-pointer'
                                            : 'text-gray-700 hover:text-[#811919] cursor-pointer'
                                    }`}
                            >
                                <span>{item.label}</span>

                                {/* Half-width bottom border starting from the left */}
                                {isActive && !isComingSoon && (
                                    <span className="absolute -bottom-1 left-2.5 w-1/2 h-[2.5px] bg-[#811919] rounded-full transition-all duration-300" />
                                )}

                                {isComingSoon && (
                                    <img
                                        src={comingSoon}
                                        alt="coming soon"
                                        className="absolute -bottom-1 -right-3 w-8 h-3.5 object-contain"
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Profile instead of Login */}
                {isLoggedIn ? (
                    <div className="relative hidden md:block" ref={profileRef}>
                        <button
                            onClick={() => setProfileOpen(!profileOpen)}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-white hover:bg-gray-800 transition cursor-pointer"
                            aria-label="Profile menu"
                        >
                            <User size={16} />
                        </button>

                        {profileOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md p-2 space-y-2 z-999">
                                {user?.OutletName && (
                                    <p className="px-3 py-1 text-xs text-gray-400 font-medium truncate border-b pb-2">
                                        {user.OutletName}
                                    </p>
                                )}
                                <button
                                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-100"
                                    onClick={() => { navigate('/my-profile'); setProfileOpen(false); }}
                                >
                                    Profile
                                </button>
                                <button
                                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-100"
                                    onClick={() => { navigate('/my-profile'); setProfileOpen(false); }}
                                >
                                    Settings
                                </button>
                                {isB2B && (
                                    <button
                                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-100"
                                        onClick={() => { navigate('/mark-up'); setProfileOpen(false); }}
                                    >
                                        Mark Ups
                                    </button>
                                )}
                                <button
                                    className="w-full text-left px-3 py-2 rounded text-red-600 hover:bg-gray-100"
                                    onClick={handleLogout}
                                >
                                    Log Out
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <button onClick={onOpen} className="cursor-pointer hidden md:inline-block px-4 sm:px-5 py-1 sm:py-1.5 font-medium bg-black text-white rounded-full hover:bg-gray-800 transition">Log In</button>
                )}

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden inline-flex items-center justify-center p-1.5 text-black"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                >
                    {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
        </header>

        {/* Mobile Drawer Rendered in Portal */}
        {mobileOpen && typeof document !== 'undefined' && createPortal(
            <div
                className={`fixed inset-0 z-[999998] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
                    mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setMobileOpen(false)}
            >
                {/* Sidebar Drawer */}
                <div
                    className={`fixed inset-y-0 left-0 h-screen h-[100dvh] w-[280px] max-w-[85vw] bg-[#4d0100] text-white shadow-2xl flex flex-col z-[999999] transform transition-transform duration-300 ease-in-out ${
                        mobileOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                    style={{ boxShadow: '6px 0 28px rgba(0, 0, 0, 0.5)' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Drawer Header with Logo and Close button */}
                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 shrink-0">
                        <img
                            src={Logo}
                            alt="SkyVoo Logo"
                            className="h-7 sm:h-8 w-auto brightness-0 invert object-contain cursor-pointer"
                            onClick={() => {
                                navigate('/');
                                setMobileOpen(false);
                            }}
                        />
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2 transition cursor-pointer"
                            aria-label="Close menu"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Menu Items */}
                    <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto min-h-0">
                        {navItems.map((item, index) => {
                            const isComingSoon = ['Hotels', 'Bus', 'Cab'].includes(item.label);
                            const isActive = isItemActive(item.url);

                            return (
                                <button
                                    key={index}
                                    disabled={isComingSoon}
                                    onClick={() => {
                                        if (!isComingSoon) {
                                            navigate(item.url);
                                            setMobileOpen(false);
                                        }
                                    }}
                                    className={`w-full flex items-center space-x-3.5 px-3 py-2.5 rounded-xl transition ${
                                        isComingSoon
                                            ? 'opacity-50 cursor-not-allowed'
                                            : isActive
                                            ? 'bg-white/15 text-white font-semibold'
                                            : 'hover:bg-white/10 text-white/90 cursor-pointer'
                                    }`}
                                >
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white shadow-sm shrink-0">
                                        <img
                                            src={item.icon}
                                            alt={item.label}
                                            className="w-5 h-5 object-contain"
                                        />
                                    </div>

                                    <div className="flex-1 flex items-center justify-between text-left">
                                        <span className="font-medium text-sm text-white">{item.label}</span>
                                        {isComingSoon && (
                                            <span className="text-[10px] bg-white/20 text-white/90 px-2 py-0.5 rounded-full font-normal">
                                                Coming Soon
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-white/10 space-y-3 bg-[#420100] shrink-0">
                        {/* Login / Logout Button for mobile */}
                        {isLoggedIn ? (
                            <button
                                onClick={() => {
                                    setMobileOpen(false);
                                    handleLogout();
                                }}
                                className="w-full py-2.5 px-4 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl text-white font-medium text-sm transition cursor-pointer"
                            >
                                Log Out
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    setMobileOpen(false);
                                    onOpen?.();
                                }}
                                className="w-full py-2.5 px-4 bg-white text-black font-semibold rounded-xl text-sm hover:bg-gray-100 transition shadow-sm cursor-pointer"
                            >
                                Login
                            </button>
                        )}

                        {/* Customer Support */}
                        <button
                            onClick={() => {
                                navigate('/complaint-register');
                                setMobileOpen(false);
                            }}
                            className="w-full flex items-center justify-center space-x-2 py-2 text-white/80 hover:text-white transition text-xs font-medium cursor-pointer"
                        >
                            <Headphones size={16} />
                            <span>Customer Support</span>
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        )}
        </>

    );
};

export default Header;
