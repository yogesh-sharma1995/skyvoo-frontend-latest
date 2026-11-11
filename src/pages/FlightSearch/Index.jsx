import React, { useState, useEffect, useMemo, useCallback, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronUp, X, SlidersHorizontal } from 'lucide-react';
import FlightSearchTopHeader from './components/FlightSearchTopHeader.jsx';
import FlightSearchHeader from './components/FlightSearchHeader.jsx';
import FlightSearchHeaderMobile from './components/FlightSearchHeaderMobile.jsx';
import Filters from './components/Filters.jsx';
import FlightPriceDetailsModal from '@/components/modals/FlightPriceDetailsModal';
import CompareFlightsWidget from "./components/CompareFlightsWidget.jsx";
import LoadingBar from "@/components/layout/LoadingBar.jsx";
import SignInModal from "@/components/modals/SignInModal";
import GrayFadedBg from "@/assets/imgs/grayfadedbg.webp";
import { useFlightFilters } from "@/contexts/FlightFilterContext.jsx";
import { useCompareFlights } from "@/contexts/CompareContext.jsx";
import FlightCard from "./components/FlightCard.jsx";
import RoundTripBottomBar from "./components/RoundTripBottomBar.jsx";
import SortingOptions from "./components/SortingOptions.jsx";
import MobileSearchSummary from "./components/MobileSearchSummary.jsx";
import FlightCardSkeleton from '@/components/layout/FlightCardSkeleton';
import { useFlightSearch } from '@/hooks/FlightSearch/useFlightSearch.js';
import { useFilteredFlights } from "@/hooks/FlightSearch/useFilteredFlights";
import { useInfiniteFlights } from '@/hooks/FlightSearch/useInfiniteFlights.js';
import { useScrollTop } from '@/hooks/FlightSearch/useScrollTop.js';
import { bookingStore } from '@/store/bookingStore.js';
import RoundTripFlightRow from './components/RoundTripFlightRow.jsx';
import { getFlightDisplayPrice } from '@/utils/fareCalculations';
import { getFlightStops, getSpecialRoundTripStops, formatSpecialRoundTripStopsLabel, isSpecialRoundTripFlight } from '@/utils/flightStops';

export default function FlightSearch() {

    const navigate = useNavigate();
    const { state: filters, dispatch: globalFilterDispatch } = useFlightFilters();
    const [selectedSorting, setSelectedSorting] = useState("");

    // ── Independent filter reducers for round-trip ──────────────────────────
    const filterInitialState = {
        selectedStops: [],
        selectedAirlines: [],
        selectedAircraftSizes: [],
        selectedPriceRange: [0, Infinity],
        selectedDepartureTime: null,
        selectedArrivalTime: null,
        showFareBreakdown: false,
    };

    function filterReducer(state, action) {
        switch (action.type) {
            case "SET_STOPS": return { ...state, selectedStops: action.payload };
            case "SET_AIRLINES": return { ...state, selectedAirlines: action.payload };
            case "SET_PRICE_RANGE": return { ...state, selectedPriceRange: action.payload };
            case "SET_DEPARTURE_TIME": return { ...state, selectedDepartureTime: action.payload };
            case "SET_ARRIVAL_TIME": return { ...state, selectedArrivalTime: action.payload };
            case "SET_AIRCRAFT_SIZES": return { ...state, selectedAircraftSizes: action.payload };
            case "SET_SHOW_FARE_BREAKDOWN": return { ...state, showFareBreakdown: action.payload };
            case "TOGGLE_SHOW_FARE_BREAKDOWN": return { ...state, showFareBreakdown: !state.showFareBreakdown };
            case "RESET_FILTERS": return filterInitialState;
            default: return state;
        }
    }
    const [outboundFilterState, outboundFilterDispatch] = useReducer(filterReducer, filterInitialState);
    const [returnFilterState, returnFilterDispatch] = useReducer(filterReducer, filterInitialState);
    // ───────────────────────────────────────────────────────────────────────

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [selectedFlightId, setSelectedFlightId] = useState(null);
    const [progress, setProgress] = useState(0);

    const { state: compareState, dispatch } = useCompareFlights();
    const selectedFlights = compareState.selectedFlights;

    const [isSignInModal, setIsSignInModal] = useState(false);
    const [isFlightDetailsModalOpen, setIsFlightDetailsModalOpen] = useState(false);
    const [flightDetailsModalCtx, setFlightDetailsModalCtx] = useState(null);

    // Round-trip independent selection
    const [selectedOutbound, setSelectedOutbound] = useState(null);
    const [selectedReturn, setSelectedReturn] = useState(null);

    const [showOtherMenu, setShowOtherMenu] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);

    const { apiFlights, apiFlightAirlines, apiReturnFlights, apiReturnAirlines, isLoading, isError, payload, isValidSearch, isFetched } = useFlightSearch();

    const searchKey = `${payload?.TripInfo?.[0]?.Origin || ''}_${payload?.TripInfo?.[0]?.Destination || ''}_${payload?.TripInfo?.[0]?.TravelDate || ''}_${payload?.TripInfo?.[1]?.TravelDate || ''}_${payload?.BookingType ?? ''}`;

    useEffect(() => {
        // Reset all filters and selections when route, dates, or search type changes
        globalFilterDispatch({ type: "RESET_FILTERS" });
        outboundFilterDispatch({ type: "RESET_FILTERS" });
        returnFilterDispatch({ type: "RESET_FILTERS" });
        setSelectedOutbound(null);
        setSelectedReturn(null);
        setSelectedFlightId(null);
        setRoundTripFilterTab("both");
    }, [searchKey, globalFilterDispatch]);

    const isSpecialRoundTrip = useMemo(() => {
        if (payload?.BookingType === 2) return true;
        if (apiFlights && apiFlights.length > 0) {
            return apiFlights.some(f => isSpecialRoundTripFlight(f));
        }
        return false;
    }, [payload?.BookingType, apiFlights]);

    // Split 2-column round trip selection is only active when it's NOT a special/bundled round trip
    const isRoundTrip = (payload?.TripInfo?.length || 0) > 1 && payload?.BookingType === 1 && !isSpecialRoundTrip;

    const flightsForFilter = useMemo(() => {
        if (isRoundTrip) return [];
        return apiFlights;
    }, [isRoundTrip, apiFlights]);

    const FlightDetails = useFilteredFlights({
        flights: flightsForFilter,
        filters,
        sorting: selectedSorting,
    });

    const { visibleFlights, loadMoreRef } = useInfiniteFlights(FlightDetails);
    const { showScrollTop, scrollToTop } = useScrollTop();

    const filterParams = useMemo(() => {
        const prices = apiFlights.map(f => getFlightDisplayPrice(f));

        let totalStops;
        if (isSpecialRoundTrip) {
            const stopMap = new Map();
            apiFlights.forEach(f => {
                const { onwardStops, returnStops } = getSpecialRoundTripStops(f);
                const label = formatSpecialRoundTripStopsLabel(onwardStops, returnStops);
                if (!stopMap.has(label)) {
                    stopMap.set(label, { onwardStops, returnStops, label });
                }
            });
            totalStops = Array.from(stopMap.values())
                .sort((a, b) => a.onwardStops !== b.onwardStops ? a.onwardStops - b.onwardStops : a.returnStops - b.returnStops)
                .map(item => item.label);
        } else {
            totalStops = [...new Set(apiFlights.map(f => getFlightStops(f)))].sort((a, b) => a - b);
        }

        const airlines = (apiFlightAirlines && apiFlightAirlines.length > 0)
            ? apiFlightAirlines.map(f => ({
                code: f.AirlineCode,
                name: f.AirlineName,
                count: f.AirlineCount,
            }))
            : (() => {
                const map = new Map();
                apiFlights.forEach(f => {
                    const legs = f.FlightDetailResponses || f.flightDetailResponses || [];
                    if (legs.length > 0) {
                        const seenInFlight = new Set();
                        legs.forEach(l => {
                            const code = l.airlineCode || l.AirlineCode || f.AirlineCode;
                            const name = l.airlineName || l.AirlineName || f.AirlineName?.split(",")[0];
                            if (code && !seenInFlight.has(code)) {
                                seenInFlight.add(code);
                                if (!map.has(code)) {
                                    map.set(code, { code, name: name || code, count: 1 });
                                } else {
                                    map.get(code).count += 1;
                                }
                            }
                        });
                    } else {
                        const code = f.AirlineCode || f.AirlineCodeAndId?.split("-")[0];
                        const name = f.AirlineName?.split(",")[0];
                        if (code) {
                            if (!map.has(code)) {
                                map.set(code, { code, name: name || code, count: 1 });
                            } else {
                                map.get(code).count += 1;
                            }
                        }
                    }
                });
                return Array.from(map.values());
            })();

        return {
            minPrice: prices.length ? Math.min(...prices) : 0,
            maxPrice: prices.length ? Math.max(...prices) : 0,
            totalStops,
            airlines
        };
    }, [apiFlights, apiFlightAirlines, isSpecialRoundTrip]);

    const returnFilterParams = useMemo(() => {
        const prices = apiReturnFlights.map(f => getFlightDisplayPrice(f));
        return {
            minPrice: prices.length ? Math.min(...prices) : 0,
            maxPrice: prices.length ? Math.max(...prices) : 0,
            totalStops: [...new Set(apiReturnFlights.map(f => getFlightStops(f)))].sort((a, b) => a - b),
            airlines: (apiReturnAirlines || []).map(f => ({
                code: f.AirlineCode,
                name: f.AirlineName,
                count: f.AirlineCount,
            }))
        };
    }, [apiReturnFlights, apiReturnAirlines]);

    const [roundTripFilterTab, setRoundTripFilterTab] = useState("both"); // "both" | "outbound" | "return"

    const combinedFilterParams = useMemo(() => {
        const allFlights = [...apiFlights, ...apiReturnFlights];
        const prices = allFlights.map(f => getFlightDisplayPrice(f)).filter(p => p > 0);
        const allAirlinesMap = new Map();
        [...apiFlightAirlines, ...(apiReturnAirlines || [])].forEach(a => {
            if (!allAirlinesMap.has(a.AirlineCode)) {
                allAirlinesMap.set(a.AirlineCode, { code: a.AirlineCode, name: a.AirlineName, count: a.AirlineCount });
            } else {
                const existing = allAirlinesMap.get(a.AirlineCode);
                existing.count += a.AirlineCount;
            }
        });

        return {
            minPrice: prices.length ? Math.min(...prices) : 0,
            maxPrice: prices.length ? Math.max(...prices) : 0,
            totalStops: [...new Set(allFlights.map(f => getFlightStops(f)))].sort((a, b) => a - b),
            airlines: Array.from(allAirlinesMap.values())
        };
    }, [apiFlights, apiReturnFlights, apiFlightAirlines, apiReturnAirlines]);

    const combinedFilterState = useMemo(() => {
        const stops = Array.from(new Set([...(outboundFilterState.selectedStops || []), ...(returnFilterState.selectedStops || [])]));
        const airlines = Array.from(new Set([...(outboundFilterState.selectedAirlines || []), ...(returnFilterState.selectedAirlines || [])]));
        const aircraftSizes = Array.from(new Set([...(outboundFilterState.selectedAircraftSizes || []), ...(returnFilterState.selectedAircraftSizes || [])]));
        return {
            selectedStops: stops,
            selectedAirlines: airlines,
            selectedAircraftSizes: aircraftSizes,
            selectedPriceRange: [
                Math.min(outboundFilterState.selectedPriceRange?.[0] ?? 0, returnFilterState.selectedPriceRange?.[0] ?? 0),
                Math.max(outboundFilterState.selectedPriceRange?.[1] ?? Infinity, returnFilterState.selectedPriceRange?.[1] ?? Infinity)
            ],
            selectedDepartureTime: outboundFilterState.selectedDepartureTime || returnFilterState.selectedDepartureTime || null,
            selectedArrivalTime: outboundFilterState.selectedArrivalTime || returnFilterState.selectedArrivalTime || null,
            showFareBreakdown: outboundFilterState.showFareBreakdown || returnFilterState.showFareBreakdown || false,
        };
    }, [outboundFilterState, returnFilterState]);

    const combinedFilterDispatch = useCallback((action) => {
        outboundFilterDispatch(action);
        returnFilterDispatch(action);
    }, [outboundFilterDispatch, returnFilterDispatch]);

    const filteredOutboundFlights = useFilteredFlights({
        flights: isRoundTrip ? apiFlights : [],
        filters: outboundFilterState,
        sorting: selectedSorting,
    });
    const filteredReturnFlights = useFilteredFlights({
        flights: isRoundTrip ? apiReturnFlights : [],
        filters: returnFilterState,
        sorting: selectedSorting,
    });

    const filteredRTRowCount = useMemo(() => {
        if (!isRoundTrip) return 0;
        return Math.max(filteredOutboundFlights.length, filteredReturnFlights.length);
    }, [isRoundTrip, filteredOutboundFlights, filteredReturnFlights]);

    const [visibleRTCount, setVisibleRTCount] = useState(10);
    const rtLoadMoreRef = React.useRef(null);
    useEffect(() => {
        if (!isRoundTrip) return;
        const el = rtLoadMoreRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleRTCount(prev => Math.min(prev + 10, filteredRTRowCount));
                }
            },
            { threshold: 0 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [isRoundTrip, filteredRTRowCount]);

    const toggleCompare = useCallback((flight) => {
        const exists = selectedFlights.some(
            f => f.AirlineCodeAndId === flight.AirlineCodeAndId
        );

        if (!exists && selectedFlights.length >= 3) {
            alert("You can only compare up to 3 flights.");
            return;
        }

        dispatch({
            type: exists ? "REMOVE_FLIGHT" : "ADD_FLIGHT",
            payload: exists ? flight.AirlineCodeAndId : flight
        });
    }, [selectedFlights, dispatch]);

    const toggleFlightDetails = useCallback((flightId) => {
        setSelectedFlightId(prev => prev === flightId ? null : flightId);
    }, []);

    const handleClick = (key) => {
        if (key === "OTHER") {
            setShowOtherMenu((prev) => !prev);
        } else {
            setSelectedSorting(key);
            setShowOtherMenu(false);
        }
    };

    const handleOtherSelect = (option) => {
        setSelectedSorting(option);
        setShowOtherMenu(false);
    };

    const handleViewPrices = useCallback((flight) => {
        setFlightDetailsModalCtx({
            flight,
            fareList: flight.TotalPriceList || [],
        });
        setIsFlightDetailsModalOpen(true);
    }, []);

    const handleBookRoundTrip = useCallback(() => {
        const adults = Number(payload?.AdultCount || 1);
        const children = Number(payload?.ChildCount || 0);
        const infants = Number(payload?.InfantCount || 0);
        const travelType = Number(payload?.TravelType ?? 0);

        bookingStore.set({
            isRoundTrip: true,
            outboundFlight: selectedOutbound,
            returnFlight: selectedReturn,
            outboundFareReviewKey: selectedOutbound?.FareReviewKey ?? null,
            returnFareReviewKey: selectedReturn?.FareReviewKey ?? null,
            travelType,
            travellers: { adults, children, infants },
            searchUrl: `/flight-results${window.location.search}`,
            searchParams: window.location.search,
        });
        navigate('/review-details');
    }, [selectedOutbound, selectedReturn, payload, navigate]);

    useEffect(() => {
        let timer;

        if (isLoading) {
            setProgress(10);

            timer = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 90) return prev;
                    return prev + Math.random() * 15;
                });
            }, 300);
        } else {
            setProgress(100);

            setTimeout(() => {
                setProgress(0);
            }, 500);
        }

        return () => clearInterval(timer);
    }, [isLoading]);

    const originCode = payload?.TripInfo?.[0]?.Origin || "";
    const destinationCode = payload?.TripInfo?.[0]?.Destination || "";
    const returnOriginCode = payload?.TripInfo?.[1]?.Origin || destinationCode;
    const returnDestinationCode = payload?.TripInfo?.[1]?.Destination || originCode;

    useEffect(() => {
        if (apiFlights && apiFlights.length > 0) {
            console.log("🛑 [Stops Filter Data Source]:", {
                apiFieldUsed: "flight.AirlineStops",
                extractedUniqueStops: filterParams.totalStops,
                originAirport: originCode,
                filterSectionTitle: `Stops From ${originCode || "Origin"}`,
                allFlightStopsSample: apiFlights.slice(0, 5).map(f => ({
                    airline: f.AirlineName || f.AirlineCode,
                    flightNumber: f.AirlineCodeAndId || f.FlightNumber,
                    AirlineStops: f.AirlineStops,
                    stopLabel: f.AirlineStops === 0 ? "Non Stop" : f.AirlineStops === 1 ? "1 Stop" : `${f.AirlineStops} Stops`
                }))
            });
        }
    }, [apiFlights, filterParams, originCode]);

    return (
        <>
            {/* Mobile Filters Drawer */}
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity duration-300 ${isFilterOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsFilterOpen(false)}
            />
            <div className={`fixed top-0 left-0 h-full w-[85vw] max-w-sm z-[9999] bg-[#D5D5D5] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isFilterOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/10 bg-[#D5D5D5]">
                    <h2 className="text-base font-bold text-gray-900">Filters</h2>
                    <button
                        type="button"
                        onClick={() => setIsFilterOpen(false)}
                        className="p-1.5 -mr-1.5 rounded-full hover:bg-black/10 active:scale-95 transition text-gray-800 cursor-pointer"
                        aria-label="Close filters"
                    >
                        <X size={22} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 bg-[#D5D5D5]">
                    {isRoundTrip ? (
                        <div className="space-y-3">
                            <div className="bg-white p-1 rounded-xl shadow-xs border border-gray-200 flex gap-1">
                                <button
                                    type="button"
                                    onClick={() => setRoundTripFilterTab("both")}
                                    className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${roundTripFilterTab === "both"
                                        ? "bg-[#78080B] text-white shadow-xs"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                        }`}
                                >
                                    All Flights
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRoundTripFilterTab("outbound")}
                                    className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${roundTripFilterTab === "outbound"
                                        ? "bg-[#78080B] text-white shadow-xs"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                        }`}
                                >
                                    {originCode || "Departure"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRoundTripFilterTab("return")}
                                    className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${roundTripFilterTab === "return"
                                        ? "bg-[#78080B] text-white shadow-xs"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                        }`}
                                >
                                    {returnOriginCode || "Return"}
                                </button>
                            </div>

                            {roundTripFilterTab === "both" && (
                                <Filters
                                    origin={originCode}
                                    destination={destinationCode}
                                    flights={[...apiFlights, ...apiReturnFlights]}
                                    filters={combinedFilterParams}
                                    filterState={combinedFilterState}
                                    filterDispatch={combinedFilterDispatch}
                                    label="Round Trip Filters"
                                    isRoundTrip={true}
                                    isMobileDrawer={true}
                                    showShadow={false}
                                />
                            )}

                            {roundTripFilterTab === "outbound" && (
                                <Filters
                                    origin={originCode}
                                    destination={destinationCode}
                                    flights={apiFlights}
                                    filters={filterParams}
                                    filterState={outboundFilterState}
                                    filterDispatch={outboundFilterDispatch}
                                    label="Departure Filters"
                                    isMobileDrawer={true}
                                    showShadow={false}
                                />
                            )}

                            {roundTripFilterTab === "return" && (
                                <Filters
                                    origin={returnOriginCode}
                                    destination={returnDestinationCode}
                                    flights={apiReturnFlights}
                                    filters={returnFilterParams}
                                    filterState={returnFilterState}
                                    filterDispatch={returnFilterDispatch}
                                    label="Return Filters"
                                    isMobileDrawer={true}
                                    showShadow={false}
                                />
                            )}
                        </div>
                    ) : (
                        <Filters
                            origin={originCode}
                            destination={destinationCode}
                            flights={apiFlights}
                            filters={filterParams}
                            isMobileDrawer={true}
                            showShadow={false}
                            isSpecialRoundTrip={isSpecialRoundTrip}
                            isRoundTrip={isRoundTrip}
                        />
                    )}
                </div>
            </div>

            <CompareFlightsWidget
                collapsed={collapsed}
                setCollapsed={setCollapsed}
            />

            {isFlightDetailsModalOpen && flightDetailsModalCtx &&
                <FlightPriceDetailsModal
                    flight={flightDetailsModalCtx.flight}
                    data={flightDetailsModalCtx.fareList}
                    onClose={() => setIsFlightDetailsModalOpen(false)}
                />
            }

            {isSignInModal && <SignInModal onClose={() => setIsSignInModal(false)} />}

            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="cursor-pointer z-9998 fixed bottom-6 right-6 bg-[#78080B] text-white px-2 py-1 xs:px-4 xs:py-2 rounded-full shadow-lg hover:bg-red-700 transition-colors"
                >
                    <p className='flex font-medium text-xs xs:text-base'>
                        <ChevronUp size={16} className='mr-1 xs:hidden' />
                        <ChevronUp size={20} className='mr-1 hidden xs:block' />
                        TOP</p>
                </button>
            )}

            <div className="relative min-h-screen">

                <img
                    className="absolute right-0 top-0 z-0 max-w-full h-auto object-cover pointer-events-none"
                    style={{
                        maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)'
                    }}
                    src={GrayFadedBg}
                    alt="gray faded background"
                />
                <FlightSearchTopHeader onOpen={() => setIsSignInModal(true)} />

                <div className="hidden lg:block">
                    <FlightSearchHeader />
                </div>

                {/* Mobile Search Header */}
                <div className="block lg:hidden">
                    <FlightSearchHeaderMobile
                        open={showMobileSearch}
                        onClose={() => setShowMobileSearch(false)}
                    />
                </div>

                {isLoading && progress > 0 && (
                    <LoadingBar progress={progress} />
                )}

                {/* Main Content */}
                <div className={`relative max-w-7xl mx-auto px-5 sm:px-4 py-6 z-50 transition-all duration-500 ${isRoundTrip && (selectedOutbound || selectedReturn) ? 'pb-32' : ''}`}>
                    <div className="flex gap-6 items-start">

                        <aside className="hidden lg:block w-70 shrink-0 sticky top-4 self-start">
                            {isRoundTrip ? (
                                <div
                                    className="
                                        p-1
                                        max-h-[calc(100vh-2rem)]
                                        overflow-y-auto
                                        overflow-x-hidden
                                        space-y-3
                                        [scrollbar-width:thin]
                                        [&::-webkit-scrollbar]:w-1
                                        [&::-webkit-scrollbar-track]:bg-transparent
                                        [&::-webkit-scrollbar-thumb]:bg-gray-400
                                        [&::-webkit-scrollbar-thumb]:rounded-full
                                        [&::-webkit-scrollbar-thumb:hover]:bg-gray-500
                                    "
                                >
                                    {/* Round Trip Filter Tab Switcher */}
                                    <div className="bg-white p-1 rounded-xl shadow-xs border border-gray-200 flex gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setRoundTripFilterTab("both")}
                                            className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${roundTripFilterTab === "both"
                                                ? "bg-[#78080B] text-white shadow-xs"
                                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                                }`}
                                        >
                                            All Flights
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRoundTripFilterTab("outbound")}
                                            className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${roundTripFilterTab === "outbound"
                                                ? "bg-[#78080B] text-white shadow-xs"
                                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                                }`}
                                        >
                                            {originCode || "Departure"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRoundTripFilterTab("return")}
                                            className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${roundTripFilterTab === "return"
                                                ? "bg-[#78080B] text-white shadow-xs"
                                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                                }`}
                                        >
                                            {returnOriginCode || "Return"}
                                        </button>
                                    </div>

                                    {roundTripFilterTab === "both" && (
                                        <Filters
                                            origin={originCode}
                                            destination={destinationCode}
                                            flights={[...apiFlights, ...apiReturnFlights]}
                                            filters={combinedFilterParams}
                                            filterState={combinedFilterState}
                                            filterDispatch={combinedFilterDispatch}
                                            label="Round Trip Filters"
                                            isRoundTrip={true}
                                            showShadow={false}
                                        />
                                    )}

                                    {roundTripFilterTab === "outbound" && (
                                        <Filters
                                            origin={originCode}
                                            destination={destinationCode}
                                            flights={apiFlights}
                                            filters={filterParams}
                                            filterState={outboundFilterState}
                                            filterDispatch={outboundFilterDispatch}
                                            label="Departure Filters"
                                            showShadow={false}
                                        />
                                    )}

                                    {roundTripFilterTab === "return" && (
                                        <Filters
                                            origin={returnOriginCode}
                                            destination={returnDestinationCode}
                                            flights={apiReturnFlights}
                                            filters={returnFilterParams}
                                            filterState={returnFilterState}
                                            filterDispatch={returnFilterDispatch}
                                            label="Return Filters"
                                            showShadow={false}
                                        />
                                    )}
                                </div>
                            ) : (
                                <div
                                    className="
                                        p-1
                                        max-h-[calc(100vh-2rem)]
                                        overflow-y-auto
                                        overflow-x-hidden
                                        [scrollbar-width:thin]
                                        [&::-webkit-scrollbar]:w-1
                                        [&::-webkit-scrollbar-track]:bg-transparent
                                        [&::-webkit-scrollbar-thumb]:bg-gray-400
                                        [&::-webkit-scrollbar-thumb]:rounded-full
                                        [&::-webkit-scrollbar-thumb:hover]:bg-gray-500
                                    "
                                >
                                    <Filters
                                        origin={originCode}
                                        destination={destinationCode}
                                        flights={apiFlights}
                                        filters={filterParams}
                                        showShadow={true}
                                        isSpecialRoundTrip={isSpecialRoundTrip}
                                        isRoundTrip={isRoundTrip}
                                    />
                                </div>
                            )}
                        </aside>

                        {/* Results Area */}
                        <div className="flex-1">
                            {/* Mobile Search Summary & Filters in One Row */}
                            <div className="lg:hidden flex items-center gap-2.5 mb-3">
                                <div className="flex-1 min-w-0">
                                    <MobileSearchSummary
                                        onEdit={() => setShowMobileSearch(true)}
                                        payload={payload}
                                        firstFlight={flightsForFilter?.[0] || apiFlights?.[0]}
                                    />
                                </div>
                                <button
                                    onClick={() => setIsFilterOpen(true)}
                                    aria-label="Open Filters"
                                    className="p-2.5 bg-[#78080B] text-white rounded-xl shadow-sm flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition hover:bg-[#600608]"
                                >
                                    <SlidersHorizontal size={18} />
                                </button>
                            </div>

                            {/* Sorting Options */}
                            <SortingOptions
                                selectedSorting={selectedSorting}
                                showOtherMenu={showOtherMenu}
                                handleClick={handleClick}
                                handleOtherSelect={handleOtherSelect}
                                setShowOtherMenu={setShowOtherMenu}
                            />

                            {/* Flight Results */}
                            <div className="space-y-4">
                                {isLoading ? (
                                    <div className="space-y-4">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <FlightCardSkeleton key={i} />
                                        ))}
                                    </div>
                                ) : isError ? (
                                    <div className="text-center py-10 text-red-600">
                                        Something went wrong. Please try again.
                                    </div>
                                ) : !isValidSearch || !isFetched ? (
                                    <div className="text-center text-gray-600 py-16 sm:py-20 text-base sm:text-lg">
                                        Please select your origin, destination, and travel dates above to find available flights.
                                    </div>
                                ) : apiFlights.length === 0 ? (
                                    <div className="text-center text-gray-600 py-16 sm:py-20 text-base sm:text-lg">
                                        No flights found for this route. Try different dates or airports.
                                    </div>
                                ) : isRoundTrip ? (
                                    filteredRTRowCount === 0 ? (
                                        <div className="text-center text-gray-600 py-16 sm:py-20 text-base sm:text-lg">
                                            {apiFlights.length === 0 || apiReturnFlights.length === 0
                                                ? "No flights found for this route. Try different dates or airports."
                                                : "No flights match your current filters."}
                                        </div>
                                    ) : (
                                        Array.from({ length: Math.min(visibleRTCount, filteredRTRowCount) }, (_, i) => (
                                            <RoundTripFlightRow
                                                key={i}
                                                outboundFlight={filteredOutboundFlights[i] ?? null}
                                                returnFlight={filteredReturnFlights[i] ?? null}
                                                onToggleCompare={toggleCompare}
                                                onViewPrices={handleViewPrices}
                                                selectedOutbound={selectedOutbound}
                                                selectedReturn={selectedReturn}
                                                onSelectOutbound={setSelectedOutbound}
                                                onSelectReturn={setSelectedReturn}
                                                showFareBreakdown={outboundFilterState.showFareBreakdown || returnFilterState.showFareBreakdown || filters.showFareBreakdown}
                                            />
                                        ))
                                    )
                                ) : FlightDetails.length > 0 ? (
                                    visibleFlights.map((flight) => (
                                        <FlightCard
                                            key={flight.AirlineCodeAndId}
                                            flight={flight}
                                            isSelected={selectedFlightId === flight.AirlineCodeAndId}
                                            isCompared={selectedFlights.some(
                                                f => f.AirlineCodeAndId === flight.AirlineCodeAndId
                                            )}
                                            onToggleDetails={toggleFlightDetails}
                                            onToggleCompare={toggleCompare}
                                            onViewPrices={handleViewPrices}
                                            showFareBreakdown={filters.showFareBreakdown}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center text-gray-600 py-16 sm:py-20 text-base sm:text-lg">
                                        No flights match your current filters.
                                    </div>
                                )}
                                {isRoundTrip
                                    ? <div ref={rtLoadMoreRef} className="h-10" />
                                    : <div ref={loadMoreRef} className="h-10" />
                                }
                            </div>

                            {/* Round-trip sticky bottom bar */}
                            {isRoundTrip && (selectedOutbound || selectedReturn) && (
                                <RoundTripBottomBar
                                    outbound={selectedOutbound}
                                    returnFlight={selectedReturn}
                                    onClearOutbound={() => setSelectedOutbound(null)}
                                    onClearReturn={() => setSelectedReturn(null)}
                                    onBook={handleBookRoundTrip}
                                />
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
