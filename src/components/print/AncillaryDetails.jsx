import React from 'react';
import { Luggage, User } from 'lucide-react';

// Custom Seat SVG icon matching the ticket
const SeatIcon = ({ className = 'w-3.5 h-3.5 text-slate-500' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M4 18v3h3v-3h10v3h3v-3h1a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1V4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2zm3-14h10v3H7V4zm11 5v7H6V9h12z" />
  </svg>
);

// Custom Meal/Cloche SVG icon matching the ticket
const MealIcon = ({ className = 'w-3.5 h-3.5 text-slate-500' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 4a2 2 0 0 0-2 2H3a1 1 0 0 0-1 1c0 5.18 3.95 9.45 9 9.95V19H7a1 1 0 0 0 0 2h10a1 1 0 0 0 0-2h-4v-2.05c5.05-.5 9-4.77 9-9.95a1 1 0 0 0-1-1h-7a2 2 0 0 0-2-2zm0 2a1 1 0 0 1 1 1h-2a1 1 0 0 1 1-1zm-8 3h16c-.45 4.09-3.86 7.3-8 7.3s-7.55-3.21-8-7.3z" />
  </svg>
);

const AncillaryDetails = ({
  ancillaries = [],
  groupedAncillaries = null,
}) => {
  const hasGroups = Array.isArray(groupedAncillaries) && groupedAncillaries.length > 1;

  if (hasGroups) {
    return (
      <div className="w-full space-y-2">
        {groupedAncillaries.map((grp, gIdx) => (
          <div key={gIdx} className="w-full overflow-hidden border border-[#ecd2d4] shadow-xs flex flex-col bg-white">
            {/* Soft Red Header Bar */}
            <div className="bg-[#85161a]/15 text-[#85161a] px-3 py-1.5 flex items-center justify-between gap-3 border-b border-[#ecd2d4]">
              <div className="flex items-center gap-1.5 shrink-0">
                <Luggage className="w-3.5 h-3.5 text-[#85161a] shrink-0" />
                <h2 className="text-[11px] sm:text-xs font-bold tracking-wide text-[#85161a] whitespace-nowrap">
                  {grp.title || (gIdx === 0 ? 'Departure Flight' : 'Return Flight')} - Ancillary Details
                </h2>
              </div>
              {grp.route && (
                <span className="text-[10px] sm:text-xs font-bold text-[#85161a] tracking-wide whitespace-nowrap text-right shrink-0">
                  {grp.route}
                </span>
              )}
            </div>

            {/* Ancillary Table */}
            <div className="w-full bg-white">
              <table className="w-full table-fixed text-left border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-[#f3f5f8] text-slate-700 font-semibold border-b border-[#ecd2d4] text-[10px]">
                    <th className="py-1 px-3 border-r border-[#ecd2d4] w-[32%]">Passenger</th>
                    <th className="py-1 px-3 border-r border-[#ecd2d4] w-[32%]">Baggage Details</th>
                    <th className="py-1 px-3 text-center border-r border-[#ecd2d4] w-[18%]">Seat</th>
                    <th className="py-1 px-3 text-center w-[18%]">Meal</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {(grp.items || []).map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50 border-b border-[#ecd2d4] last:border-b-0">
                      <td className="py-1.5 px-3 align-top border-r border-[#ecd2d4]">
                        <div className="flex items-start gap-1.5 min-w-0">
                          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#a31d24] text-white mt-0.5 shrink-0 shadow-xs">
                            <User className="w-2.5 h-2.5 text-white fill-white" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 leading-tight text-[10.5px] truncate">{item.name}</p>
                            {item.sector && (
                              <p className="text-[8.5px] font-semibold text-slate-500 uppercase mt-0.5 truncate">{item.sector}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-1.5 px-3 text-[9.5px] leading-tight align-top space-y-0.5 border-r border-[#ecd2d4] break-words">
                        <p className="text-slate-600 font-normal">
                          Check-in: <span className="font-semibold text-slate-800">{item.baggage?.checkIn}</span>
                        </p>
                        <p className="text-slate-600 font-normal">
                          Cabin: <span className="font-semibold text-slate-800">{item.baggage?.cabin}</span>
                        </p>
                        {item.baggage?.additional && (
                          <p className="text-slate-600 font-normal">
                            Extra: <span className="font-semibold text-slate-800">{item.baggage.additional}</span>
                          </p>
                        )}
                      </td>

                      <td className="py-1.5 px-2 text-center align-top border-r border-[#ecd2d4]">
                        {item.seatList && item.seatList.length > 0 ? (
                          <div className="flex flex-col items-center gap-1">
                            {item.seatList.map((st, sIdx) => (
                              <div
                                key={sIdx}
                                className="inline-flex items-center gap-1 font-semibold text-slate-800 bg-slate-50 border border-slate-200/80 px-1.5 py-0.2 rounded text-[9.5px]"
                              >
                                <SeatIcon className="w-2.5 h-2.5 text-[#a31d24] shrink-0" />
                                {st.sector && (
                                  <span className="text-[8.5px] text-slate-500 font-medium">({st.sector}):</span>
                                )}
                                <span className="font-bold text-[#a31d24]">{st.seatNo}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1 text-slate-600 font-medium text-[10px] pt-0.5">
                            <SeatIcon className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{item.seat || 'N/A'}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-1.5 px-2 text-center align-top">
                        <div className="flex items-center justify-center gap-1 text-slate-600 font-medium text-[10px] pt-0.5">
                          <MealIcon className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{item.meal || 'N/A'}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden border border-[#ecd2d4] shadow-xs flex flex-col bg-white">
      {/* Soft Red Header Bar */}
      <div className="bg-[#85161a]/15 text-[#85161a] px-3 py-1.5 flex items-center gap-1.5 border-b border-[#ecd2d4]">
        <Luggage className="w-3.5 h-3.5 text-[#85161a]" />
        <h2 className="text-[11px] sm:text-xs font-bold tracking-wide text-[#85161a]">Ancillary Details</h2>
      </div>

      {/* Ancillary Table */}
      <div className="w-full bg-white">
        <table className="w-full table-fixed text-left border-collapse text-[10.5px]">
          <thead>
            <tr className="bg-[#f3f5f8] text-slate-700 font-semibold border-b border-[#ecd2d4] text-[10px]">
              <th className="py-1 px-3 border-r border-[#ecd2d4] w-[32%]">Passenger</th>
              <th className="py-1 px-3 border-r border-[#ecd2d4] w-[32%]">Baggage Details</th>
              <th className="py-1 px-3 text-center border-r border-[#ecd2d4] w-[18%]">Seat</th>
              <th className="py-1 px-3 text-center w-[18%]">Meal</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {ancillaries.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-slate-50/50 border-b border-[#ecd2d4] last:border-b-0">
                <td className="py-1.5 px-3 align-top border-r border-[#ecd2d4]">
                  <div className="flex items-start gap-1.5 min-w-0">
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#a31d24] text-white mt-0.5 shrink-0 shadow-xs">
                      <User className="w-2.5 h-2.5 text-white fill-white" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 leading-tight text-[10.5px] truncate">{item.name}</p>
                      <p className="text-[8.5px] font-semibold text-slate-500 uppercase mt-0.5 truncate">{item.sector}</p>
                    </div>
                  </div>
                </td>

                <td className="py-1.5 px-3 text-[9.5px] leading-tight align-top space-y-0.5 border-r border-[#ecd2d4] break-words">
                  <p className="text-slate-600 font-normal">
                    Check-in: <span className="font-semibold text-slate-800">{item.baggage.checkIn}</span>
                  </p>
                  <p className="text-slate-600 font-normal">
                    Cabin: <span className="font-semibold text-slate-800">{item.baggage.cabin}</span>
                  </p>
                  {item.baggage.additional && (
                    <p className="text-slate-600 font-normal">
                      Extra: <span className="font-semibold text-slate-800">{item.baggage.additional}</span>
                    </p>
                  )}
                </td>

                <td className="py-1.5 px-2 text-center align-top border-r border-[#ecd2d4]">
                  {item.seatList && item.seatList.length > 0 ? (
                    <div className="flex flex-col items-center gap-1">
                      {item.seatList.map((st, sIdx) => (
                        <div
                          key={sIdx}
                          className="inline-flex items-center gap-1 font-semibold text-slate-800 bg-slate-50 border border-slate-200/80 px-1.5 py-0.2 rounded text-[9.5px]"
                        >
                          <SeatIcon className="w-2.5 h-2.5 text-[#a31d24] shrink-0" />
                          {st.sector && (
                            <span className="text-[8.5px] text-slate-500 font-medium">({st.sector}):</span>
                          )}
                          <span className="font-bold text-[#a31d24]">{st.seatNo}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1 text-slate-600 font-medium text-[10px] pt-0.5">
                      <SeatIcon className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{item.seat || 'N/A'}</span>
                    </div>
                  )}
                </td>

                <td className="py-1.5 px-2 text-center align-top">
                  <div className="flex items-center justify-center gap-1 text-slate-600 font-medium text-[10px] pt-0.5">
                    <MealIcon className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{item.meal || 'N/A'}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AncillaryDetails;
