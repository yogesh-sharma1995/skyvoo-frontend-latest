import React, { useState, useMemo } from 'react';
import { Plane, Calendar, Hash, Search, Filter, ChevronDown, Check, Clock, X, ArrowLeft, Loader2, AlertCircle, ChevronUp, RefreshCw, User, MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/services/api';
import RescheduleHistory from '@/pages/Profile/components/RescheduleHistory';

const FILTER_TYPES = [
  { value: '', label: 'All Bookings' },
  { value: 'P', label: 'PNR Number' },
  { value: 'BD', label: 'Booking Date' },
  { value: 'TD', label: 'Travel Date' },
  { value: 'T', label: 'Transaction ID' },
];

const getStatusInfo = (status) => {
  const norm = String(status || '').trim().toUpperCase();
  if (norm === 'S' || norm === 'CONFIRMED' || norm === 'CONFIRM' || norm === 'SUCCESS' || norm.includes('CONFIRM')) {
    return { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <Check className="w-3.5 h-3.5" /> };
  }
  if (norm === 'F' || norm === 'FAILED' || norm === 'FAIL' || norm.includes('FAIL')) {
    return { label: norm.includes('PAYMENT') ? 'Payment Failed' : 'Failed', color: 'bg-red-100 text-red-700 border-red-200', icon: <X className="w-3.5 h-3.5" /> };
  }
  if (norm === 'C' || norm === 'CANCELLED' || norm === 'CANCEL' || norm.includes('CANCEL')) {
    return { label: 'Cancelled', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: <X className="w-3.5 h-3.5" /> };
  }
  if (norm === 'P' || norm === 'PENDING' || norm === 'QUEUED' || norm === 'UNKNOWN' || norm === 'U' || !norm || norm.includes('PENDING')) {
    return { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Clock className="w-3.5 h-3.5" /> };
  }
  return { label: status || 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Clock className="w-3.5 h-3.5" /> };
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

function MyBookings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [mainTab, setMainTab] = useState(
    searchParams.get('tab') === 'reschedule' ? 'reschedule' : 'all'
  );

  const [filterType, setFilterType] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [debouncedFilterValue, setDebouncedFilterValue] = useState('');
  const [rescheduleSearch, setRescheduleSearch] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Debounce filter search input
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilterValue(filterValue);
    }, 450);

    return () => {
      clearTimeout(handler);
    };
  }, [filterValue]);

  React.useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTabChange = (tab) => {
    setMainTab(tab);
    setSearchParams(tab === 'reschedule' ? { tab: 'reschedule' } : {});
  };

  const buildPayload = () => {
    const payload = {
      TransactionId: null,
      PNRNumber: null,
      FromDate: null,
      ToDate: null,
      FilterType: null,
    };
    if (filterType && debouncedFilterValue) {
      payload.FilterType = filterType;
      if (filterType === 'P') payload.PNRNumber = debouncedFilterValue;
      else if (filterType === 'T') payload.TransactionId = debouncedFilterValue;
      else if (filterType === 'BD' || filterType === 'TD') {
        payload.FromDate = debouncedFilterValue;
        payload.ToDate = debouncedFilterValue;
      }
    }
    return payload;
  };

  // Flight Bookings Query
  const {
    data: bookings = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['myBookings', filterType, debouncedFilterValue],
    queryFn: async () => {
      const payload = buildPayload();
      const res = await api.post('/flight/MyBookings', payload);
      if (res.data?.IsSuccess) {
        return res.data.Data ?? [];
      }
      throw new Error(res.data?.ErrorMessage || 'Failed to fetch bookings');
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // Reschedule List Query
  const {
    data: rescheduleList = [],
    isLoading: isLoadingReschedule,
    isError: isErrorReschedule,
    error: errorReschedule,
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
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const confirmedCount = bookings.filter(b => b.BookingStatus === 'S').length;
  const pendingCount = bookings.filter(b => b.BookingStatus === 'P').length;
  const cancelledCount = bookings.filter(b => b.BookingStatus === 'C' || b.BookingStatus === 'F').length;

  const reschedPendingCount = rescheduleList.filter(
    r => String(r.RescheduleStatus || '').toUpperCase() === 'R'
  ).length;
  const reschedApprovedCount = rescheduleList.filter(
    r => ['S', 'A', 'CONFIRMED', 'APPROVED'].includes(String(r.RescheduleStatus || '').toUpperCase())
  ).length;

  const clearFilters = () => {
    setFilterType('');
    setFilterValue('');
    setDebouncedFilterValue('');
  };

  return (
    <div className="relative z-10 min-h-screen bg-gray-50 pb-16">
      {/* Top Banner Header */}
      <div className="bg-[#78080B] backdrop-blur-md border-b border-gray-200 sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 text-white">
                <button
                  onClick={() => navigate('/my-profile')}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    {mainTab === 'all' ? 'My Bookings' : 'Reschedule Bookings'}
                  </h1>
                  <p className="mt-1 text-white/70 text-xs sm:text-sm">
                    {mainTab === 'all'
                      ? 'Manage all your flight bookings'
                      : 'View and track your flight reschedule requests'}
                  </p>
                </div>
              </div>
            </div>

            {/* Filter controls for All Bookings Tab */}
            {mainTab === 'all' && (
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Filter Type */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={filterType}
                    onChange={(e) => { setFilterType(e.target.value); setFilterValue(''); }}
                    className="pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent appearance-none bg-white cursor-pointer transition-all text-sm"
                  >
                    {FILTER_TYPES.map(ft => (
                      <option key={ft.value} value={ft.value}>{ft.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                </div>

                {/* Filter Value Input */}
                {filterType && (
                  <div className="relative flex gap-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={filterType === 'BD' || filterType === 'TD' ? 'date' : 'text'}
                      placeholder={
                        filterType === 'P' ? 'Enter PNR...' :
                        filterType === 'T' ? 'Enter Transaction ID...' :
                        'Select date'
                      }
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent w-full sm:w-56 transition-all bg-white text-sm"
                    />
                    {filterValue && (
                      <button
                        onClick={clearFilters}
                        className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm transition cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ========================================================================= */}
        {/* TAB 1: ALL BOOKINGS */}
        {/* ========================================================================= */}
        {mainTab === 'all' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Total</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{bookings.length}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <Plane className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Confirmed</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-1">{confirmedCount}</p>
                  </div>
                  <div className="bg-emerald-100 p-3 rounded-xl">
                    <Check className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Pending</p>
                    <p className="text-3xl font-bold text-amber-600 mt-1">{pendingCount}</p>
                  </div>
                  <div className="bg-amber-100 p-3 rounded-xl">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Cancelled</p>
                    <p className="text-3xl font-bold text-rose-600 mt-1">{cancelledCount}</p>
                  </div>
                  <div className="bg-rose-100 p-3 rounded-xl">
                    <X className="w-6 h-6 text-rose-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="w-10 h-10 text-[#78080B] animate-spin mb-4" />
                <p className="text-gray-400">Loading your bookings...</p>
              </div>
            )}

            {/* Error */}
            {isError && (
              <div className="flex flex-col items-center justify-center py-24">
                <AlertCircle className="w-10 h-10 text-rose-500 mb-4" />
                <p className="text-rose-500 font-medium">Failed to load bookings</p>
                <p className="text-gray-400 text-sm mt-1">{error?.message}</p>
              </div>
            )}

            {/* Empty */}
            {!isLoading && !isError && bookings.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24">
                <Plane className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-400 font-medium text-lg">No bookings found</p>
                <p className="text-gray-300 text-sm mt-1">Your booking history will appear here</p>
              </div>
            )}

            {/* Bookings List */}
            {!isLoading && !isError && bookings.length > 0 && (
              <div className="space-y-4">
                {bookings.map((booking) => {
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
                      className="group bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Left section */}
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#78080B] to-[#a01014] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                            <Plane className="w-6 h-6 text-white" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              {booking.BookingId ? (
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#78080B] transition-colors">{booking.BookingId}</h3>
                              ) : (
                                <h3 className="text-lg font-medium text-gray-400 italic">No Booking ID</h3>
                              )}
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
                                {statusInfo.icon}
                                {statusInfo.label}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                              {booking.AirlinePnrs && (
                                <span className="flex items-center gap-1.5">
                                  <Hash className="w-3.5 h-3.5 text-gray-400" />
                                  PNR: <span className="font-semibold text-[#78080B]">{booking.AirlinePnrs}</span>
                                </span>
                              )}
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                Travel: <span className="font-medium text-gray-700">{formatDate(booking.TravelDate)}</span>
                              </span>
                              <span className="text-gray-400">
                                Vendor: <span className="font-medium text-gray-600">{booking.Vendor || '—'}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right section */}
                        <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-xs text-gray-400 mb-0.5">Booking Date</p>
                            <p className="text-sm font-semibold text-gray-700">{formatDateTime(booking.BookingDate)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400 mb-0.5">Transaction</p>
                            <p className="text-sm font-semibold text-gray-700">#{booking.TransactionId}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: RESCHEDULE BOOKINGS */}
        {/* ========================================================================= */}
        {mainTab === 'reschedule' && (
          <div>
            {/* Stats Cards for Reschedule */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Total Reschedule Requests</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{rescheduleList.length}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <RefreshCw className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">In Review / Requested</p>
                    <p className="text-3xl font-bold text-amber-600 mt-1">{reschedPendingCount}</p>
                  </div>
                  <div className="bg-amber-100 p-3 rounded-xl">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Rescheduled / Completed</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-1">{reschedApprovedCount}</p>
                  </div>
                  <div className="bg-emerald-100 p-3 rounded-xl">
                    <Check className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Reschedule List View */}
            <RescheduleHistory limit={null} isFullPage={true} />
          </div>
        )}
      </div>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 bg-[#78080B] hover:bg-[#5a0608] text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 cursor-pointer z-50"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export default MyBookings;
