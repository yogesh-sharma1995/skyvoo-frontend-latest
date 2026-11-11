import React from 'react';
import { lazy, Suspense } from "react";
import { X } from "lucide-react";
import RipSide from "@/assets/imgs/ripSide.webp";
import Lock from "@/assets/vectors/lock.svg";
import BookingFlightFormBg from "@/assets/imgs/flightresultsbg.webp";
import { useAuth } from "@/contexts/AuthContext";

const ViewFlightDetails = lazy(() => import("./ViewFlightDetails"));

import { getAirlineLogo } from "@/utils/airlineCode";
import { getFlightDisplayPrice, getB2BFareBreakdown } from "@/utils/fareCalculations";
import { formatFlightStops, getFlightStops, getLegStops, getSpecialRoundTripLegGroups, getFlightLayoverAirports, formatStopsWithLayovers, calculateLegsDuration } from "@/utils/flightStops";

const formatAirportCityDisplay = (city, code) => {
    const c = String(city || "").trim();
    const cd = String(code || "").trim();
    if (!c && !cd) return "";
    if (!cd) return c;
    if (!c) return cd;
    if (/\([A-Za-z0-9]{3}\)/.test(c) || c.toUpperCase().includes(`(${cd.toUpperCase()})`)) {
        return c;
    }
    if (c.toUpperCase() === cd.toUpperCase()) {
        return cd.toUpperCase();
    }
    return `${c} (${cd.toUpperCase()})`;
};

function FlightCard({ flight, isSelected, isCompared, onToggleDetails, onToggleCompare, onViewPrices, showFareBreakdown }) {
    const { user, isB2B: authIsB2B } = useAuth();
    const userType = (user?.UserType || user?.userType || user?.Role || user?.role || "").toLowerCase();
    const isB2B = authIsB2B || userType === "b2b";
    const displayPrice = getFlightDisplayPrice(flight);

    const warningText = (() => {
        const raw = flight?.Warning ?? flight?.warning ?? flight?.TotalPriceList?.[0]?.Warning ?? flight?.totalPriceList?.[0]?.warning;
        if (!raw) return null;
        if (typeof raw === "string") return raw.trim() || null;
        if (Array.isArray(raw)) {
            const joined = raw
                .map(item => (typeof item === 'object' ? item?.message || item?.Message || JSON.stringify(item) : String(item)))
                .filter(Boolean)
                .join(", ");
            return joined || null;
        }
        if (typeof raw === "object") {
            return raw.message || raw.Message || raw.text || raw.Text || null;
        }
        return String(raw);
    })();
    return (
        <div className="rounded-2xl">
            <div
                className="py-2 sm:py-4 relative bg-cover bg-center rounded-xl shadow-sm hover:shadow-md transition-shadow"
                style={{
                    backgroundImage: `url(${BookingFlightFormBg})`,
                    boxShadow: "-3px 4px 20px 0px rgba(0, 0, 0, 0.25)",
                }}
                onClick={(e) => {
                    if (e.target.closest('button')) return;

                    if (window.matchMedia('(max-width: 767px)').matches) {
                        onViewPrices(flight);
                    }
                }}
            >
                <img
                    className="absolute h-[85%] md:h-[90%] -right-[3px] md:-right-[5px] top-[7%] md:top-[5%]"
                    src={RipSide}
                    alt="ribbon side"
                />

                {/* ---- Main Flight Row(s) ---- */}
                {(() => {
                    const legs = flight.FlightDetailResponses || flight.flightDetailResponses || [];
                    const isSpecialRoundTrip = legs.some(l => l.isRs === true || l.IsRs === true || l.isReturn === true || l.IsReturn === true);

                    if (isSpecialRoundTrip) {
                        const { onwardLegs, returnLegs } = getSpecialRoundTripLegGroups(flight);

                        if (onwardLegs.length > 0 && returnLegs.length > 0) {
                            const rows = [
                                { type: "Onward", legList: onwardLegs },
                                { type: "Return", legList: returnLegs }
                            ];

                            return (
                                <div className="py-2.5 px-3 sm:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
                                    <div className="flex-1 space-y-3 min-w-0">
                                        {rows.map(({ type, legList }, rIdx) => {
                                            const firstLeg = legList[0] || {};
                                            const lastLeg = legList[legList.length - 1] || firstLeg;

                                            const legAirlines = [...new Set(legList.map(l => l.airlineName || l.AirlineName).filter(Boolean))];
                                            const legAirlineName = legAirlines.length > 0 ? legAirlines.join(", ") : (firstLeg.airlineName || firstLeg.AirlineName || flight.AirlineName?.split(",")[0]);

                                            const flightNumbers = legList.map(l => {
                                                const code = l.airlineCode || l.AirlineCode || "";
                                                const no = l.flightNo || l.FlightNo || l.flightNumber || "";
                                                return `${code} ${no}`.trim();
                                            }).filter(Boolean);
                                            const legFlightNo = flightNumbers.length > 0 ? flightNumbers.join(" · ") : (firstLeg.flightNo || firstLeg.FlightNo || "");

                                            const depTime = firstLeg.departureTime || firstLeg.DepartureTime || flight.DepartureTime;
                                            const depCityName = (firstLeg.airlineDeparture || firstLeg.AirlineDeparture)?.city || (firstLeg.airlineDeparture || firstLeg.AirlineDeparture)?.name || flight.AirlineDeparture?.city || "";
                                            const depCode = (firstLeg.airlineDeparture || firstLeg.AirlineDeparture)?.code || firstLeg.DepartureAirportCode || flight.AirlineDeparture?.code || "";
                                            const depDisplay = formatAirportCityDisplay(depCityName, depCode);

                                            const arrTime = lastLeg.arrivalTime || lastLeg.ArrivalTime || flight.ArrivalTime;
                                            const arrCityName = (lastLeg.airlineArrival || lastLeg.AirlineArrival)?.city || (lastLeg.airlineArrival || lastLeg.AirlineArrival)?.name || flight.AirlineArrival?.city || "";
                                            const arrCode = (lastLeg.airlineArrival || lastLeg.AirlineArrival)?.code || lastLeg.ArrivalAirportCode || flight.AirlineArrival?.code || "";
                                            const arrDisplay = formatAirportCityDisplay(arrCityName, arrCode);

                                            const duration = calculateLegsDuration(legList) || firstLeg.airlineDuration || firstLeg.AirlineDuration || flight.AirlineDuration;
                                            const stopsCount = getLegStops(firstLeg, legList);
                                            const layovers = getFlightLayoverAirports(legList);
                                            const stopsDisplay = formatStopsWithLayovers(stopsCount, layovers);

                                            const logo = firstLeg.airlineLogo || firstLeg.airlineCode || firstLeg.AirlineCode || (flight.AirlineLogo ? flight.AirlineLogo[0] : "");

                                            const isNextDay = (firstLeg.departureDate && lastLeg.arrivalDate && firstLeg.departureDate !== lastLeg.arrivalDate) ||
                                                (firstLeg.DepartureDate && lastLeg.ArrivalDate && firstLeg.DepartureDate !== lastLeg.ArrivalDate) ||
                                                lastLeg.nextDayFlag || lastLeg.NextDayFlag;

                                            return (
                                                <div key={rIdx} className="grid grid-cols-[130px_1fr_1fr_1fr] xs:grid-cols-[150px_1fr_1fr_1fr] sm:grid-cols-[180px_1fr_1fr_1fr] md:grid-cols-[190px_1fr_1fr_1fr] items-center gap-1.5 xs:gap-3 sm:gap-4">
                                                    {/* Airline info & badge */}
                                                    <div className="flex items-center space-x-2 xs:space-x-2.5 justify-start min-w-0">
                                                        <span className={`w-12 xs:w-14 text-center shrink-0 text-[8px] xs:text-[10px] font-bold px-1 py-0.5 rounded-md ${type === "Onward" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
                                                            {type}
                                                        </span>
                                                        <img
                                                            className="rounded-full w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 object-cover shrink-0"
                                                            src={getAirlineLogo(logo)}
                                                            alt={legAirlineName}
                                                        />
                                                        <div className="min-w-0 truncate">
                                                            <div title={legAirlineName} className="font-bold text-xs xs:text-sm text-gray-900 truncate cursor-default">
                                                                {legAirlineName}
                                                            </div>
                                                            <div className="font-medium text-[8px] xs:text-xs text-gray-500 whitespace-nowrap">
                                                                {legFlightNo}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Departure */}
                                                    <div className="text-center min-w-0">
                                                        <div className="text-xs xs:text-sm sm:text-lg md:text-xl font-bold leading-tight whitespace-nowrap text-gray-900">
                                                            {depTime}
                                                        </div>
                                                        <div title={depDisplay} className="text-[9px] xs:text-[10px] sm:text-xs font-semibold text-gray-700 truncate cursor-default">
                                                            {depDisplay}
                                                        </div>
                                                    </div>

                                                    {/* Duration */}
                                                    <div className="flex flex-col items-center justify-center font-semibold px-0.5 min-w-0">
                                                        <div className="text-[8px] xs:text-[10px] sm:text-xs font-semibold mb-[1px] text-gray-700 whitespace-nowrap">
                                                            {duration}
                                                        </div>
                                                        <div className="relative w-8 xs:w-12 sm:w-16 h-0.5 rounded-xl bg-[#920000]" />
                                                        <div className="text-[8px] xs:text-[10px] sm:text-xs font-semibold mt-[1px] text-gray-700 whitespace-nowrap">
                                                            {stopsDisplay}
                                                        </div>
                                                    </div>

                                                    {/* Arrival */}
                                                    <div className="text-center min-w-0">
                                                        <div className="text-xs xs:text-sm sm:text-lg md:text-xl font-bold leading-tight whitespace-nowrap text-gray-900 flex items-center justify-center">
                                                            {arrTime}
                                                            {isNextDay && (
                                                                <span className="text-[8px] xs:text-[9px] text-red-600 font-bold ml-1" title="Arrives next day">
                                                                    +1D
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div title={arrDisplay} className="text-[9px] xs:text-[10px] sm:text-xs font-semibold text-gray-700 truncate cursor-default">
                                                            {arrDisplay}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Price and Action */}
                                    <div className="flex flex-col items-center md:items-end justify-between md:justify-center gap-1.5 md:gap-2 border-t md:border-t-0 md:border-l border-gray-200 pt-2 md:pt-0 md:pl-5 shrink-0 w-full md:w-36">
                                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-1">
                                            <div className="text-right whitespace-nowrap shrink-0">
                                                <div className="text-sm xs:text-base sm:text-xl md:text-2xl font-bold text-[#811919] whitespace-nowrap">
                                                    ₹ {displayPrice.toLocaleString('en-IN')}
                                                </div>
                                                <div className="hidden sm:block text-[10px] sm:text-xs font-semibold text-gray-600 whitespace-nowrap">
                                                    Total Round Trip
                                                </div>
                                            </div>
                                            <button
                                                className="w-full hidden md:flex md:w-auto cursor-pointer bg-[#811919] hover:bg-[#741111] text-white px-4 py-2 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap shrink-0 items-center justify-center tracking-wide shadow-sm transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onViewPrices(flight);
                                                }}
                                            >
                                                VIEW PRICES
                                            </button>
                                        </div>

                                        {/* B2B Fare Breakdown below VIEW PRICES */}
                                        {showFareBreakdown && isB2B && (() => {
                                            const b2bData = getB2BFareBreakdown(flight);
                                            if (!b2bData) return null;
                                            return (
                                                <div className="mt-2 flex flex-wrap items-center justify-end gap-x-3 gap-y-0.5 text-[11px] sm:text-xs text-gray-700 font-medium whitespace-nowrap">
                                                    <span>Net Fare: ₹{b2bData.netFare.toLocaleString('en-IN')}</span>
                                                    <span>Markup: ₹{b2bData.retailerMarkup.toLocaleString('en-IN')}</span>
                                                    <span>Commission: ₹{b2bData.commission.toLocaleString('en-IN')}</span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            );
                        }
                    }

                    // Standard single flight row - 3 clean columns (Info | Route | Price + Action)
                    const firstLeg = legs[0] || {};
                    const lastLeg = legs.length > 1 ? legs[legs.length - 1] : firstLeg;

                    const depTime = flight.DepartureTime || firstLeg.DepartureTime;
                    const depCityName = flight.AirlineDeparture?.city || firstLeg.AirlineDeparture?.city || "";
                    const depCode = flight.AirlineDeparture?.code || firstLeg.DepartureAirportCode || "";
                    const depDisplay = formatAirportCityDisplay(depCityName, depCode);

                    const arrTime = (legs.length > 1 ? lastLeg.ArrivalTime : flight.ArrivalTime) || lastLeg.ArrivalTime || flight.ArrivalTime;
                    const arrCityName = (legs.length > 1 ? (lastLeg.AirlineArrival?.city || lastLeg.AirlineArrival?.name) : flight.AirlineArrival?.city) || flight.AirlineArrival?.city || "";
                    const arrCode = (legs.length > 1 ? (lastLeg.AirlineArrival?.code || lastLeg.ArrivalAirportCode) : flight.AirlineArrival?.code) || flight.AirlineArrival?.code || "";
                    const arrDisplay = formatAirportCityDisplay(arrCityName, arrCode);

                    const stopsCount = getFlightStops(flight);
                    const layovers = getFlightLayoverAirports(legs.length > 0 ? legs : flight);
                    const stopsDisplay = formatStopsWithLayovers(stopsCount, layovers);

                    return (
                        <div className="py-2.5 px-3 sm:py-5 flex flex-row items-center justify-between gap-2 sm:gap-4 md:gap-6">
                            {/* 1. Airline info */}
                            <div className="flex items-center space-x-2.5 sm:space-x-3.5 justify-start shrink-0 min-w-0 max-w-[130px] sm:max-w-[190px]">
                                <div className="rounded-full flex items-center justify-center shrink-0">
                                    <img
                                        className="rounded-full w-8 h-8 xs:w-9 xs:h-9 sm:w-11 sm:h-11 object-cover"
                                        src={getAirlineLogo(flight.AirlineLogo[0])}
                                        alt={flight.AirlineName?.split(",")[0]}
                                    />
                                </div>
                                <div className="min-w-0">
                                    <div
                                        title={flight.AirlineName || flight.AirlineName?.split(",")[0]}
                                        className="font-bold text-xs xs:text-sm sm:text-base md:text-lg text-gray-900 truncate cursor-default"
                                    >
                                        {flight.AirlineName?.split(",")[0]}
                                    </div>
                                    <div className="font-medium text-[8px] xs:text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
                                        {flight.AirlineCodeAndId}
                                    </div>
                                </div>
                            </div>

                            {/* 2. Schedule & Route */}
                            <div className="flex items-center justify-center gap-2.5 xs:gap-5 sm:gap-7 md:gap-9 flex-1 min-w-0">
                                {/* Departure */}
                                <div className="text-center shrink-0">
                                    <div className="text-sm xs:text-base sm:text-xl md:text-2xl font-bold leading-tight whitespace-nowrap text-gray-900">
                                        {depTime}
                                    </div>
                                    <div
                                        title={depDisplay}
                                        className="text-[9px] xs:text-[11px] sm:text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap truncate max-w-[60px] xs:max-w-[90px] sm:max-w-[120px] cursor-default"
                                    >
                                        {depDisplay}
                                    </div>
                                </div>

                                {/* Duration & Stops */}
                                <div className="flex flex-col items-center font-semibold px-0.5 xs:px-1.5 shrink-0">
                                    <div className="text-[8px] xs:text-[10px] sm:text-xs md:text-sm font-semibold mb-[1px] text-gray-700 whitespace-nowrap">
                                        {flight.AirlineDuration}
                                    </div>

                                    <div className="relative w-9 xs:w-14 sm:w-18 md:w-24 h-0.5 rounded-xl bg-[#920000]" />

                                    <div className="text-[8px] xs:text-[10px] sm:text-xs md:text-sm font-semibold mt-[1px] text-gray-700 whitespace-nowrap">
                                        {stopsDisplay}
                                    </div>
                                </div>

                                {/* Arrival */}
                                <div className="text-center shrink-0">
                                    <div className="text-sm xs:text-base sm:text-xl md:text-2xl font-bold leading-tight whitespace-nowrap text-gray-900">
                                        {arrTime}
                                    </div>
                                    <div
                                        title={arrDisplay}
                                        className="text-[9px] xs:text-[11px] sm:text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap truncate max-w-[65px] xs:max-w-[90px] sm:max-w-[120px] cursor-default"
                                    >
                                        {arrDisplay}
                                    </div>
                                </div>
                            </div>

                            {/* 3. Price and VIEW PRICES Action */}
                            <div className="flex flex-col items-end justify-center shrink-0 pl-1">
                                <div className="flex items-center justify-end gap-2.5 sm:gap-4 shrink-0">
                                    <div className="flex flex-col items-end justify-center shrink-0 whitespace-nowrap">
                                        <div className="text-sm xs:text-base sm:text-xl md:text-2xl font-bold text-[#811919] whitespace-nowrap">
                                            ₹ {displayPrice.toLocaleString('en-IN')}
                                        </div>
                                        <div className="hidden sm:block text-[10px] sm:text-xs font-semibold text-gray-600 whitespace-nowrap">
                                            Per Adult
                                        </div>
                                    </div>

                                    <button
                                        className="hidden md:flex cursor-pointer bg-[#811919] hover:bg-[#741111] text-white px-4 py-2 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap shrink-0 items-center justify-center tracking-wide shadow-sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onViewPrices(flight);
                                        }}
                                    >
                                        VIEW PRICES
                                    </button>
                                </div>

                                {/* B2B Fare Breakdown below VIEW PRICES */}
                                {showFareBreakdown && isB2B && (() => {
                                    const b2bData = getB2BFareBreakdown(flight);
                                    if (!b2bData) return null;
                                    return (
                                        <div className="mt-4 flex flex-wrap items-center justify-end gap-x-3 gap-y-0.5 text-[10px] sm:text-[11px] text-gray-700 font-medium whitespace-nowrap">
                                            <span>Markup: ₹{b2bData.retailerMarkup.toLocaleString('en-IN')}</span>
                                            <span>Commission: ₹{b2bData.commission.toLocaleString('en-IN')}</span>
                                            <span>Net Fare: ₹{b2bData.netFare.toLocaleString('en-IN')}</span>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    );
                })()}

                {/* ---- Mid Bottom Row ---- */}
                <div className="flex flex-row md:items-center justify-between  text-[10px] xs:text-xs sm:text-sm font-medium gap-2">
                    {isCompared ? (
                        <div
                            className="ml-2 pr-3 cursor-pointer flex items-center px-3 py-1 rounded hover:bg-red-200 transition-colors duration-300 ease-in-out"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleCompare(flight)
                            }}
                        >
                            <span className="flex items-center">
                                <span>Added</span>
                                <span

                                    className="ml-2 text-[#910E0E] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                                >
                                    <X size={12} strokeWidth={3} />
                                </span>
                            </span>
                        </div>

                    ) : (
                        <div
                            className="ml-2 cursor-pointer pr-3 flex items-center px-3 py-1 rounded hover:bg-red-200 transition-colors duration-300 ease-in-out"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleCompare(flight)
                            }}
                        >
                            <span className="text-[#811919] font-semibold " >
                                Add Compare More +
                            </span>
                        </div>

                    )}
                    <div className="mr-2 xs:mr-5 relative rounded-full flex flex-row justify-center items-center">
                        <div
                            className="absolute top-1/2 left-0 w-full h-[65%] md:h-full -translate-y-1/2 rounded-l-full"
                            style={{
                                background: "linear-gradient(90deg, rgba(205 205 205) 0%, rgba(255,255,255,0.5) 100%)",
                                pointerEvents: "none",
                                zIndex: 0,
                            }}
                        />
                        <div className="flex flex-row" style={{ position: "relative", zIndex: 1 }}>
                            {/* <img src={Lock} alt="LOCK" className="px-2" /> */}
                            {/* <p className="text-[8px] xs:text-xs">Lock this price starting from ₹ 413</p> */}
                        </div>
                    </div>
                </div>

                {/* ---- Bottom Row ---- */}
                <div className="flex flex-row justify-between md:flex-row md:items-center text-sm font-medium gap-2">
                    {warningText ? (
                        <div className="pl-2 md:pl-5 md:pr-10 lg:pr-20 relative rounded-full flex flex-row justify-center items-center">
                            <div
                                className="absolute top-1/2 left-0 w-full h-[65%] md:h-full -translate-y-1/2 rounded-full"
                                style={{
                                    background: "linear-gradient(90deg, rgba(205, 205, 205, 0.9) 0%, rgba(255,255,255,0.3) 100%)",
                                    pointerEvents: "none",
                                    zIndex: 0,
                                }}
                            />
                            <div
                                style={{ position: "relative", zIndex: 1 }}
                                className="flex flex-row items-center py-0.5"
                            >
                                <div className="bg-[#720E0E] w-2 h-2 rounded-full mx-2 sm:mx-0 sm:mr-2 shrink-0"></div>
                                <p className="text-[8px] xs:text-xs text-gray-800 font-medium">{warningText}</p>
                            </div>
                        </div>
                    ) : (
                        <div />
                    )}

                    <div className="pr-5 flex flex-row justify-between md:justify-start sm:items-center gap-2 sm:gap-0 px-3 py-1 rounded ml-auto">
                        {/* View Flight Details */}
                        <button
                            className="text-[#811919] cursor-pointer hover:underline text-[10px] xs:text-xs sm:text-sm text-left font-medium"
                            onClick={() => onToggleDetails(flight.AirlineCodeAndId)}
                        >
                            View Flight Details
                        </button>
                    </div>
                </div>
            </div>

            {/* ---- Flight Details Modal ---- */}
            {isSelected && (
                <Suspense fallback={null}>
                    <ViewFlightDetails
                        flight={flight}
                        onClose={() => onToggleDetails(flight.AirlineCodeAndId)}
                    />
                </Suspense>
            )}
        </div>
    );
}

export default React.memo(FlightCard);