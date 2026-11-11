import React from 'react';

const BookingDetailsSection = ({
  title = 'Booking Details',
  pnr = 'X7K9PQ',
  status = 'Confirmed',
  dateOfIssue = '10 Oct 2026, 14:32',
  tripType = 'Round trip, connecting (1 stop each way)',
  issuedBy = 'Skyvoo (online booking)',
  passengersSummary = '5 (4 adults, 1 child): 4 outbound, 5 return',
  bookingContact = 'Rahul Sharma, +91 98XXXXXX10',
  email = 'rahul.sharma@example.com',
  isPaid = true,
}) => {
  return (
    <div className="w-full text-left">
      {/* Title matching ticket styling */}
      <h2 className="text-xs sm:text-sm font-bold text-[#85161a] mb-1.5 tracking-tight">
        {title}
      </h2>

      {/* Table Container */}
      <div className="w-full relative overflow-hidden border border-[#ecd2d4] shadow-2xs bg-white rounded-none">
        {/* Subtle Watermark Stamp */}
        {isPaid && (
          <div
            className="absolute right-4 bottom-1 pointer-events-none select-none text-[#85161a]/[0.08] text-4xl sm:text-5xl font-black uppercase tracking-wider -rotate-12 z-0"
            aria-hidden="true"
          >
            PAID
          </div>
        )}

        <table className="w-full table-fixed text-left border-collapse text-[9.5px] sm:text-[10px] relative z-1">
          <tbody>
            {/* Row 1 */}
            <tr className="border-b border-[#ecd2d4]">
              <th className="py-1.5 px-2.5 sm:px-3 bg-[#85161a]/10 text-slate-900 font-bold border-r border-[#ecd2d4] w-[22%] align-middle">
                Booking Reference (PNR)
              </th>
              <td className="py-1.5 px-2.5 sm:px-3 bg-white text-slate-900 font-bold border-r border-[#ecd2d4] w-[28%] align-middle break-words">
                {typeof pnr === 'string' && pnr.includes(' | ') ? (
                  <div className="flex flex-col gap-0.5">
                    {pnr.split(' | ').map((item, idx) => (
                      <span key={idx} className="block leading-tight font-bold">{item}</span>
                    ))}
                  </div>
                ) : (
                  pnr || '—'
                )}
              </td>
              <th className="py-1.5 px-2.5 sm:px-3 bg-[#85161a]/10 text-slate-900 font-bold border-r border-[#ecd2d4] w-[18%] align-middle">
                Booking Status
              </th>
              <td className="py-1.5 px-2.5 sm:px-3 bg-white text-slate-800 font-normal w-[32%] align-middle break-words">
                {status || 'Confirmed'}
              </td>
            </tr>

            {/* Row 2 */}
            <tr className="border-b border-[#ecd2d4]">
              <th className="py-1.5 px-2.5 sm:px-3 bg-[#85161a]/10 text-slate-900 font-bold border-r border-[#ecd2d4] align-middle">
                Date of Issue
              </th>
              <td className="py-1.5 px-2.5 sm:px-3 bg-white text-slate-800 font-normal border-r border-[#ecd2d4] align-middle break-words">
                {dateOfIssue || '—'}
              </td>
              <th className="py-1.5 px-2.5 sm:px-3 bg-[#85161a]/10 text-slate-900 font-bold border-r border-[#ecd2d4] align-middle">
                Trip Type
              </th>
              <td className="py-1.5 px-2.5 sm:px-3 bg-white text-slate-800 font-normal align-middle break-words">
                {tripType || '—'}
              </td>
            </tr>

            {/* Row 3 */}
            <tr className="border-b border-[#ecd2d4]">
              <th className="py-1.5 px-2.5 sm:px-3 bg-[#85161a]/10 text-slate-900 font-bold border-r border-[#ecd2d4] align-middle">
                Issued By
              </th>
              <td className="py-1.5 px-2.5 sm:px-3 bg-white text-slate-800 font-normal border-r border-[#ecd2d4] align-middle break-words">
                {issuedBy || 'Skyvoo (online booking)'}
              </td>
              <th className="py-1.5 px-2.5 sm:px-3 bg-[#85161a]/10 text-slate-900 font-bold border-r border-[#ecd2d4] align-middle">
                Passengers
              </th>
              <td className="py-1.5 px-2.5 sm:px-3 bg-white text-slate-800 font-normal align-middle break-words">
                {passengersSummary || '—'}
              </td>
            </tr>

            {/* Row 4 */}
            <tr className="border-b-0">
              <th className="py-1.5 px-2.5 sm:px-3 bg-[#85161a]/10 text-slate-900 font-bold border-r border-[#ecd2d4] align-middle">
                Booking Contact
              </th>
              <td className="py-1.5 px-2.5 sm:px-3 bg-white text-slate-800 font-normal border-r border-[#ecd2d4] align-middle break-words">
                {bookingContact || '—'}
              </td>
              <th className="py-1.5 px-2.5 sm:px-3 bg-[#85161a]/10 text-slate-900 font-bold border-r border-[#ecd2d4] align-middle">
                Email
              </th>
              <td className="py-1.5 px-2.5 sm:px-3 bg-white text-slate-800 font-normal align-middle break-words">
                {email || '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingDetailsSection;
