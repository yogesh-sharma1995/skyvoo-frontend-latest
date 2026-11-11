import React from 'react';
import { Plane, Globe, Wallet, Ticket, BarChart3, Gift } from 'lucide-react';

const statsData = [
    {
        icon: Plane,
        watermark: BarChart3,
        value: '47',
        label: 'Total Flights',
    },
    {
        icon: Globe,
        watermark: Globe,
        value: '23',
        label: 'Countries Visited',
    },
    {
        icon: Wallet,
        watermark: BarChart3,
        value: '₹12,800',
        label: 'Money Saved',
    },
    {
        icon: Ticket,
        watermark: Gift,
        value: '2',
        label: 'Coupons Redeemed',
    },
];

const ProfileStats = React.memo(({ stats = statsData }) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {stats.map((stat, idx) => {
                const Icon = stat.icon || Plane;
                const Watermark = stat.watermark || BarChart3;

                return (
                    <div
                        key={stat.label || idx}
                        className="relative bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-2xs hover:shadow-md transition-all duration-300 overflow-hidden group flex flex-col justify-between"
                    >
                        {/* Watermark in upper right */}
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none text-gray-800">
                            <Watermark className="w-12 h-12 sm:w-16 sm:h-16 stroke-[1.2]" />
                        </div>

                        {/* Red Circle Icon */}
                        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#811919] text-white rounded-full flex items-center justify-center shadow-xs mb-3 group-hover:scale-105 transition-transform">
                            <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                        </div>

                        {/* Stat number & Label */}
                        <div className="relative z-10">
                            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight leading-none mb-1">
                                {stat.value}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500 font-medium">
                                {stat.label}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
});

export default ProfileStats;
