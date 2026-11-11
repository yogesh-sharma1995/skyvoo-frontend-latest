import React from "react";
import { Plus, LogOut, Check } from "lucide-react";
import FlightSeatIcon from "./FlightSeatIcon";

function SeatButton({ seat, onClick, onHover, onLeave, getSeatVisual }) {
    const visual = getSeatVisual(seat);
    const isSelected = Boolean(visual.isSelected);

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!seat.isAvailable && !isSelected}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            onTouchStart={onHover}
            onTouchEnd={onLeave}
            className={`relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-md transition-transform duration-150 ease-in-out hover:scale-105 select-none ${
                !seat.isAvailable && !isSelected
                    ? "opacity-40 cursor-not-allowed"
                    : "cursor-pointer"
            }`}
        >
            {/* SVG seat */}
            <FlightSeatIcon
                className="absolute inset-0 w-full h-full pointer-events-none"
                fill={visual.fill}
                stroke={visual.stroke}
            />

            {/* Seat number */}
            <span className={`relative z-10 font-bold text-[10px] pointer-events-none leading-none ${visual.text}`}>
                {`${seat.rowNumber}${seat.letter}`}
            </span>

            {/* Selected Tick */}
            {isSelected && (
                <div className="absolute -top-1 -right-1 z-20 w-3.5 h-3.5 bg-[#78080B] text-white rounded-full flex items-center justify-center shadow-xs pointer-events-none">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
            )}

            {/* Indicators */}
            {!isSelected && seat.isExtraLegroom && (
                <Plus className="absolute -top-1 -right-1 w-3.5 h-3.5 text-white bg-indigo-700 rounded-full p-[1px] pointer-events-none" />
            )}
            {!isSelected && seat.isExitRow && (
                <LogOut className="absolute -top-1 -right-1 w-3.5 h-3.5 text-white bg-indigo-700 rounded-full p-[1px] pointer-events-none" />
            )}
        </button>
    );
}

export default SeatButton;
