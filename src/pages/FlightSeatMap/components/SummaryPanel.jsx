import React from 'react';
import { Check, X } from 'lucide-react';

function SummaryPanel({
    paxList = [],
    paxSeatMap = [],
    activePaxIndex = 0,
    onSelectPax,
    seatMap = {},
    SSRTypes = {},
    selectedServices = [],
    onRemoveSeat,
    onRemoveService,
    totalAmount = 0,
    onContinue,
    onProceedWithoutSeat,
    hasSeatsAvailable = true,
}) {
    return (
        <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200 shadow-xs">
            {/* Table Header */}
            <div className="grid grid-cols-12 text-[10px] uppercase tracking-wider font-bold text-slate-400 pb-1.5 border-b border-slate-200">
                <div className="col-span-5 text-left">Passenger</div>
                <div className="col-span-3 text-center">Seat</div>
                <div className="col-span-4 text-right">Fee</div>
            </div>

            {/* Passenger Rows */}
            <div className="py-1 space-y-1">
                {paxList.map((pax, pIdx) => {
                    const seatNumber = paxSeatMap[pIdx];
                    const seat = seatNumber ? seatMap[seatNumber] : null;
                    const price = seat?.price || 0;
                    const isActive = pIdx === activePaxIndex;

                    return (
                        <div
                            key={pax.id || pIdx}
                            onClick={() => onSelectPax && onSelectPax(pIdx)}
                            className={`grid grid-cols-12 items-center py-1.5 px-2 rounded-md cursor-pointer transition-all ${
                                isActive
                                    ? "bg-amber-50/70 border-l-3 border-l-[#78080B] border border-amber-200 shadow-xs"
                                    : "hover:bg-slate-50 border border-transparent"
                            }`}
                        >
                            {/* Passenger Label */}
                            <div className="col-span-5 flex flex-col justify-center min-w-0 pr-1">
                                <span className={`text-[11px] sm:text-xs truncate leading-tight ${isActive ? "font-bold text-[#78080B]" : "font-semibold text-slate-800"}`}>
                                    {pax.label}
                                </span>
                                {pax.name && pax.name !== pax.label && (
                                    <span className="text-[9px] text-slate-400 font-normal truncate mt-0.5">
                                        {pax.name}
                                    </span>
                                )}
                            </div>

                            {/* Seat Column */}
                            <div className="col-span-3 text-center">
                                {seatNumber ? (
                                    <span className="inline-flex items-center gap-0.5 bg-white font-bold text-[11px] text-[#78080B] px-1.5 py-0.5 rounded border border-red-200 shadow-xs">
                                        {seatNumber}
                                        {onRemoveSeat && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRemoveSeat(seatNumber, pIdx);
                                                }}
                                                className="text-slate-400 hover:text-red-600 p-0.5 transition-colors cursor-pointer"
                                                title="Remove seat"
                                            >
                                                <X className="w-2.5 h-2.5" />
                                            </button>
                                        )}
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-slate-400 italic">
                                        {isActive ? "Select seat" : "—"}
                                    </span>
                                )}
                            </div>

                            {/* Fee Column */}
                            <div className="col-span-4 text-right">
                                {seatNumber ? (
                                    <span className="text-[11px] sm:text-xs font-bold text-slate-800">
                                        ₹{price.toLocaleString("en-IN")}
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-slate-400 font-normal">—</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Additional Services if any */}
            {selectedServices.length > 0 && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-200">
                    <p className="text-[10px] font-semibold text-slate-700 mb-1">Additional Services</p>
                    <ul className="space-y-1">
                        {selectedServices.map((service) => (
                            <li
                                key={service.code}
                                className="flex justify-between items-center text-[10px] p-1 rounded bg-slate-50 border border-slate-100"
                            >
                                <span className="font-medium text-slate-700">{service.name}</span>
                                <div className="flex items-center gap-1">
                                    <span className="font-semibold text-slate-800">{service.price}</span>
                                    {onRemoveService && (
                                        <button
                                            type="button"
                                            onClick={() => onRemoveService(service.code)}
                                            className="text-slate-400 hover:text-red-600"
                                        >
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Total Amount */}
            <div className="border-t border-slate-200 pt-1.5 mt-1.5 flex justify-between items-center">
                <span className="text-[11px] font-medium text-slate-600">Total</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                    ₹{Number(totalAmount || 0).toLocaleString("en-IN")}
                </span>
            </div>

            {/* Primary Action Button */}
            <button
                type="button"
                onClick={onContinue}
                className="w-full mt-2 bg-[#78080B] hover:bg-[#5f0608] active:bg-[#4a0506] text-white py-1.5 px-3 rounded-lg font-semibold text-xs shadow-2xs transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
            >
                <Check className="w-3 h-3" />
                Proceed
            </button>

            {/* Proceed Without Seat link */}
            {onProceedWithoutSeat && (
                <div className="text-center mt-1.5">
                    <button
                        type="button"
                        onClick={onProceedWithoutSeat}
                        className="text-[10px] text-slate-500 hover:text-[#78080B] hover:underline font-medium transition-colors cursor-pointer"
                    >
                        Proceed Without Seat
                    </button>
                </div>
            )}
        </div>
    );
}

export default SummaryPanel;