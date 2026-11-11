const STORAGE_KEY = "skyvoo_booking";

const defaultBooking = {
    // One-way / legacy
    flight: null,
    passengers: [],
    seats: [],
    seatTotal: 0,
    selectedFare: null,
    fareReviewKey: null,          // FareReviewKey from the chosen TotalPriceList entry

    // Round-trip selection
    isRoundTrip: false,
    outboundFlight: null,
    returnFlight: null,
    outboundFareReviewKey: null,
    returnFareReviewKey: null,

    // Travel type (0 = domestic, 1 = international)
    travelType: 0,

    // Passenger breakdown
    travellers: { adults: 1, children: 0, infants: 0 },

    // Seat / SSR selections — always reset per booking
    selectedSeatDetails: [],
    selectedSeats: [],
    selectedServices: [],
    gstInfo: null,
};

function loadBooking() {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : defaultBooking;
    } catch {
        return defaultBooking;
    }
}

function saveBooking(data) {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        // ignore quota / storage errors
    }
}

let booking = loadBooking();

export const bookingStore = {
    get() {
        if (!booking || (!booking.flight && !booking.outboundFlight)) {
            booking = loadBooking();
        }
        return booking;
    },

    set(partial) {
        booking = { ...(booking || loadBooking()), ...partial };
        saveBooking(booking);
    },

    reset() {
        booking = defaultBooking;
        try {
            sessionStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // ignore
        }
    },
};
