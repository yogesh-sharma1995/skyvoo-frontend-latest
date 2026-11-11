import React, { forwardRef, useMemo } from 'react';
import TicketHeader from './TicketHeader';
import BookingDetailsSection from './BookingDetailsSection';
import PassengerDetails from './PassengerDetails';
import FlightDetails from './FlightDetails';
import PaymentDetails from './PaymentDetails';
import ImportantInformation from './ImportantInformation';
import TicketFooter from './TicketFooter';
import { mapBookingDetailToTicket } from './mapBookingToTicket';
import { Printer, X } from 'lucide-react';

const ETicket = forwardRef(({
  bookingData = null,
  user = null,
  printTicketType = 'All', // 'All' | 'Onward' | 'Return'
  showPrintButton = true,
  onClose = null,
  headerProps,
  bookingProps,
  passengerProps,
  flightProps,
  ancillaryProps,
  paymentProps,
  importantInfoProps,
  footerProps,
  className = '',
}, ref) => {
  // Map booking data from /flight/BookingDetail API if provided
  const mappedData = useMemo(() => {
    if (!bookingData) return null;
    return mapBookingDetailToTicket(bookingData, user, printTicketType);
  }, [bookingData, user, printTicketType]);

  // Combined props with fallback
  const resolvedHeaderProps = headerProps || mappedData?.headerProps;
  const resolvedBookingProps = bookingProps || mappedData?.bookingProps;
  const resolvedPassengerProps = passengerProps || mappedData?.passengerProps;
  const resolvedFlightProps = flightProps || mappedData?.flightProps;
  const resolvedAncillaryProps = ancillaryProps || mappedData?.ancillaryProps;
  const resolvedPaymentProps = paymentProps || mappedData?.paymentProps;
  const resolvedFooterProps = footerProps || mappedData?.footerProps;

  // Trigger browser print dialog
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full flex flex-col items-center py-4 px-2 sm:px-4 bg-slate-100 min-h-screen">
      {/* Print Action Header Bar (Hidden during actual print) */}
      {showPrintButton && (
        <div className="w-full max-w-[820px] mb-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#a31d24]" />
            <p className="text-xs sm:text-sm text-slate-700 font-bold">
              Flight E-Ticket Preview
            </p>
          </div>
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-1.5 bg-[#a31d24] hover:bg-[#88141a] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Ticket Paper Sheet */}
      <div
        ref={ref}
        id="skyvoo-eticket"
        className={`w-full max-w-[820px] bg-white rounded-none shadow-xl p-3.5 sm:p-4 space-y-2.5 sm:space-y-3 text-slate-800 text-left print:shadow-none print:p-3 print:m-0 print:w-full print:max-w-none print:rounded-none print:space-y-2.5 ${className}`}
        style={{
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
          overflow: 'visible',
        }}
      >
        {/* 1. Header Section */}
        <div className="pdf-section">
          <TicketHeader {...resolvedHeaderProps} />
        </div>

        {/* 2. Booking Details */}
        {resolvedBookingProps && (
          <div className="pdf-section">
            <BookingDetailsSection {...resolvedBookingProps} />
          </div>
        )}

        {/* 3. Flight Details */}
        <div className="pdf-section">
          <FlightDetails {...resolvedFlightProps} />
        </div>

        {/* 4. Passenger Details */}
        <div className="pdf-section">
          <PassengerDetails {...resolvedPassengerProps} />
        </div>


        {/* 4. Payment Details (Full Width) */}
        <div className="pdf-section w-full">
          <PaymentDetails {...resolvedPaymentProps} />
        </div>

        {/* 6. Important Information */}
        <div className="pdf-section">
          <ImportantInformation {...importantInfoProps} />
        </div>

        {/* 7. Footer Section */}
        <div className="pdf-section">
          <TicketFooter {...resolvedFooterProps} />
        </div>
      </div>
    </div>
  );
});

ETicket.displayName = 'ETicket';

export default ETicket;
