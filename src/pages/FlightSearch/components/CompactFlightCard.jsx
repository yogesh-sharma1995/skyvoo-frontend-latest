import React from 'react';
import { Check } from 'lucide-react';
import RipSide from "@/assets/imgs/ripSide.webp";
import BookingFlightFormBg from "@/assets/imgs/flightresultsbg.webp";
import { getAirlineLogo } from "@/utils/airlineCode";
import { useAuth } from "@/contexts/AuthContext";
import { getFlightDisplayPrice, getB2BFareBreakdown } from "@/utils/fareCalculations";
import { formatFlightStops, getFlightStops, getFlightLayoverAirports, formatStopsWithLayovers } from "@/utils/flightStops";

function CompactFlightCard({ flight, label, isDetailsOpen, onToggleDetails, isSelected, onSelect, showFareBreakdown }) {
    const { user, isB2B: authIsB2B } = useAuth();
    const userType = (user?.UserType || user?.userType || user?.Role || user?.role || "").toLowerCase();
    const isB2B = authIsB2B || userType === "b2b";

    if (!flight) {
        return (
            <div className="flex-1 min-w-0 rounded-xl" style={{ opacity: 0.35 }}>
                <div
                    className="relative bg-cover bg-center rounded-xl h-full flex items-center justify-center py-10"
                    style={{
                        backgroundImage: `url(${BookingFlightFormBg})`,
                        boxShadow: "-3px 4px 20px 0px rgba(0, 0, 0, 0.25)",
                    }}
                >
                    <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium tracking-wide">No flight available</span>
                </div>
            </div>
        );
    }

    const price = getFlightDisplayPrice(flight);

    return (
        <div
            className="flex-1 min-w-0 rounded-xl transition-all duration-300 cursor-pointer"
            style={isSelected ? {
                boxShadow: '0 0 0 2.5px #22c55e, 0 0 16px 2px rgba(34,197,94,0.25)',
                borderRadius: '0.75rem',
            } : {}}
            onClick={() => onSelect(flight)}
        >
            <div
                className="relative bg-cover bg-center rounded-xl h-full"
                style={{
                    backgroundImage: `url(${BookingFlightFormBg})`,
                    boxShadow: "-3px 4px 20px 0px rgba(0, 0, 0, 0.25)",
                }}
            >
                {/* Selected checkmark badge */}
                {isSelected && (
                    <div className="absolute -top-2 -left-2 z-20 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                        <Check size={10} className="text-white" strokeWidth={3} />
                    </div>
                )}

                {/* DEP / RETURN label banner */}
                <div className="pl-3 pr-6 py-[3px] relative">
                    <div
                        style={{
                            position: "absolute",
                            top: 0, left: 0,
                            width: "100%", height: "100%",
                            background: "linear-gradient(90deg, rgba(196,36,36,0.55) 0%, rgba(255,255,255,0.4) 100%)",
                            pointerEvents: "none",
                            zIndex: 0,
                            borderRadius: "0.75rem 0.75rem 0 0",
                        }}
                    />
                    <p
                        className="relative z-10 text-[8px] sm:text-[10px] font-bold tracking-widest text-[#5a0000]"
                        style={{ zIndex: 1 }}
                    >
                        ✈ {label}
                    </p>
                </div>

                {/* Main content */}
                <div className="px-3 pt-2 pb-3">

                    {/* Airline row */}
                    <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 flex items-center justify-center">
                            <img
                                src={getAirlineLogo(flight.AirlineLogo?.[0])}
                                alt={flight.AirlineName?.split(",")?.[0] || "Airline"}
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>
                        <div className="min-w-0">
                            <div className="font-semibold text-[9px] sm:text-xs leading-tight truncate">
                                {flight.AirlineName} {typeof flight.Vendor === 'string' ? flight.Vendor : ''}
                            </div>
                            <div className="text-[7px] sm:text-[9px] text-gray-500 leading-tight">
                                {flight.AirlineCodeAndId}
                            </div>
                        </div>
                    </div>

                    {/* Flight times */}
                    {(() => {
                        const legs = flight.FlightDetailResponses || flight.flightDetailResponses || [];
                        const firstLeg = legs[0] || {};
                        const lastLeg = legs.length > 1 ? legs[legs.length - 1] : firstLeg;

                        const depTime = flight.DepartureTime || firstLeg.DepartureTime;
                        const depCity = flight.AirlineDeparture?.city || firstLeg.AirlineDeparture?.city;

                        const arrTime = (legs.length > 1 ? lastLeg.ArrivalTime : flight.ArrivalTime) || lastLeg.ArrivalTime || flight.ArrivalTime;
                        const arrCity = (legs.length > 1 ? (lastLeg.AirlineArrival?.city || lastLeg.AirlineArrival?.name) : flight.AirlineArrival?.city) || flight.AirlineArrival?.city;

                        const stopsCount = getFlightStops(flight);
                        const layovers = getFlightLayoverAirports(legs.length > 0 ? legs : flight);
                        const stopsDisplay = formatStopsWithLayovers(stopsCount, layovers);

                        return (
                            <div className="flex items-center justify-between gap-1 pr-2">
                                {/* Departure */}
                                <div className="text-center flex-shrink-0">
                                    <div className="text-[12px] sm:text-[15px] md:text-base font-bold leading-none">
                                        {depTime}
                                    </div>
                                    <div className="text-[6px] sm:text-[8px] text-gray-600 leading-tight mt-[2px] max-w-[52px] sm:max-w-[68px] truncate">
                                        {depCity}
                                    </div>
                                </div>

                                {/* Duration line */}
                                <div className="flex flex-col items-center flex-1 px-1 min-w-0">
                                    <span className="text-[6px] sm:text-[8px] text-gray-700 leading-none mb-[2px]">
                                        {flight.AirlineDuration}
                                    </span>
                                    <div className="w-full h-[1.5px] bg-[#920000] rounded-full" />
                                    <span className="text-[6px] sm:text-[8px] text-gray-700 leading-none mt-[2px]">
                                        {stopsDisplay}
                                    </span>
                                </div>

                                {/* Arrival */}
                                <div className="text-center flex-shrink-0">
                                    <div className="text-[12px] sm:text-[15px] md:text-base font-bold leading-none">
                                        {arrTime}
                                    </div>
                                    <div className="text-[6px] sm:text-[8px] text-gray-600 leading-tight mt-[2px] max-w-[52px] sm:max-w-[68px] truncate">
                                        {arrCity}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Price + View Details */}
                    <div className="flex items-center justify-between mt-2 pr-2">
                        <div className="text-[10px] sm:text-sm font-bold text-[#811919]">
                            ₹ {price.toLocaleString('en-IN')}
                        </div>
                    </div>

                    {/* B2B Fare Breakdown in Compact Card */}
                    {showFareBreakdown && isB2B && (() => {
                        const b2bData = getB2BFareBreakdown(flight);
                        if (!b2bData) return null;
                        return (
                            <div className="mt-1 flex flex-wrap items-center justify-between gap-x-1.5 text-[8px] sm:text-[9px] text-gray-700 font-medium">
                                <span>Markup: ₹{b2bData.retailerMarkup.toLocaleString('en-IN')}</span>
                                <span>Comm: ₹{b2bData.commission.toLocaleString('en-IN')}</span>
                                <span>Net: ₹{b2bData.netFare.toLocaleString('en-IN')}</span>
                            </div>
                        );
                    })()}

                </div>
            </div>
        </div>
    );
}

export default React.memo(CompactFlightCard);
