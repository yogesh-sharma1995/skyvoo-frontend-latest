import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Utensils, Coffee, Clock, Plug, Tv, Luggage, DollarSign, RockingChair, BaggageClaim, Coins, X, ArrowLeft, Trash2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import GrayFadedBg from '@/assets/imgs/grayfadedbg.webp';
import AirlineLogoDefault from '@/assets/imgs/airlinelogo.webp';
import FlightPriceDetailsModal from '@/components/modals/FlightPriceDetailsModal';
import SignInModal from '@/components/modals/SignInModal';
import { useCompareFlights } from "@/contexts/CompareContext.jsx";
import { getAirlineLogo } from "@/utils/airlineCode";
import { formatFlightStops } from "@/utils/flightStops";

export default function CompareFlights() {
    const navigate = useNavigate();
    const { state, dispatch } = useCompareFlights();
    const { selectedFlights } = state;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFlightDetailsModalOpen, setIsFlightDetailsModalOpen] = useState(false);
    const [selectedFlightModalCtx, setSelectedFlightModalCtx] = useState(null);

    const handleOpenFareModal = (flight) => {
        setSelectedFlightModalCtx({
            flight,
            fareList: flight.TotalPriceList || []
        });
        setIsFlightDetailsModalOpen(true);
    };

    const handleRemoveFlight = (airlineCodeAndId) => {
        dispatch({
            type: "REMOVE_FLIGHT",
            payload: airlineCodeAndId
        });
    };

    const handleResetAll = () => {
        dispatch({ type: "RESET_COMPARE" });
    };

    // Route info from first selected flight
    const firstFlight = selectedFlights[0];
    const originCity = firstFlight?.AirlineDeparture?.city || firstFlight?.AirlineDeparture?.code || 'Origin';
    const destinationCity = firstFlight?.AirlineArrival?.city || firstFlight?.AirlineArrival?.code || 'Destination';
    const departureDate = firstFlight?.DepartureDate || '';

    // Dynamic grid columns based on count of flights selected
    const gridColsClass = selectedFlights.length === 1
        ? 'grid-cols-1 md:grid-cols-3'
        : selectedFlights.length === 2
            ? 'grid-cols-1 md:grid-cols-5'
            : 'grid-cols-1 md:grid-cols-7';

    return (
        <div className="pt-[52px] sm:pt-[56px]">
            {isFlightDetailsModalOpen && selectedFlightModalCtx && (
                <FlightPriceDetailsModal
                    flight={selectedFlightModalCtx.flight}
                    data={selectedFlightModalCtx.fareList}
                    onClose={() => {
                        setIsFlightDetailsModalOpen(false);
                        setSelectedFlightModalCtx(null);
                    }}
                />
            )}
            {isModalOpen && <SignInModal onClose={() => setIsModalOpen(false)} />}

            <div className="relative bg-white ">
                {/* Background Image */}
                <img
                    className="absolute right-0 top-0 z-0 max-w-full h-auto object-cover pointer-events-none"
                    style={{
                        maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)'
                    }}
                    src={GrayFadedBg}
                    alt="gray faded bg"
                />
                <Header onOpen={() => setIsModalOpen(true)} />
            </div>

            {/* Main Content */}
            <div className="pb-10 bg-cover bg-center min-h-[calc(100vh-80px)]">
                <div className="relative z-20 container mx-auto max-w-7xl px-4 pt-4">

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                        <div className="flex items-center gap-3">
                            {/* <button
                                onClick={() => navigate('/flight-results')}
                                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                title="Back to Search"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-700" />
                            </button> */}
                            <h1 className="text-2xl sm:text-3xl font-bold">Compare your flights</h1>
                        </div>

                        {selectedFlights.length > 0 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleResetAll}
                                    className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-red-700 hover:text-red-900 border border-red-200 hover:border-red-400 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear Comparison
                                </button>
                                {/* <button
                                    onClick={() => navigate('/flight-results')}
                                    className="text-xs sm:text-sm font-semibold text-[#78080B] hover:underline px-3 py-1.5"
                                >
                                    + Add More Flights
                                </button> */}
                            </div>
                        )}
                    </div>

                    {selectedFlights.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-lg p-10 text-center border border-gray-200 max-w-2xl mx-auto my-12">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-[#78080B]">
                                <Plane className="w-8 h-8" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800 mb-2">No Flights Selected for Comparison</h2>
                            <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
                                Go back to the flight search results page and click <span className="font-semibold text-[#78080B]">Add Compare More +</span> on up to 3 flights to compare them side by side.
                            </p>
                            <button
                                onClick={() => navigate('/flight-results')}
                                className="bg-[#811919] hover:bg-[#741111] text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-colors shadow-md hover:shadow-lg"
                            >
                                Back to Flight Search
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Route Info Bar */}
                            <div className="bg-white rounded-xl p-4 shadow-lg mb-4 border border-solid border-[#78080B]">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <div>
                                        <span className="font-semibold text-gray-800 text-base sm:text-lg">{originCity}</span>
                                        <span className="mx-2 text-gray-400">→</span>
                                        <span className="font-semibold text-gray-800 text-base sm:text-lg">{destinationCity}</span>
                                        {departureDate && (
                                            <>
                                                <span className="mx-2 text-gray-400">|</span>
                                                <span className="text-gray-600 text-sm sm:text-base">Departure <span className='font-semibold text-gray-800'>{departureDate}</span></span>
                                            </>
                                        )}
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-500">
                                        * Comparison is between base fares of selected flights ({selectedFlights.length}/3)
                                    </div>
                                </div>
                            </div>

                            {/* Comparison Table */}
                            <div className="bg-white rounded-xl shadow-xl p-4 mb-4 border border-solid border-[#78080B] overflow-x-auto">
                                <div className={`grid ${gridColsClass} gap-0 min-w-[700px] md:min-w-0`}>
                                    {/* Left Column - Feature Labels */}
                                    <div className="col-span-1 border-r border-gray-200">
                                        <div className="px-4 h-36 flex items-center bg-gray-50">
                                            <div className="flex items-center gap-2 text-gray-800">
                                                <Plane className="w-4 h-4 text-[#78080B]" />
                                                <span className="font-bold text-sm">Flight Summary</span>
                                            </div>
                                        </div>
                                        <div className="px-4 h-12 flex items-center border-t border-gray-100">
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Plane className="w-4 h-4" />
                                                <span className="text-xs sm:text-sm font-medium">Fleet</span>
                                            </div>
                                        </div>

                                        <div className="px-4 h-12 flex items-center border-t border-gray-100">
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <RockingChair className="w-4 h-4" />
                                                <span className="text-xs sm:text-sm font-medium">Seating</span>
                                            </div>
                                        </div>
                                        <div className="px-4 h-12 flex items-center border-t border-gray-100">
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Plug className="w-4 h-4" />
                                                <span className="text-xs sm:text-sm font-medium">Power Outlet</span>
                                            </div>
                                        </div>
                                        <div className="px-4 h-12 flex items-center border-t border-gray-100">
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Tv className="w-4 h-4" />
                                                <span className="text-xs sm:text-sm font-medium">Infotainment</span>
                                            </div>
                                        </div>
                                        <div className="px-4 h-12 flex items-center border-t border-gray-100">
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Utensils className="w-4 h-4" />
                                                <span className="text-xs sm:text-sm font-medium">Meals</span>
                                            </div>
                                        </div>
                                        <div className="px-4 h-12 flex items-center border-t border-gray-100">
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Coffee className="w-4 h-4" />
                                                <span className="text-xs sm:text-sm font-medium">Beverages</span>
                                            </div>
                                        </div>
                                        <div className="px-4 h-12 flex items-center border-t border-gray-100">
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Luggage className="w-4 h-4" />
                                                <span className="text-xs sm:text-sm font-medium">Cabin Bag</span>
                                            </div>
                                        </div>
                                        <div className="px-4 h-12 flex items-center border-t border-gray-100">
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <BaggageClaim className="w-4 h-4" />
                                                <span className="text-xs sm:text-sm font-medium">Check-in Bag</span>
                                            </div>
                                        </div>
                                        <div className="px-4 h-12 flex items-center border-t border-gray-100">
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Coins className="w-4 h-4" />
                                                <span className="text-xs sm:text-sm font-medium">Cancellation</span>
                                            </div>
                                        </div>

                                        <div className="p-4 h-32 flex items-center border-t border-gray-100 bg-gray-50">
                                            <div className="flex items-center gap-2 text-gray-800">
                                                <DollarSign className="w-4 h-4 text-[#78080B]" />
                                                <span className="font-bold text-sm">Price</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Flight Columns */}
                                    {selectedFlights.map((flight, idx) => {
                                        const logoSrc = getAirlineLogo(flight.AirlineLogo?.[0]);
                                        const airlineName = flight.AirlineName?.split(',')[0] || 'Airline';
                                        const flightCode = flight.AirlineCodeAndId || '';
                                        const departTime = flight.DepartureTime || '--:--';
                                        const arriveTime = flight.ArrivalTime || '--:--';
                                        const duration = flight.AirlineDuration || '';
                                        const stops = formatFlightStops(flight);
                                        const dayTag = flight.ArrivalDate && flight.DepartureDate && flight.ArrivalDate !== flight.DepartureDate
                                            ? flight.ArrivalDate
                                            : '';
                                        const fleet = flight.Equipment || flight.AircraftSize || flight.Fleet || "Standard Aircraft";
                                        const seating = flight.Seating || flight.CabinClass || "Standard Recliner";
                                        const power = flight.PowerOutlet ? "Yes" : "No";
                                        const infotainment = flight.Infotainment ? "Yes" : "No";
                                        const meals = flight.Meals || "Chargeable";
                                        const beverages = flight.Beverages || "Chargeable";
                                        const cabinBag = flight.CabinBag || "7 Kgs";
                                        const checkInBag = flight.CheckInBag || "15 Kgs";
                                        const cancellation = flight.Refundable ? "Refundable" : (flight.Cancellation || "Partially Refundable");
                                        const price = flight.AirlineMinNetPrice || flight.Price || 0;
                                        const fareCount = flight.TotalPriceList?.length || 0;

                                        return (
                                            <div key={flight.AirlineCodeAndId || idx} className="col-span-2 mx-1 sm:mx-2 border-r border-l border-gray-200">
                                                {/* Flight Summary Header */}
                                                <div className="h-36 p-3 flex flex-col justify-between border-b border-gray-200 relative bg-gray-50/50">
                                                    <button
                                                        onClick={() => handleRemoveFlight(flight.AirlineCodeAndId)}
                                                        className="absolute top-2 right-2 text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
                                                        title="Remove from comparison"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>

                                                    <div className="flex items-center gap-2">
                                                        <img
                                                            src={logoSrc}
                                                            alt={airlineName}
                                                            className="w-7 h-7 sm:w-9 sm:h-9 object-contain rounded-full border border-gray-100"
                                                        />
                                                        <div>
                                                            <div className="font-bold text-xs sm:text-sm text-gray-800 leading-tight">{airlineName}</div>
                                                            <div className="text-[10px] sm:text-xs text-gray-500">{flightCode}</div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-2">
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <span className="text-base sm:text-xl font-extrabold text-gray-800">{departTime}</span>
                                                            <span className="text-gray-400 text-xs sm:text-sm">→</span>
                                                            <span className="text-base sm:text-xl font-extrabold text-gray-800">{arriveTime}</span>
                                                            {dayTag && <span className="text-[10px] text-red-600 font-semibold">{dayTag}</span>}
                                                        </div>
                                                        <div className="text-xs text-gray-600">
                                                            {duration} | <span className="font-medium text-gray-700">{stops}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Fleet */}
                                                <div className="h-12 flex items-center justify-center px-2 border-b border-gray-100">
                                                    <span className="text-xs sm:text-sm text-gray-700 text-center truncate">{fleet}</span>
                                                </div>

                                                {/* Seating */}
                                                <div className="h-12 flex items-center justify-center px-2 border-b border-gray-100">
                                                    <span className="text-xs sm:text-sm text-gray-700 text-center truncate">{seating}</span>
                                                </div>

                                                {/* Power outlet */}
                                                <div className="h-12 flex items-center justify-center border-b border-gray-100">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${power === "Yes" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                                                            {power === "Yes" ? "✓" : "✕"}
                                                        </span>
                                                        <span className="text-xs sm:text-sm text-gray-700">{power}</span>
                                                    </div>
                                                </div>

                                                {/* Infotainment */}
                                                <div className="h-12 flex items-center justify-center border-b border-gray-100">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${infotainment === "Yes" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                                                            {infotainment === "Yes" ? "✓" : "✕"}
                                                        </span>
                                                        <span className="text-xs sm:text-sm text-gray-700">{infotainment}</span>
                                                    </div>
                                                </div>

                                                {/* Meals */}
                                                <div className="h-12 flex items-center justify-center border-b border-gray-100">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-4 h-4 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-[10px] font-bold">≈</span>
                                                        <span className="text-xs sm:text-sm text-gray-700">{meals}</span>
                                                    </div>
                                                </div>

                                                {/* Beverages */}
                                                <div className="h-12 flex items-center justify-center border-b border-gray-100">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-4 h-4 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-[10px] font-bold">≈</span>
                                                        <span className="text-xs sm:text-sm text-gray-700">{beverages}</span>
                                                    </div>
                                                </div>

                                                {/* Cabin Bag */}
                                                <div className="h-12 flex items-center justify-center border-b border-gray-100">
                                                    <span className="text-xs sm:text-sm text-gray-700 font-medium">{cabinBag}</span>
                                                </div>

                                                {/* Check In Bag */}
                                                <div className="h-12 flex items-center justify-center border-b border-gray-100">
                                                    <span className="text-xs sm:text-sm text-gray-700 font-medium">{checkInBag}</span>
                                                </div>

                                                {/* Cancellation */}
                                                <div className="h-12 flex items-center justify-center border-b border-gray-100 px-2 text-center">
                                                    <span className="text-xs sm:text-sm text-gray-700">{cancellation}</span>
                                                </div>

                                                {/* Price & Action */}
                                                <div className="p-3 h-32 flex flex-col items-center justify-center border-t border-gray-100 bg-gray-50/50">
                                                    <div className="text-xl sm:text-2xl font-bold text-[#78080B] mb-0.5">₹ {price.toLocaleString()}</div>
                                                    <div className="text-[10px] text-gray-500 mb-1">per adult</div>
                                                    {fareCount > 0 && (
                                                        <div className="text-[10px] text-gray-500 mb-2">{fareCount} fare option{fareCount > 1 ? 's' : ''} available</div>
                                                    )}
                                                    <button
                                                        className="w-full bg-[#811919] hover:bg-[#741111] text-white py-1.5 px-3 rounded-full text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                                                        onClick={() => handleOpenFareModal(flight)}
                                                    >
                                                        VIEW FARE OPTIONS
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

