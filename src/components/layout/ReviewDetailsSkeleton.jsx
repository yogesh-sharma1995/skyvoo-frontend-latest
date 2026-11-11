import React from "react";

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={`bg-slate-200/80 animate-pulse rounded-md ${className}`}
    />
  );
}

export default function ReviewDetailsSkeleton() {
  return (
    <div className="min-h-screen relative">
      {/* Top Red Header Bar */}
      <div
        className="bg-[#78080B] text-white py-6 px-4 relative z-10"
        style={{ boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.25)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold">
            Complete your booking
          </h1>
          <div className="hidden lg:flex gap-6 text-sm font-medium">
            <span className="text-slate-300">Flights Summary</span>
            <span className="text-slate-300">Traveller Details</span>
            <span className="text-slate-300">Seats</span>
          </div>
        </div>
      </div>

      <div className="relative z-20 pb-14 sm:pb-7 bg-cover bg-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
            {/* Left Column (Main Content - 3 cols) */}
            <div className="order-1 lg:order-1 lg:col-span-3 space-y-4 sm:space-y-6">
              {/* Flight Summary Card */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="p-2 sm:p-4">
                  {/* Route header with blue indicator */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-1 h-16 sm:h-20 bg-blue-500 rounded" />
                      <div>
                        <SkeletonBlock className="h-6 sm:h-7 w-56 sm:w-72 mb-2" />
                        <div className="flex flex-wrap gap-2 mt-1">
                          <SkeletonBlock className="h-5 w-24 rounded-lg" />
                          <SkeletonBlock className="h-5 w-32 rounded-lg" />
                        </div>
                      </div>
                    </div>
                    <SkeletonBlock className="h-6 w-24 rounded bg-[#78080B]/20" />
                  </div>

                  {/* View Fare Rules link */}
                  <SkeletonBlock className="h-4 w-28 mb-4" />

                  {/* Airline row */}
                  <div className="flex items-center gap-3 mb-6">
                    <SkeletonBlock className="w-8 h-8 rounded-full" />
                    <div className="space-y-1">
                      <SkeletonBlock className="h-4 w-32" />
                      <SkeletonBlock className="h-3 w-20" />
                    </div>
                  </div>

                  {/* Flight Times Box */}
                  <div className="bg-[#f4f4f4] p-3 sm:p-4 rounded mb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                      <div className="space-y-1">
                        <SkeletonBlock className="h-6 w-16" />
                        <SkeletonBlock className="h-4 w-24" />
                        <SkeletonBlock className="h-3 w-36" />
                      </div>

                      <div className="flex flex-col items-center justify-center space-y-1">
                        <SkeletonBlock className="h-3 w-16" />
                        <div className="w-full flex items-center gap-1">
                          <div className="h-px flex-1 bg-slate-300" />
                          <SkeletonBlock className="w-3 h-3 rounded-full" />
                          <div className="h-px flex-1 bg-slate-300" />
                        </div>
                        <SkeletonBlock className="h-3 w-20" />
                      </div>

                      <div className="space-y-1 sm:text-right flex flex-col sm:items-end">
                        <SkeletonBlock className="h-6 w-16" />
                        <SkeletonBlock className="h-4 w-24" />
                        <SkeletonBlock className="h-3 w-36" />
                      </div>
                    </div>
                  </div>

                  {/* Baggage Row */}
                  <div className="flex items-center gap-6 pt-2 border-t border-slate-100">
                    <SkeletonBlock className="h-4 w-36" />
                    <SkeletonBlock className="h-4 w-40" />
                  </div>
                </div>
              </div>

              {/* Important Info Card */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 space-y-2">
                <SkeletonBlock className="h-5 w-44 mb-2" />
                <SkeletonBlock className="h-3.5 w-full" />
                <SkeletonBlock className="h-3.5 w-4/5" />
              </div>

              {/* Traveller Details Skeleton */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <SkeletonBlock className="w-5 h-5 rounded" />
                  <SkeletonBlock className="h-5 w-36" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <SkeletonBlock className="h-10 rounded-lg" />
                  <SkeletonBlock className="h-10 rounded-lg" />
                  <SkeletonBlock className="h-10 rounded-lg" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <SkeletonBlock className="h-10 rounded-lg" />
                  <SkeletonBlock className="h-10 rounded-lg" />
                </div>
              </div>
            </div>

            {/* Right Column (Sidebar - Fare Summary - 1 col) */}
            <div className="hidden lg:block order-2 lg:order-2 lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 static lg:sticky lg:top-24 space-y-4">
                <h2 className="text-xl font-bold mb-5">
                  Fare Summary
                </h2>

                {/* Base Fare */}
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-blue-700">
                      Base fare
                    </span>
                    <SkeletonBlock className="h-5 w-20" />
                  </div>
                </div>

                {/* Taxes and Fees */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-base font-semibold text-blue-700">
                      Taxes and fees
                    </span>
                    <SkeletonBlock className="h-5 w-16" />
                  </div>

                  {/* Tax Breakdown */}
                  <div className="space-y-3 pl-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">Other Taxes</span>
                      <SkeletonBlock className="h-4 w-10" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">Fuel Surcharge</span>
                      <SkeletonBlock className="h-4 w-12" />
                    </div>
                  </div>
                </div>

                {/* Sub Total */}
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-blue-700">
                      Sub Total
                    </span>
                    <SkeletonBlock className="h-5 w-20" />
                  </div>
                </div>

                {/* Amount to Pay */}
                <div className="border-t border-slate-200 pt-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-blue-700">
                      Amount to Pay
                    </span>
                    <SkeletonBlock className="h-6 w-24 rounded" />
                  </div>
                </div>

                {/* Additional Pricing Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">Convenience Fee</span>
                    <SkeletonBlock className="h-4 w-10" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">Net Price</span>
                    <SkeletonBlock className="h-4 w-16" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">Commission</span>
                    <SkeletonBlock className="h-4 w-10" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
