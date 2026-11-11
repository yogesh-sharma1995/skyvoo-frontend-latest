import React, { useState, useRef, useEffect } from 'react';
import Select, { components } from "react-select";
import clsx from 'clsx';
import { X, CirclePlus, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Plane from '@/assets/vectors/Plane.svg';
import Bed from '@/assets/vectors/Bed.svg';
import Car from '@/assets/vectors/Car.svg';
import Mic from '@/assets/vectors/Mic.svg';
import FlyingPlane from '@/assets/vectors/FlyingPlane.svg';
import Person from '@/assets/vectors/Person.svg';
import RipSide from '@/assets/imgs/ripSide.webp';
import BookingFlightFormBg from "@/assets/imgs/bookingForm.webp";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useQuery } from "@tanstack/react-query";
import { fetchAirportsByCode } from "@/services/airportsSearch.js";
import { CoachOptions } from "@/data/ExtraData.js";
import { useAuth } from '@/contexts/AuthContext';
import SignInModal from '@/components/modals/SignInModal';


function BookingForm() {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();
    const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

    const [startAnimation, setStartAnimation] = useState(false);

    const [flightSearchInfo, setFlightSearchInfo] = useState({
        from: null,
        to: null,
        depart: new Date(),
        return: null,
        coach: 0,
        traveller: {
            adults: 1,
            children: 0,
            infants: 0,
        },
    });

    const [travellers, setTravellers] = useState({
        adults: 1,
        children: 0,
        infants: 0,
    });

    const [tripType, setTripType] = useState('ONE_WAY');
    const [fareType, setFareType] = useState('regular');
    const [isSwapping, setIsSwapping] = useState(false);
    const [rotation, setRotation] = useState(0);

    const [departOpen, setDepartOpen] = useState(false);
    const [returnOpen, setReturnOpen] = useState(false);
    const [departSelected, setDepartSelected] = useState(flightSearchInfo.depart);

    const [fromSearch, setFromSearch] = useState("");
    const [toSearch, setToSearch] = useState("");

    const [debouncedFrom, setDebouncedFrom] = useState("");
    const [debouncedTo, setDebouncedTo] = useState("");

    const [showTravellerBox, setShowTravellerBox] = useState(false);

    const departRef = useRef();
    const returnRef = useRef();
    const travellerBoxRef = useRef(null);

    const { data: fromAirportOptions = [], isLoading: fromLoading, isError: fromError } = useQuery({
        queryKey: ["airportlistcodes-from", debouncedFrom],
        queryFn: ({ signal }) => fetchAirportsByCode(debouncedFrom, signal),
        enabled: debouncedFrom?.trim().length >= 1,
    });

    const { data: toAirportOptions = [], isLoading: toLoading, isError: toError } = useQuery({
        queryKey: ["airportlistcodes-to", debouncedTo],
        queryFn: ({ signal }) => fetchAirportsByCode(debouncedTo, signal),
        enabled: debouncedTo?.trim().length >= 1,
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFrom(fromSearch);
        }, 200);

        return () => clearTimeout(timer);
    }, [fromSearch]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTo(toSearch);
        }, 200);

        return () => clearTimeout(timer);
    }, [toSearch]);


    useEffect(() => {
        const handleClickOutside = (e) => {
            if (departRef.current && !departRef.current.contains(e.target)) {
                setDepartOpen(false);
            }
            if (returnRef.current && !returnRef.current.contains(e.target)) {
                setReturnOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        function handleDocClick(e) {
            if (travellerBoxRef.current && !travellerBoxRef.current.contains(e.target)) {
                setShowTravellerBox(false);
            }
        }
        function handleEsc(e) {
            if (e.key === 'Escape') setShowTravellerBox(false);
        }
        document.addEventListener('mousedown', handleDocClick);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleDocClick);
            document.removeEventListener('keydown', handleEsc);
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const triggerPoint = 100;

            if (window.scrollY >= triggerPoint && !startAnimation) {
                setStartAnimation(true);
                window.removeEventListener('scroll', handleScroll);
            }
        };

        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const CustomOption = (props) => {
        const country = props.data.countryName || (props.data.countryCode === 'IND' || props.data.countryCode === 'IN' ? 'India' : props.data.countryCode || props.data.country || '');
        return (
            <components.Option {...props}>
                <div className="flex items-center gap-3 w-full py-0.5 text-left">
                    <div className="w-13 h-11 min-w-[50px] bg-[#f0f2f5] border border-gray-200/90 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-gray-800 tracking-wide">
                            {props.data.airportCode}
                        </span>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1 justify-center">
                        <span className="text-[14px] sm:text-[15px] font-semibold text-gray-900 truncate leading-tight">
                            {props.data.city}{country ? `, ${country}` : ''}
                        </span>
                        <span className="text-xs text-gray-500 font-normal truncate mt-0.5" title={props.data.airportName}>
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
                <div className="flex flex-col text-left leading-tight w-full overflow-hidden pb-1">
                    <span className="text-base sm:text-[17px] font-bold text-[#333333] truncate">
                        {props.data.city}
                    </span>
                    <span className="text-[11px] text-gray-500 font-normal truncate mt-0.5" title={props.data.airportName}>
                        {props.data.airportName}
                    </span>
                </div>
            </components.SingleValue>
        );
    };

    const handleFlightInputChange = (field, value) => {
        setFlightSearchInfo(prev => {
            let updated = { ...prev, [field]: value };

            // Enforce logical consistency
            if (field === "depart" && updated.return && value && value > updated.return) {
                updated.return = null; // clear return if it’s before new depart
            }

            if (field === "return" && updated.depart && value && value < updated.depart) {
                updated.depart = null; // clear depart if it’s after new return (optional)
            }

            return updated;
        });

        if (field === "return") {
            if (value) {
                setTripType((current) => current === "SPECIAL_ROUND_TRIP" ? "SPECIAL_ROUND_TRIP" : "ROUND_TRIP");
            } else {
                setTripType("ONE_WAY");
            }
        }
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

    const handleDepartSelect = (date) => {
        setDepartSelected(date);
        handleFlightInputChange("depart", date);

        // Auto-close and adjust Return if needed
        if (flightSearchInfo.return && date > flightSearchInfo.return) {
            handleFlightInputChange("return", null);
            setTripType("ONE_WAY");
        }
        setDepartOpen(false);
    };

    const handleReturnSelect = (date) => {
        handleFlightInputChange("return", date);

        if (date) {
            setTripType((current) => current === "SPECIAL_ROUND_TRIP" ? "SPECIAL_ROUND_TRIP" : "ROUND_TRIP");
        }

        setReturnOpen(false);
    };

    const handleTripTypeChange = (newType) => {
        setTripType(newType);
        if (newType === 'ONE_WAY') {
            handleFlightInputChange("return", null);
        }
    };

    const handleRemoveReturnDate = () => {
        handleFlightInputChange("return", null);
        setTripType("ONE_WAY");
    };

    const toNumber = (v) => {
        if (typeof v === "string" && v.startsWith(">")) {
            const parsed = parseInt(v.slice(1), 10);
            return Number.isNaN(parsed) ? 0 : parsed + 1;
        }
        const n = Number(v);
        return Number.isNaN(n) ? 0 : n;
    };

    const totalTravellers =
        toNumber(travellers.adults) +
        toNumber(travellers.children) +
        toNumber(travellers.infants);

    useEffect(() => {
        const adultCount = toNumber(travellers.adults);
        const childrenCount = toNumber(travellers.children);
        const infantsCount = toNumber(travellers.infants);

        setFlightSearchInfo(prev => ({
            ...prev,
            traveller: { adults: adultCount, children: childrenCount, infants: infantsCount }
        }));
    }, [travellers]);

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
        const { adults, children, infants } = travellers;

        const adultCount = getAdultCount(adults);
        const childrenCount = getChildCount(children);
        const infantsCount = getInfantCount(infants);

        if (adultCount < 1) {
            alert('At least 1 adult is required for the booking.');
            return;
        }

        if (infantsCount > adultCount) {
            alert('Number of infants cannot exceed number of adults.');
            setTravellers((prev) => ({
                ...prev,
                infants: adultCount <= 6 ? adultCount : '>6',
            }));
            return;
        }

        const total = adultCount + childrenCount + infantsCount;
        if (total > 20) {
            alert('Maximum 20 travelers allowed.');
            return;
        }

        const normalizedAdults = toNumber(adults);
        const normalizedChildren = toNumber(children);
        const normalizedInfants = toNumber(infants);

        setFlightSearchInfo(prev => ({
            ...prev,
            traveller: { adults: normalizedAdults, children: normalizedChildren, infants: normalizedInfants }
        }));
        setShowTravellerBox(false);
    };

    const buildFlightDataFormat = () => {
        if (!flightSearchInfo.from || !flightSearchInfo.to) return;

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

        if ((tripType === "ROUND_TRIP" || tripType === "SPECIAL_ROUND_TRIP") && flightSearchInfo.return) {
            tripInfo.push({
                Origin: flightSearchInfo.to.airportCode,
                Destination: flightSearchInfo.from.airportCode,
                TravelDate: formatDate(flightSearchInfo.return),
                Trip_Id: 1,
            });
        }

        const bookingTypeVal = tripType === "SPECIAL_ROUND_TRIP" ? 2 : tripType === "ROUND_TRIP" ? 1 : 0;

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
        const { from, to, depart, traveller, coach } = flightSearchInfo;

        if (!from) return alert('Please select origin');
        if (!to) return alert('Please select destination');

        if (from?.airportCode === to?.airportCode) {
            return alert('Origin and destination cannot be same');
        }

        if (!depart) return alert('Please select a departure date');

        if ((tripType === 'ROUND_TRIP' || tripType === 'SPECIAL_ROUND_TRIP') && !flightSearchInfo.return) {
            return alert('Please select a return date for the round trip.');
        }

        if (!traveller) return alert('Please select travelers');

        const adultCount = getAdultCount(travellers.adults);
        const infantsCount = getInfantCount(travellers.infants);
        if (infantsCount > adultCount) {
            alert('Number of infants cannot exceed number of adults.');
            return false;
        }

        if (coach === null || coach === undefined) return alert('Please select a travel class');

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
    };

    return (
        <div className="relative grid grid-cols-12 gap-4 sm:gap-6 md:gap-8 bg-no-repeat bg-cover bg-center rounded-[30px] md:rounded-[45px] shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
            style={{ backgroundImage: `url(${BookingFlightFormBg})` }}
        >
            <img
                className="absolute -right-3 top-1/2 -translate-y-1/2 h-[80%] pointer-events-none hidden lg:block select-none z-10"
                src={RipSide}
                alt="ribbon side"
            />

            <div className="col-span-12 p-6 sm:p-8 lg:p-10">
                {/* Tabs */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 text-black text-base sm:text-lg font-semibold">
                    <button className=" flex items-center space-x-1 bg-[#D9D9D9] rounded-md px-2 xs:px-4 py-1 cursor-pointer text-black border-2 border-black">
                        <img src={Plane} alt="plane" className="w-5 h-5" />
                        <span>Flights</span>
                    </button>
                    <button className=" flex items-center space-x-1 rounded-md px-2 xs:px-4 py-1 cursor-pointer border-2 border-transparent hover:bg-[#D9D9D9] hover:border-black">
                        <img src={Bed} alt="bed" className="w-6 h-6 sm:w-7 sm:h-7" />
                        <span>Hotels</span>
                    </button>
                    <button className=" flex items-center space-x-1 rounded-md px-2 xs:px-4 py-1 cursor-pointer border-2 border-transparent hover:bg-[#D9D9D9] hover:border-black">
                        <img src={Car} alt="car" className="w-6 h-6 sm:w-7 sm:h-7" />
                        <span>Cabs</span>
                    </button>

                    <button className=" flex items-center text-black font-medium cursor-pointer px-3 sm:px-4 py-2 border-2 border-transparent hover:text-gray-500 ml-auto mt-2 sm:mt-0">
                        <img src={Mic} alt="mic" className="w-5 h-5 mr-2" />
                        <span>Customer Support</span>
                    </button>
                </div>

                <div className='mb-3 grid grid-cols-12 gap-8 '> <div className="col-span-8 flex items-center relative right-[15px] sm:right-[40px]" >
                    <div className={`h-4 relative ribbon mr-2 ${startAnimation ? 'animate-ribbon' : ''}`}></div> <img src={FlyingPlane} alt="flyingplane" /> </div>
                </div>

                {/* Trip Type Selection */}
                <div className="filter-section flex flex-wrap gap-3 sm:gap-4 mb-4 text-base sm:text-lg  font-semibold">
                    {[
                        { key: 0, value: 'ONE_WAY', label: 'One Way' },
                        { key: 1, value: 'ROUND_TRIP', label: 'Round Trip' },
                        { key: 2, value: 'SPECIAL_ROUND_TRIP', label: 'Special Round Trip' },
                        // { key: 3, value: 'MULTI_CITY', label: 'Multi-City' },
                    ].map(({ key, value, label }) => (
                        <label key={key} className="flex items-center cursor-pointer">
                            <div className={clsx(' px-4 py-2 flex items-center rounded-md', tripType === value ? 'bg-black text-white' : 'text-black')}>
                                <input
                                    type="radio"
                                    name="tripType"
                                    value={value}
                                    checked={tripType === value}
                                    onChange={(e) => handleTripTypeChange(e.target.value)}
                                    className="w-4 h-4 mr-2"
                                />
                                <span>{label}</span>
                            </div>
                        </label>
                    ))}


                    <div className="relative  font-semibold w-full sm:w-auto">
                        <Select
                            options={CoachOptions}
                            value={CoachOptions.find(c => c.value === flightSearchInfo.coach) || null}
                            onChange={(option) => handleFlightInputChange("coach", option?.value ?? null)}
                            placeholder="Coach"
                            classNamePrefix="coach-select"
                            menuPlacement="top"
                            components={{ IndicatorSeparator: () => null }}
                            getOptionLabel={(option) => option.label}
                            styles={{
                                control: (base, state) => ({
                                    ...base,
                                    backgroundColor: "transparent",
                                    border: "none",
                                    cursor: 'pointer',
                                    boxShadow: state.isFocused ? "0 0 0 1px #000" : "none",
                                    padding: "2px 4px",
                                    minHeight: "38px",
                                    color: "black",
                                    fontSize: '1.155rem',
                                    fontWeight: '600',
                                    fontFamily: "Poppins, sans-serif",
                                    "&:hover": { borderColor: "#000" },
                                }),
                                menu: (base) => ({
                                    ...base,
                                    zIndex: 50,
                                    width: "300px",
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                }),
                                option: (base, state) => ({
                                    ...base,
                                    backgroundColor: state.isFocused ? "#f3f4f6" : "transparent",
                                    color: "black",
                                    cursor: "pointer",
                                    padding: "8px 12px",
                                }),
                                placeholder: (base) => ({
                                    ...base,
                                    color: "black",
                                    fontSize: '1.155rem',
                                    fontWeight: '600',
                                    fontFamily: "Poppins, sans-serif",
                                }),
                                dropdownIndicator: (base) => ({
                                    ...base,
                                    color: "black",
                                    padding: 4,
                                    svg: {
                                        fontSize: "1.155rem",
                                        fontWeight: "600",
                                    },
                                }),

                            }}
                        />

                    </div>
                </div>

                {/* Flight Search Form */}
                <div className="w-full max-w-6xl mx-auto">
                    <div className="grid grid-cols-12 gap-4 sm:gap-6 items-end  font-semibold">

                        {/* From */}
                        <div className="col-span-12 sm:col-span-6 md:col-span-2">
                            <label className="block text-lg text-gray-700">From</label>
                            <Select
                                options={debouncedFrom?.trim().length >= 1 ? fromAirportOptions : []}
                                isLoading={fromLoading}
                                loadingMessage={() => (
                                    <div className="flex justify-center py-3">
                                        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                                noOptionsMessage={() => !debouncedFrom?.trim() ? null : "No airports found"}
                                onMenuOpen={() => {
                                    setFromSearch("");
                                    setDebouncedFrom("");
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
                                value={flightSearchInfo.from}
                                onChange={(option) => {
                                    handleFlightInputChange("from", option);
                                    setFromSearch("");
                                    setDebouncedFrom("");
                                }}
                                placeholder="Origin"
                                isSearchable
                                filterOption={null}
                                menuPlacement="top"
                                getOptionLabel={(option) => `${option.city} ${option.airportCode} ${option.airportName}`}
                                getOptionValue={(option) => option.airportCode}
                                components={{
                                    Option: CustomOption,
                                    SingleValue: CustomSingleValue,
                                    DropdownIndicator: () => null,
                                    IndicatorSeparator: () => null,
                                    LoadingIndicator: () => null
                                }}
                                classNamePrefix="flight-select"
                                styles={{
                                    control: (base, state) => ({
                                        ...base,
                                        backgroundColor: "transparent",
                                        border: "none",
                                        borderBottom: "1px solid",
                                        borderColor: state.isFocused ? "#3b82f6" : "#9ca3af",
                                        borderRadius: 0,
                                        boxShadow: "none",
                                        padding: "0px",
                                        minHeight: "44px",
                                        color: "#525252",
                                        "&:hover": { borderColor: "#3b82f6" },
                                    }),
                                    valueContainer: (base) => ({
                                        ...base,
                                        padding: "2px 0",
                                        overflow: "hidden",
                                    }),
                                    singleValue: (base, state) => ({
                                        ...base,
                                        position: "relative",
                                        transform: "none",
                                        maxWidth: "100%",
                                        margin: "0",
                                        display: (state.selectProps.inputValue || state.isFocused || state.selectProps.menuIsOpen) ? "none" : "block",
                                    }),
                                    placeholder: (base) => ({
                                        ...base,
                                        fontSize: "1.15rem",
                                        color: "#808080",
                                        margin: "0",
                                    }),
                                    input: (base) => ({
                                        ...base,
                                        margin: "0",
                                        padding: "0",
                                        fontSize: "1.1rem",
                                        color: "#111827",
                                    }),
                                    option: (base, state) => ({
                                        ...base,
                                        backgroundColor: state.isFocused
                                            ? "#f3f4f6"
                                            : "transparent",
                                        color: "#111827",
                                        cursor: "pointer",
                                        padding: "6px 8px",
                                        borderRadius: "10px",
                                        "&:active": { backgroundColor: "#e5e7eb" },
                                    }),
                                    menu: (base) => ({
                                        ...base,
                                        zIndex: 50,
                                        width: "420px",
                                        borderRadius: "14px",
                                        padding: "6px",
                                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                                        border: "1px solid #e5e7eb",
                                        backgroundColor: "#ffffff",
                                    }),
                                    menuList: (base) => ({
                                        ...base,
                                        padding: 0,
                                        maxHeight: "280px",
                                    }),
                                }}
                            />

                        </div>

                        {/* Swap */}
                        <div className="col-span-12 sm:col-span-1 flex justify-center">
                            <button
                                onClick={handleSwap}
                                className="p-2 cursor-pointer rounded-full transition-all duration-300"
                            >
                                <div
                                    className="relative w-6 h-6 transition-transform duration-500"
                                    style={{ transform: `rotate(${rotation}deg)` }}
                                >
                                    <svg className="absolute top-0 left-0 w-4 h-4 text-black transition-all duration-500" viewBox="0 0 24 24" fill="currentColor" style={{ transform: 'translate(4px, -4px) rotate(90deg)' }}>
                                        <path d="M22 16.21v-1.895L14 8V4a2 2 0 0 0-4 0v4.105L2 14.42v1.789l8-2.526V18l-2 3h6l-2-3v-4.316L22 16.21z" />
                                    </svg>
                                    <svg className="absolute top-0 left-0 w-4 h-4 text-black transition-all duration-500" viewBox="0 0 24 24" fill="currentColor" style={{ transform: 'translate(4px, 10px) rotate(-90deg)' }}>
                                        <path d="M22 16.21v-1.895L14 8V4a2 2 0 0 0-4 0v4.105L2 14.42v1.789l8-2.526V18l-2 3h6l-2-3v-4.316L22 16.21z" />
                                    </svg>
                                </div>
                            </button>
                        </div>

                        {/* To */}
                        <div className="col-span-12 sm:col-span-6 md:col-span-2">
                            <label className="block text-lg text-gray-700">To</label>
                            <Select
                                options={debouncedTo?.trim().length >= 1 ? toAirportOptions : []}
                                noOptionsMessage={() => !debouncedTo?.trim() ? null : "No airports found"}
                                isLoading={toLoading}
                                loadingMessage={() => (
                                    <div className="flex justify-center py-3">
                                        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                                onMenuOpen={() => {
                                    setToSearch("");
                                    setDebouncedTo("");
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
                                value={flightSearchInfo.to}
                                onChange={(option) => {
                                    handleFlightInputChange("to", option);
                                    setToSearch("");
                                    setDebouncedTo("");
                                }}
                                placeholder="Destination"
                                isSearchable
                                filterOption={null}
                                menuPlacement="top"
                                getOptionLabel={(option) => `${option.city} ${option.airportCode} ${option.airportName}`}
                                getOptionValue={(option) => option.airportCode}
                                components={{
                                    Option: CustomOption,
                                    SingleValue: CustomSingleValue,
                                    DropdownIndicator: () => null,
                                    IndicatorSeparator: () => null,
                                    LoadingIndicator: () => null
                                }}
                                classNamePrefix="flight-select"
                                styles={{
                                    control: (base, state) => ({
                                        ...base,
                                        backgroundColor: "transparent",
                                        border: "none",
                                        borderBottom: "1px solid",
                                        borderColor: state.isFocused ? "#3b82f6" : "#9ca3af",
                                        borderRadius: 0,
                                        boxShadow: "none",
                                        padding: "0px",
                                        minHeight: "44px",
                                        color: "#525252",
                                        "&:hover": { borderColor: "#3b82f6" },
                                    }),
                                    valueContainer: (base) => ({
                                        ...base,
                                        padding: "2px 0",
                                        overflow: "hidden",
                                    }),
                                    singleValue: (base, state) => ({
                                        ...base,
                                        position: "relative",
                                        transform: "none",
                                        maxWidth: "100%",
                                        margin: "0",
                                        display: (state.selectProps.inputValue || state.isFocused || state.selectProps.menuIsOpen) ? "none" : "block",
                                    }),
                                    placeholder: (base) => ({
                                        ...base,
                                        fontSize: "1.15rem",
                                        color: "#808080",
                                        margin: "0",
                                    }),
                                    input: (base) => ({
                                        ...base,
                                        margin: "0",
                                        padding: "0",
                                        fontSize: "1.1rem",
                                        color: "#111827",
                                    }),
                                    option: (base, state) => ({
                                        ...base,
                                        backgroundColor: state.isFocused ? "#f3f4f6" : "transparent",
                                        color: "#111827",
                                        cursor: "pointer",
                                        padding: "6px 8px",
                                        borderRadius: "10px",
                                        "&:active": { backgroundColor: "#d1d5db" },
                                    }),
                                    menu: (base) => ({
                                        ...base,
                                        zIndex: 50,
                                        width: "420px",
                                        borderRadius: "14px",
                                        padding: "6px",
                                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                                        border: "1px solid #e5e7eb",
                                        backgroundColor: "#ffffff",
                                    }),
                                    menuList: (base) => ({
                                        ...base,
                                        padding: 0,
                                        maxHeight: "280px",
                                    }),
                                }}
                            />
                        </div>

                        {/* Depart */}
                        <div className="col-span-12 sm:col-span-6 md:col-span-2 mt-4 sm:mt-0 relative" ref={departRef}>
                            <label className="block text-lg text-gray-700 mb-2 flex items-center gap-2">
                                Depart
                            </label>

                            <input
                                type="text"
                                readOnly
                                value={departSelected ? format(departSelected, "dd/MM/yyyy") : ""}
                                placeholder="Select Depart"
                                onClick={() => setDepartOpen(!departOpen)}
                                className="w-full text-base sm:text-[17px] font-bold text-[#333333] border-b focus:outline-none placeholder-[#808080] py-2 px-0 cursor-pointer bg-transparent"
                            />

                            {departOpen && (
                                <div className="absolute scale-[0.90] bottom-15 -left-10 mb-2 bg-white p-4 rounded-2xl shadow-lg z-50">
                                    <DayPicker
                                        mode="single"
                                        selected={departSelected}
                                        onSelect={handleDepartSelect}
                                        disabled={{ before: new Date(), after: flightSearchInfo.return || undefined }}
                                        numberOfMonths={2}
                                        captionLayout="dropdown-buttons"
                                        className="text-gray-800"
                                        classNames={{ months: "flex gap-4" }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Return */}
                        <div className="col-span-12 sm:col-span-6 md:col-span-2 mt-4 sm:mt-0 relative" ref={returnRef}>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-lg text-gray-700 flex items-center gap-2">Return</label>
                                {flightSearchInfo.return && (
                                    <div
                                        className="bg-[#0a223d] rounded-full w-4 h-4 flex justify-center items-center cursor-pointer hover:bg-[#12345a]"
                                        onClick={handleRemoveReturnDate}
                                    >
                                        <X className="h-3 w-3 text-white" />
                                    </div>
                                )}
                            </div>

                            <input
                                type="text"
                                readOnly
                                value={flightSearchInfo.return ? format(flightSearchInfo.return, "dd/MM/yyyy") : ""}
                                placeholder="Select Return"
                                onClick={() => setReturnOpen(!returnOpen)}
                                className="w-full text-base sm:text-[17px] font-bold text-[#333333] border-b focus:outline-none placeholder-[#808080] py-2 px-0 cursor-pointer bg-transparent"
                            />

                            {returnOpen && (
                                <div className="absolute scale-[0.90] bottom-15 -left-10  mb-2 bg-white p-4 rounded-2xl shadow-lg z-50">
                                    <DayPicker
                                        mode="single"
                                        selected={flightSearchInfo.return}
                                        onSelect={handleReturnSelect}
                                        disabled={{ before: departSelected || new Date() }}
                                        numberOfMonths={2}
                                        captionLayout="dropdown-buttons"
                                        className="text-gray-800"
                                        classNames={{ months: "flex gap-4" }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Traveler */}
                        <div
                            ref={travellerBoxRef}
                            className="col-span-12 sm:col-span-6 md:col-span-2 mt-4 sm:mt-0 flex relative"
                        >
                            <img src={Person} alt="traveler" className="w-6 h-6 mr-3" />
                            <div
                                className="flex flex-col cursor-pointer"
                                onClick={() => setShowTravellerBox(prev => !prev)}
                            >
                                <label className="block text-lg text-gray-700 flex items-center gap-2 cursor-pointer">Traveler</label>
                                <input
                                    type="number"
                                    min="1"
                                    readOnly
                                    placeholder="1"
                                    value={totalTravellers || 1}
                                    className="w-16 text-xl border text-[#525252] border-gray-400 rounded-md text-center focus:outline-none cursor-pointer [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none[appearance:textfield]"
                                />
                            </div>

                            {showTravellerBox && (
                                <div
                                    className="absolute bottom-15 right-0 z-50 mt-2 w-[45rem] bg-white rounded-md shadow-lg px-6 py-5 space-y-6 text-black"
                                >
                                    {/* Adults */}
                                    <div className="flex flex-col">
                                        <p className="font-semibold text-gray-800 text-base">
                                            ADULTS (12y+) <br /> <span className="text-sm font-medium">on the day of travel</span>
                                        </p>
                                        <div className="flex justify-between items-center mt-2">
                                            <div className="flex border rounded-md overflow-hidden">
                                                {Array.from({ length: 9 }).map((_, i) => (
                                                    <div
                                                        key={i}
                                                        onClick={() => handleAdultsChange(i + 1)}
                                                        className={`px-3 py-2 text-sm cursor-pointer border-r last:border-r-0 ${(Number(travellers.adults) === i + 1 && travellers.adults !== '>9' && Number(travellers.adults) < 10) ? 'bg-[#78080B] text-white' : 'hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        {i + 1}
                                                    </div>
                                                ))}
                                            </div>
                                            <div
                                                onClick={() => handleAdultsChange('>9')}
                                                className={`px-4 py-2 text-sm cursor-pointer border rounded-md ${(travellers.adults === '>9' || Number(travellers.adults) >= 10) ? 'bg-[#78080B] text-white' : 'hover:bg-gray-100'
                                                    }`}
                                            >
                                                &gt;9
                                            </div>
                                        </div>
                                    </div>

                                    {/* Children & Infants */}
                                    <div className="flex justify-between items-start gap-6">
                                        {/* Children */}
                                        <div className="flex flex-col">
                                            <p className="font-semibold text-gray-800 text-base">
                                                CHILDREN (2y - 12y) <br /> <span className="text-sm font-medium">on the day of travel</span>
                                            </p>
                                            <div className="flex justify-between items-start mt-2">
                                                <div className="flex border rounded-md overflow-hidden">
                                                    {Array.from({ length: 6 }).map((_, i) => (
                                                        <div
                                                            key={i}
                                                            onClick={() => setTravellers((t) => ({ ...t, children: i }))}
                                                            className={`px-3 py-2 text-sm cursor-pointer border-r last:border-r-0 ${(Number(travellers.children) === i && travellers.children !== '>6' && Number(travellers.children) < 7) ? 'bg-[#78080B] text-white' : 'hover:bg-gray-100'
                                                                }`}
                                                        >
                                                            {i}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div
                                                    onClick={() => setTravellers((t) => ({ ...t, children: '>6' }))}
                                                    className={`ml-4 px-4 py-2 text-sm cursor-pointer border rounded-md ${(travellers.children === '>6' || Number(travellers.children) >= 7) ? 'bg-[#78080B] text-white' : 'hover:bg-gray-100'
                                                        }`}
                                                >
                                                    &gt;6
                                                </div>
                                            </div>
                                        </div>

                                        {/* Infants */}
                                        <div className="flex flex-col items-start">
                                            <p className="font-semibold text-gray-800 text-base">
                                                INFANTS (below 2y) <br /> <span className="text-sm font-medium">on the day of travel</span>
                                            </p>
                                            <div className="flex justify-between items-start mt-2">
                                                <div className="mr-4 flex border rounded-md overflow-hidden">
                                                    {Array.from({ length: 6 }).map((_, i) => {
                                                        const isInfantDisabled = i > getAdultCount(travellers.adults);
                                                        const isSelected = Number(travellers.infants) === i && travellers.infants !== '>6' && Number(travellers.infants) < 7;
                                                        return (
                                                            <div
                                                                key={i}
                                                                onClick={() => !isInfantDisabled && handleInfantsChange(i)}
                                                                title={isInfantDisabled ? "Number of infants cannot exceed number of adults" : undefined}
                                                                className={`px-3 py-2 text-sm border-r last:border-r-0 transition-colors ${
                                                                    isSelected
                                                                        ? 'bg-[#78080B] text-white font-medium'
                                                                        : isInfantDisabled
                                                                        ? 'opacity-30 cursor-not-allowed bg-gray-100 text-gray-400 select-none'
                                                                        : 'cursor-pointer hover:bg-gray-100'
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
                                                            className={`px-4 py-2 text-sm border rounded-md transition-colors ${
                                                                isSelected
                                                                    ? 'bg-[#78080B] text-white font-medium'
                                                                    : isMoreThan6Disabled
                                                                    ? 'opacity-30 cursor-not-allowed bg-gray-100 text-gray-400 select-none'
                                                                    : 'cursor-pointer hover:bg-gray-100'
                                                            }`}
                                                        >
                                                            &gt;6
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Done Button */}
                                    <div
                                        onClick={validateTravellers}
                                        className="cursor-pointer col-span-12 sm:col-span-2 flex justify-center bg-[#78080B] rounded-sm p-1"
                                    >
                                        <button className="btn">
                                            <span className="cursor-pointer button-text text-white ">D O N E</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Search Button */}
                        <div className="col-span-12 sm:col-span-1 flex justify-center mt-4 sm:mt-0">
                            <button className="cursor-pointer bg-black hover:bg-gray-800 text-white p-4 rounded-xl transition flex items-center justify-center" onClick={() => { searchFlightSearch() }}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.3-4.3" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="fare-filter-section pt-6 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-center sm:justify-start w-full sm:w-auto">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" name="fareType" value="regular" checked={fareType === 'regular'} onChange={(e) => setFareType(e.target.value)} className="w-4 h-4 cursor-pointer" />
                            <span className="text-gray-700">Regular Fare</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" name="fareType" value="student" checked={fareType === 'student'} onChange={(e) => setFareType(e.target.value)} className="w-4 h-4 cursor-pointer" />
                            <span className="text-gray-700">Student Fare</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" name="fareType" value="senior" checked={fareType === 'senior'} onChange={(e) => setFareType(e.target.value)} className="w-4 h-4 cursor-pointer" />
                            <span className="text-gray-700">Senior Citizen Fare</span>
                        </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-end w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => {
                                if (isLoggedIn) {
                                    window.location.href = '/my-bookings';
                                } else {
                                    setIsSignInModalOpen(true);
                                }
                            }}
                            className="flex items-center space-x-2 text-gray-600 hover:text-black hover:border-black border-b-2 pb-1 border-gray-300 cursor-pointer transition-colors"
                        >
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm font-medium">My Booking</span>
                        </button>
                        <button
                            type="button"
                            className="flex items-center space-x-2 text-gray-600 hover:text-black cursor-pointer"
                        >
                            <CirclePlus className="w-4 h-4" />
                            <span className="text-sm font-medium">Flight Status</span>
                        </button>
                    </div>
                </div>
            </div >

            {isSignInModalOpen && (
                <SignInModal
                    onClose={() => setIsSignInModalOpen(false)}
                    onSuccess={() => {
                        setIsSignInModalOpen(false);
                        window.location.href = '/my-bookings';
                    }}
                />
            )}
        </div >
    );
}

export default BookingForm;
