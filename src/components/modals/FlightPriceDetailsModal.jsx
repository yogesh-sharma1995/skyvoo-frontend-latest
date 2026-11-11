import React from "react";
import AirlineLogo from '@/assets/imgs/airlinelogo.webp'
import Tick from '@/assets/vectors/Tick.svg'
import Dash from '@/assets/vectors/Dash.svg'
import Insurance from '@/assets/vectors/Insurance.svg'
import { useNavigate, useSearchParams } from 'react-router-dom';
import { bookingStore } from '@/store/bookingStore';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import "@splidejs/react-splide/css";
import { getAirlineLogo } from "../../utils/airlineCode";
import { isSpecialRoundTripFlight, getSpecialRoundTripLegGroups } from '@/utils/flightStops';

export default function FlightPriceDetailsModal({ flight, data, onClose }) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const legs = flight?.FlightDetailResponses || flight?.flightDetailResponses || (flight ? [flight] : []);
    const isSpecialRoundTrip = flight ? isSpecialRoundTripFlight(flight) : false;
    const { onwardLegs, returnLegs } = isSpecialRoundTrip
        ? getSpecialRoundTripLegGroups(flight)
        : { onwardLegs: legs, returnLegs: [] };

    const firstLeg = onwardLegs[0] || legs[0];
    const lastOnwardLeg = onwardLegs[onwardLegs.length - 1] || legs[0];

    const originCity = firstLeg?.AirlineDeparture?.name || firstLeg?.AirlineDeparture?.city || flight?.AirlineDeparture?.name || flight?.AirlineDeparture?.city || "Departure";
    const destCity = isSpecialRoundTrip
        ? (lastOnwardLeg?.AirlineArrival?.name || lastOnwardLeg?.AirlineArrival?.city || "Destination")
        : (flight?.AirlineArrival?.name || flight?.AirlineArrival?.city || legs[legs.length - 1]?.AirlineArrival?.name || legs[legs.length - 1]?.AirlineArrival?.city || "Arrival");

    const depDate = flight?.DepartureDate || firstLeg?.DepartureDate || firstLeg?.departureDate || "";
    const returnDate = isSpecialRoundTrip ? (returnLegs[0]?.DepartureDate || returnLegs[0]?.departureDate || "") : "";

    const depTime = firstLeg?.DepartureTime || flight?.DepartureTime || "";
    const arrTime = isSpecialRoundTrip
        ? (lastOnwardLeg?.ArrivalTime || "")
        : (flight?.ArrivalTime || legs[legs.length - 1]?.ArrivalTime || "");

    const primaryAirlineCode = Array.isArray(flight?.AirlineLogo)
        ? flight.AirlineLogo[0]
        : (flight?.AirlineCode || firstLeg?.AirlineCode || "");
    const airlineDisplayName = flight?.AirlineName || firstLeg?.AirlineName || "";

    const fareCards = data?.map((item) => ({
        title: item.FareType || "SKYVOO",
        oldPrice: `₹ ${item.PriceList?.TotalFare}`,
        price: `₹ ${item.PriceList?.BaseFare}`,

        type: "Per adult",

        baggage: [
            `${(item.Baggages?.[0]?.CabinBag || item.Baggages?.[0]?.HandBag || "7 Kg").trim()} Cabin Baggage`,
            `${(item.Baggages?.[0]?.CheckedinBag || item.Baggages?.[0]?.CheckIn || "15 Kg").trim()} Check-in Baggage`,
        ],

        flexibility: [
            item.RefundFlag === 0 ? "Non-Refundable ticket" : "Refundable ticket",
            "Date change allowed as per airline rules",
        ],

        seatsMeals: [
            "Chargeable Seats",
            item.Meal ? "Meal Included" : "Chargeable Meals",
        ],

        buttons: ["BOOK NOW"],
        // Keep raw fare item so BOOK NOW handler can persist it
        _rawFare: item,
    }));

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-9999 "
            onClick={onClose}
        >

            <div
                onClick={(e) => e.stopPropagation()}
                className="rounded-4xl w-full max-w-6xl max-h-[90vh] relative mx-4 p-4 sm:p-6 bg-white/30"
                style={{
                    animation: "scaleIn 0.3s ease-out forwards",
                    backdropFilter: "blur(11px)",
                    border: "2px solid rgb(120, 8, 11)",
                    boxShadow: "0px 0px 33.8px 10px #00000082",
                }}
            >
                {/* Close button */}
                <button
                    className="cursor-pointer absolute top-3 right-3 sm:top-4 sm:right-4 text-xl sm:text-2xl font-black text-[#4A4141] hover:text-black"
                    onClick={onClose}
                >
                    ✕
                </button>

                {/* Header */}
                <div className="mb-6">
                    <h2 className="font-semibold text-lg sm:text-2xl">
                        Flights Details and Fare Options Available for you !
                    </h2>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium text-sm sm:text-base mt-2">
                        <span>{originCity} {isSpecialRoundTrip ? "⇄" : "→"} {destCity}</span>
                        {isSpecialRoundTrip && (
                            <span className="text-xs bg-[#78080B]/10 text-[#78080B] font-bold px-2.5 py-0.5 rounded-full">
                                Round Trip
                            </span>
                        )}
                        <span>|</span>
                        {primaryAirlineCode && getAirlineLogo(primaryAirlineCode) && (
                            <img
                                src={getAirlineLogo(primaryAirlineCode)}
                                alt={airlineDisplayName?.split(",")[0] || "airline"}
                                className="rounded-full w-8 h-8 object-contain bg-white border border-gray-200 p-0.5 shadow-2xs"
                            />
                        )}
                        <span>{airlineDisplayName}</span>
                        <span>|</span>
                        <span>{depDate}{isSpecialRoundTrip && returnDate ? ` – ${returnDate}` : ""}</span>
                        <span className="hidden sm:inline">|</span>
                        <span className="text-xs sm:text-base text-gray-700">
                            {isSpecialRoundTrip ? (
                                <>Outbound: {depTime} → {arrTime}</>
                            ) : (
                                <>Departure at {depTime} – Arrival at {arrTime}</>
                            )}
                        </span>
                    </div>
                </div>


                <div className="my-6 relative px-6 sm:px-12">
                    <Splide
                        className="fare-splide py-2 sm:py-4"
                        options={{
                            type: "slide",
                            rewind: true,
                            perPage: 3,
                            perMove: 1,
                            gap: "1rem",
                            pagination: false,
                            arrows: true,
                            drag: true,
                            breakpoints: {
                                1280: { perPage: 2 },
                                768: { perPage: 1 },
                            },
                        }}
                    >
                        {fareCards.map((card, index) => (
                            <SplideSlide key={index}>
                                <div
                                    className=" rounded-xl p-4 sm:p-6 flex flex-col justify-between bg-white h-full"
                                    style={{ boxShadow: '1px 5px 4px 2px rgba(0, 0, 0, 0.25)' }}
                                >
                                    <div>
                                        <div className="flex flex-wrap items-baseline gap-2">
                                            <span className="text-sm sm:text-lg line-through">{card.oldPrice}</span>
                                            <span className="text-xl sm:text-2xl font-bold text-[#78080B]">
                                                {card.price}
                                            </span>
                                            <span className="text-sm sm:text-xl font-medium">{card.type}</span>
                                        </div>

                                        <p className="text-sm font-medium mb-5">
                                            FARE BY{" "}
                                            <span className="font-bold text-[#78080B]">{card.title}</span>
                                        </p>

                                        <div className="space-y-2 text-sm">
                                            {/* Baggage */}
                                            <div>
                                                <p className="font-bold text-base">Baggage</p>
                                                {card.baggage.map((item, i) => (
                                                    <div key={i} className="flex items-center gap-2 mt-1">
                                                        <div className="w-4 h-4 flex items-center justify-center rounded-full bg-[#78080B] text-white text-xs">
                                                            <img src={Tick} alt="tick" />
                                                        </div>
                                                        <p>{item}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Flexibility */}
                                            <div className="mt-4">
                                                <p className="text-base font-bold">Flexibility</p>
                                                {card.flexibility.map((item, i) => (
                                                    <div key={i} className="flex items-start gap-2">
                                                        <img src={Dash} alt="dash" className="pt-2" />
                                                        <p className="text-sm leading-loose">{item}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Seats, Meals & More */}
                                            <div className="mt-4">
                                                <p className="text-base font-bold">Seats, Meals & More</p>
                                                {card.seatsMeals.map((item, i) => (
                                                    <div key={i} className="flex items-start gap-2">
                                                        <img src={Dash} alt="dash" className="pt-2" />
                                                        <p className="text-sm leading-loose">{item}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Optional: Benefits / Insurance */}
                                            {card.benefitsWorth && (
                                                <div>
                                                    <p className="text-base mt-3 font-semibold">
                                                        BENEFITS WORTH{" "}
                                                        <span className="text-[#FF8000]">
                                                            {card.benefitsWorth}
                                                        </span>{" "}
                                                        INCLUDED
                                                    </p>
                                                </div>
                                            )}

                                            {card.insurance && (
                                                <div
                                                    className="flex items-center bg-[#D9D9D9] rounded-md text-black p-2"
                                                    style={{
                                                        boxShadow: "2px 4px 4px rgba(0, 0, 0, 0.10)",
                                                    }}
                                                >
                                                    <img src={Insurance} alt="insurance" />
                                                    <p className="text-sm">{card.insurance}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex flex-col justify-between sm:flex-row mt-6 gap-3 sm:gap-4">
                                        {card.buttons.map((btn, i) => (
                                            <button
                                                key={i}
                                                className={`cursor-pointer py-2 px-4 text-sm sm:text-base rounded-full border-2 transition duration-200 shadow-sm ${btn === "BOOK NOW"
                                                    ? "bg-[#78080B] text-white border-transparent hover:bg-white hover:text-[#78080B] hover:border-[#78080B]"
                                                    : "border-[#78080B] text-[#78080B] hover:bg-[#78080B] hover:text-white"
                                                    }`}
                                                onClick={() => {
                                                    if (btn === "BOOK NOW") {
                                                        const adults = Number(searchParams.get("adults") || 1);
                                                        const children = Number(searchParams.get("children") || 0);
                                                        const infants = Number(searchParams.get("infants") || 0);
                                                        const directCountryCodeArr = ["IND", "IN"];
                                                        const legs = flight?.FlightDetailResponses || flight?.flightDetailResponses || [];
                                                        const isIntlFlight = legs.some((leg) => {
                                                            const depC = leg?.AirlineDeparture?.countryCode || leg?.AirlineDeparture?.CountryCode;
                                                            const arrC = leg?.AirlineArrival?.countryCode || leg?.AirlineArrival?.CountryCode;
                                                            return (depC && !directCountryCodeArr.includes(String(depC).toUpperCase())) ||
                                                                (arrC && !directCountryCodeArr.includes(String(arrC).toUpperCase()));
                                                        });
                                                        const travelType = Number(
                                                            searchParams.get("travelType") ??
                                                            flight?.TravelType ??
                                                            (isIntlFlight ? 1 : 0)
                                                        );

                                                        // Persist the selected flight + fare to bookingStore
                                                        // before navigating so downstream booking steps
                                                        // have access to FlightKey, Vendor, FareId, PriceList, etc.
                                                        bookingStore.set({
                                                            flight,
                                                            selectedFare: card._rawFare,
                                                            isRoundTrip: false,
                                                            // FareReviewKey from the chosen fare in TotalPriceList
                                                            fareReviewKey: card._rawFare?.FareReviewKey ?? null,
                                                            travelType,
                                                            travellers: { adults, children, infants },
                                                            searchUrl: `/flight-results${window.location.search}`,
                                                            searchParams: window.location.search,
                                                        });
                                                    }
                                                    onClose?.();
                                                    navigate('/review-details');
                                                }}
                                            >
                                                {btn}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </SplideSlide>
                        ))}
                    </Splide>
                </div>

            </div>

            {/* Animations & Carousel Arrow Styles */}
            <style>
                {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { transform: scale(0.95); }
            to { transform: scale(1); }
          }
          .fare-splide .splide__arrows {
            display: block !important;
          }
          .fare-splide .splide__arrow {
            display: flex !important;
            align-items: center;
            justify-content: center;
            background: #ffffff !important;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22) !important;
            width: 2.6rem !important;
            height: 2.6rem !important;
            opacity: 1 !important;
            transition: all 0.2s ease !important;
            border: 1.5px solid #78080B !important;
            z-index: 30 !important;
            cursor: pointer !important;
          }
          .fare-splide .splide__arrow:hover {
            background: #78080B !important;
            opacity: 1 !important;
            transform: translateY(-50%) scale(1.08) !important;
          }
          .fare-splide .splide__arrow:hover svg {
            fill: #ffffff !important;
          }
          .fare-splide .splide__arrow svg {
            fill: #78080B !important;
            width: 1.15rem !important;
            height: 1.15rem !important;
            transition: fill 0.2s ease !important;
          }
          .fare-splide .splide__arrow--prev {
            left: -20px !important;
          }
          .fare-splide .splide__arrow--next {
            right: -20px !important;
          }
          @media (max-width: 640px) {
            .fare-splide .splide__arrow--prev {
              left: -10px !important;
            }
            .fare-splide .splide__arrow--next {
              right: -10px !important;
            }
          }
        `}
            </style>
        </div >
    );
}
