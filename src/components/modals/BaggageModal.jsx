import React, { useState } from "react";
import { Briefcase, Plane, Check } from "lucide-react";

export default function BaggageModal({
  onClose,
  trips = [],
  baggageList = [],
  routeLabel = "",
  travellerInfo = null,
  initialSelectedBaggage = [],
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

  // Normalize trips: if trips array is provided (Departure trip vs Return trip), use it;
  // otherwise fallback from baggageList
  const normalizedTrips = React.useMemo(() => {
    if (Array.isArray(trips) && trips.length > 0) {
      return trips.map((tr, tIdx) => {
        const rawList = tr.baggageList || tr.BaggageList || [];
        const title = tr.title || (trips.length > 1 ? (tIdx === 0 ? "Departure Flight" : (tIdx === 1 ? "Return Flight" : `Trip ${tIdx + 1}`)) : "Flight Journey");
        const route = tr.route || routeLabel || "";
        const sectorKey = tr.sectorKey || (route ? route.replace(/\s+/g, '').replace('→', '-') : "");

        const flatItems = (Array.isArray(rawList) ? rawList : []).flatMap((elem) => {
          if (!elem) return [];
          if (Array.isArray(elem)) return elem;
          if (elem.BaggageList && Array.isArray(elem.BaggageList)) return elem.BaggageList;
          if (elem.BaggageDetails && Array.isArray(elem.BaggageDetails)) return elem.BaggageDetails;
          if (elem.BaggageDynamic && Array.isArray(elem.BaggageDynamic)) return elem.BaggageDynamic;
          if (elem.Baggage && Array.isArray(elem.Baggage)) return elem.Baggage;
          return [elem];
        });

        const items = flatItems.map((item) => {
          const desc = item.Description || item.Desc || item.name || item.Title || item.Text || (item.Weight ? (typeof item.Weight === 'number' ? `Additional ${item.Weight} KG` : item.Weight) : "") || item.Code || "Extra Baggage";
          const amt = item.Amount ?? item.amount ?? item.Price ?? item.price ?? item.TotalAmount ?? item.Fare ?? item.Cost ?? 0;
          const fId = item.FlightId || item.SegmentId || tr.flightId || tr.FlightId;
          return {
            ...item,
            Description: desc,
            Amount: amt,
            tripIndex: tIdx,
            TripType: tIdx,
            FlightId: fId,
            SegmentId: fId,
            Sector: sectorKey || item.Sector || "",
            sectorLabel: route || title,
          };
        });

        return {
          tripIndex: tIdx,
          title,
          route,
          sectorKey,
          flightId: tr.flightId || tr.FlightId,
          items,
        };
      });
    }

    // Fallback if flat baggageList is passed
    const apiItems = (baggageList || []).flatMap((seg, sIdx) => {
      const list = seg.BaggageList ?? seg.BaggageDetails ?? seg.BaggageDynamic ?? seg.Baggage ?? (Array.isArray(seg) ? seg : [seg]);
      const segId = seg.SegmentId ?? seg.segmentId ?? seg.FlightId ?? seg.flightId ?? seg.Key ?? sIdx;
      return list.map((item) => {
        const desc = item.Description || item.Desc || item.name || item.Title || item.Text || (item.Weight ? (typeof item.Weight === 'number' ? `Additional ${item.Weight} KG` : item.Weight) : "") || item.Code || "Extra Baggage";
        const amt = item.Amount ?? item.amount ?? item.Price ?? item.price ?? item.TotalAmount ?? item.Fare ?? item.Cost ?? 0;
        return {
          ...item,
          Description: desc,
          Amount: amt,
          tripIndex: item.TripType ?? seg.TripType ?? sIdx,
          TripType: item.TripType ?? seg.TripType ?? sIdx,
          SegmentId: item.SegmentId ?? item.segmentId ?? segId,
          Sector: item.Sector || seg.Sector || "",
          sectorLabel: routeLabel || `Trip ${sIdx + 1}`,
        };
      });
    });

    if (apiItems.length > 0) {
      const grouped = {};
      apiItems.forEach((item) => {
        const grpKey = item.tripIndex ?? 0;
        if (!grouped[grpKey]) {
          grouped[grpKey] = {
            tripIndex: grpKey,
            title: grpKey === 0 ? "Departure Flight" : (grpKey === 1 ? "Return Flight" : `Trip ${grpKey + 1}`),
            route: routeLabel || "",
            sectorKey: item.Sector || "",
            items: [],
          };
        }
        grouped[grpKey].items.push(item);
      });
      return Object.values(grouped);
    }

    return [{
      tripIndex: 0,
      title: "Flight Journey",
      route: routeLabel || "",
      sectorKey: "",
      items: [],
    }];
  }, [trips, baggageList, routeLabel]);

  const [activeTripIdx, setActiveTripIdx] = useState(0);
  const [selectedItems, setSelectedItems] = useState(initialSelectedBaggage || []);

  const getItemId = (item) => item.SSRKey || item.Code || item.Description || item.Desc || (item.Weight ? String(item.Weight) : '') || JSON.stringify(item);

  // Check if baggage is selected for a specific trip
  const isItemSelected = (item, tripIdx) => {
    const id = getItemId(item);
    return selectedItems.some(
      (s) => (s.tripIndex !== undefined ? Number(s.tripIndex) : 0) === tripIdx && getItemId(s) === id
    );
  };

  // Toggle baggage: allows 1 extra baggage option per trip (Departure trip vs Return trip)
  const toggleItemForTrip = (item, tripIdx, tripMeta) => {
    const id = getItemId(item);
    const isAlready = isItemSelected(item, tripIdx);

    if (isAlready) {
      // Deselect for this trip
      setSelectedItems((prev) =>
        prev.filter((s) => !((s.tripIndex !== undefined ? Number(s.tripIndex) : 0) === tripIdx && getItemId(s) === id))
      );
    } else {
      // Replace existing baggage for this trip (connecting flights share the same departure baggage)
      const enrichedItem = {
        ...item,
        tripIndex: tripIdx,
        TripType: tripIdx,
        FlightId: item.FlightId || item.SegmentId || tripMeta?.flightId || tripMeta?.FlightId,
        SegmentId: item.SegmentId || item.FlightId || tripMeta?.flightId || tripMeta?.FlightId,
        Sector: item.Sector || tripMeta.sectorKey || "",
        sectorLabel: tripMeta.route || tripMeta.title || "",
      };

      setSelectedItems((prev) => [
        ...prev.filter((s) => (s.tripIndex !== undefined ? Number(s.tripIndex) : 0) !== tripIdx),
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

  const currentTrip = normalizedTrips[activeTripIdx] || normalizedTrips[0];
  const currentTripItems = currentTrip?.items || [];

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
              <Briefcase className="w-5 h-5 text-[#78080B]" />
              <span>Add Extra Baggage</span>
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

        {/* Trip Tabs (When multiple trips exist, e.g. Departure vs Return) */}
        {normalizedTrips.length > 1 && (
          <div className="mt-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Select Journey:
            </p>
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
              {normalizedTrips.map((tr, tIdx) => {
                const isSelectedTab = activeTripIdx === tIdx;
                const tripSelectedBaggage = selectedItems.find(
                  (s) => (s.tripIndex !== undefined ? Number(s.tripIndex) : 0) === tIdx
                );
                return (
                  <button
                    key={tIdx}
                    type="button"
                    onClick={() => setActiveTripIdx(tIdx)}
                    className={`cursor-pointer px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition border ${isSelectedTab
                        ? "bg-[#78080B] text-white border-[#78080B] shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                  >
                    <Plane className={`w-3.5 h-3.5 ${isSelectedTab ? "text-white rotate-45" : "text-slate-400 rotate-45"}`} />
                    <span>{tr.title} {tr.route ? `(${tr.route})` : ''}</span>
                    {tripSelectedBaggage && (
                      <span className={`w-2 h-2 rounded-full ${isSelectedTab ? "bg-emerald-300" : "bg-emerald-500"}`} title="Baggage Selected" />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 italic">
              *Connecting flights in the same journey share the selected baggage allowance.
            </p>
          </div>
        )}

        {/* Single Journey Info Banner (If only 1 trip) */}
        {normalizedTrips.length === 1 && currentTrip?.route && (
          <div className="bg-blue-50 border border-blue-200 text-blue-950 p-3 rounded-xl mt-3 flex items-center gap-3">
            <Plane size={18} className="text-blue-700 shrink-0 rotate-45" />
            <div>
              <div className="font-bold text-xs sm:text-sm">
                {currentTrip.route}
              </div>
              {/* <div className="text-[11px] text-blue-700">
                Connecting flights share the selected baggage allowance
              </div> */}
            </div>
          </div>
        )}

        {/* Options for Active Trip */}
        <div className="flex-1 overflow-y-auto pb-2 space-y-2.5 mt-3 p-1">
          {currentTripItems.length > 0 ? (
            currentTripItems.map((item) => {
              const selected = isItemSelected(item, activeTripIdx);
              return (
                <BaggageOption
                  key={getItemId(item)}
                  item={item}
                  isSelected={selected}
                  onToggle={() => toggleItemForTrip(item, activeTripIdx, currentTrip)}
                />
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No extra baggage options available for this journey.
            </div>
          )}
        </div>

        {/* Footer Summary & Save CTA */}
        <div className="border-t pt-4 mt-3 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500 font-medium">
              {selectedItems.length} {selectedItems.length === 1 ? "option" : "options"} selected
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-900">
              Total: ₹ {totalTravellerCost.toLocaleString("en-IN")}
            </div>
          </div>

          <button
            onClick={handleSave}
            className="bg-[#78080B] hover:bg-[#5c0608] text-white font-semibold text-sm px-6 py-2.5 rounded-lg shadow-sm transition cursor-pointer"
          >
            Apply Baggage
          </button>
        </div>
      </div>
    </div>
  );
}

function BaggageOption({ item, isSelected, onToggle }) {
  const displayName = item.Description || item.Desc || item.Title || item.name || item.Text || (item.Weight ? (typeof item.Weight === 'number' ? `Additional ${item.Weight} KG` : item.Weight) : "") || item.Code || "Extra Baggage";
  const numAmount = Number(item.Amount ?? item.amount ?? item.Price ?? item.price ?? item.TotalAmount ?? 0);

  return (
    <div
      onClick={onToggle}
      className={`cursor-pointer flex items-center justify-between gap-3 p-3 sm:p-3.5 border rounded-xl transition ${isSelected
          ? "border-[#78080B] bg-red-50/40 ring-1 ring-[#78080B]"
          : "border-slate-200 hover:border-slate-300 bg-white"
        }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Briefcase
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
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer ${isSelected
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
