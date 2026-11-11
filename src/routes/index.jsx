// src/routes/index.jsx
import { Routes, Route } from 'react-router-dom';

import { lazy, Suspense } from 'react';
import PageLoader from "@/components/layout/PageLoader";

import Home from '@/pages/Home/Index';
const FlightSearch = lazy(() => import('@/pages/FlightSearch/Index'));
const CompareFlights = lazy(() => import('@/pages/CompareFlights'));
const ReviewDetails = lazy(() => import('@/pages/ReviewDetails'));
const FlightSeatMap = lazy(() => import('@/pages/FlightSeatMap/Index'));
const Payment = lazy(() => import('@/pages/Payment'));
const Profile = lazy(() => import('@/pages/Profile/Index'));
const BookingLists = lazy(() => import('@/pages/BookingLists'));
const MarkUp = lazy(() => import('@/pages/MarkUp'));
const CouponsAndOffers = lazy(() => import('@/pages/CouponsAndOffers'));
const ComplaintRegister = lazy(() => import('@/pages/ComplaintRegister'));
const Statement = lazy(() => import('@/pages/Statement'));
const FlightReschedule = lazy(() => import('@/pages/FlightReschedule'));
const FlightCancellation = lazy(() => import('@/pages/FlightCancellation'));
const MyBookings = lazy(() => import('@/pages/MyBookings'));
const BookingDetails = lazy(() => import('@/pages/BookingDetails'));
const PaymentCallback = lazy(() => import('@/pages/PaymentCallback'));
const SsoLogin = lazy(() => import('@/pages/SsoLogin'));
const PrintTicketPage = lazy(() => import('@/pages/PrintTicketPage'));

import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

import { FlightFilterProvider } from '@/contexts/FlightFilterContext';
import { CompareProvider } from '@/contexts/CompareContext';

export default function AppRoutes() {
    return (
        <CompareProvider>
            <Suspense fallback={< PageLoader />}>
                <Routes>
                    <Route element={<Layout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/review-details" element={<ReviewDetails />} />
                        <Route path="/flight-seat-map" element={<FlightSeatMap />} />
                        <Route path="/payment" element={<Payment />} />
                        <Route path="/my-profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="/booking-lists" element={<ProtectedRoute><BookingLists /></ProtectedRoute>} />
                        <Route path="/mark-up" element={<ProtectedRoute requireB2B={true}><MarkUp /></ProtectedRoute>} />
                        <Route path="/coupons-and-offers" element={<ProtectedRoute><CouponsAndOffers /></ProtectedRoute>} />
                        <Route path="/complaint-register" element={<ProtectedRoute><ComplaintRegister /></ProtectedRoute>} />
                        <Route path="/statement" element={<ProtectedRoute><Statement /></ProtectedRoute>} />
                        <Route path="/flight-reschedule" element={<ProtectedRoute><FlightReschedule /></ProtectedRoute>} />
                        <Route path="/flight-cancellation" element={<ProtectedRoute><FlightCancellation /></ProtectedRoute>} />
                        <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
                        <Route path="/booking-details" element={<ProtectedRoute><BookingDetails /></ProtectedRoute>} />
                        <Route path="/payment-callback" element={<PaymentCallback />} />
                        <Route path="/payment/callback" element={<PaymentCallback />} />
                        <Route path="/pg-callback" element={<PaymentCallback />} />
                    </Route>

                    {/* Standalone Authentication Route */}
                    <Route path="/sso-login" element={<SsoLogin />} />

                    {/* Without layout */}
                    <Route
                        path="/flight-results"
                        element={
                            <FlightFilterProvider>
                                <FlightSearch />
                            </FlightFilterProvider>
                        }
                    />

                    <Route
                        path="/compare-flights"
                        element={
                            <CompareFlights />
                        }
                    />

                    {/* Standalone Printable E-Ticket Route */}
                    <Route path="/print-ticket" element={<PrintTicketPage />} />

                </Routes>

            </Suspense>
        </CompareProvider>
    );
}