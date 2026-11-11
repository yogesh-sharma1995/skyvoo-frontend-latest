import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/common/Button";
import { ChevronRight } from 'lucide-react';

export default function TicketDetailsReviewModal({ onClose }) {
    const navigate = useNavigate();

    React.useEffect(() => {
        const originalBodyOverflow = document.body.style.overflow;
        const originalHtmlOverflow = document.documentElement.style.overflow;
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalBodyOverflow;
            document.documentElement.style.overflow = originalHtmlOverflow;
        };
    }, []);

    return (
        <div className=" fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center px-2 sm:px-4"
            style={{ animation: "fadeIn 0.3s ease-out forwards" }}
            onClick={onClose}
        >
            <div
                className="p-8 bg-white shadow-2xl w-full sm:max-w-2xl lg:max-w-[60%] rounded-2xl max-h-[90vh] xs:max-h-[80vh] overflow-y-auto scrollbar relative animate-scaleIn "
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close */}
                <button
                    className="absolute top-4 right-4 text-gray-500 hover:text-black text-xl"
                    onClick={onClose}
                >
                    ✕
                </button>

                {/* Title */}
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6 text-center text-gray-800">
                    ✈️ Flight Ticket Details
                </h2>

                {/* Passenger Info */}
                <Section title="👤 Passenger Information">
                    <InfoGrid>
                        <InfoItem label="Name" value="Adarsh Joshi" />
                        <InfoItem label="Email" value="adarshjoshi200513@gmail.com" />
                        <InfoItem label="Phone" value="+91 9667576778" />
                        <InfoItem label="Gender" value="Male" />
                    </InfoGrid>
                </Section>

                {/* Flight Info */}
                <Section title="🛫 Flight Information" gray>
                    <InfoGrid>
                        <InfoItem label="Airline" value="Qatar Airways" />
                        <InfoItem label="Flight No" value="QR908" />
                        <InfoItem label="Departure" value="Doha (DOH)" />
                        <InfoItem label="Arrival" value="London Heathrow (LHR)" />
                        <InfoItem label="Date" value="15 Nov 2025" />
                        <InfoItem label="Duration" value="7h 40m" />
                    </InfoGrid>

                    <div className="mt-4 flex items-center justify-between text-xs sm:text-sm text-gray-600">
                        <div>
                            <p className="font-medium">Departure</p>
                            <p>08:45 AM</p>
                        </div>
                        <div className="hidden sm:block">—— ✈ ——</div>
                        <div className="text-right">
                            <p className="font-medium">Arrival</p>
                            <p>01:25 PM</p>
                        </div>
                    </div>
                </Section>

                {/* Seat & Class */}
                <Section title="💺 Seat & Class">
                    <InfoGrid>
                        <InfoItem label="Seat" value="14A (Window)" />
                        <InfoItem label="Class" value="Business" />
                        <InfoItem label="Meal" value="Vegetarian" />
                        <InfoItem label="Baggage" value="40kg" />
                    </InfoGrid>
                </Section>

                {/* Price */}
                <Section title="💳 Price Summary" gray>
                    <div className="space-y-2 text-sm">
                        <Row label="Base Fare" value="₹9,980.00" />
                        <Row label="Taxes & Fees" value="₹1,120.00" />
                        <Row
                            label="Total Amount"
                            value="₹11,100.00"
                            highlight
                        />
                    </div>
                </Section>

                {/* Booking */}
                <Section title="📄 Booking Details">
                    <InfoGrid>
                        <InfoItem label="Booking ID" value="BKTY98234" />
                        <InfoItem label="Payment" value="Visa **** 4821" />
                        <InfoItem label="Booking Date" value="20 Oct 2025" />
                        <InfoItem
                            label="Status"
                            value="Confirmed"
                            valueClass="text-green-600 font-semibold"
                        />
                    </InfoGrid>
                </Section>

                {/* CTA */}
                <div className="flex mt-4">
                    <Button onClick={() => navigate("/flight-seat-map")}>
                        CONTINUE
                        <ChevronRight />
                    </Button>

                </div>
            </div>
        </div>
    );
}

/* Helpers */
function Section({ title, children, gray }) {
    return (
        <div className={`p-4 mb-6 border border-gray-200 rounded-xl ${gray ? "bg-gray-50" : ""}`}>
            <h3 className="text-sm sm:text-base font-semibold mb-3">{title}</h3>
            {children}
        </div>
    );
}

function InfoGrid({ children }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 text-sm text-gray-700 gap-6">
            {children}
        </div>
    );
}

function InfoItem({ label, value, valueClass }) {
    return (
        <div className="flex flex-row justify-between">
            <p className="font-medium"> {label}: </p>
            <p> {value} </p>
        </div>

    );
}

function Row({ label, value, highlight }) {
    return (
        <div
            className={`flex justify-between ${highlight ? "font-bold text-[#78080B] border-t pt-2" : ""
                }`}
        >
            <span>{label}</span>
            <span>{value}</span>
        </div>
    );
}


