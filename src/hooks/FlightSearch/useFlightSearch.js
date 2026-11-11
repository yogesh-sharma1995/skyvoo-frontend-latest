import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { searchFlights } from "@/services/flightsSearch";

export const useFlightSearch = () => {
    const [searchParams] = useSearchParams();

    const origin = searchParams.get("origin") || "";
    const destination = searchParams.get("destination") || "";
    const departDate = searchParams.get("departDate") || "";
    const returnDate = searchParams.get("returnDate") || "";

    const adults = Number(searchParams.get("adults") || 1);
    const children = Number(searchParams.get("children") || 0);
    const infants = Number(searchParams.get("infants") || 0);

    const cabinClass = Number(searchParams.get("cabinClass") || 0);
    const travelType = Number(searchParams.get("travelType") || 0);
    const bookingType = Number(searchParams.get("bookingType") || 0);

    const srCitizenSearch = searchParams.get("srCitizenSearch") === "true";
    const studentFareSearch = searchParams.get("studentFareSearch") === "true";

    const payload = useMemo(() => {
        const tripInfo = [
            {
                Origin: origin,
                Destination: destination,
                TravelDate: departDate,
                Trip_Id: 0,
            },
        ];

        if (returnDate) {
            tripInfo.push({
                Origin: destination,
                Destination: origin,
                TravelDate: returnDate,
                Trip_Id: 1,
            });
        }

        return {
            TripInfo: tripInfo,
            TravelType: travelType,
            BookingType: bookingType,
            CabinClass: cabinClass,
            AdultCount: adults,
            ChildCount: children,
            InfantCount: infants,
            SrCitizenSearch: srCitizenSearch,
            StudentFareSearch: studentFareSearch,
            Filtered_Airline: [{ Airline_Code: "" }],
        };
    }, [
        origin,
        destination,
        departDate,
        returnDate,
        adults,
        children,
        infants,
        cabinClass,
        travelType,
        bookingType,
        srCitizenSearch,
        studentFareSearch,
    ]);

    const isValidSearch = Boolean(
        origin &&
        destination &&
        departDate &&
        origin !== "Origin" &&
        destination !== "Destination"
    );

    const query = useQuery({
        queryKey: [
            "flight-search",
            origin,
            destination,
            departDate,
            returnDate,
            adults,
            children,
            infants,
            cabinClass,
            travelType,
            bookingType,
            srCitizenSearch,
            studentFareSearch,
        ],
        queryFn: () => searchFlights(payload),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        enabled: isValidSearch,
    });

    const apiFlights = query.data?.Data?.OneWayResponses || [];
    const apiFlightAirlines = query.data?.Data?.FlightCounts || [];
    const apiReturnFlights = query.data?.Data?.ReturnResponses || [];
    const apiReturnAirlines = query.data?.Data?.ReturnFlightCounts || [];

    return {
        ...query,
        isValidSearch,
        isFetched: query.isFetched,
        apiFlights,
        apiFlightAirlines,
        apiReturnFlights,
        apiReturnAirlines,
        payload,
    };
};

export default useFlightSearch;

