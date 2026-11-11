import React from 'react';
import { Calendar, User, Clock, Check, X, AlertCircle, Loader2, RefreshCw, ArrowRight, Plane, MessageSquare, IndianRupee } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

const getRescheduleStatusInfo = (status) => {
  const s = String(status || '').toUpperCase();
  switch (s) {
    case 'R':
    case 'REQUESTED':
    case 'PENDING':
      return {
        label: 'Reschedule Requested',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: <Clock className="w-3.5 h-3.5" />,
      };
    case 'S':
    case 'A':
    case 'CONFIRMED':
    case 'APPROVED':
    case 'SUCCESS':
      return {
        label: 'Rescheduled',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: <Check className="w-3.5 h-3.5" />,
      };
    case 'C':
    case 'REJECTED':
    case 'CANCELLED':
    case 'FAILED':
      return {
        label: 'Rejected / Cancelled',
        badge: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: <X className="w-3.5 h-3.5" />,
      };
    default:
      return {
        label: status || 'In Process',
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: <RefreshCw className="w-3.5 h-3.5" />,
      };
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const clean = dateStr.trim();
  const d = new Date(clean);
  if (isNaN(d.getTime())) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

export const parseRescheduleDates = (reschedDateStr) => {
  if (!reschedDateStr) return [];
  return reschedDateStr.split(',').map((item) => {
    const parts = item.split(':');
    const sector = parts[0] || '';
    const dateVal = parts[1] || '';
    return {
      sector: sector.trim(),
      rawDate: dateVal.trim(),
      formattedDate: dateVal.trim() ? formatDate(dateVal.trim()) : 'Date not specified',
    };
  });
};

export default function RescheduleHistory({ limit = null, isFullPage = false }) {
  const {
    data: rescheduleList = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['rescheduleList'],
    queryFn: async () => {
      let res;
      try {
        res = await api.post('/flight/RescheduleList', {});
      } catch {
        res = await api.get('/flight/RescheduleList');
      }
      if (res?.data?.IsSuccess) {
        return res.data.Data ?? [];
      }
      throw new Error(res?.data?.ErrorMessage || 'Failed to fetch reschedule list');
    },
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
  });

  const displayedList = limit ? rescheduleList.slice(0, limit) : rescheduleList;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-[#78080B] animate-spin mb-3" />
        <p className="text-gray-400 text-sm">Loading reschedule requests...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-8 h-8 text-rose-500 mb-3" />
        <p className="text-rose-500 text-sm font-medium">Failed to load reschedule requests</p>
        <p className="text-gray-400 text-xs mt-1 mb-4">{error?.message || 'Something went wrong'}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-1.5 bg-[#78080B] text-white text-xs font-semibold rounded-lg hover:bg-[#8F0306] transition cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (rescheduleList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <RefreshCw className="w-10 h-10 text-gray-300 mb-3" />
        <p className="text-gray-400 font-medium">No reschedule requests found</p>
        <p className="text-gray-300 text-sm mt-1">Your flight reschedule requests will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayedList.map((item, idx) => {
        const statusInfo = getRescheduleStatusInfo(item.RescheduleStatus);
        const sectorDates = parseRescheduleDates(item.RescheduleDate);

        // Collect all travellers across all trips in this reschedule item
        const allTravellers = [];
        const tripSectors = [];
        (item.Trips || []).forEach((t) => {
          if (t.Source && t.Destination) {
            tripSectors.push(`${t.Source} → ${t.Destination}`);
          }
          (t.RescheduleResponseTravellerList || []).forEach((trav) => {
            const fullName = `${trav.FirstName || ''} ${trav.LastName || ''}`.trim();
            if (fullName && !allTravellers.includes(fullName)) {
              allTravellers.push(fullName);
            }
          });
        });

        const routeDisplay = tripSectors.length > 0
          ? tripSectors.join(' · ')
          : (sectorDates.map((sd) => sd.sector.replace('-', ' → ')).join(' · ') || 'Flight Reschedule');

        return (
          <div
            key={idx}
            className="group bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200"
          >
            {/* Header: Route, Status & ID */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#78080B] to-[#a01014] flex items-center justify-center text-white shrink-0 shadow-xs">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-800">{routeDisplay}</h4>
                    {item.RescheduleId && (
                      <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
                        #{item.RescheduleId}
                      </span>
                    )}
                  </div>
                  {allTravellers.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-700">
                        {allTravellers.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="self-start sm:self-auto">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.badge}`}>
                  {statusInfo.icon}
                  {statusInfo.label}
                </span>
              </div>
            </div>

            {/* Body: Requested Dates & Reason */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3.5">
              {/* Requested Reschedule Dates */}
              <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-100 space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#78080B]" />
                  Reschedule Date
                </p>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {sectorDates.length > 0 ? (
                    sectorDates.map((sd, sIdx) => (
                      <span
                        key={sIdx}
                        className="inline-flex items-center gap-1.5 bg-white text-slate-700 border border-slate-200 text-xs font-semibold px-2.5 py-1 rounded-lg shadow-2xs"
                      >
                        <span className="text-[#78080B] font-bold">{sd.sector.replace('-', ' → ')}:</span>
                        <span>{sd.formattedDate}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No specific dates listed</span>
                  )}
                </div>
              </div>

              {/* Reason */}
              <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-100 space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  Reschedule Reason
                </p>
                <p className="text-xs text-slate-700 font-medium italic line-clamp-2">
                  "{item.RescheduleReason || 'Reschedule requested by customer'}"
                </p>
              </div>
            </div>

            {/* Charges / Amounts Footer (if present) */}
            {(item.RescheduleCharges != null || item.RescheduledAmount != null || item.SkyvooRescheduleCharge != null) && (
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-600">
                {item.RescheduleCharges != null && (
                  <span>
                    Reschedule Charge: <span className="font-semibold text-slate-800">₹{Number(item.RescheduleCharges).toLocaleString('en-IN')}</span>
                  </span>
                )}
                {item.RescheduledAmount != null && (
                  <span>
                    Rescheduled Amount: <span className="font-semibold text-slate-800">₹{Number(item.RescheduledAmount).toLocaleString('en-IN')}</span>
                  </span>
                )}
                {item.SkyvooRescheduleCharge != null && (
                  <span>
                    Service Fee: <span className="font-semibold text-slate-800">₹{Number(item.SkyvooRescheduleCharge).toLocaleString('en-IN')}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
