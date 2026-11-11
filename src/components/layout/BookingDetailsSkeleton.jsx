import React from 'react';
import { Plane, User, Receipt, Clock, Luggage, Utensils, ShieldCheck } from 'lucide-react';

function SkeletonBlock({ className = "" }) {
  return (
    <div className={`bg-slate-200/70 animate-pulse rounded-xl ${className}`} />
  );
}

export default function BookingDetailsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Status Card Skeleton */}
      <div className="bg-gradient-to-r from-[#78080B] to-[#a01014] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-6 -translate-y-6">
          <Plane className="w-64 h-64 rotate-45" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-3.5 w-32 bg-white/20 animate-pulse rounded" />
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-44 bg-white/30 animate-pulse rounded-xl" />
              <div className="w-6 h-6 rounded-full bg-white/20 animate-pulse" />
            </div>
            <div className="h-4 w-40 bg-white/20 animate-pulse rounded" />
          </div>
          <div className="text-left sm:text-right space-y-1.5 shrink-0">
            <div className="h-3 w-20 bg-white/20 animate-pulse rounded sm:ml-auto" />
            <div className="h-6 w-16 bg-white/30 animate-pulse rounded-lg sm:ml-auto" />
          </div>
        </div>
      </div>

      {/* Actions Bar & Booking Date Skeleton */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <SkeletonBlock className="h-10 w-32" />
            <SkeletonBlock className="h-10 w-32" />
            <SkeletonBlock className="h-10 w-32" />
          </div>
          <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl shrink-0">
            <div className="w-7 h-7 bg-amber-100/70 rounded-lg animate-pulse" />
            <div className="space-y-1">
              <SkeletonBlock className="h-2.5 w-16" />
              <SkeletonBlock className="h-4 w-28" />
            </div>
          </div>
        </div>
      </div>

      {/* Flight Segment Route Card Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-[#78080B] px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-bold">Flight Segment Route Details</span>
          </div>
          <div className="h-5 w-20 bg-white/20 rounded-full animate-pulse" />
        </div>

        <div className="p-5 space-y-5">
          {/* Airline & PNR Top Header */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <SkeletonBlock className="h-5 w-28" />
              <SkeletonBlock className="h-5 w-16 rounded" />
            </div>
            <SkeletonBlock className="h-5 w-24" />
          </div>

          {/* Departure / Route / Arrival Grid */}
          <div className="flex items-center gap-4">
            <div className="w-28 text-left space-y-1.5">
              <SkeletonBlock className="h-8 w-16" />
              <SkeletonBlock className="h-3.5 w-24" />
              <SkeletonBlock className="h-4 w-16 mt-1" />
              <SkeletonBlock className="h-3 w-20" />
            </div>

            <div className="flex-1 flex flex-col items-center gap-1.5">
              <SkeletonBlock className="h-3 w-14" />
              <div className="w-full flex items-center gap-1">
                <div className="h-px flex-1 bg-slate-200" />
                <Plane className="w-4 h-4 text-slate-300" />
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <SkeletonBlock className="h-3 w-16" />
            </div>

            <div className="w-28 text-right flex flex-col items-end space-y-1.5">
              <SkeletonBlock className="h-8 w-16" />
              <SkeletonBlock className="h-3.5 w-24" />
              <SkeletonBlock className="h-4 w-16 mt-1" />
              <SkeletonBlock className="h-3 w-20" />
            </div>
          </div>

          {/* Inclusions Strip */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-4 w-24" />
            </div>
            <SkeletonBlock className="h-4 w-32" />
          </div>
        </div>
      </div>

      {/* Passenger Details Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-[#78080B] px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-bold">Passenger Details & Add-ons</span>
          </div>
          <div className="h-5 w-24 bg-white/20 rounded-full animate-pulse" />
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center animate-pulse" />
              <div className="space-y-1.5">
                <SkeletonBlock className="h-5 w-44" />
                <div className="flex gap-2">
                  <SkeletonBlock className="h-3.5 w-16" />
                  <SkeletonBlock className="h-3.5 w-24" />
                </div>
              </div>
            </div>
            <SkeletonBlock className="h-10 w-32 rounded-xl" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 space-y-2">
              <SkeletonBlock className="h-3.5 w-24" />
              <SkeletonBlock className="h-6 w-32 rounded-md" />
            </div>
            <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 space-y-2">
              <SkeletonBlock className="h-3.5 w-24" />
              <SkeletonBlock className="h-6 w-full rounded-md" />
            </div>
            <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 space-y-2">
              <SkeletonBlock className="h-3.5 w-24" />
              <SkeletonBlock className="h-6 w-36 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Summary Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-[#78080B] px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-bold">Fare & Add-on Pricing Summary</span>
          </div>
          <SkeletonBlock className="h-4 w-24 bg-white/20" />
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-2">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="h-6 w-28" />
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5">
              <SkeletonBlock className="h-3 w-28" />
              <SkeletonBlock className="h-6 w-28" />
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5">
              <SkeletonBlock className="h-3 w-28" />
              <SkeletonBlock className="h-6 w-28" />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <SkeletonBlock className="h-5 w-32" />
            <SkeletonBlock className="h-7 w-36" />
          </div>
        </div>
      </div>
    </div>
  );
}
