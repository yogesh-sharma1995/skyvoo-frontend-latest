// src/layouts/PublicLayout.jsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import GrayFadedBg from '@/assets/imgs/grayfadedbg.webp'
import SignInModal from '@/components/modals/SignInModal';

function Layout() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="min-h-screen flex flex-col justify-between pt-[52px] sm:pt-[56px] overflow-x-hidden w-full max-w-full">
            {isModalOpen && <SignInModal onClose={() => setIsModalOpen(false)} />}

            {/* Fixed Header */}
            <Header onOpen={() => setIsModalOpen(true)} />

            <div>
                {/* Hero Section Background Artwork */}
                <div className="relative bg-white bg-cover bg-center d-none">
                    <img
                        className="absolute right-0 top-0 z-0 max-w-full h-auto object-cover pointer-events-none"
                        style={{
                            maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)'
                        }}
                        src={GrayFadedBg}
                        alt="gray faded bg"
                    />
                </div>

                {/* Routed Page */}
                <Outlet />
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
}

export default Layout;
