import React, { useEffect, useState } from 'react';
import PromotionalCard from './components/PromotionalCard';
import BookingForm from './components/BookingForm';
import BookingFlightSectionBg from '@/assets/imgs/bookingbg.jpg';

export default function Home() {

  useEffect(() => {
    const planeEl = document.getElementById('plane-animation');

    if (planeEl) {
      const handleAnimationEnd = () => {
        const bookingSection = document.getElementById('booking-section');
        if (bookingSection) {
          bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };

      planeEl.addEventListener('animationend', handleAnimationEnd);

      return () => {
        planeEl.removeEventListener('animationend', handleAnimationEnd);
      };
    }
  }, []);

  return (
    <>
      <div>
        <div>
          <main className="relative z-10 px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 md:pt-10 overflow-hidden">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8 sm:mb-12 mt-1 sm:mt-2">
                <h1
                  className="primary-font text-2xl sm:text-4xl lg:text-5xl font-medium text-black mb-3 sm:mb-4 leading-tight"
                  style={{ textShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)' }}
                >

                  TRAVEL SMARTER WITH DEALS YOU'LL ADORE
                </h1>
                <p
                  className=" text-sm sm:text-base md:text-lg font-semibold bg-clip-text text-transparent leading-snug"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, #520000 0%, #FF0000 100%)',
                  }}
                >
                  Revolutionizing your financial journey with seamless, secure,
                  and personalized experiences
                </p>
              </div>

              <PromotionalCard />
            </div>
          </main>
        </div>

        {/* Booking Section */}
        <div
          id="booking-section"
          className="relative transition-all overflow-hidden"
        >
          {/* High-res background overlay with smooth top and bottom merge */}
          <div
            className="absolute inset-0 bg-cover bg-center sm:bg-right bg-no-repeat pointer-events-none opacity-[0.38]"
            style={{
              backgroundImage: `url(${BookingFlightSectionBg})`,
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)'
            }}
          />

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
            <div className="mb-6 sm:mb-8 text-start">
              <h4 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
                Start Booking Your Flight Now
              </h4>
            </div>
            <BookingForm />
          </div>
        </div>
      </div>
    </>
  );
}
