/**
 * Helper to identify if a leg object is a return leg
 */
const isLegReturn = (l) => {
    if (!l) return false;
    return Boolean(
        l.isRs === true || l.isRs === 'true' || l.isRs === 1 || l.isRs === '1' ||
        l.IsRs === true || l.IsRs === 'true' || l.IsRs === 1 || l.IsRs === '1' ||
        l.isReturn === true || l.isReturn === 'true' || l.isReturn === 1 || l.isReturn === '1' ||
        l.IsReturn === true || l.IsReturn === 'true' || l.IsReturn === 1 || l.IsReturn === '1' ||
        l.tripId === 1 || l.tripId === '1' ||
        l.TripId === 1 || l.TripId === '1' ||
        l.Trip_Id === 1 || l.Trip_Id === '1'
    );
};

/**
 * Checks if a flight object contains Special Round Trip legs (both Onward and Return)
 */
export const isSpecialRoundTripFlight = (flight) => {
    if (!flight) return false;
    const legs = flight.FlightDetailResponses || flight.flightDetailResponses || flight.FlightDetails || flight.flightDetails || flight.legs || [];
    if (!Array.isArray(legs) || legs.length < 2) return false;
    
    // A special round trip combo flight has BOTH onward leg and return leg within the same flight object
    const hasReturn = legs.some(isLegReturn);
    const hasOnward = legs.some(l => !isLegReturn(l));
    return hasReturn && hasOnward;
};

/**
 * Extracts stops count from a single leg or legList
 */
export const getLegStops = (leg, legList = []) => {
    if (!leg && (!legList || legList.length === 0)) return 0;

    // If legList represents multiple connecting segments of a journey (e.g. DEL-BLR, BLR-FRA, FRA-LHR),
    // the stops count between origin and final destination is exactly legList.length - 1 (the connecting layover cities).
    if (Array.isArray(legList) && legList.length > 1) {
        return legList.length - 1;
    }

    const target = leg || (Array.isArray(legList) ? legList[0] : null);
    if (!target) return 0;

    if (typeof target.AirlineStops === 'number' && !isNaN(target.AirlineStops)) return target.AirlineStops;
    if (typeof target.Stops === 'number' && !isNaN(target.Stops)) return target.Stops;
    if (typeof target.stops === 'number' && !isNaN(target.stops)) return target.stops;

    if (target.AirlineStops !== undefined && target.AirlineStops !== null && target.AirlineStops !== '' && !isNaN(Number(target.AirlineStops))) {
        return Number(target.AirlineStops);
    }
    if (target.Stops !== undefined && target.Stops !== null && target.Stops !== '' && !isNaN(Number(target.Stops))) {
        return Number(target.Stops);
    }
    if (target.stops !== undefined && target.stops !== null && target.stops !== '' && !isNaN(Number(target.stops))) {
        return Number(target.stops);
    }

    const segs = target.SegmentList || target.segments || target.FlightSegments;
    if (Array.isArray(segs) && segs.length > 0) {
        return Math.max(0, segs.length - 1);
    }
    return 0;
};

/**
 * Calculates the total journey duration (flight duration + connecting times) across an array of legs/segments
 */
export const calculateLegsDuration = (legs) => {
    if (!Array.isArray(legs) || legs.length === 0) return "";
    if (legs.length === 1) {
        return legs[0].airlineDuration || legs[0].AirlineDuration || "";
    }
    let totalMinutes = 0;
    legs.forEach((leg, idx) => {
        const dStr = leg.airlineDuration || leg.AirlineDuration || "";
        const hMatch = dStr.match(/(\d+)\s*h/i);
        const mMatch = dStr.match(/(\d+)\s*m/i);
        if (hMatch || mMatch) {
            totalMinutes += (parseInt(hMatch?.[1] || "0", 10) * 60) + parseInt(mMatch?.[1] || "0", 10);
        }
        if (idx > 0) {
            const ctVal = leg.ConnectingTime || leg.connectingTime;
            if (ctVal) {
                const ctStr = String(ctVal);
                const ctHMatch = ctStr.match(/(\d+)\s*h/i);
                const ctMMatch = ctStr.match(/(\d+)\s*m/i);
                if (ctHMatch || ctMMatch) {
                    totalMinutes += (parseInt(ctHMatch?.[1] || "0", 10) * 60) + parseInt(ctMMatch?.[1] || "0", 10);
                } else if (!isNaN(Number(ctStr))) {
                    totalMinutes += parseInt(ctStr, 10);
                }
            }
        }
    });
    if (totalMinutes > 0) {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${String(h).padStart(2, "0")}h:${String(m).padStart(2, "0")}m`;
    }
    return legs[0].airlineDuration || legs[0].AirlineDuration || "";
};

/**
 * Extracts onward and return legs from a special round trip flight
 */
export const getSpecialRoundTripLegs = (flight) => {
    if (!flight) return { onwardLeg: null, returnLeg: null };
    const legs = flight.FlightDetailResponses || flight.flightDetailResponses || flight.FlightDetails || flight.flightDetails || flight.legs || [];
    const returnLeg = legs.find(isLegReturn) || (legs.length > 1 ? legs[legs.length - 1] : null);
    const onwardLeg = legs.find(l => !isLegReturn(l)) || legs[0] || null;
    return { onwardLeg, returnLeg };
};

/**
 * Extracts numeric stops for both legs of a special round trip flight
 */
export const getSpecialRoundTripStops = (flight) => {
    if (!flight) return { onwardStops: 0, returnStops: 0 };
    const legs = flight.FlightDetailResponses || flight.flightDetailResponses || flight.FlightDetails || flight.flightDetails || flight.legs || [];
    
    const returnLegs = legs.filter(isLegReturn);
    const onwardLegs = legs.filter(l => !isLegReturn(l));

    const onwardLeg = onwardLegs[0] || legs[0] || null;
    const returnLeg = returnLegs[0] || (legs.length > 1 ? legs[legs.length - 1] : null);

    const onwardStops = getLegStops(onwardLeg, onwardLegs);
    const returnStops = getLegStops(returnLeg, returnLegs);

    return { onwardStops, returnStops };
};

/**
 * Safely extracts numeric stops from a flight or leg object
 */
export const getFlightStops = (flight) => {
    if (!flight) return 0;

    // For special round trip flights, total stops is sum of onward and return stops
    if (isSpecialRoundTripFlight(flight)) {
        const { onwardStops, returnStops } = getSpecialRoundTripStops(flight);
        return onwardStops + returnStops;
    }
    
    // Check direct numeric properties
    if (typeof flight.AirlineStops === 'number' && !isNaN(flight.AirlineStops)) return flight.AirlineStops;
    if (typeof flight.Stops === 'number' && !isNaN(flight.Stops)) return flight.Stops;
    if (typeof flight.stops === 'number' && !isNaN(flight.stops)) return flight.stops;
    
    // Check string representations (e.g. "0", "1")
    if (flight.AirlineStops !== undefined && flight.AirlineStops !== null && flight.AirlineStops !== '' && !isNaN(Number(flight.AirlineStops))) {
        return Number(flight.AirlineStops);
    }
    if (flight.Stops !== undefined && flight.Stops !== null && flight.Stops !== '' && !isNaN(Number(flight.Stops))) {
        return Number(flight.Stops);
    }
    if (flight.stops !== undefined && flight.stops !== null && flight.stops !== '' && !isNaN(Number(flight.stops))) {
        return Number(flight.stops);
    }
    
    // Check SegmentList / segments (actual connecting segments within a single leg/flight)
    const segments = flight.SegmentList || flight.segments;
    if (Array.isArray(segments) && segments.length > 0) {
        return Math.max(0, segments.length - 1);
    }

    // Check FlightDetailResponses for single journey connecting legs
    const legs = flight.FlightDetailResponses || flight.flightDetailResponses;
    if (Array.isArray(legs) && legs.length > 0) {
        return Math.max(0, legs.length - 1);
    }
    
    return 0;
};

/**
 * Formats a stop count (or stop value) to a user-facing string:
 * 0 -> "Non Stop"
 * 1 -> "1 Stop"
 * 2+ -> "2 Stops"
 */
export const formatStopsLabel = (stops) => {
    if (typeof stops === 'string') {
        const trimmed = stops.trim();
        if (trimmed.includes('-') || trimmed.toLowerCase().includes('stop')) {
            return trimmed;
        }
        if (!isNaN(Number(trimmed))) {
            const num = Number(trimmed);
            if (num === 0) return "Non Stop";
            if (num === 1) return "1 Stop";
            return `${num} Stops`;
        }
        return trimmed;
    }
    const num = (stops === null || stops === undefined || isNaN(Number(stops))) ? 0 : Number(stops);
    if (num === 0) return "Non Stop";
    if (num === 1) return "1 Stop";
    return `${num} Stops`;
};

/**
 * Formats special round trip combo stop label (e.g. "Non Stop - 1 Stop", "1 Stop - Non Stop", "1 Stop - 1 Stop")
 */
export const formatSpecialRoundTripStopsLabel = (onwardStops, returnStops) => {
    const onwardText = formatStopsLabel(onwardStops);
    const returnText = formatStopsLabel(returnStops);
    return `${onwardText} - ${returnText}`;
};

/**
 * Extracts onward and return leg groups from a special round trip flight
 */
export const getSpecialRoundTripLegGroups = (flight) => {
    if (!flight) return { onwardLegs: [], returnLegs: [] };
    const legs = flight.FlightDetailResponses || flight.flightDetailResponses || flight.FlightDetails || flight.flightDetails || flight.legs || [];
    if (!Array.isArray(legs) || legs.length === 0) return { onwardLegs: [], returnLegs: [] };

    const returnLegs = legs.filter(isLegReturn);
    const onwardLegs = legs.filter(l => !isLegReturn(l));

    return {
        onwardLegs: onwardLegs.length > 0 ? onwardLegs : [legs[0]],
        returnLegs: returnLegs.length > 0 ? returnLegs : (legs.length > 1 ? [legs[legs.length - 1]] : [])
    };
};

/**
 * Extracts intermediate layover airport codes (e.g. ["BOM"]) from a flight or leg list
 */
export const getFlightLayoverAirports = (flightOrLegs) => {
    if (!flightOrLegs) return [];

    // If an array of legs is passed
    if (Array.isArray(flightOrLegs)) {
        if (flightOrLegs.length <= 1) return [];
        return flightOrLegs
            .slice(0, -1)
            .map((l) => {
                const code = l?.AirlineArrival?.code || l?.AirlineArrival?.AirportCode || l?.ArrivalAirportCode || l?.arrivalAirportCode || "";
                if (code) return String(code).trim().toUpperCase();
                const city = l?.AirlineArrival?.city || l?.AirlineArrival?.name || "";
                return city ? String(city).trim().toUpperCase() : "";
            })
            .filter(Boolean);
    }

    // If a flight object is passed
    const legs = flightOrLegs.FlightDetailResponses || flightOrLegs.flightDetailResponses || flightOrLegs.legs || [];
    if (Array.isArray(legs) && legs.length > 1 && !isSpecialRoundTripFlight(flightOrLegs)) {
        return getFlightLayoverAirports(legs);
    }

    const segments = flightOrLegs.SegmentList || flightOrLegs.segments || flightOrLegs.FlightSegments;
    if (Array.isArray(segments) && segments.length > 1) {
        return getFlightLayoverAirports(segments);
    }

    return [];
};

/**
 * Formats a stop label with layover airport codes (e.g. "1 Stop · BOM")
 */
export const formatStopsWithLayovers = (stopsCount, layoverAirports = []) => {
    const baseLabel = formatStopsLabel(stopsCount);
    if (stopsCount === 0 || baseLabel === "Non Stop") {
        return "Non Stop";
    }
    if (Array.isArray(layoverAirports) && layoverAirports.length > 0) {
        const unique = [...new Set(layoverAirports.filter(Boolean).map(c => String(c).toUpperCase()))];
        if (unique.length > 0) {
            return `${baseLabel} · ${unique.join(", ")}`;
        }
    }
    return baseLabel;
};

/**
 * Helper to get formatted stop label directly from flight object
 */
export const formatFlightStops = (flight, isSpecialRoundTrip = false, includeLayovers = false) => {
    if (isSpecialRoundTrip || isSpecialRoundTripFlight(flight)) {
        const { onwardStops, returnStops } = getSpecialRoundTripStops(flight);
        return formatSpecialRoundTripStopsLabel(onwardStops, returnStops);
    }
    const stops = getFlightStops(flight);
    if (includeLayovers && stops > 0) {
        const layovers = getFlightLayoverAirports(flight);
        return formatStopsWithLayovers(stops, layovers);
    }
    return formatStopsLabel(stops);
};

