import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import ETicket from '@/components/print';
import { generateTicketPdfBlob } from '@/components/print/generateTicketPdf';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function PrintTicketPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const ticketRef = useRef(null);
  const conversionStartedRef = useRef(false);

  const searchParams = new URLSearchParams(location.search);
  const transactionId = searchParams.get('TransactionId') || searchParams.get('FlightTransactionId') || searchParams.get('txId');
  const bookingId = searchParams.get('BookingId');
  const bookingStatus = searchParams.get('BookingStatus') || 'Confirmed';
  const vendor = searchParams.get('Vendor') || 'FF';
  const printType = searchParams.get('type') || searchParams.get('printTicketType') || 'All';

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');

  // Fetch Booking Details from API
  const {
    data: detail,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['printTicketDetail', bookingId, transactionId],
    queryFn: async () => {
      if (!transactionId) {
        throw new Error('No booking transaction details found.');
      }
      const res = await api.post('/flight/BookingDetail', {
        BookingId: bookingId || null,
        TransactionId: Number(transactionId),
        BookingStatus: bookingStatus,
        Vendor: vendor,
      });

      if (res.data?.IsSuccess) {
        return res.data.Data;
      }
      throw new Error(res.data?.ErrorMessage || 'Failed to fetch booking details');
    },
    enabled: !!transactionId,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Set document title
  useEffect(() => {
    if (bookingId || transactionId) {
      document.title = `E-Ticket - ${bookingId || transactionId} | Skyvoo`;
    }
  }, [bookingId, transactionId]);

  // Convert ticket to PDF Blob once data is ready
  useEffect(() => {
    if (!detail || conversionStartedRef.current) return;
    conversionStartedRef.current = true;

    const convertToPdf = async () => {
      try {
        setIsGeneratingPdf(true);
        // Wait for fonts and airline logos to load in the DOM
        await new Promise((resolve) => setTimeout(resolve, 500));

        const ticketElem = document.getElementById('skyvoo-eticket') || ticketRef.current;
        if (!ticketElem) {
          throw new Error('Ticket container element not found');
        }

        const blob = await generateTicketPdfBlob(ticketElem);
        const url = URL.createObjectURL(blob);

        // Open in browser's native PDF viewer
        window.location.replace(url);
      } catch (err) {
        console.error('PDF generation error:', err);
        setPdfError(err?.message || 'Failed to generate PDF ticket');
        setIsGeneratingPdf(false);
      }
    };

    convertToPdf();
  }, [detail]);

  if (isLoading || isGeneratingPdf) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white relative">
        <Loader2 className="w-12 h-12 animate-spin text-red-500 mb-4" />
        <h2 className="text-lg font-bold">Generating PDF Ticket...</h2>
        <p className="text-xs text-slate-400 mt-1">Please wait while we render your E-Ticket in PDF viewer</p>

        {/* In-DOM rendered ticket for html-to-image capture */}
        {detail && (
          <div
            className="fixed top-0 left-0 -z-50 opacity-100 pointer-events-none w-[850px] bg-white text-left text-slate-800"
            style={{ overflow: 'visible', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <ETicket
              ref={ticketRef}
              bookingData={detail}
              user={user}
              printTicketType={printType}
              showPrintButton={false}
            />
          </div>
        )}
      </div>
    );
  }

  if (isError || !detail || pdfError) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-slate-200">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800">Unable to Load Ticket</h2>
          <p className="text-xs text-slate-600 mt-2 bg-red-50 p-3 rounded-lg border border-red-100 leading-relaxed">
            {pdfError || error?.message || 'Booking transaction not found.'}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#a31d24] text-white text-xs font-bold rounded-xl hover:bg-[#88141a] transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-100">
      <ETicket
        ref={ticketRef}
        bookingData={detail}
        user={user}
        printTicketType={printType}
        showPrintButton={true}
      />
    </div>
  );
}
