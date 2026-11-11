import React, { useState } from 'react';
import { Plane, Calendar, Hash, Loader2, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import RescheduleHistory from './RescheduleHistory';

const getStatusInfo = (status) => {
  const norm = String(status || '').trim().toUpperCase();
  if (norm === 'S' || norm === 'CONFIRMED' || norm === 'CONFIRM' || norm === 'SUCCESS' || norm.includes('CONFIRM')) {
    return { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  }
  if (norm === 'F' || norm === 'FAILED' || norm === 'FAIL' || norm.includes('FAIL')) {
    return { label: norm.includes('PAYMENT') ? 'Payment Failed' : 'Failed', color: 'bg-red-100 text-red-700 border-red-200' };
  }
  if (norm === 'C' || norm === 'CANCELLED' || norm === 'CANCEL' || norm.includes('CANCEL')) {
    return { label: 'Cancelled', color: 'bg-rose-100 text-rose-700 border-rose-200' };
  }
  if (norm === 'P' || norm === 'PENDING' || norm === 'QUEUED' || norm === 'UNKNOWN' || norm === 'U' || !norm || norm.includes('PENDING')) {
    return { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200' };
  }
  return { label: status || 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200' };
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
};

const BookingHistory = React.memo(() => {
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState('all'); // 'all' | 'reschedule'

  const {
    data: bookings = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['myBookings'],
    queryFn: async () => {
      const payload = {
        TransactionId: null,
        PNRNumber: null,
        FromDate: null,
        ToDate: null,
        FilterType: null,
      };
      const res = await api.post('/flight/MyBookings', payload);
      if (res.data?.IsSuccess) {
        return res.data.Data ?? [];
      }
      throw new Error(res.data?.ErrorMessage || 'Failed to fetch bookings');
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const {
    data: rescheduleList = [],
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

  const displayedBookings = bookings.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-3xl font-bold mb-1">My Bookings</h3>
            <p className="text-gray-400 text-sm">Your recent journeys and reschedule requests</p>
          </div>

          {/* Sub Tabs Pill Navigation */}
          <div className="inline-flex p-1 bg-slate-100/90 rounded-2xl border border-slate-200/60 self-start sm:self-auto">
            <button
              onClick={() => setActiveSubTab('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${activeSubTab === 'all'
                  ? 'bg-[#78080B] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
            >
              <Plane className="w-3.5 h-3.5" />
              All Bookings
              {bookings.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeSubTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                  {bookings.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSubTab('reschedule')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${activeSubTab === 'reschedule'
                  ? 'bg-[#78080B] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reschedule Bookings
              {rescheduleList.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeSubTab === 'reschedule' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                  {rescheduleList.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* --- TAB 1: ALL BOOKINGS --- */}
        {activeSubTab === 'all' && (
          <>
            {/* Loading */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-[#78080B] animate-spin mb-3" />
                <p className="text-gray-400 text-sm">Loading your bookings...</p>
              </div>
            )}

            {/* Error */}
            {isError && (
              <div className="flex flex-col items-center justify-center py-16">
                <AlertCircle className="w-8 h-8 text-rose-500 mb-3" />
                <p className="text-rose-500 text-sm font-medium">Failed to load bookings</p>
                <p className="text-gray-400 text-xs mt-1">{error?.message}</p>
              </div>
            )}

            {/* Empty */}
            {!isLoading && !isError && bookings.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <Plane className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-gray-400 font-medium">No bookings found</p>
                <p className="text-gray-300 text-sm mt-1">Your booking history will appear here</p>
              </div>
            )}

            {/* Bookings List */}
            {!isLoading && !isError && bookings.length > 0 && (
              <>
                <div className="space-y-3">
                  {displayedBookings.map((booking) => {
                    const statusInfo = getStatusInfo(booking.BookingStatus);
                    return (
                      <div
                        key={booking.FlightTransactionId}
                        onClick={() => {
                          const params = new URLSearchParams({
                            TransactionId: booking.TransactionId || booking.FlightTransactionId || '',
                            BookingId: booking.BookingId || '',
                            BookingStatus: booking.BookingStatus || '',
                            Vendor: booking.Vendor || '',
                            BookingDate: booking.BookingDate || '',
                            ...(booking.AirlinePnrs ? { AirlinePnrs: booking.AirlinePnrs } : {}),
                            ...(booking.TravelDate ? { TravelDate: booking.TravelDate } : {}),
                          });
                          navigate(`/booking-details?${params.toString()}`);
                        }}
                        className="group bg-white/5 hover:bg-white/10 border border-black/10 rounded-2xl p-4 sm:p-5 transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          {/* Left */}
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#78080B] to-[#a01014] flex items-center justify-center flex-shrink-0">
                              <Plane className="w-5 h-5 text-white" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                {booking.BookingId ? (
                                  <span className="text-sm font-bold text-slate-800 truncate">{booking.BookingId}</span>
                                ) : (
                                  <span className="text-sm font-medium text-slate-400 italic">No Booking ID</span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                {booking.AirlinePnrs && (
                                  <span className="flex items-center gap-1">
                                    <Hash className="w-3 h-3" />
                                    PNR: <span className="font-semibold text-[#78080B]">{booking.AirlinePnrs}</span>
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Travel: {formatDate(booking.TravelDate)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right */}
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                            <span className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold border ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            <p className="text-xs text-slate-400">
                              {formatDateTime(booking.BookingDate)}
                            </p>
                          </div>
                        </div>

                        {/* Extra info row */}
                        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400">
                          <span>Vendor: <span className="font-medium text-slate-600">{booking.Vendor || '—'}</span></span>
                          <span>Transaction: <span className="font-medium text-slate-600">#{booking.TransactionId}</span></span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* View All */}
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => navigate('/my-bookings')}
                    className="flex items-center gap-2 bg-[#78080B] hover:bg-[#5a0608] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer shadow-sm hover:shadow"
                  >
                    View All ({bookings.length})
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* --- TAB 2: RESCHEDULE BOOKINGS --- */}
        {activeSubTab === 'reschedule' && (
          <div>
            <RescheduleHistory limit={3} />
            <div className="flex justify-end mt-6">
              <button
                onClick={() => navigate('/my-bookings?tab=reschedule')}
                className="flex items-center gap-2 bg-[#78080B] hover:bg-[#5a0608] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer shadow-sm hover:shadow"
              >
                View All {rescheduleList.length > 0 ? `(${rescheduleList.length})` : ''}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default BookingHistory;
