import React, { useState, useEffect, useRef, useMemo } from "react";
import { Plane, Clock, MapPin, Check } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { addDays, startOfToday } from "date-fns";
import Header from '@/components/layout/Header';
import "react-day-picker/dist/style.css";
import GrayFadedBg from '@/assets/imgs/grayfadedbg.webp';

export default function Reschedule() {
    const [isShowResults, setIsShowResults] = useState(false);
    const [isDepartPickerOpen, setIsDepartPickerOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState(() => new Date());
    const [formattedDate, setFormattedDate] = useState("");
    const [showMoreTripInfo, setShowMoreTripInfo] = useState(false);
    const departRef = useRef(null);

    const today = useMemo(() => startOfToday(), []);
    const maxRescheduleDate = useMemo(() => addDays(today, 90), [today]);

    const tripData = {
        bookingRef: "FLT789456",
        route: "New Delhi → Dubai",
        passengers: 2,
        class: "Economy",
        returnDate: "2025-11-27",
        status: "Confirmed",
    };

    const [flightDetails, setFlightDetails] = useState([]);

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    useEffect(() => {
        if (selectedDay) setFormattedDate(formatDate(selectedDay));
    }, [selectedDay]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (departRef.current && !departRef.current.contains(e.target)) {
                setIsDepartPickerOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    const handleProceed = () => {

        const updatedFlights = [
            {
                airline: "Emirates",
                flightNo: "EK512",
                from: {
                    code: "DEL",
                    city: "New Delhi",
                    airport: "Indira Gandhi International Airport",
                },
                to: {
                    code: "DXB",
                    city: "Dubai",
                    airport: "Dubai International Airport",
                },
                departure: "02:30 AM",
                arrival: "05:15 AM",
                duration: "3h 45m",
                date: selectedDay,
                price: "0",
            },
            {
                airline: "Emirates",
                flightNo: "EK513",
                from: {
                    code: "DXB",
                    city: "Dubai",
                    airport: "Dubai International Airport",
                },
                to: {
                    code: "DEL",
                    city: "New Delhi",
                    airport: "Indira Gandhi International Airport",
                },
                departure: "08:30 PM",
                arrival: "01:45 AM",
                duration: "3h 15m",
                date: tripData.returnDate,
                price: "-690",
            },
            {
                airline: "Qatar Airways",
                flightNo: "QR579",
                from: {
                    code: "DEL",
                    city: "New Delhi",
                    airport: "Indira Gandhi International Airport",
                },
                to: {
                    code: "DOH",
                    city: "Doha",
                    airport: "Hamad International Airport",
                },
                departure: "04:10 AM",
                arrival: "05:40 AM",
                duration: "2h 30m",
                date: selectedDay,
                price: "+120",
            },
            {
                airline: "IndiGo",
                flightNo: "6E1461",
                from: {
                    code: "DEL",
                    city: "New Delhi",
                    airport: "Indira Gandhi International Airport",
                },
                to: {
                    code: "DXB",
                    city: "Dubai",
                    airport: "Dubai International Airport",
                },
                departure: "11:20 AM",
                arrival: "01:40 PM",
                duration: "3h 20m",
                date: selectedDay,
                price: "-50",
            },
            {
                airline: "Air India",
                flightNo: "AI995",
                from: {
                    code: "DEL",
                    city: "New Delhi",
                    airport: "Indira Gandhi International Airport",
                },
                to: {
                    code: "DXB",
                    city: "Dubai",
                    airport: "Dubai International Airport",
                },
                departure: "06:55 PM",
                arrival: "09:20 PM",
                duration: "3h 25m",
                date: selectedDay,
                price: "+240",
            },
        ];

        setFlightDetails(updatedFlights);
        setIsShowResults(true);
    };

    return (
        <div>

            <div className="max-w-5xl mx-auto space-y-8 relative z-900">
                <div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2 tracking-tight">
                        Reschedule Your Trip
                    </h1>
                    <p className="text-gray-600">Adjust dates and explore updated options</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
                    <div
                        className="flex items-center cursor-pointer"
                        onClick={() => setShowMoreTripInfo(!showMoreTripInfo)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow">
                                <Plane className="text-white" size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">{tripData.route}</h2>
                                <p className="text-sm text-gray-500">
                                    Booking Reference: {tripData.bookingRef}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col bg-white rounded-lg shadow-lg p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="border-r border-gray-200 pr-6">
                                <h3 className="text-gray-500 text-sm font-medium mb-4">
                                    ONWARD TRIP
                                </h3>

                                <p className="text-gray-500 text-sm">Your current Emirates flight is scheduled for:</p>

                                <p className="text-xl font-bold mt-1">{formatDate("2025-11-20")}</p>
                            </div>

                            <div className="border-r border-gray-200 pr-6 relative" ref={departRef}>
                                <h3 className="text-blue-400 text-sm font-medium mb-4">NEW DEPARTURE</h3>

                                <div
                                    className="flex cursor-pointer items-center gap-3 mb-4"
                                    onClick={() => setIsDepartPickerOpen(!isDepartPickerOpen)}
                                >
                                    <div className="text-blue-400 text-xl font-semibold">{formattedDate}</div>
                                    <div className="bg-blue-500 rounded-full p-2">
                                        <Check className="w-5 h-5 text-white" />
                                    </div>
                                </div>

                                {isDepartPickerOpen && selectedDay && (
                                    <div className="absolute top-full mb-2 bg-white p-4 rounded-2xl shadow-lg z-50">
                                        <DayPicker
                                            mode="single"
                                            selected={selectedDay}
                                            onSelect={(day) => {
                                                if (day) {
                                                    setSelectedDay(day);
                                                    setIsDepartPickerOpen(false);
                                                }
                                            }}
                                            numberOfMonths={2}
                                            captionLayout="dropdown-buttons"
                                            className="text-gray-800"
                                            classNames={{ months: "flex gap-4" }}
                                            disabled={{
                                                before: today,
                                                after: maxRescheduleDate,
                                            }}
                                            fromMonth={today}
                                            toMonth={maxRescheduleDate}
                                        />

                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="text-gray-500 text-sm font-medium mb-4">TRAVELLER(S)</h3>
                                <div className="text-2xl font-bold text-gray-900">
                                    {tripData.passengers} traveller(s)
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                className="bg-[#78080B] hover:bg-red-800 text-white font-medium px-8 py-3 rounded-full transition-colors"
                                onClick={handleProceed}
                            >
                                PROCEED TO PICK FLIGHTS
                            </button>
                        </div>
                    </div>
                </div>

                {isShowResults && (
                    <div className="space-y-6 animate-fadeInUp">
                        {flightDetails.map((flight, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300"
                            >
                                <div className="bg-[#78080B] px-6 py-4">
                                    <div className="flex items-center">
                                        <span className="text-white text-xl font-bold bg-opacity-20 px-2 py-1 rounded-full">
                                            {flight.airline} • {flight.flightNo}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="bg-blue-100 p-2 rounded-lg">
                                                    <MapPin size={20} className="text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-bold text-gray-800">{flight.from.code}</p>
                                                    <p className="text-sm text-gray-600">{flight.from.city}</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 ml-11">{flight.from.airport}</p>
                                        </div>

                                        <div className="flex flex-col items-center px-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-16 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400"></div>
                                                <Plane size={20} className="text-indigo-600 rotate-45" />
                                                <div className="w-16 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400"></div>
                                            </div>
                                            <span className="text-xs text-gray-500 font-medium">{flight.duration}</span>
                                        </div>

                                        <div className="flex-1 text-right">
                                            <div className="flex items-center justify-end gap-3 mb-2">
                                                <div>
                                                    <p className="text-2xl font-bold text-gray-800">{flight.to.code}</p>
                                                    <p className="text-sm text-gray-600">{flight.to.city}</p>
                                                </div>
                                                <div className="bg-purple-100 p-2 rounded-lg">
                                                    <MapPin size={20} className="text-purple-600" />
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 mr-11">{flight.to.airport}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4">
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-2 mb-1">
                                                <Clock size={16} className="text-gray-600" />
                                                <span className="text-xs text-gray-600 font-medium">Departure</span>
                                            </div>
                                            <p className="text-xl font-bold text-gray-800">{flight.departure}</p>
                                            <p className="text-xs text-gray-500">{formatDate(flight.date)}</p>
                                        </div>

                                        <div className="text-center border-x border-gray-200">
                                            <span className="text-xs text-gray-600 font-medium">Duration</span>
                                            <p className="text-xl font-bold text-indigo-600 mt-1">{flight.duration}</p>
                                            <p className="text-xs text-gray-500">Non-stop</p>
                                        </div>

                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-2 mb-1">
                                                <Clock size={16} className="text-gray-600" />
                                                <span className="text-xs text-gray-600 font-medium">Arrival</span>
                                            </div>
                                            <p className="text-xl font-bold text-gray-800">{flight.arrival}</p>
                                            <p className="text-xs text-gray-500">{formatDate(flight.date)}</p>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center justify-between">
                                        <p className="text-xl font-semibold text-indigo-600">
                                            ₹{flight.price.toLocaleString()}
                                        </p>

                                        <button
                                            className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
                                        >
                                            Select Flight
                                        </button>
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
