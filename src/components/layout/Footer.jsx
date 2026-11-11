import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowRight, MapPin, Phone, Mail, ShieldCheck, Globe, Headphones } from 'lucide-react';
import Logo from '@/assets/imgs/logo.png';

// Social Icon Components
const FacebookIcon = () => (
    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.667 5H18V0h-3.808C10.595 0 9 1.582 9 4.615V8z" />
    </svg>
);

const InstagramIcon = () => (
    <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
);

const LinkedInIcon = () => (
    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
    </svg>
);

const YouTubeIcon = () => (
    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
);

const XIcon = () => (
    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

// IATA Badge SVG Component
const IATALogo = () => (
    <div className="flex flex-col items-center justify-center shrink-0">
        <svg viewBox="0 0 140 70" className="w-[84px] sm:w-[94px] h-auto">
            <defs>
                <linearGradient id="iataGlobeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
            </defs>
            {/* Globe with Grid */}
            <g fill="none" stroke="#ffffff" strokeWidth="1.8">
                <circle cx="70" cy="22" r="17" />
                <ellipse cx="70" cy="22" rx="8.5" ry="17" />
                <ellipse cx="70" cy="22" rx="15" ry="6" />
                <line x1="53" y1="22" x2="87" y2="22" />
            </g>
            {/* Wings Left */}
            <g fill="#ffffff">
                <path d="M16 28 L46 28 L48 32 L20 32 Z" />
                <path d="M24 35 L48 35 L50 39 L30 39 Z" />
                <path d="M34 42 L52 42 L53 46 L38 46 Z" />
            </g>
            {/* Wings Right */}
            <g fill="#ffffff">
                <path d="M124 28 L94 28 L92 32 L120 32 Z" />
                <path d="M116 35 L92 35 L90 39 L110 39 Z" />
                <path d="M106 42 L88 42 L87 46 L102 46 Z" />
            </g>
            {/* IATA Bold Typography */}
            <text
                x="70"
                y="64"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="20"
                fontWeight="900"
                fontFamily="Arial, -apple-system, sans-serif"
                letterSpacing="3"
            >
                IATA
            </text>
        </svg>
    </div>
);

// Payment Method SVG Badges
const VisaBadge = () => (
    <div className="h-6 flex items-center justify-center px-1">
        <svg viewBox="0 0 60 20" className="h-4 sm:h-5 w-auto">
            <text x="0" y="16" fill="#ffffff" fontSize="18" fontStyle="italic" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">
                VISA
            </text>
        </svg>
    </div>
);

const MastercardBadge = () => (
    <div className="h-6 flex items-center justify-center px-1">
        <svg viewBox="0 0 36 24" className="h-5 sm:h-6 w-auto">
            <circle cx="13" cy="12" r="10" fill="#EB001B" />
            <circle cx="23" cy="12" r="10" fill="#F79E1B" opacity="0.9" />
            <path d="M18 5.6a10 10 0 0 1 0 12.8 10 10 0 0 1 0-12.8z" fill="#FF5F00" />
        </svg>
    </div>
);

const RuPayBadge = () => (
    <div className="h-6 flex items-center justify-center px-1">
        <div className="flex items-center gap-0.5">
            <span className="text-white font-black text-sm sm:text-base italic tracking-tight font-sans">RuPay</span>
            <div className="flex flex-col gap-0.5 ml-0.5">
                <span className="w-1.5 h-1.5 bg-[#00A859] -skew-x-12 rounded-[1px]"></span>
                <span className="w-1.5 h-1.5 bg-[#F37021] -skew-x-12 rounded-[1px]"></span>
            </div>
        </div>
    </div>
);

const AmexBadge = () => (
    <div className="h-5 bg-[#006FCF] px-1.5 py-0.5 rounded flex items-center justify-center">
        <span className="text-white font-bold text-[8px] sm:text-[9px] tracking-tighter leading-none uppercase font-sans">
            AMERICAN<br />EXPRESS
        </span>
    </div>
);

const UpiBadge = () => (
    <div className="h-6 flex items-center justify-center px-1">
        <div className="flex items-center gap-1">
            <span className="text-white font-extrabold text-xs sm:text-sm italic tracking-tighter">UPI</span>
            <svg viewBox="0 0 20 20" className="w-3.5 h-3.5">
                <polygon points="4,2 16,10 4,10" fill="#097939" />
                <polygon points="16,10 4,18 4,10" fill="#EF5A24" />
            </svg>
        </div>
    </div>
);

export default function Footer() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isSubscribed, setIsSubscribed] = useState(false);

    const handleSubscribe = (e) => {
        e.preventDefault();
        if (email.trim()) {
            setIsSubscribed(true);
            setTimeout(() => {
                setIsSubscribed(false);
                setEmail('');
            }, 3000);
        }
    };

    const quickLinks = [
        { name: 'Home', path: '/' },
        { name: 'Flights', path: '/flight-results' },
        { name: 'Hotels', path: '/hotels' },
        { name: 'Bus', path: '/bus' },
        { name: 'Cab', path: '/cab' },
        { name: 'About Us', path: '/about-us' },
        { name: 'Contact Us', path: '/contact-us' },
        { name: 'FAQs', path: '/faqs' },
        { name: 'Terms & Conditions', path: '/terms-and-conditions' },
        { name: 'Privacy Policy', path: '/privacy-policy' },
        { name: 'Cancellation & Refund', path: '/flight-cancellation' },
    ];

    const services = [
        { name: 'Flight Bookings', path: '/flight-results' },
        { name: 'Hotel Bookings', path: '/hotels' },
        { name: 'Bus Tickets', path: '/bus' },
        { name: 'Cab Services', path: '/cab' },
        { name: 'Group Travel', path: '/group-travel' },
        { name: 'Corporate Travel', path: '/corporate-travel' },
        { name: 'Travel Insurance', path: '/insurance' },
        { name: 'Visa Assistance', path: '/visa' },
        { name: 'Customer Support', path: '/complaint-register' },

    ];

    return (
        <footer
            className="relative bg-[#07090e] text-gray-200 overflow-hidden pt-14 pb-8 selection:bg-red-600 selection:text-white "
            style={{ fontFamily: "'Poppins', sans-serif" }}
        >
            {/* World Map Dotted Pattern Background */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.06] bg-repeat bg-center"
                style={{
                    backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
                    backgroundSize: '24px 24px',
                }}
            />

            {/* Background Airplane & Flight Trajectory Arc */}
            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
                <svg
                    className="w-full h-full min-h-[500px]"
                    viewBox="0 0 1200 600"
                    fill="none"
                    preserveAspectRatio="xMidYMid meet"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        {/* Contrail Soft Fade from Center to Right */}
                        <linearGradient id="footerContrailFade" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.04" />
                            <stop offset="85%" stopColor="#ffffff" stopOpacity="0.14" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.22" />
                        </linearGradient>
                    </defs>

                    {/* Flight Contrail Swoosh aligned precisely with jet trajectory angle (42 deg) and emerging from tail */}
                    <path
                        d="M 500 430 C 650 420, 778 327, 832 268"
                        stroke="url(#footerContrailFade)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    />

                    {/* Flying Airplane Climbing towards Top-Right */}
                    <g transform="translate(870, 225) rotate(42) scale(2.2)">
                        {/* Dark base layer to prevent any background/contrail lines showing over the body */}
                        <path
                            d="M 0,-32 
                               C 1.8,-32 3.2,-29 3.5,-23 
                               L 4.5,-8 
                               L 32,8 
                               C 34,9.5 33.5,11.5 31,11.5 
                               L 25,11.5 
                               L 5,4 
                               L 4,18 
                               L 14,26 
                               L 14,29 
                               L 0,26 
                               L -14,29 
                               L -14,26 
                               L -4,18 
                               L -5,4 
                               L -25,11.5 
                               L -31,11.5 
                               C -33.5,11.5 -34,9.5 -32,8 
                               L -4.5,-8 
                               L -3.5,-23 
                               C -3.2,-29 -1.8,-32 0,-32 Z"
                            fill="#07090e"
                        />
                        {/* Airliner Translucent Silhouette */}
                        <path
                            d="M 0,-32 
                               C 1.8,-32 3.2,-29 3.5,-23 
                               L 4.5,-8 
                               L 32,8 
                               C 34,9.5 33.5,11.5 31,11.5 
                               L 25,11.5 
                               L 5,4 
                               L 4,18 
                               L 14,26 
                               L 14,29 
                               L 0,26 
                               L -14,29 
                               L -14,26 
                               L -4,18 
                               L -5,4 
                               L -25,11.5 
                               L -31,11.5 
                               C -33.5,11.5 -34,9.5 -32,8 
                               L -4.5,-8 
                               L -3.5,-23 
                               C -3.2,-29 -1.8,-32 0,-32 Z"
                            fill="rgba(255, 255, 255, 0.18)"
                        />
                        {/* Jet Engine Turbines */}
                        <rect x="11" y="0" width="3.2" height="8" rx="1.6" fill="rgba(255, 255, 255, 0.22)" />
                        <rect x="-14.2" y="0" width="3.2" height="8" rx="1.6" fill="rgba(255, 255, 255, 0.22)" />
                    </g>
                </svg>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* ── Top Main Footer Grid (4 Columns) ────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-14">
                    {/* Column 1: Brand & Info (4 cols on lg) */}
                    <div className="lg:col-span-4 flex flex-col justify-between">
                        <div>
                            {/* Brand Logo (Exact Logo from Header) */}
                            <div className="flex flex-col items-start">
                                <img
                                    onClick={() => navigate('/')}
                                    src={Logo}
                                    className="cursor-pointer h-10 sm:h-12 md:h-14 w-auto object-contain"
                                    alt="SkyVoo Logo"
                                />
                                <p className="text-[10px] sm:text-[11px] font-semibold text-gray-300 tracking-[0.28em] uppercase mt-2">
                                    TRAVEL BEYOND BORDERS
                                </p>
                            </div>

                            {/* Brand Description */}
                            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mt-5 max-w-sm">
                                At Skyvoo, we make travel simpler, safer and more rewarding. With unbeatable fares, a wide range of global travel options and personalized support, we ensure every journey is a memorable one.
                            </p>

                            {/* Cursive Tagline Matching Reference Design */}
                            <div className="my-6 mt-12 pl-1 select-none">
                                <div className="inline-block transform -rotate-[6deg] origin-left transition-transform duration-300 hover:scale-105">
                                    <div
                                        className="text-gray-100 leading-[1.25] text-2xl sm:text-[30px] md:text-[32px] tracking-wide"
                                        style={{
                                            fontFamily: "'Dancing Script', 'Alex Brush', cursive",
                                            fontWeight: 500,
                                        }}
                                    >
                                        <div className="whitespace-nowrap">Your Journey</div>
                                        <div className="whitespace-nowrap ml-6 sm:ml-8">Our Commitment</div>
                                    </div>
                                    {/* Clean Tapered Red Underline */}
                                    <div className="relative mt-1 ml-6 sm:ml-8 w-48 sm:w-56 h-[2.5px]">
                                        <div
                                            className="w-full h-full rounded-full"
                                            style={{
                                                background: 'linear-gradient(to right, #d91b2b 0%, #e52e3d 60%, transparent 100%)'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="flex items-center gap-3 pt-2">
                            {[
                                { icon: <FacebookIcon />, label: 'Facebook', href: 'https://facebook.com' },
                                { icon: <InstagramIcon />, label: 'Instagram', href: 'https://instagram.com' },
                                { icon: <LinkedInIcon />, label: 'LinkedIn', href: 'https://linkedin.com' },
                                { icon: <YouTubeIcon />, label: 'YouTube', href: 'https://youtube.com' },
                                { icon: <XIcon />, label: 'X', href: 'https://x.com' },
                            ].map((social, idx) => (
                                <a
                                    key={idx}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={social.label}
                                    className="w-9 h-9 rounded-full border border-gray-700/80 bg-gray-900/40 flex items-center justify-center text-gray-200 hover:text-white hover:border-[#e52e3d] hover:bg-[#e52e3d]/10 hover:shadow-[0_0_12px_rgba(229,46,61,0.35)] transition-all duration-300"
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Column 2: Quick Links (3 cols on lg) */}
                    <div className="lg:col-span-3">
                        <div className="mb-4">
                            <h3 className="text-white font-semibold text-base sm:text-lg tracking-tight">
                                Quick Links
                            </h3>
                            <div className="w-7 h-[2px] bg-[#e52e3d] rounded mt-1"></div>
                        </div>
                        <ul className="space-y-2 text-xs sm:text-sm">
                            {quickLinks.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        to={link.path}
                                        className="group flex items-center justify-between text-gray-300 hover:text-white transition-colors py-0.5"
                                    >
                                        <span className="group-hover:translate-x-1 transition-transform duration-200 font-normal">
                                            {link.name}
                                        </span>
                                        <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: Our Services (2.5 cols on lg) */}
                    <div className="lg:col-span-2">
                        <div className="mb-4">
                            <h3 className="text-white font-semibold text-base sm:text-lg tracking-tight">
                                Our Services
                            </h3>
                            <div className="w-7 h-[2px] bg-[#e52e3d] rounded mt-1"></div>
                        </div>
                        <ul className="space-y-2 text-xs sm:text-sm">
                            {services.map((service) => (
                                <li key={service.name}>
                                    <Link
                                        to={service.path}
                                        className="group flex items-center justify-between text-gray-300 hover:text-white transition-colors py-0.5"
                                    >
                                        <span className="group-hover:translate-x-1 transition-transform duration-200 font-normal">
                                            {service.name}
                                        </span>
                                        <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 4: Get in Touch & Newsletter (3 cols on lg) */}
                    <div className="lg:col-span-3 flex flex-col justify-between">
                        <div>
                            <div className="mb-4">
                                <h3 className="text-white font-semibold text-base sm:text-lg tracking-tight">
                                    Get in Touch
                                </h3>
                                <div className="w-7 h-[2px] bg-[#e52e3d] rounded mt-1"></div>
                            </div>
                            <div className="space-y-3.5 text-xs sm:text-sm">
                                {/* Address */}
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 shrink-0 text-[#e52e3d]">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium leading-tight">NSDPAY Technology Private Limited
                                        </p>
                                        <p className="text-gray-300 text-xs mt-0.5">Unit No. 101, First Floor, NDM-1, Netaji Subhash Place, Pitampura, Delhi-110034.</p>
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="flex items-center gap-3">
                                    <div className="shrink-0 text-[#e52e3d]">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <a
                                        href="tel:+911145678900"
                                        className="text-gray-200 hover:text-white transition-colors font-normal"
                                    >
                                        +91 7800 606 780
                                    </a>
                                </div>

                                {/* Email */}
                                <div className="flex items-center gap-3">
                                    <div className="shrink-0 text-[#e52e3d]">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <a
                                        href="mailto:support@skyvoo.com"
                                        className="text-gray-200 hover:text-white transition-colors font-normal"
                                    >
                                        support@skyvoo.com
                                    </a>
                                </div>
                            </div>

                            {/* Newsletter Section */}
                            <div className="mt-8">
                                <h4 className="text-white font-semibold text-sm sm:text-base mb-1">
                                    Newsletter
                                </h4>
                                <div className="w-7 h-[2px] bg-[#e52e3d] rounded mb-2.5"></div>
                                <p className="text-gray-300 text-xs leading-relaxed mb-3">
                                    Get the best travel deals, offers and updates straight to your inbox.
                                </p>

                                <form onSubmit={handleSubscribe} className="relative flex items-center mt-3">
                                    <div className="w-full relative flex items-stretch bg-[#11141d] border border-gray-400/60 focus-within:border-gray-300 rounded-[14px] overflow-hidden transition-all duration-200">
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email address"
                                            className="bg-transparent pl-4 pr-3 py-2.5 sm:py-3 text-xs sm:text-[13.5px] text-white placeholder:text-gray-300 focus:outline-none flex-1 min-w-0 font-normal"
                                        />
                                        <button
                                            type="submit"
                                            className="bg-[#e52e3d] hover:bg-[#d61f2e] active:scale-[0.98] text-white px-5 sm:px-6 flex items-center justify-center shrink-0 cursor-pointer transition-all duration-150"
                                            aria-label="Subscribe"
                                        >
                                            <ArrowRight className="w-5 h-5 stroke-[2.2]" />
                                        </button>
                                    </div>
                                </form>
                                {isSubscribed && (
                                    <p className="text-emerald-400 text-xs mt-1.5 font-medium animate-fadeIn">
                                        ✓ Thank you for subscribing!
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Middle Trust & Certification Banner (Full-width with edge gradient glow) ────── */}
            <div className="relative w-full border-t border-b border-gray-800/80 overflow-hidden my-6">
                {/* Glowing red top gradient line accent */}
                <div
                    className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
                    style={{
                        background: 'linear-gradient(90deg, rgba(229,46,61,0.9) 0%, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.15) 70%, rgba(229,46,61,0.9) 100%)'
                    }}
                />

                {/* Intense Red Radial Glows on Left and Right Edges matching the screenshot */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `
                            radial-gradient(ellipse 450px 300px at 0% 50%, rgba(185, 16, 28, 0.42), transparent 75%),
                            radial-gradient(ellipse 450px 300px at 100% 50%, rgba(185, 16, 28, 0.42), transparent 75%),
                            linear-gradient(180deg, #090c13 0%, #06080d 100%)
                        `
                    }}
                />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-8">
                    <div className="flex flex-wrap lg:flex-nowrap items-center justify-center gap-y-6">
                        {/* 1. Left Statement */}
                        <div className="flex flex-col items-center lg:items-start text-center lg:text-left px-4 sm:px-6 lg:pr-8">
                            <h3 className="text-white font-bold text-lg sm:text-[19px] tracking-tight font-sans">
                                Trusted. Certified. Global.
                            </h3>
                            <div className="w-8 h-[2.5px] bg-[#e52e3d] rounded-sm mt-2 mb-2.5 mx-auto lg:mx-0"></div>
                            <p className="text-gray-300 text-xs sm:text-[13px] leading-relaxed font-normal">
                                We are an IATA accredited travel agency,<br className="hidden sm:inline" /> ensuring reliable and compliant travel services worldwide.
                            </p>
                        </div>

                        {/* Divider 1 */}
                        <div className="h-12 w-[1px] bg-gray-700/60 hidden lg:block shrink-0"></div>

                        {/* 2. IATA Certification Logo */}
                        <div className="flex flex-col items-center justify-center text-center px-4 sm:px-6 shrink-0">
                            <IATALogo />
                        </div>

                        {/* Divider 2 */}
                        <div className="h-12 w-[1px] bg-gray-700/60 hidden sm:block shrink-0"></div>

                        {/* 3. Accredited Travel Agent */}
                        <div className="flex flex-col items-center justify-center text-center px-4 sm:px-6 shrink-0">
                            <span className="text-xs sm:text-[14px] font-normal text-white tracking-normal leading-tight whitespace-nowrap">
                                Accredited<br />Travel Agent
                            </span>
                        </div>

                        {/* Divider 3 */}
                        <div className="h-12 w-[1px] bg-gray-700/60 hidden sm:block shrink-0"></div>

                        {/* 4. Secure Bookings */}
                        <div className="flex flex-col items-center justify-center text-center px-4 sm:px-6 shrink-0 min-w-[80px]">
                            <svg className="w-6 sm:w-7 h-6 sm:h-7 text-white stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <path d="m9 12 2 2 4-4" />
                            </svg>
                            <span className="text-xs sm:text-[13px] text-gray-200 font-normal leading-tight mt-2 whitespace-nowrap">
                                Secure<br />Bookings
                            </span>
                        </div>

                        {/* Divider 4 */}
                        <div className="h-12 w-[1px] bg-gray-700/60 hidden sm:block shrink-0"></div>

                        {/* 5. Global Network */}
                        <div className="flex flex-col items-center justify-center text-center px-4 sm:px-6 shrink-0 min-w-[80px]">
                            <svg className="w-6 sm:w-7 h-6 sm:h-7 text-white stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="2" y1="12" x2="22" y2="12" />
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                            <span className="text-xs sm:text-[13px] text-gray-200 font-normal leading-tight mt-2 whitespace-nowrap">
                                Global<br />Network
                            </span>
                        </div>

                        {/* Divider 5 */}
                        <div className="h-12 w-[1px] bg-gray-700/60 hidden sm:block shrink-0"></div>

                        {/* 6. Dedicated Support */}
                        <div className="flex flex-col items-center justify-center text-center px-4 sm:px-6 shrink-0 min-w-[80px]">
                            <svg className="w-6 sm:w-7 h-6 sm:h-7 text-white stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
                                <path d="M19 19a3 3 0 0 1-3 3h-1" />
                            </svg>
                            <span className="text-xs sm:text-[13px] text-gray-200 font-normal leading-tight mt-2 whitespace-nowrap">
                                Dedicated<br />Support
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Bottom Bar (Copyright, Payment Methods & Slogan) ──────── */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-gray-300">
                    {/* Copyright */}
                    <div className="order-2 md:order-1 text-center md:text-left">
                        <p className="text-gray-300">© 2026 Skyvoo. All rights reserved.</p>
                    </div>

                    {/* Payment Gateways */}
                    <div className="order-1 md:order-2 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                        <VisaBadge />
                        <MastercardBadge />
                        <RuPayBadge />
                        <AmexBadge />
                        <UpiBadge />
                    </div>

                    {/* Explore Book Fly Repeat with clean curved flight loop */}
                    <div className="order-3 flex items-center">
                        <div className="flex items-center gap-4 sm:gap-6 py-1">
                            <span className="text-gray-200 text-xs sm:text-sm font-medium tracking-wider whitespace-nowrap select-none">
                                Explore &nbsp;Book &nbsp;Fly &nbsp;Repeat
                            </span>

                            {/* Contrail & Airplane separated with clean horizontal gap from Repeat */}
                            <div className="relative w-20 sm:w-24 h-7 shrink-0 flex items-center">
                                <svg
                                    className="w-full h-full overflow-visible pointer-events-none"
                                    viewBox="0 0 90 28"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    {/* Rounded red contrail starting after the gap and swooping up */}
                                    <path
                                        d="M 4 23 C 28 27, 54 23, 73.8 13.9"
                                        stroke="#e52e3d"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                    />

                                    {/* Sleek Modern Commercial Airliner Silhouette */}
                                    <g transform="translate(80, 5) rotate(35) scale(0.68)">
                                        {/* Dark base to ensure clean tail boundary */}
                                        <path
                                            d="M 0,-18 
                                               C 1.2,-18 2.2,-15 2.5,-8 
                                               L 2.8,-2 
                                               L 18,5 
                                               C 19,5.8 18.6,7 17,7 
                                               L 3.2,4.5 
                                               L 2.6,12 
                                               L 8,16.5 
                                               L 8,18.2 
                                               L 0,16 
                                               L -8,18.2 
                                               L -8,16.5 
                                               L -2.6,12 
                                               L -3.2,4.5 
                                               L -17,7 
                                               C -18.6,7 -19,5.8 -18,5 
                                               L -2.8,-2 
                                               L -2.5,-8 
                                               C -2.2,-15 -1.2,-18 0,-18 Z"
                                            fill="#07090e"
                                        />
                                        {/* White Airplane Silhouette */}
                                        <path
                                            d="M 0,-18 
                                               C 1.2,-18 2.2,-15 2.5,-8 
                                               L 2.8,-2 
                                               L 18,5 
                                               C 19,5.8 18.6,7 17,7 
                                               L 3.2,4.5 
                                               L 2.6,12 
                                               L 8,16.5 
                                               L 8,18.2 
                                               L 0,16 
                                               L -8,18.2 
                                               L -8,16.5 
                                               L -2.6,12 
                                               L -3.2,4.5 
                                               L -17,7 
                                               C -18.6,7 -19,5.8 -18,5 
                                               L -2.8,-2 
                                               L -2.5,-8 
                                               C -2.2,-15 -1.2,-18 0,-18 Z"
                                            fill="#ffffff"
                                        />
                                        {/* Jet Engine Turbines */}
                                        <rect x="6" y="0" width="1.8" height="4.5" rx="0.9" fill="#ffffff" />
                                        <rect x="-7.8" y="0" width="1.8" height="4.5" rx="0.9" fill="#ffffff" />
                                    </g>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
