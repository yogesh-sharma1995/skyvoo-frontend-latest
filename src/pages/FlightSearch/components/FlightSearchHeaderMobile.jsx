import React, { useEffect, useRef, useState } from 'react';
import Select, { components } from "react-select";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, parse, isValid } from "date-fns";
import { X } from 'lucide-react';
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchAirportsByCode } from '@/services/airportsSearch.js';

function FlightSearchHeaderMobile({ open, onClose }) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [flightSearchInfo, setFlightSearchInfo] = useState({
        from: null,
        to: null,
        depart: new Date(),
        return: null,
        coach: 0,
    });

    const [isSwapping, setIsSwapping] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [tripType, setTripType] = useState('ROUND_TRIP');
    const [fareType, setFareType] = useState('regular');
    const [showTravellerBox, setShowTravellerBox] = useState(false);
    const [departSelected, setDepartSelected] = useState(flightSearchInfo.depart);
    const [departOpen, setDepartOpen] = useState(false);
    const [returnOpen, setReturnOpen] = useState(false);
    const departRef = useRef();
    const returnRef = useRef();
    const travellerBoxRef = useRef(null);

    const [fromSearch, setFromSearch] = useState("");
    const [toSearch, setToSearch] = useState("");
    const [debouncedFrom, setDebouncedFrom] = useState("");
    const [debouncedTo, setDebouncedTo] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFrom(fromSearch);
        }, 300);
        return () => clearTimeout(timer);
    }, [fromSearch]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTo(toSearch);
        }, 300);
        return () => clearTimeout(timer);
    }, [toSearch]);

    const {
        data: fromAirportOptions = [],
        isLoading: fromLoading,
    } = useQuery({
        queryKey: ["airportlistcodes-from-mobile", debouncedFrom],
        queryFn: ({ signal }) => fetchAirportsByCode(debouncedFrom, signal),
        enabled: debouncedFrom?.trim().length >= 1,
    });

    const {
        data: toAirportOptions = [],
        isLoading: toLoading,
    } = useQuery({
        queryKey: ["airportlistcodes-to-mobile", debouncedTo],
        queryFn: ({ signal }) => fetchAirportsByCode(debouncedTo, signal),
        enabled: debouncedTo?.trim().length >= 1,
    });

    const [travellers, setTravellers] = useState({
        adults: 1,
        children: 0,
        infants: 0,
        classType: 'Economy/Premium Economy',
    });

    useEffect(() => {
        const originCode = searchParams.get("origin");
        const destinationCode = searchParams.get("destination");
        const departDateStr = searchParams.get("departDate");
        const returnDateStr = searchParams.get("returnDate");
        const adults = Number(searchParams.get("adults") || 1);
        const children = Number(searchParams.get("children") || 0);
        const infantsRaw = Number(searchParams.get("infants") || 0);
        const infants = Math.min(infantsRaw, adults);
        const cabinClass = Number(searchParams.get("cabinClass") || 0);
        const bookingType = Number(searchParams.get("bookingType") || 0);
        const studentFare = searchParams.get("studentFareSearch") === "true";
        const srCitizen = searchParams.get("srCitizenSearch") === "true";

        if (studentFare) setFareType("student");
        else if (srCitizen) setFareType("senior");
        else setFareType("regular");

        setTripType(bookingType === 2 ? "SPECIAL_ROUND_TRIP" : bookingType === 1 ? "ROUND_TRIP" : "ONE_WAY");
        setTravellers(prev => ({ ...prev, adults, children, infants }));

        const parseDateHelper = (str) => {
            if (!str) return null;
            for (const fmt of ["MM/dd/yyyy", "dd/MM/yyyy", "yyyy-MM-dd", "yyyy/MM/dd"]) {
                try {
                    const p = parse(str, fmt, new Date());
                    if (isValid(p)) return p;
                } catch (_) { }
            }
            try {
                const d = new Date(str);
                if (isValid(d) && !isNaN(d.getTime())) return d;
            } catch (_) { }
            return null;
        };

        const departDate = parseDateHelper(departDateStr) || new Date();
        setDepartSelected(departDate);

        const returnDate = parseDateHelper(returnDateStr);

        setFlightSearchInfo(prev => ({
            ...prev,
            coach: cabinClass,
            depart: departDate,
            return: returnDate,
        }));

        const resolveAirport = async (code) => {
            if (!code) return null;
            try {
                const results = await fetchAirportsByCode(code);
                return results?.[0] ?? null;
            } catch (_) {
                return null;
            }
        };

        if (originCode) {
            resolveAirport(originCode).then(airport => {
                if (airport) setFlightSearchInfo(p => ({ ...p, from: airport }));
            });
        }
        if (destinationCode) {
            resolveAirport(destinationCode).then(airport => {
                if (airport) setFlightSearchInfo(p => ({ ...p, to: airport }));
            });
        }
    }, [searchParams, open]);

    const toNumber = (v) => {
        if (typeof v === 'string' && v.startsWith('>')) {
            const parsed = parseInt(v.slice(1), 10);
            return Number.isNaN(parsed) ? 0 : parsed + 1;
        }
        const n = Number(v);
        return Number.isNaN(n) ? 0 : n;
    };

    const getAdultCount = (val = travellers.adults) => toNumber(val) || 1;
    const getChildCount = (val = travellers.children) => toNumber(val) || 0;
    const getInfantCount = (val = travellers.infants) => toNumber(val) || 0;

    const handleAdultsChange = (newAdults) => {
        const newAdultNum = toNumber(newAdults);
        setTravellers((prev) => {
            const curInfantNum = toNumber(prev.infants);
            let newInfants = prev.infants;
            if (curInfantNum > newAdultNum) {
                newInfants = newAdultNum <= 6 ? newAdultNum : '>6';
            }
            return {
                ...prev,
                adults: newAdults,
                infants: newInfants,
            };
        });
    };

    const handleInfantsChange = (newInfants) => {
        const adultNum = getAdultCount(travellers.adults);
        const newInfantNum = toNumber(newInfants);

        if (newInfantNum > adultNum) {
            alert('Number of infants cannot exceed number of adults.');
            return;
        }

        setTravellers((prev) => ({
            ...prev,
            infants: newInfants,
        }));
    };

    const validateTravellers = () => {
        const adultsVal = getAdultCount(travellers.adults);
        const childrenVal = getChildCount(travellers.children);
        const infantsVal = getInfantCount(travellers.infants);

        if (adultsVal < 1) {
            alert('Please select at least one adult.');
            return false;
        }
        if (infantsVal > adultsVal) {
            alert('Number of infants cannot exceed number of adults.');
            setTravellers(prev => ({
                ...prev,
                infants: adultsVal <= 6 ? adultsVal : '>6',
            }));
            return false;
        }
        const total = adultsVal + childrenVal + infantsVal;
        if (total > 20) {
            alert('Total passengers cannot exceed 20.');
            return false;
        }
        setShowTravellerBox(false);
        return true;
    };

    const handleFlightInputChange = (field, value) => {
        setFlightSearchInfo(prev => ({ ...prev, [field]: value }));
        if (field === "return") {
            if (value) {
                setTripType(current =>
                    current === "SPECIAL_ROUND_TRIP" || current === "specialRoundTrip"
                        ? "SPECIAL_ROUND_TRIP"
                        : "ROUND_TRIP"
                );
            } else {
                setTripType("ONE_WAY");
            }
        }
    };

    const handleDepartSelect = (date) => {
        setDepartSelected(date);
        handleFlightInputChange("depart", date);
        if (flightSearchInfo.return && date > flightSearchInfo.return) {
            handleFlightInputChange("return", null);
            setTripType("ONE_WAY");
        }
        setDepartOpen(false);
    };

    const handleReturnSelect = (date) => {
        handleFlightInputChange("return", date);
        if (date) {
            setTripType(current =>
                current === "SPECIAL_ROUND_TRIP" || current === "specialRoundTrip"
                    ? "SPECIAL_ROUND_TRIP"
                    : "ROUND_TRIP"
            );
        }
        setReturnOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (departRef.current && !departRef.current.contains(e.target)) setDepartOpen(false);
            if (returnRef.current && !returnRef.current.contains(e.target)) setReturnOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const CustomOption = (props) => {
        const country = props.data.countryName || (props.data.countryCode === 'IND' || props.data.countryCode === 'IN' ? 'India' : props.data.countryCode || props.data.country || '');
        return (
            <components.Option {...props}>
                <div className="flex items-center gap-2.5 w-full py-0.5 text-left">
                    <div className="w-12 h-10 min-w-[46px] bg-[#f0f2f5] border border-gray-200/90 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-gray-800 tracking-wide">
                            {props.data.airportCode}
                        </span>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1 justify-center">
                        <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate leading-tight">
                            {props.data.city}{country ? `, ${country}` : ''}
                        </span>
                        <span className="text-[11px] text-gray-500 font-normal truncate mt-0.5" title={props.data.airportName}>
                            {props.data.airportName}
                        </span>
                    </div>
                </div>
            </components.Option>
        );
    };

    const CustomSingleValue = (props) => {
        if (props.selectProps.inputValue || props.isFocused || props.selectProps.menuIsOpen) return null;
        return (
            <components.SingleValue {...props}>
                <div className="flex flex-col text-left leading-tight w-full overflow-hidden">
                    <span className="text-xs sm:text-sm font-semibold text-white truncate">
                        {props.data.city}
                    </span>
                    <span className="text-[10px] text-white/70 font-normal truncate mt-0.5" title={props.data.airportName}>
                        {props.data.airportName}
                    </span>
                </div>
            </components.SingleValue>
        );
    };

    const handleSwap = () => {
        setRotation(prevRotation => prevRotation + 180);
        setIsSwapping(prev => !prev);
        setFlightSearchInfo(prev => ({
            ...prev,
            from: prev.to,
            to: prev.from,
        }));
    };

    const buildFlightDataFormat = () => {
        if (!flightSearchInfo.from || !flightSearchInfo.to) return null;
        const isInternational = flightSearchInfo.from?.countryCode !== flightSearchInfo.to?.countryCode;
        const formatDate = (date) => {
            const d = new Date(date);
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            const year = d.getFullYear();
            return `${month}/${day}/${year}`;
        };
        const tripInfo = [
            {
                Origin: flightSearchInfo.from.airportCode,
                Destination: flightSearchInfo.to.airportCode,
                TravelDate: formatDate(flightSearchInfo.depart),
                Trip_Id: 0,
            },
        ];
        const isRound = tripType === "ROUND_TRIP" || tripType === "SPECIAL_ROUND_TRIP" || tripType === "roundTrip" || tripType === "specialRoundTrip";
        if (isRound && flightSearchInfo.return) {
            tripInfo.push({
                Origin: flightSearchInfo.to.airportCode,
                Destination: flightSearchInfo.from.airportCode,
                TravelDate: formatDate(flightSearchInfo.return),
                Trip_Id: 1,
            });
        }
        const isSpecial = tripType === "SPECIAL_ROUND_TRIP" || tripType === "specialRoundTrip";
        const bookingTypeVal = isSpecial ? 2 : isRound ? 1 : 0;
        return {
            TripInfo: tripInfo,
            TravelType: isInternational ? 1 : 0,
            BookingType: bookingTypeVal,
            CabinClass: flightSearchInfo.coach,
            AdultCount: toNumber(travellers.adults),
            ChildCount: toNumber(travellers.children),
            InfantCount: toNumber(travellers.infants),
            SrCitizenSearch: fareType === "senior",
            StudentFareSearch: fareType === "student",
            Filtered_Airline: [{ Airline_Code: "" }],
        };
    };

    const validateFlightInfoInputs = () => {
        const { from, to, depart } = flightSearchInfo;
        if (!from) { alert('Please select origin'); return false; }
        if (!to) { alert('Please select destination'); return false; }
        if (from?.airportCode === to?.airportCode) { alert('Origin and destination cannot be same'); return false; }
        if (!depart) { alert('Please select a departure date'); return false; }
        const isRound = tripType === "ROUND_TRIP" || tripType === "SPECIAL_ROUND_TRIP" || tripType === "roundTrip" || tripType === "specialRoundTrip";
        if (isRound && !flightSearchInfo.return) { alert('Please select a return date for the round trip.'); return false; }
        const adultsVal = getAdultCount(travellers.adults);
        const infantsVal = getInfantCount(travellers.infants);
        if (infantsVal > adultsVal) {
            alert('Number of infants cannot exceed number of adults.');
            return false;
        }
        return true;
    };

    const searchFlightSearch = () => {
        if (!validateFlightInfoInputs()) return;
        const payload = buildFlightDataFormat();
        if (!payload) return;
        const params = new URLSearchParams({
            origin: payload.TripInfo[0].Origin,
            destination: payload.TripInfo[0].Destination,
            departDate: payload.TripInfo[0].TravelDate,
            returnDate: payload.TripInfo[1]?.TravelDate || "",
            adults: String(payload.AdultCount),
            children: String(payload.ChildCount),
            infants: String(payload.InfantCount),
            cabinClass: String(payload.CabinClass),
            travelType: String(payload.TravelType),
            bookingType: String(payload.BookingType),
            srCitizenSearch: String(payload.SrCitizenSearch),
            studentFareSearch: String(payload.StudentFareSearch),
        });
        navigate(`/flight-results?${params.toString()}`);
        onClose();
    };

    const isRoundTripSelected = tripType === 'ROUND_TRIP' || tripType === 'SPECIAL_ROUND_TRIP' || tripType === 'roundTrip' || tripType === 'specialRoundTrip';

    return (
        <>
            <div className={`fixed inset-0 z-[9999] transition-all duration-300 ${open ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`}>
                <div onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                <div
                    className={`fixed inset-0 w-full h-full bg-[#78080B] text-white transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col z-10 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y">
                        {/* Header bar: Title on Left, Cross on Right */}
                        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10">
                            <h2 className="text-base font-bold tracking-wide">Modify Flight Search</h2>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 -mr-2 rounded-full active:scale-95 transition hover:bg-white/10 cursor-pointer text-white"
                                aria-label="Close modify search"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {/* Trip Type Selector - width according to text size */}
                        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                            {[
                                { id: 'ONE_WAY', label: 'One Way' },
                                { id: 'ROUND_TRIP', label: 'Round Trip' },
                                { id: 'SPECIAL_ROUND_TRIP', label: 'Special Round Trip' }
                            ].map(({ id, label }) => {
                                const isActive = tripType === id || (id === 'ONE_WAY' && tripType === 'oneWay') || (id === 'ROUND_TRIP' && tripType === 'roundTrip') || (id === 'SPECIAL_ROUND_TRIP' && tripType === 'specialRoundTrip');
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => {
                                            setTripType(id);
                                            if (id === 'ONE_WAY') handleFlightInputChange("return", null);
                                            setDepartOpen(false);
                                            setReturnOpen(false);
                                            setShowTravellerBox(false);
                                        }}
                                        className={`px-3.5 py-2 rounded-full text-[12px] font-bold text-center transition-all cursor-pointer whitespace-nowrap leading-none ${isActive
                                            ? 'bg-white text-[#78080B] shadow-md'
                                            : 'bg-white/20 text-white hover:bg-white/30'
                                            }`}
                                    >
                                        <span>{label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* From and To - Full Width with Middle Flight Swap Icon */}
                        <div className="relative px-4 mt-2 space-y-3">
                            {/* From */}
                            <div className="w-full">
                                <label className="block text-xs text-white/80 font-medium mb-0.5">From</label>
                                <Select
                                    options={debouncedFrom?.trim().length >= 1 ? fromAirportOptions : []}
                                    onMenuOpen={() => {
                                        setFromSearch("");
                                        setDebouncedFrom("");
                                        setDepartOpen(false);
                                        setReturnOpen(false);
                                        setShowTravellerBox(false);
                                    }}
                                    onInputChange={(value, { action }) => {
                                        if (action === "input-change") {
                                            setFromSearch(value);
                                        } else if (action === "menu-close" || action === "set-value") {
                                            setFromSearch("");
                                            setDebouncedFrom("");
                                        }
                                    }}
                                    onMenuClose={() => {
                                        setFromSearch("");
                                        setDebouncedFrom("");
                                    }}
                                    isLoading={fromLoading}
                                    loadingMessage={() => (
                                        <div className="flex justify-center py-2">
                                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                    noOptionsMessage={() =>
                                        !debouncedFrom?.trim() ? null : "No airports found"
                                    }
                                    value={flightSearchInfo.from}
                                    onChange={(option) => {
                                        handleFlightInputChange("from", option);
                                        setFromSearch("");
                                        setDebouncedFrom("");
                                    }}
                                    placeholder="Origin"
                                    isClearable={false}
                                    isSearchable
                                    filterOption={null}
                                    menuPlacement="bottom"
                                    getOptionLabel={(option) => `${option.city} ${option.airportCode} ${option.airportName}`}
                                    components={{
                                        Option: CustomOption,
                                        SingleValue: CustomSingleValue,
                                        DropdownIndicator: () => null,
                                        IndicatorSeparator: () => null,
                                        LoadingIndicator: () => null,
                                        ClearIndicator: () => null,
                                    }}
                                    styles={{
                                        control: (base, state) => ({ ...base, backgroundColor: "transparent", border: "none", borderBottom: "1px solid", borderColor: state.isFocused ? "#3b82f6" : "#ffffff", borderRadius: 0, boxShadow: "none", padding: "0", minHeight: "40px", fontSize: "0.875rem", fontWeight: 600, color: "#ffffff", cursor: "pointer", "&:hover": { borderColor: "#ffffff" } }),
                                        valueContainer: (base) => ({ ...base, padding: "2px 0", overflow: "hidden" }),
                                        singleValue: (base, state) => ({ ...base, position: "relative", transform: "none", maxWidth: "100%", margin: 0, color: "#ffffff", display: (state.selectProps.inputValue || state.isFocused || state.selectProps.menuIsOpen) ? "none" : "block" }),
                                        placeholder: (base) => ({ ...base, color: "rgba(255,255,255,0.8)", fontSize: "0.875rem", fontWeight: 500, margin: 0 }),
                                        input: (base) => ({ ...base, color: "#ffffff" }),
                                        option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? "#f3f4f6" : "transparent", color: "#111827", cursor: "pointer", padding: "6px 8px", borderRadius: "10px", "&:active": { backgroundColor: "#e5e7eb" } }),
                                        menu: (base) => ({ ...base, zIndex: 50, width: "100%", borderRadius: "14px", padding: "6px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15)", border: "1px solid #e5e7eb", backgroundColor: "#ffffff" }),
                                        menuList: (base) => ({ ...base, padding: 0, maxHeight: "260px" }),
                                    }}
                                />
                            </div>

                            {/* Middle Swap Flight Icon */}
                            <div className="flex justify-center mt-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleSwap();
                                        setDepartOpen(false);
                                        setReturnOpen(false);
                                        setShowTravellerBox(false);
                                    }}
                                    aria-label="Swap origin and destination"
                                    className="p-2 rounded-full bg-[#78080B] border border-white/50 shadow-xl hover:bg-white/10 transition-transform duration-300 cursor-pointer flex items-center justify-center active:scale-90"
                                >
                                    <div
                                        className="relative w-5 h-5 transition-transform duration-500"
                                        style={{ transform: `rotate(${rotation}deg)` }}
                                    >
                                        <svg className="absolute top-0 left-0 w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor" style={{ transform: 'translate(3px,-3px) rotate(90deg)' }}>
                                            <path d="M22 16.21v-1.895L14 8V4a2 2 0 0 0-4 0v4.105L2 14.42v1.789l8-2.526V18l-2 3h6l-2-3v-4.316L22 16.21z" />
                                        </svg>
                                        <svg className="absolute top-0 left-0 w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor" style={{ transform: 'translate(3px,8px) rotate(-90deg)' }}>
                                            <path d="M22 16.21v-1.895L14 8V4a2 2 0 0 0-4 0v4.105L2 14.42v1.789l8-2.526V18l-2 3h6l-2-3v-4.316L22 16.21z" />
                                        </svg>
                                    </div>
                                </button>
                            </div>

                            {/* To */}
                            <div className="w-full">
                                <label className="block text-xs text-white/80 font-medium mb-0.5">To</label>
                                <Select
                                    options={debouncedTo?.trim().length >= 1 ? toAirportOptions : []}
                                    onMenuOpen={() => {
                                        setToSearch("");
                                        setDebouncedTo("");
                                        setDepartOpen(false);
                                        setReturnOpen(false);
                                        setShowTravellerBox(false);
                                    }}
                                    onInputChange={(value, { action }) => {
                                        if (action === "input-change") {
                                            setToSearch(value);
                                        } else if (action === "menu-close" || action === "set-value") {
                                            setToSearch("");
                                            setDebouncedTo("");
                                        }
                                    }}
                                    onMenuClose={() => {
                                        setToSearch("");
                                        setDebouncedTo("");
                                    }}
                                    isLoading={toLoading}
                                    loadingMessage={() => (
                                        <div className="flex justify-center py-2">
                                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                    noOptionsMessage={() =>
                                        !debouncedTo?.trim() ? null : "No airports found"
                                    }
                                    value={flightSearchInfo.to || null}
                                    onChange={(option) => {
                                        handleFlightInputChange("to", option || null);
                                        setToSearch("");
                                        setDebouncedTo("");
                                    }}
                                    placeholder="Destination"
                                    isClearable={false}
                                    isSearchable
                                    filterOption={null}
                                    menuPlacement="bottom"
                                    getOptionLabel={(option) => `${option.city} ${option.airportCode} ${option.airportName}`}
                                    components={{
                                        Option: CustomOption,
                                        SingleValue: CustomSingleValue,
                                        DropdownIndicator: () => null,
                                        IndicatorSeparator: () => null,
                                        LoadingIndicator: () => null,
                                        ClearIndicator: () => null,
                                    }}
                                    styles={{
                                        control: (base, state) => ({ ...base, backgroundColor: "transparent", border: "none", borderBottom: "1px solid", borderColor: state.isFocused ? "#3b82f6" : "#ffffff", borderRadius: 0, boxShadow: "none", padding: "0", minHeight: "40px", fontSize: "0.875rem", fontWeight: 600, color: "#ffffff", cursor: "pointer", "&:hover": { borderColor: "#ffffff" } }),
                                        valueContainer: (base) => ({ ...base, padding: "2px 0", overflow: "hidden" }),
                                        singleValue: (base, state) => ({ ...base, position: "relative", transform: "none", maxWidth: "100%", margin: 0, color: "#ffffff", display: (state.selectProps.inputValue || state.isFocused || state.selectProps.menuIsOpen) ? "none" : "block" }),
                                        placeholder: (base) => ({ ...base, color: "rgba(255,255,255,0.8)", fontSize: "0.875rem", fontWeight: 500, margin: 0 }),
                                        input: (base) => ({ ...base, color: "#ffffff" }),
                                        option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? "#f3f4f6" : "transparent", color: "#111827", cursor: "pointer", padding: "6px 8px", borderRadius: "10px", "&:active": { backgroundColor: "#e5e7eb" } }),
                                        menu: (base) => ({ ...base, zIndex: 50, width: "100%", borderRadius: "14px", padding: "6px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15)", border: "1px solid #e5e7eb", backgroundColor: "#ffffff" }),
                                        menuList: (base) => ({ ...base, padding: 0, maxHeight: "260px" }),
                                    }}
                                />
                            </div>
                        </div>

                        {/* Depart & Return with increased margin */}
                        <div className={`grid ${isRoundTripSelected ? 'grid-cols-2' : 'grid-cols-1'} gap-3 px-4 mt-6`}>
                            <div className="col-span-1 relative" ref={departRef}>
                                <label className="block text-xs text-white/80 font-medium mb-0.5">Depart</label>
                                <input
                                    type="text"
                                    readOnly
                                    value={departSelected ? format(departSelected, "dd/MM/yyyy") : ""}
                                    placeholder="Select Depart"
                                    onClick={() => {
                                        setDepartOpen(prev => !prev);
                                        setReturnOpen(false);
                                        setShowTravellerBox(false);
                                    }}
                                    className="w-full text-sm font-semibold text-white border-b border-white focus:outline-none placeholder-white/80 py-1 px-0 cursor-pointer bg-transparent truncate"
                                />
                                {departOpen && (
                                    <div className="absolute top-full left-0 mt-2 bg-white p-3 rounded-2xl shadow-xl z-50">
                                        <DayPicker mode="single" selected={departSelected} onSelect={handleDepartSelect} disabled={{ before: new Date(), after: flightSearchInfo.return || undefined }} numberOfMonths={1} captionLayout="dropdown-buttons" className="text-gray-800" />
                                    </div>
                                )}
                            </div>
                            {isRoundTripSelected && (
                                <div className="col-span-1 relative" ref={returnRef}>
                                    <div className="flex items-center justify-between mb-0.5">
                                        <label className="block text-xs text-white/80 font-medium">Return</label>
                                        {flightSearchInfo.return && (
                                            <div className="bg-black/40 rounded-full w-3.5 h-3.5 flex justify-center items-center cursor-pointer hover:bg-black/60" onClick={() => handleFlightInputChange("return", null)}>
                                                <X className="h-2.5 w-2.5 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        readOnly
                                        value={flightSearchInfo.return ? format(flightSearchInfo.return, "dd/MM/yyyy") : ""}
                                        placeholder="Select Return"
                                        onClick={() => {
                                            setReturnOpen(prev => !prev);
                                            setDepartOpen(false);
                                            setShowTravellerBox(false);
                                        }}
                                        className="w-full text-sm font-semibold text-white border-b border-white focus:outline-none placeholder-white/80 py-1 px-0 cursor-pointer bg-transparent truncate"
                                    />
                                    {returnOpen && (
                                        <div className="absolute top-full right-0 mt-2 bg-white p-3 rounded-2xl shadow-xl z-50">
                                            <DayPicker mode="single" selected={flightSearchInfo.return} onSelect={handleReturnSelect} disabled={{ before: departSelected || new Date() }} numberOfMonths={1} captionLayout="dropdown-buttons" className="text-gray-800" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Travelers & Class with increased margin */}
                        <div className="px-4 mt-6">
                            <div className="col-span-2 relative">
                                <label className="block text-xs text-white/80 font-medium mb-0.5">Travelers & Class</label>
                                <div
                                    onClick={() => {
                                        setShowTravellerBox(prev => !prev);
                                        setDepartOpen(false);
                                        setReturnOpen(false);
                                    }}
                                    className="border-b border-white text-white font-semibold text-sm flex justify-between items-center cursor-pointer py-1 px-0"
                                >
                                    <span className="truncate whitespace-nowrap overflow-hidden text-ellipsis">
                                        {(() => {
                                            const total = [travellers.adults, travellers.children, travellers.infants].reduce((acc, v) => acc + toNumber(v), 0);
                                            return `${total} Traveller${total > 1 ? 's' : ''} • ${travellers.classType}`;
                                        })()}
                                    </span>
                                </div>
                                {showTravellerBox && (
                                    <div className="absolute left-0 right-0 z-50 mt-2 w-full bg-white rounded-xl shadow-2xl px-4 py-4 space-y-4 text-black overflow-hidden" ref={travellerBoxRef}>
                                        <div className="flex flex-col">
                                            <p className="font-semibold text-gray-800 text-xs">ADULTS (12y+) <br /> <span className='text-[10px] text-gray-500 font-normal'>on the day of travel</span></p>
                                            <div className="flex justify-between items-center mt-2 gap-1">
                                                <div className="flex border rounded-md overflow-hidden flex-wrap">
                                                    {Array.from({ length: 9 }).map((_, i) => (
                                                        <div key={i} onClick={() => handleAdultsChange(i + 1)} className={`px-2 py-1 text-xs cursor-pointer border-r last:border-r-0 ${(Number(travellers.adults) === i + 1 && travellers.adults !== '>9' && Number(travellers.adults) < 10) ? 'bg-[#78080B] text-white' : 'hover:bg-gray-100 text-gray-700'}`}>{i + 1}</div>
                                                    ))}
                                                </div>
                                                <div onClick={() => handleAdultsChange('>9')} className={`px-2 py-1 text-xs cursor-pointer border rounded-md ${(travellers.adults === '>9' || Number(travellers.adults) >= 10) ? 'bg-[#78080B] text-white' : 'hover:bg-gray-100 text-gray-700'}`}>&gt;9</div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <div className='flex flex-col'>
                                                <p className="font-semibold text-gray-800 text-xs">CHILDREN (2y - 12y) <br /> <span className='text-[10px] text-gray-500 font-normal'>on the day of travel</span></p>
                                                <div className='flex justify-between items-center mt-2 gap-1'>
                                                    <div className="flex border rounded-md overflow-hidden flex-wrap">
                                                        {Array.from({ length: 6 }).map((_, i) => (
                                                            <div key={i} onClick={() => setTravellers(t => ({ ...t, children: i }))} className={`px-2 py-1 text-xs cursor-pointer border-r last:border-r-0 ${(Number(travellers.children) === i && travellers.children !== '>6' && Number(travellers.children) < 7) ? 'bg-[#78080B] text-white' : 'hover:bg-gray-100 text-gray-700'}`}>{i}</div>
                                                        ))}
                                                    </div>
                                                    <div onClick={() => setTravellers(t => ({ ...t, children: '>6' }))} className={`px-2 py-1 text-xs cursor-pointer border rounded-md ${(travellers.children === '>6' || Number(travellers.children) >= 7) ? 'bg-[#78080B] text-white' : 'hover:bg-gray-100 text-gray-700'}`}>&gt;6</div>
                                                </div>
                                            </div>
                                            <div className='flex flex-col'>
                                                <p className="font-semibold text-gray-800 text-xs">INFANTS (below 2y) <br /> <span className='text-[10px] text-gray-500 font-normal'>on the day of travel</span></p>
                                                <div className='flex justify-between items-center mt-2 gap-1'>
                                                    <div className="flex border rounded-md overflow-hidden flex-wrap">
                                                        {Array.from({ length: 6 }).map((_, i) => {
                                                            const isInfantDisabled = i > getAdultCount(travellers.adults);
                                                            const isSelected = Number(travellers.infants) === i && travellers.infants !== '>6' && Number(travellers.infants) < 7;
                                                            return (
                                                                <div
                                                                    key={i}
                                                                    onClick={() => !isInfantDisabled && handleInfantsChange(i)}
                                                                    title={isInfantDisabled ? "Number of infants cannot exceed number of adults" : undefined}
                                                                    className={`px-2 py-1 text-xs border-r last:border-r-0 transition-colors ${
                                                                        isSelected
                                                                            ? 'bg-[#78080B] text-white font-medium'
                                                                            : isInfantDisabled
                                                                            ? 'opacity-30 cursor-not-allowed bg-gray-100 text-gray-400 select-none'
                                                                            : 'cursor-pointer hover:bg-gray-100 text-gray-700'
                                                                    }`}
                                                                >
                                                                    {i}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    {(() => {
                                                        const isMoreThan6Disabled = getAdultCount(travellers.adults) < 7;
                                                        const isSelected = travellers.infants === '>6' || Number(travellers.infants) >= 7;
                                                        return (
                                                            <div
                                                                onClick={() => !isMoreThan6Disabled && handleInfantsChange('>6')}
                                                                title={isMoreThan6Disabled ? "Number of infants cannot exceed number of adults" : undefined}
                                                                className={`px-2 py-1 text-xs border rounded-md transition-colors ${
                                                                    isSelected
                                                                        ? 'bg-[#78080B] text-white font-medium'
                                                                        : isMoreThan6Disabled
                                                                        ? 'opacity-30 cursor-not-allowed bg-gray-100 text-gray-400 select-none'
                                                                        : 'cursor-pointer hover:bg-gray-100 text-gray-700'
                                                                }`}
                                                            >
                                                                &gt;6
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                        <hr className="border-gray-200" />
                                        <div>
                                            <p className="font-semibold text-gray-800 mb-2 uppercase tracking-wide text-xs">Choose Travel Class</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {['Economy/Premium Economy', 'Premium Economy', 'Business', 'First Class'].map((cls, idx) => (
                                                    <button key={cls} type="button" onClick={() => { setTravellers(t => ({ ...t, classType: cls })); handleFlightInputChange("coach", idx); }} className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${travellers.classType === cls ? 'bg-[#78080B] text-white border-[#78080B]' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
                                                        {cls}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div onClick={validateTravellers} className="cursor-pointer flex justify-center bg-[#78080B] hover:bg-[#5a0608] rounded-xl p-2 transition-colors">
                                            <span className="text-white text-xs sm:text-sm font-bold tracking-wider">DONE</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Fare Type with 12px option text and increased margin */}
                        <div className="px-4 mt-6 space-y-2">
                            <div className="font-medium">
                                <span className="text-xs font-medium text-white/80">Fare Type</span>
                                <div className="flex flex-col space-y-2 mt-1.5 bg-white/10 rounded-2xl p-3 border border-white/10">
                                    {[
                                        { value: "regular", label: "Regular" },
                                        { value: "student", label: "Student" },
                                        { value: "senior", label: "Senior Citizen" },
                                    ].map(({ value, label }) => (
                                        <label key={value} className="flex items-center space-x-2.5 cursor-pointer text-[12px] text-white">
                                            <input type="radio" name="mobileFareType" value={value} checked={fareType === value} onChange={() => setFareType(value)} className="text-[#78080B] focus:ring-0 cursor-pointer" />
                                            <span className="text-[12px] leading-none">{label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 mt-4 pb-8">
                            <button type="button" onClick={searchFlightSearch} className="w-full bg-white text-[#78080B] hover:bg-slate-100 active:scale-[0.98] py-3 rounded-xl font-bold shadow-lg transition-all text-sm tracking-wide cursor-pointer">
                                SEARCH FLIGHTS
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default FlightSearchHeaderMobile;