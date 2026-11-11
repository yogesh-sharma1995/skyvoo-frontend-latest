import api from "@/services/api.js";
import React, { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import TripBenefitsModal from "@/components/modals/TripBenefitsModal";
import TicketDetailsReviewModal from "@/components/modals/TicketDetailsReviewModal";
import ViewAllCouponsModal from "@/components/modals/ViewAllCouponsModal";
import BaggageModal from "@/components/modals/BaggageModal";
import MealModal from "@/components/modals/MealModal";
import ErrorModal from "@/components/modals/ErrorModal";
import SignInModal from "@/components/modals/SignInModal";
import ImportantDisclaimerModal from "@/components/modals/ImportantDisclaimerModal";
import FareAlertModal from "@/components/modals/FareAlertModal";
import AirlineLogo from "@/assets/imgs/airlinelogo.webp";
import { Trash2, User, Luggage, Utensils, CirclePlus, ShieldAlert, ChevronRight, ChevronDown, Plus, CheckCircle2, XCircle, Plane, Loader2, Building2, Mail } from "lucide-react";
import Select from "react-select";
import { DatePicker } from "antd";
import CustomDatePicker from "@/components/common/CustomDatePicker";
import dayjs from "dayjs";
import { useNavigate, useSearchParams } from "react-router-dom";
import { nationalityOptions } from "@/data/ExtraData.js";
import { bookingStore } from "@/store/bookingStore";
import ReviewDetailsSkeleton from "@/components/layout/ReviewDetailsSkeleton";
import { useAuth } from "@/contexts/AuthContext";
const Modal = lazy(() => import("@/components/modals/Modal"));
const FlightSeatMap = lazy(() => import("./FlightSeatMap/Index"));
import { getAirlineLogo } from "@/utils/airlineCode";
import { formatStopsWithLayovers, getFlightLayoverAirports } from "@/utils/flightStops";

const formatDepartureDate = (dateStr) => {
  if (!dateStr) return "—";
  const parsed = dayjs(dateStr);
  return parsed.isValid() ? parsed.format("DD-MM-YYYY") : dateStr;
};

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

const getTravellerNameError = (rawName, fieldLabel = "Name") => {
  if (!rawName || !rawName.trim()) {
    return `${fieldLabel} is required`;
  }
  return null;
};

const getTravelType = async (bookingData) => {
  try {
    const directCountryCodeArr = ["IND", "IN"];

    // 1. Direct check of URL search params if present
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const urlTravelType = sp.get("travelType");
      if (urlTravelType !== null && urlTravelType !== undefined) {
        return Number(urlTravelType) === 1 ? 1 : 0;
      }
    }

    // 2. Direct check of explicit bookingData.travelType (0 = Domestic, 1 = International)
    if (bookingData?.travelType !== undefined && bookingData?.travelType !== null) {
      return Number(bookingData.travelType) === 1 ? 1 : 0;
    }

    // 3. Collect all legs from all flights (outbound, return, special round trip combo)
    const allFlights = [bookingData?.flight, bookingData?.outboundFlight, bookingData?.returnFlight].filter(Boolean);
    const allLegs = [];
    allFlights.forEach((fl) => {
      const legs = fl?.FlightDetailResponses || fl?.flightDetailResponses || [];
      if (Array.isArray(legs) && legs.length > 0) {
        allLegs.push(...legs);
      }
      if (Array.isArray(fl?.FlightSegments)) {
        fl.FlightSegments.flat(2).forEach((seg) => {
          if (seg) allLegs.push(seg);
        });
      }
    });

    // Check direct country codes on every leg
    let hasKnownCountryCodes = false;
    for (const leg of allLegs) {
      const originCountry = leg?.AirlineDeparture?.countryCode || leg?.AirlineDeparture?.CountryCode;
      const destCountry = leg?.AirlineArrival?.countryCode || leg?.AirlineArrival?.CountryCode;

      if (originCountry) {
        hasKnownCountryCodes = true;
        if (!directCountryCodeArr.includes(String(originCountry).toUpperCase())) {
          return 1; // International!
        }
      }
      if (destCountry) {
        hasKnownCountryCodes = true;
        if (!directCountryCodeArr.includes(String(destCountry).toUpperCase())) {
          return 1; // International!
        }
      }
    }

    if (hasKnownCountryCodes && allLegs.length > 0) {
      // All known country codes were India
      return 0;
    }

    // Extract all airport codes across all legs and flights
    const airportCodes = new Set();
    allLegs.forEach((leg) => {
      const dep = leg?.AirlineDeparture?.code || leg?.DepartureAirportCode || leg?.Origin;
      const arr = leg?.AirlineArrival?.code || leg?.ArrivalAirportCode || leg?.Destination;
      if (dep) airportCodes.add(String(dep).trim().toUpperCase());
      if (arr) airportCodes.add(String(arr).trim().toUpperCase());
    });

    const flight = bookingData?.isRoundTrip ? (bookingData?.outboundFlight || bookingData?.flight) : bookingData?.flight;
    if (flight?.DepartureAirportCode) airportCodes.add(String(flight.DepartureAirportCode).trim().toUpperCase());
    if (flight?.ArrivalAirportCode) airportCodes.add(String(flight.ArrivalAirportCode).trim().toUpperCase());
    if (flight?.Origin) airportCodes.add(String(flight.Origin).trim().toUpperCase());
    if (flight?.Destination) airportCodes.add(String(flight.Destination).trim().toUpperCase());
    if (bookingData?.origin) airportCodes.add(String(bookingData.origin).trim().toUpperCase());
    if (bookingData?.destination) airportCodes.add(String(bookingData.destination).trim().toUpperCase());

    const codeList = Array.from(airportCodes).filter(Boolean);
    if (codeList.length > 0) {
      const results = await Promise.all(
        codeList.map((code) =>
          api.post(`/Flight/ListAirportsByCode?airportCode=${code}`, {}).catch(() => null)
        )
      );

      for (const res of results) {
        const countryCode = res?.data?.Data?.[0]?.CountryCode;
        if (countryCode && !directCountryCodeArr.includes(String(countryCode).toUpperCase())) {
          return 1; // International!
        }
      }
      // If we got responses for all and they are all India, return 0
      if (results.some((r) => r?.data?.Data?.[0]?.CountryCode)) {
        return 0;
      }
    }
  } catch (err) {
    console.error("Failed to determine travel type dynamically:", err);
  }
  return 0;
};

const parseSegDateTime = (dtStr) => {
  if (!dtStr) return null;
  const [datePart, timePart] = dtStr.split(" ");
  if (!datePart || !timePart) return null;

  const timeSplit = timePart.split(":");
  const hours = parseInt(timeSplit[0], 10);
  const minutes = parseInt(timeSplit[1], 10);

  const dateSplit = datePart.includes("-") ? datePart.split("-") : datePart.split("/");
  if (dateSplit.length < 3) return null;

  let day, month, year;
  if (dateSplit[0].length === 4) {
    year = parseInt(dateSplit[0], 10);
    month = parseInt(dateSplit[1], 10) - 1;
    day = parseInt(dateSplit[2], 10);
  } else {
    day = parseInt(dateSplit[0], 10);
    month = parseInt(dateSplit[1], 10) - 1;
    year = parseInt(dateSplit[2], 10);
  }

  return new Date(year, month, day, hours, minutes);
};

export default function ReviewDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, user, isB2B: authIsB2B } = useAuth();
  const rawUserType = (user?.UserType || user?.userType || user?.Role || user?.role || "").toLowerCase();
  const isB2C = rawUserType === "b2c";
  const isB2B = (authIsB2B || rawUserType === "b2b") && !isB2C;

  const [useGst, setUseGst] = useState(false);
  const [gstDetails, setGstDetails] = useState({
    gstNumber: "",
    email: "",
    registeredName: "",
    mobile: "",
    address: "",
  });

  const [contactDetails, setContactDetails] = useState({
    mobile: "",
    email: "",
  });

  // useEffect(() => {
  //   if (user) {
  //     setContactDetails((prev) => ({
  //       mobile: prev.mobile || user.Mobile || user.mobile || "",
  //       email: prev.email || user.Email || user.email || "",
  //     }));
  //   }
  // }, [user]);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [isFareModalOpen, setIsFareModalOpen] = useState(false);
  const [isFlightSeatMap, setIsFlightSeatMap] = useState(false);
  const [targetSeatSegmentIndex, setTargetSeatSegmentIndex] = useState(0);
  const [selectedSeatCost, setSelectedSeatCost] = useState(0);
  const [selectedSeatData, setSelectedSeatData] = useState(null); // { seats: Set, services: [] }
  const [selectedSeatDetails, setSelectedSeatDetails] = useState([]); // ordered array of seat objects
  const [isSeatSectionOpen, setIsSeatSectionOpen] = useState(true);

  const [isTripBenefitsModal, setIsTripBenefitsModal] = useState(false);
  const [isTicketDetailsReviewModal, setIsTicketDetailsReviewModal] =
    useState(false);
  const [isViewAllCouponsModal, setIsViewAllCouponsModal] = useState(false);
  const [isBaggageModal, setIsBaggageModal] = useState(false);
  const [baggageTarget, setBaggageTarget] = useState(null);
  const [isMealModal, setIsMealModal] = useState(false);
  const [mealTarget, setMealTarget] = useState(null);
  const [isInternational, setIsInternational] = useState(() => Number(bookingStore.get()?.travelType) === 1);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [isDisclaimerModalOpen, setIsDisclaimerModalOpen] = useState(false);
  const [isFareAlertModalOpen, setIsFareAlertModalOpen] = useState(false);
  const [hasUserAcceptedFareAlert, setHasUserAcceptedFareAlert] = useState(false);
  const hasShownInitialFareAlertRef = React.useRef(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  const currentBooking = bookingStore.get();
  const currentFlightKey = currentBooking.isRoundTrip
    ? `${currentBooking.outboundFareReviewKey || currentBooking.outboundFlight?.FareReviewKey || ""}_${currentBooking.returnFareReviewKey || currentBooking.returnFlight?.FareReviewKey || ""}`
    : (currentBooking.fareReviewKey || currentBooking.selectedFare?.FareReviewKey || currentBooking.flight?.FareReviewKey || currentBooking.flightId || "");

  const {
    data: fareReviewData,
    isLoading: loadingFareReview,
    isFetching: fetchingFareReview,
    error: fareReviewError,
  } = useQuery({
    queryKey: ["fareReview", currentFlightKey],
    staleTime: 0,
    gcTime: 0,
    queryFn: async () => {
      const bookingData = bookingStore.get();
      let reviewKeyList = [];
      let oldPrice = 0;


      if (bookingData.isRoundTrip) {
        const outKey =
          bookingData.outboundFareReviewKey ||
          bookingData.outboundFlight?.FareReviewKey;

        const retKey =
          bookingData.returnFareReviewKey ||
          bookingData.returnFlight?.FareReviewKey;

        if (outKey) reviewKeyList.push(outKey);
        if (retKey) reviewKeyList.push(retKey);

        // OldPrice = sum of both flights' AirlineMinPrice
        oldPrice =
          (Number(bookingData.outboundFlight?.AirlineMinPrice) ||
            Number(bookingData.outboundFlight?.AirlineMinNetPrice) ||
            0) +
          (Number(bookingData.returnFlight?.AirlineMinPrice) ||
            Number(bookingData.returnFlight?.AirlineMinNetPrice) ||
            0);
      } else {
        const key =
          bookingData.fareReviewKey ||
          bookingData.selectedFare?.FareReviewKey ||
          bookingData.flight?.FareReviewKey;

        if (key) reviewKeyList.push(key);

        oldPrice =
          Number(bookingData.flight?.AirlineMinPrice) ||
          Number(bookingData.selectedFare?.PriceList?.TotalFare) ||
          Number(bookingData.flight?.AirlineMinNetPrice) ||
          0;
      }

      const adults = Number(bookingData.travellers?.adults ?? searchParams.get("adults") ?? 1);
      const children = Number(bookingData.travellers?.children ?? searchParams.get("children") ?? 0);
      const infants = Number(bookingData.travellers?.infants ?? searchParams.get("infants") ?? 0);

      // TravelType determination
      const travelType = await getTravelType(bookingData);
      bookingStore.set({
        travelType,
        // Clear any stale seat and GST selections from a previous booking session
        selectedSeatDetails: [],
        selectedSeats: [],
        selectedServices: [],
        seatTotal: 0,
        gstInfo: null,
      });
      setIsInternational(travelType === 1);

      const payload = {
        TravelType: travelType,
        ReviewKeyList: reviewKeyList,
        OldPrice: oldPrice,
        PaxInfo: {
          ADULT: adults,
          CHILD: children,
          INFANT: infants,
        },
      };

      let res;
      try {
        res = await api.post("/flight/FareReview", payload);
      } catch (axiosErr) {
        // Extract the API's own ErrorMessage from the error response body
        const apiMsg =
          axiosErr?.response?.data?.ErrorMessage ||
          axiosErr?.response?.data?.errorMessage ||
          axiosErr?.response?.data?.message ||
          axiosErr?.response?.data?.Message ||
          axiosErr?.message ||
          "Failed to load fare details.";
        throw new Error(apiMsg);
      }

      if (!res.data?.IsSuccess) {
        throw new Error(
          res.data?.ErrorMessage ||
          res.data?.errorMessage ||
          res.data?.message ||
          res.data?.Message ||
          "Failed to load fare details.",
        );
      }

      return res.data.Data;
    },
  });

  const isMultipleFlights = fareReviewData?.TripInfo?.[0]?.FlightDetailResponses?.length > 1;

  const isSeatAllowed = Boolean(
    fareReviewData?.Conditions?.isa === true ||
    fareReviewData?.conditions?.isa === true ||
    fareReviewData?.Conditions?.Isa === true ||
    fareReviewData?.Data?.Conditions?.isa === true ||
    fareReviewData?.Data?.Conditions?.Isa === true
  );

  const gstConditions =
    fareReviewData?.Conditions?.gst ||
    fareReviewData?.conditions?.gst ||
    fareReviewData?.Data?.Conditions?.gst ||
    fareReviewData?.TripInfo?.[0]?.Conditions?.gst;

  const isGstApplicable = Boolean(gstConditions?.gstappl);
  const isGstMandatory = Boolean(gstConditions?.igm);

  const pcsConditions =
    fareReviewData?.Conditions?.pcs ??
    fareReviewData?.conditions?.pcs ??
    fareReviewData?.Data?.Conditions?.pcs ??
    fareReviewData?.TripInfo?.[0]?.Conditions?.pcs ??
    null;

  const hasPcs = Boolean(pcsConditions && typeof pcsConditions === "object");

  const dobConditions =
    fareReviewData?.Conditions?.dob ||
    fareReviewData?.conditions?.dob ||
    fareReviewData?.Data?.Conditions?.dob ||
    fareReviewData?.TripInfo?.[0]?.Conditions?.dob;

  // Conditions.dob / pcs.dobe flags:
  // If pcs is not null, then DOB is required for ALL passenger types (Adult, Child, Infant) according to pcs.dobe (dobe === true).
  // If pcs is null/undefined, maintain current behavior.
  const isPcsDobeRequired = hasPcs ? Boolean(pcsConditions.dobe ?? pcsConditions.Dobe ?? false) : false;

  const isAdultDobRequired = hasPcs
    ? isPcsDobeRequired
    : (dobConditions
      ? Boolean(dobConditions.adobr ?? dobConditions.Adobr ?? false)
      : Boolean(isInternational));

  const isChildDobRequired = hasPcs
    ? isPcsDobeRequired
    : (dobConditions
      ? Boolean(dobConditions.cdobr ?? dobConditions.Cdobr ?? false)
      : true);

  const isInfantDobRequired = hasPcs
    ? isPcsDobeRequired
    : (dobConditions
      ? Boolean(dobConditions.idobr ?? dobConditions.Idobr ?? true)
      : true);

  const fareAlert = useMemo(() => {
    const rawAlerts = fareReviewData?.Alerts || fareReviewData?.Data?.Alerts;
    if (!rawAlerts) return null;
    let targetAlert = null;
    if (Array.isArray(rawAlerts)) {
      targetAlert = rawAlerts.find((a) => a?.AlertType === "FAREALERT" || (a?.NewFare && a?.OldFare)) || rawAlerts[0] || null;
    } else if (typeof rawAlerts === "object" && (rawAlerts.AlertType === "FAREALERT" || (rawAlerts.NewFare && rawAlerts.OldFare))) {
      targetAlert = rawAlerts;
    }
    if (targetAlert && Number(targetAlert.OldFare) !== Number(targetAlert.NewFare)) {
      return targetAlert;
    }
    return null;
  }, [fareReviewData]);

  useEffect(() => {
    if (fareAlert && !hasShownInitialFareAlertRef.current && !hasUserAcceptedFareAlert) {
      hasShownInitialFareAlertRef.current = true;
      setIsFareAlertModalOpen(true);
    }
  }, [fareAlert, hasUserAcceptedFareAlert]);

  const fareRuleData = fareReviewData?.TripInfo?.[0]?.FareRules?.fareRule ?? [];
  const TripBaggageData = fareReviewData?.TripInfo?.[0]?.TripBaggageList ?? [];
  const TripMealData = fareReviewData?.TripInfo?.[0]?.TripMealList ?? [];

  const FlightKeyList = fareReviewData?.FlightKeyList ?? [];
  const FlightId = fareReviewData?.TripInfo?.[0]?.FlightId;

  const FlightsDepartureAndArrivalDetails = fareReviewData?.TripInfo[0].FlightDetailResponses;
  const flight = FlightsDepartureAndArrivalDetails?.[0];

  const handleScroll = (id) => {
    if (id === "seats-section" || id === "seats" || id === "seats-meals") {
      setIsSeatSectionOpen(true);
      setTimeout(() => {
        const section = document.getElementById("seats-section");
        if (section) {
          section.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 50);
      return;
    }
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const [activeTab, setActiveTab] = useState("flight-summary");

  const handleTabClick = (id) => {
    setActiveTab(id);
    handleScroll(id);
  };

  // Derive fare numbers from API response (fall back to 0 while loading)
  const totalPriceList = fareReviewData?.TotalPriceList?.fC;
  const afC = fareReviewData?.TotalPriceList?.afC;

  // Markups & Transaction Fee from fareReviewData
  const retailerMarkup = Number(fareReviewData?.RetailerMarkup ?? fareReviewData?.TripInfo?.[0]?.RetailerMarkup ?? 0);
  const skyvooMarkup = Number(fareReviewData?.SkyvooMarkup ?? fareReviewData?.TripInfo?.[0]?.SkyvooMarkup ?? 0);
  const totalMarkup = retailerMarkup + skyvooMarkup || Number(fareReviewData?.Markup ?? fareReviewData?.TripInfo?.[0]?.Markup ?? 0);
  const transactionFee = Number(fareReviewData?.TransactionFee ?? 0);
  const services = transactionFee;

  // Base Fare (BF) with Skyvoo Markup added (Math.ceil)
  const rawBaseFare = Number(totalPriceList?.BF ?? 0);
  const totalFare = Number(totalPriceList?.TF ?? 0);
  const baseFare = Math.ceil(rawBaseFare + Math.ceil(skyvooMarkup));

  // Total taxes & fees (TAF) with Retailer Markup + Transaction Fee added (Math.ceil)
  const rawTaxes = Number(totalPriceList?.TAF ?? 0);
  const taxes = Math.ceil(rawTaxes + Math.ceil(retailerMarkup) + transactionFee);

  // Total amount to be paid before markups
  const totalAmountToBePay = rawBaseFare + rawTaxes;



  // Tax breakdown from afC.TAF
  const fuelSurcharge = Number(afC?.TAF?.YQ ?? 0);
  const gst = Number(afC?.TAF?.AGST ?? 0);
  const otherTaxes = Number(afC?.TAF?.OT ?? 0);
  const managementFee = Number(afC?.TAF?.MF ?? 0);
  const managementFeeTax = Number(afC?.TAF?.MFT ?? 0);
  const carrierMiscFee = Number(afC?.TAF?.YR ?? 0);

  // Multi-trip / Round-trip breakdown for Onward & Return
  const isRoundTripReview = (fareReviewData?.TripInfo?.length ?? 0) > 1;
  const onwardTrip = fareReviewData?.TripInfo?.[0];
  const returnTrip = isRoundTripReview ? fareReviewData?.TripInfo?.[1] : null;

  // Helper to extract breakdown from a trip object
  const getTripBreakdown = (trip) => {
    if (!trip) return null;
    const totalFareDetail = trip.TotalFareDetail || trip.totalFareDetail || trip.TotalPriceInfo?.TotalFareDetail;
    const tpl = trip.TotalPriceList || trip.totalPriceList;
    const tplItem = Array.isArray(tpl) ? tpl[0] : tpl;
    const fd = tplItem?.fd || trip.fd;
    const adultFd = fd?.ADULT || fd?.Adult || fd;
    const fC = totalFareDetail?.fC || trip.fC || adultFd?.fC || tplItem?.fC || trip.TotalPriceInfo?.fC;
    const afCData = totalFareDetail?.afC || trip.afC || adultFd?.afC || tplItem?.afC || trip.TotalPriceInfo?.afC;

    const rawBf = Number(fC?.BF || fC?.bf || 0);
    const rawTaf = Number(fC?.TAF || fC?.taf || 0);

    const tafAfC = afCData?.TAF || afCData?.taf || {};
    const gstVal = Number(tafAfC?.AGST || tafAfC?.agst || 0);
    const mfVal = Number(tafAfC?.MF || tafAfC?.mf || 0);
    const mftVal = Number(tafAfC?.MFT || tafAfC?.mft || 0);
    const otVal = Number(tafAfC?.OT || tafAfC?.ot || 0);
    const yqVal = Number(tafAfC?.YQ || tafAfC?.yq || 0);
    const yrVal = Number(tafAfC?.YR || tafAfC?.yr || 0);

    const rMarkup = Number(trip.RetailerMarkup || trip.retailerMarkup || trip.CspMarkup || trip.cspMarkup || 0);
    const sMarkup = Number(trip.SkyvooMarkup || trip.skyvooMarkup || trip.RoinetMarkup || trip.roinetMarkup || 0);
    const tFee = Number(trip.TransactionFee || trip.transactionFee || trip.TxnFees || trip.txnFees || 0);

    return {
      rawBf,
      rawTaf,
      gstVal,
      mfVal,
      mftVal,
      otVal,
      yqVal,
      yrVal,
      rMarkup,
      sMarkup,
      tFee,
    };
  };

  const onwardData = getTripBreakdown(onwardTrip);
  const returnData = getTripBreakdown(returnTrip);

  // If trips have individual prices, use them; otherwise split total 50/50
  const hasTripSplit = isRoundTripReview && (
    (Number(onwardData?.rawBf) > 0 || Number(returnData?.rawBf) > 0) ||
    (Number(onwardData?.rawTaf) > 0 || Number(returnData?.rawTaf) > 0)
  );

  const onwardBaseFare = hasTripSplit ? (onwardData?.rawBf || 0) : (isRoundTripReview ? Math.floor(rawBaseFare / 2) : rawBaseFare);
  const returnBaseFare = hasTripSplit ? (returnData?.rawBf || 0) : (isRoundTripReview ? (rawBaseFare - Math.floor(rawBaseFare / 2)) : 0);

  const onwardRoinetMarkup = (Number(onwardData?.sMarkup) > 0 || Number(returnData?.sMarkup) > 0)
    ? (onwardData?.sMarkup || 0)
    : (isRoundTripReview ? Math.floor(skyvooMarkup / 2) : skyvooMarkup);
  const returnRoinetMarkup = (Number(onwardData?.sMarkup) > 0 || Number(returnData?.sMarkup) > 0)
    ? (returnData?.sMarkup || 0)
    : (isRoundTripReview ? (skyvooMarkup - Math.floor(skyvooMarkup / 2)) : 0);

  const onwardCspMarkup = (Number(onwardData?.rMarkup) > 0 || Number(returnData?.rMarkup) > 0)
    ? (onwardData?.rMarkup || 0)
    : (isRoundTripReview ? Math.floor(retailerMarkup / 2) : retailerMarkup);
  const returnCspMarkup = (Number(onwardData?.rMarkup) > 0 || Number(returnData?.rMarkup) > 0)
    ? (returnData?.rMarkup || 0)
    : (isRoundTripReview ? (retailerMarkup - Math.floor(retailerMarkup / 2)) : 0);

  const onwardTxnFees = (Number(onwardData?.tFee) > 0 || Number(returnData?.tFee) > 0)
    ? (onwardData?.tFee || 0)
    : (isRoundTripReview ? Math.floor(transactionFee / 2) : transactionFee);
  const returnTxnFees = (Number(onwardData?.tFee) > 0 || Number(returnData?.tFee) > 0)
    ? (returnData?.tFee || 0)
    : (isRoundTripReview ? (transactionFee - Math.floor(transactionFee / 2)) : 0);

  const onwardTaxesAndFee = hasTripSplit ? (onwardData?.rawTaf || 0) : (isRoundTripReview ? Math.floor(rawTaxes / 2) : rawTaxes);
  const returnTaxesAndFee = hasTripSplit ? (returnData?.rawTaf || 0) : (isRoundTripReview ? (rawTaxes - Math.floor(rawTaxes / 2)) : 0);

  const onwardAirlineGst = (Number(onwardData?.gstVal) > 0 || Number(returnData?.gstVal) > 0) ? (onwardData?.gstVal || 0) : (isRoundTripReview ? Math.floor(gst / 2) : gst);
  const returnAirlineGst = (Number(onwardData?.gstVal) > 0 || Number(returnData?.gstVal) > 0) ? (returnData?.gstVal || 0) : (isRoundTripReview ? (gst - Math.floor(gst / 2)) : 0);

  const onwardManagementFee = (Number(onwardData?.mfVal) > 0 || Number(returnData?.mfVal) > 0) ? (onwardData?.mfVal || 0) : (isRoundTripReview ? Math.floor(managementFee / 2) : managementFee);
  const returnManagementFee = (Number(onwardData?.mfVal) > 0 || Number(returnData?.mfVal) > 0) ? (returnData?.mfVal || 0) : (isRoundTripReview ? (managementFee - Math.floor(managementFee / 2)) : 0);

  const onwardManagementFeeTax = (Number(onwardData?.mftVal) > 0 || Number(returnData?.mftVal) > 0) ? (onwardData?.mftVal || 0) : (isRoundTripReview ? Math.floor(managementFeeTax / 2) : managementFeeTax);
  const returnManagementFeeTax = (Number(onwardData?.mftVal) > 0 || Number(returnData?.mftVal) > 0) ? (returnData?.mftVal || 0) : (isRoundTripReview ? (managementFeeTax - Math.floor(managementFeeTax / 2)) : 0);

  const onwardOtherTaxes = (Number(onwardData?.otVal) > 0 || Number(returnData?.otVal) > 0) ? (onwardData?.otVal || 0) : (isRoundTripReview ? Math.floor(otherTaxes / 2) : otherTaxes);
  const returnOtherTaxes = (Number(onwardData?.otVal) > 0 || Number(returnData?.otVal) > 0) ? (returnData?.otVal || 0) : (isRoundTripReview ? (otherTaxes - Math.floor(otherTaxes / 2)) : 0);

  const onwardYQ = (Number(onwardData?.yqVal) > 0 || Number(returnData?.yqVal) > 0) ? (onwardData?.yqVal || 0) : (isRoundTripReview ? Math.floor(fuelSurcharge / 2) : fuelSurcharge);
  const returnYQ = (Number(onwardData?.yqVal) > 0 || Number(returnData?.yqVal) > 0) ? (returnData?.yqVal || 0) : (isRoundTripReview ? (fuelSurcharge - Math.floor(fuelSurcharge / 2)) : 0);

  const onwardYR = (Number(onwardData?.yrVal) > 0 || Number(returnData?.yrVal) > 0) ? (onwardData?.yrVal || 0) : (isRoundTripReview ? Math.floor(carrierMiscFee / 2) : carrierMiscFee);
  const returnYR = (Number(onwardData?.yrVal) > 0 || Number(returnData?.yrVal) > 0) ? (returnData?.yrVal || 0) : (isRoundTripReview ? (carrierMiscFee - Math.floor(carrierMiscFee / 2)) : 0);

  const [selectedCoupon, setSelectedCoupon] = useState(null);

  const isIntl = useMemo(() => {
    if (isInternational || Number(bookingStore.get()?.travelType) === 1) {
      return true;
    }

    const ind = ["IND", "IN"];
    const allLegs = (fareReviewData?.TripInfo || []).flatMap((t) => t?.FlightDetailResponses || []);

    for (const leg of allLegs) {
      const depC = leg?.AirlineDeparture?.countryCode || leg?.AirlineDeparture?.CountryCode;
      const arrC = leg?.AirlineArrival?.countryCode || leg?.AirlineArrival?.CountryCode;

      if (depC && !ind.includes(String(depC).toUpperCase())) return true;
      if (arrC && !ind.includes(String(arrC).toUpperCase())) return true;
    }

    return false;
  }, [isInternational, fareReviewData]);

  // Passport conditions based on Conditions.pcs:
  // If pcs is NOT null:
  // - pm: true -> passport details shown and required; pm: false -> passport details should NOT be shown
  // - pped: true -> passport expiry date required / shown
  // - pid: true -> passport issued date required / shown
  // If pcs is null/undefined: maintain current behavior (based on isIntl)
  const isPassportRequired = hasPcs
    ? Boolean(pcsConditions.pm ?? pcsConditions.Pm ?? false)
    : isIntl;

  const showPassportIssueDate = hasPcs
    ? Boolean(pcsConditions.pid ?? pcsConditions.Pid ?? false)
    : isIntl;

  const showPassportExpiryDate = hasPcs
    ? Boolean(pcsConditions.pped ?? pcsConditions.Pped ?? false)
    : isIntl;

  // If pm is false inside pcs, passport details should not be shown to fill
  const isPassportSectionVisible = isPassportRequired;

  // Derive traveller limits from API / filter / bookingStore
  const TotalTravellers = useMemo(() => {
    const bookingData = bookingStore.get();

    const getVal = (val, searchKey, storeKey, defaultVal = 0) => {
      if (val !== undefined && val !== null) {
        if (typeof val === "number" && !isNaN(val)) return val;
        if (typeof val === "object" && val.Count !== undefined && !isNaN(Number(val.Count))) return Number(val.Count);
        if (!isNaN(Number(val))) return Number(val);
      }
      if (bookingData?.travellers?.[storeKey] !== undefined && !isNaN(Number(bookingData.travellers[storeKey]))) {
        return Number(bookingData.travellers[storeKey]);
      }
      const spVal = searchParams.get(searchKey);
      if (spVal !== null && !isNaN(Number(spVal))) {
        return Number(spVal);
      }
      return defaultVal;
    };

    const adultCount = Math.max(1, getVal(fareReviewData?.PaxInfo?.ADULT, "adults", "adults", 1));
    const childCount = Math.max(0, getVal(fareReviewData?.PaxInfo?.CHILD, "children", "children", 0));
    const infantCount = Math.max(0, getVal(fareReviewData?.PaxInfo?.INFANT, "infants", "infants", 0));

    return {
      Adults: adultCount,
      Childs: childCount,
      Infants: infantCount,
    };
  }, [fareReviewData, searchParams]);

  const { Adults, Childs, Infants } = TotalTravellers;

  // Reference travel date for age calculations
  const travelDate = useMemo(() => {
    const bookingData = bookingStore.get();
    const firstLeg =
      fareReviewData?.TripInfo?.[0]?.FlightDetailResponses?.[0] ||
      bookingData?.flight?.FlightDetailResponses?.[0] ||
      bookingData?.outboundFlight?.FlightDetailResponses?.[0];
    const depDateStr = firstLeg?.DepartureDate || bookingData?.depart;
    if (depDateStr) {
      const d = dayjs(depDateStr);
      if (d.isValid()) return d.startOf("day");
    }
    return dayjs().startOf("day");
  }, [fareReviewData]);

  const disabledAdultDate = (current) => {
    if (!current) return false;
    const maxDate = travelDate.subtract(12, "year");
    return current.isAfter(maxDate, "day");
  };

  const disabledChildDate = (current) => {
    if (!current) return false;
    const minDate = travelDate.subtract(12, "year");
    const maxDate = travelDate.subtract(2, "year");
    return current.isBefore(minDate, "day") || current.isAfter(maxDate, "day");
  };

  const disabledInfantDate = (current) => {
    if (!current) return false;
    const minDate = travelDate.subtract(2, "year");
    const maxDate = travelDate.isBefore(dayjs(), "day") ? travelDate : dayjs();
    return current.isBefore(minDate, "day") || current.isAfter(maxDate, "day");
  };

  const getAdultDobError = (dob) => {
    if (!dob) {
      return isAdultDobRequired ? "Date of Birth is required" : null;
    }
    if (dob === "INVALID") return "Please enter a valid Date of Birth (DD/MM/YYYY)";
    const d = dayjs(dob, "YYYY-MM-DD");
    if (!d.isValid()) return "Please enter a valid Date of Birth";
    const ageInYears = travelDate.diff(d, "year", true);
    if (ageInYears < 12) {
      return "Adult must be 12 years or older on date of travel";
    }
    return null;
  };

  const getChildDobError = (dob) => {
    if (!dob) {
      return isChildDobRequired ? "Date of Birth is required" : null;
    }
    if (dob === "INVALID") return "Please enter a valid Date of Birth (DD/MM/YYYY)";
    const d = dayjs(dob, "YYYY-MM-DD");
    if (!d.isValid()) return "Please enter a valid Date of Birth";
    const ageInYears = travelDate.diff(d, "year", true);
    if (ageInYears < 2) {
      return "Child must be at least 2 years on date of travel";
    }
    if (ageInYears > 12) {
      return "Child must be 12 years or younger on date of travel";
    }
    return null;
  };

  const getInfantDobError = (dob) => {
    if (!dob) {
      return isInfantDobRequired ? "Date of Birth is required" : null;
    }
    if (dob === "INVALID") return "Please enter a valid Date of Birth (DD/MM/YYYY)";
    const d = dayjs(dob, "YYYY-MM-DD");
    if (!d.isValid()) return "Please enter a valid Date of Birth";
    if (d.isAfter(dayjs(), "day") || d.isAfter(travelDate, "day")) {
      return "Date of Birth cannot be in the future";
    }
    const ageInYears = travelDate.diff(d, "year", true);
    if (ageInYears >= 2) {
      return "Infant must be below 2 years on date of travel";
    }
    if (ageInYears < 0) {
      return "Date of Birth cannot be after travel date";
    }
    return null;
  };

  const getTravellerPassportError = (t) => {
    if (!isPassportSectionVisible) return null;
    const hasAnyField = Boolean(
      t.passportNumber?.trim() ||
      t.passportNationality?.trim() ||
      t.passportIssued ||
      t.passportExpiry
    );

    // If passport is mandatory, OR if optional but traveller started filling details:
    if (isPassportRequired || hasAnyField) {
      if (!t.passportNumber?.trim()) {
        return "Passport Number is required";
      }
      if (!t.passportNationality?.trim()) {
        return "Nationality is required";
      }
      if (showPassportIssueDate && !t.passportIssued) {
        return "Passport Issue Date is required";
      }
      if (showPassportExpiryDate && !t.passportExpiry) {
        return "Passport Expiry Date is required";
      }
    }
    return null;
  };

  const makeAdult = (id) => ({
    id,
    firstName: "",
    lastName: "",
    gender: "MALE",
    dob: "",
    countryCode: "",
    mobile: "",
    email: "",
    wheelchair: false,
    passportNumber: "",
    passportNationality: "",
    passportExpiry: "",
    passportIssued: "",
    selectedBaggage: [],
    selectedMeals: [],
  });
  const makeChild = (id) => ({
    id,
    firstName: "",
    lastName: "",
    gender: "MALE",
    dob: "",
    passportNumber: "",
    passportNationality: "",
    passportExpiry: "",
    passportIssued: "",
    selectedBaggage: [],
    selectedMeals: [],
  });
  const makeInfant = (id) => ({
    id,
    firstName: "",
    lastName: "",
    gender: "MALE",
    dob: "",
    accompanyingAdult: "",
    passportNumber: "",
    passportNationality: "",
    passportExpiry: "",
    passportIssued: "",
    selectedBaggage: [],
    selectedMeals: [],
  });

  const [travellers, setTravellers] = useState(() => {
    const bookingData = bookingStore.get();
    const aCount = Math.max(1, Number(bookingData?.travellers?.adults ?? searchParams.get("adults") ?? 1));
    const cCount = Math.max(0, Number(bookingData?.travellers?.children ?? searchParams.get("children") ?? 0));
    const iCount = Math.max(0, Number(bookingData?.travellers?.infants ?? searchParams.get("infants") ?? 0));

    return {
      Adults: Array.from({ length: aCount }, (_, i) => makeAdult(Date.now() + i)),
      Childs: Array.from({ length: cCount }, (_, i) => makeChild(Date.now() + 100 + i)),
      Infants: Array.from({ length: iCount }, (_, i) => makeInfant(Date.now() + 200 + i)),
    };
  });

  useEffect(() => {
    setTravellers((prev) => {
      const curAdults = prev.Adults || [];
      const curChilds = prev.Childs || [];
      const curInfants = prev.Infants || [];

      let newAdults = [...curAdults];
      if (Adults > newAdults.length) {
        for (let i = newAdults.length; i < Adults; i++) {
          newAdults.push(makeAdult(Date.now() + i));
        }
      } else if (Adults < newAdults.length && Adults > 0) {
        newAdults = newAdults.slice(0, Adults);
      }

      let newChilds = [...curChilds];
      if (Childs > newChilds.length) {
        for (let i = newChilds.length; i < Childs; i++) {
          newChilds.push(makeChild(Date.now() + 100 + i));
        }
      } else if (Childs < newChilds.length) {
        newChilds = newChilds.slice(0, Childs);
      }

      let newInfants = [...curInfants];
      if (Infants > newInfants.length) {
        for (let i = newInfants.length; i < Infants; i++) {
          newInfants.push(makeInfant(Date.now() + 200 + i));
        }
      } else if (Infants < newInfants.length) {
        newInfants = newInfants.slice(0, Infants);
      }

      if (
        newAdults.length === curAdults.length &&
        newChilds.length === curChilds.length &&
        newInfants.length === curInfants.length
      ) {
        return prev;
      }

      return {
        Adults: newAdults.length > 0 ? newAdults : [makeAdult(1)],
        Childs: newChilds,
        Infants: newInfants,
      };
    });
  }, [Adults, Childs, Infants]);

  const updateTraveller = (category, index, field, value) => {
    setTravellers((prev) => {
      const updatedCat = [...(prev[category] || [])];
      if (updatedCat[index]) {
        updatedCat[index] = { ...updatedCat[index], [field]: value };
      }
      return { ...prev, [category]: updatedCat };
    });
  };

  const addTraveller = (category, limit) => {
    setTravellers((prev) => {
      const list = prev[category] || [];
      if (list.length >= limit) return prev;
      const maker = category === "Adults" ? makeAdult : category === "Childs" ? makeChild : makeInfant;
      return {
        ...prev,
        [category]: [...list, maker(Date.now() + list.length)],
      };
    });
  };

  const removeTraveller = (category, index) => {
    setTravellers((prev) => {
      const updated = (prev[category] || []).filter((_, i) => i !== index);
      return { ...prev, [category]: updated };
    });
  };

  // Sanitizes name input: allows ONLY letters and single spaces, no leading space, no integers, no special characters
  const handleNameChange = (category, index, field, rawValue) => {
    const sanitized = String(rawValue || "")
      .replace(/[^a-zA-Z\s]/g, "") // Remove integers and special characters
      .replace(/^\s+/, "") // Remove leading space
      .replace(/\s{2,}/g, " "); // Collapse multiple spaces
    updateTraveller(category, index, field, sanitized);
  };

  // Compute total baggage price & count across all travellers
  const totalBaggageCost = useMemo(() => {
    const all = [
      ...(travellers.Adults || []),
      ...(travellers.Childs || []),
      ...(travellers.Infants || []),
    ];
    return all.reduce((sum, t) => {
      const bList = t.selectedBaggage || [];
      return sum + bList.reduce((bSum, item) => bSum + (Number(item.Amount) || 0), 0);
    }, 0);
  }, [travellers]);

  const totalBaggageItemsCount = useMemo(() => {
    const all = [
      ...(travellers.Adults || []),
      ...(travellers.Childs || []),
      ...(travellers.Infants || []),
    ];
    return all.reduce((sum, t) => sum + (t.selectedBaggage?.length || 0), 0);
  }, [travellers]);

  // Compute total meal price & count across all travellers
  const totalMealCost = useMemo(() => {
    const all = [
      ...(travellers.Adults || []),
      ...(travellers.Childs || []),
      ...(travellers.Infants || []),
    ];
    return all.reduce((sum, t) => {
      const mList = t.selectedMeals || [];
      return sum + mList.reduce((mSum, item) => mSum + (Number(item.Amount) || 0), 0);
    }, 0);
  }, [travellers]);

  const totalMealItemsCount = useMemo(() => {
    const all = [
      ...(travellers.Adults || []),
      ...(travellers.Childs || []),
      ...(travellers.Infants || []),
    ];
    return all.reduce((sum, t) => sum + (t.selectedMeals?.length || 0), 0);
  }, [travellers]);

  // Total Meal, Baggage & Seat Add-ons
  const totalBaggageMealSeatAmount = totalBaggageCost + totalMealCost + selectedSeatCost;

  // subTotal = Base Fare + Taxes & Fees (includes markups & txn fees)
  const subTotal = baseFare + taxes;

  // subtotal alias (used by calculateTotal)
  const subtotal = subTotal;

  // Amount to pay = totalAmountToBePay + cspMarkup + roinetMarkup + txnFees + add-ons
  const amountToPay = Math.ceil(totalAmountToBePay + retailerMarkup + Math.ceil(skyvooMarkup) + transactionFee + totalBaggageMealSeatAmount);

  // Convenience fee = cspMarkup (retailerMarkup)
  const convenienceFee = Math.ceil(retailerMarkup);

  const commission = Number(fareReviewData?.Commission ?? 0);

  // Net Price = (totalAmountToBePay + roinetMarkup + txnFees + add-ons) - commission
  const netPrice = Math.ceil((totalAmountToBePay + Math.ceil(skyvooMarkup) + transactionFee + totalBaggageMealSeatAmount) - Math.ceil(commission));

  const calculateTotal = useMemo(() => {
    const currentSubtotal = subtotal + totalBaggageMealSeatAmount;
    if (!selectedCoupon) return currentSubtotal;
    const { discountType, value } = selectedCoupon;
    let discount = 0;
    if (discountType === "flat") discount = value;
    else if (discountType === "percent")
      discount = Math.min((currentSubtotal * value) / 100, 800);
    return Math.max(currentSubtotal - discount, 0);
  }, [selectedCoupon, subtotal, totalBaggageMealSeatAmount]);

  const handleOpenBaggageModal = (category, index, label) => {
    const traveller = travellers[category]?.[index];
    setBaggageTarget({
      category,
      index,
      label: `${label} ${index + 1}`,
      firstName: traveller?.firstName || "",
      lastName: traveller?.lastName || "",
    });
    setIsBaggageModal(true);
  };

  const handleSaveBaggage = (selectedItems) => {
    if (baggageTarget) {
      const { category, index } = baggageTarget;
      setTravellers((prev) => {
        const updatedCat = [...prev[category]];
        if (updatedCat[index]) {
          updatedCat[index] = {
            ...updatedCat[index],
            selectedBaggage: selectedItems,
          };
        }
        return { ...prev, [category]: updatedCat };
      });
    }
  };

  // Collect ALL flight segments across all trips in fareReviewData.TripInfo
  const allFlightSegments = useMemo(() => {
    return (fareReviewData?.TripInfo ?? []).flatMap((trip, tripIdx) => {
      const tripFlightId =
        trip?.FlightId ||
        trip?.flightId ||
        trip?.FlightDetailResponses?.[0]?.FlightId ||
        trip?.FlightDetailResponses?.[0]?.flightId ||
        trip?.FlightDetailResponses?.[0]?.SegmentId ||
        (tripIdx === 0 ? FlightId : undefined);
      const tripFlightKey = trip?.FlightKey || trip?.FlightKeys;
      const legs = trip?.FlightDetailResponses ?? [];
      if (legs.length === 0) {
        return [{
          FlightId: tripFlightId,
          FlightKey: tripFlightKey,
          AirlineDeparture: trip?.AirlineDeparture,
          AirlineArrival: trip?.AirlineArrival,
          DepartureDate: trip?.DepartureDate,
          DepartureTime: trip?.DepartureTime,
          ArrivalTime: trip?.ArrivalTime,
          AirlineName: trip?.AirlineName,
          AirlineCode: trip?.AirlineCode,
          FlightNo: trip?.FlightNo,
          tripIndex: tripIdx,
        }];
      }
      return legs.map((leg) => ({
        ...leg,
        FlightId: leg?.FlightId || leg?.flightId || leg?.SegmentId || leg?.segmentId || tripFlightId,
        FlightKey: leg?.FlightKey || leg?.FlightKeys || tripFlightKey,
        AirlineDeparture: leg?.AirlineDeparture || trip?.AirlineDeparture,
        AirlineArrival: leg?.AirlineArrival || trip?.AirlineArrival,
        DepartureDate: leg?.DepartureDate || trip?.DepartureDate,
        DepartureTime: leg?.DepartureTime || trip?.DepartureTime,
        ArrivalTime: leg?.ArrivalTime || trip?.ArrivalTime,
        AirlineName: leg?.AirlineName || trip?.AirlineName,
        AirlineCode: leg?.AirlineCode || trip?.AirlineCode,
        FlightNo: leg?.FlightNo || trip?.FlightNo,
        tripIndex: tripIdx,
      }));
    });
  }, [fareReviewData, FlightId]);

  const handleSelectSeatModal = (initialSegIdx = 0) => {
    if (!isSeatAllowed) return;

    // Adults + Childs need seats; Infants do NOT get seats
    const totalSeatCount = Adults + Childs;

    const segIdx = Number(initialSegIdx) || 0;
    const targetSegment = allFlightSegments[segIdx] || allFlightSegments[0];

    const flightKeyList = (targetSegment?.FlightKey
      ? [targetSegment.FlightKey]
      : (fareReviewData?.FlightKeyList && fareReviewData.FlightKeyList.length > 0)
        ? fareReviewData.FlightKeyList
        : (bookingData?.flightKeyList || []));

    const segFlightSummary = targetSegment ? {
      airlineName: targetSegment.AirlineName || '',
      airlineCode: targetSegment.AirlineCode || '',
      airlineLogoCode: targetSegment.AirlineLogo || targetSegment.AirlineCode || '',
      flightNo: targetSegment.FlightNo || '',
      craft: targetSegment.Equipment || targetSegment.Craft || '',
      depCode: targetSegment.AirlineDeparture?.code || targetSegment.AirlineDeparture?.cityCode || '',
      depCity: targetSegment.AirlineDeparture?.city || '',
      depTime: targetSegment.DepartureTime || '',
      depDate: targetSegment.DepartureDate || '',
      arrCode: targetSegment.AirlineArrival?.code || targetSegment.AirlineArrival?.cityCode || '',
      arrCity: targetSegment.AirlineArrival?.city || '',
      arrTime: targetSegment.ArrivalTime || '',
      arrDate: targetSegment.ArrivalDate || '',
      duration: targetSegment.AirlineDuration || '',
      stops: targetSegment.Stops ?? null,
    } : flightSummary;

    // Filter only this segment's seats to pass into bookingStore
    const currentSegSeats = (selectedSeatDetails || [])
      .filter((s) => (s.segmentIndex !== undefined ? Number(s.segmentIndex) : 0) === segIdx);

    bookingStore.set({
      passengers: travellers,
      paxCounts: { Adults, Childs, Infants },
      totalSeatCount,
      extraBaggageTotal: totalBaggageCost,
      extraMealTotal: totalMealCost,
      flightKeyList: flightKeyList,
      flightId: targetSegment?.FlightId || FlightId || fareReviewData?.TripInfo?.[0]?.FlightId,
      flightSummary: segFlightSummary,
      flightSegments: targetSegment ? [targetSegment] : (allFlightSegments.length > 0 ? [allFlightSegments[0]] : []),
      selectedSeats: currentSegSeats.map((s) => s.number || s.SeatNo || s.code).filter(Boolean),
      selectedSeatDetails: currentSegSeats,
    });
    setTargetSeatSegmentIndex(segIdx);
    setIsFlightSeatMap(true);
  };

  const handleSeatsContinue = ({ selectedSeats, selectedServices, totalAmount, selectedSeatDetails: currentSegSeatDetails = [] }) => {
    // Tag seats from this modal session with the target segment index
    const remappedSegSeats = currentSegSeatDetails.map((seat) => ({
      ...seat,
      segmentIndex: targetSeatSegmentIndex,
    }));

    // Retain seats selected previously for other flight segments
    const otherSegSeats = (selectedSeatDetails || []).filter(
      (s) => (s.segmentIndex !== undefined ? Number(s.segmentIndex) : 0) !== targetSeatSegmentIndex
    );

    const mergedSeatDetails = [...otherSegSeats, ...remappedSegSeats];
    const totalSeatPrice = mergedSeatDetails.reduce(
      (sum, s) => sum + (Number(s.price || s.Amount) || 0),
      0
    );

    const allSeatNumbers = Array.from(new Set(mergedSeatDetails.map((s) => s.number || s.SeatNo || s.code).filter(Boolean)));

    setSelectedSeatCost(totalSeatPrice);
    setSelectedSeatData({ seats: new Set(allSeatNumbers), services: selectedServices });
    setSelectedSeatDetails(mergedSeatDetails);

    // Persist into bookingStore so payment page can access complete seat selections
    bookingStore.set({
      seatTotal: totalSeatPrice,
      selectedSeats: allSeatNumbers,
      selectedServices,
      selectedSeatDetails: mergedSeatDetails,
    });
    setIsFlightSeatMap(false);
  };

  // Compute per-trip baggage (connecting flights share baggage, depart vs return differ)
  const allTripBaggageData = useMemo(() => {
    const tripList = fareReviewData?.TripInfo || [];
    return tripList.map((trip, tIdx) => {
      const legs = trip?.FlightDetailResponses || [];
      const first = legs[0];
      const last = legs[legs.length - 1] || first;
      const dep = first?.AirlineDeparture?.city || first?.AirlineDeparture?.code || trip?.AirlineDeparture?.city || trip?.AirlineDeparture?.code || "";
      const arr = last?.AirlineArrival?.city || last?.AirlineArrival?.code || trip?.AirlineArrival?.city || trip?.AirlineArrival?.code || "";
      const routeStr = dep && arr ? `${dep} → ${arr}` : "";
      const title = tripList.length > 1
        ? (tIdx === 0 ? "Departure Flight" : (tIdx === 1 ? "Return Flight" : `Trip ${tIdx + 1}`))
        : "Flight Journey";

      const tripFlightId =
        trip?.FlightId ||
        trip?.flightId ||
        first?.FlightId ||
        first?.flightId ||
        first?.SegmentId ||
        trip?.FlightDetailResponses?.[0]?.FlightId ||
        (tIdx === 0 ? FlightId : undefined);

      const tripBaggageRaw = trip?.TripBaggageList || [];
      // Flatten BaggageList from segments or handle direct array
      let extractedBaggage = [];
      if (Array.isArray(tripBaggageRaw)) {
        extractedBaggage = tripBaggageRaw.flatMap((bSeg) => {
          if (!bSeg) return [];
          const segFId = bSeg.SegmentId || bSeg.segmentId || bSeg.FlightId || bSeg.flightId || bSeg.Key || tripFlightId;
          if (Array.isArray(bSeg)) return bSeg;
          if (bSeg.BaggageList && Array.isArray(bSeg.BaggageList)) {
            return bSeg.BaggageList.map((b) => ({ ...b, FlightId: b.FlightId || b.SegmentId || segFId, SegmentId: b.SegmentId || b.FlightId || segFId }));
          }
          if (bSeg.BaggageDetails && Array.isArray(bSeg.BaggageDetails)) {
            return bSeg.BaggageDetails.map((b) => ({ ...b, FlightId: b.FlightId || b.SegmentId || segFId, SegmentId: b.SegmentId || b.FlightId || segFId }));
          }
          if (bSeg.BaggageDynamic && Array.isArray(bSeg.BaggageDynamic)) {
            return bSeg.BaggageDynamic.map((b) => ({ ...b, FlightId: b.FlightId || b.SegmentId || segFId, SegmentId: b.SegmentId || b.FlightId || segFId }));
          }
          if (bSeg.Baggage && Array.isArray(bSeg.Baggage)) {
            return bSeg.Baggage.map((b) => ({ ...b, FlightId: b.FlightId || b.SegmentId || segFId, SegmentId: b.SegmentId || b.FlightId || segFId }));
          }
          return [{ ...bSeg, FlightId: bSeg.FlightId || bSeg.SegmentId || segFId, SegmentId: bSeg.SegmentId || bSeg.FlightId || segFId }];
        });
      }

      // Deduplicate items within the trip
      const uniqueItems = [];
      const seen = new Set();
      extractedBaggage.forEach((b) => {
        const id = b.SSRKey || b.Code || b.Description || b.Desc || b.Weight || JSON.stringify(b);
        if (id && !seen.has(id)) {
          seen.add(id);
          uniqueItems.push({
            ...b,
            tripIndex: tIdx,
            TripType: tIdx,
            FlightId: b.FlightId || b.SegmentId || tripFlightId,
            SegmentId: b.SegmentId || b.FlightId || tripFlightId,
          });
        }
      });

      return {
        tripIndex: tIdx,
        title,
        route: routeStr,
        sectorKey: `${first?.AirlineDeparture?.code || ''}-${last?.AirlineArrival?.code || ''}`.toUpperCase(),
        baggageList: uniqueItems,
        flightId: tripFlightId,
      };
    });
  }, [fareReviewData, FlightId]);

  // Compute per-segment meals (meal selection is per flight segment, matching seat selection)
  const allTripMealData = useMemo(() => {
    return (allFlightSegments || []).map((seg, sIdx) => {
      const dep = seg?.AirlineDeparture?.code || seg?.AirlineDeparture?.city || "";
      const arr = seg?.AirlineArrival?.code || seg?.AirlineArrival?.city || "";
      const sectorStr = dep && arr ? `${dep} → ${arr}` : `Segment ${sIdx + 1}`;

      const trip = fareReviewData?.TripInfo?.[seg.tripIndex ?? 0];
      const tripMeals = trip?.TripMealList || [];
      let segmentMealItems = [];
      if (Array.isArray(tripMeals) && tripMeals.length > 0) {
        const matchedMealSeg = tripMeals.find(
          (mSeg) => String(mSeg.SegmentId || mSeg.FlightId || mSeg.Key || '') === String(seg.FlightId || seg.SegmentId || '')
        );
        if (matchedMealSeg) {
          const raw = matchedMealSeg.MealList || matchedMealSeg.MealDynamic || matchedMealSeg.MealDetails || matchedMealSeg.Meals || [];
          segmentMealItems = Array.isArray(raw) ? raw : [raw];
        } else if (tripMeals[sIdx]?.MealList || tripMeals[sIdx]?.MealDynamic || tripMeals[sIdx]?.MealDetails) {
          const raw = tripMeals[sIdx].MealList || tripMeals[sIdx].MealDynamic || tripMeals[sIdx].MealDetails || [];
          segmentMealItems = Array.isArray(raw) ? raw : [raw];
        } else if (tripMeals[0]?.MealList || tripMeals[0]?.MealDynamic || tripMeals[0]?.MealDetails) {
          const raw = tripMeals[0].MealList || tripMeals[0].MealDynamic || tripMeals[0].MealDetails || [];
          segmentMealItems = Array.isArray(raw) ? raw : [raw];
        } else {
          segmentMealItems = tripMeals.flatMap((m) => {
            if (m.MealList && Array.isArray(m.MealList)) return m.MealList;
            if (m.MealDynamic && Array.isArray(m.MealDynamic)) return m.MealDynamic;
            if (m.MealDetails && Array.isArray(m.MealDetails)) return m.MealDetails;
            return [m];
          });
        }
      }

      return {
        segmentIndex: sIdx,
        tripIndex: seg.tripIndex ?? 0,
        FlightId: seg.FlightId,
        Sector: `${dep}-${arr}`.toUpperCase(),
        sectorLabel: sectorStr,
        airlineCode: seg.AirlineCode,
        flightNo: seg.FlightNo,
        mealList: segmentMealItems,
      };
    });
  }, [allFlightSegments, fareReviewData]);

  const handleRemoveSingleBaggage = (category, index, itemId) => {
    setTravellers((prev) => {
      const updatedCat = [...prev[category]];
      if (updatedCat[index]) {
        const getItemId = (item) => `${item.tripIndex ?? 0}_${item.SSRKey || item.Code || item.Description}`;
        const currentList = updatedCat[index].selectedBaggage || [];
        updatedCat[index] = {
          ...updatedCat[index],
          selectedBaggage: currentList.filter((b) => getItemId(b) !== itemId && (b.SSRKey || b.Code || b.Description) !== itemId),
        };
      }
      return { ...prev, [category]: updatedCat };
    });
  };

  const handleOpenMealModal = (category, index, label) => {
    const traveller = travellers[category]?.[index];
    setMealTarget({
      category,
      index,
      label: `${label} ${index + 1}`,
      firstName: traveller?.firstName || "",
      lastName: traveller?.lastName || "",
    });
    setIsMealModal(true);
  };

  const handleSaveMeals = (selectedItems) => {
    if (mealTarget) {
      const { category, index } = mealTarget;
      setTravellers((prev) => {
        const updatedCat = [...prev[category]];
        if (updatedCat[index]) {
          updatedCat[index] = {
            ...updatedCat[index],
            selectedMeals: selectedItems,
          };
        }
        return { ...prev, [category]: updatedCat };
      });
    }
  };

  const handleRemoveSingleMeal = (category, index, itemId) => {
    setTravellers((prev) => {
      const updatedCat = [...prev[category]];
      if (updatedCat[index]) {
        const getItemId = (item) => `${item.segmentIndex ?? 0}_${item.SSRKey || item.Code || item.Description}`;
        const currentList = updatedCat[index].selectedMeals || [];
        updatedCat[index] = {
          ...updatedCat[index],
          selectedMeals: currentList.filter((m) => getItemId(m) !== itemId && (m.SSRKey || m.Code || m.Description) !== itemId),
        };
      }
      return { ...prev, [category]: updatedCat };
    });
  };

  const flightSummary = useMemo(() => {
    const trip = fareReviewData?.TripInfo?.[0];
    const legs = trip?.FlightDetailResponses ?? [];
    const first = legs[0];
    const last = legs[legs.length - 1] || first;
    if (!first) return null;

    return {
      airlineName: first.AirlineName || "Airline",
      airlineCode: first.AirlineCode || "",
      flightNo: first.FlightNo || "",
      craft: first.Craft || first.Equipment || "Airbus A320",
      depCode: first.AirlineDeparture?.code || first.AirlineDeparture?.city || "DEL",
      depTime: first.DepartureTime || first.AirlineDeparture?.time || "14:30",
      arrCode: last.AirlineArrival?.code || last.AirlineArrival?.city || "BOM",
      arrTime: last.ArrivalTime || last.AirlineArrival?.time || "16:45",
      duration: first.AirlineDuration || "2h 15m",
    };
  }, [fareReviewData]);

  // ─── Booking Confirmation Modal State ────────────────────────────────────────
  const [bookingResult, setBookingResult] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorTitle, setErrorTitle] = useState("Booking Failed");
  const [errorType, setErrorType] = useState("error");
  const [errorAction, setErrorAction] = useState(null);

  // ─── Flight Booking Payload Builder ─────────────────────────────────────────
  const getBookingPayload = (customPgTxnId = null) => {
    const list = [];
    const mapPaxType = (key) =>
      key === "Adults" ? "ADULT" : key === "Childs" ? "CHILD" : "INFANT";
    const mapTitle = (gender, paxType) => {
      const isFemale = String(gender || "").trim().toUpperCase() === "FEMALE";
      const cleanPaxType = String(paxType || "").trim().toUpperCase();
      if (cleanPaxType === "CHILD" || cleanPaxType === "INFANT") {
        return isFemale ? "MISS" : "MSTR";
      }
      return isFemale ? "MS" : "MR";
    };

    // Get seat details from bookingStore (set in handleSeatsContinue)
    const storedSeatDetails = bookingStore.get().selectedSeatDetails ?? [];

    // Group storedSeatDetails by segmentIndex
    const seatsBySegment = {};
    storedSeatDetails.forEach((seat) => {
      const segIdx = seat.segmentIndex !== undefined ? Number(seat.segmentIndex) : "0";
      if (!seatsBySegment[segIdx]) seatsBySegment[segIdx] = [];
      seatsBySegment[segIdx].push(seat);
    });

    // Helper to map SSR items to API format (Key = SegmentId, Code = SSR Key / Token)
    const mapSSRItem = (item) => {
      if (!item) return null;
      const ssrCode = item.Key ?? item.SSRKey ?? item.Code ?? item.SSRCode ?? "";

      const isReturnItem =
        Number(item.TripType) === 1 ||
        Number(item.tripIndex) === 1 ||
        Number(item.TripType) > 0 ||
        Number(item.tripIndex) > 0 ||
        Boolean(item.isReturn) ||
        Boolean(item.isReturnTrip);

      const returnTripObj = fareReviewData?.TripInfo?.[1];
      const returnTripFlightId =
        returnTripObj?.FlightDetailResponses?.[0]?.FlightId ||
        returnTripObj?.FlightDetailResponses?.[0]?.flightId ||
        returnTripObj?.FlightDetailResponses?.[0]?.SegmentId ||
        returnTripObj?.FlightId ||
        returnTripObj?.flightId;

      const outboundTripObj = fareReviewData?.TripInfo?.[0];
      const outboundTripFlightId =
        outboundTripObj?.FlightDetailResponses?.[0]?.FlightId ||
        outboundTripObj?.FlightDetailResponses?.[0]?.flightId ||
        outboundTripObj?.FlightDetailResponses?.[0]?.SegmentId ||
        outboundTripObj?.FlightId ||
        outboundTripObj?.flightId ||
        FlightId ||
        0;

      // Try matching by Sector if available
      let segBySectorFlightId = null;
      if (item.Sector) {
        const normSector = String(item.Sector).replace(/\s+/g, "").replace("→", "-").toUpperCase();
        const matchedSeg = (allFlightSegments || []).find((s) => {
          const dep = s?.AirlineDeparture?.code || s?.AirlineDeparture?.cityCode || "";
          const arr = s?.AirlineArrival?.code || s?.AirlineArrival?.cityCode || "";
          const sSector = `${dep}-${arr}`.toUpperCase();
          return sSector === normSector || (dep && arr && normSector.includes(dep) && normSector.includes(arr));
        });
        if (matchedSeg?.FlightId) {
          segBySectorFlightId = matchedSeg.FlightId;
        }
      }

      // Try matching by segmentIndex if available
      let segByIndexFlightId = null;
      if (item.segmentIndex !== undefined && allFlightSegments?.[Number(item.segmentIndex)]) {
        segByIndexFlightId = allFlightSegments[Number(item.segmentIndex)]?.FlightId;
      }

      let segId;
      if (isReturnItem) {
        // Return SSR MUST use return flight's Key
        segId =
          (item.FlightId && String(item.FlightId) !== String(outboundTripFlightId) ? item.FlightId : null) ??
          (item.SegmentId && String(item.SegmentId) !== String(outboundTripFlightId) ? item.SegmentId : null) ??
          (item.flightId && String(item.flightId) !== String(outboundTripFlightId) ? item.flightId : null) ??
          (item.segmentId && String(item.segmentId) !== String(outboundTripFlightId) ? item.segmentId : null) ??
          (segBySectorFlightId && String(segBySectorFlightId) !== String(outboundTripFlightId) ? segBySectorFlightId : null) ??
          (segByIndexFlightId && String(segByIndexFlightId) !== String(outboundTripFlightId) ? segByIndexFlightId : null) ??
          returnTripFlightId ??
          item.FlightId ??
          item.SegmentId ??
          0;
      } else {
        // Outbound SSR
        segId =
          (item.FlightId && returnTripFlightId && String(item.FlightId) === String(returnTripFlightId) ? null : item.FlightId) ??
          (item.SegmentId && returnTripFlightId && String(item.SegmentId) === String(returnTripFlightId) ? null : item.SegmentId) ??
          item.flightId ??
          item.segmentId ??
          segBySectorFlightId ??
          segByIndexFlightId ??
          outboundTripFlightId ??
          0;
      }

      return {
        Key: String(segId),
        Code: ssrCode,
        TripType: isReturnItem ? 1 : (Number(item.TripType) || 0),
        Amount: Number(item.Amount ?? item.Total_Amount ?? 0),
        Description: item.Description ?? item.Name ?? "",
        ...(item.Sector && { Sector: item.Sector }),
        ...(item.IsEmdRequired && { IsEmdRequired: true }),
        ...(item.IsParameterRequired && { IsParameterRequired: true }),
      };
    };

    // Build a flat ordered list of pax (Adults first, then Childs — no Infants for seats)
    const paxList = [
      ...travellers.Adults.map((t) => ({ t, key: "Adults" })),
      ...travellers.Childs.map((t) => ({ t, key: "Childs" })),
    ];

    Object.entries(travellers).forEach(([key, group]) => {
      group.forEach((t) => {
        const paxType = mapPaxType(key);

        // Find the global index of this traveller in the paxList (Adults+Childs order)
        const globalPaxIndex = paxList.findIndex((p) => p.t === t);

        // Find all seats selected for this passenger across all flight segments
        let paxSeats = [];
        const segmentIndices = Object.keys(seatsBySegment);
        if (segmentIndices.length > 0) {
          segmentIndices.forEach((segIdx) => {
            const segList = seatsBySegment[segIdx] || [];
            const matchingSeat = segList.find(
              (s) => Number(s.paxIndex) === globalPaxIndex
            );
            if (matchingSeat) {
              paxSeats.push(matchingSeat);
            }
          });
        } else if (storedSeatDetails.length > 0 && paxList.length === 1 && globalPaxIndex === 0) {
          paxSeats = storedSeatDetails;
        }

        let seatSSRs = paxSeats.map((seatObj) => {
          const raw = seatObj.raw || seatObj;
          const seatNum = raw.SeatNo ?? raw.SeatCode ?? seatObj.number ?? "";
          const seatCode = raw.Key ?? raw.SSRKey ?? seatObj.SSRKey ?? seatObj.Key ?? seatNum ?? "";
          const segIdx = seatObj.segmentIndex !== undefined ? Number(seatObj.segmentIndex) : 0;
          const targetSeg = allFlightSegments[segIdx];
          
          const tripType = targetSeg?.tripIndex !== undefined
            ? targetSeg.tripIndex
            : (raw.TripType !== undefined ? raw.TripType : 0);
          const isReturnSeat = Number(tripType) === 1 || Number(tripType) > 0;

          const returnTripObj = fareReviewData?.TripInfo?.[1];
          const returnTripFlightId =
            returnTripObj?.FlightDetailResponses?.[0]?.FlightId ||
            returnTripObj?.FlightDetailResponses?.[0]?.flightId ||
            returnTripObj?.FlightDetailResponses?.[0]?.SegmentId ||
            returnTripObj?.FlightId ||
            returnTripObj?.flightId;

          const outboundTripObj = fareReviewData?.TripInfo?.[0];
          const outboundTripFlightId =
            outboundTripObj?.FlightDetailResponses?.[0]?.FlightId ||
            outboundTripObj?.FlightDetailResponses?.[0]?.flightId ||
            outboundTripObj?.FlightDetailResponses?.[0]?.SegmentId ||
            outboundTripObj?.FlightId ||
            FlightId ||
            0;

          let segFlightId;
          if (isReturnSeat) {
            segFlightId =
              (targetSeg?.FlightId && String(targetSeg.FlightId) !== String(outboundTripFlightId) ? targetSeg.FlightId : null) ||
              (targetSeg?.flightId && String(targetSeg.flightId) !== String(outboundTripFlightId) ? targetSeg.flightId : null) ||
              (seatObj.FlightId && String(seatObj.FlightId) !== String(outboundTripFlightId) ? seatObj.FlightId : null) ||
              (raw.FlightId && String(raw.FlightId) !== String(outboundTripFlightId) ? raw.FlightId : null) ||
              (raw.SegmentId && String(raw.SegmentId) !== String(outboundTripFlightId) ? raw.SegmentId : null) ||
              targetSeg?.SegmentId ||
              returnTripFlightId ||
              0;
          } else {
            segFlightId =
              targetSeg?.FlightId ||
              targetSeg?.flightId ||
              seatObj.FlightId ||
              seatObj.flightId ||
              raw.FlightId ||
              raw.flightId ||
              raw.SegmentId ||
              raw.segmentId ||
              outboundTripFlightId ||
              0;
          }

          return {
            Key: String(segFlightId),
            Code: seatCode,
            TripType: Number(tripType) || 0,
            Amount: Number(raw.Amount ?? raw.Total_Amount ?? seatObj.price ?? 0),
            Description: raw.SeatClass ?? seatObj.classType ?? seatNum ?? "Seat",
            ...(raw.IsEmdRequired && { IsEmdRequired: true }),
            ...(raw.IsParameterRequired && { IsParameterRequired: true }),
          };
        });

        const baggageSSRs = (t.selectedBaggage ?? []).map(mapSSRItem).filter(Boolean);
        const mealSSRs = (t.selectedMeals ?? []).map(mapSSRItem).filter(Boolean);

        const ssrBaggageFlag = baggageSSRs.length > 0;
        const ssrMealFlag = mealSSRs.length > 0;
        const ssrSeatFlag = seatSSRs.length > 0;

        const returnBaggageFlag = (t.selectedBaggage ?? []).some(
          (b) => Number(b.TripType) === 1 || Number(b.tripIndex) === 1 || Number(b.TripType) > 0 || Number(b.tripIndex) > 0 || b.isReturn
        ) || baggageSSRs.some((b) => Number(b.TripType) === 1 || Number(b.TripType) > 0);

        const returnMealFlag = (t.selectedMeals ?? []).some(
          (m) => Number(m.TripType) === 1 || Number(m.tripIndex) === 1 || Number(m.TripType) > 0 || Number(m.tripIndex) > 0 || m.isReturn
        ) || mealSSRs.some((m) => Number(m.TripType) === 1 || Number(m.TripType) > 0);

        const returnSeatFlag = seatSSRs.some((s) => Number(s.TripType) === 1 || Number(s.TripType) > 0);

        const entry = {
          Title: mapTitle(t.gender, paxType),
          FirstName: (t.firstName || "").trim().toUpperCase(),
          LastName: (t.lastName || "").trim().toUpperCase(),
          PaxType: paxType,
          ...(ssrBaggageFlag && { SSRBaggageInfosFlag: true, SSRBaggageInfos: baggageSSRs }),
          ...(ssrMealFlag && { SSRMealInfosFlag: true, SSRMealInfos: mealSSRs }),
          ...(ssrSeatFlag && { SSRSeatInfosFlag: true, SSRSeatInfos: seatSSRs }),
          ...(returnBaggageFlag && { ReturnSSRBaggageInfosFlag: true }),
          ...(returnMealFlag && { ReturnSSRMealInfosFlag: true }),
          ...(returnSeatFlag && { ReturnSSRSeatInfosFlag: true }),
        };

        if (t.dob) entry.DateOfBirth = t.dob;
        if (isPassportSectionVisible || isIntl) {
          if (t.passportNumber) entry.PassportNumber = t.passportNumber;
          if (t.passportNationality) entry.PassportNationality = t.passportNationality.toUpperCase();
          if (t.passportExpiry) entry.PassportExpiryDate = t.passportExpiry;
          if (t.passportIssued) entry.PasssportIssuedDate = t.passportIssued;
        }

        list.push(entry);
      });
    });

    const hasAnyReturnSeat = list.some((trav) => trav.ReturnSSRSeatInfosFlag) || storedSeatDetails.some((seat) => {
      const segIdx = seat.segmentIndex !== undefined ? Number(seat.segmentIndex) : 0;
      const targetSeg = allFlightSegments[segIdx];
      return (targetSeg?.tripIndex !== undefined && targetSeg.tripIndex > 0) || Number(seat.raw?.TripType) > 0 || Number(seat.TripType) > 0;
    });
    const hasAnyReturnBaggage = list.some((trav) => trav.ReturnSSRBaggageInfosFlag);
    const hasAnyReturnMeal = list.some((trav) => trav.ReturnSSRMealInfosFlag);

    const bookingKey = fareReviewData?.BookingKey ?? "";
    const flightKeys = fareReviewData?.FlightKeyList ?? [];
    const travelType = bookingStore.get().travelType ?? (isIntl ? 1 : 0);
    const vendor = fareReviewData?.TripInfo?.[0]?.Vendor ?? fareReviewData?.Vendor ?? "";
    const pgTxnId = customPgTxnId || bookingStore.get().pgTransactionId || bookingStore.get().PGTransactionId;

    const hasGstInfo =
      isGstApplicable &&
      (isGstMandatory || useGst) &&
      Boolean(gstDetails.gstNumber?.trim() || gstDetails.registeredName?.trim());

    return {
      Vendor: vendor,
      TravelType: travelType,
      FlightKeys: flightKeys,
      BookingKey: bookingKey,
      PaymentInfoList: [
        {
          BookingAmount: totalFare + Number(totalBaggageMealSeatAmount), //replace with amountToPay
        },
      ],
      TravellerInfoList: list,
      DeliveryInfo: {
        Emails: contactDetails.email?.trim() ? [contactDetails.email.trim()] : [],
        Contacts: contactDetails.mobile?.trim() ? [contactDetails.mobile.trim()] : [],
      },
      ...(hasGstInfo
        ? {
          GstInfo: {
            gstNumber: (gstDetails.gstNumber || "").trim().toUpperCase(),
            email: (gstDetails.email || "").trim(),
            registeredName: (gstDetails.registeredName || "").trim(),
            mobile: String(gstDetails.mobile) || "",
            address: (gstDetails.address || "").trim(),
          },
        }
        : {}),
      ...(pgTxnId && Number(pgTxnId) !== 0
        ? {
          PGTransactionId: pgTxnId,
          IsPgTransactionId: true,
          isPgTransactionId: true,
        }
        : {}),
      PaymentFlag: true,
      GstInFlag: hasGstInfo ? true : false,
      ...(hasAnyReturnBaggage && { ReturnSSRBaggageInfosFlag: true }),
      ...(hasAnyReturnMeal && { ReturnSSRMealInfosFlag: true }),
      ...(hasAnyReturnSeat && { ReturnSSRSeatInfosFlag: true })
    };
  };

  // ─── Flight Booking Mutation ──────────────────────────────────────────────────
  const bookingMutation = useMutation({
    mutationFn: async () => {
      const payload = getBookingPayload();

      let res;
      try {
        res = await api.post("/flight/InstantBooking", payload);
      } catch (axiosErr) {
        const apiMsg =
          axiosErr?.response?.data?.ErrorMessage ||
          axiosErr?.response?.data?.errorMessage ||
          axiosErr?.response?.data?.message ||
          axiosErr?.response?.data?.Message ||
          axiosErr?.message ||
          "Booking failed. Please try again.";
        throw new Error(apiMsg);
      }

      if (!res.data?.IsSuccess) {
        const errMsg =
          res.data?.ErrorMessage ||
          res.data?.errorMessage ||
          res.data?.message ||
          res.data?.Message ||
          "Booking failed. Please try again.";
        throw new Error(errMsg);
      }

      return res.data;
    },
    onSuccess: (data) => {
      // Clear booking session & localStorage on successful booking
      bookingStore.reset();
      localStorage.removeItem("skyvoo_booking");
      sessionStorage.removeItem("skyvoo_booking");
      localStorage.removeItem("skyvoo_pending_booking_payload");
      localStorage.removeItem("skyvoo_pg_txn_id");

      const bookingData = data?.Data;
      let bookingId = "";
      let bookingStatus = "S";
      try {
        const raw = bookingData?.BookingResponse;
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        bookingId = parsed?.Order?.BookingId || "";
        bookingStatus = parsed?.Order?.BookingStatus || "S";
      } catch {
        // fallback
      }

      const txId = bookingData?.TransactionId || bookingData?.FlightTransactionId || "";
      const vendor = bookingData?.Vendor || "AF";

      window.location.href = `/booking-details?TransactionId=${txId}&BookingId=${encodeURIComponent(bookingId)}&BookingStatus=${encodeURIComponent(bookingStatus)}&Vendor=${encodeURIComponent(vendor)}`;
    },
    onError: (err) => {
      setIsDisclaimerModalOpen(false);
      const rawMsg = String(err?.message || "").trim();
      const isQueued = /^(queued|queue|pending|booking is queued|booking is pending)$/i.test(rawMsg);
      if (isQueued) {
        setErrorTitle("Booking Pending");
        setErrorType("warning");
        setErrorMessage(
          rawMsg || "Your booking is in pending state. Please check your bookings after some time."
        );
        setErrorAction({
          text: "Go to My Bookings",
          onClick: () => navigate("/my-bookings"),
        });
      } else {
        setErrorTitle("Booking Failed");
        setErrorType("error");
        setErrorMessage(rawMsg || "Booking failed. Please try again.");
        setErrorAction(null);
      }
    },
  });

  const validateForm = () => {
    if (travellers.Adults.length < Adults) return false;
    if (travellers.Childs.length < Childs) return false;
    if (travellers.Infants.length < Infants) return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Contact Details Validation
    if (
      !contactDetails.mobile?.trim() ||
      contactDetails.mobile.replace(/\D/g, "").length !== 10 ||
      !contactDetails.email?.trim() ||
      !emailRegex.test(contactDetails.email.trim())
    ) {
      return false;
    }

    for (let i = 0; i < travellers.Adults.length; i++) {
      const a = travellers.Adults[i];
      if (
        getTravellerNameError(a.firstName, "First & Middle Name") ||
        getTravellerNameError(a.lastName, "Last Name") ||
        (isAdultDobRequired && getAdultDobError(a.dob)) ||
        getTravellerPassportError(a)
      ) {
        return false;
      }
    }

    for (let i = 0; i < travellers.Childs.length; i++) {
      const c = travellers.Childs[i];
      if (
        getTravellerNameError(c.firstName, "First & Middle Name") ||
        getTravellerNameError(c.lastName, "Last Name") ||
        (isChildDobRequired && getChildDobError(c.dob)) ||
        getTravellerPassportError(c)
      ) {
        return false;
      }
    }

    for (let i = 0; i < travellers.Infants.length; i++) {
      const inf = travellers.Infants[i];
      if (
        getTravellerNameError(inf.firstName, "First & Middle Name") ||
        getTravellerNameError(inf.lastName, "Last Name") ||
        getTravellerNameError(inf.accompanyingAdult, "Accompanying Adult Name") ||
        (isInfantDobRequired && getInfantDobError(inf.dob)) ||
        getTravellerPassportError(inf)
      ) {
        return false;
      }
    }

    // GST validation
    if (isGstApplicable) {
      if (isGstMandatory) {
        if (
          !gstDetails.gstNumber?.trim() ||
          !gstDetails.registeredName?.trim() ||
          !gstDetails.email?.trim() ||
          !gstDetails.mobile?.toString().trim() ||
          !gstDetails.address?.trim()
        ) {
          return false;
        }
        if (!emailRegex.test(gstDetails.email.trim())) {
          return false;
        }
        if (gstDetails.gstNumber.trim().length !== 15) {
          return false;
        }
      } else if (useGst) {
        if (!gstDetails.gstNumber?.trim() || !gstDetails.registeredName?.trim()) {
          return false;
        }
        if (gstDetails.gstNumber.trim().length !== 15) {
          return false;
        }
        if (gstDetails.email?.trim() && !emailRegex.test(gstDetails.email.trim())) {
          return false;
        }
      }
    }

    return true;
  };

  const handleContinue = () => {
    // If not logged in, show login modal instead
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    // If price changed and not acknowledged yet, open FareAlertModal
    if (fareAlert && !hasUserAcceptedFareAlert) {
      setIsFareAlertModalOpen(true);
      return;
    }
    setShowValidationErrors(true);
    if (!validateForm()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isContactInvalid =
        !contactDetails.mobile?.trim() ||
        contactDetails.mobile.replace(/\D/g, "").length !== 10 ||
        !contactDetails.email?.trim() ||
        !emailRegex.test(contactDetails.email.trim());

      const isGstInvalid =
        isGstApplicable &&
        ((isGstMandatory && (!gstDetails.gstNumber?.trim() || !gstDetails.registeredName?.trim() || !gstDetails.email?.trim() || !gstDetails.mobile?.toString().trim() || !gstDetails.address?.trim() || gstDetails.gstNumber.trim().length !== 15)) ||
          (useGst && (!gstDetails.gstNumber?.trim() || !gstDetails.registeredName?.trim() || gstDetails.gstNumber.trim().length !== 15)));

      let areTravellersInvalid = false;
      for (const a of travellers.Adults) {
        if (
          getTravellerNameError(a.firstName, "First & Middle Name") ||
          getTravellerNameError(a.lastName, "Last Name") ||
          (isAdultDobRequired && getAdultDobError(a.dob)) ||
          getTravellerPassportError(a)
        ) {
          areTravellersInvalid = true;
          break;
        }
      }
      if (!areTravellersInvalid) {
        for (const c of travellers.Childs) {
          if (
            getTravellerNameError(c.firstName, "First & Middle Name") ||
            getTravellerNameError(c.lastName, "Last Name") ||
            (isChildDobRequired && getChildDobError(c.dob)) ||
            getTravellerPassportError(c)
          ) {
            areTravellersInvalid = true;
            break;
          }
        }
      }
      if (!areTravellersInvalid) {
        for (const inf of travellers.Infants) {
          if (
            getTravellerNameError(inf.firstName, "First & Middle Name") ||
            getTravellerNameError(inf.lastName, "Last Name") ||
            getTravellerNameError(inf.accompanyingAdult, "Accompanying Adult Name") ||
            (isInfantDobRequired && getInfantDobError(inf.dob)) ||
            getTravellerPassportError(inf)
          ) {
            areTravellersInvalid = true;
            break;
          }
        }
      }

      if (areTravellersInvalid) {
        handleScroll("traveller-details");
      } else if (isContactInvalid) {
        handleScroll("contact-details");
      } else if (isGstInvalid) {
        handleScroll("gst-details");
      }
      return;
    }
    setIsDisclaimerModalOpen(true);
  };

  useEffect(() => {
    const sections = [
      "flight-summary",
      "traveller-details",
      "contact-details",
      "seats-section",
      "gst-details",
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveTab(entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px" },
    );

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

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

  // ─── Parse booking result for display ───────────────────────────────────────
  const parsedBooking = bookingResult?.parsed;
  const order = parsedBooking?.Order;
  const airInfo = parsedBooking?.ItemInfos?.AIR;
  const tripInfos = airInfo?.TripInfos ?? [];
  const bookingTravellers = airInfo?.TravellerInfoList ?? [];

  if (loadingFareReview || (!fareReviewData && !fareReviewError)) {
    return <ReviewDetailsSkeleton />;
  }

  if (fareReviewError && !fareReviewData) {
    const errorMsg =
      fareReviewError?.message ||
      "An unexpected error occurred while reviewing the flight details.";

    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 text-[#78080B] flex items-center justify-center mb-4 border border-red-100 shadow-sm">
          <ShieldAlert className="w-8 h-8 text-[#78080B]" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">Unable to Load Flight Details</h2>
        <p className="max-w-lg text-sm text-slate-600 bg-red-50/80 border border-red-100 rounded-xl px-4 py-3 mb-6 leading-relaxed">
          {errorMsg}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-[#78080B] text-white text-sm font-semibold rounded-lg hover:bg-[#8F0306] transition shadow-sm cursor-pointer"
          >
            Retry
          </button>
          <button
            onClick={() => navigate("/flight-results")}
            className="px-5 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition cursor-pointer"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ErrorModal
        open={!!errorMessage}
        onClose={() => {
          setErrorMessage("");
          setErrorAction(null);
        }}
        title={errorTitle}
        message={errorMessage}
        type={errorType}
        actionText={errorAction?.text}
        onAction={errorAction?.onClick}
      />
      {/* ── Booking Confirmation Modal ── */}
      {isBookingModalOpen && bookingResult && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsBookingModalOpen(false); }}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{ animation: "modalSlideIn 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
          >
            <style>{`
              @keyframes modalSlideIn {
                from { opacity: 0; transform: translateY(40px) scale(0.95); }
                to   { opacity: 1; transform: translateY(0) scale(1); }
              }
              @keyframes checkPop {
                0%   { transform: scale(0) rotate(-30deg); opacity: 0; }
                70%  { transform: scale(1.2) rotate(5deg); opacity: 1; }
                100% { transform: scale(1) rotate(0deg); opacity: 1; }
              }
            `}</style>

            {/* Header */}
            <div className="bg-gradient-to-r from-[#78080B] to-[#a01014] rounded-t-2xl px-6 py-6 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="absolute rounded-full bg-white" style={{ width: `${60 + i * 20}px`, height: `${60 + i * 20}px`, top: `${-20 + i * 10}px`, right: `${-10 + i * 15}px`, opacity: 0.5 }} />
                ))}
              </div>
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-4">
                <div style={{ animation: "checkPop 0.5s 0.2s both" }}>
                  <CheckCircle2 className="w-14 h-14 text-green-300" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-green-200 text-sm font-medium uppercase tracking-wider mb-0.5">Booking Confirmed</p>
                  <h2 className="text-2xl font-bold">{order?.BookingStatus ?? "CONFIRMED"}</h2>
                  {order?.BookingId && (
                    <p className="text-white/80 text-sm mt-1">
                      Booking ID: <span className="font-bold text-white">{order.BookingId}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Total Amount Paid</p>
                  <p className="text-2xl font-bold text-[#78080B]">
                    ₹ {(order?.Amount ?? 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Booking Date</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {order?.BookingCreatedOn
                      ? (() => {
                        const d = new Date(order.BookingCreatedOn);
                        if (isNaN(d)) return order.BookingCreatedOn;
                        const dd = String(d.getDate()).padStart(2, "0");
                        const mm = String(d.getMonth() + 1).padStart(2, "0");
                        const yyyy = d.getFullYear();
                        return `${dd}-${mm}-${yyyy} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
                      })()
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Flight Segments */}
              {tripInfos.map((trip, tIdx) => {
                const segments = trip.SegmentList ?? [];
                return (
                  <div key={tIdx} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-800 px-4 py-2.5 flex items-center gap-2">
                      <Plane className="w-4 h-4 text-white" />
                      <span className="text-white text-sm font-semibold">Flight Route</span>
                    </div>
                    {segments.map((seg, sIdx) => {
                      const airline = seg.fD?.aI;
                      const dep = seg.da;
                      const arr = seg.aa;
                      const durationMins = seg.duration ?? 0;
                      const dHrs = Math.floor(durationMins / 60);
                      const dMins = durationMins % 60;
                      // PNR from first traveller
                      const firstTravPnr = bookingTravellers[0]?.PnrDetails;
                      const segKey = `${dep?.code}-${arr?.code}`;
                      const pnr = firstTravPnr?.[segKey] ?? "—";

                      // ── Connection Time Calculation ──
                      let connectionBanner = null;
                      if (sIdx > 0) {
                        const prevSeg = segments[sIdx - 1];
                        const prevArrDate = parseSegDateTime(prevSeg.at);
                        const curDepDate = parseSegDateTime(seg.dt);

                        if (prevArrDate && curDepDate) {
                          const diffMs = curDepDate - prevArrDate;
                          if (diffMs > 0) {
                            const diffMins = Math.round(diffMs / 60000);
                            const h = Math.floor(diffMins / 60);
                            const m = diffMins % 60;
                            const connectionTimeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
                            const connectionCity = prevSeg.aa?.city || prevSeg.aa?.name || "";

                            connectionBanner = (
                              <div className="px-4 py-2">
                                <div className="flex items-center gap-2 my-2">
                                  <div className="flex-1 border-t border-dashed border-orange-300" />
                                  <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="w-3.5 h-3.5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth={2}
                                    >
                                      <circle cx="12" cy="12" r="9" />
                                      <path d="M12 7v5l3 3" />
                                    </svg>
                                    Layover at {connectionCity}: {connectionTimeStr}
                                  </div>
                                  <div className="flex-1 border-t border-dashed border-orange-300" />
                                </div>
                              </div>
                            );
                          }
                        }
                      }

                      return (
                        <div key={sIdx}>
                          {connectionBanner}
                          <div className={`px-4 py-4 ${sIdx > 0 && !connectionBanner ? "border-t border-slate-100" : ""}`}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 text-sm">{airline?.name}</span>
                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{airline?.code} {seg.fD?.fN}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs text-slate-500">PNR: </span>
                                <span className="text-sm font-bold text-[#78080B]">{pnr}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-center">
                                <p className="text-xl font-bold text-slate-800">{dep?.code || dep?.cityCode || dep?.city || dep?.name || '—'}</p>
                                <p className="text-xs text-slate-500">{dep?.name || dep?.city}</p>
                                <p className="text-xs font-medium text-slate-700">{seg.dt?.split(" ")[1]}</p>
                                <p className="text-xs text-slate-400">{seg.dt?.split(" ")[0]}</p>
                                {dep?.terminal && <p className="text-xs text-slate-400 mt-0.5">{dep.terminal}</p>}
                              </div>
                              <div className="flex-1 flex flex-col items-center gap-1">
                                <div className="text-xs text-slate-400">{dHrs > 0 ? `${dHrs}h ` : ""}{dMins}m</div>
                                <div className="w-full flex items-center gap-1">
                                  <div className="h-px flex-1 bg-slate-300" />
                                  <Plane className="w-3 h-3 text-slate-400" />
                                  <div className="h-px flex-1 bg-slate-300" />
                                </div>
                                <div className="text-xs text-slate-400">{seg.stops === 0 ? "Non-stop" : `${seg.stops} stop`}</div>
                              </div>
                              <div className="text-center">
                                <p className="text-xl font-bold text-slate-800">{arr?.code || arr?.cityCode || arr?.city || arr?.name || '—'}</p>
                                <p className="text-xs text-slate-500">{arr?.name || arr?.city}</p>
                                <p className="text-xs font-medium text-slate-700">{seg.at?.split(" ")[1]}</p>
                                <p className="text-xs text-slate-400">{seg.at?.split(" ")[0]}</p>
                                {arr?.terminal && <p className="text-xs text-slate-400 mt-0.5">{arr.terminal}</p>}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Travellers */}
              {bookingTravellers.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-800 px-4 py-2.5 flex items-center gap-2">
                    <User className="w-4 h-4 text-white" />
                    <span className="text-white text-sm font-semibold">Travellers</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {bookingTravellers.map((t, tIdx) => {
                      const pnrEntries = Object.entries(t.PnrDetails ?? {});
                      const statusEntries = Object.entries(t.StatusMap ?? {});
                      return (
                        <div key={tIdx} className="px-4 py-3 flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">
                              {t.Title} {t.FirstName} {t.LastName}
                            </p>
                            <p className="text-xs text-slate-500">{t.PaxType} · DOB: {t.DateOfBirth}</p>
                          </div>
                          <div className="text-right shrink-0">
                            {pnrEntries.map(([route, pnr]) => (
                              <p key={route} className="text-xs text-slate-600">
                                <span className="text-slate-400">{route}:</span> <span className="font-bold text-[#78080B]">{pnr}</span>
                              </p>
                            ))}
                            {statusEntries.map(([route, status]) => (
                              <p key={route} className="text-xs">
                                {/* <span className={`font-semibold ${status === "CONFIRMED" ? "text-green-600" : "text-orange-500"}`}>{status}</span> */}
                              </p>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Delivery Info */}
              {order?.DeliveryInfo && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm">
                  <p className="text-blue-700 font-semibold mb-1">Confirmation sent to:</p>
                  {order.DeliveryInfo.Emails?.map((e) => (
                    <p key={e} className="text-blue-600">{e}</p>
                  ))}
                  {order.DeliveryInfo.Contacts?.map((c) => (
                    <p key={c} className="text-blue-600">{c}</p>
                  ))}
                </div>
              )}

              {/* Transaction ID */}
              {bookingResult?.raw?.Data?.TransactionId && (
                <p className="text-xs text-slate-400 text-center">
                  Transaction ID: {bookingResult.raw.Data.TransactionId}
                </p>
              )}

              {/* Close Button */}
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="w-full bg-[#78080B] hover:bg-[#a01014] text-white font-semibold py-3 rounded-xl transition-all duration-200 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {isFareModalOpen && (
        <Suspense fallback={null}>
          <Modal
            open={isFareModalOpen}
            onClose={() => setIsFareModalOpen(false)}
            title="Fare Rules"
          >
            {Array.isArray(fareRuleData) && fareRuleData.length > 0 ? (
              <div className="space-y-4 text-sm">
                {fareRuleData.map((rule, idx) => {
                  const { isHtml, content } = formatFareRule(
                    rule.FareRuleDescription,
                  );

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
      )}

      {isFlightSeatMap && (
        <Suspense fallback={null}>
          {(() => {
            const targetSeg = allFlightSegments[targetSeatSegmentIndex] || allFlightSegments[0];
            const currentSegInitialDetails = (selectedSeatDetails || [])
              .filter((s) => (s.segmentIndex !== undefined ? Number(s.segmentIndex) : 0) === targetSeatSegmentIndex)
              .map((s) => ({ ...s, segmentIndex: 0 }));
            const currentSegInitialSeats = currentSegInitialDetails.map((s) => s.number || s.SeatNo || s.code).filter(Boolean);

            return (
              <FlightSeatMap
                key={`flight-seat-map-segment-${targetSeatSegmentIndex}`}
                onClose={() => setIsFlightSeatMap(false)}
                flightLegs={targetSeg ? [targetSeg] : (allFlightSegments.length > 0 ? [allFlightSegments[0]] : FlightsDepartureAndArrivalDetails)}
                onSeatsContinue={handleSeatsContinue}
                initialSelectedSeats={currentSegInitialSeats}
                initialSelectedSeatDetails={currentSegInitialDetails}
                initialFlightIndex={0}
                paxCounts={{ Adults, Childs, Infants }}
                passengers={travellers}
              />
            );
          })()}
        </Suspense>
      )}

      {isTripBenefitsModal && (
        <TripBenefitsModal onClose={() => setIsTripBenefitsModal(false)} />
      )}

      {isTicketDetailsReviewModal && (
        <TicketDetailsReviewModal
          onClose={() => setIsTicketDetailsReviewModal(false)}
        />
      )}

      {isBaggageModal && (
        <BaggageModal
          onClose={() => {
            setIsBaggageModal(false);
            setBaggageTarget(null);
          }}
          travellerInfo={baggageTarget}
          initialSelectedBaggage={
            baggageTarget
              ? travellers[baggageTarget.category]?.[baggageTarget.index]?.selectedBaggage || []
              : []
          }
          onSave={handleSaveBaggage}
          trips={allTripBaggageData}
          baggageList={TripBaggageData}
          routeLabel={(() => {
            const trip = fareReviewData?.TripInfo?.[0];
            const first = trip?.FlightDetailResponses?.[0];
            const last =
              trip?.FlightDetailResponses?.[
              trip.FlightDetailResponses.length - 1
              ];
            if (!first) return "";
            const dep =
              first.AirlineDeparture?.city ||
              first.AirlineDeparture?.code ||
              "";
            const arr =
              last?.AirlineArrival?.city || last?.AirlineArrival?.code || "";
            return dep && arr ? `${dep} → ${arr}` : "";
          })()}
        />
      )}

      {isMealModal && (
        <MealModal
          onClose={() => {
            setIsMealModal(false);
            setMealTarget(null);
          }}
          travellerInfo={mealTarget}
          initialSelectedMeals={
            mealTarget
              ? travellers[mealTarget.category]?.[mealTarget.index]?.selectedMeals || []
              : []
          }
          onSave={handleSaveMeals}
          segments={allTripMealData}
          mealList={TripMealData}
          routeLabel={(() => {
            const trip = fareReviewData?.TripInfo?.[0];
            const first = trip?.FlightDetailResponses?.[0];
            const last =
              trip?.FlightDetailResponses?.[
              trip.FlightDetailResponses.length - 1
              ];
            if (!first) return "";
            const dep =
              first.AirlineDeparture?.city ||
              first.AirlineDeparture?.code ||
              "";
            const arr =
              last?.AirlineArrival?.city || last?.AirlineArrival?.code || "";
            return dep && arr ? `${dep} → ${arr}` : "";
          })()}
        />
      )}

      {/* Coupons Filters Drawer */}
      {isViewAllCouponsModal && (
        <ViewAllCouponsModal onClose={() => setIsViewAllCouponsModal(false)} />
      )}

      <div className="min-h-screen relative">
        {/* Header */}
        <div
          className="bg-[#78080B] text-white py-6 px-4 relative z-10"
          style={{ boxShadow: " 0px 4px 4px 0px rgba(0, 0, 0, 0.25)" }}
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-bold">
              Complete your booking
            </h1>
            <div className="hidden lg:flex gap-6 text-sm font-medium">
              <span
                className="cursor-pointer text-slate-300 hover:text-white transition"
                onClick={() => handleScroll("flight-summary")}
              >
                Flights Summary
              </span>
              <span
                className="cursor-pointer text-slate-300 hover:text-white transition"
                onClick={() => handleScroll("traveller-details")}
              >
                Traveller Details
              </span>
              <span
                className="cursor-pointer text-slate-300 hover:text-white transition"
                onClick={() => handleScroll("contact-details")}
              >
                Contact Details
              </span>
              {isSeatAllowed && (
                <span
                  className="cursor-pointer text-slate-300 hover:text-white transition"
                  onClick={() => handleScroll("seats-section")}
                >
                  Seats
                </span>
              )}
            </div>
          </div>

          <div className="flex mt-1 lg:hidden gap-2 overflow-x-auto no-scrollbar scrollbar-hide text-sm whitespace-nowrap px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {[
              ["flight-summary", "Flights Summary"],
              ["traveller-details", "Traveller Details"],
              ["contact-details", "Contact Details"],
              ...(isSeatAllowed ? [["seats-section", "Seats"]] : []),
            ].map(([id, label]) => {
              const isActive = activeTab === id;

              return (
                <button
                  key={id}
                  onClick={() => handleTabClick(id)}
                  className={`px-4 py-1 rounded-full transition-all duration-200 flex-shrink-0 ${isActive ? "bg-white text-[#78080B] font-semibold shadow-sm" : "text-slate-300 hover:text-white hover:bg-white/10"} `}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative z-20 pb-14 sm:pb-10 bg-cover bg-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
              {/* Main Content */}
              <div className="order-1 lg:order-1 lg:col-span-3 space-y-4 sm:space-y-6">
                {/* Flight Details Card */}
                <div
                  id="flight-summary"
                  className="bg-white rounded-lg shadow-sm border border-slate-200"
                >
                  <div className="p-2 sm:p-4">
                    {loadingFareReview ? (
                      <div className="p-8 text-center text-slate-500 text-sm">
                        Loading flight details…
                      </div>
                    ) : fareReviewError ? (
                      <div className="p-6 text-center text-red-600 text-sm">
                        {fareReviewError.message}
                      </div>
                    ) : (
                      (() => {
                        // Flatten all trips — render one card per TripInfo entry
                        const trips = fareReviewData?.TripInfo ?? [];
                        if (trips.length === 0)
                          return (
                            <div className="p-6 text-center text-slate-500 text-sm">
                              No flight data available.
                            </div>
                          );
                        return trips.map((trip, tripIdx) => {
                          const legs = trip.FlightDetailResponses ?? [];
                          const first = legs[0];
                          const last = legs[legs.length - 1];
                          if (!first) return null;

                          const depCity =
                            first.AirlineDeparture?.city ||
                            first.AirlineDeparture?.code ||
                            "—";
                          const arrCity =
                            last?.AirlineArrival?.city ||
                            last?.AirlineArrival?.code ||
                            "—";
                          const depAirport = first.AirlineDeparture?.name || "";
                          const arrAirport = last?.AirlineArrival?.name || "";
                          const depTerminal = first.AirlineDeparture?.terminal
                            ? ` T${first.AirlineDeparture.terminal}`
                            : "";
                          const arrTerminal = last?.AirlineArrival?.terminal
                            ? ` T${last.AirlineArrival.terminal}`
                            : "";
                          const stopsCount = legs.length > 1 ? legs.length - 1 : (typeof first.Stops === "number" ? first.Stops : 0);
                          const layovers = getFlightLayoverAirports(legs);
                          const stops = formatStopsWithLayovers(stopsCount, layovers);

                          let duration = trip.AirlineDuration || "";
                          if (!duration && legs.length > 1 && first && last) {
                            try {
                              let startDT = null;
                              let endDT = null;
                              if (first.DepartureDate && first.DepartureTime) {
                                startDT = new Date(`${first.DepartureDate.split("T")[0]}T${first.DepartureTime}`);
                              }
                              if (last.ArrivalDate && last.ArrivalTime) {
                                endDT = new Date(`${last.ArrivalDate.split("T")[0]}T${last.ArrivalTime}`);
                              }
                              if (startDT && endDT && !isNaN(startDT) && !isNaN(endDT)) {
                                const diffMs = endDT - startDT;
                                if (diffMs > 0) {
                                  const totalMins = Math.round(diffMs / 60000);
                                  const h = Math.floor(totalMins / 60);
                                  const m = totalMins % 60;
                                  duration = `${String(h).padStart(2, "0")}h:${String(m).padStart(2, "0")}m`;
                                }
                              }
                            } catch (_) { }
                          }
                          if (!duration) {
                            if (legs.length > 1) {
                              let totalMin = 0;
                              legs.forEach((l, idx) => {
                                const dStr = l.AirlineDuration || "";
                                const hMatch = dStr.match(/(\d+)\s*h/i);
                                const mMatch = dStr.match(/(\d+)\s*m/i);
                                if (hMatch || mMatch) {
                                  totalMin += (parseInt(hMatch?.[1] || 0, 10) * 60) + parseInt(mMatch?.[1] || 0, 10);
                                }
                                if (idx > 0 && l.ConnectingTime) {
                                  const ct = parseInt(l.ConnectingTime, 10);
                                  if (!isNaN(ct)) totalMin += ct;
                                }
                              });
                              if (totalMin > 0) {
                                const h = Math.floor(totalMin / 60);
                                const m = totalMin % 60;
                                duration = `${String(h).padStart(2, "0")}h:${String(m).padStart(2, "0")}m`;
                              } else {
                                duration = first.AirlineDuration || "";
                              }
                            } else {
                              duration = first.AirlineDuration || "";
                            }
                          }
                          const refundable =
                            trip.Refundable || "NON-Refundable";
                          const fareIdentifier = trip.FareIdentifier || "";
                          const paxAdult = fareReviewData?.PaxInfo?.ADULT;
                          const cabinBag = paxAdult?.HandBag || "7 Kgs";
                          const checkInBag = paxAdult?.CheckingBag
                            ? `${paxAdult.CheckingBag} Kgs`
                            : "15 Kgs";

                          return (
                            <div className="my-2" key={tripIdx}>
                              <div
                                className="p-2"
                                style={{
                                  boxShadow: "0 1px 4px 0 rgba(0, 0, 0, .21)",
                                }}
                              >
                                {/* Route Header */}
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
                                  <div className="flex items-start gap-3">
                                    <div className="w-1 h-16 sm:h-20 bg-blue-500 rounded"></div>
                                    <div>
                                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
                                        {depCity} → {arrCity}
                                      </h2>
                                      <p className="text-xs sm:text-sm text-slate-600 mt-1 flex flex-wrap items-center gap-1.5 font-medium">
                                        <span>{formatDepartureDate(first.DepartureDate)}</span>
                                        <span>·</span>
                                        <span>{stops}</span>
                                        {duration && (
                                          <>
                                            <span>·</span>
                                            <span>{duration}</span>
                                          </>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="self-start lg:self-center bg-[#78080B] text-white text-xs font-semibold px-3 py-1 rounded uppercase">
                                    {refundable}
                                  </span>
                                </div>

                                <button
                                  className="cursor-pointer text-blue-600 text-sm font-medium mb-4"
                                  onClick={() => setIsFareModalOpen(true)}
                                >
                                  View Fare Rules
                                </button>

                                {/* Airline Info */}
                                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 mb-6">

                                  {!isMultipleFlights && (
                                    <div className="flex items-center gap-3 flex-wrap">

                                      <img
                                        src={getAirlineLogo(flight.AirlineCode)}
                                        alt={flight.AirlineName?.split(",")[0] || "Airline"}
                                        className="rounded-full w-8 h-8"
                                      />

                                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                        <span className="font-semibold text-sm">
                                          {first.AirlineName}
                                        </span>
                                        <span className="text-slate-600 text-xs sm:text-sm">
                                          {first.AirlineCode} {first.FlightNo}
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {fareIdentifier && (
                                    <div className="text-sm">
                                      <span className="text-slate-600">
                                        Economy &gt;{" "}
                                      </span>
                                      <span className="text-blue-600 font-semibold">
                                        {fareIdentifier}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Flight Times — supports direct & connecting */}
                                <div className="bg-[#f4f4f4] p-3 sm:p-4">
                                  {legs.map((leg, legIdx) => {
                                    const legDepCity =
                                      leg.AirlineDeparture?.city ||
                                      leg.AirlineDeparture?.code ||
                                      "—";
                                    const legArrCity =
                                      leg.AirlineArrival?.city ||
                                      leg.AirlineArrival?.code ||
                                      "—";
                                    const legDepAirport =
                                      leg.AirlineDeparture?.name || "";
                                    const legArrAirport =
                                      leg.AirlineArrival?.name || "";
                                    const legDepTerminal =
                                      leg.AirlineDeparture?.terminal
                                        ? ` · ${leg.AirlineDeparture.terminal}`
                                        : "";
                                    const legArrTerminal =
                                      leg.AirlineArrival?.terminal
                                        ? ` · ${leg.AirlineArrival.terminal}`
                                        : "";

                                    // ── Layover calculation ──────────────────
                                    let layoverBanner = null;
                                    if (legIdx > 0) {
                                      const prevLeg = legs[legIdx - 1];
                                      let layoverLabel = "";

                                      // Prefer ConnectingTime (in minutes) from current leg
                                      const ctMin = parseInt(
                                        leg.ConnectingTime,
                                        10
                                      );
                                      if (!isNaN(ctMin) && ctMin > 0) {
                                        const h = Math.floor(ctMin / 60);
                                        const m = ctMin % 60;
                                        layoverLabel =
                                          h > 0
                                            ? `${h}h ${m}m`
                                            : `${m}m`;
                                      } else {
                                        // Fallback: compute from prev arrival → current departure
                                        try {
                                          const prevArrDT = new Date(
                                            `${prevLeg.ArrivalDate}T${prevLeg.ArrivalTime}`
                                          );
                                          const curDepDT = new Date(
                                            `${leg.DepartureDate}T${leg.DepartureTime}`
                                          );
                                          const diffMs =
                                            curDepDT - prevArrDT;
                                          if (diffMs > 0) {
                                            const totalMin = Math.round(
                                              diffMs / 60000
                                            );
                                            const h = Math.floor(
                                              totalMin / 60
                                            );
                                            const m = totalMin % 60;
                                            layoverLabel =
                                              h > 0
                                                ? `${h}h ${m}m`
                                                : `${m}m`;
                                          }
                                        } catch (_) { }
                                      }

                                      const layoverCity =
                                        prevLeg.AirlineArrival?.city ||
                                        prevLeg.AirlineArrival?.code ||
                                        "";

                                      layoverBanner = (
                                        <div className="flex items-center gap-2 my-3">
                                          <div className="flex-1 border-t border-dashed border-orange-300" />
                                          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              className="w-3.5 h-3.5"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                              strokeWidth={2}
                                            >
                                              <circle
                                                cx="12"
                                                cy="12"
                                                r="9"
                                              />
                                              <path d="M12 7v5l3 3" />
                                            </svg>
                                            {leg.IsConnecting && "Layover"}
                                            {layoverCity
                                              ? ` in ${layoverCity}`
                                              : ""}
                                            {layoverLabel
                                              ? `: ${layoverLabel}`
                                              : ""}
                                          </div>
                                          <div className="flex-1 border-t border-dashed border-orange-300" />
                                        </div>
                                      );
                                    }

                                    return (
                                      <div key={legIdx}>
                                        {layoverBanner}

                                        {/* Leg segment card */}
                                        <div className="space-y-3">
                                          {/* Airline row for this leg */}
                                          {legs.length > 1 && (
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                              <img
                                                src={AirlineLogo}
                                                alt="airline"
                                                className="w-5 h-5"
                                              />
                                              <span className="font-medium text-slate-700">
                                                {leg.AirlineName}
                                              </span>
                                              <span>
                                                {leg.AirlineCode}{" "}
                                                {leg.FlightNo}
                                              </span>
                                            </div>
                                          )}

                                          {/* Departure */}
                                          <div className="flex gap-4">
                                            <div className="text-xl sm:text-2xl font-bold">
                                              {leg.DepartureTime}
                                            </div>
                                            <div>
                                              <div className="font-semibold text-sm sm:text-base">
                                                {legDepCity}
                                              </div>
                                              <div className="text-xs sm:text-sm text-slate-600">
                                                {legDepAirport}
                                                {legDepTerminal}
                                              </div>
                                            </div>
                                          </div>

                                          {/* Duration indicator */}
                                          <div className="ml-6 border-l-2 border-dashed border-slate-300 pl-4 py-1">
                                            <div className="text-xs sm:text-sm text-slate-600">
                                              {leg.AirlineDuration}
                                            </div>
                                          </div>

                                          {/* Arrival */}
                                          <div className="flex gap-4">
                                            <div className="text-xl sm:text-2xl font-bold">
                                              {leg.ArrivalTime}
                                              {leg.NextDayFlag && (
                                                <sup className="text-xs text-orange-500 font-semibold ml-0.5">
                                                  +1
                                                </sup>
                                              )}
                                            </div>
                                            <div>
                                              <div className="font-semibold text-sm sm:text-base">
                                                {legArrCity}
                                              </div>
                                              <div className="text-xs sm:text-sm text-slate-600">
                                                {legArrAirport}
                                                {legArrTerminal}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                <div className="bg-[#f4f4f4] flex justify-center">
                                  <div className="border-t border-slate-300 w-[95%]"></div>
                                </div>

                                {/* Baggage Info */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-[#f4f4f4] text-xs sm:text-sm">
                                  {/* Cabin Baggage */}
                                  <div className="flex items-center gap-2">
                                    <Luggage className="w-5 h-5 text-slate-600 shrink-0" />

                                    <span>
                                      <strong>Cabin Baggage:</strong> {cabinBag} / Adult
                                    </span>
                                  </div>

                                  {/* Check-In Baggage */}
                                  <div className="flex items-center gap-2">
                                    <Luggage className="w-5 h-5 text-slate-600 shrink-0" />

                                    <span>
                                      <strong>Check-In Baggage:</strong> {checkInBag} / Adult
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()
                    )}
                  </div>

                  {/* Cancellation Policy */}
                </div>

                {/* Important Information */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                  <div className="p-5">
                    <div className="flex items-center mb-4">
                      <h3 className="text-lg font-bold">
                        Important Information
                      </h3>
                    </div>

                    <div className="space-y-4 text-sm text-slate-700">
                      <div>
                        <div className="flex font-bold mb-2">
                          <ShieldAlert className="mr-2 text-red-500" />
                          <p className="">Check-in & Boarding Pass</p>
                        </div>

                        <p>
                          Please complete your web check-in before your flight and keep your boarding pass easily accessible. We recommend arriving at the airport well in advance to allow enough time for security checks and boarding.
                        </p>
                      </div>

                      <div className="my-8">
                        <div className="flex font-bold mb-2">
                          <ShieldAlert className="mr-2 text-red-500 " />
                          <p className="">
                            Baggage Information
                          </p>
                        </div>
                        <p>
                          Baggage allowance may vary depending on the airline, fare type, and route. Please check your booking details for the applicable baggage allowance. Additional baggage or excess weight may incur extra charges.
                        </p>
                      </div>

                      <div>
                        <div className="flex font-bold mb-2">
                          <ShieldAlert className="mr-2 text-red-500" />
                          <p className="">Travel Documents</p>
                        </div>
                        <p>
                          Make sure you carry all required travel documents, including a valid ID and any necessary visa or permit. For international flights, check the entry requirements of your destination before travelling.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Travellers Details */}
                <div
                  id="traveller-details"
                  className="bg-white rounded-lg shadow-sm border border-slate-200"
                >
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-bold">Traveller Details</h3>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-4 text-sm text-orange-800">
                      <span className="font-semibold">Important:</span> Enter
                      name as per passport or Government-approved ID.
                    </div>

                    {/* Render for each category */}
                    {[
                      { label: "Adult", subtitle: "12y+", key: "Adults", limit: Adults },
                      { label: "Child", subtitle: "2y - 12y", key: "Childs", limit: Childs },
                      { label: "Infant", subtitle: "below 2y", key: "Infants", limit: Infants },
                    ]
                      .filter(({ limit }) => limit > 0)
                      .map(({ label, subtitle, key, limit }) => (
                        <div key={key} className="mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-slate-800 flex items-center gap-1.5 flex-wrap">
                              <span>{label} Details</span>
                              <span className="text-xs font-medium text-slate-500">({subtitle} on travel date)</span>
                            </h4>
                            <span className="text-sm text-slate-500">
                              {travellers[key].length}/{limit} added
                            </span>
                          </div>

                          {travellers[key].map((t, i) => (
                            <div
                              key={t.id}
                              className="mb-4 border border-slate-200 rounded-lg p-4 shadow-sm"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <label className="font-semibold">
                                  {label.toUpperCase()} {i + 1}
                                </label>
                                {travellers[key].length > 0 && (
                                  <button
                                    onClick={() => removeTraveller(key, i)}
                                    className="cursor-pointer text-[#78080B] hover:text-red-800 font-semibold flex items-center gap-1 text-sm"
                                  >
                                    <Trash2 className="w-4 h-4" /> Remove
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                <div className="flex flex-col gap-1">
                                  {(() => {
                                    const firstNameError = getTravellerNameError(t.firstName, "First & Middle Name");
                                    const hasFirstNameErr = showValidationErrors && Boolean(firstNameError);
                                    return (
                                      <>
                                        <input
                                          type="text"
                                          placeholder="First & Middle Name"
                                          value={t.firstName}
                                          autoComplete="off"
                                          spellCheck={false}
                                          onChange={(e) =>
                                            handleNameChange(
                                              key,
                                              i,
                                              "firstName",
                                              e.target.value,
                                            )
                                          }
                                          className={`border rounded px-3 py-2 text-sm outline-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${hasFirstNameErr
                                            ? "border-red-500 bg-red-50/20"
                                            : "border-slate-300"
                                            }`}
                                        />
                                        {hasFirstNameErr && (
                                          <span className="text-[11px] text-red-600 font-medium">{firstNameError}</span>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                                <div className="flex flex-col gap-1">
                                  {(() => {
                                    const lastNameError = getTravellerNameError(t.lastName, "Last Name");
                                    const hasLastNameErr = showValidationErrors && Boolean(lastNameError);
                                    return (
                                      <>
                                        <input
                                          type="text"
                                          placeholder="Last Name"
                                          value={t.lastName}
                                          autoComplete="off"
                                          spellCheck={false}
                                          onChange={(e) =>
                                            handleNameChange(
                                              key,
                                              i,
                                              "lastName",
                                              e.target.value,
                                            )
                                          }
                                          className={`border rounded px-3 py-2 text-sm outline-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${hasLastNameErr
                                            ? "border-red-500 bg-red-50/20"
                                            : "border-slate-300"
                                            }`}
                                        />
                                        {hasLastNameErr && (
                                          <span className="text-[11px] text-red-600 font-medium">{lastNameError}</span>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>

                                {/* Gender */}
                                <div className="grid grid-cols-2 gap-2 h-[38px]">
                                  {["MALE", "FEMALE"].map((g) => (
                                    <button
                                      key={g}
                                      type="button"
                                      onClick={() =>
                                        updateTraveller(key, i, "gender", g)
                                      }
                                      className={`w-full h-full flex items-center justify-center rounded border text-sm font-semibold transition-colors ${t.gender === g
                                        ? "bg-[#78080B] text-white border-[#78080B]"
                                        : "bg-white text-slate-700 border-slate-300 hover:border-[#78080B]"
                                        }`}
                                    >
                                      {g}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Conditional Fields – Adults */}
                              {key === "Adults" && isAdultDobRequired && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                  <div className="flex flex-col gap-1">
                                    <label className="text-xs text-slate-500">
                                      Date of Birth <span className="text-red-500">*</span>
                                    </label>
                                    {(() => {
                                      const adultDobError = getAdultDobError(t.dob);
                                      const showAdultDobError = (t.dob && adultDobError) || (showValidationErrors && adultDobError);
                                      return (
                                        <>
                                          <CustomDatePicker
                                            placeholder="DD/MM/YYYY"
                                            value={t.dob}
                                            disabledDate={disabledAdultDate}
                                            onChange={(val) => updateTraveller(key, i, "dob", val)}
                                            hasError={Boolean(showAdultDobError)}
                                          />
                                          {showAdultDobError && (
                                            <span className="text-[11px] text-red-600 font-medium">{adultDobError}</span>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                              )}

                              {key === "Childs" && isChildDobRequired && (() => {
                                const childDobError = getChildDobError(t.dob);
                                const showChildDobError = (t.dob && childDobError) || (showValidationErrors && childDobError);
                                return (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                    <div className="flex flex-col gap-1">
                                      <label className="text-xs text-slate-500">
                                        Date of Birth <span className="text-red-500">*</span> <span className="text-[11px] text-slate-400 font-normal">(2y - 12y on travel date)</span>
                                      </label>
                                      <CustomDatePicker
                                        placeholder="DD/MM/YYYY"
                                        value={t.dob}
                                        disabledDate={disabledChildDate}
                                        onChange={(val) => updateTraveller(key, i, "dob", val)}
                                        hasError={Boolean(showChildDobError)}
                                      />
                                      {showChildDobError && (
                                        <span className="text-[11px] text-red-600 font-medium">{childDobError}</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}

                              {key === "Infants" && (() => {
                                const infantDobError = getInfantDobError(t.dob);
                                const showInfantDobError = (t.dob && infantDobError) || (showValidationErrors && infantDobError);
                                return (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                    {isInfantDobRequired && (
                                      <div className="flex flex-col gap-1">
                                        <label className="text-xs text-slate-500">
                                          Date of Birth <span className="text-red-500">*</span> <span className="text-[11px] text-slate-400 font-normal">(below 2y on travel date)</span>
                                        </label>
                                        <CustomDatePicker
                                          placeholder="DD/MM/YYYY"
                                          value={t.dob}
                                          disabledDate={disabledInfantDate}
                                          onChange={(val) => updateTraveller(key, i, "dob", val)}
                                          hasError={Boolean(showInfantDobError)}
                                        />
                                        {showInfantDobError && (
                                          <span className="text-[11px] text-red-600 font-medium">{infantDobError}</span>
                                        )}
                                      </div>
                                    )}
                                    <div className="flex flex-col gap-1">
                                      <label className="text-xs text-slate-500">
                                        Accompanying Adult Name <span className="text-red-500">*</span>
                                      </label>
                                      {(() => {
                                        const accError = getTravellerNameError(t.accompanyingAdult, "Accompanying Adult Name");
                                        const hasAccErr = showValidationErrors && Boolean(accError);
                                        return (
                                          <>
                                            <input
                                              type="text"
                                              placeholder="Accompanying Adult Name"
                                              value={t.accompanyingAdult}
                                              autoComplete="off"
                                              spellCheck={false}
                                              onChange={(e) =>
                                                handleNameChange(
                                                  key,
                                                  i,
                                                  "accompanyingAdult",
                                                  e.target.value,
                                                )
                                              }
                                              className={`border rounded px-3 py-2 text-sm outline-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${hasAccErr
                                                ? "border-red-500 bg-red-50/20"
                                                : "border-slate-300"
                                                }`}
                                            />
                                            {hasAccErr && (
                                              <span className="text-[11px] text-red-600 font-medium">{accError}</span>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Passport Details (All Passenger Types: Adults, Childs, Infants) */}
                              {isPassportSectionVisible && (() => {
                                const hasAnyPassportField = Boolean(
                                  t.passportNumber?.trim() ||
                                  t.passportNationality?.trim() ||
                                  t.passportIssued ||
                                  t.passportExpiry
                                );
                                const isMandatoryForTraveller = isPassportRequired || hasAnyPassportField;

                                const passportNumberError = isMandatoryForTraveller && !t.passportNumber?.trim()
                                  ? "Passport Number is required"
                                  : null;
                                const nationalityError = isMandatoryForTraveller && !t.passportNationality?.trim()
                                  ? "Nationality is required"
                                  : null;
                                const issueDateError = showPassportIssueDate && isMandatoryForTraveller && !t.passportIssued
                                  ? "Passport Issue Date is required"
                                  : null;
                                const expiryDateError = showPassportExpiryDate && isMandatoryForTraveller && !t.passportExpiry
                                  ? "Passport Expiry Date is required"
                                  : null;

                                return (
                                  <div className="mb-3 pt-2">
                                    <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                                      Passport Details{" "}
                                      {isPassportRequired ? (
                                        <span className="text-red-500">*</span>
                                      ) : (
                                        <span className="text-slate-400 font-normal lowercase">(optional)</span>
                                      )}
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {/* Passport Number */}
                                      <div className="flex flex-col gap-1">
                                        <label className="text-xs text-slate-500">
                                          Passport Number {isPassportRequired && <span className="text-red-500">*</span>}
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="Passport Number"
                                          value={t.passportNumber || ""}
                                          onChange={(e) =>
                                            updateTraveller(key, i, "passportNumber", e.target.value.toUpperCase())
                                          }
                                          className={`border rounded px-3 py-2 text-sm outline-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 uppercase ${
                                            showValidationErrors && Boolean(passportNumberError)
                                              ? "border-red-500 bg-red-50/20"
                                              : "border-slate-300"
                                          }`}
                                        />
                                        {showValidationErrors && passportNumberError && (
                                          <span className="text-[11px] text-red-600 font-medium">{passportNumberError}</span>
                                        )}
                                      </div>

                                      {/* Nationality */}
                                      <div className="flex flex-col gap-1">
                                        <label className="text-xs text-slate-500">
                                          Nationality {isPassportRequired && <span className="text-red-500">*</span>}
                                        </label>
                                        <Select
                                          options={nationalityOptions}
                                          placeholder="Select Nationality..."
                                          isSearchable
                                          value={
                                            nationalityOptions.find(
                                              (opt) => opt.value === t.passportNationality?.toUpperCase()
                                            ) || (t.passportNationality ? { value: t.passportNationality, label: t.passportNationality } : null)
                                          }
                                          onChange={(selected) =>
                                            updateTraveller(key, i, "passportNationality", selected ? selected.value : "")
                                          }
                                          classNamePrefix="nationality-select"
                                          menuPlacement="auto"
                                          styles={{
                                            control: (base, state) => ({
                                              ...base,
                                              borderColor: showValidationErrors && Boolean(nationalityError)
                                                ? "#ef4444"
                                                : state.isFocused
                                                  ? "#3b82f6"
                                                  : "#cbd5e1",
                                              backgroundColor: showValidationErrors && Boolean(nationalityError)
                                                ? "rgba(254, 242, 242, 0.2)"
                                                : "white",
                                              boxShadow: state.isFocused
                                                ? "0 0 0 2px rgba(59, 130, 246, 0.2)"
                                                : "none",
                                              minHeight: "38px",
                                              height: "38px",
                                              fontSize: "0.875rem",
                                              borderRadius: "0.375rem",
                                              "&:hover": {
                                                borderColor: showValidationErrors && Boolean(nationalityError)
                                                  ? "#ef4444"
                                                  : "#3b82f6",
                                              },
                                            }),
                                            valueContainer: (base) => ({
                                              ...base,
                                              padding: "0 8px",
                                            }),
                                            placeholder: (base) => ({
                                              ...base,
                                              color: "#94a3b8",
                                              fontSize: "0.875rem",
                                            }),
                                            menu: (base) => ({
                                              ...base,
                                              zIndex: 50,
                                            }),
                                          }}
                                        />
                                        {showValidationErrors && nationalityError && (
                                          <span className="text-[11px] text-red-600 font-medium">{nationalityError}</span>
                                        )}
                                      </div>

                                      {/* Passport Issue Date */}
                                      {showPassportIssueDate && (
                                        <div className="flex flex-col gap-1">
                                          <label className="text-xs text-slate-500">
                                            Passport Issue Date {isPassportRequired && <span className="text-red-500">*</span>}
                                          </label>
                                          <CustomDatePicker
                                            placeholder="DD/MM/YYYY"
                                            value={t.passportIssued}
                                            disabledDate={(curr) => curr && curr.isAfter(dayjs(), "day")}
                                            onChange={(val) => updateTraveller(key, i, "passportIssued", val)}
                                            hasError={Boolean(showValidationErrors && issueDateError)}
                                          />
                                          {showValidationErrors && issueDateError && (
                                            <span className="text-[11px] text-red-600 font-medium">{issueDateError}</span>
                                          )}
                                        </div>
                                      )}

                                      {/* Passport Expiry Date */}
                                      {showPassportExpiryDate && (
                                        <div className="flex flex-col gap-1">
                                          <label className="text-xs text-slate-500">
                                            Passport Expiry Date {isPassportRequired && <span className="text-red-500">*</span>}
                                          </label>
                                          <CustomDatePicker
                                            placeholder="DD/MM/YYYY"
                                            value={t.passportExpiry}
                                            disabledDate={(curr) => curr && curr.isBefore(travelDate, "day")}
                                            onChange={(val) => updateTraveller(key, i, "passportExpiry", val)}
                                            hasError={Boolean(showValidationErrors && expiryDateError)}
                                          />
                                          {showValidationErrors && expiryDateError && (
                                            <span className="text-[11px] text-red-600 font-medium">{expiryDateError}</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Wheelchair (Adults only) */}
                              {
                                // key === "Adults" && (
                                //   <div className="flex items-center gap-2 mb-3">
                                //     <input
                                //       type="checkbox"
                                //       checked={t.wheelchair}
                                //       onChange={(e) =>
                                //         updateTraveller(
                                //           key,
                                //           i,
                                //           "wheelchair",
                                //           e.target.checked,
                                //         )
                                //       }
                                //       className="cursor-pointer w-4 h-4"
                                //     />
                                //     <label className="text-sm text-slate-600">
                                //       I require wheelchair (Optional)
                                //     </label>
                                //   </div>
                                // )
                              }

                              {/* Extra Baggage Section per Traveller */}
                              <div className="mt-3 pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg">
                                <div className="flex flex-col gap-1 min-w-0">
                                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                    <Luggage className="w-4 h-4 text-[#78080B] shrink-0" />
                                    <span>Extra Baggage</span>
                                  </div>
                                  {(!t.selectedBaggage || t.selectedBaggage.length === 0) ? (
                                    <span className="text-xs text-slate-500 italic pl-6">No extra baggage selected</span>
                                  ) : (
                                    <div className="flex flex-wrap gap-1.5 pl-6 mt-1">
                                      {t.selectedBaggage.map((bItem) => {
                                        const itemId = `${bItem.tripIndex ?? 0}_${bItem.SSRKey || bItem.Code || bItem.Description}`;
                                        const routeText = bItem.route || bItem.sectorLabel;
                                        return (
                                          <span
                                            key={itemId}
                                            className="inline-flex items-center gap-1.5 bg-white text-[#78080B] text-xs font-semibold px-2.5 py-1 rounded-md border border-red-200 shadow-2xs"
                                          >
                                            {bItem.Description || bItem.Code} {routeText ? `(${routeText})` : ''} (+₹{Number(bItem.Amount).toLocaleString('en-IN')})
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveSingleBaggage(key, i, itemId)}
                                              className="text-slate-400 hover:text-red-700 ml-0.5 font-bold"
                                              title="Remove item"
                                            >
                                              ✕
                                            </button>
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleOpenBaggageModal(key, i, label)}
                                  className="cursor-pointer text-xs font-semibold text-[#78080B] hover:bg-red-100 flex items-center justify-center gap-1.5 bg-white px-3.5 py-2 rounded-lg border border-red-200 shadow-2xs transition shrink-0 self-start sm:self-auto"
                                >
                                  <Luggage className="w-4 h-4 text-[#78080B]" />
                                  {t.selectedBaggage && t.selectedBaggage.length > 0 ? "Edit Baggage" : "+ Add Baggage"}
                                </button>
                              </div>

                              {/* Extra Meal Section per Traveller */}
                              <div className="mt-2 pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg">
                                <div className="flex flex-col gap-1 min-w-0">
                                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                    <Utensils className="w-4 h-4 text-orange-600 shrink-0" />
                                    <span>Extra Meal</span>
                                  </div>
                                  {(!t.selectedMeals || t.selectedMeals.length === 0) ? (
                                    <span className="text-xs text-slate-500 italic pl-6">No extra meal selected</span>
                                  ) : (
                                    <div className="flex flex-wrap gap-1.5 pl-6 mt-1">
                                      {t.selectedMeals.map((mItem) => {
                                        const itemId = `${mItem.segmentIndex ?? 0}_${mItem.SSRKey || mItem.Code || mItem.Description}`;
                                        const segText = mItem.sectorLabel || mItem.Sector;
                                        return (
                                          <span
                                            key={itemId}
                                            className="inline-flex items-center gap-1.5 bg-white text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-md border border-orange-200 shadow-2xs"
                                          >
                                            {mItem.Description || mItem.Code} {segText ? `(${segText})` : ''} (+₹{Number(mItem.Amount).toLocaleString('en-IN')})
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveSingleMeal(key, i, itemId)}
                                              className="text-slate-400 hover:text-orange-700 ml-0.5 font-bold"
                                              title="Remove item"
                                            >
                                              ✕
                                            </button>
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleOpenMealModal(key, i, label)}
                                  className="cursor-pointer text-xs font-semibold text-[#78080B] hover:bg-red-100 flex items-center justify-center gap-1.5 bg-white px-3.5 py-2 rounded-lg border border-red-200 shadow-2xs transition shrink-0 self-start sm:self-auto"
                                >
                                  <Utensils className="w-4 h-4 text-[#78080B]" />
                                  {t.selectedMeals && t.selectedMeals.length > 0 ? "Edit Meals" : "+ Add Meal"}
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Add Button */}
                          <div className="flex flex-col gap-1">
                            {travellers[key].length < limit && (
                              <button
                                onClick={() => addTraveller(key, limit)}
                                className="cursor-pointer uppercase text-blue-600 text-sm font-medium hover:text-blue-700 text-left"
                              >
                                + Add {label}
                              </button>
                            )}
                            {showValidationErrors && travellers[key].length < limit && (
                              <span className="text-xs text-red-600 font-medium">
                                Please add all {limit} {label}(s)
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Contact Details Card */}
                <div
                  id="contact-details"
                  className="bg-white rounded-lg shadow-sm border border-slate-200 scroll-mt-6"
                >
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-bold text-slate-800">Contact Details</h3>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      Your booking confirmation and flight ticket will be sent to this mobile number and email address.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Mobile Number */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-700">
                          Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-slate-300 bg-slate-50 text-slate-600 text-sm font-semibold select-none">
                            +91
                          </span>
                          <input
                            type="tel"
                            placeholder="Enter 10-digit mobile number"
                            maxLength={10}
                            value={contactDetails.mobile}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                              setContactDetails((prev) => {
                                const next = { ...prev, mobile: val };
                                bookingStore.set({ contactDetails: next });
                                return next;
                              });
                            }}
                            className={`border rounded-r px-3 py-2 text-sm outline-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full ${showValidationErrors && (!contactDetails.mobile?.trim() || contactDetails.mobile.replace(/\D/g, "").length !== 10)
                              ? "border-red-500 bg-red-50/20"
                              : "border-slate-300"
                              }`}
                          />
                        </div>
                        {showValidationErrors && !contactDetails.mobile?.trim() && (
                          <span className="text-[11px] text-red-600 font-medium">Mobile Number is required</span>
                        )}
                        {showValidationErrors && contactDetails.mobile?.trim() && contactDetails.mobile.replace(/\D/g, "").length !== 10 && (
                          <span className="text-[11px] text-red-600 font-medium">Please enter a valid 10-digit mobile number</span>
                        )}
                      </div>

                      {/* Email Address */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-700">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          placeholder="Enter email address"
                          value={contactDetails.email}
                          onChange={(e) => {
                            const val = e.target.value;
                            setContactDetails((prev) => {
                              const next = { ...prev, email: val };
                              bookingStore.set({ contactDetails: next });
                              return next;
                            });
                          }}
                          className={`border rounded px-3 py-2 text-sm outline-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${showValidationErrors && (!contactDetails.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactDetails.email.trim()))
                            ? "border-red-500 bg-red-50/20"
                            : "border-slate-300"
                            }`}
                        />
                        {showValidationErrors && !contactDetails.email?.trim() && (
                          <span className="text-[11px] text-red-600 font-medium">Email Address is required</span>
                        )}
                        {showValidationErrors && contactDetails.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactDetails.email.trim()) && (
                          <span className="text-[11px] text-red-600 font-medium">Please enter a valid email address</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Select Seat (Optional) Card */}
                {isSeatAllowed && (
                  <div id="seats-section" className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden scroll-mt-6">
                    {/* Header */}
                    <button
                      type="button"
                      onClick={() => setIsSeatSectionOpen((prev) => !prev)}
                      className="w-full flex items-center justify-between px-5 py-3.5 bg-[#78080B] text-white hover:bg-[#66070a] transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Plane className="w-4 h-4 text-white" />
                        <h3 className="text-base font-semibold text-white tracking-wide">
                          Select Seat (Optional)
                        </h3>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-white transition-transform duration-200 ${isSeatSectionOpen ? "" : "-rotate-90"
                          }`}
                      />
                    </button>

                    {/* Content / Segments */}
                    {isSeatSectionOpen && (
                      <div className="p-5 divide-y divide-slate-100">
                        {(allFlightSegments && allFlightSegments.length > 0
                          ? allFlightSegments
                          : [{
                            AirlineDeparture: fareReviewData?.TripInfo?.[0]?.AirlineDeparture,
                            AirlineArrival: fareReviewData?.TripInfo?.[0]?.AirlineArrival,
                            DepartureDate: fareReviewData?.TripInfo?.[0]?.DepartureDate,
                          }]
                        ).map((seg, segIdx) => {
                          const depDisplay = (() => {
                            const code = seg?.AirlineDeparture?.code || seg?.DepartureAirportCode || "";
                            const city = seg?.AirlineDeparture?.city || seg?.AirlineDeparture?.CityName || seg?.AirlineDeparture?.cityName || seg?.AirlineDeparture?.name || "";
                            return formatAirportCityDisplay(city, code);
                          })();

                          const arrDisplay = (() => {
                            const code = seg?.AirlineArrival?.code || seg?.ArrivalAirportCode || "";
                            const city = seg?.AirlineArrival?.city || seg?.AirlineArrival?.CityName || seg?.AirlineArrival?.cityName || seg?.AirlineArrival?.name || "";
                            return formatAirportCityDisplay(city, code);
                          })();

                          const rawDate = seg?.DepartureDate || fareReviewData?.TripInfo?.[seg?.tripIndex ?? 0]?.DepartureDate;
                          const formattedDate = rawDate && dayjs(rawDate).isValid()
                            ? `on ${dayjs(rawDate).format("MMM, DD")}`
                            : rawDate ? `on ${rawDate}` : "";

                          // Passenger list (Adults + Childs)
                          const seatPaxList = [];
                          for (let a = 0; a < Adults; a++) {
                            seatPaxList.push({ paxTypeLabel: `ADULT-${a + 1}` });
                          }
                          for (let c = 0; c < Childs; c++) {
                            seatPaxList.push({ paxTypeLabel: `CHILD-${c + 1}` });
                          }

                          // Filter seats belonging to this segment
                          const segSeats = (selectedSeatDetails || []).filter((s) => {
                            const sIdx = s.segmentIndex !== undefined ? Number(s.segmentIndex) : 0;
                            return sIdx === segIdx;
                          });

                          let seatSummaryText = "";
                          if (segSeats.length > 0) {
                            const seatPairs = [];
                            segSeats.forEach((seat, seatIdx) => {
                              const seatNum = seat.number || seat.SeatNo || seat.SSR_TypeName || seat.code;
                              const pIdx = seat.paxIndex !== undefined ? Number(seat.paxIndex) : seatIdx;
                              const paxLabel = seat.paxLabel || seatPaxList[pIdx]?.paxTypeLabel || `PAX-${pIdx + 1}`;
                              if (seatNum) {
                                seatPairs.push(`${paxLabel}:${seatNum}`);
                              }
                            });
                            seatSummaryText = seatPairs.join(", ");
                          }

                          const hasSeatsForSeg = segSeats.length > 0 && seatSummaryText.length > 0;

                          return (
                            <div
                              key={segIdx}
                              className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${segIdx > 0 ? "pt-4" : ""
                                } ${segIdx < (allFlightSegments?.length || 1) - 1 ? "pb-4" : ""}`}
                            >
                              {/* Left: Origin -> Destination & Date */}
                              <div className="min-w-[180px] sm:min-w-[220px]">
                                <div className="text-sm font-bold text-slate-800 tracking-tight">
                                  {depDisplay}
                                  {" → "}
                                  {arrDisplay}
                                </div>
                                {formattedDate && (
                                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                                    {formattedDate}
                                  </div>
                                )}
                              </div>

                              {/* Middle: Selected Seat List or 'No Seat Selected' */}
                              <div className="flex-1 md:text-center text-left">
                                {hasSeatsForSeg ? (
                                  <span className="inline-flex items-center gap-1 bg-red-50 text-[#78080B] text-xs sm:text-sm font-semibold px-3 py-1 rounded-md border border-red-200 shadow-2xs break-all">
                                    ✓ {seatSummaryText}
                                  </span>
                                ) : (
                                  <span className="text-xs sm:text-sm text-slate-500 font-normal">
                                    No Seat Selected
                                  </span>
                                )}
                              </div>

                              {/* Right: Action Button */}
                              <div className="shrink-0 flex items-center md:justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleSelectSeatModal(segIdx)}
                                  className="w-full sm:w-auto px-5 py-2 rounded-lg bg-[#78080B] hover:bg-[#5f0608] active:bg-[#4a0506] text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer text-center flex items-center justify-center gap-1.5"
                                >
                                  <Plane className="w-3.5 h-3.5 text-white" />
                                  {hasSeatsForSeg ? "Modify your seat" : "Select your seat"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* GST Details Card */}
                {isGstApplicable && (
                  <div id="gst-details" className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-800">
                              GST Details {isGstMandatory ? (
                                <span className="text-red-600 text-sm font-semibold">(Mandatory)</span>
                              ) : (
                                <span className="text-slate-500 font-medium text-sm">(Optional)</span>
                              )}
                            </h3>
                            {isGstMandatory && (
                              <span className="bg-red-50 text-red-600 text-[11px] font-semibold px-2 py-0.5 rounded border border-red-200">
                                Required
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">Claim GST credit for business travel</p>
                        </div>
                      </div>
                      {!isGstMandatory && (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useGst}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setUseGst(checked);
                              bookingStore.set({
                                gstInfo: checked ? gstDetails : null,
                              });
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#78080B]"></div>
                        </label>
                      )}
                    </div>

                    {(isGstMandatory || useGst) && (
                      <div className="space-y-4 mt-4 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                              GST Number {isGstMandatory && <span className="text-red-500">*</span>}
                            </label>
                            <input
                              type="text"
                              placeholder="Enter GST number"
                              value={gstDetails.gstNumber}
                              maxLength={15}
                              onChange={(e) => {
                                const val = e.target.value.toUpperCase();
                                const updated = { ...gstDetails, gstNumber: val };
                                setGstDetails(updated);
                                bookingStore.set({ gstInfo: updated });
                              }}
                              className={`border rounded px-3 py-2 text-sm uppercase outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${showValidationErrors && (!gstDetails.gstNumber?.trim() || (isGstMandatory && gstDetails.gstNumber.trim().length !== 15))
                                ? "border-red-500 bg-red-50/20"
                                : "border-slate-300"
                                }`}
                            />
                            {showValidationErrors && !gstDetails.gstNumber?.trim() && (
                              <span className="text-[11px] text-red-600 font-medium">GST Number is required</span>
                            )}
                            {showValidationErrors && gstDetails.gstNumber?.trim() && gstDetails.gstNumber.trim().length !== 15 && (
                              <span className="text-[11px] text-red-600 font-medium">GST Number must be 15 characters</span>
                            )}
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                              Company / Registered Name {isGstMandatory && <span className="text-red-500">*</span>}
                            </label>
                            <input
                              type="text"
                              placeholder="Enter registered company name"
                              value={gstDetails.registeredName}
                              onChange={(e) => {
                                const updated = { ...gstDetails, registeredName: e.target.value };
                                setGstDetails(updated);
                                bookingStore.set({ gstInfo: updated });
                              }}
                              className={`border rounded px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${showValidationErrors && !gstDetails.registeredName?.trim()
                                ? "border-red-500 bg-red-50/20"
                                : "border-slate-300"
                                }`}
                            />
                            {showValidationErrors && !gstDetails.registeredName?.trim() && (
                              <span className="text-[11px] text-red-600 font-medium">Company name is required</span>
                            )}
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                              Registered Email {isGstMandatory && <span className="text-red-500">*</span>}
                            </label>
                            <input
                              type="email"
                              placeholder="Enter registered email address"
                              value={gstDetails.email}
                              onChange={(e) => {
                                const updated = { ...gstDetails, email: e.target.value };
                                setGstDetails(updated);
                                bookingStore.set({ gstInfo: updated });
                              }}
                              className={`border rounded px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${showValidationErrors && ((isGstMandatory && !gstDetails.email?.trim()) || (gstDetails.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gstDetails.email.trim())))
                                ? "border-red-500 bg-red-50/20"
                                : "border-slate-300"
                                }`}
                            />
                            {showValidationErrors && isGstMandatory && !gstDetails.email?.trim() && (
                              <span className="text-[11px] text-red-600 font-medium">Registered email is required</span>
                            )}
                            {showValidationErrors && gstDetails.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gstDetails.email.trim()) && (
                              <span className="text-[11px] text-red-600 font-medium">Please enter a valid email address</span>
                            )}
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                              Registered Mobile {isGstMandatory && <span className="text-red-500">*</span>}
                            </label>
                            <input
                              type="tel"
                              placeholder="Enter registered mobile number"
                              value={gstDetails.mobile}
                              maxLength={10}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                                const updated = { ...gstDetails, mobile: val };
                                setGstDetails(updated);
                                bookingStore.set({ gstInfo: updated });
                              }}
                              className={`border rounded px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${showValidationErrors && ((isGstMandatory && !gstDetails.mobile?.toString().trim()) || (gstDetails.mobile?.toString().trim() && gstDetails.mobile.toString().trim().length !== 10))
                                ? "border-red-500 bg-red-50/20"
                                : "border-slate-300"
                                }`}
                            />
                            {showValidationErrors && isGstMandatory && !gstDetails.mobile?.toString().trim() && (
                              <span className="text-[11px] text-red-600 font-medium">Registered mobile is required</span>
                            )}
                            {showValidationErrors && gstDetails.mobile?.toString().trim() && gstDetails.mobile.toString().trim().length !== 10 && (
                              <span className="text-[11px] text-red-600 font-medium">Please enter a valid 10-digit mobile number</span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                            Registered Address {isGstMandatory && <span className="text-red-500">*</span>}
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Enter registered address"
                            value={gstDetails.address}
                            onChange={(e) => {
                              const updated = { ...gstDetails, address: e.target.value };
                              setGstDetails(updated);
                              bookingStore.set({ gstInfo: updated });
                            }}
                            className={`border rounded px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none ${showValidationErrors && isGstMandatory && !gstDetails.address?.trim()
                              ? "border-red-500 bg-red-50/20"
                              : "border-slate-300"
                              }`}
                          />
                          {showValidationErrors && isGstMandatory && !gstDetails.address?.trim() && (
                            <span className="text-[11px] text-red-600 font-medium">Registered address is required</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <button
                    type="button"
                    disabled={bookingMutation.isPending}
                    className="hidden lg:flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-medium text-base px-6 py-3 rounded-full shadow-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={handleContinue}
                  >
                    {bookingMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Booking…
                      </>
                    ) : (
                      <>
                        {isLoggedIn ? "Proceed to Booking" : "Login to Continue"}
                        <ChevronRight />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Sidebar - Fare Summary */}
              <div className="hidden lg:block order-2 lg:order-2 lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 static lg:sticky lg:top-24">

                  <h2 className="text-xl font-bold mb-4">
                    Fare Summary
                  </h2>

                  {/* Multi-trip Onward/Return Column Header */}
                  {isRoundTripReview && (
                    <div className="grid grid-cols-12 gap-1 text-xs font-bold text-slate-500 pb-2 border-b border-slate-100 mb-1">
                      <div className="col-span-5">&nbsp;</div>
                      <div className="col-span-3 text-right text-slate-700 font-bold uppercase tracking-wider" title="Onward Fare">ONWARD</div>
                      <div className="col-span-4 text-right text-slate-700 font-bold uppercase tracking-wider" title="Return Fare">RETURN</div>
                    </div>
                  )}

                  {/* Base Fare */}
                  <div className="mb-3">
                    {isRoundTripReview ? (
                      <FareRow
                        label="Base fare"
                        onwardAmount={Math.ceil(onwardBaseFare + Math.ceil(onwardRoinetMarkup))}
                        returnAmount={Math.ceil(returnBaseFare + Math.ceil(returnRoinetMarkup))}
                        isRoundTrip={true}
                        showIcon={false}
                        isHeader={true}
                        isBold={true}
                      />
                    ) : (
                      <div className="flex items-center justify-between px-1 -mx-1 py-0.5 rounded transition-colors hover:bg-slate-100/70" title={`Base fare: ₹ ${Math.ceil(baseFare).toLocaleString("en-IN")}`}>
                        <span className="text-base font-semibold text-blue-700">
                          Base fare
                        </span>
                        <span className="font-semibold text-slate-800 cursor-help" title={`₹ ${Math.ceil(baseFare).toLocaleString("en-IN")}`}>
                          ₹ {Math.ceil(baseFare).toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Taxes and Fees */}
                  <div className="mb-3">
                    {isRoundTripReview ? (
                      <FareRow
                        label="Taxes and fees"
                        onwardAmount={Math.ceil(onwardTaxesAndFee + Math.ceil(onwardCspMarkup) + onwardTxnFees)}
                        returnAmount={Math.ceil(returnTaxesAndFee + Math.ceil(returnCspMarkup) + returnTxnFees)}
                        isRoundTrip={true}
                        showIcon={false}
                        isHeader={true}
                        isBold={true}
                      />
                    ) : (
                      <div className="flex items-center justify-between mb-2 px-1 -mx-1 py-0.5 rounded transition-colors hover:bg-slate-100/70" title={`Taxes and fees: ₹ ${Math.ceil(taxes).toLocaleString("en-IN")}`}>
                        <span className="text-base font-semibold text-blue-700">
                          Taxes and fees
                        </span>
                        <span className="font-semibold text-slate-800 cursor-help" title={`₹ ${Math.ceil(taxes).toLocaleString("en-IN")}`}>
                          ₹ {Math.ceil(taxes).toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}

                    {/* Tax Breakdown */}
                    <div className="space-y-2 pl-1 pt-1">
                      {/* Airline GST */}
                      {(isRoundTripReview ? (onwardAirlineGst > 0 || returnAirlineGst > 0) : gst > 0) && (
                        <FareRow
                          label="Airline GST"
                          amount={gst}
                          onwardAmount={onwardAirlineGst}
                          returnAmount={returnAirlineGst}
                          isRoundTrip={isRoundTripReview}
                          showIcon={false}
                        />
                      )}

                      {/* Management Fee */}
                      {(isRoundTripReview ? (onwardManagementFee > 0 || returnManagementFee > 0) : managementFee > 0) && (
                        <FareRow
                          label="Management Fee"
                          amount={managementFee}
                          onwardAmount={onwardManagementFee}
                          returnAmount={returnManagementFee}
                          isRoundTrip={isRoundTripReview}
                          showIcon={false}
                        />
                      )}

                      {/* Management Fee Tax */}
                      {(isRoundTripReview ? (onwardManagementFeeTax > 0 || returnManagementFeeTax > 0) : managementFeeTax > 0) && (
                        <FareRow
                          label="Management Fee Tax"
                          amount={managementFeeTax}
                          onwardAmount={onwardManagementFeeTax}
                          returnAmount={returnManagementFeeTax}
                          isRoundTrip={isRoundTripReview}
                          showIcon={false}
                        />
                      )}

                      {/* Other Taxes */}
                      {(isRoundTripReview ? (onwardOtherTaxes > 0 || returnOtherTaxes > 0) : otherTaxes > 0) && (
                        <FareRow
                          label="Other Taxes"
                          amount={Math.ceil(otherTaxes + Math.ceil(retailerMarkup) + transactionFee)}
                          onwardAmount={Math.ceil(onwardOtherTaxes + Math.ceil(onwardCspMarkup) + onwardTxnFees)}
                          returnAmount={Math.ceil(returnOtherTaxes + Math.ceil(returnCspMarkup) + returnTxnFees)}
                          isRoundTrip={isRoundTripReview}
                          showIcon={false}
                        />
                      )}

                      {/* Fuel Surcharge (YQ) */}
                      {(isRoundTripReview ? (onwardYQ > 0 || returnYQ > 0) : fuelSurcharge > 0) && (
                        <FareRow
                          label="Fuel Surcharge (YQ)"
                          amount={fuelSurcharge}
                          onwardAmount={onwardYQ}
                          returnAmount={returnYQ}
                          isRoundTrip={isRoundTripReview}
                          showIcon={false}
                        />
                      )}

                      {/* Carrier Misc Fee (YR) */}
                      {(isRoundTripReview ? (onwardYR > 0 || returnYR > 0) : carrierMiscFee > 0) && (
                        <FareRow
                          label="Carrier Misc Fee"
                          amount={carrierMiscFee}
                          onwardAmount={onwardYR}
                          returnAmount={returnYR}
                          isRoundTrip={isRoundTripReview}
                          showIcon={false}
                        />
                      )}
                    </div>
                  </div>

                  {/* Sub Total */}
                  <div className="py-2.5 border-t border-slate-100 mb-2">
                    {isRoundTripReview ? (
                      <FareRow
                        label="Sub Total"
                        onwardAmount={Math.ceil(onwardBaseFare + onwardTaxesAndFee + Math.ceil(onwardRoinetMarkup) + Math.ceil(onwardCspMarkup) + onwardTxnFees)}
                        returnAmount={Math.ceil(returnBaseFare + returnTaxesAndFee + Math.ceil(returnRoinetMarkup) + Math.ceil(returnCspMarkup) + returnTxnFees)}
                        isRoundTrip={true}
                        showIcon={false}
                        isBold={true}
                      />
                    ) : (
                      <div className="flex items-center justify-between px-1 -mx-1 py-0.5 rounded transition-colors hover:bg-slate-100/70" title={`Sub Total: ₹ ${Math.ceil(subTotal).toLocaleString("en-IN")}`}>
                        <span className="text-sm font-semibold text-slate-700">
                          Sub Total
                        </span>
                        <span className="font-semibold text-slate-800 cursor-help" title={`₹ ${Math.ceil(subTotal).toLocaleString("en-IN")}`}>
                          ₹ {Math.ceil(subTotal).toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Meal, Baggage & Seat */}
                  {totalBaggageMealSeatAmount > 0 && (
                    <div className="py-2.5 border-t border-slate-100 mb-2">
                      <div className="flex items-center justify-between mb-2 px-1 -mx-1 py-0.5 rounded transition-colors hover:bg-slate-100/70" title={`Meal, Baggage & Seat: ₹ ${Math.ceil(totalBaggageMealSeatAmount).toLocaleString("en-IN")}`}>
                        <span className="text-sm font-semibold text-slate-800">
                          Meal, Baggage & Seat
                        </span>
                        <span className="font-semibold text-slate-800 cursor-help" title={`₹ ${Math.ceil(totalBaggageMealSeatAmount).toLocaleString("en-IN")}`}>
                          ₹ {Math.ceil(totalBaggageMealSeatAmount).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="space-y-1.5 pl-1">
                        {totalBaggageCost > 0 && (
                          <FareRow
                            label={`Baggage (${totalBaggageItemsCount} ${totalBaggageItemsCount === 1 ? 'item' : 'items'})`}
                            amount={totalBaggageCost}
                            showIcon={false}
                          />
                        )}
                        {totalMealCost > 0 && (
                          <FareRow
                            label={`Meal (${totalMealItemsCount} ${totalMealItemsCount === 1 ? 'item' : 'items'})`}
                            amount={totalMealCost}
                            showIcon={false}
                          />
                        )}
                        {selectedSeatCost > 0 && (
                          <FareRow
                            label={`Seat (${selectedSeatData?.seats?.size ?? 0} seat${(selectedSeatData?.seats?.size ?? 0) !== 1 ? 's' : ''})`}
                            amount={selectedSeatCost}
                            showIcon={false}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Amount to Pay */}
                  <div className="border-t border-slate-200 pt-4 mb-4">
                    <div className="flex items-center justify-between px-1 -mx-1 py-0.5 rounded transition-colors hover:bg-slate-100/70" title={`Amount to Pay: ₹ ${Math.ceil(amountToPay).toLocaleString("en-IN")}`}>
                      <span className="text-base font-semibold text-blue-700">
                        Amount to Pay
                      </span>

                      <span className="text-xl font-bold text-slate-800 cursor-help" title={`₹ ${Math.ceil(amountToPay).toLocaleString("en-IN")}`}>
                        ₹ {Math.ceil(amountToPay).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Additional Pricing Details */}
                  <div className="space-y-3">
                    {/* Convenience Fee */}
                    <div className="flex items-center justify-between px-1 -mx-1 py-0.5 rounded transition-colors hover:bg-slate-100/70" title={`Convenience Fee: ₹ ${Math.ceil(convenienceFee).toLocaleString("en-IN")}`}>
                      <span className="text-sm text-slate-700">
                        Convenience Fee
                      </span>

                      <span className="text-sm font-medium text-slate-800 cursor-help" title={`₹ ${Math.ceil(convenienceFee).toLocaleString("en-IN")}`}>
                        ₹ {Math.ceil(convenienceFee).toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* Net Price */}
                    <div className="flex items-center justify-between px-1 -mx-1 py-0.5 rounded transition-colors hover:bg-slate-100/70" title={`Net Price: ₹ ${Math.ceil(netPrice).toLocaleString("en-IN")}`}>
                      <span className="text-sm text-slate-700">
                        Net Price
                      </span>

                      <span className="text-sm font-medium text-slate-800 cursor-help" title={`₹ ${Math.ceil(netPrice).toLocaleString("en-IN")}`}>
                        ₹ {Math.ceil(netPrice).toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* Commission */}
                    <div className="flex items-center justify-between px-1 -mx-1 py-0.5 rounded transition-colors hover:bg-slate-100/70" title={`Commission: ₹ ${Math.ceil(commission).toLocaleString("en-IN")}`}>
                      <span className="text-sm text-slate-700">
                        Commission
                      </span>

                      <span className="text-sm font-medium text-slate-800 cursor-help" title={`₹ ${Math.ceil(commission).toLocaleString("en-IN")}`}>
                        ₹ {Math.ceil(commission).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* --- Coupon Applied --- */}
                  {selectedCoupon && (
                    <div className="mt-5 bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm flex justify-between items-center">
                      <span>
                        Applied <b>{selectedCoupon.code}</b> –{" "}
                        {selectedCoupon.label}
                      </span>

                      <button
                        onClick={handleRemoveCoupon}
                        className="cursor-pointer text-xs text-red-600 font-medium hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                </div>
              </div>


            </div>
          </div>
        </div>

        <div className="block lg:hidden sticky bottom-0 z-[999] bg-[#78080B] text-white px-4 py-4 sm:py-5 shadow-[0_-4px_8px_rgba(0,0,0,0.25)]">
          <div className="max-w-7xl mx-auto flex flex-row sm:items-center justify-between gap-4">
            {/* Price Section */}
            <div className="flex flex-col sm:items-center gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold">
                  ₹ {calculateTotal.toLocaleString("en-IN")}
                </span>

                <button
                  type="button"
                  aria-label="Price information"
                  className="flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 sm:w-5 sm:h-5 text-white opacity-80 hover:opacity-100 transition cursor-pointer"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </button>
              </div>

              <span className="text-xs sm:text-sm font-medium opacity-90">
                FOR 1 ADULT
              </span>
            </div>

            {/* CTA */}
            <button
              type="button"
              disabled={bookingMutation.isPending}
              className="bg-[#D9D9D9] text-[#78080B] font-semibold text-base px-6 py-3 rounded-full shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleContinue}
            >
              {bookingMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Booking…
                </>
              ) : (
                <>
                  {isLoggedIn ? "Proceed to Booking" : "Login to Continue"}
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Login Modal — shown when user tries to book without being logged in */}
      {isLoginModalOpen && (
        <SignInModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={() => {
            setIsLoginModalOpen(false);
            // After login, show disclaimer modal 
            setShowValidationErrors(true);
            if (validateForm()) {
              setIsDisclaimerModalOpen(true);
            }
          }}
        />
      )}

      {/* Important Disclaimer & Payment Mode Modal */}
      {isDisclaimerModalOpen && (
        <ImportantDisclaimerModal
          open={isDisclaimerModalOpen}
          onClose={() => setIsDisclaimerModalOpen(false)}
          onConfirmWallet={() => bookingMutation.mutate()}
          amount={amountToPay}
          isWalletBookingLoading={bookingMutation.isPending}
          getBookingPayload={getBookingPayload}
        />
      )}

      {/* Price Change Alert Modal (FAREALERT) */}
      <FareAlertModal
        open={isFareAlertModalOpen}
        oldFare={fareAlert?.OldFare}
        newFare={fareAlert?.NewFare}
        onAccept={() => {
          setHasUserAcceptedFareAlert(true);
          setIsFareAlertModalOpen(false);
        }}
        onCancel={() => {
          setIsFareAlertModalOpen(false);
          const bookingData = bookingStore.get();
          if (bookingData?.searchUrl) {
            navigate(bookingData.searchUrl);
            return;
          }
          if (bookingData?.searchParams) {
            navigate(`/flight-results${bookingData.searchParams.startsWith("?") ? "" : "?"}${bookingData.searchParams}`);
            return;
          }

          const flight = bookingData?.isRoundTrip ? (bookingData?.outboundFlight || bookingData?.flight) : bookingData?.flight;
          const origin = flight?.AirlineDeparture?.code || flight?.DepartureAirportCode || flight?.Origin || "";
          const destination = flight?.AirlineArrival?.code || flight?.ArrivalAirportCode || flight?.Destination || "";
          const departDate = flight?.DepartureDate || "";
          const returnFlight = bookingData?.returnFlight;
          const returnDate = returnFlight?.DepartureDate || "";
          const adults = bookingData?.travellers?.adults || 1;
          const children = bookingData?.travellers?.children || 0;
          const infants = bookingData?.travellers?.infants || 0;
          const travelType = bookingData?.travelType || 0;

          if (origin && destination) {
            const params = new URLSearchParams({
              origin,
              destination,
              departDate,
              returnDate,
              adults: String(adults),
              children: String(children),
              infants: String(infants),
              travelType: String(travelType),
            });
            navigate(`/flight-results?${params.toString()}`);
          } else {
            navigate("/flight-results");
          }
        }}
      />
    </>
  );
}

const FareRow = ({
  label,
  amount = 0,
  onwardAmount = 0,
  returnAmount = 0,
  isRoundTrip = false,
  showIcon = true,
  isBold = false,
  isHeader = false,
}) => {
  const formattedAmount = `₹ ${Math.ceil(amount || 0).toLocaleString("en-IN")}`;
  const formattedOnward = `₹${Math.ceil(onwardAmount || 0).toLocaleString("en-IN")}`;
  const formattedReturn = `₹${Math.ceil(returnAmount || 0).toLocaleString("en-IN")}`;

  if (isRoundTrip) {
    return (
      <div
        className={`grid grid-cols-12 gap-1 items-center px-1 -mx-1 py-0.5 rounded transition-colors hover:bg-slate-100/70 group ${isHeader ? "font-semibold" : "text-xs sm:text-sm"}`}
        title={`${label} — Onward: ${formattedOnward} | Return: ${formattedReturn}`}
      >
        <div className="col-span-5 flex items-center gap-1.5 min-w-0" title={label}>
          {showIcon && <CirclePlus className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
          <span className={`truncate ${isHeader ? "text-blue-700 font-semibold text-sm" : "text-slate-600"}`}>
            {label}
          </span>
        </div>
        <div
          className={`col-span-3 text-right truncate cursor-help ${isBold ? "font-bold text-slate-800" : "font-medium text-slate-700"}`}
          title={`Onward: ${formattedOnward}`}
        >
          {formattedOnward}
        </div>
        <div
          className={`col-span-4 text-right truncate cursor-help ${isBold ? "font-bold text-slate-800" : "font-medium text-slate-700"}`}
          title={`Return: ${formattedReturn}`}
        >
          {formattedReturn}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between px-1 -mx-1 py-0.5 rounded transition-colors hover:bg-slate-100/70"
      title={`${label}: ${formattedAmount}`}
    >
      <div className="flex items-center gap-2 min-w-0" title={label}>
        {showIcon && <CirclePlus className="w-4 h-4 text-slate-400 shrink-0" />}
        <span className={`truncate text-xs sm:text-sm ${isHeader ? "text-blue-700 font-semibold" : "text-slate-600"}`}>
          {label}
        </span>
      </div>

      <span
        className={`text-xs sm:text-sm cursor-help shrink-0 ml-2 ${isBold ? "font-bold text-slate-800" : "font-medium text-slate-700"}`}
        title={formattedAmount}
      >
        {formattedAmount}
      </span>
    </div>
  );
};