import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Pencil } from "lucide-react";
import { parse, format, isValid } from "date-fns";
import { fetchAirportsByCode } from "@/services/airportsSearch.js";

const CABIN_CLASSES = {
    0: "Economy",
    1: "Premium Economy",
    2: "Business",
    3: "First Class",
};

function MobileSearchSummary({ onEdit, payload, firstFlight }) {
    const [searchParams] = useSearchParams();
    const [originCity, setOriginCity] = useState("");
    const [destinationCity, setDestinationCity] = useState("");

    const originCode = searchParams.get("origin") || payload?.TripInfo?.[0]?.Origin || "";
    const destinationCode = searchParams.get("destination") || payload?.TripInfo?.[0]?.Destination || "";
    const departDateStr = searchParams.get("departDate") || payload?.TripInfo?.[0]?.TravelDate || "";
    const returnDateStr = searchParams.get("returnDate") || payload?.TripInfo?.[1]?.TravelDate || "";

    const adults = Number(searchParams.get("adults") || payload?.AdultCount || 1);
    const children = Number(searchParams.get("children") || payload?.ChildCount || 0);
    const infants = Number(searchParams.get("infants") || payload?.InfantCount || 0);
    const cabinClass = Number(searchParams.get("cabinClass") ?? payload?.CabinClass ?? 0);

    // Resolve city names from firstFlight or fetchAirportsByCode
    useEffect(() => {
        if (firstFlight?.AirlineDeparture?.city) {
            setOriginCity(firstFlight.AirlineDeparture.city);
        } else if (originCode) {
            fetchAirportsByCode(originCode)
                .then(res => {
                    if (res?.[0]?.city) setOriginCity(res[0].city);
                    else setOriginCity(originCode);
                })
                .catch(() => setOriginCity(originCode));
        }

        if (firstFlight?.AirlineArrival?.city) {
            setDestinationCity(firstFlight.AirlineArrival.city);
        } else if (destinationCode) {
            fetchAirportsByCode(destinationCode)
                .then(res => {
                    if (res?.[0]?.city) setDestinationCity(res[0].city);
                    else setDestinationCity(destinationCode);
                })
                .catch(() => setDestinationCity(destinationCode));
        }
    }, [originCode, destinationCode, firstFlight]);

    // Parse date safely
    const parseDateSafe = (str) => {
        if (!str) return null;
        try {
            const p1 = parse(str, "MM/dd/yyyy", new Date());
            if (isValid(p1)) return p1;
        } catch (_) { }
        try {
            const p2 = parse(str, "yyyy-MM-dd", new Date());
            if (isValid(p2)) return p2;
        } catch (_) { }
        try {
            const p3 = new Date(str);
            if (isValid(p3) && !isNaN(p3.getTime())) return p3;
        } catch (_) { }
        return null;
    };

    const depDate = parseDateSafe(departDateStr);
    const retDate = parseDateSafe(returnDateStr);

    let dateText = "Select Date";
    if (depDate) {
        dateText = format(depDate, "d MMM");
        if (retDate) {
            dateText += ` - ${format(retDate, "d MMM")}`;
        }
    }

    const totalPax = adults + children + infants;
    const paxText = totalPax === 1 && adults === 1 ? "1 Adult" : `${totalPax} ${totalPax === 1 ? "Traveller" : "Travellers"}`;
    const cabinText = CABIN_CLASSES[cabinClass] || "Economy";

    const displayFrom = originCity || originCode || "Origin";
    const displayTo = destinationCity || destinationCode || "Destination";

    return (
        <div
            onClick={() => onEdit && onEdit(true)}
            className="w-full h-full filterglasseffect rounded-xl shadow-sm px-4 py-2.5 cursor-pointer active:scale-[0.98] transition-transform flex items-center justify-between"
            style={{ zIndex: 2 }}
        >
            <div className="flex flex-col min-w-0 pr-2">
                <span className="text-xs xs:text-sm font-semibold text-gray-900 truncate">
                    {displayFrom} → {displayTo}
                </span>
                <span className="text-xs xs:text-sm text-gray-600 truncate">
                    {dateText} · {paxText} · {cabinText}
                </span>
            </div>

            <div className="flex flex-col items-center gap-0.5 text-xs font-medium text-[#78080B] shrink-0">
                <Pencil size={15} />
                <span>Edit</span>
            </div>
        </div>
    );
}

export default React.memo(MobileSearchSummary);