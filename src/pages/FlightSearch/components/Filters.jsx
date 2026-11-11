import React, { useRef, useState, useEffect, useMemo } from 'react';
import { X, PlaneTakeoff, PlaneLanding } from 'lucide-react';
import Sunrise from '@/assets/vectors/sunrise.svg';
import Sunnyday from '@/assets/vectors/sunnyday.svg';
import Afternoon from '@/assets/vectors/afternoon.svg';
import Night from '@/assets/vectors/night.svg';
import { useFlightFilters } from '@/contexts/FlightFilterContext';
import { useAuth } from '@/contexts/AuthContext';
import { getFlightDisplayPrice } from '@/utils/fareCalculations';
import { getFlightStops, formatStopsLabel, formatFlightStops, isSpecialRoundTripFlight, getSpecialRoundTripLegGroups } from '@/utils/flightStops';

const TimeRanges = {
    "Early Morning": { start: 0, end: 6 },
    "Morning": { start: 6, end: 12 },
    "Afternoon": { start: 12, end: 18 },
    "Night": { start: 18, end: 24 },
};

const PopularFilters = [
    { label: 'Non Stop', price: 5500 },
    { label: 'Hide Nearby Airports', price: 4200 },
    { label: 'Refundable Fares', price: 4240 },
    { label: 'Indigo' },
    { label: 'Morning Flights', price: 4800 },
    { label: 'Evening Flights', price: 4600 },
    { label: 'Direct Airlines Only', price: 5300 },
    { label: 'Extra Legroom', price: 6000 },
    { label: 'Free Meal Included' },
];

function Filters({
    flights = [],
    filters,
    origin,
    destination,
    filterState: externalState,
    filterDispatch: externalDispatch,
    label,
    showShadow = true,
    isMobileDrawer = false,
    isSpecialRoundTrip = false,
    isRoundTrip = false,
}) {

    const { user, isB2B: authIsB2B } = useAuth();
    const userType = (user?.UserType || user?.userType || user?.Role || user?.role || "").toLowerCase();
    const isB2B = authIsB2B || userType === "b2b";

    const ctx = useFlightFilters();
    const state = externalState ?? ctx.state;
    const dispatch = externalDispatch ?? ctx.dispatch;

    const [showAll, setShowAll] = useState(false);
    const [departureAirport, setDepartureAirport] = useState(null);

    const [isDragging, setIsDragging] = useState(false);
    const sliderRef = useRef(null);

    const minValue = filters?.minPrice || 0;
    const maxValue = filters?.maxPrice || 0;

    const stopsList = filters?.totalStops || [];
    const airlinesList = filters?.airlines || [];

    useEffect(() => {
        if (stopsList && stopsList.length > 0) {
            console.log(`📌 [Filters Component] Section: "Stops From ${origin || 'Origin'}"`, {
                header: isSpecialRoundTrip || isRoundTrip
                    ? (origin && destination ? `Stops from ${origin}-${destination}-${origin}` : origin ? `Stops From ${origin}` : "Stops")
                    : (origin ? `Stops From ${origin}` : "Stops"),
                rawStopsList: stopsList,
                renderedOptions: stopsList.map((stop) => formatStopsLabel(stop))
            });
        }
    }, [stopsList, origin, destination, isSpecialRoundTrip, isRoundTrip]);

    const dynamicAirlineCounts = useMemo(() => {
        if (!flights || flights.length === 0) return null;
        const counts = {};

        flights.forEach((flight) => {
            const lowestFare = getFlightDisplayPrice(flight);
            const depHour = Number(flight.DepartureTime?.split(":")[0]) || 0;

            let arrTimeStr = flight.ArrivalTime;
            if (isSpecialRoundTrip || isSpecialRoundTripFlight(flight)) {
                const { onwardLegs } = getSpecialRoundTripLegGroups(flight);
                if (onwardLegs.length > 0) {
                    arrTimeStr = onwardLegs[onwardLegs.length - 1].ArrivalTime || arrTimeStr;
                }
            }
            const arrHour = Number(arrTimeStr?.split(":")[0]) || 0;

            // Check stops
            if (state.selectedStops?.length > 0) {
                const stopLabel = formatFlightStops(flight, isSpecialRoundTrip || isSpecialRoundTripFlight(flight));
                if (!state.selectedStops.includes(stopLabel)) return;
            }

            // Check price
            if (state.selectedPriceRange?.length === 2 && lowestFare > 0) {
                const [min, max] = state.selectedPriceRange;
                if (lowestFare < min || lowestFare > max) return;
            }

            // Check departure time
            if (state.selectedDepartureTime) {
                const range = TimeRanges[state.selectedDepartureTime];
                if (range && (depHour < range.start || depHour >= range.end)) return;
            }

            // Check arrival time
            if (state.selectedArrivalTime) {
                const range = TimeRanges[state.selectedArrivalTime];
                if (range && (arrHour < range.start || arrHour >= range.end)) return;
            }

            // Collect all unique airline codes for this flight
            const flightAirlineCodes = new Set();
            if (Array.isArray(flight.AirlineLogo)) {
                flight.AirlineLogo.forEach((c) => { if (c) flightAirlineCodes.add(c.trim().toUpperCase()); });
            }
            if (Array.isArray(flight.FlightDetailResponses)) {
                flight.FlightDetailResponses.forEach((leg) => {
                    const c = leg.AirlineCode || leg.airlineCode;
                    if (c) flightAirlineCodes.add(c.trim().toUpperCase());
                });
            }
            const primaryCode = flight.AirlineCodeAndId?.split("-")[0] || flight.AirlineCode || "";
            if (primaryCode) flightAirlineCodes.add(primaryCode.trim().toUpperCase());

            flightAirlineCodes.forEach((code) => {
                counts[code] = (counts[code] || 0) + 1;
            });
        });

        return counts;
    }, [flights, state.selectedStops, state.selectedPriceRange, state.selectedDepartureTime, state.selectedArrivalTime, isSpecialRoundTrip]);

    const [value, setValue] = useState(maxValue);

    const [prevValue, setPrevValue] = useState(18500);

    const visibleFilters = useMemo(() =>
        showAll ? PopularFilters : PopularFilters.slice(0, 4),
        [showAll]
    );

    const remainingCount = PopularFilters.length - 4;

    const updateValue = (clientX) => {
        if (!sliderRef.current) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const clickX = clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width));
        let newValue = minValue + (maxValue - minValue) * percentage;

        newValue = Math.round(newValue / 100) * 100;
        newValue = Math.max(minValue, Math.min(newValue, maxValue));

        setPrevValue(value);
        setValue(newValue);
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        updateValue(e.clientX);
    };

    const handleMouseMove = (e) => {
        if (isDragging) updateValue(e.clientX);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setValue((prev) => Math.round(prev / 100) * 100);
    };

    useEffect(() => {
        setValue(maxValue);
    }, [maxValue]);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    useEffect(() => {
        dispatch({
            type: "SET_PRICE_RANGE",
            payload: [minValue, value],
        });
    }, [value, dispatch, minValue]);

    const percentage = maxValue === minValue ? 0 : ((value - minValue) / (maxValue - minValue)) * 100;

    const toggleStopFilter = (lbl) => {
        const currentStops = state.selectedStops || [];
        const newStops = currentStops.includes(lbl)
            ? currentStops.filter(f => f !== lbl)
            : [...currentStops, lbl];

        dispatch({
            type: "SET_STOPS",
            payload: newStops,
        });
    };

    const toggleAirlineFilter = (airline) => {
        const exists = state.selectedAirlines.some(a => a.code === airline.code);

        const newAirlines = exists
            ? state.selectedAirlines.filter(a => a.code !== airline.code)
            : [...state.selectedAirlines, airline];

        dispatch({
            type: "SET_AIRLINES",
            payload: newAirlines,
        });
    };

    const clearAllFilters = () => {
        dispatch({ type: "RESET_FILTERS" });
        setValue(maxValue);
        setDepartureAirport(null);
    };

    const selected = [
        ...(state.selectedStops || []),
        ...(state.selectedAircraftSizes || []),
        departureAirport,
        state.selectedDepartureTime,
        state.selectedArrivalTime,
        ...(state.selectedAirlines || []).map(a => a.name)
    ].filter(Boolean);

    const removeFilter = (filter) => {
        if (state.selectedStops?.includes(filter)) {
            dispatch({
                type: "SET_STOPS",
                payload: state.selectedStops.filter(f => f !== filter),
            });
        } else if (state.selectedAirlines?.some(a => a.name === filter)) {
            dispatch({
                type: "SET_AIRLINES",
                payload: state.selectedAirlines.filter(a => a.name !== filter),
            });
        } else if (state.selectedAircraftSizes?.includes(filter)) {
            dispatch({
                type: "SET_AIRCRAFT_SIZES",
                payload: state.selectedAircraftSizes.filter(s => s !== filter),
            });
        } else if (state.selectedDepartureTime === filter) {
            dispatch({ type: "SET_DEPARTURE_TIME", payload: null });
        } else if (state.selectedArrivalTime === filter) {
            dispatch({ type: "SET_ARRIVAL_TIME", payload: null });
        }
    };

    return (
        <div
            className={`${isMobileDrawer ? 'w-full bg-transparent px-1 pb-6 pt-1' : 'w-full bg-[#D5D5D5] rounded-lg shadow-sm px-6 pb-6 pt-3'} h-fit filters`}
            style={{
                boxShadow: (!isMobileDrawer && showShadow)
                    ? '0px 3px 22.3px 10px rgba(0,0,0,0.2), 0px 4px 6.1px 4px rgba(0,0,0,0.25)'
                    : 'none'
            }}
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-semibold">{label || 'Applied Filters'}</h3>
                <button className="cursor-pointer text-[#78080B] text-xs font-medium hover:underline" onClick={clearAllFilters}>CLEAR ALL</button>
            </div>

            {/* B2B Agent Filter Checkbox */}
            {isB2B && (
                <div className="mb-6 text-sm">
                    <label className="flex items-center justify-between cursor-pointer select-none">
                        <span className="flex items-center">
                            <input
                                type="checkbox"
                                checked={!!state.showFareBreakdown}
                                onChange={(e) => dispatch({
                                    type: "SET_SHOW_FARE_BREAKDOWN",
                                    payload: e.target.checked
                                })}
                                className="mr-3 cursor-pointer accent-red-600"
                            />
                            Show Net Price And Incv.
                        </span>
                    </label>
                </div>
            )}

            {/* Applied Filter Tags */}
            {selected.length > 0 && (
                <div className="mb-6">
                    <div className="flex flex-wrap gap-2 mb-2">
                        {selected.map((filter) => {
                            let Icon = null;

                            if (filter === state.selectedDepartureTime) Icon = PlaneTakeoff;
                            else if (filter === state.selectedArrivalTime) Icon = PlaneLanding;

                            return (
                                <span
                                    key={filter}
                                    className="bg-white text-black px-3 py-1 rounded-full font-medium text-xs flex items-center"
                                    style={{ boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)' }}
                                >
                                    {Icon && <Icon className="mr-1" size={14} />}
                                    {filter}
                                    <button
                                        onClick={() => removeFilter(filter)}
                                        className="cursor-pointer ml-2 text-white bg-[#910E0E] w-4 h-4 rounded-full flex items-center justify-center"
                                    >
                                        <X size={12} strokeWidth={3} />
                                    </button>
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Price Slider */}
            {maxValue > 0 && (
                <div className="mb-8">
                    <h4 className="text-sm font-semibold mb-4">
                        {isSpecialRoundTrip || isRoundTrip ? 'Round Trip Price' : 'One Way Price'}
                    </h4>
                    <div
                        className="relative h-1 bg-[#B9B9B9] rounded-sm cursor-pointer select-none"
                        ref={sliderRef}
                        onMouseDown={handleMouseDown}
                    >
                        {/* Red Progress Track */}
                        <div
                            className="absolute left-0 top-0 h-full bg-[#920000] rounded-sm"
                            style={{ width: `${percentage}%` }}
                        />
                        <div
                            className="absolute -top-[100%] bg-[#920000] rounded-full h-3 w-3 transform -translate-x-1/2"
                            style={{ left: `${percentage}%`, boxShadow: '0 0 6px 0 rgba(0,0,0,.2)' }}>
                        </div>

                        {/* Popup Tooltip - Only show when dragging */}
                        {isDragging && (
                            <div
                                className="absolute -top-12 transform -translate-x-1/2 bg-gray-800 text-white px-3 py-1 rounded text-sm font-medium whitespace-nowrap"
                                style={{ left: `${percentage}%` }}
                            >
                                ₹ {value.toLocaleString()}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
                            </div>
                        )}

                    </div>
                    <div className="flex justify-between text-sm text-gray-700 mt-1">
                        <span>₹ {minValue.toLocaleString()}</span>
                        <span>₹ {maxValue.toLocaleString()}</span>
                    </div>
                </div>
            )}

            {/* Stops */}
            {stopsList && stopsList.length > 0 && (
                <div className="mb-8">
                    <h4 className="text-sm font-semibold mb-4">
                        {isSpecialRoundTrip || isRoundTrip
                            ? (origin && destination ? `Stops from ${origin}-${destination}-${origin}` : origin ? `Stops From ${origin}` : 'Stops')
                            : (origin ? `Stops From ${origin}` : 'Stops')}
                    </h4>
                    <div className="space-y-3 text-sm">
                        {stopsList.map((stop) => {
                            const lbl = formatStopsLabel(stop);

                            return (
                                <label key={lbl} className="flex items-center justify-between">
                                    <span className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={state.selectedStops?.includes(lbl)}
                                            onChange={() => toggleStopFilter(lbl)}
                                            className="mr-3 cursor-pointer accent-red-600"
                                        />
                                        {lbl}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Departure Times */}
            <div className="mb-8">
                <h4 className="text-sm font-semibold mb-4">
                    {origin ? `Departure From ${origin}` : 'Departure Time'}
                </h4>
                <div className="flex flex-row justify-around gap-1 flex-wrap">
                    {[
                        { label: "Early Morning", icon: Sunrise, lines: ["Before", "6 AM"] },
                        { label: "Morning", icon: Sunnyday, lines: ["6 AM", "to 12 PM"] },
                        { label: "Afternoon", icon: Afternoon, lines: ["12 PM", "to 6 PM"] },
                        { label: "Night", icon: Night, lines: ["After", "6 PM"] }
                    ].map(({ label: timeLabel, icon, lines }) => (
                        <div
                            key={timeLabel}
                            onClick={() => dispatch({
                                type: "SET_DEPARTURE_TIME",
                                payload: state.selectedDepartureTime === timeLabel ? null : timeLabel,
                            })}
                            className="cursor-pointer text-center flex flex-col items-center hover:opacity-80"
                        >
                            <div className={`w-10 h-10 rounded-full p-2 flex items-center justify-center mb-2 transition-colors duration-200 ${state.selectedDepartureTime === timeLabel ? 'bg-[#78080B]' : 'border-[#B5B5B5] border-2 border-solid'}`}>
                                <img
                                    src={icon}
                                    alt={timeLabel}
                                    className={state.selectedDepartureTime === timeLabel ? 'filter invert brightness-0' : ''}
                                />
                            </div>
                            <div className="text-xs font-medium text-center">
                                {lines.map((line, idx) => (
                                    <p key={idx}>{line}</p>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Arrival Times*/}
            <div className="mb-8">
                <h4 className="text-sm font-semibold mb-4">
                    {destination ? `Arrival at ${destination}` : 'Arrival Time'}
                </h4>
                <div className="flex flex-row justify-around gap-1 flex-wrap">
                    {[
                        { label: "Early Morning", icon: Sunrise, lines: ["Before", "6 AM"] },
                        { label: "Morning", icon: Sunnyday, lines: ["6 AM", "to 12 PM"] },
                        { label: "Afternoon", icon: Afternoon, lines: ["12 PM", "to 6 PM"] },
                        { label: "Night", icon: Night, lines: ["After", "6 PM"] }
                    ].map(({ label: timeLabel, icon, lines }) => (
                        <div
                            key={timeLabel}
                            onClick={() => dispatch({
                                type: "SET_ARRIVAL_TIME",
                                payload: state.selectedArrivalTime === timeLabel ? null : timeLabel,
                            })}
                            className="cursor-pointer text-center flex flex-col items-center hover:opacity-80">
                            <div className={`w-10 h-10 rounded-full p-2 flex items-center justify-center mb-2 transition-colors duration-200 ${state.selectedArrivalTime === timeLabel ? 'bg-[#78080B]' : 'border-[#B5B5B5] border-2 border-solid'}`}>
                                <img
                                    src={icon}
                                    alt={timeLabel}
                                    className={state.selectedArrivalTime === timeLabel ? 'filter invert brightness-0' : ''}
                                />
                            </div>
                            <div className="text-xs font-medium text-center">
                                {lines.map((line, idx) => (
                                    <div key={idx}>{line}</div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Airlines */}
            {airlinesList && airlinesList.length > 0 && (
                <div className="mb-8">
                    <h4 className="text-sm font-semibold mb-4">Airlines</h4>
                    <div className="space-y-3 text-sm">
                        {airlinesList.map((airline) => {
                            const displayCount = dynamicAirlineCounts
                                ? (dynamicAirlineCounts[airline.code] ?? 0)
                                : (airline.count ?? 0);

                            return (
                                <label key={airline.code} className="flex items-center justify-between">
                                    <span className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={state.selectedAirlines?.some(a => a.code === airline.code)}
                                            onChange={() => toggleAirlineFilter(airline)}
                                            className="mr-3 cursor-pointer accent-red-600"
                                        />
                                        {airline.name || airline.code}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-2">({displayCount})</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Filters;
