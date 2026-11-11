import React from 'react';
import { CreditCard } from 'lucide-react';

const formatDisplayPrice = (val) => {
  if (val === undefined || val === null || val === 'NaN' || val === '₹ NaN') return '₹ 0.00';
  if (typeof val === 'number') {
    return isNaN(val) ? '₹ 0.00' : `₹ ${val.toFixed(2)}`;
  }
  const str = String(val).trim();
  if (str.includes('NaN')) return '₹ 0.00';
  if (str.startsWith('₹')) return str;
  const num = parseFloat(str.replace(/[^0-9.-]+/g, ''));
  return isNaN(num) ? '₹ 0.00' : `₹ ${num.toFixed(2)}`;
};

const PaymentDetails = ({
  fare = '₹ 0.00',
  taxesAndFees = '₹ 0.00',
  convenienceFee = '₹ 0.00',
  totalAmount = '₹ 0.00',
}) => {
  return (
    <div className="w-full overflow-hidden border border-[#ecd2d4] shadow-xs flex flex-col bg-white">
      {/* Soft Red Header Bar */}
      <div className="bg-[#85161a]/15 text-[#85161a] px-3 py-1.5 flex items-center gap-1.5 border-b border-[#ecd2d4]">
        <CreditCard className="w-3.5 h-3.5 text-[#85161a]" />
        <h2 className="text-[11px] sm:text-xs font-bold tracking-wide text-[#85161a]">Payment Details</h2>
      </div>

      {/* Horizontal / Grid Payment Table for Full Row View */}
      <div className="w-full bg-white">
        <table className="w-full table-fixed border-collapse text-[10.5px] text-slate-700">
          <thead>
            <tr className="bg-[#f3f5f8] text-slate-700 font-semibold border-b border-[#ecd2d4] text-[10px]">
              <th className="py-1 px-3 border-r border-[#ecd2d4] text-left w-1/4">Base Fare</th>
              <th className="py-1 px-3 border-r border-[#ecd2d4] text-left w-1/4">Taxes & Fees</th>
              <th className="py-1 px-3 border-r border-[#ecd2d4] text-left w-1/4">Add-ons & Convenience Fee</th>
              <th className="py-1 px-3 text-right w-1/4 bg-[#fbf4f4] text-[#a31d24]">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white">
              <td className="py-1.5 px-3 border-r border-[#ecd2d4] font-semibold text-slate-800 truncate">
                {formatDisplayPrice(fare)}
              </td>
              <td className="py-1.5 px-3 border-r border-[#ecd2d4] font-semibold text-slate-800 truncate">
                {formatDisplayPrice(taxesAndFees)}
              </td>
              <td className="py-1.5 px-3 border-r border-[#ecd2d4] font-semibold text-slate-800 truncate">
                {formatDisplayPrice(convenienceFee)}
              </td>
              <td className="py-1.5 px-3 text-right font-bold text-sm sm:text-base text-[#a31d24] bg-[#fbf4f4] truncate">
                {formatDisplayPrice(totalAmount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentDetails;
