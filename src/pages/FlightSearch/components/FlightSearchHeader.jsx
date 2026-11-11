import React, { useEffect, useRef, useState } from "react";
import Select, { components } from "react-select";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, parse, isValid } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { fetchAirportsByCode } from "@/services/airportsSearch.js";
import { useNavigate, useSearchParams } from "react-router-dom";

const CoachOptions = [
  { value: 0, label: "Economy" },
  { value: 1, label: "First Class" },
  { value: 2, label: "Business" },
  // { value: 3, label: "Premium Economy" },
];

function FlightSearchHeader() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  console.log(searchParams.get("returnDate"), "---search params---")

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

  const [isEditable, setIsEditable] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [rotation, setRotation] = useState(0);

  const [tripType, setTripType] = useState("");
  const [fareType, setFareType] = useState('regular');

  const [showTravellerBox, setShowTravellerBox] = useState(false);

  const [departSelected, setDepartSelected] = useState(flightSearchInfo.depart);

  const [departOpen, setDepartOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  const [fromSearch, setFromSearch] = useState("");
  const [toSearch, setToSearch] = useState("");

  const [debouncedFrom, setDebouncedFrom] = useState("");
  const [debouncedTo, setDebouncedTo] = useState("");

  const [fareTypeHeight, setFareTypeHeight] = useState(0);

  const fareTypeRef = useRef(null);
  const contentRef = useRef(null);
  const departRef = useRef();
  const returnRef = useRef();

  const travellerBoxRef = useRef(null);

  const handleModifySearch = () => setIsEditable(true);

  const [travellers, setTravellers] = useState({
    adults: 1,
    children: 0,
    infants: 0,
  });

  // ── Hydrate from URL params on mount ──────────────────────────────────────
  useEffect(() => {
    const originCode = searchParams.get("origin");
    const destinationCode = searchParams.get("destination");
    const departDateStr = searchParams.get("departDate"); // MM/DD/YYYY
    const returnDateStr = searchParams.get("returnDate"); // MM/DD/YYYY or ""
    const adults = Number(searchParams.get("adults") || 1);
    const children = Number(searchParams.get("children") || 0);
    const infantsRaw = Number(searchParams.get("infants") || 0);
    const infants = Math.min(infantsRaw, adults);
    const cabinClass = Number(searchParams.get("cabinClass") || 0);
    const bookingType = Number(searchParams.get("bookingType") || 0);

    // If no origin or destination in URL, keep search fields open and empty so user can search directly
    if (!originCode || !destinationCode) {
      setIsEditable(true);
    } else {
      setIsEditable(false);
    }

    // Trip type: bookingType 2 = special round trip, 1 = round trip, 0 = one-way
    setTripType(bookingType === 2 ? "SPECIAL_ROUND_TRIP" : bookingType === 1 ? "ROUND_TRIP" : "ONE_WAY");

    // Fare Type
    const studentFare = searchParams.get("studentFareSearch") === "true";
    const srCitizen = searchParams.get("srCitizenSearch") === "true";
    if (studentFare) setFareType("student");
    else if (srCitizen) setFareType("senior");
    else setFareType("regular");

    // Travellers
    setTravellers({ adults, children, infants });

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

    // Depart date
    const departDate = parseDateHelper(departDateStr) || new Date();
    setDepartSelected(departDate);

    // Return date
    const returnDate = parseDateHelper(returnDateStr);

    setFlightSearchInfo((prev) => ({
      ...prev,
      coach: cabinClass,
      depart: departDate,
      return: returnDate,
      from: null,
      to: null,
    }));

    if (!originCode && !destinationCode) return;

    // Fetch airport objects for origin & destination
    const resolveAirport = async (code) => {
      if (!code) return null;
      try {
        const results = await fetchAirportsByCode(code);
        return results?.[0] ?? null;
      } catch (_) {
        return null;
      }
    };

    Promise.all([
      resolveAirport(originCode),
      resolveAirport(destinationCode),
    ]).then(([fromAirport, toAirport]) => {
      setFlightSearchInfo((prev) => ({
        ...prev,
        from: fromAirport,
        to: toAirport,
      }));
    });
  }, [searchParams]);
  // ─────────────────────────────────────────────────────────────────────────

  const {
    data: fromAirportOptions = [],
    isLoading: fromLoading,
    isError: fromError,
  } = useQuery({
    queryKey: ["airportlistcodes-from", debouncedFrom],
    queryFn: ({ signal }) => fetchAirportsByCode(debouncedFrom, signal),
    enabled: debouncedFrom?.trim().length >= 1,
  });

  const {
    data: toAirportOptions = [],
    isLoading: toLoading,
    isError: toError,
  } = useQuery({
    queryKey: ["airportlistcodes-to", debouncedTo],
    queryFn: ({ signal }) => fetchAirportsByCode(debouncedTo, signal),
    enabled: debouncedTo?.trim().length >= 1,
  });

  const toNumber = (v) => {
    if (typeof v === "string" && v.startsWith(">")) {
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
        newInfants = newAdultNum <= 6 ? newAdultNum : ">6";
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
      alert("Number of infants cannot exceed number of adults.");
      return;
    }

    setTravellers((prev) => ({
      ...prev,
      infants: newInfants,
    }));
  };

  const validateTravellers = () => {
    // Interpret '>9' as 10, '>6' as 7 for validation and totals
    const adultsVal = getAdultCount(travellers.adults);
    const childrenVal = getChildCount(travellers.children);
    const infantsVal = getInfantCount(travellers.infants);

    // 1️⃣ At least one adult
    if (adultsVal < 1) {
      alert("Please select at least one adult.");
      return false;
    }

    // 2️⃣ Infants cannot exceed adults
    if (infantsVal > adultsVal) {
      alert("Number of infants cannot exceed number of adults.");
      setTravellers((prev) => ({
        ...prev,
        infants: adultsVal <= 6 ? adultsVal : ">6",
      }));
      return false;
    }

    // 3️⃣ Optional overall cap (adjust if needed)
    const total = adultsVal + childrenVal + infantsVal;
    if (total > 20) {
      alert("Total passengers cannot exceed 20.");
      return false;
    }

    setShowTravellerBox(false);
    return true;
  };

  const handleFlightInputChange = (field, value) => {
    setFlightSearchInfo((prev) => ({ ...prev, [field]: value }));
    if (field === "return") {
      if (value) {
        setTripType((current) =>
          current === "SPECIAL_ROUND_TRIP" ? "SPECIAL_ROUND_TRIP" : "ROUND_TRIP"
        );
      } else {
        setTripType("ONE_WAY");
      }
    }
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
    setReturnOpen(false);
  };

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
        <div className="flex flex-col text-left leading-tight w-full overflow-hidden">
          <span className="text-[14px] sm:text-[15px] font-semibold text-white truncate">
            {props.data.city}
          </span>
          <span className="text-[11px] text-white/70 font-normal truncate mt-0.5" title={props.data.airportName}>
            {props.data.airportName}
          </span>
        </div>
      </components.SingleValue>
    );
  };

  const handleSwap = () => {
    setRotation((prevRotation) => prevRotation + 180);
    setIsSwapping((prev) => !prev);

    setFlightSearchInfo((prev) => ({
      ...prev,
      from: prev.to,
      to: prev.from,
    }));
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

    const adultsVal = getAdultCount(travellers.adults);
    const infantsVal = getInfantCount(travellers.infants);
    if (infantsVal > adultsVal) {
      alert("Number of infants cannot exceed number of adults.");
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

    setIsEditable(false);
    navigate(`/flight-results?${params.toString()}`);
  };

  const handleSearchButtonClick = () => {
    if (!isEditable) {
      handleModifySearch();
    } else {
      searchFlightSearch();
    }
  };

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

  useEffect(() => {
    function handleDocClick(e) {
      if (
        travellerBoxRef.current &&
        !travellerBoxRef.current.contains(e.target)
      ) {
        setShowTravellerBox(false);
      }
    }
    function handleEsc(e) {
      if (e.key === "Escape") setShowTravellerBox(false);
    }
    document.addEventListener("mousedown", handleDocClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleDocClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  useEffect(() => {
    if (isEditable && contentRef.current) {
      setFareTypeHeight(contentRef.current.scrollHeight);
    } else {
      setFareTypeHeight(0);
    }
  }, [isEditable, fareType]);

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
    const toNumber = (v) => {
      if (typeof v === "string" && v.startsWith(">")) {
        return parseInt(v.slice(1), 10) + 1;
      }
      return Number(v);
    };

    const total =
      toNumber(travellers.adults) +
      toNumber(travellers.children) +
      toNumber(travellers.infants);

    setFlightSearchInfo((prev) => ({
      ...prev,
      traveller: total,
    }));
  }, [travellers]);

  return (
    <div
      className="relative bg-[#78080B] text-white px-2 sm:px-4 py-3 sm:py-5 z-999 mb-4"
      style={{ boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.25)" }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between sm:px-6 py-5">
        {/* Main Search Grid */}
        <div className="w-full grid grid-cols-15 gap-3 items-end font-semibold">
          {/* Trip Type */}
          <div className="col-span-1 col-span-2">
            <label className="block text-xs text-white/80 font-medium mb-1">
              Trip Type
            </label>
            <select
              value={tripType}
              onChange={(e) => {
                const newType = e.target.value;
                setTripType(newType);
                if (newType === "ONE_WAY") {
                  handleFlightInputChange("return", null);
                }
              }}
              className="w-full py-1.5 px-0 bg-transparent font-semibold text-sm sm:text-[15px] border-b border-white text-white placeholder-white focus:outline-none"
              disabled={!isEditable}
            >
              <option value="ONE_WAY" className="text-black font-medium">
                One Way
              </option>
              <option value="ROUND_TRIP" className="text-black font-medium">
                Round Trip
              </option>
              <option value="SPECIAL_ROUND_TRIP" className="text-black font-medium">
                Special Round Trip
              </option>
              {/* <option value="multiCity" className='text-black font-medium'>Multi City</option> */}
            </select>
          </div>

          {tripType === "multiCity" ? (
            <div className="col-span-11 flex flex-col items-start">
              <label className="block text-xs text-white/80 font-medium mb-1">
                From (Multi City)
              </label>
              <input
                type="text"
                placeholder="Enter multiple destinations"
                value={flightSearchInfo.from}
                onChange={(e) =>
                  handleFlightInputChange("from", e.target.value)
                }
                className="w-full bg-transparent font-semibold text-sm sm:text-[15px] border-b border-white text-white placeholder-white focus:outline-none py-1.5"
              />
            </div>
          ) : (
            <>
              {/* From */}
              <div className="col-span-2">
                <label className="block text-xs text-white/80 font-medium mb-1">
                  From
                </label>
                <Select
                  options={debouncedFrom?.trim().length >= 1 ? fromAirportOptions : []}
                  isLoading={fromLoading}
                  loadingMessage={() => (
                    <div className="flex justify-center py-3">
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  noOptionsMessage={() =>
                    !debouncedFrom?.trim() ? null : "No airports found"
                  }
                  onInputChange={(value, { action }) => {
                    if (action === "input-change") {
                      setFromSearch(value);
                    } else if (action === "menu-close" || action === "set-value") {
                      setFromSearch("");
                      setDebouncedFrom("");
                    }
                  }}
                  onMenuOpen={() => {
                    setFromSearch("");
                    setDebouncedFrom("");
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
                  isDisabled={!isEditable}
                  isClearable={false}
                  isSearchable
                  filterOption={null}
                  menuPlacement="bottom"
                  getOptionLabel={(option) =>
                    `${option.city} ${option.airportCode} ${option.airportName}`
                  }
                  getOptionValue={(option) => option.airportCode}
                  components={{
                    Option: CustomOption,
                    SingleValue: CustomSingleValue,
                    DropdownIndicator: () => null,
                    IndicatorSeparator: () => null,
                    LoadingIndicator: () => null,
                    ClearIndicator: () => null,
                  }}
                  classNamePrefix="flight-select"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      backgroundColor: "transparent",
                      border: "none",
                      borderBottom: "1px solid",
                      borderColor: state.isFocused ? "#3b82f6" : "#ffffff",
                      borderRadius: 0,
                      boxShadow: "none",
                      padding: "0px",
                      minHeight: "44px",
                      cursor: "pointer",
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      color: "white",
                      "&:hover": { borderColor: "#ffffff" },
                    }),
                    valueContainer: (base) => ({
                      ...base,
                      padding: "2px 0",
                      color: "white",
                      overflow: "hidden",
                    }),
                    input: (base) => ({
                      ...base,
                      margin: 0,
                      padding: 0,
                      color: "white",
                    }),
                    singleValue: (base, state) => ({
                      ...base,
                      position: "relative",
                      transform: "none",
                      maxWidth: "100%",
                      margin: 0,
                      color: "white",
                      display: (state.selectProps.inputValue || state.isFocused || state.selectProps.menuIsOpen) ? "none" : "block",
                    }),
                    placeholder: (base) => ({
                      ...base,
                      margin: 0,
                      color: "rgba(255,255,255,0.8)",
                      fontSize: "0.95rem",
                      fontWeight: 600,
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

              {/* Swap - Hidden on mobile */}
              <div className="flex col-span-1 justify-center my-2 sm:my-0">
                <button
                  type="button"
                  onClick={handleSwap}
                  disabled={!isEditable}
                  aria-label="Swap origin and destination"
                  className={`${isEditable ? "!cursor-pointer" : "!cursor-default"} p-2 rounded-full transition-transform duration-300`}
                >
                  <div
                    className="relative w-6 h-6 transition-transform duration-500"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                    <svg
                      className="absolute top-0 left-0 w-4 h-4 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      style={{ transform: "translate(4px,-4px) rotate(90deg)" }}
                    >
                      <path d="M22 16.21v-1.895L14 8V4a2 2 0 0 0-4 0v4.105L2 14.42v1.789l8-2.526V18l-2 3h6l-2-3v-4.316L22 16.21z" />
                    </svg>
                    <svg
                      className="absolute top-0 left-0 w-4 h-4 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      style={{
                        transform: "translate(4px,10px) rotate(-90deg)",
                      }}
                    >
                      <path d="M22 16.21v-1.895L14 8V4a2 2 0 0 0-4 0v4.105L2 14.42v1.789l8-2.526V18l-2 3h6l-2-3v-4.316L22 16.21z" />
                    </svg>
                  </div>
                </button>
              </div>

              {/* To */}
              <div className="col-span-2">
                <label className="block text-xs text-white/80 font-medium mb-1">
                  To
                </label>
                <Select
                  options={debouncedTo?.trim().length >= 1 ? toAirportOptions : []}
                  onInputChange={(value, { action }) => {
                    if (action === "input-change") {
                      setToSearch(value);
                    } else if (action === "menu-close" || action === "set-value") {
                      setToSearch("");
                      setDebouncedTo("");
                    }
                  }}
                  onMenuOpen={() => {
                    setToSearch("");
                    setDebouncedTo("");
                  }}
                  onMenuClose={() => {
                    setToSearch("");
                    setDebouncedTo("");
                  }}
                  isLoading={toLoading}
                  loadingMessage={() => (
                    <div className="flex justify-center py-3">
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  noOptionsMessage={() =>
                    !debouncedTo?.trim() ? null : "No airports found"
                  }
                  value={flightSearchInfo.to}
                  onChange={(option) => {
                    handleFlightInputChange("to", option);
                    setToSearch("");
                    setDebouncedTo("");
                  }}
                  isDisabled={!isEditable}
                  isClearable={false}
                  placeholder="Destination"
                  isSearchable
                  filterOption={null}
                  menuPlacement="bottom"
                  getOptionLabel={(option) =>
                    `${option.city} ${option.airportCode} ${option.airportName}`
                  }
                  getOptionValue={(option) => option.airportCode}
                  components={{
                    Option: CustomOption,
                    SingleValue: CustomSingleValue,
                    DropdownIndicator: () => null,
                    IndicatorSeparator: () => null,
                    LoadingIndicator: () => null,
                    ClearIndicator: () => null,
                  }}
                  classNamePrefix="flight-select"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      backgroundColor: "transparent",
                      border: "none",
                      borderBottom: "1px solid",
                      borderColor: state.isFocused ? "#3b82f6" : "#ffffff",
                      borderRadius: 0,
                      boxShadow: "none",
                      padding: "0px",
                      minHeight: "44px",
                      cursor: "pointer",
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      color: "white",
                      "&:hover": { borderColor: "#ffffff" },
                    }),
                    valueContainer: (base) => ({
                      ...base,
                      padding: "2px 0",
                      color: "white",
                      overflow: "hidden",
                    }),
                    input: (base) => ({
                      ...base,
                      margin: 0,
                      padding: 0,
                      color: "white",
                    }),
                    singleValue: (base, state) => ({
                      ...base,
                      position: "relative",
                      transform: "none",
                      maxWidth: "100%",
                      margin: 0,
                      color: "white",
                      display: (state.selectProps.inputValue || state.isFocused || state.selectProps.menuIsOpen) ? "none" : "block",
                    }),
                    placeholder: (base) => ({
                      ...base,
                      margin: 0,
                      color: "rgba(255,255,255,0.8)",
                      fontSize: "0.95rem",
                      fontWeight: 600,
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

              {/* Depart */}
              <div className="col-span-2 relative" ref={departRef}>
                <label className="block text-xs text-white/80 font-medium mb-1 flex items-center gap-2">
                  Depart
                </label>

                <input
                  type="text"
                  readOnly
                  value={departSelected ? format(departSelected, "dd/MM/yyyy") : ""}
                  placeholder="Select Depart"
                  onClick={() => {
                    if (!isEditable) return;
                    setDepartOpen((prev) => !prev);
                  }}
                  className={`w-full text-sm sm:text-[15px] font-semibold text-white border-b border-white focus:outline-none placeholder-white py-1.5 px-0 ${isEditable ? "cursor-pointer" : "cursor-default"}`}
                  disabled={!isEditable}
                />

                {departOpen && (
                  <div className="absolute top-full mb-2 bg-white p-4 rounded-2xl shadow-lg z-50">
                    <DayPicker
                      mode="single"
                      selected={departSelected}
                      onSelect={handleDepartSelect}
                      disabled={{
                        before: new Date(),
                        after: flightSearchInfo.return || undefined,
                      }}
                      numberOfMonths={2}
                      captionLayout="dropdown-buttons"
                      className="text-gray-800"
                      classNames={{ months: "flex gap-4" }}
                      menu
                    />
                  </div>
                )}
              </div>

              {/* Return — always visible; × clears value only */}
              <div className="col-span-2 relative" ref={returnRef}>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs text-white/80 font-medium flex items-center gap-2">
                    Return
                  </label>
                  {flightSearchInfo.return && (
                    <div
                      className="bg-[#0a223d] rounded-full w-4 h-4 flex justify-center items-center cursor-pointer hover:bg-[#12345a]"
                      onClick={() => {
                        if (!isEditable) return;
                        handleFlightInputChange("return", null);
                      }}
                    >
                      <X className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  readOnly
                  value={
                    flightSearchInfo.return
                      ? format(flightSearchInfo.return, "dd/MM/yyyy")
                      : ""
                  }
                  placeholder="Select Return"
                  onClick={() => {
                    if (!isEditable) return;
                    setReturnOpen((prev) => !prev);
                  }}
                  className={`w-full text-sm sm:text-[15px] font-semibold text-white border-b border-white focus:outline-none placeholder-white py-1.5 px-0 ${isEditable ? "cursor-pointer" : "cursor-default"}`}
                  disabled={!isEditable}
                />

                {returnOpen && (
                  <div className="absolute top-full -left-15 mb-2 bg-white p-4 rounded-2xl shadow-lg z-50">
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
              <div className="col-span-2 relative">
                <label className="block text-xs text-white/80 font-medium mb-1">
                  Travelers & Class
                </label>
                <div
                  onClick={() => {
                    if (!isEditable) return;
                    setShowTravellerBox((prev) => !prev);
                  }}
                  className={`border-b border-white text-white font-semibold text-sm sm:text-[15px] flex justify-between items-center py-1.5 ${isEditable ? "cursor-pointer" : ""}`}
                >
                  <span className="truncate whitespace-nowrap overflow-hidden text-ellipsis">
                    {(() => {
                      const totalTravellers = [
                        travellers.adults,
                        travellers.children,
                        travellers.infants,
                      ].reduce((acc, v) => acc + toNumber(v), 0);
                      const coachLabel =
                        CoachOptions.find(
                          (o) => o.value === flightSearchInfo.coach,
                        )?.label ?? "Economy";
                      return `${totalTravellers} Traveller${totalTravellers > 1 ? "s" : ""} • ${coachLabel}`;
                    })()}
                  </span>
                </div>

                {isEditable && showTravellerBox && (
                  <div
                    className="absolute left-0 right-0 lg:right-0 lg:left-auto z-999 mt-2 w-full lg:w-[45rem] bg-white rounded-md shadow-lg px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-6 text-black overflow-hidden transition-all duration-500"
                    // style={{ height: isEditable && showTravellerBox ? `${travellerBoxRef.current?.scrollHeight}px` : '0px' }}
                    style={{ height: showTravellerBox ? "auto" : "0px" }}
                    ref={travellerBoxRef}
                  >
                    {/* Adults Section */}
                    <div className="flex flex-col">
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">
                        ADULTS (12y+) <br />{" "}
                        <span className="text-xs sm:text-sm font-medium">
                          {" "}
                          on the day of travel{" "}
                        </span>
                      </p>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-2 gap-2">
                        <div className="flex border rounded-md overflow-hidden flex-wrap">
                          {Array.from({ length: 9 }).map((_, i) => (
                            <div
                              key={i}
                              onClick={() => handleAdultsChange(i + 1)}
                              className={`px-2 sm:px-3 py-2 text-xs sm:text-sm cursor-pointer border-r last:border-r-0
                                                        ${(Number(travellers.adults) === i + 1 && travellers.adults !== ">9" && Number(travellers.adults) < 10) ? "bg-[#78080B] text-white" : "hover:bg-gray-100"}`}
                            >
                              {i + 1}
                            </div>
                          ))}
                        </div>
                        <div
                          onClick={() => handleAdultsChange(">9")}
                          className={`px-3 sm:px-4 py-2 text-xs sm:text-sm cursor-pointer border rounded-md
                                                ${(travellers.adults === ">9" || Number(travellers.adults) >= 10) ? "bg-[#78080B] text-white" : "hover:bg-gray-100"}`}
                        >
                          &gt;9
                        </div>
                      </div>
                    </div>

                    {/* Children & Infants */}
                    <div className="flex flex-col">
                      <div className="flex flex-col lg:flex-row justify-between items-start gap-4 lg:gap-6">
                        {/* Children */}
                        <div className="flex flex-col w-full lg:w-auto">
                          <p className="font-semibold text-gray-800 text-sm sm:text-base">
                            CHILDREN (2y - 12y) <br />{" "}
                            <span className="text-xs sm:text-sm font-medium">
                              on the day of travel
                            </span>
                          </p>
                          <div className="flex justify-between items-start mt-2 gap-2">
                            <div className="flex border rounded-md overflow-hidden flex-wrap">
                              {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                  key={i}
                                  onClick={() =>
                                    setTravellers((t) => ({
                                      ...t,
                                      children: i,
                                    }))
                                  }
                                  className={`px-2 sm:px-3 py-2 text-xs sm:text-sm cursor-pointer border-r last:border-r-0
                                                                ${(Number(travellers.children) === i && travellers.children !== ">6" && Number(travellers.children) < 7) ? "bg-[#78080B] text-white" : "hover:bg-gray-100"}`}
                                >
                                  {i}
                                </div>
                              ))}
                            </div>
                            <div
                              onClick={() =>
                                setTravellers((t) => ({ ...t, children: ">6" }))
                              }
                              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm cursor-pointer border rounded-md 
                                                        ${(travellers.children === ">6" || Number(travellers.children) >= 7) ? "bg-[#78080B] text-white" : "hover:bg-gray-100"}`}
                            >
                              &gt;6
                            </div>
                          </div>
                        </div>

                        {/* Infants */}
                        <div className="flex flex-col items-start w-full lg:w-auto">
                          <p className="font-semibold text-gray-800 text-sm sm:text-base">
                            INFANTS (below 2y) <br />{" "}
                            <span className="text-xs sm:text-sm font-medium">
                              {" "}
                              on the day of travel{" "}
                            </span>
                          </p>
                          <div className="flex justify-between items-start mt-2 gap-2">
                            <div className="flex border rounded-md overflow-hidden flex-wrap">
                              {Array.from({ length: 6 }).map((_, i) => {
                                const isInfantDisabled = i > getAdultCount(travellers.adults);
                                const isSelected = Number(travellers.infants) === i && travellers.infants !== ">6" && Number(travellers.infants) < 7;
                                return (
                                  <div
                                    key={i}
                                    onClick={() => !isInfantDisabled && handleInfantsChange(i)}
                                    title={isInfantDisabled ? "Number of infants cannot exceed number of adults" : undefined}
                                    className={`px-2 sm:px-3 py-2 text-xs sm:text-sm border-r last:border-r-0 transition-colors
                                      ${isSelected
                                        ? "bg-[#78080B] text-white font-medium"
                                        : isInfantDisabled
                                        ? "opacity-30 cursor-not-allowed bg-gray-100 text-gray-400 select-none"
                                        : "cursor-pointer hover:bg-gray-100 text-gray-800"}`}
                                  >
                                    {i}
                                  </div>
                                );
                              })}
                            </div>
                            {(() => {
                              const isMoreThan6Disabled = getAdultCount(travellers.adults) < 7;
                              const isSelected = travellers.infants === ">6" || Number(travellers.infants) >= 7;
                              return (
                                <div
                                  onClick={() => !isMoreThan6Disabled && handleInfantsChange(">6")}
                                  title={isMoreThan6Disabled ? "Number of infants cannot exceed number of adults" : undefined}
                                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm border rounded-md transition-colors
                                    ${isSelected
                                      ? "bg-[#78080B] text-white font-medium"
                                      : isMoreThan6Disabled
                                      ? "opacity-30 cursor-not-allowed bg-gray-100 text-gray-400 select-none"
                                      : "cursor-pointer hover:bg-gray-100 text-gray-800"}`}
                                >
                                  &gt;6
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Class Selector */}
                    <div>
                      <p className="font-semibold text-gray-800 mb-3 uppercase tracking-wide text-sm sm:text-base">
                        Choose Travel Class
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {CoachOptions.map((cls) => (
                          <button
                            key={cls}
                            onClick={() =>
                              handleFlightInputChange("coach", cls.value)
                            }
                            className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium border transition-colors ${flightSearchInfo.coach === cls.value ? "bg-[#78080B] text-white" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
                          >
                            {cls.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Done Button */}
                    <div
                      onClick={validateTravellers}
                      className="cursor-pointer flex justify-center bg-[#78080B] rounded-sm p-1"
                    >
                      <button className="btn">
                        <span className="cursor-pointer button-text text-white  text-sm sm:text-base">
                          D O N E
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Search Button */}
          <div className="col-span-2 flex justify-center relative">
            <a
              href="#"
              id="ModifySearchButton"
              onClick={handleSearchButtonClick}
              className="text-xs sm:text-sm"
            >
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              {isEditable ? "SEARCH" : "MODIFY SEARCH"}
            </a>
          </div>
        </div>
      </div>

      {/* Fare Type */}
      <div
        className="filter-section max-w-7xl mx-auto mt-4 font-medium overflow-hidden transition-all duration-500 sm:px-6 px-5"
        style={{ height: isEditable ? `${fareTypeHeight}px` : "0px" }}
        ref={fareTypeRef}
      >
        <div ref={contentRef}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start space-y-3 sm:space-y-0 sm:space-x-6">
            <span className="text-xs sm:text-sm">Fare Type</span>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6 rounded-xl filterglasseffect px-3 sm:px-4 w-full sm:w-auto">
              {[
                { value: "regular", label: "Regular" },
                { value: "student", label: "Student" },
                { value: "senior", label: "Senior Citizen" },
              ].map(({ value, label }, i) => (
                <div
                  key={value}
                  className={`${i !== 0 ? "sm:border-l border-white" : ""}`}
                >
                  <label className="flex py-2 sm:ml-2 items-center space-x-1 cursor-pointer text-xs sm:text-sm">
                    <input
                      type="radio"
                      name="fareType"
                      value={value}
                      checked={fareType === value}
                      onChange={() => setFareType(value)}
                      className="mr-2 text-red-600 focus:ring-0 cursor-pointer"
                      disabled={!isEditable}
                    />
                    <span>{label}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlightSearchHeader;
