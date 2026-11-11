import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const DEFAULT_TERMS = [
  {
    title: 'Airline Terms',
    content: (
      <>
        All flight bookings made through{' '}
        <a
          href="https://skyvoo.com/"
          target="_blank"
          rel="noreferrer"
          className="text-[#85161a] font-medium underline"
        >
          skyvoo.com
        </a>{' '}
        are subject to the respective airline's Conditions of Carriage, fare rules, and applicable travel regulations.
      </>
    ),
  },
  {
    title: 'Booking Reference',
    content: 'Please use your Skyvoo Booking ID / Trip ID for all booking-related queries, modifications, cancellations, and support requests.',
  },
  {
    title: 'Airport Reporting',
    content: 'Passengers are advised to arrive at the airport at least 2 hours before domestic flights and 3 hours before international flights, or earlier if required by the airline.',
  },
  {
    title: 'Check-in Guidelines',
    content: 'Airport check-in counters generally close 45–60 minutes before departure, depending on the airline and destination. Please verify the applicable deadline with your airline.',
  },
  {
    title: 'Cabin Baggage',
    content: "Cabin baggage allowances are subject to the airline's policy. Many domestic economy fares permit up to 7 kg of cabin baggage. Please verify the allowance mentioned in your booking.",
  },
  {
    title: 'Electronic Devices',
    content: 'Laptops, mobile phones, power banks, and other electronic devices must be carried in accordance with applicable airline and aviation security regulations. Spare lithium batteries and power banks must not be placed in checked baggage.',
  },
  {
    title: 'Identity Verification',
    content: 'Passengers must carry valid government-issued photo identification. International passengers must carry a valid passport, visa, and other required travel documents.',
  },
  {
    title: 'Cancellation & Modification',
    content: 'All cancellations, rescheduling requests, and amendments are subject to airline policies, applicable fare rules, and Skyvoo service charges, if any Charges will be communicated as applicable.',
  },
  {
    title: 'Refund Policy',
    content: "Refund eligibility and processing are subject to the airline's fare conditions and applicable regulations. Refunds, where approved, will be processed to the original payment method.",
  },
  {
    title: 'Travel Guidelines',
    content: 'Passengers are responsible for checking the latest government travel advisories, visa requirements, health guidelines, and destination-specific entry regulations before departure.',
  },
  {
    title: 'Flight Schedule Changes',
    content: 'Airlines may revise flight schedules, terminals, or operational details. Passengers should verify their flight status with the airline before leaving for the airport.',
  },
  {
    title: 'Booking Assistance',
    content: 'For smooth and efficient support, passengers are advised to contact Skyvoo for cancellation, rescheduling, refund, or other assistance related to bookings made through the platform.',
  },
  {
    title: 'Passenger Rights',
    content: 'Passenger rights and airline obligations are governed by applicable aviation laws and regulations issued by the relevant authorities.',
  },
  {
    title: 'Official Website',
    content: (
      <>
        For booking details, travel assistance, and related information, visit{' '}
        <a
          href="https://skyvoo.com/"
          target="_blank"
          rel="noreferrer"
          className="text-[#85161a] font-medium underline"
        >
          skyvoo.com
        </a>
        .
      </>
    ),
  },
  {
    title: 'Important Notice',
    content: "Skyvoo acts as a travel booking platform. Airline-specific baggage allowances, check-in deadlines, cancellation charges, and operational policies may vary. Passengers should review the applicable airline's terms before travelling.",
  },
];

const ImportantInformation = ({
  title = 'IMPORTANT TRAVEL INFORMATION & TERMS AND CONDITIONS',
  terms = DEFAULT_TERMS,
  tagline = 'SKYVOO — YOUR JOURNEY, OUR PRIORITY.',
}) => {
  return (
    <div className="w-full border border-[#ecd2d4] bg-white shadow-xs text-left overflow-hidden important-info">
      {/* Header Bar */}
      <div className="bg-[#85161a]/15 text-[#85161a] px-3 py-1.5 flex items-center justify-between border-b border-[#ecd2d4]">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#85161a] shrink-0" />
          <h2 className="text-[10px] sm:text-[11px] font-bold tracking-wide uppercase text-[#85161a]">
            {title}
          </h2>
        </div>
      </div>

      {/* Terms Grid (2 columns on medium screens / print) */}
      <div className="p-2.5 sm:p-3 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-left">
        {terms.map((item, idx) => (
          <div key={idx} className="terms-item flex items-start gap-1.5 text-left">
            <span className="w-1.5 h-1.5 rounded-full bg-[#85161a] shrink-0 mt-1" />
            <p className="text-[8px] sm:text-[8.5px] leading-snug text-slate-700">
              <strong className="font-semibold text-slate-900">{item.title}: </strong>
              {item.content}
            </p>
          </div>
        ))}
      </div>

      {/* Footer Tagline Strip */}
      {tagline && (
        <div className="bg-[#85161a]/5 border-t border-[#ecd2d4] py-1 px-3 text-center">
          <p className="text-[8.5px] sm:text-[9px] font-bold tracking-widest text-[#85161a] uppercase">
            {tagline}
          </p>
        </div>
      )}
    </div>
  );
};

export default ImportantInformation;
