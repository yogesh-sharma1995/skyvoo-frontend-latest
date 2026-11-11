import { useState, useRef, useEffect } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '@/assets/imgs/logo.png';
import { useAuth } from '@/contexts/AuthContext';

const FlightSearchTopHeader = ({ onOpen }) => {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const dropdownRef = useRef(null);
    const timeoutRef = useRef(null);

    const supportItems = [
        'Check Your Refund',
        'Contact Us',
        'Complete Booking',
        'Make a Payment',
        'Flight Cancellation Charges',
        'Complete Holidays Bookings'
    ];

    const offersItems = [
        'Diwali Offers',
        'Holi Offers',
        'Cheapest Offers'
    ];

    const handleMouseEnter = (dropdown) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setActiveDropdown(dropdown);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setActiveDropdown(null);
        }, 100);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleDropdownToggle = (dropdown) => {
        setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
    };

    return (
        <header className="relative z-9997 bg-white/45 backdrop-blur-lg border-b border-white/50 shadow-[0_4px_30px_rgba(0,0,0,0.04)]">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-1.5 md:py-1.5">
                {/* Logo */}
                <div className="flex items-center">
                    <img
                        onClick={() => navigate('/')}
                        src={Logo}
                        className="cursor-pointer h-9 sm:h-10 md:h-11 w-auto"
                        alt="SkyVoo Logo"
                    />
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-1 lg:space-x-1 text-black text-base font-semibold" ref={dropdownRef}>
                    {/* Support Dropdown */}
                    <div
                        className="relative"
                        onMouseEnter={() => handleMouseEnter('support')}
                        onMouseLeave={handleMouseLeave}
                    >
                        <button className="text-sm cursor-pointer px-4 py-1 sm:px-3 rounded-full hover:bg-gray-100 transition-colors flex items-center">
                            Support
                            <ChevronDown className={`ml-1 w-4 h-4 transition-transform ${activeDropdown === 'support' ? 'rotate-180' : ''}`} />
                        </button>

                        {activeDropdown === 'support' && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                                {supportItems.map((item) => (
                                    <button
                                        key={item}
                                        className="text-xs block w-full text-left px-4 my-1 py-2 hover:bg-gray-50 text-gray-700 transition-colors"
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Offers Dropdown */}
                    <div
                        className="relative"
                        onMouseEnter={() => handleMouseEnter('offers')}
                        onMouseLeave={handleMouseLeave}
                    >
                        <button className="text-sm cursor-pointer px-4 py-1 sm:px-3 rounded-full hover:bg-gray-100 transition-colors flex items-center">
                            Offers
                            <ChevronDown className={`ml-1 w-4 h-4 transition-transform ${activeDropdown === 'offers' ? 'rotate-180' : ''}`} />
                        </button>

                        {activeDropdown === 'offers' && (
                            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                                {offersItems.map((item) => (
                                    <button
                                        key={item}
                                        className="block w-full text-left px-4 py-2 my-1 hover:bg-gray-50 text-gray-700 text-xs transition-colors"
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* My Account if Logged In, otherwise Login */}
                    {isLoggedIn ? (
                        <button
                            className="text-sm cursor-pointer px-4 py-1 sm:px-3 rounded-full hover:bg-gray-100 transition-colors"
                            onClick={() => navigate('/my-profile')}
                        >
                            My Account
                        </button>
                    ) : (
                        <button
                            className="text-sm cursor-pointer px-4 py-1 sm:px-3 rounded-full hover:bg-gray-100 transition-colors"
                            onClick={onOpen}
                        >
                            Login
                        </button>
                    )}
                </nav>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden inline-flex items-center justify-center p-2 text-black"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                >
                    {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Dropdown */}
            {mobileOpen && (
                <div className="md:hidden bg-white shadow-lg">
                    <div className="px-4 pt-2 pb-4 space-y-2">
                        {isLoggedIn ? (
                            <button
                                className="block w-full text-left px-4 py-2 rounded-md bg-[#F5F5F5] hover:bg-black hover:text-white transition font-medium"
                                onClick={() => {
                                    setMobileOpen(false);
                                    navigate('/my-profile');
                                }}
                            >
                                My Account
                            </button>
                        ) : (
                            <button
                                className="block w-full text-left px-4 py-2 rounded-md bg-[#F5F5F5] hover:bg-black hover:text-white transition font-medium"
                                onClick={() => {
                                    setMobileOpen(false);
                                    onOpen();
                                }}
                            >
                                Login
                            </button>
                        )}

                        {/* Support Mobile Dropdown */}
                        <div>
                            <button
                                className="flex items-center justify-between w-full text-left px-4 py-2 rounded-md bg-[#F5F5F5] hover:bg-black hover:text-white transition"
                                onClick={() => handleDropdownToggle('support-mobile')}
                            >
                                Support
                                <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === 'support-mobile' ? 'rotate-180' : ''}`} />
                            </button>
                            {activeDropdown === 'support-mobile' && (
                                <div className="mt-2 ml-4 space-y-1">
                                    {supportItems.map((item) => (
                                        <button
                                            key={item}
                                            className="block w-full text-left px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm transition"
                                            onClick={() => setActiveDropdown(null)}
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Offers Mobile Dropdown */}
                        <div>
                            <button
                                className="flex items-center justify-between w-full text-left px-4 py-2 rounded-md bg-[#F5F5F5] hover:bg-black hover:text-white transition"
                                onClick={() => handleDropdownToggle('offers-mobile')}
                            >
                                Offers
                                <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === 'offers-mobile' ? 'rotate-180' : ''}`} />
                            </button>
                            {activeDropdown === 'offers-mobile' && (
                                <div className="mt-2 ml-4 space-y-1">
                                    {offersItems.map((item) => (
                                        <button
                                            key={item}
                                            className="block w-full text-left px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm transition"
                                            onClick={() => setActiveDropdown(null)}
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default FlightSearchTopHeader;