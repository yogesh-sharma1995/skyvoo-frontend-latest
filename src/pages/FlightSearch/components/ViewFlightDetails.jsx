import React, { useState, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import AirlineLogo from '@/assets/imgs/airlinelogo.webp'
import api from '@/services/api.js';
import { isSpecialRoundTripFlight, getSpecialRoundTripLegGroups } from '@/utils/flightStops';
import { getAirlineLogo } from "@/utils/airlineCode";
const Modal = lazy(() => import("@/components/modals/Modal"));


const ViewFlightDetails = ({ flight, onClose }) => {

    const [fareRuleModal, setFareRuleModal] = useState(false);
    const [fareRuleData, setFareRuleData] = useState(null);
    const [loadingFareRule, setLoadingFareRule] = useState(false);
    const [activeTab, setActiveTab] = useState("details");

    const handleFareRule = async () => {
        if (!flight.FareRuleKey) {
            console.warn("No FareRuleKey available for this flight.");
            return;
        }

        try {
            setLoadingFareRule(true);

            const res = await api.post("/Flight/SearchFareRule", {
                FareRuleKey: flight.FareRuleKey,
            });

            if (res.data?.IsSuccess) {
                setFareRuleData(res.data.Data?.fareRule ?? []);
                setFareRuleModal(true);
            } else {
                console.error("FareRule API error:", res.data?.ErrorMessage);
            }
        } catch (err) {
            console.error("Fare Rule API error:", err);
        } finally {
            setLoadingFareRule(false);
        }
    };

    const formatFareRule = (text = "") => {
        if (!text) return "";

        // If API returned HTML
        if (/<[a-z][\s\S]*>/i.test(text)) {
            return { isHtml: true, content: text };
        }

        // Plain text formatting
        const content = text
            .replace(/^\s*-+\s*$/gm, "")
            .replace(/\.\s+/g, ".\n")
            .replace(/;\s+/g, ";\n")
            .replace(/:\s+/g, ":\n")
            .replace(/\n{2,}/g, "\n")
            .trim();

        return { isHtml: false, content };
    };

    const legs = flight.FlightDetailResponses || flight.flightDetailResponses || [flight];
    const isSpecialRoundTrip = isSpecialRoundTripFlight(flight);
    const { onwardLegs, returnLegs } = isSpecialRoundTrip
        ? getSpecialRoundTripLegGroups(flight)
        : { onwardLegs: legs, returnLegs: [] };

    const firstLeg = onwardLegs[0] || legs[0];
    const lastOnwardLeg = onwardLegs[onwardLegs.length - 1] || legs[0];

    const fromCity = firstLeg?.AirlineDeparture?.city || firstLeg?.airlineDeparture?.city || flight.AirlineDeparture?.city || "Departure";
    const toCity = isSpecialRoundTrip
        ? (lastOnwardLeg?.AirlineArrival?.city || lastOnwardLeg?.airlineArrival?.city || "Destination")
        : (flight.AirlineArrival?.city || legs[legs.length - 1]?.AirlineArrival?.city || legs[legs.length - 1]?.airlineArrival?.city || "Arrival");

    const depDate = flight.DepartureDate || firstLeg?.DepartureDate || firstLeg?.departureDate || "";
    const returnDate = isSpecialRoundTrip ? (returnLegs[0]?.DepartureDate || returnLegs[0]?.departureDate || "") : "";

    if (typeof document === "undefined") return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="relative bg-[#F8F9FA] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Top Header Bar */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#78080B] text-white shrink-0">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm sm:text-base font-bold tracking-wide">
                            {isSpecialRoundTrip ? `${fromCity} ⇄ ${toCity} (Round Trip)` : `${fromCity} → ${toCity}`}
                        </h2>
                        {depDate && (
                            <span className="text-[11px] sm:text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-medium">
                                {isSpecialRoundTrip && returnDate ? `${depDate} – ${returnDate}` : depDate}
                            </span>
                        )}
                    </div>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 -mr-1 rounded-full active:scale-95 transition hover:bg-white/20 cursor-pointer text-white"
                            aria-label="Close modal"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
                {/* Top Row Buttons */}
                <div className="flex justify-start items-center px-4 sm:px-6 pt-3 pb-2 bg-white border-b border-gray-200 shrink-0">
                    <div
                        className="flex rounded-lg bg-[#E5E7EB] p-1 gap-1 overflow-x-auto w-fit"
                    >
                        {[
                            { key: "details", label: "FLIGHT DETAILS" },
                            // { key: "fare", label: "FARE SUMMARY" },
                            { key: "cancel", label: "CANCELLATION" },
                            { key: "date", label: "RESCHEDULE" },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`cursor-pointer py-1.5 px-3 sm:px-4 text-[10px] sm:text-xs font-semibold rounded-md transition whitespace-nowrap ${activeTab === key
                                    ? "bg-[#78080B] text-white shadow-sm"
                                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-200"
                                    }`}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Modal Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 overscroll-contain">
                    {/* Tab Content */}
                    {activeTab === "details" && (() => {
                        const hasReturnInFlight = isSpecialRoundTrip;

                        return (
                            <div className="space-y-4">
                                {/* Top Row */}
                                <div className="flex justify-between items-center mb-1">
                                    <div>
                                        <h3 className="font-semibold text-xs sm:text-base">
                                            {isSpecialRoundTrip
                                                ? `${fromCity} to ${toCity} and return to ${fromCity}, ${depDate}${returnDate ? ` – ${returnDate}` : ""}`
                                                : `${fromCity} to ${toCity}, ${depDate}`}
                                        </h3>
                                    </div>
                                    <div>
                                        <button
                                            onClick={handleFareRule}
                                            disabled={loadingFareRule}
                                            className="text-xs sm:text-sm font-medium text-[#920000] hover:text-[#781000] transition disabled:opacity-50 flex items-center gap-1"
                                        >
                                            {loadingFareRule ? (
                                                <>
                                                    <span className="inline-block w-3 h-3 border-2 border-[#920000] border-t-transparent rounded-full animate-spin" />
                                                    Loading...
                                                </>
                                            ) : "View Fare Rules"}
                                        </button>
                                    </div>
                                </div>

                                {legs.map((leg, idx) => {
                                    const isReturnLeg = leg.isRs === true || leg.IsRs === true || leg.isReturn === true || leg.IsReturn === true;
                                    const prevLeg = idx > 0 ? legs[idx - 1] : null;
                                    const prevIsReturn = prevLeg && (prevLeg.isRs === true || prevLeg.IsRs === true || prevLeg.isReturn === true || prevLeg.IsReturn === true);
                                    const isFirstReturnLeg = isReturnLeg && !prevIsReturn;

                                    const badgeLabel = hasReturnInFlight
                                        ? (isReturnLeg ? "Return Flight" : "Onward Flight")
                                        : (legs.length > 1 ? `Flight ${idx + 1}` : "");
                                    const badgeColor = isReturnLeg ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800";
                                    const connectingTime = leg.ConnectingTime || leg.connectingTime;

                                    const legAirlineName = leg.airlineName || leg.AirlineName || flight.AirlineName;
                                    const legCode = leg.airlineCode || leg.AirlineCode || flight.AirlineCode || "";
                                    const legFlightNo = leg.flightNo || leg.FlightNo || leg.flightNumber || flight.AirlineCodeAndId || "";
                                    const depTime = leg.departureTime || leg.DepartureTime || flight.DepartureTime;
                                    const depDate = leg.departureDate || leg.DepartureDate || flight.DepartureDate;
                                    const depCity = (leg.airlineDeparture || leg.AirlineDeparture)?.city || (leg.airlineDeparture || leg.AirlineDeparture)?.name || flight.AirlineDeparture?.city;
                                    const arrTime = leg.arrivalTime || leg.ArrivalTime || flight.ArrivalTime;
                                    const arrDate = leg.arrivalDate || leg.ArrivalDate || flight.ArrivalDate;
                                    const arrCity = (leg.airlineArrival || leg.AirlineArrival)?.city || (leg.airlineArrival || leg.AirlineArrival)?.name || flight.AirlineArrival?.city;
                                    const duration = leg.airlineDuration || leg.AirlineDuration || flight.AirlineDuration;
                                    const stops = leg.stops ?? leg.AirlineStops ?? flight.AirlineStops ?? 0;

                                    const legBaggage = flight.TotalPriceList?.[0]?.Baggages?.find(b => 
                                        (b.Sector && (
                                            (b.Sector.includes(leg.AirlineDeparture?.code || leg.airlineDeparture?.code) && b.Sector.includes(leg.AirlineArrival?.code || leg.airlineArrival?.code)) ||
                                            b.SegmentId === leg.AirlineId || b.SegmentId === leg.airlineId
                                        ))
                                    ) || flight.TotalPriceList?.[0]?.Baggages?.[idx] || flight.TotalPriceList?.[0]?.Baggages?.[0];

                                    const checkinBag = leg.CheckedinBag || leg.checkedinBag || legBaggage?.CheckedinBag || legBaggage?.CheckIn || "15 Kg";
                                    const cabinBag = leg.CabinBag || leg.cabinBag || legBaggage?.CabinBag || legBaggage?.HandBag || "7 Kg";

                                    return (
                                        <React.Fragment key={idx}>
                                            {/* Return Flight Journey Divider */}
                                            {isFirstReturnLeg && (
                                                <div className="my-3 pt-3 border-t-2 border-dashed border-[#78080B]/25 flex items-center justify-between">
                                                    <span className="text-xs sm:text-sm font-bold text-[#78080B] flex items-center gap-1.5">
                                                        <span>🔄 Return Journey:</span>
                                                        <span>{depCity} → {fromCity}</span>
                                                    </span>
                                                    {depDate && (
                                                        <span className="text-[11px] font-semibold text-gray-700 bg-gray-200/80 px-2 py-0.5 rounded">
                                                            {depDate}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Layover indicator for connecting flights within same direction */}
                                            {idx > 0 && !isFirstReturnLeg && connectingTime && (
                                                <div className="flex items-center justify-center my-1">
                                                    <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                                                        <span>⏱</span>
                                                        <span>Layover in {depCity}: {connectingTime}</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="border border-black/30 rounded-2xl shadow-sm px-2 xs:px-4 py-2 sm:py-4 bg-white">
                                                {badgeLabel && (
                                                    <div className="mb-2 pb-2 border-b border-gray-100 flex items-center justify-between">
                                                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${badgeColor}`}>
                                                            {badgeLabel}
                                                        </span>
                                                        <span className="text-xs text-gray-500 font-medium">
                                                            {depCity} → {arrCity}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex items-center space-x-4">
                                                    <div className="w-10 h-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center bg-white border border-gray-100 overflow-hidden p-1 shadow-xs">
                                                        <img
                                                            src={getAirlineLogo(legCode) || AirlineLogo}
                                                            alt={legAirlineName || "airline logo"}
                                                            className="w-full h-full object-contain"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-sm xs:text-xl">
                                                            {legAirlineName} <span className="text-[10px] text-gray-500"> {legCode} {legFlightNo} </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="my-2 flex flex-row sm:items-start justify-around">
                                                    {/* Departure */}
                                                    <div className="text-start">
                                                        <div className="text-[9px] xs:text-xs sm:text-xl font-bold">{depTime}</div>
                                                        <div className="text-[8px] xs:text-[10px] sm:text-base text-[#78080B] font-medium"> {depDate} </div>
                                                        <div className="text-[9px] xs:text-xs text-gray-500"> {depCity}</div>
                                                    </div>

                                                    {/* Flight duration and stops */}
                                                    <div className="flex flex-col items-center justify-start font-semibold">
                                                        <div className="text-[10px] sm:text-sm text-gray-500 mb-1">{duration}</div>
                                                        <div className="relative w-8 xs:w-12 sm:w-24 h-0.5 bg-[#920000] rounded"></div>
                                                        <div className="text-xs sm:text-sm text-gray-500 mt-1"> {stops === 0 ? "Non Stop" : `${stops} Stop`}</div>
                                                    </div>

                                                    {/* Arrival */}
                                                    <div className="text-start">
                                                        <div className="text-[9px] xs:text-xs sm:text-xl font-bold">{arrTime}</div>
                                                        <div className="text-[8px] xs:text-[10px] sm:text-base text-[#78080B] font-medium"> {arrDate} </div>
                                                        <div className="text-[9px] xs:text-xs sm:text-sm text-gray-500"> {arrCity}</div>
                                                    </div>

                                                    {/* Baggage */}
                                                    <div className="grid grid-cols-3 sm:flex gap-3 sm:gap-6 text-[8px] xs:text-[10px] sm:text-sm">
                                                        <div className="text-left sm:text-right">
                                                            <div className="font-semibold">
                                                                Baggage:
                                                                <br />
                                                                <p className="text-[#78080B] font-medium ">Adult</p>
                                                            </div>
                                                        </div>

                                                        <div className="text-left sm:text-right">
                                                            <div className="font-semibold">
                                                                Check-in:
                                                                <br />
                                                                <p className="text-[#78080B] font-medium ">
                                                                    {checkinBag}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="text-left sm:text-right">
                                                            <div className="font-semibold">
                                                                Cabin:
                                                                <br />
                                                                <p className="text-[#78080B] font-medium ">
                                                                    {cabinBag}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        );
                    })()}

                {activeTab === "fare" && (
                    <div className="mx-3 xs:mx-4 sm:mx-6">
                        <div className="flex justify-between items-center mb-2 sm:mb-3">
                            <h3 className="font-semibold text-[11px] xs:text-xs sm:text-base">
                                Fare Break Up
                            </h3>
                        </div>

                        {/* Fare Card */}
                        <div className="border border-black/30 rounded-2xl shadow-sm p-3 xs:p-4 bg-white">
                            <div className="flex flex-row justify-between py-1 sm:py-2 gap-2 sm:gap-1">

                                {/* Labels */}
                                <div className="space-y-1 xs:space-y-2">
                                    <p className="text-[11px] xs:text-sm sm:text-base font-medium text-gray-700">
                                        Base Fare
                                    </p>
                                    <p className="text-[11px] xs:text-sm sm:text-base font-medium text-gray-700">
                                        Taxes
                                    </p>
                                    <hr className="my-1 sm:my-2 border-gray-300" />
                                    <p className="text-sm xs:text-base sm:text-lg font-semibold text-[#78080B]">
                                        Total
                                    </p>
                                </div>

                                {/* Values */}
                                <div className="text-left sm:text-right space-y-1 xs:space-y-2">
                                    <p className="text-[11px] xs:text-sm sm:text-base text-gray-700">
                                        {flight.AirlineMinPrice}
                                    </p>
                                    <p className="text-[11px] xs:text-sm sm:text-base text-gray-700">Included</p>

                                    <hr className="my-1 sm:my-2 border-gray-300" />

                                    <p className="text-sm xs:text-base sm:text-lg font-bold text-[#78080B]">
                                        {flight.AirlineMinPrice}
                                    </p>

                                    {/* <p className="text-[11px] xs:text-sm sm:text-base text-gray-700">
                                    {flight.Fares[0].FareDetails[0].GST}
                                </p>
                                <hr className="my-1 sm:my-2 border-gray-300" />
                                <p className="text-sm xs:text-base sm:text-lg font-bold text-[#78080B]">
                                    {flight.Fares[0].FareDetails[0].Total_Amount}
                                </p> */}
                                </div>

                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "cancel" && (
                    <div className="mx-3 xs:mx-4 sm:mx-6">

                        <div className="flex justify-between items-center mb-2 sm:mb-3">
                            <h3 className="font-semibold text-[11px] xs:text-xs sm:text-base">
                                Cancellation Policy
                            </h3>
                        </div>

                        {/* Cancellation Card */}
                        <div className="border border-black/30 rounded-2xl shadow-sm p-3 xs:p-4 bg-white">

                            {/* Route */}
                            <p className="font-medium text-[11px] xs:text-sm sm:text-base text-gray-700 mb-1 sm:mb-2">
                                {`${flight.AirlineDeparture?.city} - ${flight.AirlineArrival?.city}`}
                            </p>

                            {/* Info Text */}
                            <p className="text-[10px] xs:text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                                (From Scheduled Flight Departure)
                            </p>

                            {/* Table-like Layout */}
                            <div className="divide-y divide-gray-300">

                                {/* 0 to 2 hours */}
                                <div className="flex justify-between py-2 gap-2">
                                    <p className="text-[11px] xs:text-sm sm:text-base text-gray-700">
                                        0 hours to 2 hours*
                                    </p>
                                    <p className="text-[11px] xs:text-sm sm:text-base text-gray-700 font-medium text-right">
                                        ADULT: Non Refundable
                                    </p>
                                </div>

                                {/* 2 to 365 days */}
                                <div className="flex justify-between py-2 gap-2">
                                    <p className="text-[11px] xs:text-sm sm:text-base text-gray-700">
                                        2 hours to 365 days*
                                    </p>
                                    <p className="text-[11px] xs:text-sm sm:text-base text-gray-700 font-medium text-right">
                                        ADULT: ₹ 4,300 + ₹ 350
                                    </p>
                                </div>
                            </div>

                            {/* Footer Note */}
                            <p className="text-[10px] xs:text-xs text-gray-500 mt-2 sm:mt-3">
                                *From the Time of Departure
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === "date" && (
                    <div className="mx-3 xs:mx-4 sm:mx-6">
                        <div className="flex justify-between items-center mb-2 sm:mb-3">
                            <h3 className="font-semibold text-[11px] xs:text-xs sm:text-base">
                                Date Change Policy
                            </h3>
                        </div>

                        {/* Date Change Card */}
                        <div className="border border-black/30 rounded-2xl shadow-sm p-3 xs:p-4 bg-white">

                            {/* Route */}
                            <p className="font-medium text-[11px] xs:text-sm sm:text-base text-gray-700 mb-1 sm:mb-2">
                                {`${flight.AirlineDeparture?.city} - ${flight.AirlineArrival?.city}`}
                            </p>

                            {/* Info Text */}
                            <p className="text-[10px] xs:text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                                (From Scheduled Flight Departure)
                            </p>

                            {/* Table-like Layout */}
                            <div className="divide-y divide-gray-300">

                                {/* 0 to 2 hours */}
                                <div className="flex justify-between py-2 gap-2">
                                    <p className="text-[11px] xs:text-sm sm:text-base text-gray-700">
                                        0 hours to 2 hours*
                                    </p>
                                    <p className="text-[11px] xs:text-sm sm:text-base text-gray-700 font-medium text-right">
                                        ADULT: Non Changeable
                                    </p>
                                </div>

                                {/* 2 to 365 days */}
                                <div className="flex justify-between py-2 gap-2">
                                    <p className="text-[11px] xs:text-sm sm:text-base text-gray-700">
                                        2 hours to 365 days*
                                    </p>
                                    <p className="text-[11px] xs:text-sm sm:text-base text-gray-700 font-medium text-right">
                                        ADULT: ₹ 3,000 + ₹ 350 + Fare difference
                                    </p>
                                </div>
                            </div>

                            {/* Footer Note */}
                            <p className="text-[10px] xs:text-xs text-gray-500 mt-2 sm:mt-3">
                                *From the Time of Departure
                            </p>
                        </div>
                    </div>
                )}
                </div>
            </div>

            <Suspense fallback={null}>
                <Modal
                    open={fareRuleModal}
                    onClose={() => setFareRuleModal(false)}
                    title="Fare Rules"
                >
                    {Array.isArray(fareRuleData) && fareRuleData.length > 0 ? (
                        <div className="space-y-4 text-sm text-justify">
                            {fareRuleData.map((rule, idx) => {
                                const { isHtml, content } = formatFareRule(rule.FareRuleDescription);

                                return (
                                    <div
                                        key={idx}
                                        className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                                    >
                                        <p className="font-semibold text-[#920000] mb-2">
                                            {rule.FareRuleName}
                                        </p>

                                        {isHtml ? (
                                            <div
                                                className="prose prose-sm max-w-none text-xs leading-6"
                                                dangerouslySetInnerHTML={{ __html: content }}
                                            />
                                        ) : (
                                            <div className="text-xs text-gray-700 leading-6 space-y-2">
                                                {content.split("\n").map((line, i) => (
                                                    <p key={i}>{line}</p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No Fare Rules Found</p>
                    )}
                </Modal>
            </Suspense>
        </div>,
        document.body
    );
};

export default ViewFlightDetails;
