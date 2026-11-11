import React, { useState, useEffect, useRef } from "react";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { Calendar as CalendarIcon } from "lucide-react";

/**
 * CustomDatePicker
 * - Allows numeric keyboard typing only (no letters or special characters).
 * - Automatically inserts '/' after entering 2 digits for day and 2 digits for month (DD/MM/YYYY).
 * - Opens Ant Design calendar popup on clicking the calendar icon or input.
 * - Emits YYYY-MM-DD string to onChange on valid date, or "" when empty / invalid.
 */
export default function CustomDatePicker({
  value, // "YYYY-MM-DD" or dayjs or ""
  onChange,
  placeholder = "DD/MM/YYYY",
  hasError = false,
  className = "",
  disabled = false,
  disabledDate,
}) {
  const [textValue, setTextValue] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef(null);

  // Sync internal text state with external value prop
  useEffect(() => {
    if (value && value !== "INVALID") {
      const d = dayjs(value, "YYYY-MM-DD");
      if (d.isValid()) {
        setTextValue(d.format("DD/MM/YYYY"));
        return;
      }
    }
    if (!value) {
      setTextValue("");
    }
  }, [value]);

  const handleInputChange = (e) => {
    const inputVal = e.target.value;
    // Extract only numbers (strip non-digits)
    const digits = inputVal.replace(/\D/g, "").slice(0, 8);

    let formatted = "";
    if (digits.length > 0) {
      if (digits.length <= 2) {
        formatted = digits;
        // Auto append slash when user is typing forward
        if (digits.length === 2 && inputVal.length > textValue.length) {
          formatted = digits + "/";
        }
      } else if (digits.length <= 4) {
        formatted = digits.slice(0, 2) + "/" + digits.slice(2);
        if (digits.length === 4 && inputVal.length > textValue.length) {
          formatted = formatted + "/";
        }
      } else {
        formatted =
          digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4, 8);
      }
    }

    setTextValue(formatted);

    // If fully entered 8 digits, validate and pass YYYY-MM-DD to onChange
    if (digits.length === 8) {
      const dd = digits.slice(0, 2);
      const mm = digits.slice(2, 4);
      const yyyy = digits.slice(4, 8);

      const d = dayjs(`${yyyy}-${mm}-${dd}`, "YYYY-MM-DD", true);
      if (d.isValid()) {
        onChange?.(d.format("YYYY-MM-DD"));
      } else {
        onChange?.("INVALID");
      }
    } else if (digits.length === 0) {
      onChange?.("");
    }
  };

  const handlePickerChange = (date) => {
    if (date && date.isValid()) {
      const formattedIso = date.format("YYYY-MM-DD");
      setTextValue(date.format("DD/MM/YYYY"));
      onChange?.(formattedIso);
    } else {
      setTextValue("");
      onChange?.("");
    }
    setPickerOpen(false);
  };

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        disabled={disabled}
        placeholder={placeholder}
        maxLength={10}
        value={textValue}
        onChange={handleInputChange}
        className={`w-full text-sm h-[38px] rounded border px-3 pr-9 outline-none transition bg-white ${
          hasError
            ? "border-red-500 bg-red-50/20"
            : "border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        } ${disabled ? "bg-slate-100 cursor-not-allowed" : ""}`}
      />

      {/* Calendar Icon & Hidden DatePicker popup trigger */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 cursor-pointer text-slate-400 hover:text-slate-600">
        <DatePicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          disabledDate={disabledDate}
          value={value && value !== "INVALID" ? dayjs(value, "YYYY-MM-DD") : null}
          onChange={handlePickerChange}
          format="DD/MM/YYYY"
          allowClear={false}
          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer pointer-events-auto"
          style={{ width: "100%", height: "100%" }}
        />
        <CalendarIcon className="w-4 h-4 pointer-events-none" />
      </div>
    </div>
  );
}
