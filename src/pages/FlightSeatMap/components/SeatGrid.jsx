import React, { useCallback } from 'react';
import SeatButton from './SeatButton';

function SeatGrid({ processedRows, seatLetters = ['A', 'B', 'C', 'D', 'E', 'F'], selectedSeats, onSeatClick, onSeatHover, onSeatLeave, getSeatVisual }) {
    const handleSeatClick = useCallback(
        (seat) => () => onSeatClick(seat),
        [onSeatClick]
    );

    const handleSeatHover = useCallback(
        (seat) => (e) => onSeatHover(seat, e),
        [onSeatHover]
    );

    // Split standard 6 letters into 3 left (A, B, C) and 3 right (D, E, F)
    const leftLetters = seatLetters.length <= 6
        ? seatLetters.slice(0, Math.ceil(seatLetters.length / 2))
        : seatLetters.slice(0, 3);
    const rightLetters = seatLetters.length <= 6
        ? seatLetters.slice(Math.ceil(seatLetters.length / 2))
        : seatLetters.slice(3);

    return (
        <div className="w-full flex flex-col items-center">
            <div className="bg-[#f8f9fa] rounded-2xl py-3.5 px-3 sm:px-6 border border-slate-200 w-full max-w-xl shadow-xs">
                {/* Airplane Nose Indicator */}
                <div className="flex flex-col items-center mb-3">
                    <div className="w-16 h-1.5 bg-slate-300 rounded-full mb-1"></div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Front of Aircraft
                    </span>
                </div>

                {/* Column Headers */}
                <div className="flex items-center justify-center gap-2 sm:gap-4 mb-2 pb-1.5 border-b border-slate-200/80">
                    {/* Row number spacer */}
                    <div className="w-8 text-center text-[10px] sm:text-xs font-bold text-slate-400">
                        Row
                    </div>

                    {/* Left seats headers */}
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                        {leftLetters.map((letter) => (
                            <div key={letter} className="w-8 sm:w-9 text-center text-xs font-bold text-slate-700">
                                {letter}
                            </div>
                        ))}
                    </div>

                    {/* Aisle Spacer */}
                    <div className="w-6 sm:w-8 text-center text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        Aisle
                    </div>

                    {/* Right seats headers */}
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                        {rightLetters.map((letter) => (
                            <div key={letter} className="w-8 sm:w-9 text-center text-xs font-bold text-slate-700">
                                {letter}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Seat Rows Container */}
                <div className="space-y-1.5 max-h-[48vh] sm:max-h-[52vh] overflow-y-auto px-1 py-1 custom-scrollbar">
                    {processedRows.map((row) => {
                        const rowSeatsMap = Object.fromEntries(row.seats.map((seat) => [seat.letter, seat]));

                        return (
                            <div
                                key={row.rowNumber}
                                className="flex items-center justify-center gap-2 sm:gap-4 py-0.5 hover:bg-slate-200/40 rounded-lg transition-colors"
                            >
                                {/* Row Number */}
                                <div className="w-8 text-center text-xs font-bold text-slate-500 shrink-0">
                                    {row.rowNumber}
                                </div>

                                {/* Left Seats (A, B, C) */}
                                <div className="flex items-center justify-center gap-1.5 sm:gap-2 shrink-0">
                                    {leftLetters.map((letter) => {
                                        const seat = rowSeatsMap[letter];
                                        return seat ? (
                                            <div key={seat.number} className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0">
                                                <SeatButton
                                                    seat={seat}
                                                    onClick={handleSeatClick(seat)}
                                                    onHover={handleSeatHover(seat)}
                                                    onLeave={onSeatLeave}
                                                    getSeatVisual={() => getSeatVisual(seat)}
                                                />
                                            </div>
                                        ) : (
                                            <div key={letter} className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-slate-100 shrink-0 opacity-40"></div>
                                        );
                                    })}
                                </div>

                                {/* Aisle Divider */}
                                <div className="w-6 sm:w-8 flex items-center justify-center shrink-0">
                                    <div className="h-6 w-0.5 border-r border-dashed border-slate-300"></div>
                                </div>

                                {/* Right Seats (D, E, F) */}
                                <div className="flex items-center justify-center gap-1.5 sm:gap-2 shrink-0">
                                    {rightLetters.map((letter) => {
                                        const seat = rowSeatsMap[letter];
                                        return seat ? (
                                            <div key={seat.number} className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0">
                                                <SeatButton
                                                    seat={seat}
                                                    onClick={handleSeatClick(seat)}
                                                    onHover={handleSeatHover(seat)}
                                                    onLeave={onSeatLeave}
                                                    getSeatVisual={() => getSeatVisual(seat)}
                                                />
                                            </div>
                                        ) : (
                                            <div key={letter} className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-slate-100 shrink-0 opacity-40"></div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default SeatGrid;