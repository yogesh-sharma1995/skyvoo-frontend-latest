import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Plus, LogOut, ChevronRight, PlaneTakeoff, PlaneLanding, ArrowRight, CircleAlert, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SeatGrid from './components/SeatGrid.jsx';
import SummaryPanel from './components/SummaryPanel.jsx';
import { SSRTypes, seatLetters } from '../../Data/ExtraData.js';
import SeatTooltip from './components/SeatTooltip.jsx';
import Modal from '@/components/modals/Modal.jsx';
import { bookingStore } from '@/store/bookingStore.js';
import api from '@/services/api.js';
import { getAirlineLogo } from "@/utils/airlineCode";


const legendItems = [
    { label: "Available", color: "border-2 border-[#16a249] bg-white" },
    {
        label: "Selected",
        color: "border-2 border-[#78080B] relative bg-white",
        icon: (
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#78080B] text-white rounded-full flex items-center justify-center shadow-xs">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
        )
    },
    { label: "Booked", color: "border-2 border-[#B11515] text-gray-500 bg-white" },
    { label: "Blocked", color: "border-2 border-[#B11515] text-gray-500 bg-white" },
];

/** Parse SeatInfo array into { processedRows, seatMap } */
const parseSeatInfo = (rawSeatInfo) => {
    if (!Array.isArray(rawSeatInfo) || rawSeatInfo.length === 0) {
        return { processedRows: [], seatMap: {} };
    }

    const rowMap = {};
    rawSeatInfo.forEach((s) => {
        if (s.IsNoSeat) return;

        const match = s.SeatNo?.match(/^(\d+)([A-Z]+)$/i);
        const rowNum = match
            ? parseInt(match[1], 10)
            : (s.SeatPosition?.Row || parseInt(s.RowNumber, 10) || 1);
        const letter = match
            ? match[2].toUpperCase()
            : (typeof s.SeatPosition?.Column === 'string'
                ? s.SeatPosition.Column.toUpperCase()
                : (s.SeatCode?.replace(/\d/g, '') || 'A'));

        if (!rowMap[rowNum]) {
            rowMap[rowNum] = { rowNumber: rowNum, seats: [] };
        }

        const isBooked = Boolean(s.IsBooked);
        const isBlocked = Boolean(s.IsBlocked);
        const isAvailable = s.IsAvailable !== undefined
            ? Boolean(s.IsAvailable)
            : (!isBooked && !isBlocked);
        const isExtraLegroom = Boolean(s.IsLegroom || s.IsExtraLegroom);
        const isExitRow = Boolean(s.IsExit || s.IsEmergencyExit || s.IsExitRow);
        const price = Number(s.Amount || s.Price || s.Total_Amount || s.SeatAmount || 0);
        const currency = s.Currency || s.CurrencyCode || 'INR';

        rowMap[rowNum].seats.push({
            number: s.SeatNo || s.SeatCode,
            letter,
            price,
            currency,
            isAvailable,
            isBooked,
            isBlocked,
            isIsle: Boolean(s.IsAisle),
            isWindow: Boolean(s.IsWindow),
            rowNumber: rowNum,
            classType: s.SeatClass || s.CabinClass || (rowNum < 3 ? 'Business' : rowNum < 10 ? 'Premium Economy' : 'Economy'),
            isExtraLegroom,
            isExitRow,
            raw: s,
        });
    });

    const rows = Object.values(rowMap).sort((a, b) => a.rowNumber - b.rowNumber);
    const seatLookup = Object.fromEntries(
        rows.flatMap((row) => row.seats.map((seat) => [seat.number, seat]))
    );
    return { processedRows: rows, seatMap: seatLookup };
};

const FlightSeatMap = ({ onClose, flightLegs, onSeatsContinue, initialSelectedSeats, initialSelectedSeatDetails, initialFlightIndex = 0, paxCounts, passengers }) => {

    const navigate = useNavigate();
    const bookingData = bookingStore.get();

    // Lock background scrolling while seat selection modal is open
    useEffect(() => {
        const originalBodyOverflow = document.body.style.overflow;
        const originalHtmlOverflow = document.documentElement.style.overflow;
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalBodyOverflow;
            document.documentElement.style.overflow = originalHtmlOverflow;
        };
    }, []);

    // ── Per-segment seat map queries using each segment's FlightId + FlightKey ──
    // flightSegments = FlightDetailResponses from fareReview (each has its own FlightId)
    const flightSegments = bookingData.flightSegments ?? [];
    const flightKeyList = bookingData.flightKeyList ?? [];
    const globalFlightId = bookingData.flightId;

    // Index of the currently shown flight segment tab
    const [activeFlightIndex, setActiveFlightIndex] = useState(() => (typeof initialFlightIndex === "number" && initialFlightIndex >= 0 ? initialFlightIndex : 0));

    useEffect(() => {
        if (typeof initialFlightIndex === "number" && initialFlightIndex >= 0) {
            setActiveFlightIndex(initialFlightIndex);
        }
    }, [initialFlightIndex]);

    // Build segment list: prefer stored segments, fallback to single global FlightId
    const segments = flightSegments.length > 0
        ? flightSegments
        : globalFlightId
            ? [{ FlightId: globalFlightId }]
            : [];

    const seatMapQueries = useQueries({
        queries: segments.map((seg, idx) => {
            const segFlightId = seg.FlightId || seg.flightId || globalFlightId || '';
            const allFlightKeys = (Array.isArray(flightKeyList) && flightKeyList.length > 0)
                ? flightKeyList
                : (seg.FlightKey ? [seg.FlightKey] : (flightKeyList ? [flightKeyList] : []));
            return {
                queryKey: ["seatMap", segFlightId, allFlightKeys, idx],
                queryFn: async () => {
                    const payload = {
                        FlightId: segFlightId,
                        FlightKeys: allFlightKeys,
                    };
                    try {
                        const res = await api.post("/flight/GetSeatMap", payload);
                        if (!res.data?.IsSuccess) {
                            throw new Error(res.data?.ErrorMessage || "Failed to fetch seat map.");
                        }
                        const rawData = res.data?.Data;
                        if (!rawData || (typeof rawData === "string" && !rawData.trim())) {
                            return null;
                        }
                        if (typeof rawData === "object") return rawData;
                        try {
                            return JSON.parse(rawData);
                        } catch {
                            return null;
                        }
                    } catch (err) {
                        const apiMsg =
                            err?.response?.data?.ErrorMessage ||
                            err?.response?.data?.message ||
                            err?.message ||
                            "Failed to fetch seat map.";
                        throw new Error(apiMsg);
                    }
                },
                enabled: Boolean(segFlightId),
                retry: 1,
                staleTime: 5 * 60 * 1000,
            };
        }),
    });

    // normalizedFlightKeys length — used for segment count checks
    const normalizedFlightKeys = segments;

    // Active segment's query result
    const activeQuery = seatMapQueries[activeFlightIndex] ?? seatMapQueries[0] ?? {};
    const apiSeatMapData = activeQuery.data ?? null;
    const loadingSeatMap = activeQuery.isLoading ?? false;
    const seatMapError = activeQuery.error ?? null;


    const [tooltipData, setTooltipData] = useState(null);
    const [selectedServices, setSelectedServices] = useState([]);

    const [openSummaryModal, setOpenSummaryModal] = useState(false);
    const [openServiceModal, setOpenServiceModal] = useState(false);

    const isConnecting = normalizedFlightKeys.length > 1;

    const paxList = useMemo(() => {
        const filledPax = passengers || bookingData?.passengers || {};
        const adultList = filledPax.Adults || [];
        const childList = filledPax.Childs || [];

        const counts = paxCounts || bookingData?.paxCounts || {};
        const rawAdults = counts.Adults ?? counts.adults ?? bookingData?.travellers?.adults;
        const rawChilds = counts.Childs ?? counts.children ?? bookingData?.travellers?.children;

        const numAdults = Math.max(
            (rawAdults !== undefined && rawAdults !== null && !isNaN(Number(rawAdults))) ? Number(rawAdults) : 0,
            adultList.length,
            1
        );
        const numChilds = Math.max(
            (rawChilds !== undefined && rawChilds !== null && !isNaN(Number(rawChilds))) ? Number(rawChilds) : 0,
            childList.length,
            0
        );

        const list = [];
        for (let i = 0; i < numAdults; i++) {
            const adult = adultList[i] || {};
            const name = [adult.firstName, adult.lastName].filter(Boolean).join(" ");
            list.push({
                id: `adult-${i}`,
                label: `ADULT-${i + 1}`,
                name: name || `Adult ${i + 1}`,
                type: "Adult",
                paxIndex: i,
            });
        }
        for (let i = 0; i < numChilds; i++) {
            const child = childList[i] || {};
            const name = [child.firstName, child.lastName].filter(Boolean).join(" ");
            list.push({
                id: `child-${i}`,
                label: `CHILD-${i + 1}`,
                name: name || `Child ${i + 1}`,
                type: "Child",
                paxIndex: numAdults + i,
            });
        }
        return list;
    }, [paxCounts, passengers, bookingData]);

    const totalTravellers = paxList.length || 1;

    const getInitialPaxSeats = () => {
        const arr = new Array(paxList.length).fill(null);
        const storedDetails = Array.isArray(initialSelectedSeatDetails)
            ? initialSelectedSeatDetails
            : Array.isArray(bookingData?.selectedSeatDetails)
                ? bookingData.selectedSeatDetails.filter(s => (s.segmentIndex !== undefined ? Number(s.segmentIndex) : 0) === activeFlightIndex)
                : null;

        if (storedDetails && storedDetails.length > 0) {
            storedDetails.forEach((seat, idx) => {
                const seatNo = seat.number || seat.SeatNo || seat.SSR_TypeName || seat.code;
                const pIdx = seat.paxIndex !== undefined ? Number(seat.paxIndex) : idx;
                if (seatNo && pIdx < arr.length) {
                    arr[pIdx] = seatNo.trim().toUpperCase();
                }
            });
        } else if (Array.isArray(initialSelectedSeats) && initialSelectedSeats.length > 0) {
            initialSelectedSeats.forEach((seatNo, idx) => {
                if (typeof seatNo === "string" && seatNo && idx < arr.length) {
                    arr[idx] = seatNo.trim().toUpperCase();
                }
            });
        }
        return arr;
    };

    const [paxSeatMap, setPaxSeatMap] = useState(getInitialPaxSeats);

    const [activePaxIndex, setActivePaxIndex] = useState(() => {
        const initial = getInitialPaxSeats();
        const unassigned = initial.findIndex(s => !s);
        return unassigned !== -1 ? unassigned : 0;
    });

    useEffect(() => {
        setPaxSeatMap(prev => {
            if (prev.length === paxList.length) return prev;
            const next = new Array(paxList.length).fill(null);
            prev.forEach((s, idx) => {
                if (idx < next.length) next[idx] = s;
            });
            return next;
        });
    }, [paxList.length]);

    // Current segment's selected seats set
    const selectedSeats = useMemo(() => new Set(paxSeatMap.filter(Boolean)), [paxSeatMap]);

    const handleSeatClick = (seatOrNumber) => {
        const seatNumber = typeof seatOrNumber === "string"
            ? seatOrNumber
            : (seatOrNumber?.number || seatOrNumber?.SeatNo || seatOrNumber?.code || "");
        if (!seatNumber) return;

        const normalizedNumber = seatNumber.trim().toUpperCase();

        setPaxSeatMap(prev => {
            const next = [...prev];
            const existingIdx = next.findIndex(s => s && s.trim().toUpperCase() === normalizedNumber);

            if (existingIdx !== -1) {
                // If already assigned to a passenger, unassign it and focus on that passenger
                next[existingIdx] = null;
                setActivePaxIndex(existingIdx);
            } else {
                // Assign to active passenger
                next[activePaxIndex] = normalizedNumber;

                // Auto-advance activePaxIndex to next passenger without seat
                const nextUnassigned = next.findIndex((s, i) => i > activePaxIndex && !s);
                if (nextUnassigned !== -1) {
                    setActivePaxIndex(nextUnassigned);
                } else {
                    const firstUnassigned = next.findIndex(s => !s);
                    if (firstUnassigned !== -1) {
                        setActivePaxIndex(firstUnassigned);
                    }
                }
            }
            return next;
        });
    };

    const handleRemoveSeatForPax = (seatNumber, pIdx) => {
        setPaxSeatMap(prev => {
            const next = [...prev];
            if (pIdx !== undefined && pIdx >= 0 && pIdx < next.length) {
                next[pIdx] = null;
                setActivePaxIndex(pIdx);
            } else {
                const idx = next.findIndex(s => s && s.trim().toUpperCase() === String(seatNumber).trim().toUpperCase());
                if (idx !== -1) {
                    next[idx] = null;
                    setActivePaxIndex(idx);
                }
            }
            return next;
        });
    };

    // Total seats selected
    const totalSelectedCount = selectedSeats.size;

    // ── Parse seat map data for ALL segments ───────────────────────────────────
    const allSegmentSeatMaps = useMemo(() => {
        return seatMapQueries.map((q) => {
            const rawData = q.data;
            if (!rawData) return { processedRows: [], seatMap: {} };

            // 1. TripSeatMap format
            const tripSeatsObj = rawData?.TripSeatMap?.TripSeat;
            if (tripSeatsObj && Object.keys(tripSeatsObj).length > 0) {
                const tripSeatKeys = Object.keys(tripSeatsObj);
                const seatObj = tripSeatsObj[tripSeatKeys[0]];
                const rawSeatInfo =
                    seatObj?.SeatInfo ||
                    seatObj?.SeatData?.SeatInfo ||
                    seatObj?.Seat_Row;
                if (Array.isArray(rawSeatInfo) && rawSeatInfo.length > 0) {
                    return parseSeatInfo(rawSeatInfo);
                }
            }

            // 2. AirSeatMaps / Seat_Row format
            const altRows =
                rawData?.AirSeatMaps?.[0]?.Seat_Segments?.[0]?.Seat_Row ||
                rawData?.Seat_Segments?.[0]?.Seat_Row ||
                rawData?.Seat_Row ||
                rawData?.TripInfo?.[0]?.Seat_Row ||
                [];
            if (Array.isArray(altRows) && altRows.length > 0) {
                const rows = altRows.map((row, rIdx) => {
                    const rowNum = row.RowNo ? parseInt(row.RowNo, 10) : rIdx + 1;
                    const seats = (row.Seat_Details || []).map((seat) => {
                        const isAvailable = seat.SSR_Status === 1;
                        const isBlocked = seat.SSR_Status === 2;
                        const isBooked = seat.SSR_Status === 3;
                        const isIsle = seat.SSR_Status === 0;
                        const isExtraLegroom = seat.SSR_TypeDesc?.includes('XL') || false;
                        const isExitRow = seat.SSR_TypeDesc?.includes('EXIT') || false;
                        const seatLetter = seat.SSR_TypeName?.match(/[A-Z]+/i)?.[0] || seat.SSR_TypeName;
                        return {
                            number: seat.SSR_TypeName,
                            letter: seatLetter,
                            price: Number(seat.Total_Amount || seat.Amount || 0),
                            currency: seat.Currency_Code || 'INR',
                            isAvailable,
                            isBooked,
                            isBlocked,
                            isIsle,
                            rowNumber: rowNum,
                            classType: seat.SSR_TypeDesc || (rIdx < 3 ? 'Business' : rIdx < 10 ? 'Premium Economy' : 'Economy'),
                            isExtraLegroom,
                            isExitRow,
                            SSRType: seat.SSR_Type,
                        };
                    });
                    return { rowNumber: rowNum, seats };
                });
                const seatLookup = Object.fromEntries(
                    rows.flatMap((row) => row.seats.map((seat) => [seat.number, seat]))
                );
                return { processedRows: rows, seatMap: seatLookup };
            }

            return { processedRows: [], seatMap: {} };
        });
    }, [seatMapQueries]);

    // Active segment processed rows and lookup
    const { processedRows, seatMap } = allSegmentSeatMaps[activeFlightIndex] || { processedRows: [], seatMap: {} };

    // Helper: collect all selected seat details across all passengers
    const collectAllSeatDetails = () => {
        const allDetails = [];
        paxList.forEach((pax, pIdx) => {
            const seatNum = paxSeatMap[pIdx];
            if (seatNum) {
                const detail = seatMap[seatNum] || { number: seatNum };
                allDetails.push({
                    ...detail,
                    number: seatNum,
                    paxIndex: pIdx,
                    paxLabel: pax.label,
                    paxName: pax.name,
                    paxType: pax.type,
                    segmentIndex: activeFlightIndex,
                });
            }
        });
        return allDetails;
    };

    const totalAmount = useMemo(() => {
        return paxSeatMap.reduce((sum, seatNum) => {
            if (!seatNum) return sum;
            const price = seatMap[seatNum]?.price || 0;
            return sum + price;
        }, 0);
    }, [paxSeatMap, seatMap]);

    // Grand total
    const grandTotalAmount = useMemo(() => {
        const serviceTotal = selectedServices.reduce((sum, s) => {
            const priceStr = s.price?.toString().trim() || "0";
            const isFree = priceStr.toLowerCase() === "free" || priceStr === "" || priceStr === "0";
            if (isFree) return sum;
            return sum + (parseFloat(priceStr.replace(/[₹,]/g, "")) || 0);
        }, 0);
        return totalAmount + serviceTotal;
    }, [totalAmount, selectedServices]);

    const handleProceedWithoutSeat = () => {
        if (onSeatsContinue) {
            onSeatsContinue({ selectedSeats: new Set(), selectedServices: [], totalAmount: 0, selectedSeatDetails: [] });
        } else if (onClose) {
            onClose();
        } else {
            navigate(-1);
        }
    };

    const getSeatVisual = useCallback((seat) => {
        const seatNo = (seat?.number || seat?.SeatNo || "").trim().toUpperCase();
        let isSelected = false;
        for (const s of selectedSeats) {
            if (s && s.trim().toUpperCase() === seatNo) {
                isSelected = true;
                break;
            }
        }

        if (isSelected) {
            return {
                fill: "#78080B",
                stroke: "#78080B",
                text: "text-[#78080B]",
                isSelected: true
            };
        }

        if (seat.isBooked) {
            return {
                fill: "#B11515",
                stroke: "#B11515",
                text: "text-gray-500"
            };
        }

        if (seat.isBlocked) {
            return {
                fill: "#B11515",
                stroke: "#B11515",
                text: "text-gray-500"
            };
        }

        if (seat.isAvailable) {
            return {
                fill: "#16a249",
                stroke: "#16a249",
                text: "text-gray-900"
            };
        }

        return {
            fill: "transparent",
            stroke: "transparent",
            text: "text-gray-400"
        };
    }, [selectedSeats]);

    const handleSeatMouseEnter = (seat, e) => {
        const rect = e.currentTarget.getBoundingClientRect();

        setTooltipData({
            seat,
            pos: {
                top: rect.top,
                left: rect.left + rect.width / 2,
            },
        });
    };

    const handleSeatMouseLeave = () => setTooltipData(null);

    const handleRemoveService = (code) => {
        setSelectedServices((prev) => prev.filter((s) => s.code !== code));
    };

    // ── Connecting-flight tab label helper ────────────────────────────────────
    const getFlightTabLabel = (idx) => {
        const seg = flightLegs?.[idx] || segments?.[idx];
        if (seg) {
            const dep = seg.AirlineDeparture?.code || seg.AirlineDeparture?.cityCode || seg.Origin || '';
            const arr = seg.AirlineArrival?.code || seg.AirlineArrival?.cityCode || seg.Destination || '';
            if (dep && arr) return `${dep} → ${arr}`;
            if (dep) return dep;
        }
        return `Flight ${idx + 1}`;
    };

    const flightSummary = useMemo(() => {
        // If real flight leg data was passed in, use it directly
        if (Array.isArray(flightLegs) && flightLegs.length > 0) {
            const leg = flightLegs[activeFlightIndex] || flightLegs[0];
            return {
                airlineName: leg.AirlineName || '',
                airlineCode: leg.AirlineCode || '',
                airlineLogoCode: leg.AirlineLogo || leg.AirlineCode || '',
                flightNo: leg.FlightNo || '',
                craft: leg.Equipment || leg.Craft || '',
                depCode: leg.AirlineDeparture?.code || leg.AirlineDeparture?.cityCode || '',
                depCity: leg.AirlineDeparture?.city || '',
                depTime: leg.DepartureTime || '',
                depDate: leg.DepartureDate || '',
                arrCode: leg.AirlineArrival?.code || leg.AirlineArrival?.cityCode || '',
                arrCity: leg.AirlineArrival?.city || '',
                arrTime: leg.ArrivalTime || '',
                arrDate: leg.ArrivalDate || '',
                duration: leg.AirlineDuration || '',
                stops: leg.Stops ?? null,
            };
        }

        const storeSummary = bookingData?.flightSummary || location.state?.flightSummary;
        if (storeSummary) return storeSummary;

        const flight = bookingData?.flight || bookingData?.outboundFlight;
        if (flight) {
            const logoArray = Array.isArray(flight.AirlineLogo) ? flight.AirlineLogo : [flight.AirlineLogo].filter(Boolean);
            const dep = flight.AirlineDeparture || {};
            const arr = flight.AirlineArrival || {};
            return {
                airlineName: flight.AirlineName || '',
                airlineCode: flight.AirlineCodeAndId || flight.AirlineCode || '',
                airlineLogoCode: logoArray[0] || flight.AirlineCode || '',
                flightNo: flight.FlightNumber || flight.FlightNo || '',
                craft: flight.Equipment || flight.Craft || flight.AirlineCraft || '',
                depCode: dep.code || flight.DepartureAirportCode || flight.Origin || '',
                depCity: dep.city || '',
                depTime: flight.DepartureTime || dep.time || '',
                arrCode: arr.code || flight.ArrivalAirportCode || flight.Destination || '',
                arrCity: arr.city || '',
                arrTime: flight.ArrivalTime || arr.time || '',
                duration: flight.AirlineDuration || flight.Duration || '',
            };
        }

        return {};
    }, [bookingData, location.state, flightLegs, activeFlightIndex]);

    return (
        <>
            <Modal
                open={openSummaryModal}
                onClose={() => setOpenSummaryModal(false)}
                title="Your Selection"
            >
                <SummaryPanel
                    paxList={paxList}
                    paxSeatMap={paxSeatMap}
                    activePaxIndex={activePaxIndex}
                    onSelectPax={(idx) => setActivePaxIndex(idx)}
                    seatMap={seatMap}
                    SSRTypes={SSRTypes}
                    selectedServices={selectedServices}
                    onRemoveSeat={handleRemoveSeatForPax}
                    onRemoveService={handleRemoveService}
                    totalAmount={grandTotalAmount}
                    hasSeatsAvailable={processedRows.length > 0}
                    onContinue={() => {
                        setOpenSummaryModal(false);
                        if (onSeatsContinue) {
                            const selectedSeatDetails = collectAllSeatDetails();
                            const allSeats = new Set(selectedSeatDetails.map(d => d.number));
                            onSeatsContinue({ selectedSeats: allSeats, selectedServices, totalAmount: grandTotalAmount, selectedSeatDetails });
                        } else {
                            navigate("/payment", { state: { selectedSeats, selectedServices } });
                        }
                    }}
                    onProceedWithoutSeat={handleProceedWithoutSeat}
                />
            </Modal>




            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[10000] p-2 sm:p-4"
                onClick={() => {
                    if (!openSummaryModal && !openServiceModal) {
                        if (onClose) onClose();
                        else navigate(-1);
                    }
                }}
                style={{ animation: "fadeIn 0.25s ease-out forwards" }}>
                <div
                    className="relative w-full max-w-5xl h-[92vh] max-h-[94vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Fixed Top-Right Corner Close Button */}
                    <button
                        type="button"
                        onClick={() => {
                            if (onClose) onClose();
                            else navigate(-1);
                        }}
                        aria-label="Close Seat Map"
                        className="absolute -top-2.5 -right-2 sm:-top-3 sm:-right-2.5 z-30 p-1.5 sm:p-2 rounded-full text-slate-700 hover:text-white bg-white hover:bg-[#811919] shadow-md hover:shadow-lg border border-slate-200 hover:border-[#811919] transition-all duration-200 cursor-pointer flex items-center justify-center group"
                    >
                        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 group-hover:rotate-90" />
                    </button>

                    <div
                        className="bg-white w-full h-full overflow-y-auto rounded-xl sm:rounded-2xl shadow-2xl relative custom-scrollbar border border-gray-100 p-3 sm:p-4 flex flex-col"
                    >

                        <div className="flex-1 flex flex-col pb-14 lg:pb-0">

                            {/* Mobile Bottom Price Bar */}
                            <div className="block lg:hidden fixed bottom-0 left-0 right-0 z-[10001] bg-[#78080B] text-white px-3 py-2.5 shadow-[0_-4px_8px_rgba(0,0,0,0.25)]">
                                <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">

                                    {/* Price Section */}
                                    <div className="flex items-center gap-2">
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-base font-bold">₹ {grandTotalAmount}</span>

                                                {/* Info Icon → Open Summary */}
                                                <button type="button"
                                                    aria-label="Price information"
                                                    className="flex items-center"
                                                    onClick={() => setOpenSummaryModal(true)}
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        className="w-3.5 h-3.5 text-white opacity-80 hover:opacity-100 transition"
                                                    >
                                                        <circle cx="12" cy="12" r="10" />
                                                        <line x1="12" y1="16" x2="12" y2="12" />
                                                        <line x1="12" y1="8" x2="12.01" y2="8" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <span className="text-[10px] opacity-90">
                                                {isConnecting
                                                    ? `${totalSelectedCount} SEAT${totalSelectedCount !== 1 ? 'S' : ''} SELECTED`
                                                    : `FOR ${totalTravellers} TRAVELLER${totalTravellers > 1 ? "S" : ""}`}
                                            </span>

                                        </div>


                                    </div>

                                    {/* CTA */}
                                    <button
                                        type="button"
                                        className="bg-[#D9D9D9] text-[#78080B] font-semibold px-3 py-1.5 text-xs rounded-full flex items-center gap-1"
                                        onClick={() => {
                                            if (onSeatsContinue) {
                                                const selectedSeatDetails = collectAllSeatDetails();
                                                const allSeats = new Set(selectedSeatDetails.map(d => d.number));
                                                onSeatsContinue({ selectedSeats: allSeats, selectedServices, totalAmount: grandTotalAmount, selectedSeatDetails });
                                            } else {
                                                setOpenSummaryModal(true);
                                            }
                                        }}
                                    >
                                        CONTINUE
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>

                                </div>
                            </div>

                            {/* Header */}
                            <div className='bg-[#f1f0f29e] shadow-2xs rounded-xl border border-[#920000] relative'>

                                <div className="py-2 px-3 flex flex-col gap-1.5 xs:flex-row xs:justify-between sm:items-center max-w-5xl mx-auto">

                                    {/* Flight Info */}
                                    <div className="flex items-center justify-center gap-2">
                                        {flightSummary.airlineLogoCode && (
                                            <img
                                                src={getAirlineLogo(flightSummary.airlineLogoCode)}
                                                alt={flightSummary.airlineName}
                                                className="rounded-full w-7 h-7"
                                            />
                                        )}
                                        <div>
                                            <h2 className="text-xs sm:text-sm font-bold text-gray-800 leading-tight">
                                                {flightSummary.airlineName || flightSummary.airlineCode}
                                            </h2>
                                            <p className="text-[10px] text-gray-500">
                                                {[flightSummary.airlineCode, flightSummary.flightNo].filter(Boolean).join(' ')}
                                                {flightSummary.craft ? ` · ${flightSummary.craft}` : ''}
                                            </p>
                                        </div>
                                    </div>


                                    <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-4">
                                        {/* From */}
                                        <div className="flex flex-col items-center">
                                            <p className="text-[9px] text-gray-400 font-medium">From</p>
                                            <p className="text-xs sm:text-sm font-bold text-gray-800 leading-tight">{flightSummary.depCode}</p>
                                            {flightSummary.depCity && <p className="text-[9px] text-gray-400">{flightSummary.depCity}</p>}
                                            <p className="text-[9px] text-gray-400">{flightSummary.depTime}</p>
                                        </div>

                                        {/* Divider */}
                                        <div className="border-t border-gray-300 w-6 mx-1"></div>

                                        {/* Duration */}
                                        <div className="text-center text-gray-600">
                                            <p className="text-[10px] font-medium">{flightSummary.duration}</p>
                                            {flightSummary.stops === 0 && <p className="text-[9px] text-green-600 font-semibold">Non-stop</p>}
                                        </div>

                                        {/* Divider */}
                                        <div className="border-t border-gray-300 w-6 mx-1"></div>

                                        {/* To */}
                                        <div className="flex flex-col items-center">
                                            <p className="text-[9px] text-gray-400 font-medium">To</p>
                                            <p className="text-xs sm:text-sm font-bold text-gray-800 leading-tight">{flightSummary.arrCode}</p>
                                            {flightSummary.arrCity && <p className="text-[9px] text-gray-400">{flightSummary.arrCity}</p>}
                                            <p className="text-[9px] text-gray-400">{flightSummary.arrTime}</p>
                                        </div>
                                    </div>

                                </div>

                                {/* ── Flight segment switcher tabs ─────────────────────────── */}
                                {isConnecting && (
                                    <div className="border-t border-[#92000040] px-3 pb-2 pt-1 max-w-5xl mx-auto">
                                        <p className="text-[10px] text-[#920000] font-semibold mb-1 flex items-center gap-1">
                                            <PlaneTakeoff className="w-2.5 h-2.5" />
                                            Multiple Flights — select seats for each segment
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {segments.map((seg, idx) => {
                                                const isActive = activeFlightIndex === idx;
                                                const segQuery = seatMapQueries[idx];
                                                const isSegLoading = segQuery?.isLoading;
                                                const segDone = segQuery?.isSuccess;
                                                const segSeats = segmentSeats.get(idx);
                                                const segSeatsCount = segSeats?.size ?? 0;
                                                const depCode = seg?.AirlineDeparture?.code || seg?.AirlineDeparture?.cityCode || `Leg ${idx + 1}`;
                                                const arrCode = seg?.AirlineArrival?.code || seg?.AirlineArrival?.cityCode || '';
                                                const airline = seg?.AirlineName || seg?.AirlineCode || '';
                                                const flightNo = seg?.FlightNo || seg?.FlightNumber || '';
                                                const depTime = seg?.DepartureTime || '';
                                                const arrTime = seg?.ArrivalTime || '';
                                                return (
                                                    <button
                                                        key={seg.FlightId || idx}
                                                        type="button"
                                                        id={`flight-leg-tab-${idx}`}
                                                        onClick={() => setActiveFlightIndex(idx)}
                                                        className={`relative flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all duration-200
                                                        ${isActive
                                                                ? 'bg-[#920000] text-white border-[#920000] shadow-2xs'
                                                                : 'bg-white text-gray-700 border-gray-300 hover:border-[#920000] hover:text-[#920000]'
                                                            }
                                                    `}
                                                    >
                                                        <span className={`flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-bold
                                                        ${isActive ? 'bg-white text-[#920000]' : 'bg-gray-100 text-gray-600'}`}
                                                        >
                                                            {isSegLoading ? (
                                                                <span className="animate-spin inline-block w-2 h-2 border border-current border-t-transparent rounded-full" />
                                                            ) : segSeatsCount > 0 ? (
                                                                <span className="text-green-600">✓</span>
                                                            ) : idx + 1}
                                                        </span>
                                                        <span className="flex flex-col items-start leading-tight">
                                                            <span className="flex items-center gap-0.5 font-semibold">
                                                                {depCode}
                                                                {arrCode && <><ArrowRight className="w-2 h-2 opacity-60" />{arrCode}</>}
                                                            </span>
                                                            {(airline || flightNo || depTime) && (
                                                                <span className={`text-[8px] ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                                                                    {[airline, flightNo].filter(Boolean).join(' ')}
                                                                    {depTime && arrTime ? ` · ${depTime}–${arrTime}` : depTime ? ` · ${depTime}` : ''}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="max-w-5xl mx-auto my-1.5 w-full flex-1 flex flex-col">
                                {/* Heading */}
                                <div className="text-start my-1 pb-1">
                                    <h1 className="text-xs sm:text-sm font-bold text-gray-800 leading-tight">
                                        {isConnecting
                                            ? `Select Seat — ${getFlightTabLabel(activeFlightIndex)}`
                                            : 'Select Your Seat'}
                                    </h1>
                                    <p className="text-[10px] text-gray-500 mt-0.5">
                                        {isConnecting
                                            ? `Leg ${activeFlightIndex + 1} of ${normalizedFlightKeys.length} — ${selectedSeats.size}/${totalTravellers} seats selected`
                                            : `Select ${totalTravellers} seat${totalTravellers > 1 ? 's' : ''} (${selectedSeats.size}/${totalTravellers} selected)`}
                                    </p>
                                </div>

                                {/* Legend */}
                                {processedRows.length > 0 && (
                                    <div className="bg-[#f8f9fa] rounded-xl py-2 px-3 sm:px-4 border border-slate-200 mb-2.5">
                                        <div className="flex flex-wrap items-center gap-3 sm:gap-6 justify-start">
                                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Legend</span>
                                            <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                                                {legendItems.map((item) => (
                                                    <div key={item.label} className="flex items-center gap-1.5">
                                                        <div className={`w-4.5 h-4.5 rounded-[4px] flex items-center justify-center relative shrink-0 ${item.color}`}>
                                                            {item.icon}
                                                        </div>
                                                        <span className="text-[11px] sm:text-xs text-gray-700 font-medium">{item.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 lg:gap-3 items-start flex-1">

                                    <div className='lg:col-span-8 flex flex-col'>

                                        {/* Seat Map */}
                                        <div className="pb-1">
                                            {loadingSeatMap ? (
                                                <div className="flex justify-center items-center py-10">
                                                    <div className="animate-spin rounded-full h-7 w-7 border-2 border-[#920000] border-t-transparent"></div>
                                                    <span className="ml-2 text-gray-600 text-xs">Loading seat map...</span>
                                                </div>
                                            ) : seatMapError ? (
                                                <div className="text-center py-6 px-3 flex flex-col items-center justify-center bg-gray-50/70 rounded-lg border border-gray-200 max-w-xs mx-auto my-2">
                                                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center mb-1.5 text-[#920000]">
                                                        <CircleAlert className="w-4 h-4" />
                                                    </div>
                                                    <h3 className="font-bold text-xs text-gray-900">Seat Map Unavailable</h3>
                                                    <p className="text-[10px] text-gray-500 mt-0.5 max-w-xs">
                                                        Seat selection is currently not supported for this flight. Seats will be allocated by the airline at airport check-in.
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (onSeatsContinue) {
                                                                const selectedSeatDetails = collectAllSeatDetails();
                                                                const allSeats = new Set(selectedSeatDetails.map(d => d.number));
                                                                onSeatsContinue({ selectedSeats: allSeats, selectedServices, totalAmount: grandTotalAmount, selectedSeatDetails });
                                                            } else if (onClose) {
                                                                onClose();
                                                            } else {
                                                                navigate(-1);
                                                            }
                                                        }}
                                                        className="mt-2.5 px-3 py-1.5 bg-[#920000] text-white rounded-md font-semibold text-[11px] hover:bg-[#780000] transition-colors shadow-2xs cursor-pointer"
                                                    >
                                                        Continue Without Seat Selection
                                                    </button>
                                                </div>
                                            ) : processedRows.length === 0 ? (
                                                <div className="text-center py-8 px-3 text-gray-500 flex flex-col items-center justify-center bg-gray-50/70 rounded-lg border border-gray-200">
                                                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-2 text-[#920000]">
                                                        <PlaneTakeoff className="w-5 h-5" />
                                                    </div>
                                                    <p className="font-bold text-xs text-gray-800">No seat map available for this flight.</p>
                                                    <p className="text-[10px] text-gray-500 mt-0.5 max-w-xs">
                                                        Seat selection is not available for this flight. You can proceed directly or your seats will be assigned at airport check-in.
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (onSeatsContinue) {
                                                                const selectedSeatDetails = collectAllSeatDetails();
                                                                const allSeats = new Set(selectedSeatDetails.map(d => d.number));
                                                                onSeatsContinue({ selectedSeats: allSeats, selectedServices, totalAmount: grandTotalAmount, selectedSeatDetails });
                                                            } else if (onClose) {
                                                                onClose();
                                                            } else {
                                                                navigate(-1);
                                                            }
                                                        }}
                                                        className="mt-3 px-3 py-1.5 bg-[#920000] text-white rounded-md font-medium text-[11px] hover:bg-[#780000] transition-colors shadow-2xs cursor-pointer"
                                                    >
                                                        Continue Without Seat Selection
                                                    </button>
                                                </div>
                                            ) : (
                                                <SeatGrid
                                                    processedRows={processedRows}
                                                    seatLetters={seatLetters}
                                                    selectedSeats={selectedSeats}
                                                    seatMap={seatMap}
                                                    getSeatVisual={getSeatVisual}
                                                    onSeatClick={handleSeatClick}
                                                    onSeatHover={handleSeatMouseEnter}
                                                    onSeatLeave={handleSeatMouseLeave}
                                                />
                                            )}
                                        </div>

                                        {/* Connecting flight — next leg nudge */}
                                        {isConnecting && activeFlightIndex < normalizedFlightKeys.length - 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setActiveFlightIndex(activeFlightIndex + 1)}
                                                className="mt-1.5 mb-3 mx-auto flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#920000] text-white font-semibold text-[11px] shadow-2xs hover:bg-[#780000] transition-all"
                                            >
                                                <PlaneLanding className="w-3 h-3" />
                                                Next: Select seat for Leg {activeFlightIndex + 2}
                                                <ChevronRight className="w-3 h-3" />
                                            </button>
                                        )}

                                    </div>


                                    <div className="lg:col-span-4 flex flex-col gap-2.5 hidden lg:flex">

                                        {/* Summary Panel */}
                                        <div className="sticky lg:static bottom-0 bg-white z-20">
                                            <SummaryPanel
                                                paxList={paxList}
                                                paxSeatMap={paxSeatMap}
                                                activePaxIndex={activePaxIndex}
                                                onSelectPax={(idx) => setActivePaxIndex(idx)}
                                                seatMap={seatMap}
                                                SSRTypes={SSRTypes}
                                                selectedServices={selectedServices}
                                                onRemoveSeat={handleRemoveSeatForPax}
                                                onRemoveService={handleRemoveService}
                                                totalAmount={grandTotalAmount}
                                                hasSeatsAvailable={processedRows.length > 0}
                                                onContinue={() => {
                                                    setOpenSummaryModal(false);
                                                    if (onSeatsContinue) {
                                                        const selectedSeatDetails = collectAllSeatDetails();
                                                        const allSeats = new Set(selectedSeatDetails.map(d => d.number));
                                                        onSeatsContinue({ selectedSeats: allSeats, selectedServices, totalAmount: grandTotalAmount, selectedSeatDetails });
                                                    } else {
                                                        navigate("/payment", { state: { selectedSeats, selectedServices } });
                                                    }
                                                }}
                                                onProceedWithoutSeat={handleProceedWithoutSeat}
                                            />
                                        </div>

                                    </div>

                                </div>
                            </div>

                            {tooltipData && window.innerWidth > 768 && (
                                <SeatTooltip seat={tooltipData.seat} position={tooltipData.pos} />
                            )}

                            <button
                                type="button"
                                onClick={() => setOpenServiceModal(true)}
                                aria-label="Add services"
                                className=" lg:hidden fixed bottom-24 right-4 z-[9999] w-14 h-14 rounded-full bg-[#78080B] text-white flex items-center justify-center shadow-lg active:scale-95 transition"
                            >
                                <Plus className="w-6 h-6" />
                            </button>

                        </div>

                    </div>
                </div>
            </div>
        </>
    );

};

export default FlightSeatMap;
