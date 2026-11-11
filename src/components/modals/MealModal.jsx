import React, { useState } from "react";
import { Utensils, Plane, Check } from "lucide-react";

export default function MealModal({
  onClose,
  segments = [],
  mealList = [],
  routeLabel = "",
  travellerInfo = null,
  initialSelectedMeals = [],
  onSave,
}) {
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

  // Normalize segments: if segments array is provided with per-segment mealList, use it;
  // otherwise build from mealList array
  const normalizedSegments = React.useMemo(() => {
    if (Array.isArray(segments) && segments.length > 0) {
      return segments.map((seg, sIdx) => {
        const rawMeals = seg.mealList || seg.MealList || seg.MealDynamic || seg.MealDetails || [];
        const dep = seg.AirlineDeparture?.code || seg.AirlineDeparture?.city || seg.depCode || "";
        const arr = seg.AirlineArrival?.code || seg.AirlineArrival?.city || seg.arrCode || "";
        const sectorLabel = seg.sectorLabel || (dep && arr ? `${dep} → ${arr}` : `Segment ${sIdx + 1}`);
        const sectorKey = seg.Sector || (dep && arr ? `${dep}-${arr}`.toUpperCase() : "");

        const flatMeals = (Array.isArray(rawMeals) ? rawMeals : []).flatMap((elem) => {
          if (!elem) return [];
          if (Array.isArray(elem)) return elem;
          if (elem.MealList && Array.isArray(elem.MealList)) return elem.MealList;
          if (elem.MealDynamic && Array.isArray(elem.MealDynamic)) return elem.MealDynamic;
          if (elem.MealDetails && Array.isArray(elem.MealDetails)) return elem.MealDetails;
          if (elem.Meals && Array.isArray(elem.Meals)) return elem.Meals;
          return [elem];
        });

        const items = flatMeals.map((item) => {
          const desc = item.Description || item.Desc || item.name || item.Title || item.Text || item.Code || "Meal Option";
          const amt = item.Amount ?? item.amount ?? item.Price ?? item.price ?? item.TotalAmount ?? 0;
          return {
            ...item,
            Description: desc,
            Amount: amt,
            segmentIndex: sIdx,
            SegmentId: item.SegmentId ?? item.segmentId ?? seg.FlightId ?? seg.SegmentId ?? sIdx,
            FlightId: item.FlightId ?? item.flightId ?? seg.FlightId ?? seg.SegmentId ?? sIdx,
            Sector: sectorKey,
            sectorLabel,
            TripType: seg.tripIndex ?? 0,
          };
        });

        return {
          segmentIndex: sIdx,
          tripIndex: seg.tripIndex ?? 0,
          FlightId: seg.FlightId,
          sectorLabel,
          sectorKey,
          items,
        };
      });
    }

    // Fallback if flat mealList is passed
    const apiItems = (mealList || []).flatMap((seg, sIdx) => {
      const list = seg.MealList ?? seg.MealDynamic ?? seg.MealDetails ?? seg.Meals ?? (Array.isArray(seg) ? seg : [seg]);
      const segId = seg.SegmentId ?? seg.segmentId ?? seg.FlightId ?? seg.flightId ?? seg.Key ?? sIdx;
      return list.map((item) => {
        const desc = item.Description || item.Desc || item.name || item.Title || item.Text || item.Code || "Meal Option";
        const amt = item.Amount ?? item.amount ?? item.Price ?? item.price ?? item.TotalAmount ?? 0;
        return {
          ...item,
          Description: desc,
          Amount: amt,
          segmentIndex: sIdx,
          SegmentId: item.SegmentId ?? item.segmentId ?? segId,
          Sector: item.Sector || seg.Sector || "",
          sectorLabel: item.Sector ? item.Sector.replace('-', ' → ') : routeLabel || `Flight ${sIdx + 1}`,
          TripType: item.TripType ?? seg.TripType ?? 0,
        };
      });
    });

    if (apiItems.length > 0) {
      // Group by segmentIndex or sector
      const grouped = {};
      apiItems.forEach((item) => {
        const grpKey = item.segmentIndex ?? 0;
        if (!grouped[grpKey]) {
          grouped[grpKey] = {
            segmentIndex: grpKey,
            tripIndex: item.TripType ?? 0,
            sectorLabel: item.sectorLabel || routeLabel || `Flight ${grpKey + 1}`,
            sectorKey: item.Sector || "",
            items: [],
          };
        }
        grouped[grpKey].items.push(item);
      });
      return Object.values(grouped);
    }

    return [{
      segmentIndex: 0,
      tripIndex: 0,
      sectorLabel: routeLabel || "Flight Journey",
      sectorKey: "",
      items: [],
    }];
  }, [segments, mealList, routeLabel]);

  const [activeSegIdx, setActiveSegIdx] = useState(0);
  const [selectedItems, setSelectedItems] = useState(initialSelectedMeals || []);

  const getItemId = (item) => item.SSRKey || item.Code || item.Description || item.Desc || JSON.stringify(item);

  // Check if a specific meal is selected for a specific segment
  const isItemSelected = (item, segIdx) => {
    const id = getItemId(item);
    return selectedItems.some(
      (s) => (s.segmentIndex !== undefined ? Number(s.segmentIndex) : 0) === segIdx && getItemId(s) === id
    );
  };

  // Toggle meal for a specific segment: allows 1 meal per segment
  const toggleItemForSegment = (item, segIdx, segMeta) => {
    const id = getItemId(item);
    const isAlready = isItemSelected(item, segIdx);

    if (isAlready) {
      // Deselect for this segment
      setSelectedItems((prev) =>
        prev.filter((s) => !((s.segmentIndex !== undefined ? Number(s.segmentIndex) : 0) === segIdx && getItemId(s) === id))
      );
    } else {
      // Replace any existing meal selection on this segment with the new one
      const enrichedItem = {
        ...item,
        segmentIndex: segIdx,
        SegmentId: item.SegmentId ?? item.FlightId ?? segMeta?.FlightId ?? segMeta?.items?.[0]?.SegmentId ?? segIdx,
        FlightId: item.FlightId ?? item.SegmentId ?? segMeta?.FlightId ?? segMeta?.items?.[0]?.FlightId ?? segIdx,
        Sector: item.Sector || segMeta.sectorKey || "",
        sectorLabel: segMeta.sectorLabel || "",
        TripType: item.TripType ?? segMeta.tripIndex ?? 0,
      };

      setSelectedItems((prev) => [
        ...prev.filter((s) => (s.segmentIndex !== undefined ? Number(s.segmentIndex) : 0) !== segIdx),
        enrichedItem,
      ]);
    }
  };

  const totalTravellerCost = selectedItems.reduce(
    (sum, item) => sum + (Number(item.Amount) || 0),
    0
  );

  const travellerDisplayName = travellerInfo
    ? [travellerInfo.firstName, travellerInfo.lastName].filter(Boolean).join(" ") ||
      travellerInfo.label
    : "Traveller";

  const handleSave = () => {
    if (onSave) {
      onSave(selectedItems);
    }
    onClose();
  };

  const currentSegment = normalizedSegments[activeSegIdx] || normalizedSegments[0];
  const currentSegItems = currentSegment?.items || [];

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center px-2 sm:px-4"
      onClick={onClose}
    >
      <div
        className="p-6 sm:p-8 bg-white shadow-xl w-full sm:max-w-lg lg:max-w-xl rounded-2xl max-h-[90vh] flex flex-col animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-orange-600" />
              <span>Add In-flight Meals</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Selection for: <span className="text-[#78080B] font-semibold">{travellerDisplayName}</span>
            </p>
          </div>
          <button
            className="text-gray-400 hover:text-black text-xl font-bold p-1 cursor-pointer"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Flight Segment Tabs (When multiple segments exist, e.g. connecting or round-trip) */}
        {normalizedSegments.length > 1 && (
          <div className="mt-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Select Flight Segment:
            </p>
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
              {normalizedSegments.map((seg, sIdx) => {
                const isSelectedTab = activeSegIdx === sIdx;
                const segSelectedMeal = selectedItems.find(
                  (s) => (s.segmentIndex !== undefined ? Number(s.segmentIndex) : 0) === sIdx
                );
                return (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => setActiveSegIdx(sIdx)}
                    className={`cursor-pointer px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition border ${
                      isSelectedTab
                        ? "bg-[#78080B] text-white border-[#78080B] shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Plane className={`w-3.5 h-3.5 ${isSelectedTab ? "text-white rotate-45" : "text-slate-400 rotate-45"}`} />
                    <span>{seg.sectorLabel}</span>
                    {segSelectedMeal && (
                      <span className={`w-2 h-2 rounded-full ${isSelectedTab ? "bg-emerald-300" : "bg-emerald-500"}`} title="Meal Selected" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Single Segment Route Info Banner (If only 1 segment) */}
        {normalizedSegments.length === 1 && currentSegment?.sectorLabel && (
          <div className="bg-orange-50 border border-orange-200 text-orange-950 p-3 rounded-xl mt-3 flex items-center gap-3">
            <Plane size={18} className="text-orange-700 shrink-0 rotate-45" />
            <div>
              <div className="font-bold text-xs sm:text-sm">
                {currentSegment.sectorLabel}
              </div>
              <div className="text-[11px] text-orange-800">
                Choose 1 meal option for this flight
              </div>
            </div>
          </div>
        )}

        {/* Options for Active Segment */}
        <div className="flex-1 overflow-y-auto pb-2 space-y-2.5 mt-3 p-1">
          {currentSegItems.length > 0 ? (
            currentSegItems.map((item) => {
              const selected = isItemSelected(item, activeSegIdx);
              return (
                <MealOption
                  key={getItemId(item)}
                  item={item}
                  isSelected={selected}
                  onToggle={() => toggleItemForSegment(item, activeSegIdx, currentSegment)}
                />
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No meal options available for this flight segment.
            </div>
          )}
        </div>

        {/* Footer Summary & Save CTA */}
        <div className="border-t pt-4 mt-3 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500 font-medium">
              {selectedItems.length} {selectedItems.length === 1 ? "meal" : "meals"} selected
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-900">
              Total: ₹ {totalTravellerCost.toLocaleString("en-IN")}
            </div>
          </div>

          <button
            onClick={handleSave}
            className="bg-[#78080B] hover:bg-[#5c0608] text-white font-semibold text-sm px-6 py-2.5 rounded-lg shadow-sm transition cursor-pointer"
          >
            Apply Meals
          </button>
        </div>
      </div>
    </div>
  );
}

function MealOption({ item, isSelected, onToggle }) {
  const displayName = item.Description || item.Desc || item.name || item.Title || item.Text || item.Code || "Meal Option";
  const numAmount = Number(item.Amount ?? item.amount ?? item.Price ?? item.price ?? item.TotalAmount ?? 0);

  return (
    <div
      onClick={onToggle}
      className={`cursor-pointer flex items-center justify-between gap-3 p-3 sm:p-3.5 border rounded-xl transition ${
        isSelected
          ? "border-[#78080B] bg-red-50/40 ring-1 ring-[#78080B]"
          : "border-slate-200 hover:border-slate-300 bg-white"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Utensils
          size={18}
          className={isSelected ? "text-[#78080B] shrink-0" : "text-slate-400 shrink-0"}
        />
        <span className="text-xs sm:text-sm font-semibold text-slate-800 capitalize truncate">
          {displayName.toLowerCase()}
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="font-bold text-xs sm:text-sm text-slate-900 whitespace-nowrap">
          ₹ {numAmount.toLocaleString("en-IN")}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer ${
            isSelected
              ? "bg-[#78080B] text-white shadow-sm"
              : "border border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
        >
          {isSelected ? (
            <>
              <Check size={14} /> Added
            </>
          ) : (
            "Add"
          )}
        </button>
      </div>
    </div>
  );
}
