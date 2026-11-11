import React, { useEffect, useRef } from 'react';
import Cheapest from '@/assets/vectors/Cheapest.svg'
import Nonstop from '@/assets/vectors/Nonstop.svg'
import Other from '@/assets/vectors/Other.svg'
import Preference from '@/assets/vectors/Preference.svg'

const sortOptions = [
    {
        key: "CHEAPEST",
        label: "CHEAPEST",
        info: "Lowest fare",
        icon: Cheapest,
    },
    {
        key: "NONSTOP",
        label: "NON STOP",
        info: "Your first choice",
        icon: Nonstop,
    },
    {
        key: "BEST",
        label: "BEST",
        info: "Best value",
        icon: Preference,
    },
    {
        key: "OTHER",
        label: "OTHER",
        info: "Sort",
        icon: Other,
    },
];

const otherOptions = [
    { label: "Discounted Price", value: "DISCOUNTANT" },
    { label: "Early Departure", value: "EARLY_DEPARTURE" },
    { label: "Late Departure", value: "LATE_DEPARTURE" },
    { label: "Early Arrival", value: "EARLY_ARRIVAL" },
    { label: "Late Arrival", value: "LATE_ARRIVAL" },
];

function SortingOptions({ selectedSorting, handleClick, showOtherMenu, handleOtherSelect, setShowOtherMenu }) {
    const otherMenuRef = useRef(null);

    useEffect(() => {
        if (!showOtherMenu) return;

        const handleOutsideClick = (event) => {
            if (otherMenuRef.current && !otherMenuRef.current.contains(event.target)) {
                if (typeof setShowOtherMenu === "function") {
                    setShowOtherMenu(false);
                }
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("touchstart", handleOutsideClick);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("touchstart", handleOutsideClick);
        };
    }, [showOtherMenu, setShowOtherMenu]);

    return (
        <div className="filterglasseffect rounded-lg shadow-sm px-4 py-3 mb-4 " style={{ overflow: 'visible', zIndex: 2 }}>
            <div className="grid grid-cols-4 md:grid-cols-4 gap-3">
                {sortOptions.map((option) => (
                    <div
                        key={option.key}
                        ref={option.key === "OTHER" ? otherMenuRef : null}
                        className="relative"
                    >
                        {/* Button */}
                        <button
                            className={`cursor-pointer px-2 py-1 sm:px-4 sm:py-2 rounded flex items-center justify-start w-full transition-all duration-200 ${selectedSorting === option.key ||
                                (option.key === "OTHER" && otherOptions.some((opt) => opt.value === selectedSorting))
                                ? "bg-white"
                                : "bg-gray-100"
                                }`}
                            style={{
                                boxShadow: "3px 1px 4px 0px rgba(0, 0, 0, 0.25)",
                            }}
                            onClick={() => handleClick(option.key)}
                        >
                            <div className="mr-[2px] xs:mr-2 sm:mr-4 border border-solid border-[#A8A8A8] bg-[#D9D9D9] p-1 rounded-md flex items-center justify-center">
                                <img
                                    src={option.icon}
                                    alt={option.label}
                                    className="w-2 h-2 xs:w-4 xs:h-4 sm:w-5 sm:h-5"
                                />
                            </div>
                            <div className="text-start leading-tight">
                                <div className="text-[6px] xs:text-[10px] sm:text-sm font-medium">
                                    {option.label}
                                </div>
                                <div className="text-[4px] xs:text-[7px] sm:text-xs text-gray-700">
                                    {option.info}
                                </div>
                            </div>

                        </button>

                        {/* Underline animation */}
                        <div
                            className={`absolute bottom-0 left-0 h-[3px] bg-[#78080B] rounded-full transition-all duration-1000 ease-out ${selectedSorting === option.key ||
                                (option.key === "OTHER" && otherOptions.some((opt) => opt.value === selectedSorting))
                                ? "w-full"
                                : "w-0"
                                }`}
                        >
                        </div>

                        {/* Dropdown under OTHER */}
                        {option.key === "OTHER" && showOtherMenu && (
                            <div
                                className="absolute left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 w-48 animate-fadeIn z-50"
                                style={{ boxShadow: "0px 2px 6px rgba(0,0,0,0.15)" }}
                            >
                                <ul className="py-2">
                                    {otherOptions.map((item) => (
                                        <li
                                            key={item.value}
                                            className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                                            onClick={() => handleOtherSelect(item.value)}
                                        >
                                            {item.label}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ))}
            </div>

        </div>
    )
}

export default SortingOptions;