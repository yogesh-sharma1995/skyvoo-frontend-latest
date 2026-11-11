import React from 'react';
import skyvooLogo from '@/assets/imgs/logo.png';
import { Check, X, Clock, Mail, Phone } from 'lucide-react';

const TicketHeader = ({
  logo = skyvooLogo,
  status = '',
  transactionId = '',
  pnr = '',
  bookingId = '',
  gstNo = '',
  issuedDate = '',
  barcode = '',
  customerCare = {
    email: 'support@skyvoo.com',
    phone: '+91 7800 606 780',
  },
  supportEmail = '',
  supportPhone = '',
  isB2B = false,
  userType = '',
  agentName = '',
  agentEmail = '',
  agentPhone = '',
}) => {
  const isAgentB2B = isB2B || String(userType || '').trim().toUpperCase() === 'B2B';
  const hasAgentInfo = Boolean(agentEmail || agentPhone);
  const showAgentInHeader = isAgentB2B && hasAgentInfo;

  const careEmail = supportEmail || customerCare?.email || 'support@skyvoo.com';
  const carePhone = supportPhone || customerCare?.phone || '+91 7800 606 780';
  const hasGst = Boolean(
    gstNo &&
    typeof gstNo === 'string' &&
    gstNo.trim() !== '' &&
    gstNo.trim() !== '-' &&
    gstNo.trim() !== '—' &&
    gstNo.trim().toUpperCase() !== 'N/A' &&
    gstNo.trim() !== 'null' &&
    gstNo.trim() !== 'undefined'
  );

  const statusUpper = String(status || '').trim().toUpperCase();

  const getStatusBadgeConfig = () => {
    if (
      statusUpper === 'FAILED' ||
      statusUpper === 'FAIL' ||
      statusUpper === 'F' ||
      statusUpper.includes('FAIL') ||
      statusUpper.includes('PAYMENT FAILED')
    ) {
      return {
        badgeClass: 'border-rose-500 bg-rose-50 text-rose-700',
        iconBgClass: 'bg-rose-600 text-white',
        icon: <X className="w-1.5 h-1.5 stroke-[3]" />,
        label: status || 'PAYMENT FAILED',
      };
    }
    if (
      statusUpper === 'CANCELLED' ||
      statusUpper === 'CANCEL' ||
      statusUpper === 'C' ||
      statusUpper.includes('CANCEL')
    ) {
      return {
        badgeClass: 'border-rose-500 bg-rose-50 text-rose-700',
        iconBgClass: 'bg-rose-600 text-white',
        icon: <X className="w-1.5 h-1.5 stroke-[3]" />,
        label: status || 'CANCELLED',
      };
    }
    if (
      statusUpper === 'PENDING' ||
      statusUpper === 'P' ||
      statusUpper === 'QUEUED' ||
      statusUpper === 'UNKNOWN' ||
      statusUpper === 'U' ||
      statusUpper.includes('PENDING')
    ) {
      return {
        badgeClass: 'border-amber-500 bg-amber-50 text-amber-700',
        iconBgClass: 'bg-amber-500 text-white',
        icon: <Clock className="w-1.5 h-1.5 stroke-[3]" />,
        label: status || 'PENDING',
      };
    }
    return {
      badgeClass: 'border-emerald-500 bg-emerald-50/70 text-emerald-700',
      iconBgClass: 'bg-emerald-600 text-white',
      icon: <Check className="w-1.5 h-1.5 stroke-[3]" />,
      label: status || 'CONFIRMED',
    };
  };

  const badgeConfig = getStatusBadgeConfig();

  const barcodeSrc = typeof barcode === 'string' && barcode.trim()
    ? (barcode.startsWith('data:') || barcode.startsWith('http') || barcode.startsWith('/')
      ? barcode
      : `data:image/png;base64,${barcode}`)
    : barcode;

  console.log(barcode, "barcode")
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-100 text-left">
      {/* Left: Brand Logo & Title */}
      <div className="space-y-0.5 text-left">
        <div className="flex items-center gap-2">
          {logo ? (
            <img src={logo} alt="Skyvoo Logo" className="h-8 sm:h-9 object-contain" />
          ) : (
            <div className="text-left">
              <span className="text-2xl font-extrabold text-[#a31d24] tracking-tight font-serif italic">Skyvoo</span>
              <p className="text-[8px] tracking-[0.2em] font-semibold text-slate-700 uppercase -mt-1 text-left">
                Travel Beyond Borders
              </p>
            </div>
          )}
        </div>

        <div className="pt-0.5 text-left">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight text-left">
            E-Ticket
          </h1>
          <p className="text-[10px] text-slate-500 font-normal leading-tight text-left">
            Thank you for choosing Skyvoo. Wishing you a safe and pleasant journey!
          </p>
        </div>

        {/* Customer Care or B2B Agent Details on Left */}
        {showAgentInHeader ? (
          <div className="pt-1 space-y-0.5 text-left text-[9.5px] sm:text-[10px] text-slate-700">
            {agentEmail && (
              <p className="flex items-center gap-1.5 leading-tight">
                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="font-normal text-slate-500">Email :</span>
                <span className="font-medium text-slate-800">{agentEmail}</span>
              </p>
            )}
            {agentPhone && (
              <p className="flex items-center gap-1.5 leading-tight">
                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="font-normal text-slate-500">Mobile :</span>
                <span className="font-bold text-slate-800">{agentPhone}</span>
              </p>
            )}
          </div>
        ) : (
          <div className="pt-1 space-y-0.5 text-left text-[9.5px] sm:text-[10px] text-slate-700">
            {careEmail && (
              <p className="flex items-center gap-1.5 leading-tight">
                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="font-normal text-slate-500">Customer Care Email :</span>
                <span className="font-medium text-slate-800">{careEmail}</span>
              </p>
            )}
            {carePhone && (
              <p className="flex items-center gap-1.5 leading-tight">
                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="font-normal text-slate-500">Customer Care Phone :</span>
                <span className="font-bold text-slate-800">{carePhone}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right: Booking Status, Metadata & Barcode */}
      <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
        {barcodeSrc && (
          <img
            src={barcodeSrc}
            alt="Barcode"
            style={{ width: "200px", height: "80px" }}
          />
        )}

        <div className="flex flex-col sm:items-end text-left sm:text-right space-y-0.5">
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${badgeConfig.badgeClass} text-[10px] font-bold tracking-wide w-fit sm:self-end`}>
            <span className={`flex items-center justify-center w-2.5 h-2.5 rounded-full ${badgeConfig.iconBgClass}`}>
              {badgeConfig.icon}
            </span>
            <span>{badgeConfig.label}</span>
          </div>

          <div className="text-[9px] sm:text-[10px] text-slate-700 font-medium space-y-0.5">
            {transactionId && (
              <p className="leading-tight">
                <span className="font-normal text-slate-500">Transaction Id :</span> {transactionId}
              </p>
            )}
            {pnr && (
              <p className="leading-tight">
                <span className="font-normal text-slate-500">PNR :</span> <span className="font-bold text-[#a31d24]">{pnr}</span>
              </p>
            )}
            {bookingId && (
              <p className="leading-tight">
                <span className="font-normal text-slate-500">Booking ID :</span> {bookingId}
              </p>
            )}
            {hasGst && (
              <p className="leading-tight">
                <span className="font-normal text-slate-500">GST No. :</span> {gstNo}
              </p>
            )}
            {issuedDate && (
              <p className="leading-tight">
                <span className="font-normal text-slate-500">Issued Date :</span> {issuedDate}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketHeader;
