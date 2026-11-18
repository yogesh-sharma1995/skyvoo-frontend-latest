import React, { useState, useEffect } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isSameMonth,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * CustomFlightCalendar
 * Reusable 2-month (or 1-month) flight check-in / check-out calendar.
 * Pure React + date-fns with zero third-party datepicker library glitches.
 */
export default function CustomFlightCalendar({
  selected,
  onSelect,
  disabled,
  minDate = startOfDay(new Date()),
  maxDate = new Date(new Date().getFullYear() + 2, 11, 31),
  numberOfMonths = 2,
  startDate = null,
  endDate = null,
  className = "",
}) {
  // Initialize currentMonth to selected date, or startDate, or minDate, or current date
  const [currentMonth, setCurrentMonth] = useState(() => {
    const initial = selected || startDate || minDate || new Date();
    return startOfMonth(initial);
  });

  // Sync currentMonth if selected or startDate changes to a different month
  useEffect(() => {
    const targetDate = selected || startDate;
    if (targetDate) {
      const targetMonth = startOfMonth(targetDate);
      // Check if targetMonth is already visible in the currently displayed months
      const isVisibleInCurrent = isSameMonth(currentMonth, targetMonth);
      const isVisibleInNext =
        numberOfMonths > 1 &&
        isSameMonth(addMonths(currentMonth, 1), targetMonth);

      if (!isVisibleInCurrent && !isVisibleInNext) {
        setCurrentMonth(targetMonth);
      }
    }
  }, [selected, startDate, numberOfMonths]);

  const month1 = currentMonth;
  const month2 = addMonths(currentMonth, 1);

  // Bounds checking for navigation
  const isPrevDisabled = minDate
    ? isSameMonth(currentMonth, minDate) ||
      isBefore(currentMonth, startOfMonth(minDate))
    : false;

  const lastVisibleMonth =
    numberOfMonths === 1 ? currentMonth : addMonths(currentMonth, numberOfMonths - 1);
  const isNextDisabled = maxDate
    ? isSameMonth(lastVisibleMonth, maxDate) ||
      isAfter(lastVisibleMonth, endOfMonth(maxDate))
    : false;

  const handlePrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isPrevDisabled) {
      setCurrentMonth((prev) => subMonths(prev, 1));
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isNextDisabled) {
      setCurrentMonth((prev) => addMonths(prev, 1));
    }
  };

  const isDayDisabled = (day) => {
    const dayStart = startOfDay(day);
    if (minDate && isBefore(dayStart, startOfDay(minDate))) return true;
    if (maxDate && isAfter(dayStart, endOfDay(maxDate))) return true;

    if (typeof disabled === "function") {
      return disabled(day);
    }
    if (disabled) {
      if (disabled.before && isBefore(dayStart, startOfDay(disabled.before))) {
        return true;
      }
      if (disabled.after && isAfter(dayStart, endOfDay(disabled.after))) {
        return true;
      }
    }
    return false;
  };

  const renderMonth = (monthDate, showNavControls = false) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const firstDayOfWeek = getDay(monthStart); // 0 = Sunday, 1 = Monday, etc.

    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    return (
      <div className="w-[270px] sm:w-[290px] flex-shrink-0 select-none">
        {/* Month Header */}
        <div className="flex items-center justify-between h-9 mb-3">
          <span className="font-bold text-gray-900 text-[15px] sm:text-[17px]">
            {format(monthDate, "MMMM yyyy")}
          </span>

          {showNavControls && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                disabled={isPrevDisabled}
                aria-label="Previous month"
                className={`p-1.5 rounded-full transition-colors ${
                  isPrevDisabled
                    ? "opacity-25 cursor-not-allowed text-gray-400"
                    : "text-gray-700 hover:bg-gray-100 hover:text-black cursor-pointer"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={isNextDisabled}
                aria-label="Next month"
                className={`p-1.5 rounded-full transition-colors ${
                  isNextDisabled
                    ? "opacity-25 cursor-not-allowed text-gray-400"
                    : "text-gray-700 hover:bg-gray-100 hover:text-black cursor-pointer"
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Weekday Names */}
        <div className="grid grid-cols-7 text-center mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-xs font-semibold text-gray-400 h-6 flex items-center justify-center"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-1 gap-x-1 text-center justify-items-center">
          {/* Leading empty cells */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="w-8 h-8 sm:w-9 sm:h-9" />
          ))}

          {/* Month Days */}
          {daysInMonth.map((day) => {
            const dayNum = format(day, "d");
            const isDisabled = isDayDisabled(day);
            const isSelected = selected ? isSameDay(day, selected) : false;
            const isDepart = startDate ? isSameDay(day, startDate) : false;
            const isReturn = endDate ? isSameDay(day, endDate) : false;

            // Determine if between startDate and endDate
            const isInRange =
              startDate &&
              endDate &&
              isAfter(startOfDay(day), startOfDay(startDate)) &&
              isBefore(startOfDay(day), startOfDay(endDate));

            let dayStyle =
              "text-gray-800 hover:bg-gray-100 cursor-pointer font-medium";

            if (isDisabled) {
              dayStyle = "text-gray-300 cursor-not-allowed pointer-events-none";
            } else if (isReturn) {
              // Return date: solid dark red
              dayStyle =
                "bg-[#78080B] text-white font-bold shadow-sm cursor-pointer";
            } else if (isDepart) {
              if (endDate) {
                // Depart date when return is also picked: outlined ring
                dayStyle =
                  "border-2 border-[#78080B] text-[#78080B] font-bold cursor-pointer";
              } else {
                // Depart date when only depart is picked: solid dark red
                dayStyle =
                  "bg-[#78080B] text-white font-bold shadow-sm cursor-pointer";
              }
            } else if (isSelected) {
              dayStyle =
                "bg-[#78080B] text-white font-bold shadow-sm cursor-pointer";
            } else if (isInRange) {
              dayStyle =
                "bg-red-50 text-[#78080B] font-medium hover:bg-red-100 cursor-pointer";
            }

            return (
              <button
                key={day.toISOString()}
                type="button"
                disabled={isDisabled}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isDisabled && onSelect) {
                    onSelect(day);
                  }
                }}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm transition-all select-none ${dayStyle}`}
              >
                {dayNum}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`bg-white p-4 sm:p-5 rounded-2xl shadow-xl border border-gray-100 select-none ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {numberOfMonths === 1 ? (
        renderMonth(month1, true)
      ) : (
        <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
          {renderMonth(month1, false)}
          {renderMonth(month2, true)}
        </div>
      )}
    </div>
  );
}
