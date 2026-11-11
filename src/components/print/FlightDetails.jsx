import { Clock, Plane } from 'lucide-react';
import { getAirlineLogo } from '@/utils/airlineCode';
import { parseDateTime } from './mapBookingToTicket';

// Custom Suitcase SVG (Check-in baggage)
const CheckInBaggageIcon = ({ className = 'w-3.5 h-3.5 text-slate-500' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M8 2h8a2 2 0 0 1 2 2v2h2a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3h-1v1a1 1 0 0 1-2 0v-1H8v1a1 1 0 0 1-2 0v-1H5a3 3 0 0 1-3-3V8a2 2 0 0 1 2-2h2V4a2 2 0 0 1 2-2zm0 4h8V4H8v2zm-2 4v8h2v-8H6zm5 0v8h2v-8h-2zm5 0v8h2v-8h-2z" />
  </svg>
);

// Custom Duffel/Handbag SVG (Cabin baggage)
const CabinBaggageIcon = ({ className = 'w-3.5 h-3.5 text-slate-500' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M9 3h6a2 2 0 0 1 2 2v2h3a2 2 0 0 1 2 2v8a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2zm0 4h6V5H9v2zm-2 5a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-1-1zm10 0a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-1-1z" />
  </svg>
);

const getDisplayCode = (point) => {
  if (!point) return '—';
  const c = point.code;
  if (c && c !== '—' && String(c).trim() !== '') return String(c).trim();
  const city = point.city;
  if (city && city !== '—' && String(city).trim() !== '') return String(city).trim();
  const airport = point.airport;
  if (airport && airport !== '—' && String(airport).trim() !== '') return String(airport).trim();
  return '—';
};

const getDisplayCity = (point) => {
  if (!point) return '';
  const mainCode = getDisplayCode(point);
  const airport = point.airport && point.airport !== '—' ? String(point.airport).trim() : '';
  const city = point.city && point.city !== '—' ? String(point.city).trim() : '';
  if (airport && airport !== mainCode) return airport;
  if (city && city !== mainCode) return city;
  return '';
};

const LayoverDivider = ({ prevSeg, nextSeg }) => {
  let layoverText = 'Connecting Flight / Layover';
  if (nextSeg?.cT && !isNaN(Number(nextSeg.cT)) && Number(nextSeg.cT) > 0) {
    const mins = Number(nextSeg.cT);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    layoverText = hrs > 0 && remMins > 0 ? `${hrs}h ${remMins}m Layover` : (hrs > 0 ? `${hrs}h Layover` : `${remMins}m Layover`);
  } else if (prevSeg?.rawAt && nextSeg?.rawDt) {
    const dArr = parseDateTime(prevSeg.rawAt);
    const dDep = parseDateTime(nextSeg.rawDt);
    if (dArr && dDep && !isNaN(dArr.getTime()) && !isNaN(dDep.getTime())) {
      const diffMs = dDep.getTime() - dArr.getTime();
      if (diffMs > 0) {
        const diffMins = Math.floor(diffMs / 60000);
        const hrs = Math.floor(diffMins / 60);
        const remMins = diffMins % 60;
        layoverText = hrs > 0 && remMins > 0 ? `${hrs}h ${remMins}m Layover` : (hrs > 0 ? `${hrs}h Layover` : `${remMins}m Layover`);
      }
    }
  }

  const stopCode = getDisplayCode(prevSeg?.destination) || getDisplayCode(nextSeg?.origin) || '';
  const stopCity = getDisplayCity(prevSeg?.destination) || getDisplayCity(nextSeg?.origin) || stopCode;

  return (
    <div className="py-1 px-3 bg-amber-50/80 border-y border-amber-200/70 flex items-center justify-center gap-2">
      <div className="h-px bg-amber-300/80 flex-1 border-t border-dashed border-amber-300" />
      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-amber-300 text-amber-900 text-[8px] sm:text-[8.5px] font-bold shadow-2xs">
        <Clock className="w-2.5 h-2.5 text-amber-700 shrink-0" />
        <span>Layover at {stopCity}{stopCode && stopCity !== stopCode ? ` (${stopCode})` : ''}: {layoverText}</span>
      </div>
      <div className="h-px bg-amber-300/80 flex-1 border-t border-dashed border-amber-300" />
    </div>
  );
};

const SingleFlightSegment = ({
  airline = {},
  baggage = {},
  origin = {},
  destination = {},
  duration = '',
  stopType = '',
  aircraft = '',
  pnr = '',
  isLast = true,
}) => {
  const airlineLogoSrc = airline.logo || (airline.code ? getAirlineLogo(airline.code) : null);
  const originCodeDisplay = getDisplayCode(origin);
  const originCityDisplay = getDisplayCity(origin);
  const destCodeDisplay = getDisplayCode(destination);
  const destCityDisplay = getDisplayCity(destination);

  return (
    <div className={`flight-segment py-1.5 px-2.5 sm:py-2 sm:px-3 bg-white ${!isLast ? 'border-b border-[#ecd2d4]' : ''}`}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5 sm:gap-2 items-center">
        {/* Left: Airline info & Aircraft */}
        <div className="md:col-span-3 flex flex-col items-start sm:items-center text-left sm:text-center">
          <div className="flex items-center gap-1.5">
            {airlineLogoSrc ? (
              <img
                src={airlineLogoSrc}
                alt={airline.name || airline.code || 'Airline'}
                className="h-5 sm:h-5.5 object-contain max-w-[70px]"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
            <div>
              <p className="text-[10px] sm:text-[10.5px] font-bold text-slate-800 leading-tight">
                {airline.flightNumber || (airline.code ? `${airline.code} ${airline.flightNo || ''}` : '')}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[7.5px] sm:text-[8px] font-semibold text-slate-500 uppercase leading-none">
                  {airline.travelClass || 'ECONOMY'}
                </span>
                {aircraft && (
                  <span className="text-[7px] text-slate-400 font-medium leading-none">
                    • {aircraft}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Origin -> Duration/Stop -> Destination */}
        <div className="md:col-span-6">
          <div className="grid grid-cols-7 gap-1 items-center text-center">
            {/* Origin */}
            <div className="col-span-2 text-left">
              <span className="text-[13px] sm:text-sm font-bold text-slate-800 leading-tight block">
                {originCodeDisplay}
              </span>
              <p className="text-[9.5px] sm:text-[10px] font-bold text-slate-800 leading-none mt-0.5">
                {origin.time || ''}
              </p>
              <p className="text-[7.5px] sm:text-[8px] font-medium text-slate-600 leading-tight mt-0.5">
                {origin.date || ''}
              </p>
              {originCityDisplay && (
                <p className="text-[7.5px] sm:text-[8px] text-slate-500 font-medium truncate leading-tight">
                  {originCityDisplay}
                </p>
              )}
              {origin.terminal && (
                <p className="text-[7px] sm:text-[7.5px] text-[#85161a] font-bold truncate leading-tight mt-0.5">
                  {origin.terminal}
                </p>
              )}
            </div>

            {/* Path & Duration */}
            <div className="col-span-3 flex flex-col items-center justify-center px-0.5">
              <span className="text-[7.5px] sm:text-[8px] font-medium text-slate-500 mb-0.5">
                {duration || ''}
              </span>

              {/* Flight Track Line */}
              <div className="w-full flex items-center justify-center gap-1 my-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a31d24] shrink-0" />
                <div className="h-[1px] bg-[#a31d24]/70 flex-1" />
                <Plane className="w-2.5 h-2.5 fill-[#a31d24] text-[#a31d24] rotate-45 shrink-0" />
                <div className="h-[1px] bg-[#a31d24]/70 flex-1" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#a31d24] shrink-0" />
              </div>

              <span className="text-[7.5px] sm:text-[8px] font-semibold text-slate-600 mt-0.5">
                {stopType || 'Non Stop'}
              </span>
            </div>

            {/* Destination */}
            <div className="col-span-2 text-right">
              <span className="text-[13px] sm:text-sm font-bold text-slate-800 leading-tight block">
                {destCodeDisplay}
              </span>
              <p className="text-[9.5px] sm:text-[10px] font-bold text-slate-800 leading-none mt-0.5">
                {destination.time || ''}
              </p>
              <p className="text-[7.5px] sm:text-[8px] font-medium text-slate-600 leading-tight mt-0.5">
                {destination.date || ''}
              </p>
              {destCityDisplay && (
                <p className="text-[7.5px] sm:text-[8px] text-slate-500 font-medium truncate leading-tight">
                  {destCityDisplay}
                </p>
              )}
              {destination.terminal && (
                <p className="text-[7px] sm:text-[7.5px] text-[#85161a] font-bold truncate leading-tight mt-0.5">
                  {destination.terminal}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Baggage Badges */}
        <div className="md:col-span-3 flex flex-col sm:items-end justify-center text-left sm:text-right space-y-0.5">
          {baggage.checkIn && (
            <div className="inline-flex items-center gap-1 text-[8px] sm:text-[8.5px] text-slate-700 whitespace-nowrap">
              <CheckInBaggageIcon className="w-3 h-3 text-slate-500 shrink-0" />
              <span>Check-in: <strong className="font-semibold text-slate-900">{baggage.checkIn}</strong></span>
            </div>
          )}
          {baggage.cabin && (
            <div className="inline-flex items-center gap-1 text-[8px] sm:text-[8.5px] text-slate-700 whitespace-nowrap">
              <CabinBaggageIcon className="w-3 h-3 text-slate-500 shrink-0" />
              <span>Cabin: <strong className="font-semibold text-slate-900">{baggage.cabin}</strong></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ConnectingFlightRow = ({ segments = [] }) => {
  if (!segments || segments.length === 0) return null;

  const firstSeg = segments[0];
  const lastSeg = segments[segments.length - 1];

  // Resolve baggage
  const checkInBaggage = firstSeg.baggage?.checkIn || lastSeg.baggage?.checkIn || '';
  const cabinBaggage = firstSeg.baggage?.cabin || lastSeg.baggage?.cabin || '';

  // Calculate layover between segA and segB
  const getLayoverText = (segA, segB) => {
    if (segB?.cT && !isNaN(Number(segB.cT)) && Number(segB.cT) > 0) {
      const mins = Number(segB.cT);
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      if (hrs > 0 && remMins > 0) return `${hrs}h ${remMins}m Layover`;
      if (hrs > 0) return `${hrs}h Layover`;
      return `${remMins}m Layover`;
    }
    if (segA?.rawAt && segB?.rawDt) {
      const dArr = parseDateTime(segA.rawAt);
      const dDep = parseDateTime(segB.rawDt);
      if (dArr && dDep && !isNaN(dArr.getTime()) && !isNaN(dDep.getTime())) {
        const diffMs = dDep.getTime() - dArr.getTime();
        if (diffMs > 0) {
          const diffMins = Math.floor(diffMs / (1000 * 60));
          const hrs = Math.floor(diffMins / 60);
          const remMins = diffMins % 60;
          if (hrs > 0 && remMins > 0) return `${hrs}h ${remMins}m Layover`;
          if (hrs > 0) return `${hrs}h Layover`;
          return `${remMins}m Layover`;
        }
      }
    }
    return 'Layover';
  };

  return (
    <div className="py-1.5 px-2 sm:py-2 sm:px-2.5 bg-white">
      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Left: Flight Numbers & Travel Class */}
        <div className="shrink-0 flex flex-col justify-center gap-1 text-left border-r border-[#ecd2d4]/60 pr-2 min-w-[92px]">
          {segments.map((seg, sIdx) => {
            const airlineLogoSrc = seg.airline?.logo || (seg.airline?.code ? getAirlineLogo(seg.airline.code) : null);
            return (
              <div key={sIdx} className="flex items-center gap-1.5 min-w-0">
                {airlineLogoSrc ? (
                  <img
                    src={airlineLogoSrc}
                    alt={seg.airline?.name || seg.airline?.code || 'Airline'}
                    className="h-4 sm:h-4.5 object-contain max-w-[36px] shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[9.5px] font-bold text-slate-800 leading-tight truncate">
                    {seg.airline?.flightNumber || (seg.airline?.code ? `${seg.airline.code} ${seg.airline.flightNo || ''}` : '')}
                  </p>
                  <p className="text-[7px] sm:text-[7.5px] font-semibold text-slate-500 uppercase leading-none mt-0.5 truncate">
                    {seg.airline?.travelClass || 'ECONOMY'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Middle: Continuous Connecting Route Flow: DEL -> BOM -> GOI */}
        <div className="flex-1 flex items-center justify-between px-1 sm:px-1.5 gap-1 min-w-0">
          {/* Origin Airport */}
          <div className="text-left shrink-0 min-w-[48px] sm:min-w-[58px]">
            <span className="text-[12px] sm:text-[13px] font-bold text-slate-800 leading-tight block">
              {getDisplayCode(firstSeg.origin)}
            </span>
            <p className="text-[9.5px] sm:text-[10px] font-bold text-slate-800 leading-none mt-0.5 whitespace-nowrap">
              {firstSeg.origin?.time || ''}
            </p>
            <p className="text-[7.5px] sm:text-[8px] font-medium text-slate-600 leading-tight mt-0.5 whitespace-nowrap">
              {firstSeg.origin?.date || ''}
            </p>
            {getDisplayCity(firstSeg.origin) && (
              <p className="text-[7.5px] sm:text-[8px] text-slate-500 font-medium truncate leading-tight max-w-[70px]">
                {getDisplayCity(firstSeg.origin)}
              </p>
            )}
          </div>

          {/* Loop intermediate legs & layover stops */}
          {segments.map((seg, idx) => {
            const isLastSeg = idx === segments.length - 1;
            const nextSeg = !isLastSeg ? segments[idx + 1] : null;
            const layover = nextSeg ? getLayoverText(seg, nextSeg) : '';

            return (
              <React.Fragment key={idx}>
                {/* Leg Flight Track Line */}
                <div className="flex-1 flex flex-col items-center justify-center px-0.5 min-w-[36px]">
                  <span className="text-[7.5px] sm:text-[8px] font-medium text-slate-500 leading-none mb-0.5 whitespace-nowrap">
                    {seg.duration || ''}
                  </span>
                  <div className="w-full flex items-center justify-center gap-0.5 my-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a31d24] shrink-0" />
                    <div className="h-[1px] bg-[#a31d24]/70 flex-1 min-w-[6px]" />
                    <Plane className="w-2.5 h-2.5 fill-[#a31d24] text-[#a31d24] rotate-45 shrink-0" />
                    <div className="h-[1px] bg-[#a31d24]/70 flex-1 min-w-[6px]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a31d24] shrink-0" />
                  </div>
                  <span className="text-[7px] sm:text-[7.5px] font-semibold text-slate-600 leading-none mt-0.5 whitespace-nowrap">
                    {seg.airline?.flightNumber || 'Non Stop'}
                  </span>
                </div>

                {/* Intermediate Stop (e.g. BOM) */}
                {!isLastSeg && nextSeg && (
                  <div className="text-center shrink-0 min-w-[58px] sm:min-w-[68px] px-0.5">
                    <span className="text-[12px] sm:text-[13px] font-bold text-slate-800 leading-tight block">
                      {getDisplayCode(seg.destination) !== '—'
                        ? getDisplayCode(seg.destination)
                        : getDisplayCode(nextSeg.origin)}
                    </span>
                    <p className="text-[8.5px] sm:text-[9px] font-bold text-slate-800 leading-none mt-0.5 whitespace-nowrap">
                      {seg.destination?.time || ''} <span className="text-slate-400 font-normal">→</span> {nextSeg.origin?.time || ''}
                    </p>
                    {layover && (
                      <span className="inline-block px-1 py-0.5 mt-0.5 bg-amber-50 text-amber-800 border border-amber-200/80 rounded text-[7px] sm:text-[7.5px] font-semibold leading-none whitespace-nowrap">
                        {layover}
                      </span>
                    )}
                    {getDisplayCity(seg.destination) && (
                      <p className="text-[7.5px] text-slate-500 font-medium truncate leading-tight mt-0.5 max-w-[75px] mx-auto">
                        {getDisplayCity(seg.destination)}
                      </p>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* Final Destination Airport */}
          <div className="text-right shrink-0 min-w-[48px] sm:min-w-[58px]">
            <span className="text-[12px] sm:text-[13px] font-bold text-slate-800 leading-tight block">
              {getDisplayCode(lastSeg.destination)}
            </span>
            <p className="text-[9.5px] sm:text-[10px] font-bold text-slate-800 leading-none mt-0.5 whitespace-nowrap">
              {lastSeg.destination?.time || ''}
            </p>
            <p className="text-[7.5px] sm:text-[8px] font-medium text-slate-600 leading-tight mt-0.5 whitespace-nowrap">
              {lastSeg.destination?.date || ''}
            </p>
            {getDisplayCity(lastSeg.destination) && (
              <p className="text-[7.5px] sm:text-[8px] text-slate-500 font-medium truncate leading-tight max-w-[70px]">
                {getDisplayCity(lastSeg.destination)}
              </p>
            )}
          </div>
        </div>

        {/* Right: Baggage Badges */}
        <div className="shrink-0 flex flex-col items-end justify-center text-right space-y-0.5 pl-1.5 min-w-[115px]">
          {checkInBaggage && (
            <div className="inline-flex items-center gap-1 text-[8px] sm:text-[8.5px] text-slate-700 whitespace-nowrap">
              <CheckInBaggageIcon className="w-3 h-3 text-slate-500 shrink-0" />
              <span>Check-in: <strong className="font-semibold text-slate-900">{checkInBaggage}</strong></span>
            </div>
          )}
          {cabinBaggage && (
            <div className="inline-flex items-center gap-1 text-[8px] sm:text-[8.5px] text-slate-700 whitespace-nowrap">
              <CabinBaggageIcon className="w-3 h-3 text-slate-500 shrink-0" />
              <span>Cabin: <strong className="font-semibold text-slate-900">{cabinBaggage}</strong></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FlightDetails = ({
  flights = [],
  trips = null,
  airline = {},
  baggage = {},
  origin = {},
  destination = {},
  duration = '',
  stopType = '',
  pnr = '',
}) => {
  const hasTrips = Array.isArray(trips) && trips.length > 0;

  if (hasTrips) {
    return (
      <div className="w-full space-y-2 sm:space-y-2.5">
        {trips.map((trip, tIdx) => {
          const isConnecting = trip.isConnecting || (trip.segments && trip.segments.length > 1);
          const routeDisplay = trip.route || (trip.segments ? trip.segments.map(s => getDisplayCode(s.origin)).concat(getDisplayCode(trip.segments[trip.segments.length - 1]?.destination)).filter(c => c && c !== '—').join(' - ') : '');

          return (
            <div key={tIdx} className="w-full overflow-hidden border border-[#ecd2d4] shadow-xs bg-white">
              {/* Header Bar */}
              <div className="bg-[#85161a]/15 text-[#85161a] px-2.5 py-1 sm:px-3 sm:py-1 flex items-center justify-between gap-2 border-b border-[#ecd2d4]">
                <div className="flex items-center gap-1.5 shrink-0">
                  <Plane className="w-3 h-3 fill-[#85161a] text-[#85161a] rotate-45 shrink-0" />
                  <span className="text-[10px] sm:text-[10.5px] font-bold tracking-wide text-[#85161a] whitespace-nowrap">
                    {trip.title || (tIdx === 0 ? 'Departure Flight' : 'Return Flight')}
                  </span>
                </div>

                {routeDisplay && (
                  <span className="text-[9.5px] sm:text-[10px] font-bold text-[#85161a] tracking-wide whitespace-nowrap text-right shrink-0">
                    {routeDisplay}
                  </span>
                )}
              </div>

              {/* Segments Display: Show each segment with full data & layover indicators */}
              <div>
                {(trip.segments || []).map((seg, sIdx) => (
                  <React.Fragment key={sIdx}>
                    {sIdx > 0 && (
                      <LayoverDivider
                        prevSeg={trip.segments[sIdx - 1]}
                        nextSeg={seg}
                      />
                    )}
                    <SingleFlightSegment
                      {...seg}
                      isLast={sIdx === trip.segments.length - 1}
                    />
                  </React.Fragment>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback for flat flights array
  const segmentList = Array.isArray(flights) && flights.length > 0
    ? flights
    : (airline?.code || origin?.code || origin?.city)
      ? [{ airline, baggage, origin, destination, duration, stopType, pnr }]
      : [];

  return (
    <div className="w-full overflow-hidden border border-[#ecd2d4] shadow-xs bg-white">
      {/* Red Header Bar */}
      <div className="bg-[#85161a]/15 text-[#85161a] px-2.5 py-1 sm:px-3 sm:py-1 flex items-center justify-between gap-2 border-b border-[#ecd2d4]">
        <div className="flex items-center gap-1.5">
          <Plane className="w-3 h-3 fill-[#85161a] text-[#85161a] rotate-45" />
          <span className="text-[10px] sm:text-[10.5px] font-bold tracking-wide text-[#85161a]">Flight Details</span>
        </div>
      </div>

      {/* Flight Segments List: Show each segment with full data & layover indicators */}
      <div>
        {segmentList.map((seg, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <LayoverDivider
                prevSeg={segmentList[idx - 1]}
                nextSeg={seg}
              />
            )}
            <SingleFlightSegment
              {...seg}
              isLast={idx === segmentList.length - 1}
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default FlightDetails;
