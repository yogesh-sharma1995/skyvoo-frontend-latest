import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plane, User, Calendar, Hash, ShieldCheck, Receipt, Clock, AlertCircle, Loader2, X, ChevronDown, Check, AlertOctagon, CheckCircle2, Printer, Luggage, Utensils, Building2, Copy, CheckCheck, XCircle, Armchair } from 'lucide-react';
import api from '@/services/api';
import BookingDetailsSkeleton from '@/components/layout/BookingDetailsSkeleton';
import { getAirlineLogo } from '@/utils/airlineCode';
import { resolveStandardBaggage, resolveSeatCode } from '@/components/print/mapBookingToTicket';
import { bookingStore } from '@/store/bookingStore';
import detailBg from '../assets/imgs/detail.png';



const parseSegDateTime = (dtStr) => {
  if (!dtStr) return null;
  // Standardize separator to space
  const normalized = dtStr.replace('T', ' ');
  const parts = normalized.split(' ');

  let datePart = parts[0];
  let timePart = parts[1] || "00:00:00";

  let year = new Date().getFullYear(), month = 0, day = 1;

  if (datePart.includes('-')) {
    const dp = datePart.split('-');
    if (dp[0].length === 4) {
      // YYYY-MM-DD
      year = parseInt(dp[0], 10);
      month = parseInt(dp[1], 10) - 1;
      day = parseInt(dp[2], 10);
    } else {
      // DD-MM-YYYY
      day = parseInt(dp[0], 10);
      month = parseInt(dp[1], 10) - 1;
      year = parseInt(dp[2], 10);
    }
  } else if (datePart.includes('/')) {
    const dp = datePart.split('/');
    if (dp[2].length === 4) {
      // DD/MM/YYYY or MM/DD/YYYY
      const p0 = parseInt(dp[0], 10);
      const p1 = parseInt(dp[1], 10);
      const p2 = parseInt(dp[2], 10);
      if (p0 > 12) {
        day = p0;
        month = p1 - 1;
      } else if (p1 > 12) {
        day = p1;
        month = p0 - 1;
      } else {
        // default to DD/MM/YYYY
        day = p0;
        month = p1 - 1;
      }
      year = p2;
    } else {
      // YYYY/MM/DD
      year = parseInt(dp[0], 10);
      month = parseInt(dp[1], 10) - 1;
      day = parseInt(dp[2], 10);
    }
  }

  const tp = timePart.split(':');
  const hours = parseInt(tp[0], 10) || 0;
  const minutes = parseInt(tp[1], 10) || 0;
  const seconds = parseInt(tp[2], 10) || 0;

  const date = new Date(year, month, day, hours, minutes, seconds);
  return isNaN(date.getTime()) ? null : date;
};

const formatBookingDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
};

const formatSegmentDateDisplay = (dtStr) => {
  if (!dtStr) return { time: '—', dateWithTime: '—' };
  const d = parseSegDateTime(dtStr);
  if (!d) {
    const parts = dtStr.split(/[ T]/);
    return { time: parts[1] || dtStr, dateWithTime: dtStr };
  }
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');

  return {
    time: `${hh}:${min}`,
    dateWithTime: `${mm}/${dd}/${yyyy} (T${hh}:${min}:${ss})`
  };
};

const getYYYYMMDD = (dtStr) => {
  const dateObj = parseSegDateTime(dtStr);
  if (!dateObj) return "";
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getTodayDateString = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getBookingMaxRescheduleDate = (bookingCreatedOn, firstSegDateStr) => {
  let baseDate = parseSegDateTime(bookingCreatedOn);
  if (!baseDate && firstSegDateStr) {
    baseDate = parseSegDateTime(firstSegDateStr);
  }
  if (!baseDate) {
    baseDate = new Date();
  }
  const maxD = new Date(baseDate);
  maxD.setDate(maxD.getDate() + 90);
  const yyyy = maxD.getFullYear();
  const mm = String(maxD.getMonth() + 1).padStart(2, "0");
  const dd = String(maxD.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getBookingStatusDisplay = (rawStatus) => {
  const s = String(rawStatus || "").trim().toUpperCase();
  if (
    s === "FAILED" ||
    s === "FAIL" ||
    s === "F" ||
    s.includes("FAILED") ||
    s.includes("FAIL") ||
    s.includes("PAYMENT FAILED")
  ) {
    return {
      text: s.includes("PAYMENT") ? s : (s === "F" || s === "FAIL" ? "FAILED" : s),
      isConfirmed: false,
      isPending: false,
      isCancelled: false,
      isFailed: true,
    };
  }
  if (s === "CANCELLED" || s === "CANCEL" || s === "C" || s.includes("CANCEL")) {
    return {
      text: "CANCELLED",
      isConfirmed: false,
      isPending: false,
      isCancelled: true,
      isFailed: false,
    };
  }
  if (!s || s === "UNKNOWN" || s === "U" || s === "QUEUED" || s === "P" || s === "PENDING" || s.includes("PENDING")) {
    return {
      text: "PENDING",
      isConfirmed: false,
      isPending: true,
      isCancelled: false,
      isFailed: false,
    };
  }
  if (s === "CONFIRMED" || s === "CONFIRM" || s === "S" || s === "SUCCESS" || s.includes("CONFIRM")) {
    return {
      text: "CONFIRMED",
      isConfirmed: true,
      isPending: false,
      isCancelled: false,
      isFailed: false,
    };
  }
  return {
    text: s,
    isConfirmed: s === "CONFIRMED",
    isPending: false,
    isCancelled: false,
    isFailed: false,
  };
};

const FF_CANCELLATION_REASONS = [
  { value: "015_0", label: "Please cancel my ticket with Applicable Penalty (Normal Cancel)" },
  { value: "005_0", label: "I cancelled the ticket directly with Airline (Normal Cancel)" },
  { value: "001_0", label: "Other – Mentioned the reason in Request Remarks (Normal Cancel)" },
  { value: "016_1", label: "Flight Schedule Changed by Airline (Full Refund)" },
  { value: "005_1", label: "I cancelled the ticket directly with Airline (Full Refund)" },
  { value: "004_1", label: "Received a communication from Airline that Flight is not Operational (Full Refund)" },
  { value: "008_1", label: "Flight Cancelled by the Airline (Full Refund)" },
  { value: "001_1", label: "Other – Mentioned the reason in Request Remarks (Full Refund)" },
  { value: "011_2", label: "Claim No Show Tax Refund (No Show)" },
  { value: "001_2", label: "Other – Mentioned the reason in Request Remarks (No Show)" },
];

function BookingDetails() {
  const navigate = useNavigate();
  const location = useLocation();

  const payload = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    const txId = params.get('TransactionId') || params.get('FlightTransactionId') || params.get('txId');
    if (txId) {
      return {
        TransactionId: Number(txId),
        FlightTransactionId: Number(txId),
        BookingId: params.get('BookingId') || null,
        BookingStatus: params.get('BookingStatus'),
        Vendor: params.get('Vendor'),
        BookingDate: params.get('BookingDate') || new Date().toISOString(),
        AirlinePnrs: params.get('AirlinePnrs') || null,
        TravelDate: params.get('TravelDate') || null,
      };
    }
    if (location.state && (location.state.TransactionId || location.state.FlightTransactionId)) {
      return location.state;
    }
    return location.state || null;
  }, [location.state, location.search]);

  // Clear booking state from localStorage once booking is reached/completed
  useEffect(() => {
    try {
      bookingStore.reset();
      localStorage.removeItem("skyvoo_booking");
      sessionStorage.removeItem("skyvoo_booking");
      localStorage.removeItem("skyvoo_pending_booking_payload");
      localStorage.removeItem("skyvoo_pg_txn_id");
    } catch (e) {
      // ignore
    }
  }, []);

  // State for Print Ticket
  const [printError, setPrintError] = useState("");

  // State for Cancellation Modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCompleteCancel, setIsCompleteCancel] = useState(true);
  const [selectedCancelReason, setSelectedCancelReason] = useState(FF_CANCELLATION_REASONS[0].value);
  const [selectedSegments, setSelectedSegments] = useState({});
  const [selectedTravellers, setSelectedTravellers] = useState({});
  const [openDropdownIdx, setOpenDropdownIdx] = useState(null);
  const [remarks, setRemarks] = useState(FF_CANCELLATION_REASONS[0].label);
  const [afRemarks, setAfRemarks] = useState("");
  const [customRemarks, setCustomRemarks] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [cancelSuccess, setCancelSuccess] = useState("");

  // State for Reschedule Modal
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [rescheduleSelectedSegments, setRescheduleSelectedSegments] = useState({});
  const [rescheduleSelectedTravellers, setRescheduleSelectedTravellers] = useState({});
  const [rescheduleDates, setRescheduleDates] = useState({});
  const [rescheduleOpenDropdownIdx, setRescheduleOpenDropdownIdx] = useState(null);
  const [rescheduleRemarks, setRescheduleRemarks] = useState("");
  const [rescheduleError, setRescheduleError] = useState("");
  const [rescheduleSuccess, setRescheduleSuccess] = useState("");

  // Copy state
  const [copiedField, setCopiedField] = useState(null);

  const handleCopy = (text, fieldKey) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const {
    data: detail,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['bookingDetail', payload?.BookingId, payload?.TransactionId],
    queryFn: async () => {
      if (!payload?.TransactionId) {
        throw new Error("No booking transaction details found.");
      }
      const res = await api.post('/flight/BookingDetail', {
        BookingId: payload?.BookingId || null,
        TransactionId: payload?.TransactionId,
        BookingStatus: payload?.BookingStatus,
        Vendor: payload?.Vendor
      });
      if (res.data?.IsSuccess) {
        return res.data.Data;
      }
      throw new Error(res.data?.ErrorMessage || 'Failed to fetch booking details');
    },
    enabled: !!payload?.TransactionId,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Parse inner BookingResponse JSON string
  const parsedResponse = React.useMemo(() => {
    if (!detail?.BookingResponse) return null;
    try {
      return JSON.parse(detail.BookingResponse);
    } catch (e) {
      console.error("Error parsing BookingResponse:", e);
      return null;
    }
  }, [detail]);

  const order = parsedResponse?.Order;
  const airInfo = parsedResponse?.ItemInfos?.AIR;
  const tripInfos = React.useMemo(() => airInfo?.TripInfos ?? [], [airInfo]);
  const bookingTravellers = React.useMemo(() => airInfo?.TravellerInfoList ?? [], [airInfo]);
  const gstInfo = parsedResponse?.GstInfo || parsedResponse?.gstInfo || detail?.GstInfo || detail?.gstInfo;

  // Sync state for cancellation and reschedule selection when data is loaded
  useEffect(() => {
    if (tripInfos.length > 0 && bookingTravellers.length > 0) {
      const initialSegs = {};
      const initialTravs = {};
      const initialReschedDates = {};

      tripInfos.forEach((trip, tIdx) => {
        const segments = trip.SegmentList ?? [];
        const firstSeg = segments[0];
        initialSegs[tIdx] = true;
        initialTravs[tIdx] = bookingTravellers.map(t => t.PassengerId);
        initialReschedDates[tIdx] = getYYYYMMDD(firstSeg?.dt) || "";
      });

      setSelectedSegments(initialSegs);
      setSelectedTravellers(initialTravs);
      setRescheduleSelectedSegments(initialSegs);
      setRescheduleSelectedTravellers(initialTravs);
      setRescheduleDates(initialReschedDates);
    }
  }, [tripInfos, bookingTravellers]);

  // Helper to parse API response messages with support for Data string & Mail errors
  const parseApiResponse = (data, defaultSuccessMsg) => {
    if (!data) return { isSuccess: false, message: "No response received from server." };

    const rawData = data.Data;
    const isDataString = typeof rawData === 'string' && rawData.trim().length > 0;
    const dataStringLower = isDataString ? rawData.toLowerCase().trim() : '';

    const errorMsg =
      data.ErrorMessage ||
      (!isDataString && (rawData?.ErrorMessage || rawData?.Message)) ||
      null;

    const errorMsgLower = (errorMsg && typeof errorMsg === 'string') ? errorMsg.toLowerCase() : '';

    // Check if error is solely due to email sending failure while ticket action succeeded
    const isMailSendingError =
      errorMsgLower.includes('sending mail') ||
      errorMsgLower.includes('failure sending mail') ||
      errorMsgLower.includes('fail sending mail');

    if (isMailSendingError) {
      return {
        isSuccess: true,
        message: data.SuccessMessage || defaultSuccessMsg || "Request submitted successfully!"
      };
    }

    // Check if Data string explicitly indicates a failure
    const isFailedString = isDataString && (
      dataStringLower.includes('fail') ||
      dataStringLower.includes('error') ||
      dataStringLower.includes('reject') ||
      dataStringLower.includes('invalid') ||
      dataStringLower.includes('denied')
    );

    if (errorMsg || !data.IsSuccess || isFailedString) {
      return {
        isSuccess: false,
        message: errorMsg || (isDataString ? rawData : "Request failed. Please try again.")
      };
    }

    const successMsg =
      data.SuccessMessage ||
      (isDataString ? rawData : (rawData?.SuccessMessage || rawData?.Message)) ||
      defaultSuccessMsg;

    return {
      isSuccess: true,
      message: successMsg
    };
  };

  // Cancel Ticket Mutation
  const cancelMutation = useMutation({
    mutationFn: async (cancelPayload) => {
      const res = await api.post('/flight/CancelTicket', cancelPayload);
      return res.data;
    },
    onSuccess: (data) => {
      const result = parseApiResponse(data, "Ticket cancellation request submitted successfully!");
      if (result.isSuccess) {
        setCancelSuccess(result.message);
        setTimeout(() => {
          setIsCancelModalOpen(false);
          refetch();
        }, 2000);
      } else {
        setCancelError(result.message);
      }
    },
    onError: (err) => {
      const serverError =
        err?.response?.data?.ErrorMessage ||
        err?.response?.data?.Data?.ErrorMessage ||
        (typeof err?.response?.data?.Data === 'string' ? err?.response?.data?.Data : null) ||
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.message ||
        "An error occurred during ticket cancellation.";

      const serverErrorLower = typeof serverError === 'string' ? serverError.toLowerCase() : '';
      if (serverErrorLower.includes('sending mail') || serverErrorLower.includes('failure sending mail')) {
        setCancelSuccess("Ticket cancellation request submitted successfully!");
        setTimeout(() => {
          setIsCancelModalOpen(false);
          refetch();
        }, 2000);
      } else {
        setCancelError(serverError);
      }
    }
  });

  // Reschedule Ticket Mutation
  const rescheduleMutation = useMutation({
    mutationFn: async (reschedPayload) => {
      const res = await api.post('/flight/RescheduleTicket', reschedPayload);
      return res.data;
    },
    onSuccess: (data) => {
      const result = parseApiResponse(data, "Ticket reschedule request submitted successfully!");
      if (result.isSuccess) {
        setRescheduleSuccess(result.message);
        setTimeout(() => {
          setIsRescheduleModalOpen(false);
          refetch();
        }, 2000);
      } else {
        setRescheduleError(result.message);
      }
    },
    onError: (err) => {
      const serverError =
        err?.response?.data?.ErrorMessage ||
        err?.response?.data?.Data?.ErrorMessage ||
        (typeof err?.response?.data?.Data === 'string' ? err?.response?.data?.Data : null) ||
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.message ||
        "An error occurred during ticket rescheduling.";

      const serverErrorLower = typeof serverError === 'string' ? serverError.toLowerCase() : '';
      if (serverErrorLower.includes('sending mail') || serverErrorLower.includes('failure sending mail')) {
        setRescheduleSuccess("Ticket reschedule request submitted successfully!");
        setTimeout(() => {
          setIsRescheduleModalOpen(false);
          refetch();
        }, 2000);
      } else {
        setRescheduleError(serverError);
      }
    }
  });



  const handleCancelSubmit = () => {
    setCancelError("");
    setCancelSuccess("");

    const detectedVendor = (detail?.Vendor || payload?.Vendor || "").toString().toUpperCase().trim();
    const isAFVendor = detectedVendor === "AF";

    let cancelCode = "";
    let cancelType = 0;
    let finalRemarks = "";

    if (isAFVendor) {
      if (!afRemarks.trim()) {
        setCancelError("Please enter a cancellation reason.");
        return;
      }
      finalRemarks = afRemarks.trim();
    } else {
      const selectedOptionObj = FF_CANCELLATION_REASONS.find(r => r.value === selectedCancelReason) || FF_CANCELLATION_REASONS[0];
      if (!selectedOptionObj) {
        setCancelError("Please select a cancellation reason.");
        return;
      }

      const parts = (selectedCancelReason || "015_0").split('_');
      cancelCode = parts[0];
      cancelType = Number(parts[1] || 0);

      if (selectedCancelReason.startsWith('001_')) {
        if (!customRemarks.trim()) {
          setCancelError("Please mention the reason in Request Remarks.");
          return;
        }
        finalRemarks = customRemarks.trim();
      } else {
        finalRemarks = customRemarks.trim() || selectedOptionObj.label;
      }
    }

    let tripsPayload = [];

    if (isCompleteCancel) {
      // Loop through all segments and include all travellers
      tripInfos.forEach((trip) => {
        const segments = trip.SegmentList ?? [];
        segments.forEach((seg) => {
          const dep = seg.da;
          const arr = seg.aa;
          const depCode = dep?.code || dep?.cityCode || dep?.city || dep?.name || '';
          const arrCode = arr?.code || arr?.cityCode || arr?.city || arr?.name || '';
          const segKey = `${depCode}-${arrCode}`;
          const pnr = bookingTravellers[0]?.PnrDetails?.[segKey] ?? payload?.AirlinePnrs ?? "—";

          tripsPayload.push({
            Source: depCode,
            Destination: arrCode,
            TripSegments: `${depCode}-${arrCode}`,
            DepartureDate: getYYYYMMDD(seg.dt),
            PNR: pnr,
            Travellers: bookingTravellers.map(t => ({
              FirstName: t.FirstName,
              LastName: t.LastName,
              PassengerId: t.PassengerId,
              FlightId: seg.flightId || "",
              SegmentId: seg.segmentId || "0",
              PaxId: t.PaxId
            }))
          });
        });
      });
    } else {
      // Loop through selected trips
      let hasError = false;
      tripInfos.forEach((trip, tIdx) => {
        if (selectedSegments[tIdx]) {
          const segments = trip.SegmentList ?? [];
          const firstSeg = segments[0];
          const lastSeg = segments[segments.length - 1];
          const firstDep = firstSeg?.da?.code || firstSeg?.da?.cityCode || firstSeg?.da?.city || firstSeg?.da?.name || '';
          const lastArr = lastSeg?.aa?.code || lastSeg?.aa?.cityCode || lastSeg?.aa?.city || lastSeg?.aa?.name || '';
          const tripRoute = `${firstDep} → ${lastArr}`;

          const checkedTravellerIds = selectedTravellers[tIdx] || [];
          if (checkedTravellerIds.length === 0) {
            setCancelError(`Please select at least one passenger for trip ${tripRoute}`);
            hasError = true;
            return;
          }

          const travellersList = bookingTravellers.filter(t => checkedTravellerIds.includes(t.PassengerId));

          segments.forEach((seg) => {
            const dep = seg.da;
            const arr = seg.aa;
            const depCode = dep?.code || dep?.cityCode || dep?.city || dep?.name || '';
            const arrCode = arr?.code || arr?.cityCode || arr?.city || arr?.name || '';
            const segKey = `${depCode}-${arrCode}`;
            const pnr = bookingTravellers[0]?.PnrDetails?.[segKey] ?? payload?.AirlinePnrs ?? "—";

            tripsPayload.push({
              Source: depCode,
              Destination: arrCode,
              TripSegments: `${depCode}-${arrCode}`,
              DepartureDate: getYYYYMMDD(seg.dt),
              PNR: pnr,
              Travellers: travellersList.map(t => ({
                FirstName: t.FirstName,
                LastName: t.LastName,
                PassengerId: t.PassengerId,
                FlightId: seg.flightId || "",
                SegmentId: seg.segmentId || "0",
                PaxId: t.PaxId
              }))
            });
          });
        }
      });

      if (hasError) return;

      if (tripsPayload.length === 0) {
        setCancelError("Please select at least one flight trip to cancel.");
        return;
      }
    }

    const cancelPayload = {
      BookingId: order?.BookingId || payload?.BookingId || null,
      TransactionId: payload?.TransactionId,
      Type: "F",
      Vendor: detail?.Vendor || payload?.Vendor || (isAFVendor ? "AF" : "FF"),
      IsCompleteCancel: isCompleteCancel,
      CancelType: cancelType,
      CancelCode: cancelCode,
      Remarks: finalRemarks,
      Trips: tripsPayload,
      SelectedTrip: true
    };

    cancelMutation.mutate(cancelPayload);
  };

  const handleRescheduleSubmit = () => {
    setRescheduleError("");
    setRescheduleSuccess("");

    if (!rescheduleRemarks || !rescheduleRemarks.trim()) {
      setRescheduleError("Reschedule remarks are required. Please enter a remark.");
      return;
    }

    let tripsPayload = [];
    let hasError = false;

    tripInfos.forEach((trip, tIdx) => {
      if (rescheduleSelectedSegments[tIdx]) {
        const segments = trip.SegmentList ?? [];
        const firstSeg = segments[0];
        const lastSeg = segments[segments.length - 1];
        const firstDep = firstSeg?.da?.code || firstSeg?.da?.cityCode || firstSeg?.da?.city || firstSeg?.da?.name || '';
        const lastArr = lastSeg?.aa?.code || lastSeg?.aa?.cityCode || lastSeg?.aa?.city || lastSeg?.aa?.name || '';
        const tripRoute = `${firstDep} → ${lastArr}`;
        const reschedDate = rescheduleDates[tIdx];

        if (!reschedDate) {
          setRescheduleError(`Please select a new reschedule date for trip ${tripRoute}`);
          hasError = true;
          return;
        }

        const bookingCreatedOn = order?.BookingCreatedOn || detail?.BookingCreatedOn || detail?.BookingDate || detail?.CreatedOn || payload?.BookingDate || detail?.TransactionDate;
        const todayStr = getTodayDateString();
        const maxDateStr = getBookingMaxRescheduleDate(bookingCreatedOn, firstSeg?.dt);
        if (reschedDate < todayStr) {
          setRescheduleError(`Reschedule date cannot be in the past for trip ${tripRoute}`);
          hasError = true;
          return;
        }
        if (reschedDate > maxDateStr) {
          setRescheduleError(`Reschedule date cannot be more than 90 days from the booking creation date (max allowed: ${maxDateStr}) for trip ${tripRoute}`);
          hasError = true;
          return;
        }

        const checkedTravellerIds = rescheduleSelectedTravellers[tIdx] || [];
        if (checkedTravellerIds.length === 0) {
          setRescheduleError(`Please select at least one passenger for trip ${tripRoute}`);
          hasError = true;
          return;
        }

        const travellersList = bookingTravellers.filter(t => checkedTravellerIds.includes(t.PassengerId));

        segments.forEach((seg) => {
          const dep = seg.da;
          const arr = seg.aa;
          const depCode = dep?.code || dep?.cityCode || dep?.city || dep?.name || '';
          const arrCode = arr?.code || arr?.cityCode || arr?.city || arr?.name || '';
          const segKey = `${depCode}-${arrCode}`;
          const pnr = bookingTravellers[0]?.PnrDetails?.[segKey] ?? payload?.AirlinePnrs ?? "—";

          tripsPayload.push({
            Source: depCode,
            Destination: arrCode,
            TripSegments: `${depCode}-${arrCode}`,
            DepartureDate: getYYYYMMDD(seg.dt),
            RescheduleDate: reschedDate,
            NewDate: reschedDate,
            PNR: pnr,
            Travellers: travellersList.map(t => ({
              FirstName: t.FirstName,
              LastName: t.LastName,
              PassengerId: t.PassengerId,
              FlightId: seg.flightId || "",
              SegmentId: seg.segmentId || "0",
              PaxId: t.PaxId
            }))
          });
        });
      }
    });

    if (hasError) return;

    if (tripsPayload.length === 0) {
      setRescheduleError("Please select at least one flight trip to reschedule.");
      return;
    }

    const reschedPayload = {
      BookingId: order?.BookingId || payload?.BookingId || null,
      TransactionId: payload?.TransactionId,
      Trips: tripsPayload,
      SelectedTrip: true,
      Remarks: rescheduleRemarks.trim(),
      Vendor: detail?.Vendor || payload?.Vendor || "AF"
    };

    rescheduleMutation.mutate(reschedPayload);
  };

  const currentStatus = order?.BookingStatus || payload?.BookingStatus || detail?.BookingStatus || "";
  const statusDisplay = getBookingStatusDisplay(currentStatus);
  const isCancellable = statusDisplay.isConfirmed;

  if (!payload?.TransactionId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Invalid Access</h2>
        <p className="text-slate-500 mt-2">No booking reference details were found. Please navigate from your bookings list.</p>
        <button
          onClick={() => navigate('/my-profile')}
          className="mt-6 px-6 py-2.5 bg-[#78080B] text-white rounded-xl font-medium hover:bg-[#5a0608] transition cursor-pointer"
        >
          Go to Profile
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 relative bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${detailBg})` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition mb-6 cursor-pointer font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bookings
        </button>

        {isLoading && <BookingDetailsSkeleton />}

        {
          isError && (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm px-6 text-center">
              <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
              <p className="text-slate-800 font-bold text-lg">Failed to load booking details</p>
              <p className="text-slate-500 text-sm mt-1 max-w-md">{error?.message || "Something went wrong"}</p>
              <button
                onClick={() => navigate('/my-profile')}
                className="mt-6 px-5 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition cursor-pointer text-sm font-medium"
              >
                Go to Profile
              </button>
            </div>
          )
        }

        {!isLoading && !isError && detail && (
          <div className="space-y-6">
            {/* Header Status Card */}
            <div className="bg-gradient-to-r from-[#6B0408] via-[#7B080E] to-[#60050A] rounded-2xl p-6 sm:px-8 sm:py-6 text-white shadow-md relative overflow-hidden">
              {/* Airplane Watermark Background */}
              <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end opacity-15 pointer-events-none pr-6">
                <Plane className="w-84 h-84 -rotate-12 transform translate-x-14 translate-y-4" />
              </div>

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Left Column: Confirmation & Booking ID */}
                <div className="space-y-1">
                  <p className="text-white/80 text-[11px] font-semibold uppercase tracking-wider">BOOKING CONFIRMATION</p>
                  <div className="flex items-center gap-2.5">
                    {statusDisplay.isConfirmed && (
                      <span className="w-6 h-6 rounded-full bg-[#22C55E] text-white flex items-center justify-center shadow-xs shrink-0" title="Confirmed">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                    {statusDisplay.isPending && (
                      <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center shadow-xs shrink-0" title="Pending">
                        <Clock className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                    {(statusDisplay.isFailed || statusDisplay.isCancelled) && (
                      <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xs shrink-0" title={statusDisplay.text}>
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                    <h2 className="text-2xl sm:text-[28px] font-black tracking-tight leading-none">{statusDisplay.text}</h2>
                  </div>
                  {order?.BookingId && (
                    <div className="flex items-center gap-2 pt-1">
                      <p className="text-white/90 text-sm font-medium">
                        Booking ID: <span className="font-bold text-white tracking-wide">{order.BookingId}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCopy(order.BookingId, 'bookingId')}
                        className="text-white/75 hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
                        title="Copy Booking ID"
                      >
                        {copiedField === 'bookingId' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                  {statusDisplay.isPending && (
                    <p className="text-amber-200 text-xs mt-1 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      Your booking is in pending state. Please check your booking after some time.
                    </p>
                  )}
                  {statusDisplay.isFailed && (
                    <p className="text-rose-200 text-xs mt-1 font-medium flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Payment or booking was unsuccessful.
                    </p>
                  )}
                </div>

                {/* Middle Column: Dynamic Confirmation / Status Message with Vertical Divider */}
                <div className="hidden md:flex items-center gap-6 flex-1 max-w-md px-6 border-l border-white/20">
                  <div className="space-y-0.5">
                    {statusDisplay.isConfirmed ? (
                      <>
                        <p className="text-sm font-bold text-white leading-snug">Your flight has been successfully booked!</p>
                        <p className="text-xs text-white/80 leading-relaxed">
                          A confirmation email has been sent to your registered email address.
                        </p>
                      </>
                    ) : statusDisplay.isPending ? (
                      <>
                        <p className="text-sm font-bold text-white leading-snug">Booking is pending confirmation</p>
                        <p className="text-xs text-white/80 leading-relaxed">
                          We are awaiting confirmation from the airline. Please check back shortly.
                        </p>
                      </>
                    ) : statusDisplay.isCancelled ? (
                      <>
                        <p className="text-sm font-bold text-white leading-snug">Booking has been cancelled</p>
                        <p className="text-xs text-white/80 leading-relaxed">
                          Your flight booking cancellation has been processed.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-white leading-snug">Payment / Booking Failed</p>
                        <p className="text-xs text-white/80 leading-relaxed">
                          Your transaction could not be completed. If amount was debited, it will be refunded.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Column: Transaction ID with Vertical Divider */}
                <div className="md:border-l md:border-white/20 md:pl-8 text-left md:text-right shrink-0">
                  <p className="text-white/80 text-xs font-medium mb-1">Transaction ID</p>
                  <p className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">#{payload?.TransactionId || detail?.TransactionId || 1}</p>
                </div>
              </div>
            </div>

            {/* Actions Bar & Booking Date */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Print Ticket Button - Opens directly in new tab with print view */}
                  <button
                    type="button"
                    onClick={() => {
                      const txId = payload?.TransactionId || detail?.TransactionId || '';
                      const bId = order?.BookingId || detail?.BookingId || payload?.BookingId || '';
                      const bStatus = payload?.BookingStatus || detail?.BookingStatus || 'Confirmed';
                      const v = detail?.Vendor || payload?.Vendor || 'FF';
                      const url = `/print-ticket?TransactionId=${encodeURIComponent(txId)}&BookingId=${encodeURIComponent(bId)}&BookingStatus=${encodeURIComponent(bStatus)}&Vendor=${encodeURIComponent(v)}`;
                      window.open(url, '_blank');
                    }}
                    className="bg-[#0B132B] hover:bg-[#1C2541] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2 shadow-sm"
                  >
                    <Printer className="w-4.5 h-4.5" />
                    <span>Print Ticket</span>
                  </button>

                  {isCancellable && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setCancelError("");
                          setCancelSuccess("");
                          const v = (detail?.Vendor || payload?.Vendor || "").toString().toUpperCase().trim();
                          if (v === "AF") {
                            setAfRemarks("");
                          } else {
                            setSelectedCancelReason(FF_CANCELLATION_REASONS[0].value);
                            setRemarks(FF_CANCELLATION_REASONS[0].label);
                            setCustomRemarks("");
                          }
                          setIsCancelModalOpen(true);
                        }}
                        className="relative z-10 bg-white hover:bg-rose-50/60 text-[#7B080E] border border-rose-300 px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2 shadow-xs"
                      >
                        <XCircle className="w-4.5 h-4.5 text-[#E11D48]" />
                        <span>Cancellation</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRescheduleError("");
                          setRescheduleSuccess("");
                          setIsRescheduleModalOpen(true);
                        }}
                        className="relative z-10 bg-[#7B080E] hover:bg-[#5C0509] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2 shadow-sm hover:shadow"
                      >
                        <Calendar className="w-4.5 h-4.5 text-white" />
                        <span>Reschedule</span>
                      </button>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden lg:block w-px h-8 bg-slate-200" />

                  {/* Booking Date (Right side) */}
                  <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200/80 rounded-xl sm:self-center shrink-0">
                    <Calendar className="w-5 h-5 text-[#F59E0B] shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">BOOKING DATE</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-800">
                        {formatBookingDate(order?.BookingCreatedOn || payload?.BookingDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {printError && (
                <div className="w-full p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center justify-between animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{printError}</span>
                  </div>
                  <button onClick={() => setPrintError("")} className="text-red-500 hover:text-red-800 p-1 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Flight Route Cards */}
            {(() => {
              const isMultiTrip = tripInfos.length > 1;
              return tripInfos.map((trip, tIdx) => {
                const segments = trip.SegmentList ?? [];
                const tripPriceItem = trip.TotalPriceList?.[0];
                const isConnecting = segments.length > 1;
                const routeCodes = [];
                segments.forEach((seg, sIdx) => {
                  const d = seg.da?.code || seg.da?.cityCode || seg.da?.city || seg.da?.name;
                  const a = seg.aa?.code || seg.aa?.cityCode || seg.aa?.city || seg.aa?.name;
                  if (sIdx === 0 && d) routeCodes.push(d);
                  if (a) routeCodes.push(a);
                });
                const connectingRouteText = routeCodes.length > 0 ? routeCodes.join(' → ') : '';
                const tripTitle = isMultiTrip
                  ? (tIdx === 0 ? "Departure Flight - Flight Details" : (tIdx === 1 ? "Return Flight - Flight Details" : `Trip ${tIdx + 1} - Flight Details`))
                  : "Flight Segment Route Details";

                return (
                  <div key={tIdx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="bg-[#7B080E] px-6 py-3.5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Plane className="w-5 h-5 text-white -rotate-45" />
                        <span className="text-white text-sm sm:text-base font-bold">{tripTitle}</span>
                        {connectingRouteText && (
                          <span className="text-xs bg-white/20 text-white px-2.5 py-0.5 rounded-full font-bold ml-1">
                            {connectingRouteText} {isConnecting ? '(Connecting Flight)' : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isConnecting && (
                          <span className="text-xs bg-amber-500/30 text-amber-100 border border-amber-400/40 px-2.5 py-0.5 rounded-full font-medium">
                            {segments.length - 1} Stop
                          </span>
                        )}
                        {tripPriceItem?.FareIdentifier && (
                          <span className="text-xs border border-white/30 text-white px-3 py-0.5 rounded-full font-medium tracking-wide">
                            {tripPriceItem.FareIdentifier}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {segments.map((seg, sIdx) => {
                        const airline = seg.fD?.aI;
                        const dep = seg.da;
                        const arr = seg.aa;
                        const durationMins = seg.duration ?? 0;
                        const dHrs = Math.floor(durationMins / 60);
                        const dMins = durationMins % 60;
                        const durationStr = dHrs > 0 ? `${dHrs}h ${dMins}m` : `${dMins}m`;

                        // PNR for this specific segment from first traveller
                        const depCode = dep?.code || dep?.cityCode || dep?.city || dep?.name || '';
                        const arrCode = arr?.code || arr?.cityCode || arr?.city || arr?.name || '';
                        const segKey = `${depCode}-${arrCode}`.toUpperCase();
                        let pnr = "—";
                        if (bookingTravellers[0]?.PnrDetails && typeof bookingTravellers[0].PnrDetails === 'object') {
                          for (const [k, v] of Object.entries(bookingTravellers[0].PnrDetails)) {
                            const cleanK = k.toUpperCase().replace(/\s+/g, '');
                            if ((cleanK === segKey || cleanK.replace('-', '') === segKey.replace('-', '')) && v) {
                              pnr = String(v).trim();
                              break;
                            }
                          }

                          // If connecting segment did not directly match, match by other segments of this trip or full trip route
                          if (pnr === "—") {
                            const currentTripSegments = segments || [];
                            const currentTripSectorKeys = currentTripSegments.map(s => {
                              const d = s.da?.code || s.da?.cityCode || s.da?.city || s.da?.name || '';
                              const a = s.aa?.code || s.aa?.cityCode || s.aa?.city || s.aa?.name || '';
                              return `${d}-${a}`.toUpperCase();
                            });
                            const firstD = currentTripSegments[0]?.da;
                            const lastA = currentTripSegments[currentTripSegments.length - 1]?.aa;
                            const origCode = (firstD?.code || firstD?.cityCode || firstD?.city || firstD?.name || '').toUpperCase();
                            const destinationCode = (lastA?.code || lastA?.cityCode || lastA?.city || lastA?.name || '').toUpperCase();
                            if (origCode && destinationCode) currentTripSectorKeys.push(`${origCode}-${destinationCode}`);

                            for (const [k, v] of Object.entries(bookingTravellers[0].PnrDetails)) {
                              const cleanK = k.toUpperCase().replace(/\s+/g, '');
                              if (currentTripSectorKeys.some(sk => sk === cleanK || sk.replace('-', '') === cleanK.replace('-', '')) && v) {
                                pnr = String(v).trim();
                                break;
                              }
                            }
                          }
                        }
                        if (pnr === "—" && tripInfos.length === 1) {
                          pnr = payload?.AirlinePnrs || "—";
                        }

                        // Baggage & meal allowance extraction
                        const segPaxFd = seg.bI?.tI?.[0]?.fd;
                        const segBi = segPaxFd?.bI || tripPriceItem?.fd?.ADULT?.bI || tripPriceItem?.fd?.CHILD?.bI;
                        const checkInBaggage = segBi?.iB ? (segBi.iB.toString().toLowerCase().includes('k') ? segBi.iB : `${segBi.iB} Kg`) : "15 Kg";
                        const cabinBaggage = segBi?.cB ? (segBi.cB.toString().toLowerCase().includes('k') ? segBi.cB : `${segBi.cB} Kg`) : "10 Kg";
                        const cabinClass = segPaxFd?.cc || tripPriceItem?.fd?.ADULT?.cc || "ECONOMY";
                        const isMealIncluded = segPaxFd?.mI || tripPriceItem?.fd?.ADULT?.mI || false;

                        const depDateInfo = formatSegmentDateDisplay(seg.dt);
                        const arrDateInfo = formatSegmentDateDisplay(seg.at);

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
                                <div className="px-5 py-2 bg-slate-50 border-y border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 border-t border-dashed border-orange-300" />
                                    <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full">
                                      <Clock className="w-3.5 h-3.5" />
                                      Layover at {connectionCity}: {connectionTimeStr}
                                    </div>
                                    <div className="flex-1 border-t border-dashed border-orange-300" />
                                  </div>
                                </div>
                              );
                            }
                          }
                        }

                        const airlineLogoSrc = airline?.code ? getAirlineLogo(airline.code) : null;

                        return (
                          <div key={sIdx}>
                            {connectionBanner}
                            <div className="p-6 sm:p-7 space-y-6">
                              {/* Airline & PNR Row */}
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    {airlineLogoSrc ? (
                                      <img
                                        src={airlineLogoSrc}
                                        alt={airline?.code || "Airline"}
                                        className="h-6 w-6 object-contain rounded-sm shrink-0"
                                      />
                                    ) : (
                                      <Plane className="w-5 h-5 text-red-600" />
                                    )}
                                    <span className="font-extrabold text-slate-900 text-base">{airline?.name || "SpiceJet"}</span>
                                  </div>
                                  <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-[6px] font-semibold">
                                    {airline?.code || "SG"} {seg.fD?.fN || "188"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-slate-400 font-medium">PNR:</span>
                                  <span className="text-sm font-black text-[#7B080E] tracking-wider">{pnr}</span>
                                  {pnr && pnr !== "—" && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(pnr, `pnr_${sIdx}`)}
                                      className="text-slate-400 hover:text-slate-700 p-1 rounded transition cursor-pointer"
                                      title="Copy PNR"
                                    >
                                      {copiedField === `pnr_${sIdx}` ? (
                                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Route Departure - Connector - Arrival Row */}
                              {(() => {
                                const depCode = dep?.code || dep?.cityCode || '';
                                const depMain = depCode || dep?.city || dep?.name || '—';
                                const depCityName = dep?.city || dep?.name || '';
                                const depSub = depCode
                                  ? (depCityName ? `${depCityName} (${depCode})` : `(${depCode})`)
                                  : (dep?.name && dep?.name !== dep?.city ? dep.name : (dep?.city || dep?.name || ''));

                                const arrCode = arr?.code || arr?.cityCode || '';
                                const arrMain = arrCode || arr?.city || arr?.name || '—';
                                const arrCityName = arr?.city || arr?.name || '';
                                const arrSub = arrCode
                                  ? (arrCityName ? `${arrCityName} (${arrCode})` : `(${arrCode})`)
                                  : (arr?.name && arr?.name !== arr?.city ? arr.name : (arr?.city || arr?.name || ''));

                                return (
                                  <div className="flex items-center justify-between gap-3 sm:gap-6">
                                    {/* Departure */}
                                    <div className="w-36 sm:w-44 text-left space-y-0.5">
                                      <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">{depMain}</p>
                                      {depSub && <p className="text-xs text-slate-500 font-medium truncate pt-1">{depSub}</p>}
                                      {dep?.terminal && (
                                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                                          <Building2 className="w-3 h-3 text-slate-400 inline" />
                                          <span>{dep.terminal.startsWith("Terminal") ? dep.terminal : `Terminal ${dep.terminal}`}</span>
                                        </p>
                                      )}
                                      <p className="text-base sm:text-lg font-black text-slate-900 pt-2 leading-none">{depDateInfo.time}</p>
                                      <p className="text-xs text-slate-400 font-medium pt-0.5">{depDateInfo.dateWithTime}</p>
                                    </div>

                                    {/* Left Vertical Dashed Accent */}
                                    <div className="hidden sm:flex flex-col items-center justify-between self-stretch py-1 text-slate-300">
                                      <div className="w-1.5 h-1.5 rounded-full border border-slate-300 bg-white" />
                                      <div className="w-px flex-1 border-r border-dashed border-slate-300 my-1" />
                                      <div className="w-1.5 h-1.5 rounded-full border border-slate-300 bg-white" />
                                    </div>

                                    {/* Flight Connector */}
                                    <div className="flex-1 flex flex-col items-center justify-center gap-1.5 px-2">
                                      <span className="text-xs text-slate-600 font-semibold">{durationStr}</span>
                                      <div className="w-full flex items-center justify-center relative">
                                        <div className="h-px flex-1 bg-slate-200" />
                                        <div className="mx-2 p-1 text-slate-400">
                                          <Plane className="w-4.5 h-4.5 text-slate-400 rotate-45" />
                                        </div>
                                        <div className="h-px flex-1 bg-slate-200" />
                                      </div>
                                      <span className="text-xs text-slate-500 font-medium">
                                        {seg.stops === 0 ? "Non-stop" : `${seg.stops} stop`}
                                      </span>
                                    </div>

                                    {/* Right Vertical Dashed Accent */}
                                    <div className="hidden sm:flex flex-col items-center justify-between self-stretch py-1 text-slate-300">
                                      <div className="w-1.5 h-1.5 rounded-full border border-slate-300 bg-white" />
                                      <div className="w-px flex-1 border-r border-dashed border-slate-300 my-1" />
                                      <div className="w-1.5 h-1.5 rounded-full border border-slate-300 bg-white" />
                                    </div>

                                    {/* Arrival */}
                                    <div className="w-36 sm:w-44 text-right space-y-0.5">
                                      <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">{arrMain}</p>
                                      {arrSub && <p className="text-xs text-slate-500 font-medium truncate pt-1">{arrSub}</p>}
                                      {arr?.terminal && (
                                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 justify-end">
                                          <Building2 className="w-3 h-3 text-slate-400 inline" />
                                          <span>{arr.terminal.startsWith("Terminal") ? arr.terminal : `Terminal ${arr.terminal}`}</span>
                                        </p>
                                      )}
                                      <p className="text-base sm:text-lg font-black text-slate-900 pt-2 leading-none">{arrDateInfo.time}</p>
                                      <p className="text-xs text-slate-400 font-medium pt-0.5">{arrDateInfo.dateWithTime}</p>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Bottom Inclusions Bar */}
                              <div className="bg-[#F8FAFC] border border-slate-200/70 rounded-[14px] px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
                                <div className="flex items-center gap-3">
                                  <Luggage className="w-5 h-5 text-[#7B080E] shrink-0" />
                                  <div>
                                    <p className="text-slate-400 text-[11px] font-medium">Check-in Baggage</p>
                                    <p className="font-extrabold text-slate-900">{checkInBaggage} / person</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <Luggage className="w-5 h-5 text-[#7B080E] shrink-0" />
                                  <div>
                                    <p className="text-slate-400 text-[11px] font-medium">Cabin Baggage</p>
                                    <p className="font-extrabold text-slate-900">{cabinBaggage} / person</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <Armchair className="w-5 h-5 text-[#7B080E] shrink-0" />
                                  <div>
                                    <p className="text-slate-400 text-[11px] font-medium">Class</p>
                                    <p className="font-extrabold text-slate-900 uppercase">{cabinClass}</p>
                                  </div>
                                </div>

                                <div className="hidden lg:block w-px h-8 bg-slate-200" />

                                <div className="flex items-center gap-3">
                                  <Utensils className="w-5 h-5 text-[#F59E0B] shrink-0" />
                                  <div>
                                    <p className="text-slate-400 text-[11px] font-medium">Meal</p>
                                    <p className="font-extrabold text-emerald-600">{isMealIncluded ? "Included (Free)" : "Chargeable / On board"}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}

            {/* Passenger List with Baggage, Seat & Meal Details */}
            {/* Passenger List with Baggage, Seat & Meal Details - Grouped by Trip (Departure first, then Return) */}
            {bookingTravellers.length > 0 && (() => {
              const allBookingSegments = [];
              tripInfos.forEach((trip, tIdx) => {
                (trip.SegmentList || []).forEach((seg) => {
                  const dC = seg.da?.code || seg.da?.cityCode || seg.da?.city || seg.da?.name || '';
                  const aC = seg.aa?.code || seg.aa?.cityCode || seg.aa?.city || seg.aa?.name || '';
                  allBookingSegments.push({
                    FlightId: String(seg.FlightId || seg.flightId || seg.SegmentId || seg.segmentId || seg.sI || seg.id || ''),
                    SegmentId: String(seg.SegmentId || seg.segmentId || seg.FlightId || seg.flightId || ''),
                    depCode: dC,
                    arrCode: aC,
                    sectorStr: dC && aC ? `${dC} → ${aC}` : (dC || aC || ''),
                    tripIndex: tIdx,
                  });
                });
              });

              const resolveSsrSector = (secKey, sInfo, sIdx, isRawArray) => {
                const infoKey = typeof sInfo === 'object' && sInfo !== null ? String(sInfo?.Key || sInfo?.SSRKey || sInfo?.FlightId || sInfo?.SegmentId || '') : '';
                const infoSector = typeof sInfo === 'object' && sInfo !== null ? (sInfo?.Sector || sInfo?.sector || sInfo?.Segment || sInfo?.segment || '') : '';

                const sectorCandidate = (secKey && typeof secKey === 'string' && secKey.includes('-'))
                  ? secKey
                  : (infoSector && typeof infoSector === 'string' && infoSector.includes('-') ? infoSector : '');

                if (sectorCandidate) {
                  const cleanSec = sectorCandidate.toUpperCase().replace(/\s+/g, '');
                  const matched = allBookingSegments.find(
                    (seg) => `${seg.depCode}-${seg.arrCode}`.toUpperCase() === cleanSec
                  );
                  if (matched) return matched.sectorStr;
                  return sectorCandidate.replace('-', ' → ');
                }

                if (infoKey || secKey) {
                  const keyToMatch = infoKey || secKey;
                  const matched = allBookingSegments.find(
                    (seg) =>
                      (seg.FlightId && String(seg.FlightId) === String(keyToMatch)) ||
                      (seg.SegmentId && String(seg.SegmentId) === String(keyToMatch))
                  );
                  if (matched) return matched.sectorStr;
                }

                if (!isRawArray && !isNaN(Number(secKey)) && Number(secKey) >= 0 && Number(secKey) < allBookingSegments.length) {
                  const matched = allBookingSegments[Number(secKey)];
                  if (matched) return matched.sectorStr;
                }

                if (typeof sInfo === 'object' && sInfo?.TripType !== undefined) {
                  const tripIdx = Number(sInfo.TripType);
                  const tripSegs = allBookingSegments.filter((seg) => seg.tripIndex === tripIdx);
                  if (tripSegs.length === 1) return tripSegs[0].sectorStr;
                  if (tripSegs.length > 0) return (tripSegs[sIdx] || tripSegs[0]).sectorStr;
                }

                return secKey;
              };

              const isMultiTrip = tripInfos.length > 1;
              const tripsToRender = tripInfos.length > 0 ? tripInfos : [{ SegmentList: [] }];

              return tripsToRender.map((trip, tIdx) => {
                const tripSegments = trip.SegmentList || [];
                const isConnecting = tripSegments.length > 1;
                const firstSeg = tripSegments[0];
                const lastSeg = tripSegments[tripSegments.length - 1];
                const depCode = firstSeg?.da?.code || firstSeg?.da?.cityCode || firstSeg?.da?.city || firstSeg?.da?.name || '';
                const arrCode = lastSeg?.aa?.code || lastSeg?.aa?.cityCode || lastSeg?.aa?.city || lastSeg?.aa?.name || '';

                const routeCodes = [];
                tripSegments.forEach((seg, sIdx) => {
                  const d = seg.da?.code || seg.da?.cityCode || seg.da?.city || seg.da?.name;
                  const a = seg.aa?.code || seg.aa?.cityCode || seg.aa?.city || seg.aa?.name;
                  if (sIdx === 0 && d) routeCodes.push(d);
                  if (a) routeCodes.push(a);
                });
                const connectingRouteText = routeCodes.length > 0 ? routeCodes.join(' → ') : '';
                const tripRouteBadge = connectingRouteText || (depCode && arrCode ? `${depCode} → ${arrCode}` : '');

                const tripTitle = isMultiTrip
                  ? (tIdx === 0 ? "Departure Flight - Passenger Details & Add-ons" : (tIdx === 1 ? "Return Flight - Passenger Details & Add-ons" : `Trip ${tIdx + 1} - Passenger Details & Add-ons`))
                  : "Passenger Details & Add-ons";

                const tripSectorKeys = tripSegments.map(seg => {
                  const d = seg.da?.code || seg.da?.cityCode || seg.da?.city || seg.da?.name || '';
                  const a = seg.aa?.code || seg.aa?.cityCode || seg.aa?.city || seg.aa?.name || '';
                  return `${d}-${a}`.toUpperCase();
                });
                if (depCode && arrCode) {
                  tripSectorKeys.push(`${depCode}-${arrCode}`.toUpperCase());
                }
                const tripFlightIds = tripSegments.map(seg => String(seg.FlightId || seg.flightId || seg.SegmentId || seg.segmentId || seg.sI || seg.id || ''));
                const tripSegmentIds = tripSegments.map(seg => String(seg.SegmentId || seg.segmentId || seg.FlightId || seg.flightId || ''));

                const isSsrForThisTrip = (secKey, sInfo, sIdx, isRawArray) => {
                  if (!isMultiTrip) return true;
                  if (typeof sInfo === 'object' && sInfo?.TripType !== undefined) {
                    return Number(sInfo.TripType) === tIdx;
                  }
                  const infoKey = typeof sInfo === 'object' && sInfo !== null ? String(sInfo?.Key || sInfo?.SSRKey || sInfo?.FlightId || sInfo?.SegmentId || '') : '';
                  const infoSector = typeof sInfo === 'object' && sInfo !== null ? (sInfo?.Sector || sInfo?.sector || sInfo?.Segment || sInfo?.segment || '') : '';
                  const sectorCandidate = (secKey && typeof secKey === 'string' && secKey.includes('-'))
                    ? secKey
                    : (infoSector && typeof infoSector === 'string' && infoSector.includes('-') ? infoSector : '');

                  if (sectorCandidate) {
                    const cleanSec = sectorCandidate.toUpperCase().replace(/\s+/g, '');
                    return tripSectorKeys.some(sk => sk === cleanSec || sk.replace('-', '') === cleanSec.replace('-', ''));
                  }
                  if (infoKey || secKey) {
                    const keyToMatch = String(infoKey || secKey);
                    return tripFlightIds.filter(Boolean).includes(keyToMatch) || tripSegmentIds.filter(Boolean).includes(keyToMatch);
                  }
                  if (!isRawArray && !isNaN(Number(secKey)) && Number(secKey) >= 0 && Number(secKey) < allBookingSegments.length) {
                    return allBookingSegments[Number(secKey)].tripIndex === tIdx;
                  }
                  return false;
                };

                return (
                  <div key={tIdx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="bg-[#78080B] px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-white" />
                        <span className="text-white text-sm font-bold">{tripTitle}</span>
                        {tripRouteBadge && (
                          <span className="text-xs bg-white/20 text-white px-2.5 py-0.5 rounded-full font-bold ml-1">
                            {tripRouteBadge} {isConnecting ? '(Connecting Flight)' : ''}
                          </span>
                        )}
                      </div>
                      <span className="text-xs bg-white/15 text-white px-2.5 py-0.5 rounded-full font-medium">
                        {bookingTravellers.length} {bookingTravellers.length === 1 ? "Passenger" : "Passengers"}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {bookingTravellers.map((trav, idx) => {
                        const allPnrEntries = Object.entries(trav.PnrDetails ?? {});
                        const pnrEntries = isMultiTrip
                          ? allPnrEntries.filter(([route]) => {
                            const cleanRoute = route.toUpperCase().replace(/\s+/g, '');
                            return tripSectorKeys.some(sk => sk === cleanRoute || sk.replace('-', '') === cleanRoute.replace('-', ''));
                          })
                          : allPnrEntries;

                        // Normalize SSR info maps
                        const seatRaw = trav.ssrSeatInfos || trav.SSRSeatInfos || {};
                        const baggageRaw = trav.ssrBaggageInfos || trav.SSRBaggageInfos || {};
                        const mealRaw = trav.ssrMealInfos || trav.SSRMealInfos || {};

                        const seatMap = typeof seatRaw === 'object' && seatRaw !== null ? Object.entries(seatRaw) : [];
                        const baggageMap = typeof baggageRaw === 'object' && baggageRaw !== null ? Object.entries(baggageRaw) : [];
                        const mealMap = typeof mealRaw === 'object' && mealRaw !== null ? Object.entries(mealRaw) : [];
                        const isSeatRawArray = Array.isArray(seatRaw);
                        const isBaggageRawArray = Array.isArray(baggageRaw);
                        const isMealRawArray = Array.isArray(mealRaw);

                        const tripSeats = seatMap.filter(([sector, sInfo], sIdx) => isSsrForThisTrip(sector, sInfo, sIdx, isSeatRawArray));
                        const tripBaggage = baggageMap.filter(([sector, bInfo], bIdx) => isSsrForThisTrip(sector, bInfo, bIdx, isBaggageRawArray));
                        const tripMeals = mealMap.filter(([sector, mInfo], mIdx) => isSsrForThisTrip(sector, mInfo, mIdx, isMealRawArray));

                        // Standard trip baggage
                        const stdBaggage = resolveStandardBaggage(trip, trav);
                        const standardCheckIn = stdBaggage.checkIn;
                        const standardCabin = stdBaggage.cabin;
                        const segPaxFd = firstSeg?.bI?.tI?.[0]?.fd;

                        return (
                          <div key={idx} className="p-5 space-y-4">
                            {/* Passenger Top Info */}
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#78080B] font-bold text-sm shrink-0 border border-slate-200/60">
                                  {idx + 1}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800 text-sm sm:text-base">
                                    {trav.Title} {trav.FirstName} {trav.LastName}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50 font-semibold uppercase">{trav.PaxType}</span>
                                    {trav.DateOfBirth && <span>DOB: {trav.DateOfBirth}</span>}
                                    {trav.PassengerId && <span className="text-slate-400">ID: #{trav.PassengerId}</span>}
                                  </div>
                                </div>
                              </div>

                              {pnrEntries.length > 0 && (
                                <div className="text-left sm:text-right shrink-0 bg-red-50/50 border border-red-100 px-3 py-1.5 rounded-xl">
                                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Route PNR</p>
                                  {pnrEntries.map(([route, pnr]) => {
                                    const cleanPnr = String(pnr || '').trim();
                                    return (
                                      <p key={route} className="text-xs font-semibold text-slate-700">
                                        <span className="text-slate-500">{route}:</span> <span className="font-bold text-[#78080B]">{cleanPnr || "—"}</span>
                                      </p>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Baggage, Seat & Meal Add-on Badges Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                              {/* 1. SEAT INFO */}
                              <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 flex flex-col justify-between gap-1.5">
                                <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                  <div className="p-1 bg-white rounded border border-slate-200 text-[#78080B]">
                                    <Plane className="w-3.5 h-3.5 rotate-90" />
                                  </div>
                                  <span>Seat Allocation</span>
                                </div>

                                <div className="mt-1">
                                  {tripSeats.length > 0 ? (
                                    <div className="space-y-1">
                                      {tripSeats.map(([sector, sInfo], sIdx) => {
                                        const resolvedCode = resolveSeatCode(sInfo) || (typeof sInfo === 'object' ? (sInfo?.Code || sInfo?.Description || sInfo?.SeatNo) : sInfo);
                                        const cleanSeatCode = String(resolvedCode || '').replace(/^SEAT[-:\s]*/i, '').trim();
                                        const amount = typeof sInfo === 'object' ? sInfo?.Amount : null;
                                        const resolvedSector = resolveSsrSector(sector, sInfo, sIdx, isSeatRawArray);
                                        return (
                                          <div key={sector} className="flex items-center justify-between text-xs">
                                            <span className="font-medium text-slate-600">{resolvedSector}:</span>
                                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                              Seat {cleanSeatCode}
                                              {amount ? <span className="text-[10px] text-slate-500 font-normal">(₹{amount})</span> : null}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-500 italic">N/A</p>
                                  )}
                                </div>
                              </div>

                              {/* 2. BAGGAGE INFO */}
                              <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 flex flex-col justify-between gap-1.5">
                                <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                  <div className="p-1 bg-white rounded border border-slate-200 text-[#78080B]">
                                    <Luggage className="w-3.5 h-3.5" />
                                  </div>
                                  <span>Baggage Details</span>
                                </div>

                                <div className="mt-1 space-y-1">
                                  <div className="text-xs text-slate-700 flex items-center justify-between">
                                    <span className="text-slate-500 font-medium">Included:</span>
                                    <span className="font-semibold text-slate-800">{standardCheckIn} Check-in, {standardCabin} Cabin</span>
                                  </div>

                                  {tripBaggage.length > 0 && (
                                    <div className="pt-1 border-t border-slate-200/60 space-y-1">
                                      {tripBaggage.map(([sector, bInfo], bIdx) => {
                                        const bDesc = typeof bInfo === 'object' ? (bInfo?.Description || bInfo?.Code) : bInfo;
                                        const amount = typeof bInfo === 'object' ? bInfo?.Amount : null;
                                        const resolvedSector = resolveSsrSector(sector, bInfo, bIdx, isBaggageRawArray);
                                        return (
                                          <div key={sector} className="flex items-center justify-between text-xs">
                                            <span className="font-medium text-purple-700">Extra ({resolvedSector}):</span>
                                            <span className="inline-flex items-center gap-1 font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                                              {bDesc}
                                              {amount ? <span className="text-[10px] text-purple-600 font-normal">(₹{amount})</span> : null}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* 3. MEAL INFO */}
                              <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 flex flex-col justify-between gap-1.5">
                                <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                  <div className="p-1 bg-white rounded border border-slate-200 text-[#78080B]">
                                    <Utensils className="w-3.5 h-3.5" />
                                  </div>
                                  <span>Meal Preference</span>
                                </div>

                                <div className="mt-1">
                                  {tripMeals.length > 0 ? (
                                    <div className="space-y-1">
                                      {tripMeals.map(([sector, mInfo], mIdx) => {
                                        const mDesc = typeof mInfo === 'object' ? (mInfo?.Description || mInfo?.Code) : mInfo;
                                        const amount = typeof mInfo === 'object' ? mInfo?.Amount : null;
                                        const resolvedSector = resolveSsrSector(sector, mInfo, mIdx, isMealRawArray);
                                        return (
                                          <div key={sector} className="flex items-center justify-between text-xs">
                                            <span className="font-medium text-slate-600">{resolvedSector}:</span>
                                            <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                              {mDesc}
                                              {amount ? <span className="text-[10px] text-amber-600 font-normal">(₹{amount})</span> : null}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-600 font-medium">
                                      {segPaxFd?.mI ? "Complimentary In-flight Meal" : "N/A"}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}

            {/* Fare Breakdown Card */}
            {(() => {
              const fareDetail = airInfo?.TotalPriceInfo?.TotalFareDetail;
              const fC = fareDetail?.fC;
              const afC = fareDetail?.afC;
              const ssrp = afC?.SSRP;

              // Markups & Transaction Fee
              const retailerMarkup = Number(detail?.RetailerMarkup ?? tripInfos[0]?.RetailerMarkup ?? 0);
              const skyvooMarkup = Number(detail?.SkyvooMarkup ?? tripInfos[0]?.SkyvooMarkup ?? 0);
              const transactionFee = Number(detail?.TransactionFee ?? 0);
              const commission = Number(detail?.Commission ?? 0);

              // Raw Base Fare & Taxes
              const rawBaseFare = Number(fC?.BF ?? 0);
              const rawTaxes = Number(fC?.TAF ?? 0);
              const totalAmountToBePay = rawBaseFare + rawTaxes;

              // Base Fare = Math.ceil(rawBaseFare + Math.ceil(skyvooMarkup))
              const baseFare = Math.ceil(rawBaseFare + Math.ceil(skyvooMarkup));

              // Taxes and fees = Math.ceil(rawTaxes + Math.ceil(retailerMarkup) + transactionFee)
              const taxes = Math.ceil(rawTaxes + Math.ceil(retailerMarkup) + transactionFee);

              // Tax breakdown
              const fuelSurcharge = Number(afC?.TAF?.YQ ?? 0);
              const gst = Number(afC?.TAF?.AGST ?? 0);
              const otherTaxes = Number(afC?.TAF?.OT ?? 0);
              const managementFee = Number(afC?.TAF?.MF ?? 0);
              const managementFeeTax = Number(afC?.TAF?.MFT ?? 0);
              const carrierMiscFee = Number(afC?.TAF?.YR ?? 0);

              // SSR (Seats, Baggage, Meals)
              let seatTotal = Number(ssrp?.SP ?? 0);
              let baggageTotal = Number(ssrp?.BP ?? 0);
              let mealTotal = Number(ssrp?.MP ?? 0);
              let totalBaggageMealSeatAmount = Number(fC?.SSRP ?? (seatTotal + baggageTotal + mealTotal));

              if (totalBaggageMealSeatAmount === 0) {
                bookingTravellers.forEach((trav) => {
                  const sInfos = trav.ssrSeatInfos || trav.SSRSeatInfos;
                  if (sInfos && typeof sInfos === 'object') {
                    Object.values(sInfos).forEach((s) => {
                      const amt = Number(s?.Amount || s?.price || 0);
                      totalBaggageMealSeatAmount += amt;
                      seatTotal += amt;
                    });
                  }
                  const bInfos = trav.ssrBaggageInfos || trav.SSRBaggageInfos;
                  if (bInfos && typeof bInfos === 'object') {
                    Object.values(bInfos).forEach((b) => {
                      const amt = Number(b?.Amount || b?.price || 0);
                      totalBaggageMealSeatAmount += amt;
                      baggageTotal += amt;
                    });
                  }
                  const mInfos = trav.ssrMealInfos || trav.SSRMealInfos;
                  if (mInfos && typeof mInfos === 'object') {
                    Object.values(mInfos).forEach((m) => {
                      const amt = Number(m?.Amount || m?.price || 0);
                      totalBaggageMealSeatAmount += amt;
                      mealTotal += amt;
                    });
                  }
                });
              }

              // Multi-trip / Round trip breakdown
              const isRoundTripBooking = (tripInfos?.length ?? 0) > 1;
              const onwardTrip = tripInfos?.[0];
              const returnTrip = isRoundTripBooking ? tripInfos?.[1] : null;

              const getTripBreakdown = (trip) => {
                if (!trip) return null;
                const totalFareDetail = trip.TotalFareDetail || trip.totalFareDetail || trip.TotalPriceInfo?.TotalFareDetail;
                const tpl = trip.TotalPriceList || trip.totalPriceList;
                const tplItem = Array.isArray(tpl) ? tpl[0] : tpl;
                const fd = tplItem?.fd || trip.fd;
                const adultFd = fd?.ADULT || fd?.Adult || fd;
                const fCData = totalFareDetail?.fC || trip.fC || adultFd?.fC || tplItem?.fC || trip.TotalPriceInfo?.fC;
                const afCData = totalFareDetail?.afC || trip.afC || adultFd?.afC || tplItem?.afC || trip.TotalPriceInfo?.afC;

                const rawBf = Number(fCData?.BF || fCData?.bf || 0);
                const rawTaf = Number(fCData?.TAF || fCData?.taf || 0);

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

              const hasTripSplit = isRoundTripBooking && (
                (Number(onwardData?.rawBf) > 0 || Number(returnData?.rawBf) > 0) ||
                (Number(onwardData?.rawTaf) > 0 || Number(returnData?.rawTaf) > 0)
              );

              const onwardBaseFare = hasTripSplit ? (onwardData?.rawBf || 0) : (isRoundTripBooking ? Math.floor(rawBaseFare / 2) : rawBaseFare);
              const returnBaseFare = hasTripSplit ? (returnData?.rawBf || 0) : (isRoundTripBooking ? (rawBaseFare - Math.floor(rawBaseFare / 2)) : 0);

              const onwardRoinetMarkup = (Number(onwardData?.sMarkup) > 0 || Number(returnData?.sMarkup) > 0)
                ? (onwardData?.sMarkup || 0)
                : (isRoundTripBooking ? Math.floor(skyvooMarkup / 2) : skyvooMarkup);
              const returnRoinetMarkup = (Number(onwardData?.sMarkup) > 0 || Number(returnData?.sMarkup) > 0)
                ? (returnData?.sMarkup || 0)
                : (isRoundTripBooking ? (skyvooMarkup - Math.floor(skyvooMarkup / 2)) : 0);

              const onwardCspMarkup = (Number(onwardData?.rMarkup) > 0 || Number(returnData?.rMarkup) > 0)
                ? (onwardData?.rMarkup || 0)
                : (isRoundTripBooking ? Math.floor(retailerMarkup / 2) : retailerMarkup);
              const returnCspMarkup = (Number(onwardData?.rMarkup) > 0 || Number(returnData?.rMarkup) > 0)
                ? (returnData?.rMarkup || 0)
                : (isRoundTripBooking ? (retailerMarkup - Math.floor(retailerMarkup / 2)) : 0);

              const onwardTxnFees = (Number(onwardData?.tFee) > 0 || Number(returnData?.tFee) > 0)
                ? (onwardData?.tFee || 0)
                : (isRoundTripBooking ? Math.floor(transactionFee / 2) : transactionFee);
              const returnTxnFees = (Number(onwardData?.tFee) > 0 || Number(returnData?.tFee) > 0)
                ? (returnData?.tFee || 0)
                : (isRoundTripBooking ? (transactionFee - Math.floor(transactionFee / 2)) : 0);

              const onwardTaxesAndFee = hasTripSplit ? (onwardData?.rawTaf || 0) : (isRoundTripBooking ? Math.floor(rawTaxes / 2) : rawTaxes);
              const returnTaxesAndFee = hasTripSplit ? (returnData?.rawTaf || 0) : (isRoundTripBooking ? (rawTaxes - Math.floor(rawTaxes / 2)) : 0);

              const onwardAirlineGst = (Number(onwardData?.gstVal) > 0 || Number(returnData?.gstVal) > 0) ? (onwardData?.gstVal || 0) : (isRoundTripBooking ? Math.floor(gst / 2) : gst);
              const returnAirlineGst = (Number(onwardData?.gstVal) > 0 || Number(returnData?.gstVal) > 0) ? (returnData?.gstVal || 0) : (isRoundTripBooking ? (gst - Math.floor(gst / 2)) : 0);

              const onwardManagementFee = (Number(onwardData?.mfVal) > 0 || Number(returnData?.mfVal) > 0) ? (onwardData?.mfVal || 0) : (isRoundTripBooking ? Math.floor(managementFee / 2) : managementFee);
              const returnManagementFee = (Number(onwardData?.mfVal) > 0 || Number(returnData?.mfVal) > 0) ? (returnData?.mfVal || 0) : (isRoundTripBooking ? (managementFee - Math.floor(managementFee / 2)) : 0);

              const onwardManagementFeeTax = (Number(onwardData?.mftVal) > 0 || Number(returnData?.mftVal) > 0) ? (onwardData?.mftVal || 0) : (isRoundTripBooking ? Math.floor(managementFeeTax / 2) : managementFeeTax);
              const returnManagementFeeTax = (Number(onwardData?.mftVal) > 0 || Number(returnData?.mftVal) > 0) ? (returnData?.mftVal || 0) : (isRoundTripBooking ? (managementFeeTax - Math.floor(managementFeeTax / 2)) : 0);

              const onwardOtherTaxes = (Number(onwardData?.otVal) > 0 || Number(returnData?.otVal) > 0) ? (onwardData?.otVal || 0) : (isRoundTripBooking ? Math.floor(otherTaxes / 2) : otherTaxes);
              const returnOtherTaxes = (Number(onwardData?.otVal) > 0 || Number(returnData?.otVal) > 0) ? (returnData?.otVal || 0) : (isRoundTripBooking ? (otherTaxes - Math.floor(otherTaxes / 2)) : 0);

              const onwardYQ = (Number(onwardData?.yqVal) > 0 || Number(returnData?.yqVal) > 0) ? (onwardData?.yqVal || 0) : (isRoundTripBooking ? Math.floor(fuelSurcharge / 2) : fuelSurcharge);
              const returnYQ = (Number(onwardData?.yqVal) > 0 || Number(returnData?.yqVal) > 0) ? (returnData?.yqVal || 0) : (isRoundTripBooking ? (fuelSurcharge - Math.floor(fuelSurcharge / 2)) : 0);

              const onwardYR = (Number(onwardData?.yrVal) > 0 || Number(returnData?.yrVal) > 0) ? (onwardData?.yrVal || 0) : (isRoundTripBooking ? Math.floor(carrierMiscFee / 2) : carrierMiscFee);
              const returnYR = (Number(onwardData?.yrVal) > 0 || Number(returnData?.yrVal) > 0) ? (returnData?.yrVal || 0) : (isRoundTripBooking ? (carrierMiscFee - Math.floor(carrierMiscFee / 2)) : 0);

              // Sub Total
              const subTotal = baseFare + taxes;

              // Amount to Pay
              const amountToPay = Math.ceil(totalAmountToBePay + retailerMarkup + Math.ceil(skyvooMarkup) + transactionFee + totalBaggageMealSeatAmount);

              // Convenience Fee
              const convenienceFee = Math.ceil(retailerMarkup);

              // Net Price
              const netPrice = Math.ceil((totalAmountToBePay + Math.ceil(skyvooMarkup) + transactionFee + totalBaggageMealSeatAmount) - Math.ceil(commission));

              return (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="bg-[#78080B] px-5 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-white" />
                      <span className="text-white text-sm font-bold">Fare Summary</span>
                    </div>
                    <span className="text-xs font-semibold text-white/90">
                      Total: ₹ {Math.ceil(amountToPay).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Multi-trip Onward/Return Column Header */}
                    {isRoundTripBooking && (
                      <div className="grid grid-cols-12 gap-1 text-xs font-bold text-slate-500 pb-2 border-b border-slate-100">
                        <div className="col-span-5">&nbsp;</div>
                        <div className="col-span-3 text-right text-slate-700 font-bold uppercase tracking-wider" title="Onward Fare">ONWARD</div>
                        <div className="col-span-4 text-right text-slate-700 font-bold uppercase tracking-wider" title="Return Fare">RETURN</div>
                      </div>
                    )}

                    {/* Base Fare */}
                    <div className="py-1">
                      {isRoundTripBooking ? (
                        <div
                          className="grid grid-cols-12 gap-1 items-center text-sm px-1 -mx-1 py-0.5 rounded transition-colors hover:bg-slate-100/70"
                          title={`Base fare — Onward: ₹${Math.ceil(onwardBaseFare + Math.ceil(onwardRoinetMarkup)).toLocaleString("en-IN")} | Return: ₹${Math.ceil(returnBaseFare + Math.ceil(returnRoinetMarkup)).toLocaleString("en-IN")}`}
                        >
                          <div className="col-span-5 font-semibold text-blue-700 truncate" title="Base fare">Base fare</div>
                          <div className="col-span-3 text-right font-bold text-slate-800 truncate cursor-help" title={`Onward: ₹${Math.ceil(onwardBaseFare + Math.ceil(onwardRoinetMarkup)).toLocaleString("en-IN")}`}>
                            ₹{Math.ceil(onwardBaseFare + Math.ceil(onwardRoinetMarkup)).toLocaleString("en-IN")}
                          </div>
                          <div className="col-span-4 text-right font-bold text-slate-800 truncate cursor-help" title={`Return: ₹${Math.ceil(returnBaseFare + Math.ceil(returnRoinetMarkup)).toLocaleString("en-IN")}`}>
                            ₹{Math.ceil(returnBaseFare + Math.ceil(returnRoinetMarkup)).toLocaleString("en-IN")}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between px-1 -mx-1 py-0.5 rounded transition-colors hover:bg-slate-100/70" title={`Base fare: ₹ ${Math.ceil(baseFare).toLocaleString("en-IN")}`}>
                          <span className="text-sm sm:text-base font-semibold text-blue-700">Base fare</span>
                          <span className="font-bold text-slate-800 text-sm sm:text-base cursor-help" title={`₹ ${Math.ceil(baseFare).toLocaleString("en-IN")}`}>
                            ₹ {Math.ceil(baseFare).toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Taxes & Fees */}
                    <div className="py-1 border-t border-slate-100">
                      {isRoundTripBooking ? (
                        <div
                          className="grid grid-cols-12 gap-1 items-center text-sm mb-2 px-1 -mx-1 py-0.5 rounded transition-colors hover:bg-slate-100/70"
                          title={`Taxes and fees — Onward: ₹${Math.ceil(onwardTaxesAndFee + Math.ceil(onwardCspMarkup) + onwardTxnFees).toLocaleString("en-IN")} | Return: ₹${Math.ceil(returnTaxesAndFee + Math.ceil(returnCspMarkup) + returnTxnFees).toLocaleString("en-IN")}`}
                        >
                          <div className="col-span-5 font-semibold text-blue-700 truncate" title="Taxes and fees">Taxes and fees</div>
                          <div className="col-span-3 text-right font-bold text-slate-800 truncate cursor-help" title={`Onward: ₹${Math.ceil(onwardTaxesAndFee + Math.ceil(onwardCspMarkup) + onwardTxnFees).toLocaleString("en-IN")}`}>
                            ₹{Math.ceil(onwardTaxesAndFee + Math.ceil(onwardCspMarkup) + onwardTxnFees).toLocaleString("en-IN")}
                          </div>
                          <div className="col-span-4 text-right font-bold text-slate-800 truncate cursor-help" title={`Return: ₹${Math.ceil(returnTaxesAndFee + Math.ceil(returnCspMarkup) + returnTxnFees).toLocaleString("en-IN")}`}>
                            ₹{Math.ceil(returnTaxesAndFee + Math.ceil(returnCspMarkup) + returnTxnFees).toLocaleString("en-IN")}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between mb-2 px-1 -mx-1 py-0.5 rounded transition-colors hover:bg-slate-100/70" title={`Taxes and fees: ₹ ${Math.ceil(taxes).toLocaleString("en-IN")}`}>
                          <span className="text-sm sm:text-base font-semibold text-blue-700">Taxes and fees</span>
                          <span className="font-bold text-slate-800 text-sm sm:text-base cursor-help" title={`₹ ${Math.ceil(taxes).toLocaleString("en-IN")}`}>
                            ₹ {Math.ceil(taxes).toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}

                      {/* Tax Breakdown */}
                      <div className="space-y-1.5 pl-2 text-xs text-slate-600">
                        {/* Airline GST */}
                        {(isRoundTripBooking ? (onwardAirlineGst > 0 || returnAirlineGst > 0) : gst > 0) && (
                          <div className="flex items-center justify-between px-1 -mx-1 py-0.5 rounded transition-colors hover:bg-slate-100/70" title={`Airline GST: ₹ ${Math.ceil(isRoundTripBooking ? (onwardAirlineGst + returnAirlineGst) : gst).toLocaleString("en-IN")}`}>
                            <span>Airline GST</span>
                            <span className="cursor-help" title={`₹ ${Math.ceil(isRoundTripBooking ? (onwardAirlineGst + returnAirlineGst) : gst).toLocaleString("en-IN")}`}>₹ {Math.ceil(isRoundTripBooking ? (onwardAirlineGst + returnAirlineGst) : gst).toLocaleString("en-IN")}</span>
                          </div>
                        )}

                        {/* Management Fee */}
                        {(isRoundTripBooking ? (onwardManagementFee > 0 || returnManagementFee > 0) : managementFee > 0) && (
                          <div className="flex items-center justify-between px-1 -mx-1 py-0.5 rounded transition-colors hover:bg-slate-100/70" title={`Management Fee: ₹ ${Math.ceil(isRoundTripBooking ? (onwardManagementFee + returnManagementFee) : managementFee).toLocaleString("en-IN")}`}>
                            <span>Management Fee</span>
                            <span className="cursor-help" title={`₹ ${Math.ceil(isRoundTripBooking ? (onwardManagementFee + returnManagementFee) : managementFee).toLocaleString("en-IN")}`}>₹ {Math.ceil(isRoundTripBooking ? (onwardManagementFee + returnManagementFee) : managementFee).toLocaleString("en-IN")}</span>
                          </div>
                        )}

                        {/* Management Fee Tax */}
                        {(isRoundTripBooking ? (onwardManagementFeeTax > 0 || returnManagementFeeTax > 0) : managementFeeTax > 0) && (
                          <div className="flex items-center justify-between px-1 -mx-1 py-0.5 rounded transition-colors hover:bg-slate-100/70" title={`Management Fee Tax: ₹ ${Math.ceil(isRoundTripBooking ? (onwardManagementFeeTax + returnManagementFeeTax) : managementFeeTax).toLocaleString("en-IN")}`}>
                            <span>Management Fee Tax</span>
                            <span className="cursor-help" title={`₹ ${Math.ceil(isRoundTripBooking ? (onwardManagementFeeTax + returnManagementFeeTax) : managementFeeTax).toLocaleString("en-IN")}`}>₹ {Math.ceil(isRoundTripBooking ? (onwardManagementFeeTax + returnManagementFeeTax) : managementFeeTax).toLocaleString("en-IN")}</span>
                          </div>
                        )}

                        {/* Other Taxes */}
                        {(isRoundTripBooking ? (onwardOtherTaxes > 0 || returnOtherTaxes > 0) : otherTaxes > 0) && (
                          <div className="flex items-center justify-between px-1 -mx-1 py-0.5 rounded transition-colors hover:bg-slate-100/70" title={`Other Taxes: ₹ ${Math.ceil((isRoundTripBooking ? (onwardOtherTaxes + returnOtherTaxes) : otherTaxes) + Math.ceil(retailerMarkup) + transactionFee).toLocaleString("en-IN")}`}>
                            <span>Other Taxes</span>
                            <span className="cursor-help" title={`₹ ${Math.ceil((isRoundTripBooking ? (onwardOtherTaxes + returnOtherTaxes) : otherTaxes) + Math.ceil(retailerMarkup) + transactionFee).toLocaleString("en-IN")}`}>₹ {Math.ceil((isRoundTripBooking ? (onwardOtherTaxes + returnOtherTaxes) : otherTaxes) + Math.ceil(retailerMarkup) + transactionFee).toLocaleString("en-IN")}</span>
                          </div>
                        )}

                        {/* Fuel Surcharge (YQ) */}
                        {(isRoundTripBooking ? (onwardYQ > 0 || returnYQ > 0) : fuelSurcharge > 0) && (
                          <div className="flex items-center justify-between px-1 -mx-1 py-0.5 rounded transition-colors hover:bg-slate-100/70" title={`Fuel Surcharge (YQ): ₹ ${Math.ceil(isRoundTripBooking ? (onwardYQ + returnYQ) : fuelSurcharge).toLocaleString("en-IN")}`}>
                            <span>Fuel Surcharge (YQ)</span>
                            <span className="cursor-help" title={`₹ ${Math.ceil(isRoundTripBooking ? (onwardYQ + returnYQ) : fuelSurcharge).toLocaleString("en-IN")}`}>₹ {Math.ceil(isRoundTripBooking ? (onwardYQ + returnYQ) : fuelSurcharge).toLocaleString("en-IN")}</span>
                          </div>
                        )}

                        {/* Carrier Misc Fee (YR) */}
                        {(isRoundTripBooking ? (onwardYR > 0 || returnYR > 0) : carrierMiscFee > 0) && (
                          <div className="flex items-center justify-between px-1 -mx-1 py-0.5 rounded transition-colors hover:bg-slate-100/70" title={`Carrier Misc Fee (YR): ₹ ${Math.ceil(carrierMiscFee).toLocaleString("en-IN")}`}>
                            <span>Carrier Misc Fee (YR)</span>
                            <span className="cursor-help" title={`₹ ${Math.ceil(carrierMiscFee).toLocaleString("en-IN")}`}>₹ {Math.ceil(carrierMiscFee).toLocaleString("en-IN")}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sub Total */}
                    <div className="py-2 border-t border-slate-100">
                      {isRoundTripBooking ? (
                        <div
                          className="grid grid-cols-12 gap-1 items-center text-sm font-semibold px-1 -mx-1 py-0.5 rounded transition-colors hover:bg-slate-100/70"
                          title={`Sub Total — Onward: ₹${Math.ceil(onwardBaseFare + onwardTaxesAndFee + Math.ceil(onwardRoinetMarkup) + Math.ceil(onwardCspMarkup) + onwardTxnFees).toLocaleString("en-IN")} | Return: ₹${Math.ceil(returnBaseFare + returnTaxesAndFee + Math.ceil(returnRoinetMarkup) + Math.ceil(returnCspMarkup) + returnTxnFees).toLocaleString("en-IN")}`}
                        >
                          <div className="col-span-5 text-slate-700 truncate" title="Sub Total">Sub Total</div>
                          <div className="col-span-3 text-right text-slate-800 truncate cursor-help" title={`Onward: ₹${Math.ceil(onwardBaseFare + onwardTaxesAndFee + Math.ceil(onwardRoinetMarkup) + Math.ceil(onwardCspMarkup) + onwardTxnFees).toLocaleString("en-IN")}`}>
                            ₹{Math.ceil(onwardBaseFare + onwardTaxesAndFee + Math.ceil(onwardRoinetMarkup) + Math.ceil(onwardCspMarkup) + onwardTxnFees).toLocaleString("en-IN")}
                          </div>
                          <div className="col-span-4 text-right text-slate-800 truncate cursor-help" title={`Return: ₹${Math.ceil(returnBaseFare + returnTaxesAndFee + Math.ceil(returnRoinetMarkup) + Math.ceil(returnCspMarkup) + returnTxnFees).toLocaleString("en-IN")}`}>
                            ₹{Math.ceil(returnBaseFare + returnTaxesAndFee + Math.ceil(returnRoinetMarkup) + Math.ceil(returnCspMarkup) + returnTxnFees).toLocaleString("en-IN")}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-sm font-semibold text-slate-700 px-1 -mx-1 py-0.5 rounded transition-colors hover:bg-slate-100/70" title={`Sub Total: ₹ ${Math.ceil(subTotal).toLocaleString("en-IN")}`}>
                          <span>Sub Total</span>
                          <span className="text-slate-800 cursor-help" title={`₹ ${Math.ceil(subTotal).toLocaleString("en-IN")}`}>
                            ₹ {Math.ceil(subTotal).toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Meal, Baggage & Seat */}
                    {totalBaggageMealSeatAmount > 0 && (
                      <div className="py-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-sm font-semibold text-slate-800 mb-1.5 px-1 -mx-1 py-0.5 rounded transition-colors hover:bg-slate-100/70" title={`Meal, Baggage & Seat: ₹ ${Math.ceil(totalBaggageMealSeatAmount).toLocaleString("en-IN")}`}>
                          <span>Meal, Baggage & Seat</span>
                          <span className="cursor-help" title={`₹ ${Math.ceil(totalBaggageMealSeatAmount).toLocaleString("en-IN")}`}>₹ {Math.ceil(totalBaggageMealSeatAmount).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="space-y-1 pl-2 text-xs text-slate-600">
                          {baggageTotal > 0 && (
                            <div className="flex items-center justify-between px-1 -mx-1 py-0.5 rounded transition-colors hover:bg-slate-100/70" title={`Baggage: ₹ ${Math.ceil(baggageTotal).toLocaleString("en-IN")}`}>
                              <span>Baggage</span>
                              <span className="cursor-help" title={`₹ ${Math.ceil(baggageTotal).toLocaleString("en-IN")}`}>₹ {Math.ceil(baggageTotal).toLocaleString("en-IN")}</span>
                            </div>
                          )}
                          {mealTotal > 0 && (
                            <div className="flex items-center justify-between px-1 -mx-1 py-0.5 rounded transition-colors hover:bg-slate-100/70" title={`Meal: ₹ ${Math.ceil(mealTotal).toLocaleString("en-IN")}`}>
                              <span>Meal</span>
                              <span className="cursor-help" title={`₹ ${Math.ceil(mealTotal).toLocaleString("en-IN")}`}>₹ {Math.ceil(mealTotal).toLocaleString("en-IN")}</span>
                            </div>
                          )}
                          {seatTotal > 0 && (
                            <div className="flex items-center justify-between px-1 -mx-1 py-0.5 rounded transition-colors hover:bg-slate-100/70" title={`Seat: ₹ ${Math.ceil(seatTotal).toLocaleString("en-IN")}`}>
                              <span>Seat</span>
                              <span className="cursor-help" title={`₹ ${Math.ceil(seatTotal).toLocaleString("en-IN")}`}>₹ {Math.ceil(seatTotal).toLocaleString("en-IN")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Amount to Pay */}
                    <div className="border-t border-slate-200 pt-3 flex flex-wrap items-center justify-between gap-2 px-1 -mx-1 py-0.5 rounded transition-colors hover:bg-slate-100/70" title={`Amount to Pay: ₹ ${Math.ceil(amountToPay).toLocaleString("en-IN")}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-blue-700">Amount to Pay</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 text-xs px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> Paid & Confirmed
                        </span>
                      </div>
                      <span className="text-2xl font-black text-[#78080B] cursor-help" title={`₹ ${Math.ceil(amountToPay).toLocaleString("en-IN")}`}>
                        ₹ {Math.ceil(amountToPay).toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* Additional Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs sm:text-sm">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 transition-colors hover:bg-slate-100/80 cursor-help" title={`Convenience Fee: ₹ ${Math.ceil(convenienceFee).toLocaleString("en-IN")}`}>
                        <p className="text-slate-400 font-medium">Convenience Fee</p>
                        <p className="font-bold text-slate-700 mt-0.5">₹ {Math.ceil(convenienceFee).toLocaleString("en-IN")}</p>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 transition-colors hover:bg-slate-100/80 cursor-help" title={`Net Price: ₹ ${Math.ceil(netPrice).toLocaleString("en-IN")}`}>
                        <p className="text-slate-400 font-medium">Net Price</p>
                        <p className="font-bold text-slate-700 mt-0.5">₹ {Math.ceil(netPrice).toLocaleString("en-IN")}</p>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 transition-colors hover:bg-slate-100/80 cursor-help" title={`Commission: ₹ ${Math.ceil(commission).toLocaleString("en-IN")}`}>
                        <p className="text-slate-400 font-medium">Commission</p>
                        <p className="font-bold text-slate-700 mt-0.5">₹ {Math.ceil(commission).toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Vendor & Metadata Card */}
            {/* <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-slate-800 text-sm">Booking Verification Details</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <p className="text-slate-400 mb-0.5">Booking Vendor</p>
                  <p className="font-semibold text-slate-700">{detail?.Vendor || payload?.Vendor || '—'}</p>
                </div>
                {order?.BookingUserDetails && (
                  <>
                    <div>
                      <p className="text-slate-400 mb-0.5">Outlet Name</p>
                      <p className="font-semibold text-slate-700">{order.BookingUserDetails.OutletName || '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-0.5">Retailer Code</p>
                      <p className="font-semibold text-slate-700">{order.BookingUserDetails.RetailerCode || '—'}</p>
                    </div>
                  </>
                )}
              </div>
            </div> */}

            {/* GST Information Card */}
            {gstInfo && (gstInfo.gstNumber || gstInfo.GstNumber || gstInfo.registeredName || gstInfo.RegisteredName || gstInfo.email || gstInfo.Email) && (
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-slate-800 text-sm">GST Information</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  {(gstInfo.gstNumber || gstInfo.GstNumber) && (
                    <div>
                      <p className="text-slate-400 mb-0.5">GST Number</p>
                      <p className="font-semibold text-slate-700 uppercase">{gstInfo.gstNumber || gstInfo.GstNumber}</p>
                    </div>
                  )}
                  {(gstInfo.registeredName || gstInfo.RegisteredName) && (
                    <div>
                      <p className="text-slate-400 mb-0.5">Registered Company</p>
                      <p className="font-semibold text-slate-700">{gstInfo.registeredName || gstInfo.RegisteredName}</p>
                    </div>
                  )}
                  {(gstInfo.email || gstInfo.Email) && (
                    <div>
                      <p className="text-slate-400 mb-0.5">Registered Email</p>
                      <p className="font-semibold text-slate-700">{gstInfo.email || gstInfo.Email}</p>
                    </div>
                  )}
                  {(gstInfo.mobile || gstInfo.Mobile) && (
                    <div>
                      <p className="text-slate-400 mb-0.5">Registered Mobile</p>
                      <p className="font-semibold text-slate-700">{gstInfo.mobile || gstInfo.Mobile}</p>
                    </div>
                  )}
                  {(gstInfo.address || gstInfo.Address) && (
                    <div className="sm:col-span-2">
                      <p className="text-slate-400 mb-0.5">Registered Address</p>
                      <p className="font-semibold text-slate-700">{gstInfo.address || gstInfo.Address}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Ticket Cancellation Modal ── */}
      {isCancelModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !cancelMutation.isLoading) setIsCancelModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-visible border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#78080B] to-[#a01014] text-white px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5" />
                <h3 className="text-lg font-bold">Ticket Cancellation</h3>
              </div>
              <button
                disabled={cancelMutation.isLoading}
                onClick={() => setIsCancelModalOpen(false)}
                className="text-white/80 hover:text-white transition cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Error & Success Messages */}
              {cancelError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  {cancelError}
                </div>
              )}
              {cancelSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  {cancelSuccess}
                </div>
              )}

              {/* Cancellation Type Radio Options */}
              <div className="flex gap-4 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/60">
                <button
                  type="button"
                  disabled={cancelMutation.isLoading}
                  onClick={() => setIsCompleteCancel(true)}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition cursor-pointer text-center ${isCompleteCancel
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200/40'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  Complete Cancellation
                </button>
                <button
                  type="button"
                  disabled={cancelMutation.isLoading}
                  onClick={() => setIsCompleteCancel(false)}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition cursor-pointer text-center ${!isCompleteCancel
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200/40'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  Sector Wise Cancellation
                </button>
              </div>

              {/* Trip Segments & Travelers Selection */}
              <div className="border border-slate-200 rounded-2xl shadow-sm bg-white overflow-visible">
                <div className="bg-slate-50 grid grid-cols-12 gap-2 px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 rounded-t-2xl">
                  <span className="col-span-1 text-center">Select</span>
                  <span className="col-span-3">Trip</span>
                  <span className="col-span-3">Departure Date</span>
                  <span className="col-span-5">Travellers</span>
                </div>

                <div className="divide-y divide-slate-100 rounded-b-2xl">
                  {tripInfos.map((trip, tIdx) => {
                    const isLastRow = tIdx === tripInfos.length - 1;
                    const segments = trip.SegmentList ?? [];
                    const firstSeg = segments[0];
                    const lastSeg = segments[segments.length - 1];
                    const originCode = firstSeg?.da?.code || firstSeg?.da?.cityCode || firstSeg?.da?.city || firstSeg?.da?.name || "—";
                    const destCode = lastSeg?.aa?.code || lastSeg?.aa?.cityCode || lastSeg?.aa?.city || lastSeg?.aa?.name || "—";
                    const routeKey = `${originCode}-${destCode}`;
                    const firstSegDep = firstSeg?.da?.code || firstSeg?.da?.cityCode || firstSeg?.da?.city || firstSeg?.da?.name || '';
                    const firstSegArr = firstSeg?.aa?.code || firstSeg?.aa?.cityCode || firstSeg?.aa?.city || firstSeg?.aa?.name || '';
                    const firstSegKey = `${firstSegDep}-${firstSegArr}`;
                    const pnr = bookingTravellers[0]?.PnrDetails?.[routeKey] ?? bookingTravellers[0]?.PnrDetails?.[firstSegKey] ?? payload?.AirlinePnrs ?? "—";
                    const isChecked = !!selectedSegments[tIdx];

                    const currentSelected = selectedTravellers[tIdx] || [];
                    const isAllSelected = currentSelected.length === bookingTravellers.length;

                    const handleToggleTraveller = (passengerId) => {
                      setSelectedTravellers(prev => {
                        const current = prev[tIdx] || [];
                        const updated = current.includes(passengerId)
                          ? current.filter(id => id !== passengerId)
                          : [...current, passengerId];
                        return { ...prev, [tIdx]: updated };
                      });
                    };

                    const handleToggleAllTravellers = () => {
                      setSelectedTravellers(prev => ({
                        ...prev,
                        [tIdx]: isAllSelected ? [] : bookingTravellers.map(t => t.PassengerId)
                      }));
                    };

                    return (
                      <div key={tIdx} className={`grid grid-cols-12 gap-2 px-4 py-4 items-center text-slate-700 ${isLastRow ? 'rounded-b-2xl' : ''}`}>
                        {/* Trip Checkbox */}
                        <div className="col-span-1 flex justify-center">
                          <input
                            type="checkbox"
                            checked={isCompleteCancel ? true : isChecked}
                            disabled={isCompleteCancel || cancelMutation.isLoading}
                            onChange={(e) => {
                              setSelectedSegments(prev => ({
                                ...prev,
                                [tIdx]: e.target.checked
                              }));
                            }}
                            className="w-4.5 h-4.5 text-[#78080B] rounded border-slate-300 focus:ring-[#78080B]/20 cursor-pointer"
                          />
                        </div>

                        {/* Trip Info */}
                        <div className="col-span-3 font-bold text-slate-800">
                          <div className="flex flex-col">
                            <span>{originCode} → {destCode}</span>
                            {pnr && <span className="text-[10px] text-slate-400 font-semibold uppercase">PNR: {pnr}</span>}
                          </div>
                        </div>

                        {/* Departure Date */}
                        <div className="col-span-3 text-xs font-semibold text-slate-500">
                          {getYYYYMMDD(firstSeg?.dt)}
                        </div>

                        {/* Passengers Selection Dropdown */}
                        <div className="col-span-5">
                          {(() => {
                            const activeSelected = isCompleteCancel
                              ? bookingTravellers.map(t => t.PassengerId)
                              : currentSelected;

                            const getButtonText = () => {
                              if (activeSelected.length === 0) return "Select travellers";
                              return bookingTravellers
                                .filter(t => activeSelected.includes(t.PassengerId))
                                .map(t => `${t.FirstName} ${t.LastName} (${t.PaxType})`)
                                .join(', ');
                            };

                            return (
                              <div className="relative">
                                <button
                                  type="button"
                                  disabled={isCompleteCancel || !isChecked || cancelMutation.isLoading}
                                  onClick={() => setOpenDropdownIdx(openDropdownIdx === tIdx ? null : tIdx)}
                                  className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white hover:bg-slate-50 transition cursor-pointer disabled:opacity-75 disabled:bg-slate-50 font-bold text-slate-700 truncate"
                                  title={getButtonText()}
                                >
                                  <span className="truncate mr-1">{getButtonText()}</span>
                                  {!isCompleteCancel && <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                                </button>

                                {openDropdownIdx === tIdx && !isCompleteCancel && (
                                  <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 max-h-48 overflow-y-auto">
                                    <label className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs font-bold border-b border-slate-100 text-slate-800">
                                      <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={handleToggleAllTravellers}
                                        className="text-[#78080B] rounded border-slate-300 focus:ring-[#78080B]/20"
                                      />
                                      Select all
                                    </label>
                                    {bookingTravellers.map(t => (
                                      <label key={t.PassengerId} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-700">
                                        <input
                                          type="checkbox"
                                          checked={currentSelected.includes(t.PassengerId)}
                                          onChange={() => handleToggleTraveller(t.PassengerId)}
                                          className="text-[#78080B] rounded border-slate-300 focus:ring-[#78080B]/20"
                                        />
                                        {t.FirstName} {t.LastName}
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cancellation Reason: AF vs FF Vendor */}
              {(() => {
                const detectedVendor = (detail?.Vendor || payload?.Vendor || "").toString().toUpperCase().trim();
                const isAFVendor = detectedVendor === "AF";

                if (isAFVendor) {
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Cancellation Reason / Remarks <span className="text-rose-500">*</span>
                        </label>
                        {!afRemarks.trim() && cancelError && cancelError.toLowerCase().includes('reason') && (
                          <span className="text-xs text-rose-500 font-medium">Cancellation reason is required</span>
                        )}
                      </div>
                      <textarea
                        rows={3}
                        disabled={cancelMutation.isLoading}
                        value={afRemarks}
                        onChange={(e) => {
                          setAfRemarks(e.target.value);
                          if (cancelError) setCancelError("");
                        }}
                        placeholder="Please enter remarks/reason for ticket cancellation..."
                        className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 placeholder-slate-400 resize-none transition-colors ${!afRemarks.trim() && cancelError && cancelError.toLowerCase().includes('reason')
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/20'
                          : 'border-slate-200 focus:ring-[#78080B]/20 focus:border-[#78080B] bg-slate-50/50'
                          }`}
                      />
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Cancellation Reason <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          disabled={cancelMutation.isLoading}
                          value={selectedCancelReason}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedCancelReason(val);
                            const found = FF_CANCELLATION_REASONS.find(r => r.value === val);
                            if (found) {
                              setRemarks(found.label);
                            }
                            setCancelError("");
                          }}
                          className="w-full px-4 py-3 pr-10 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#78080B]/20 focus:border-[#78080B] appearance-none cursor-pointer transition-colors"
                        >
                          {FF_CANCELLATION_REASONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {selectedCancelReason.startsWith('001_') && (
                      <div className="space-y-1.5 animate-in fade-in duration-150">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Request Remarks <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          disabled={cancelMutation.isLoading}
                          value={customRemarks}
                          onChange={(e) => {
                            setCustomRemarks(e.target.value);
                            setCancelError("");
                          }}
                          placeholder="Please enter remarks explaining your cancellation reason..."
                          className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#78080B]/20 focus:border-[#78080B] resize-none transition-colors"
                        />
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100 rounded-b-3xl">
              <button
                type="button"
                disabled={cancelMutation.isLoading}
                onClick={() => setIsCancelModalOpen(false)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-50"
              >
                Close
              </button>
              <button
                type="button"
                disabled={cancelMutation.isLoading}
                onClick={handleCancelSubmit}
                className="px-5 py-2.5 bg-[#78080B] hover:bg-[#5a0608] text-white rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-md shadow-[#78080B]/10 hover:shadow"
              >
                {cancelMutation.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Ticket'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reschedule Modal ── */}
      {isRescheduleModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#78080B] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5" />
                <h3 className="font-bold text-lg">Reschedule Ticket Booking</h3>
              </div>
              <button
                type="button"
                disabled={rescheduleMutation.isPending}
                onClick={() => setIsRescheduleModalOpen(false)}
                className="text-white/75 hover:text-white transition p-1 hover:bg-white/10 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Feedback Alerts */}
              {rescheduleError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-sm animate-fadeIn">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                  <p className="font-medium">{rescheduleError}</p>
                </div>
              )}

              {rescheduleSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700 text-sm animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                  <p className="font-medium">{rescheduleSuccess}</p>
                </div>
              )}

              <div className="bg-red-50/60 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-[#78080B] text-xs">
                <Calendar className="w-5 h-5 text-[#78080B] shrink-0" />
                <span>
                  Select the sectors you wish to reschedule, pick the new departure date, and choose which passengers will be moved to the new date.
                </span>
              </div>

              {/* Trip Segments & Travelers Selection for Rescheduling */}
              <div className="border border-slate-200 rounded-2xl shadow-sm bg-white overflow-visible">
                <div className="bg-slate-50 grid grid-cols-12 gap-2 px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 rounded-t-2xl">
                  <span className="col-span-1 text-center">Select</span>
                  <span className="col-span-3">Trip Sector</span>
                  <span className="col-span-2">Original Date</span>
                  <span className="col-span-3">Reschedule Date</span>
                  <span className="col-span-3">Travellers</span>
                </div>

                <div className="divide-y divide-slate-100 rounded-b-2xl">
                  {tripInfos.map((trip, tIdx) => {
                    const isLastRow = tIdx === tripInfos.length - 1;
                    const segments = trip.SegmentList ?? [];
                    const firstSeg = segments[0];
                    const lastSeg = segments[segments.length - 1];
                    const originCode = firstSeg?.da?.code || firstSeg?.da?.cityCode || firstSeg?.da?.city || firstSeg?.da?.name || "—";
                    const destCode = lastSeg?.aa?.code || lastSeg?.aa?.cityCode || lastSeg?.aa?.city || lastSeg?.aa?.name || "—";
                    const routeKey = `${originCode}-${destCode}`;
                    const firstSegDep = firstSeg?.da?.code || firstSeg?.da?.cityCode || firstSeg?.da?.city || firstSeg?.da?.name || '';
                    const firstSegArr = firstSeg?.aa?.code || firstSeg?.aa?.cityCode || firstSeg?.aa?.city || firstSeg?.aa?.name || '';
                    const firstSegKey = `${firstSegDep}-${firstSegArr}`;
                    const pnr = bookingTravellers[0]?.PnrDetails?.[routeKey] ?? bookingTravellers[0]?.PnrDetails?.[firstSegKey] ?? payload?.AirlinePnrs ?? "—";
                    const isChecked = !!rescheduleSelectedSegments[tIdx];

                    const currentSelected = rescheduleSelectedTravellers[tIdx] || [];
                    const isAllSelected = currentSelected.length === bookingTravellers.length;
                    const currentDateVal = rescheduleDates[tIdx] || "";

                    const handleToggleTraveller = (passengerId) => {
                      setRescheduleSelectedTravellers(prev => {
                        const current = prev[tIdx] || [];
                        const updated = current.includes(passengerId)
                          ? current.filter(id => id !== passengerId)
                          : [...current, passengerId];
                        return { ...prev, [tIdx]: updated };
                      });
                    };

                    const handleToggleAllTravellers = () => {
                      setRescheduleSelectedTravellers(prev => ({
                        ...prev,
                        [tIdx]: isAllSelected ? [] : bookingTravellers.map(t => t.PassengerId)
                      }));
                    };

                    return (
                      <div key={tIdx} className={`grid grid-cols-12 gap-2 px-4 py-4 items-center text-slate-700 ${isLastRow ? 'rounded-b-2xl' : ''}`}>
                        {/* Trip Checkbox */}
                        <div className="col-span-1 flex justify-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={rescheduleMutation.isPending}
                            onChange={(e) => {
                              setRescheduleSelectedSegments(prev => ({
                                ...prev,
                                [tIdx]: e.target.checked
                              }));
                            }}
                            className="w-4.5 h-4.5 text-[#78080B] rounded border-slate-300 focus:ring-[#78080B]/20 cursor-pointer"
                          />
                        </div>

                        {/* Trip Info */}
                        <div className="col-span-3 font-bold text-slate-800">
                          <div className="flex flex-col">
                            <span>{originCode} → {destCode}</span>
                            {pnr && <span className="text-[10px] text-slate-400 font-semibold uppercase">PNR: {pnr}</span>}
                          </div>
                        </div>

                        {/* Original Departure Date */}
                        <div className="col-span-2 text-xs font-semibold text-slate-500">
                          {getYYYYMMDD(firstSeg?.dt)}
                        </div>

                        {/* New Reschedule Date Picker */}
                        <div className="col-span-3">
                          {(() => {
                            const bookingCreatedOn = order?.BookingCreatedOn || detail?.BookingCreatedOn || detail?.BookingDate || detail?.CreatedOn || payload?.BookingDate || detail?.TransactionDate;
                            const maxAllowedDate = getBookingMaxRescheduleDate(bookingCreatedOn, firstSeg?.dt);

                            return (
                              <input
                                type="date"
                                min={getTodayDateString()}
                                max={maxAllowedDate}
                                disabled={!isChecked || rescheduleMutation.isPending}
                                value={currentDateVal}
                                onKeyDown={(e) => e.preventDefault()}
                                onChange={(e) => {
                                  const chosen = e.target.value;
                                  if (chosen && maxAllowedDate && chosen > maxAllowedDate) {
                                    setRescheduleError(`Date cannot be after ${maxAllowedDate} (90 days from booking date)`);
                                    return;
                                  }
                                  setRescheduleError("");
                                  setRescheduleDates(prev => ({
                                    ...prev,
                                    [tIdx]: chosen
                                  }));
                                }}
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#78080B]/20 focus:border-[#78080B] disabled:opacity-50 disabled:bg-slate-50 cursor-pointer"
                              />
                            );
                          })()}
                        </div>

                        {/* Passengers Selection Dropdown */}
                        <div className="col-span-3">
                          {(() => {
                            const activeSelected = currentSelected;

                            const getButtonText = () => {
                              if (activeSelected.length === 0) return "Select travellers";
                              return bookingTravellers
                                .filter(t => activeSelected.includes(t.PassengerId))
                                .map(t => `${t.FirstName} ${t.LastName}`)
                                .join(', ');
                            };

                            return (
                              <div className="relative">
                                <button
                                  type="button"
                                  disabled={!isChecked || rescheduleMutation.isPending}
                                  onClick={() => setRescheduleOpenDropdownIdx(rescheduleOpenDropdownIdx === tIdx ? null : tIdx)}
                                  className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white hover:bg-slate-50 transition cursor-pointer disabled:opacity-50 disabled:bg-slate-50 font-bold text-slate-700 truncate"
                                  title={getButtonText()}
                                >
                                  <span className="truncate mr-1">{getButtonText()}</span>
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                </button>

                                {rescheduleOpenDropdownIdx === tIdx && isChecked && (
                                  <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 max-h-48 overflow-y-auto">
                                    <label className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs font-bold border-b border-slate-100 text-slate-800">
                                      <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={handleToggleAllTravellers}
                                        className="text-[#78080B] rounded border-slate-300 focus:ring-[#78080B]/20"
                                      />
                                      Select all
                                    </label>
                                    {bookingTravellers.map(t => (
                                      <label key={t.PassengerId} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-700">
                                        <input
                                          type="checkbox"
                                          checked={currentSelected.includes(t.PassengerId)}
                                          onChange={() => handleToggleTraveller(t.PassengerId)}
                                          className="text-[#78080B] rounded border-slate-300 focus:ring-[#78080B]/20"
                                        />
                                        {t.FirstName} {t.LastName}
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Remarks Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Reschedule Remarks <span className="text-rose-500">*</span>
                  </label>
                  {!rescheduleRemarks.trim() && rescheduleError && rescheduleError.toLowerCase().includes('remark') && (
                    <span className="text-xs text-rose-500 font-medium">Remarks are required</span>
                  )}
                </div>
                <textarea
                  rows={2}
                  disabled={rescheduleMutation.isPending}
                  value={rescheduleRemarks}
                  onChange={(e) => {
                    setRescheduleRemarks(e.target.value);
                    if (rescheduleError && rescheduleError.toLowerCase().includes('remark')) {
                      setRescheduleError("");
                    }
                  }}
                  placeholder="Enter remarks for rescheduling..."
                  className={`w-full px-4 py-3 rounded-2xl border text-sm focus:outline-none focus:ring-2 placeholder-slate-400 resize-none transition-colors ${!rescheduleRemarks.trim() && rescheduleError && rescheduleError.toLowerCase().includes('remark')
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-[#78080B]/20 focus:border-[#78080B] bg-slate-50/50'
                    }`}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100 rounded-b-3xl">
              <button
                type="button"
                disabled={rescheduleMutation.isPending}
                onClick={() => setIsRescheduleModalOpen(false)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-50"
              >
                Close
              </button>
              <button
                type="button"
                disabled={rescheduleMutation.isPending}
                onClick={handleRescheduleSubmit}
                className="px-5 py-2.5 bg-[#78080B] hover:bg-[#5a0608] text-white rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-md shadow-[#78080B]/10 hover:shadow"
              >
                {rescheduleMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Rescheduling...
                  </>
                ) : (
                  'Reschedule Ticket'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default BookingDetails;
