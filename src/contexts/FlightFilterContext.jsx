import { createContext, useContext, useReducer } from "react";

const FlightFilterContext = createContext();

const initialState = {
    selectedStops: [],
    selectedAirlines: [],
    selectedAircraftSizes: [],
    selectedPriceRange: [0, Infinity],
    selectedDepartureTime: null,
    selectedArrivalTime: null,
    showFareBreakdown: false,
};

function reducer(state, action) {
    switch (action.type) {
        case "SET_STOPS":
            return { ...state, selectedStops: action.payload };

        case "SET_AIRLINES":
            return { ...state, selectedAirlines: action.payload };

        case "SET_PRICE_RANGE":
            return { ...state, selectedPriceRange: action.payload };

        case "SET_DEPARTURE_TIME":
            return { ...state, selectedDepartureTime: action.payload };

        case "SET_ARRIVAL_TIME":
            return { ...state, selectedArrivalTime: action.payload };

        case "SET_AIRCRAFT_SIZES":
            return { ...state, selectedAircraftSizes: action.payload };

        case "SET_SHOW_FARE_BREAKDOWN":
            return { ...state, showFareBreakdown: action.payload };

        case "TOGGLE_SHOW_FARE_BREAKDOWN":
            return { ...state, showFareBreakdown: !state.showFareBreakdown };

        case "RESET_FILTERS":
            return initialState;

        default:
            return state;
    }
}

export function FlightFilterProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    return (
        <FlightFilterContext.Provider value={{ state, dispatch }}>
            {children}
        </FlightFilterContext.Provider>
    );
}

export const useFlightFilters = () => useContext(FlightFilterContext);
