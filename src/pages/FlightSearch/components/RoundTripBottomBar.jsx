import React, { useEffect, useState } from 'react';
import { X, Plane, ArrowRight, Ticket } from 'lucide-react';
import { getAirlineLogo } from "@/utils/airlineCode";
import { getFlightDisplayPrice } from "@/utils/fareCalculations";
import { formatFlightStops } from "@/utils/flightStops";

function FlightChip({ flight, label, onClear }) {
    if (!flight) {
        return (
            <div className="flex flex-col items-center justify-center gap-1 px-3 sm:px-5 py-2 rounded-xl border-2 border-dashed border-white/20 min-w-[130px] sm:min-w-[180px] h-full">
                <Ticket size={14} className="text-white/30" />
                <p className="text-[9px] sm:text-[10px] text-white/40 font-medium tracking-wider text-center">
                    SELECT {label} FLIGHT
                </p>
            </div>
        );
    }

    const price = getFlightDisplayPrice(flight);

    return (
        <div className="relative flex items-center gap-2 sm:gap-3 bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2 min-w-[140px] sm:min-w-[190px] backdrop-blur-sm">
            {/* Clear button */}
            <button
                onClick={onClear}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors z-10 cursor-pointer shadow-lg"
            >
                <X size={10} />
            </button>

            {/* Airline logo */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 bg-white/15 rounded-lg flex items-center justify-center p-1">
                {getAirlineLogo(flight.AirlineLogo) ? (
                    <img
                        src={getAirlineLogo(flight.AirlineLogo)}
                        alt={flight.AirlineName}
                        className="max-w-full max-h-full object-contain"
                    />
                ) : (
                    <Plane size={14} className="text-white/60" />
                )}
            </div>

            {/* Flight info */}
            <div className="min-w-0 flex-1">
                <p className="text-[8px] sm:text-[9px] font-bold tracking-widest text-red-300 uppercase mb-[1px]">
                    {label}
                </p>
                <p className="text-[10px] sm:text-xs font-semibold text-white truncate leading-tight">
                    {flight.AirlineName}
                </p>
                <div className="flex items-center gap-1 mt-[2px]">
                    <span className="text-[9px] sm:text-[10px] font-bold text-white/90">
                        {flight.DepartureTime}
                    </span>
                    <ArrowRight size={8} className="text-white/50 flex-shrink-0" />
                    <span className="text-[9px] sm:text-[10px] font-bold text-white/90">
                        {flight.ArrivalTime}
                    </span>
                </div>
                <p className="text-[8px] sm:text-[9px] text-white/50 leading-tight mt-[1px]">
                    {flight.AirlineDuration} · {formatFlightStops(flight)}
                </p>
            </div>

            {/* Price */}
            <div className="flex-shrink-0 text-right">
                <p className="text-[8px] text-white/40">from</p>
                <p className="text-[11px] sm:text-sm font-bold text-green-300 leading-tight">
                    ₹{price.toLocaleString('en-IN')}
                </p>
            </div>
        </div>
    );
}

function RoundTripBottomBar({ outbound, returnFlight, onClearOutbound, onClearReturn, onBook }) {
    const [visible, setVisible] = useState(false);

    const outboundPrice = getFlightDisplayPrice(outbound);
    const returnPrice = getFlightDisplayPrice(returnFlight);
    const totalPrice = outboundPrice + returnPrice;

    const bothSelected = !!outbound && !!returnFlight;

    // Animate in on mount
    useEffect(() => {
        const t = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(t);
    }, []);

    return (
        <div
            className={`fixed bottom-2 right-10 z-[9990] transition-transform duration-500 ease-out ${visible ? 'translate-y-0' : 'translate-y-full'}`}
            style={{ width: '70%' }}
        >
            {/* Gradient glow line at top */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />

            {/* Main bar */}
            <div
                className="px-4 sm:px-6 py-3 rounded-2xl flex items-center gap-3 sm:gap-4"
                style={{
                    background: '#1e1e1e',
                    opacity: 0.9,
                }}
            >
                {/* Departure chip */}
                <FlightChip
                    flight={outbound}
                    label="DEPARTURE"
                    onClear={onClearOutbound}
                />

                {/* Divider arrow */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-[1px] h-3 bg-white/10 hidden sm:block" />
                    <div className="p-2 rounded-full bg-gradient-to-br from-red-800/60 to-red-900/40 border border-red-700/30">
                        <ArrowRight size={14} className="text-red-300" />
                    </div>
                    <div className="w-[1px] h-3 bg-white/10 hidden sm:block" />
                </div>

                {/* Return chip */}
                <FlightChip
                    flight={returnFlight}
                    label="RETURN"
                    onClear={onClearReturn}
                />

                {/* Spacer */}
                <div className="flex-1" />

                {/* Total + Book */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {totalPrice > 0 && (
                        <div className="text-right">
                            <p className="text-[8px] sm:text-[9px] text-white/40 uppercase tracking-wider">
                                {bothSelected ? 'Total Price' : 'Partial Total'}
                            </p>
                            <p className="text-base sm:text-xl font-bold text-white leading-tight">
                                ₹{totalPrice.toLocaleString('en-IN')}
                            </p>
                        </div>
                    )}

                    <button
                        onClick={bothSelected ? onBook : undefined}
                        disabled={!bothSelected}
                        className={`
                            relative overflow-hidden px-5 sm:px-7 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold tracking-wide
                            transition-all duration-300 cursor-pointer
                            ${bothSelected
                                ? 'bg-gradient-to-r from-[#78080B] to-[#c0392b] text-white shadow-lg shadow-red-900/50 hover:shadow-red-800/60 hover:scale-105 active:scale-95'
                                : 'bg-white/10 text-white/30 cursor-not-allowed border border-white/10'
                            }
                        `}
                    >
                        {bothSelected && (
                            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-shimmer" />
                        )}
                        Book Now
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RoundTripBottomBar;
