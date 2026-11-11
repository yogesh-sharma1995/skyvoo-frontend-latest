import React from 'react';

const PassengerDetails = ({
  title = 'Passenger, Ticket and Seat Details',
  passengers = [],
  isRoundTrip = false,
  outboundFlightNo = '',
  returnFlightNo = '',
  flightNo = '',
  trips = null,
}) => {
  const isMulti = isRoundTrip || (Array.isArray(trips) && trips.length > 1);

  // Fallback normalization if legacy trips prop is passed
  const normalizedPassengers = passengers && passengers.length > 0
    ? passengers
    : (Array.isArray(trips) && trips[0]?.passengers
        ? trips[0].passengers.map((p, idx) => ({
            id: idx + 1,
            name: p.name,
            type: p.type || 'Adult',
            meal: '—',
            baggage: { checkIn: '15 Kg', cabin: '7 Kg' },
            outboundSeats: '—',
            returnSeats: '—',
            seats: '—',
          }))
        : []);

  return (
    <div className="w-full text-left">
      {/* Title matching design */}
      <h2 className="text-sm sm:text-base font-bold text-[#85161a] mb-2 tracking-tight">
        {title}
      </h2>

      {/* Table Container */}
      <div className="w-full overflow-hidden border border-[#ecd2d4] shadow-2xs bg-white">
        <table className="w-full table-fixed text-left border-collapse text-[10px] sm:text-[11px]">
          <thead>
            <tr className="bg-[#85161a]/15 text-[#85161a] border-b border-[#ecd2d4]">
              <th className="py-2 px-1.5 text-center border-r border-[#ecd2d4] w-[5%] font-bold text-[#85161a]">
                #
              </th>
              <th className="py-2 px-2.5 text-left border-r border-[#ecd2d4] w-[26%] font-bold text-[#85161a]">
                Passenger Name
              </th>
              <th className="py-2 px-2 text-left border-r border-[#ecd2d4] w-[11%] font-bold text-[#85161a]">
                Type
              </th>
              <th className="py-2 px-2 text-left border-r border-[#ecd2d4] w-[16%] font-bold text-[#85161a]">
                Meal
              </th>
              <th className="py-2 px-2 text-left border-r border-[#ecd2d4] w-[18%] font-bold text-[#85161a]">
                Baggage
              </th>
              {isMulti ? (
                <>
                  <th className="py-1.5 px-2 text-center border-r border-[#ecd2d4] w-[12%] font-bold text-[#85161a] leading-tight">
                    <div>Outbound seats</div>
                    {outboundFlightNo && (
                      <div className="text-[8.5px] sm:text-[9.5px] font-semibold text-[#85161a]/85 mt-0.5">
                        {outboundFlightNo}
                      </div>
                    )}
                  </th>
                  <th className="py-1.5 px-2 text-center w-[12%] font-bold text-[#85161a] leading-tight">
                    <div>Return seats</div>
                    {returnFlightNo && (
                      <div className="text-[8.5px] sm:text-[9.5px] font-semibold text-[#85161a]/85 mt-0.5">
                        {returnFlightNo}
                      </div>
                    )}
                  </th>
                </>
              ) : (
                <th className="py-1.5 px-2 text-center w-[24%] font-bold text-[#85161a] leading-tight">
                  <div>Seats</div>
                  {(flightNo || outboundFlightNo) && (
                    <div className="text-[8.5px] sm:text-[9.5px] font-semibold text-[#85161a]/85 mt-0.5">
                      {flightNo || outboundFlightNo}
                    </div>
                  )}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="text-slate-800">
            {normalizedPassengers.map((p, idx) => {
              const formatSeatCell = (seatVal) => {
                const s = String(seatVal || '').trim();
                if (!s || s === '—' || s === '-') {
                  return <span className="text-slate-400 font-normal">—</span>;
                }
                if (s.toLowerCase() === 'not travelling' || s.toLowerCase() === 'not applicable') {
                  return (
                    <span className="inline-block px-1.5 py-0.5 bg-[#fae4e4] text-slate-700 text-[9px] sm:text-[10px] font-medium">
                      {s}
                    </span>
                  );
                }
                if (s.includes(' | ')) {
                  return (
                    <div className="flex flex-col gap-0.5 font-bold text-slate-800 text-[9px] sm:text-[9.5px]">
                      {s.split(' | ').map((part, pIdx) => (
                        <span key={pIdx} className="block whitespace-nowrap leading-tight">{part}</span>
                      ))}
                    </div>
                  );
                }
                return <span className="font-bold text-slate-800">{s}</span>;
              };

              // Baggage cell formatting
              const bag = p.baggage;
              const checkInStr = typeof bag === 'object' && bag !== null ? bag.checkIn : (typeof bag === 'string' ? bag : '15 Kg');
              const cabinStr = typeof bag === 'object' && bag !== null ? bag.cabin : '7 Kg';
              const extraStr = typeof bag === 'object' && bag !== null ? bag.extra : null;
              const formattedCheckIn = checkInStr
                ? (checkInStr.toLowerCase().includes('check-in') ? checkInStr : `${checkInStr} Check-in`)
                : '—';
              const formattedCabin = (cabinStr && cabinStr !== '0 Kg')
                ? (cabinStr.toLowerCase().includes('cabin') ? cabinStr : `${cabinStr} Cabin`)
                : '';

              return (
                <tr
                  key={p.id || idx}
                  className="bg-white hover:bg-slate-50/70 border-b border-[#ecd2d4] last:border-b-0"
                >
                  {/* # */}
                  <td className="py-2 px-1.5 text-center font-medium text-slate-600 border-r border-[#ecd2d4]">
                    {idx + 1}
                  </td>

                  {/* Passenger Name */}
                  <td className="py-2 px-2.5 font-bold text-slate-900 uppercase border-r border-[#ecd2d4] break-words leading-tight">
                    {p.name}
                  </td>

                  {/* Type */}
                  <td className="py-2 px-2 font-normal text-slate-700 border-r border-[#ecd2d4] whitespace-nowrap">
                    {p.type || 'Adult'}
                  </td>

                  {/* Meal */}
                  <td className="py-2 px-2 font-normal text-slate-700 border-r border-[#ecd2d4] break-words leading-tight">
                    {p.meal && p.meal !== '—' && p.meal !== 'N/A' ? (
                      <span className="font-medium text-slate-800">{p.meal}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Baggage */}
                  <td className="py-2 px-2 border-r border-[#ecd2d4] align-middle break-words leading-tight">
                    <div className="leading-tight text-[9.5px] sm:text-[10px] space-y-0.5">
                      <span className="font-semibold text-slate-800 block">
                        {formattedCheckIn}
                      </span>
                      {formattedCabin && (
                        <span className="text-slate-500 block text-[8.5px] sm:text-[9px]">
                          {formattedCabin}
                        </span>
                      )}
                      {extraStr && (
                        <span className="text-amber-800 font-medium block text-[8.5px] sm:text-[9px]">
                          {extraStr.startsWith('+') ? extraStr : `+ ${extraStr}`}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Seats */}
                  {isMulti ? (
                    <>
                      <td className="py-2 px-2 text-center border-r border-[#ecd2d4] break-words leading-tight">
                        {formatSeatCell(p.outboundSeats)}
                      </td>
                      <td className="py-2 px-2 text-center break-words leading-tight">
                        {formatSeatCell(p.returnSeats)}
                      </td>
                    </>
                  ) : (
                    <td className="py-2 px-2 text-center break-words leading-tight">
                      {formatSeatCell(p.seats || p.outboundSeats)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PassengerDetails;
