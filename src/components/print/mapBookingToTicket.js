/**
 * Helper to parse segment date/time string safely
 */
export const parseDateTime = (dtStr) => {
  if (!dtStr) return null;
  const normalized = String(dtStr).replace('T', ' ').trim();
  const isPM = /pm/i.test(normalized);
  const isAM = /am/i.test(normalized);
  const cleanStr = normalized.replace(/\s*(am|pm)/i, '').trim();
  const parts = cleanStr.split(' ');
  const datePart = parts[0];
  const timePart = parts[1] || '00:00:00';

  let year = new Date().getFullYear(), month = 0, day = 1;

  if (datePart.includes('-')) {
    const dp = datePart.split('-');
    if (dp[0].length === 4) {
      year = parseInt(dp[0], 10);
      month = parseInt(dp[1], 10) - 1;
      day = parseInt(dp[2], 10);
    } else {
      day = parseInt(dp[0], 10);
      month = parseInt(dp[1], 10) - 1;
      year = parseInt(dp[2], 10);
    }
  } else if (datePart.includes('/')) {
    const dp = datePart.split('/');
    if (dp[2].length === 4) {
      const p0 = parseInt(dp[0], 10);
      const p1 = parseInt(dp[1], 10);
      const p2 = parseInt(dp[2], 10);
      if (p0 > 12) {
        day = p0;
        month = p1 - 1;
      } else if (p1 > 12) {
        day = p1;
        month = p0 - 1;
      } else {
        // Standard flight API convention: MM/DD/YYYY
        month = p0 - 1;
        day = p1;
      }
      year = p2;
    } else {
      year = parseInt(dp[0], 10);
      month = parseInt(dp[1], 10) - 1;
      day = parseInt(dp[2], 10);
    }
  }

  const tp = timePart.split(':');
  let hours = parseInt(tp[0], 10) || 0;
  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  const minutes = parseInt(tp[1], 10) || 0;
  const seconds = parseInt(tp[2], 10) || 0;

  const d = new Date(year, month, day, hours, minutes, seconds);
  return isNaN(d.getTime()) ? null : d;
};

export const formatDayDate = (dtStr) => {
  const d = parseDateTime(dtStr);
  if (!d) return dtStr || '—';
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = monthNames[d.getMonth()];
  const day = dayNames[d.getDay()];
  return `${mm} ${dd}, ${day}`;
};

export const formatTime = (dtStr) => {
  if (!dtStr) return '—';
  const parts = String(dtStr).replace('T', ' ').split(' ');
  if (parts[1]) {
    const timeParts = parts[1].split(':');
    return `${timeParts[0]}:${timeParts[1]}`;
  }
  const d = new Date(dtStr);
  if (!isNaN(d)) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  return dtStr;
};

export const formatIssuedDate = (dtStr) => {
  const d = parseDateTime(dtStr) || new Date(dtStr);
  if (!d || isNaN(d.getTime())) return dtStr || '—';
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = monthNames[d.getMonth()];
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${dd}-${mm}-${yyyy} ${hh}:${min}:${ss}`;
};

export const formatDateOfIssue = (dtStr) => {
  if (!dtStr) return '—';
  const d = parseDateTime(dtStr) || new Date(dtStr);
  if (!d || isNaN(d.getTime())) return dtStr || '—';
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = monthNames[d.getMonth()];
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd} ${mm} ${yyyy}, ${hh}:${min}`;
};

export const formatTripTypeSummary = (tripInfos = []) => {
  if (!tripInfos || tripInfos.length === 0) return 'One way';
  const isRound = tripInfos.length > 1;
  if (!isRound) {
    const segCount = tripInfos[0]?.SegmentList?.length || 1;
    const stops = Math.max(0, segCount - 1);
    if (stops === 0) return 'One way, non stop';
    if (stops === 1) return 'One way, connecting (1 stop)';
    return `One way, connecting (${stops} stops)`;
  }
  const outSegs = tripInfos[0]?.SegmentList?.length || 1;
  const retSegs = tripInfos[1]?.SegmentList?.length || 1;
  const outStops = Math.max(0, outSegs - 1);
  const retStops = Math.max(0, retSegs - 1);

  if (outStops === 0 && retStops === 0) {
    return 'Round trip, non stop';
  }
  if (outStops === retStops) {
    if (outStops === 1) return 'Round trip, connecting (1 stop each way)';
    return `Round trip, connecting (${outStops} stops each way)`;
  }
  const outDesc = outStops === 0 ? 'non stop' : `${outStops} stop`;
  const retDesc = retStops === 0 ? 'non stop' : `${retStops} stop`;
  return `Round trip, connecting (${outDesc} outbound, ${retDesc} return)`;
};

export const formatPassengersSummary = (bookingTravellers = [], tripInfos = []) => {
  if (!bookingTravellers || bookingTravellers.length === 0) return '—';
  let adultCount = 0;
  let childCount = 0;
  let infantCount = 0;

  bookingTravellers.forEach((t) => {
    const pt = String(t.PaxType || t.pt || 'ADULT').toUpperCase();
    if (pt === 'CHILD') childCount++;
    else if (pt === 'INFANT') infantCount++;
    else adultCount++;
  });

  const total = bookingTravellers.length;
  const breakdownParts = [];
  if (adultCount > 0) breakdownParts.push(`${adultCount} ${adultCount > 1 ? 'adults' : 'adult'}`);
  if (childCount > 0) breakdownParts.push(`${childCount} ${childCount > 1 ? 'children' : 'child'}`);
  if (infantCount > 0) breakdownParts.push(`${infantCount} ${infantCount > 1 ? 'infants' : 'infant'}`);

  const breakdownStr = breakdownParts.length > 0 ? breakdownParts.join(', ') : `${total} adults`;

  if (tripInfos && tripInfos.length > 1) {
    const isCancelledForTrip = (t, tripIdx) => {
      const pStatus = String(t.Status || t.BookingStatus || t.PassengerStatus || '').toLowerCase();
      if (pStatus.includes('not trav') || pStatus.includes('cancel')) {
        if (t.CancelledTrips && Array.isArray(t.CancelledTrips)) {
          return t.CancelledTrips.includes(tripIdx);
        }
        return true;
      }
      return false;
    };

    const outCount = bookingTravellers.filter((t) => !isCancelledForTrip(t, 0)).length;
    const retCount = bookingTravellers.filter((t) => !isCancelledForTrip(t, 1)).length;

    if (outCount !== total || retCount !== total || outCount !== retCount) {
      return `${total} (${breakdownStr}): ${outCount} outbound, ${retCount} return`;
    }
  }

  return `${total} (${breakdownStr})`;
};

export const resolveSeatCode = (sInfo) => {
  if (!sInfo) return null;
  if (typeof sInfo === 'string' || typeof sInfo === 'number') {
    const str = String(sInfo).trim();
    const match = str.match(/SEAT[-:\s]*([A-Za-z0-9]+)/i);
    return match ? match[1].toUpperCase() : str.replace(/^SEAT[-:\s]*/i, '').trim();
  }
  const desc = sInfo.Description || sInfo.SSR_TypeName || sInfo.description || '';
  if (desc) {
    const matchDesc = String(desc).match(/SEAT[-:\s]*([A-Za-z0-9]+)/i);
    if (matchDesc && matchDesc[1]) {
      return matchDesc[1].toUpperCase();
    }
    if (/^[0-9]+[A-Za-z]$/.test(String(desc).trim())) {
      return String(desc).trim().toUpperCase();
    }
  }
  const code = sInfo.Code || sInfo.SeatNo || sInfo.seat || sInfo.number || '';
  if (code) {
    const cleanCode = String(code).replace(/^SEAT[-:\s]*/i, '').trim();
    if (/^\d+$/.test(cleanCode) && desc) {
      const fullMatch = String(desc).match(/([0-9]+[A-Za-z])/i);
      if (fullMatch && fullMatch[1]) {
        return fullMatch[1].toUpperCase();
      }
    }
    return cleanCode;
  }
  if (desc) {
    return String(desc).replace(/^SEAT[-:\s]*/i, '').trim();
  }
  return null;
};

export const resolveStandardBaggage = (trip, trav) => {
  const paxType = (trav?.PaxType || trav?.pt || 'ADULT').toUpperCase();
  const tripPriceFd = trip?.TotalPriceList?.[0]?.fd;

  let bI = null;
  if (tripPriceFd && typeof tripPriceFd === 'object') {
    const matchedKey = Object.keys(tripPriceFd).find((k) => k.toUpperCase() === paxType) || 'ADULT';
    if (tripPriceFd[matchedKey]?.bI) {
      bI = tripPriceFd[matchedKey].bI;
    }
  }

  // If TotalPriceList didn't have it or had 0s (and not infant), check segment bI
  if (!bI || (!bI.iB && !bI.cB) || (bI.iB === '0' && bI.cB === '0' && paxType !== 'INFANT')) {
    const segs = trip?.SegmentList || [];
    for (const seg of segs) {
      const segBi = seg?.bI?.tI?.[0]?.fd?.bI;
      if (segBi && (segBi.iB !== '0' || segBi.cB !== '0')) {
        bI = segBi;
        break;
      }
    }
  }

  const rawIb = bI?.iB !== undefined && bI?.iB !== null ? String(bI.iB).trim() : (paxType === 'INFANT' ? '0' : '15');
  const rawCb = bI?.cB !== undefined && bI?.cB !== null ? String(bI.cB).trim() : (paxType === 'INFANT' ? '0' : '7');

  const formatBaggage = (val) => {
    if (!val || val === '0') return '0 Kg';
    let cleanVal = String(val).trim();
    if (cleanVal.includes('|')) {
      const parts = cleanVal.split('|').map((s) => s.trim()).filter(Boolean);
      cleanVal = parts[0] || cleanVal;
    }
    return cleanVal.toLowerCase().includes('k') ? cleanVal : `${cleanVal} Kg`;
  };

  return {
    checkIn: formatBaggage(rawIb),
    cabin: formatBaggage(rawCb),
    rawIb,
    rawCb,
  };
};

/**
 * Transforms /flight/BookingDetail API response into props for the ETicket print component
 */
export function mapBookingDetailToTicket(bookingData, loggedInUser = null, printTicketType = 'All') {
  if (!bookingData) return null;

  // Extract raw detail and parsed JSON
  const detail = bookingData.detail || bookingData;
  let parsedResponse = bookingData.parsedResponse;

  if (!parsedResponse && detail?.BookingResponse) {
    try {
      parsedResponse = typeof detail.BookingResponse === 'string'
        ? JSON.parse(detail.BookingResponse)
        : detail.BookingResponse;
    } catch (e) {
      console.error('Error parsing BookingResponse in mapBookingDetailToTicket:', e);
    }
  }

  const order = parsedResponse?.Order || bookingData.order || {};
  const airInfo = parsedResponse?.ItemInfos?.AIR || bookingData.airInfo || {};
  let tripInfos = airInfo?.TripInfos || bookingData.tripInfos || [];
  const bookingTravellers = airInfo?.TravellerInfoList || bookingData.bookingTravellers || [];
  const gstInfo = parsedResponse?.GstInfo || bookingData.gstInfo || {};

  // Filter tripInfos based on printTicketType ("Onward" vs "Return" vs "All")
  if (printTicketType === 'Onward' && tripInfos.length > 0) {
    tripInfos = [tripInfos[0]];
  } else if (printTicketType === 'Return' && tripInfos.length > 1) {
    tripInfos = [tripInfos[1]];
  }

  // ─── 1. Header Props ────────────────────────────────────────────────────────
  const rawStatus = order?.BookingStatus || detail?.BookingStatus || 'CONFIRMED';
  const statusUpper = String(rawStatus).trim().toUpperCase();
  const status = (statusUpper === 'S' || statusUpper === 'SUCCESS')
    ? 'CONFIRMED'
    : (statusUpper === 'F' || statusUpper === 'FAIL' ? 'PAYMENT FAILED' : statusUpper);

  // Extract PNRs by overall trip route (e.g. DEL-GOI : MQEFSF | GOI-DEL : KQM6SS)
  const pnrList = [];

  // Helper to extract overall trip route e.g. "DEL-GOI"
  const getTripFullRoute = (trip) => {
    const segments = trip?.SegmentList || [];
    if (segments.length === 0) return '';
    const first = segments[0]?.da;
    const last = segments[segments.length - 1]?.aa;
    const origin = (first?.code || first?.cityCode || first?.city || '').toUpperCase().trim();
    const destination = (last?.code || last?.cityCode || last?.city || '').toUpperCase().trim();
    return origin && destination ? `${origin}-${destination}` : '';
  };

  if (Array.isArray(tripInfos) && tripInfos.length > 0) {
    tripInfos.forEach((trip, tIdx) => {
      const tripRoute = getTripFullRoute(trip);
      const segments = trip?.SegmentList || [];
      const segmentKeys = segments.map((s) => {
        const d = s.da?.code || s.da?.cityCode || s.da?.city || '';
        const a = s.aa?.code || s.aa?.cityCode || s.aa?.city || '';
        return `${d}-${a}`.toUpperCase().trim();
      });

      let tripPnr = '';

      // Check all travellers for a matching PNR for this trip
      for (const t of bookingTravellers) {
        if (t?.PnrDetails && typeof t.PnrDetails === 'object') {
          // 1. Check if PNR key directly matches overall trip route (e.g. "DEL-GOI")
          for (const [secKey, pnrVal] of Object.entries(t.PnrDetails)) {
            if (!pnrVal) continue;
            const cleanSec = secKey.toUpperCase().replace(/\s+/g, '');
            const cleanTripRoute = tripRoute.replace(/\s+/g, '');
            if (tripRoute && (cleanSec === cleanTripRoute || cleanSec.replace('-', '') === cleanTripRoute.replace('-', ''))) {
              tripPnr = String(pnrVal).trim();
              break;
            }
          }
          if (tripPnr) break;

          // 2. Check if PNR key matches any intermediate segment (e.g. "DEL-BOM" or "GOI-BLR")
          for (const [secKey, pnrVal] of Object.entries(t.PnrDetails)) {
            if (!pnrVal) continue;
            const cleanSec = secKey.toUpperCase().replace(/\s+/g, '');
            const isSegMatch = segmentKeys.some((sk) => {
              const cleanSk = sk.replace(/\s+/g, '');
              return cleanSk === cleanSec || cleanSk.replace('-', '') === cleanSec.replace('-', '');
            });
            if (isSegMatch) {
              tripPnr = String(pnrVal).trim();
              break;
            }
          }
          if (tripPnr) break;
        }
      }

      // 3. Fallback: Check if PnrDetails has entries matching index
      if (!tripPnr && bookingTravellers.length > 0) {
        const firstTrav = bookingTravellers[0];
        if (firstTrav?.PnrDetails && typeof firstTrav.PnrDetails === 'object') {
          const pnrEntries = Object.entries(firstTrav.PnrDetails);
          if (pnrEntries[tIdx]?.[1]) {
            tripPnr = String(pnrEntries[tIdx][1]).trim();
          }
        }
      }

      // 4. Fallback: AirlinePnrs from detail or order
      if (!tripPnr) {
        const globalAirlinePnrs = String(detail?.AirlinePnrs || order?.AirlinePnrs || '').trim();
        if (globalAirlinePnrs) {
          const splitPnrs = globalAirlinePnrs.split(/[,/|]/).map((p) => p.trim()).filter(Boolean);
          if (splitPnrs.length > 1 && splitPnrs[tIdx]) {
            tripPnr = splitPnrs[tIdx];
          } else if (tripInfos.length === 1 && splitPnrs[0]) {
            tripPnr = splitPnrs[0];
          }
        }
      }

      if (tripPnr) {
        const formattedEntry = tripRoute ? `${tripRoute} : ${tripPnr}` : tripPnr;
        if (!pnrList.includes(formattedEntry)) {
          pnrList.push(formattedEntry);
        }
      }
    });
  }

  // Fallback if tripInfos didn't produce PNRs
  if (pnrList.length === 0) {
    bookingTravellers.forEach((t) => {
      if (t?.PnrDetails && typeof t.PnrDetails === 'object') {
        Object.entries(t.PnrDetails).forEach(([sector, pnrVal]) => {
          if (pnrVal && !pnrList.some((p) => p.includes(pnrVal))) {
            pnrList.push(`${sector} : ${pnrVal}`);
          }
        });
      }
    });
  }

  const pnrString = pnrList.length > 0
    ? pnrList.join(' | ')
    : detail?.AirlinePnrs || detail?.BookingId || order?.BookingId || '—';

  const rawGstNo = gstInfo?.GstNumber || gstInfo?.gstNo || gstInfo?.gstNumber || detail?.GstNumber || detail?.gstNo || '';
  const trimmedGst = rawGstNo ? String(rawGstNo).trim() : '';
  const gstNo = (trimmedGst && trimmedGst !== '-' && trimmedGst !== '—' && trimmedGst.toUpperCase() !== 'N/A' && trimmedGst !== 'null' && trimmedGst !== 'undefined')
    ? trimmedGst
    : '';

  // Extract barcode / QR code
  const rawBarcode = detail?.Barcode || bookingData?.Barcode || parsedResponse?.Barcode || detail?.barcode || bookingData?.barcode || '';
  let barcode = '';
  if (rawBarcode && typeof rawBarcode === 'string' && rawBarcode.trim()) {
    const trimmed = rawBarcode.trim();
    if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      barcode = trimmed;
    } else {
      barcode = `data:image/png;base64,${trimmed}`;
    }
  }

  // Extract B2B user type and Agent details
  const bookingUserDetails =
    order?.BookingUserDetails ||
    detail?.BookingUserDetails ||
    detail?.bookingUserDetails ||
    parsedResponse?.BookingUserDetails ||
    {};
  const user = loggedInUser || detail?.User || {};

  const rawUserType = String(
    user?.UserType ||
    user?.userType ||
    bookingUserDetails?.UserType ||
    bookingUserDetails?.userType ||
    user?.Role ||
    user?.role ||
    ''
  ).trim().toUpperCase();

  const isB2B =
    rawUserType === 'B2B' ||
    String(bookingUserDetails?.UserType || '').trim().toUpperCase() === 'B2B' ||
    String(user?.UserType || '').trim().toUpperCase() === 'B2B' ||
    String(user?.Role || '').trim().toUpperCase() === 'B2B';

  const agentName = (
    bookingUserDetails?.OutletName ||
    bookingUserDetails?.Name ||
    bookingUserDetails?.name ||
    user?.agencyName ||
    user?.AgencyName ||
    user?.outletName ||
    user?.OutletName ||
    user?.fullName ||
    user?.FullName ||
    user?.name ||
    ''
  ).trim();

  const agentEmail = (
    bookingUserDetails?.EmailId ||
    bookingUserDetails?.Email ||
    bookingUserDetails?.email ||
    user?.email ||
    user?.Email ||
    ''
  ).trim();

  const agentPhone = (
    bookingUserDetails?.Mobile ||
    bookingUserDetails?.mobile ||
    user?.mobile ||
    user?.phone ||
    user?.Mobile ||
    user?.Phone ||
    ''
  ).trim();

  const headerProps = {
    status,
    transactionId: String(detail?.TransactionId || detail?.FlightTransactionId || order?.TransactionId || '—'),
    pnr: pnrString,
    bookingId: order?.BookingId || detail?.BookingId || '—',
    gstNo,
    issuedDate: formatIssuedDate(order?.BookingCreatedOn || detail?.BookingDate || new Date().toISOString()),
    barcode,
    isB2B,
    userType: rawUserType,
    agentName,
    agentEmail,
    agentPhone,
    customerCare: {
      email: 'support@skyvoo.com',
      phone: '+91 7800 606 780',
    },
  };

  // ─── 1.5 Booking Details (Top Summary Table) ────────────────────────────────
  const contactPersonName = (
    order?.BookingUserDetails?.OutletName ||
    order?.BookingUserDetails?.Name ||
    detail?.BookingUserDetails?.OutletName ||
    (bookingTravellers[0] ? `${bookingTravellers[0].Title || ''} ${bookingTravellers[0].FirstName || ''} ${bookingTravellers[0].LastName || ''}`.trim() : '') ||
    'Customer'
  );

  const rawContactPhone = (
    order?.DeliveryInfo?.Contacts?.[0] ||
    detail?.DeliveryInfo?.Contacts?.[0] ||
    order?.BookingUserDetails?.Mobile ||
    detail?.BookingUserDetails?.Mobile ||
    detail?.ContactNo ||
    detail?.Mobile ||
    ''
  );

  let formattedContactPhone = String(rawContactPhone || '').trim();
  if (formattedContactPhone && !formattedContactPhone.startsWith('+') && formattedContactPhone.length === 10) {
    formattedContactPhone = `+91 ${formattedContactPhone}`;
  }

  const bookingContact = formattedContactPhone
    ? `${contactPersonName}, ${formattedContactPhone}`
    : contactPersonName;

  const bookingEmail = (
    order?.DeliveryInfo?.Emails?.[0] ||
    detail?.DeliveryInfo?.Emails?.[0] ||
    order?.BookingUserDetails?.EmailId ||
    detail?.BookingUserDetails?.EmailId ||
    detail?.Email ||
    '—'
  );

  const isConfirmedStatus = (statusUpper === 'CONFIRMED' || statusUpper === 'OK' || statusUpper === 'SUCCESS' || statusUpper === 'S');
  const statusDisplay = isConfirmedStatus
    ? 'Confirmed'
    : (status || order?.BookingStatus || detail?.BookingStatus || 'Confirmed');

  const bookingProps = {
    pnr: pnrString || order?.BookingId || detail?.BookingId || '—',
    status: statusDisplay,
    dateOfIssue: formatDateOfIssue(order?.BookingCreatedOn || detail?.BookingDate || detail?.BookingCreatedOn || new Date().toISOString()),
    tripType: formatTripTypeSummary(tripInfos),
    issuedBy: isB2B && agentName ? `${agentName} (Skyvoo Partner)` : 'Skyvoo (online booking)',
    passengersSummary: formatPassengersSummary(bookingTravellers, tripInfos),
    bookingContact,
    email: bookingEmail,
    isPaid: isConfirmedStatus || statusUpper.includes('CONFIRM'),
  };

  // ─── 2. Passenger Details ───────────────────────────────────────────────────
  const isMultiTrip = tripInfos.length > 1;

  // Helper to resolve PNR strictly for a specific trip/segment and passenger from API response
  const resolvePassengerTripPnr = (t, trip, tIdx, seg = null) => {
    const tripSegs = trip?.SegmentList || [];
    const segments = seg ? [seg] : tripSegs;
    const tripSectorKeys = segments.map((s) => {
      const d = s.da?.code || s.da?.cityCode || s.da?.city || s.da?.name || '';
      const a = s.aa?.code || s.aa?.cityCode || s.aa?.city || s.aa?.name || '';
      return `${d}-${a}`.toUpperCase();
    });
    if (tripSegs.length > 0) {
      const first = tripSegs[0];
      const last = tripSegs[tripSegs.length - 1];
      const orig = (first?.da?.code || first?.da?.cityCode || first?.da?.city || '').toUpperCase().trim();
      const dest = (last?.aa?.code || last?.aa?.cityCode || last?.aa?.city || '').toUpperCase().trim();
      if (orig && dest) {
        tripSectorKeys.push(`${orig}-${dest}`);
      }
    }

    if (t?.PnrDetails && typeof t.PnrDetails === 'object') {
      // 1. Strict sector key match (e.g. "DEL-GOI" or "GOI-DEL")
      for (const [sector, pnrVal] of Object.entries(t.PnrDetails)) {
        const cleanSec = sector.toUpperCase().replace(/\s+/g, '');
        if (tripSectorKeys.some((sk) => sk === cleanSec || sk.replace('-', '') === cleanSec.replace('-', '')) && pnrVal) {
          return String(pnrVal).trim();
        }
      }
    }

    // For single-trip (one-way) bookings, allow global PNR fallback if present
    if (tripInfos.length === 1) {
      if (t?.PnrDetails && typeof t.PnrDetails === 'object') {
        const firstVal = Object.values(t.PnrDetails)[0];
        if (firstVal) return String(firstVal).trim();
      }
      if (detail?.AirlinePnrs) return String(detail.AirlinePnrs).trim();
      if (order?.AirlinePnrs) return String(order.AirlinePnrs).trim();
    }

    // No cross-trip fallback for multi-trip / round-trip bookings
    return '';
  };

  // Helper to format airline flight numbers like "SJ-203"
  const formatSegmentFlightNo = (seg) => {
    const airlineCode = (seg?.fD?.aI?.code || '').trim();
    const fNo = (seg?.fD?.fN || '').trim();
    if (airlineCode && fNo) {
      return `${airlineCode}-${fNo}`;
    }
    return airlineCode || fNo || '';
  };

  const outboundFlightNo = (tripInfos[0]?.SegmentList || []).map(formatSegmentFlightNo).filter(Boolean).join(' / ');
  const returnFlightNo = (tripInfos[1]?.SegmentList || []).map(formatSegmentFlightNo).filter(Boolean).join(' / ');

  // Helper to format passenger type e.g. "Adult", "Child (9 yrs)", "Infant"
  const formatPaxType = (trav) => {
    const pt = String(trav.PaxType || trav.pt || 'ADULT').toUpperCase();
    if (pt === 'ADULT') return 'Adult';
    if (pt === 'INFANT') return 'Infant';
    if (pt === 'CHILD') {
      if (trav.Age || trav.age) {
        return `Child (${trav.Age || trav.age} yrs)`;
      }
      if (trav.DateOfBirth) {
        try {
          const dob = parseDateTime(trav.DateOfBirth) || new Date(trav.DateOfBirth);
          if (dob && !isNaN(dob.getTime())) {
            const ageDiffMs = Date.now() - dob.getTime();
            const ageDate = new Date(ageDiffMs);
            const years = Math.abs(ageDate.getUTCFullYear() - 1970);
            if (years > 0 && years < 18) {
              return `Child (${years} yrs)`;
            }
          }
        } catch (e) {
          // ignore
        }
      }
      return 'Child';
    }
    return trav.PaxType || 'Adult';
  };

  const allBookingSegments = [];
  tripInfos.forEach((t, tIdx) => {
    (t.SegmentList || []).forEach((seg) => {
      const dC = seg.da?.code || seg.da?.cityCode || seg.da?.city || seg.da?.name || '';
      const aC = seg.aa?.code || seg.aa?.cityCode || seg.aa?.city || seg.aa?.name || '';
      allBookingSegments.push({
        FlightId: String(seg.FlightId || seg.flightId || seg.SegmentId || seg.segmentId || seg.sI || seg.id || t.FlightId || t.flightId || ''),
        SegmentId: String(seg.SegmentId || seg.segmentId || seg.FlightId || seg.flightId || t.SegmentId || t.segmentId || ''),
        depCode: dC,
        arrCode: aC,
        sectorStr: dC && aC ? `${dC} → ${aC}` : (dC || aC || ''),
        tripIndex: tIdx,
      });
    });
  });

  // Helper to extract passenger meal descriptions
  const extractPassengerMeals = (trav) => {
    const mealRaw = trav.ssrMealInfos || trav.SSRMealInfos || {};
    const mealEntries = typeof mealRaw === 'object' && mealRaw !== null ? Object.entries(mealRaw) : [];
    if (mealEntries.length === 0) {
      if (trav.Meal || trav.meal || trav.MealType) {
        return String(trav.Meal || trav.meal || trav.MealType).trim();
      }
      return '—';
    }

    const mealDescriptions = mealEntries.map(([, mInfo]) => {
      const desc = typeof mInfo === 'object'
        ? (mInfo?.Description || mInfo?.Code || mInfo?.MealName || mInfo?.SSR_TypeName)
        : mInfo;
      return desc ? String(desc).trim() : null;
    }).filter(Boolean);

    if (mealDescriptions.length === 0) return '—';
    const uniqueMeals = Array.from(new Set(mealDescriptions));
    return uniqueMeals.length > 0 ? uniqueMeals.join(' / ') : '—';
  };

  // Helper to extract passenger baggage details
  const extractPassengerBaggage = (trav, trip) => {
    const stdBaggage = resolveStandardBaggage(trip, trav);
    const baggageRaw = trav.ssrBaggageInfos || trav.SSRBaggageInfos || {};
    const baggageEntries = typeof baggageRaw === 'object' && baggageRaw !== null ? Object.entries(baggageRaw) : [];

    let extraBaggageStr = '';
    if (baggageEntries.length > 0) {
      extraBaggageStr = baggageEntries.map(([, bInfo]) => {
        const desc = typeof bInfo === 'object' ? (bInfo?.Description || bInfo?.Code) : bInfo;
        return desc ? String(desc).trim() : null;
      }).filter(Boolean).join(', ');
    }

    return {
      checkIn: stdBaggage.checkIn,
      cabin: stdBaggage.cabin,
      extra: extraBaggageStr || null,
    };
  };

  // Helper to extract passenger seats per trip
  const extractTripSeats = (trip, trav, tripIdx) => {
    if (!trip) return '—';

    const pStatus = String(trav.Status || trav.BookingStatus || trav.PassengerStatus || '').toLowerCase();
    if (pStatus.includes('not trav') || pStatus.includes('cancel')) {
      return 'Not travelling';
    }

    const segments = trip.SegmentList || [];
    if (segments.length === 0) return '—';

    const tripSectorKeys = segments.map((s) => {
      const d = s.da?.code || s.da?.cityCode || s.da?.city || s.da?.name || '';
      const a = s.aa?.code || s.aa?.cityCode || s.aa?.city || s.aa?.name || '';
      return `${d}-${a}`.toUpperCase();
    });
    const firstSeg = segments[0];
    const lastSeg = segments[segments.length - 1];
    const depCode = firstSeg?.da?.code || firstSeg?.da?.cityCode || firstSeg?.da?.city || firstSeg?.da?.name || '';
    const arrCode = lastSeg?.aa?.code || lastSeg?.aa?.cityCode || lastSeg?.aa?.city || lastSeg?.aa?.name || '';
    if (depCode && arrCode) {
      tripSectorKeys.push(`${depCode}-${arrCode}`.toUpperCase());
    }

    const tripFlightIds = [
      ...segments.map((s) => String(s.FlightId || s.flightId || s.SegmentId || s.segmentId || s.sI || s.id || '')),
      String(trip.FlightId || trip.flightId || '')
    ].filter(Boolean);

    const tripSegmentIds = [
      ...segments.map((s) => String(s.SegmentId || s.segmentId || s.FlightId || s.flightId || '')),
      String(trip.SegmentId || trip.segmentId || '')
    ].filter(Boolean);

    const seatRaw = trav.ssrSeatInfos || trav.SSRSeatInfos || {};
    const seatEntries = typeof seatRaw === 'object' && seatRaw !== null ? Object.entries(seatRaw) : [];
    const isRawArray = Array.isArray(seatRaw);

    if (seatEntries.length === 0) {
      if (trav.SeatNo || trav.seat) {
        return String(trav.SeatNo || trav.seat).trim();
      }
      return '—';
    }

    const tripSeats = seatEntries.filter(([secKey, sInfo], sIdx) => {
      if (typeof sInfo === 'object' && sInfo?.TripType !== undefined) {
        return Number(sInfo.TripType) === tripIdx;
      }
      const infoKey = typeof sInfo === 'object' && sInfo !== null ? String(sInfo?.Key || sInfo?.SSRKey || sInfo?.FlightId || sInfo?.SegmentId || '') : '';
      const infoSector = typeof sInfo === 'object' && sInfo !== null ? (sInfo?.Sector || sInfo?.sector || sInfo?.Segment || sInfo?.segment || '') : '';
      const sectorCandidate = (secKey && typeof secKey === 'string' && secKey.includes('-'))
        ? secKey
        : (infoSector && typeof infoSector === 'string' && infoSector.includes('-') ? infoSector : '');

      if (sectorCandidate) {
        const cleanSec = sectorCandidate.toUpperCase().replace(/\s+/g, '');
        if (tripSectorKeys.some((sk) => sk === cleanSec || sk.replace('-', '') === cleanSec.replace('-', ''))) {
          return true;
        }
      }
      if (infoKey || secKey) {
        const keyToMatch = String(infoKey || secKey);
        if (tripFlightIds.includes(keyToMatch) || tripSegmentIds.includes(keyToMatch)) {
          return true;
        }
      }
      if (!isRawArray && !isNaN(Number(secKey)) && Number(secKey) >= 0 && Number(secKey) < allBookingSegments.length) {
        return allBookingSegments[Number(secKey)].tripIndex === tripIdx;
      }
      if (tripInfos.length === 1) {
        return true;
      }
      return false;
    });

    // Fallback: If tripSeats is empty but passenger has multiple seat entries in a multi-trip booking
    let resolvedSeats = tripSeats;
    if (resolvedSeats.length === 0 && seatEntries.length > 0) {
      if (tripInfos.length > 1 && seatEntries[tripIdx]) {
        resolvedSeats = [seatEntries[tripIdx]];
      } else if (tripInfos.length === 1 && seatEntries[0]) {
        resolvedSeats = [seatEntries[0]];
      }
    }

    if (resolvedSeats.length === 0) {
      if (trav.SeatNo || trav.seat) {
        return String(trav.SeatNo || trav.seat).trim();
      }
      return '—';
    }

    const isConnectingTrip = segments.length > 1;
    const segmentSeatItems = [];

    segments.forEach((seg, sIdx) => {
      const d = seg.da?.code || seg.da?.cityCode || seg.da?.city || seg.da?.name || '';
      const a = seg.aa?.code || seg.aa?.cityCode || seg.aa?.city || seg.aa?.name || '';
      const segSector = `${d}-${a}`.toUpperCase().replace(/\s+/g, '');
      const segFlightId = String(seg.FlightId || seg.flightId || seg.SegmentId || seg.segmentId || '');
      const segLabel = d && a ? `${d} → ${a}` : segSector;

      const matchedEntry = resolvedSeats.find(([secKey, sInfo]) => {
        const infoKey = typeof sInfo === 'object' && sInfo !== null ? String(sInfo?.Key || sInfo?.SSRKey || sInfo?.FlightId || sInfo?.SegmentId || '') : '';
        const infoSector = typeof sInfo === 'object' && sInfo !== null ? (sInfo?.Sector || sInfo?.sector || sInfo?.Segment || sInfo?.segment || '') : '';
        const sectorCandidate = (secKey && typeof secKey === 'string' && secKey.includes('-'))
          ? secKey
          : (infoSector && typeof infoSector === 'string' && infoSector.includes('-') ? infoSector : '');

        if (sectorCandidate && sectorCandidate.toUpperCase().replace(/\s+/g, '') === segSector) {
          return true;
        }
        if (segFlightId && (infoKey === segFlightId || secKey === segFlightId)) {
          return true;
        }
        return false;
      });

      if (matchedEntry) {
        const code = resolveSeatCode(matchedEntry[1]);
        if (code) {
          segmentSeatItems.push(isConnectingTrip ? `${segLabel}: ${code}` : `Seat ${code}`);
        }
      } else if (!isConnectingTrip && resolvedSeats[sIdx]) {
        const code = resolveSeatCode(resolvedSeats[sIdx][1]);
        if (code) {
          segmentSeatItems.push(`Seat ${code}`);
        }
      }
    });

    if (segmentSeatItems.length > 0) {
      return segmentSeatItems.join(' | ');
    }

    const allSeatCodes = resolvedSeats.map(([secKey, sInfo]) => {
      const code = resolveSeatCode(sInfo);
      if (!code) return null;
      let label = '';
      if (secKey && typeof secKey === 'string' && secKey.includes('-')) {
        label = `${secKey.replace('-', ' → ')}: `;
      }
      return `${label}${code}`;
    }).filter(Boolean);

    return allSeatCodes.length > 0 ? allSeatCodes.join(' | ') : '—';
  };

  const passengers = bookingTravellers.map((t, idx) => {
    const travName = `${t.Title || ''} ${t.FirstName || ''} ${t.LastName || ''}`.trim() || `Passenger ${idx + 1}`;
    const travType = formatPaxType(t);
    const travMeal = extractPassengerMeals(t);
    const travBaggage = extractPassengerBaggage(t, tripInfos[0] || {});
    const outboundSeats = extractTripSeats(tripInfos[0], t, 0);
    const returnSeats = isMultiTrip ? extractTripSeats(tripInfos[1], t, 1) : '—';

    return {
      id: idx + 1,
      name: travName,
      type: travType,
      meal: travMeal,
      baggage: travBaggage,
      outboundSeats,
      returnSeats,
      seats: outboundSeats,
      dob: t.DateOfBirth || '—',
      pnr: resolvePassengerTripPnr(t, tripInfos[0] || {}, 0),
    };
  });

  const passengerProps = {
    title: 'Passenger and Seat Details',
    isRoundTrip: isMultiTrip,
    outboundFlightNo,
    returnFlightNo,
    flightNo: outboundFlightNo,
    passengers,
  };

  // ─── 3. Flight Segments ─────────────────────────────────────────────────────
  const flightSegments = [];
  tripInfos.forEach((trip, tIdx) => {
    const segments = trip.SegmentList || [];
    const tripPriceItem = trip.TotalPriceList?.[0];

    segments.forEach((seg) => {
      const airline = seg.fD?.aI || {};
      const dep = seg.da || {};
      const arr = seg.aa || {};
      const durationMins = seg.duration || 0;
      const dHrs = Math.floor(durationMins / 60);
      const dMins = durationMins % 60;
      const durationStr = `${String(dHrs).padStart(2, '0')} hrs ${String(dMins).padStart(2, '0')} mins`;

      // Baggage info
      const stdBaggage = resolveStandardBaggage(trip, { PaxType: 'ADULT' });
      const checkInBaggage = stdBaggage.checkIn;
      const cabinBaggage = stdBaggage.cabin;
      const travelClass = seg.bI?.tI?.[0]?.fd?.cc || tripPriceItem?.fd?.ADULT?.cc || 'ECONOMY';
      const aircraft = seg.fD?.eT ? (String(seg.fD.eT).startsWith('3') || String(seg.fD.eT).startsWith('7') ? `Aircraft: ${seg.fD.eT}` : seg.fD.eT) : '';

      // Segment PNR
      const depCode = dep.code || dep.cityCode || dep.city || dep.name || '';
      const arrCode = arr.code || arr.cityCode || arr.city || arr.name || '';
      const segKey = `${depCode}-${arrCode}`;
      const firstTrav = bookingTravellers[0] || {};
      const pnr = resolvePassengerTripPnr(firstTrav, trip, tIdx, seg);

      // Format city & airport cleanly
      const depCity = dep.city || dep.name || depCode;
      const arrCity = arr.city || arr.name || arrCode;

      const depCityDisplay = depCity && dep.code && !depCity.includes(dep.code) ? `${depCity} (${dep.code})` : depCity;
      const arrCityDisplay = arrCity && arr.code && !arrCity.includes(arr.code) ? `${arrCity} (${arr.code})` : arrCity;
      const depAirportDisplay = dep.name && dep.name !== dep.city ? dep.name : '';
      const arrAirportDisplay = arr.name && arr.name !== arr.city ? arr.name : '';

      flightSegments.push({
        FlightId: String(seg.FlightId || seg.flightId || seg.SegmentId || seg.segmentId || seg.sI || seg.id || ''),
        SegmentId: String(seg.SegmentId || seg.segmentId || seg.FlightId || seg.flightId || ''),
        sector: `${depCode}-${arrCode}`.toUpperCase(),
        tripIndex: tIdx,
        aircraft,
        airline: {
          name: airline.name || airline.code || 'Airline',
          code: airline.code || '',
          flightNumber: `${airline.code || ''} ${seg.fD?.fN || ''}`.trim(),
          travelClass,
        },
        baggage: {
          checkIn: checkInBaggage,
          cabin: cabinBaggage,
        },
        origin: {
          code: depCode || '—',
          city: depCityDisplay || '—',
          airport: depAirportDisplay,
          terminal: dep.terminal ? (String(dep.terminal).toLowerCase().includes('terminal') ? dep.terminal : `Terminal ${dep.terminal}`) : '',
          date: formatDayDate(seg.dt),
          time: formatTime(seg.dt),
        },
        destination: {
          code: arrCode || '—',
          city: arrCityDisplay || '—',
          airport: arrAirportDisplay,
          terminal: arr.terminal ? (String(arr.terminal).toLowerCase().includes('terminal') ? arr.terminal : `Terminal ${arr.terminal}`) : '',
          date: formatDayDate(seg.at),
          time: formatTime(seg.at),
        },
        duration: durationStr,
        stopType: seg.stops === 0 ? 'Non Stop' : `${seg.stops} Stop`,
        pnr,
        rawDt: seg.dt,
        rawAt: seg.at,
        cT: seg.cT ?? null,
      });
    });
  });

  // Group flight segments by trip journey (Departure vs Return) with connecting flight route support
  const tripFlightGroups = tripInfos.map((trip, tIdx) => {
    const segments = trip.SegmentList || [];
    const tripPriceItem = trip.TotalPriceList?.[0];

    const segList = segments.map((seg) => {
      const airline = seg.fD?.aI || {};
      const dep = seg.da || {};
      const arr = seg.aa || {};
      const durationMins = seg.duration || 0;
      const dHrs = Math.floor(durationMins / 60);
      const dMins = durationMins % 60;
      const durationStr = `${String(dHrs).padStart(2, '0')} hrs ${String(dMins).padStart(2, '0')} mins`;

      const stdBaggage = resolveStandardBaggage(trip, { PaxType: 'ADULT' });
      const checkInBaggage = stdBaggage.checkIn;
      const cabinBaggage = stdBaggage.cabin;
      const travelClass = seg.bI?.tI?.[0]?.fd?.cc || tripPriceItem?.fd?.ADULT?.cc || 'ECONOMY';
      const aircraft = seg.fD?.eT ? (String(seg.fD.eT).startsWith('3') || String(seg.fD.eT).startsWith('7') ? `Aircraft: ${seg.fD.eT}` : seg.fD.eT) : '';

      const firstTrav = bookingTravellers[0] || {};
      const pnr = resolvePassengerTripPnr(firstTrav, trip, tIdx, seg);

      const depCode = dep.code || dep.cityCode || dep.city || dep.name || '';
      const arrCode = arr.code || arr.cityCode || arr.city || arr.name || '';
      const depCity = dep.city || dep.name || depCode;
      const arrCity = arr.city || arr.name || arrCode;

      const depCityDisplay = depCity && dep.code && !depCity.includes(dep.code) ? `${depCity} (${dep.code})` : depCity;
      const arrCityDisplay = arrCity && arr.code && !arrCity.includes(arr.code) ? `${arrCity} (${arr.code})` : arrCity;
      const depAirportDisplay = dep.name && dep.name !== dep.city ? dep.name : '';
      const arrAirportDisplay = arr.name && arr.name !== arr.city ? arr.name : '';

      return {
        FlightId: String(seg.FlightId || seg.flightId || seg.SegmentId || seg.segmentId || seg.sI || seg.id || ''),
        SegmentId: String(seg.SegmentId || seg.segmentId || seg.FlightId || seg.flightId || ''),
        sector: `${depCode}-${arrCode}`.toUpperCase(),
        tripIndex: tIdx,
        aircraft,
        airline: {
          name: airline.name || airline.code || 'Airline',
          code: airline.code || '',
          flightNumber: `${airline.code || ''} ${seg.fD?.fN || ''}`.trim(),
          travelClass,
        },
        baggage: {
          checkIn: checkInBaggage,
          cabin: cabinBaggage,
        },
        origin: {
          code: depCode || '—',
          city: depCityDisplay || '—',
          airport: depAirportDisplay,
          terminal: dep.terminal ? (String(dep.terminal).toLowerCase().includes('terminal') ? dep.terminal : `Terminal ${dep.terminal}`) : '',
          date: formatDayDate(seg.dt),
          time: formatTime(seg.dt),
        },
        destination: {
          code: arrCode || '—',
          city: arrCityDisplay || '—',
          airport: arrAirportDisplay,
          terminal: arr.terminal ? (String(arr.terminal).toLowerCase().includes('terminal') ? arr.terminal : `Terminal ${arr.terminal}`) : '',
          date: formatDayDate(seg.at),
          time: formatTime(seg.at),
        },
        duration: durationStr,
        stopType: seg.stops === 0 ? 'Non Stop' : `${seg.stops} Stop`,
        pnr,
        rawDt: seg.dt,
        rawAt: seg.at,
        cT: seg.cT ?? null,
      };
    });

    // Connecting route summary like: DEL - GOI - BLR
    const routeCodes = [];
    segments.forEach((seg, sIdx) => {
      const d = seg.da?.code || seg.da?.cityCode || seg.da?.city || seg.da?.name;
      const a = seg.aa?.code || seg.aa?.cityCode || seg.aa?.city || seg.aa?.name;
      if (sIdx === 0 && d) routeCodes.push(d);
      if (a) routeCodes.push(a);
    });
    const connectingRouteText = routeCodes.length > 0 ? routeCodes.join(' - ') : '';

    return {
      tripIndex: tIdx,
      title: tIdx === 0 ? 'Departure Flight' : (tIdx === 1 ? 'Return Flight' : `Trip ${tIdx + 1}`),
      route: connectingRouteText,
      segments: segList,
      isConnecting: segList.length > 1,
    };
  });

  const flightProps = {
    flights: flightSegments,
    trips: tripFlightGroups,
  };

  // ─── 4. Ancillary Details ───────────────────────────────────────────────────
  // Compute overall origin -> destination journey route for the booking (e.g. DEL ⇄ GOI)
  const tripRoutes = tripInfos.map((trip) => {
    const segs = trip.SegmentList || [];
    if (segs.length === 0) return '';
    const depCode = segs[0]?.da?.code || segs[0]?.DepartureAirportCode || '';
    const arrCode = segs[segs.length - 1]?.aa?.code || segs[segs.length - 1]?.ArrivalAirportCode || '';
    if (depCode && arrCode) return `${depCode}-${arrCode}`;
    return '';
  }).filter(Boolean);

  const mainJourneySector = tripRoutes.length > 1
    ? (tripRoutes[0] && tripRoutes[1] && tripRoutes[0].split('-')[0] === tripRoutes[1].split('-')[1]
      ? `${tripRoutes[0].split('-')[0]} ⇄ ${tripRoutes[0].split('-')[1]}`
      : tripRoutes.join(', '))
    : (tripRoutes[0] || (flightSegments.length > 0 ? `${flightSegments[0].origin.code}-${flightSegments[flightSegments.length - 1].destination.code}` : 'DEL-GOI'));

  const ancillaries = [];
  bookingTravellers.forEach((trav, idx) => {
    const travName = `${trav.Title || ''} ${trav.FirstName || ''} ${trav.LastName || ''}`.trim() || `Passenger ${idx + 1}`;

    // Get SSR infos
    const seatRaw = trav.ssrSeatInfos || trav.SSRSeatInfos || {};
    const baggageRaw = trav.ssrBaggageInfos || trav.SSRBaggageInfos || {};
    const mealRaw = trav.ssrMealInfos || trav.SSRMealInfos || {};

    const seatMap = typeof seatRaw === 'object' && seatRaw !== null ? Object.entries(seatRaw) : [];
    const baggageMap = typeof baggageRaw === 'object' && baggageRaw !== null ? Object.entries(baggageRaw) : [];
    const mealMap = typeof mealRaw === 'object' && mealRaw !== null ? Object.entries(mealRaw) : [];

    const isSeatRawArray = Array.isArray(seatRaw);
    const defaultSector = mainJourneySector;

    // Extract Extra Baggage description
    let extraBaggageStr = '';
    if (baggageMap.length > 0) {
      extraBaggageStr = baggageMap.map(([sec, bInfo]) => {
        const desc = typeof bInfo === 'object' ? (bInfo?.Description || bInfo?.Code) : bInfo;
        return desc;
      }).filter(Boolean).join(', ');
    }

    // Extract Seats with sector tags
    const seatList = [];
    let seatStr = 'N/A';
    if (seatMap.length > 0) {
      seatMap.forEach(([secKey, sInfo], sIdx) => {
        const seatNo = typeof sInfo === 'object' ? (sInfo?.Code || sInfo?.SeatNo || sInfo?.Description || sInfo?.SSR_TypeName) : sInfo;
        if (!seatNo) return;

        let sectorLabel = '';
        let matchedSeg = null;

        const infoKey = typeof sInfo === 'object' && sInfo !== null ? String(sInfo?.Key || sInfo?.SSRKey || sInfo?.FlightId || sInfo?.SegmentId || '') : '';
        const infoSector = typeof sInfo === 'object' && sInfo !== null ? (sInfo?.Sector || sInfo?.sector || sInfo?.Segment || sInfo?.segment || '') : '';

        // 1. Direct sector match from secKey or sInfo.Sector e.g. "DEL-PNQ", "BLR-DEL"
        const sectorCandidate = (secKey && typeof secKey === 'string' && secKey.includes('-'))
          ? secKey
          : (infoSector && typeof infoSector === 'string' && infoSector.includes('-') ? infoSector : '');

        if (sectorCandidate) {
          const cleanSec = sectorCandidate.toUpperCase().replace(/\s+/g, '');
          matchedSeg = flightSegments.find(
            (seg) => `${seg.origin.code}-${seg.destination.code}`.toUpperCase() === cleanSec
          );
          if (matchedSeg) {
            sectorLabel = `${matchedSeg.origin.code} → ${matchedSeg.destination.code}`;
          } else {
            sectorLabel = sectorCandidate.replace('-', ' → ');
          }
        }

        // 2. Match by FlightId / SegmentId / Key in flightSegments
        if (!matchedSeg && (infoKey || secKey)) {
          const keyToMatch = infoKey || secKey;
          matchedSeg = flightSegments.find(
            (seg) =>
              (seg.FlightId && String(seg.FlightId) === String(keyToMatch)) ||
              (seg.SegmentId && String(seg.SegmentId) === String(keyToMatch)) ||
              (seg.pnr && String(seg.pnr) === String(keyToMatch))
          );
          if (matchedSeg) {
            sectorLabel = `${matchedSeg.origin.code} → ${matchedSeg.destination.code}`;
          }
        }

        // 3. Match by numeric segment index only if secKey was a dictionary key (not array index)
        if (!matchedSeg && !isSeatRawArray && !isNaN(Number(secKey)) && Number(secKey) >= 0 && Number(secKey) < flightSegments.length) {
          matchedSeg = flightSegments[Number(secKey)];
          if (matchedSeg) {
            sectorLabel = `${matchedSeg.origin.code} → ${matchedSeg.destination.code}`;
          }
        }

        // 4. Match by sInfo.TripType if available
        if (!matchedSeg && typeof sInfo === 'object' && sInfo?.TripType !== undefined) {
          const tripIdx = Number(sInfo.TripType);
          const tripSegs = flightSegments.filter((seg) => seg.tripIndex === tripIdx);
          if (tripSegs.length === 1) {
            matchedSeg = tripSegs[0];
            sectorLabel = `${matchedSeg.origin.code} → ${matchedSeg.destination.code}`;
          } else if (tripSegs.length > 0) {
            matchedSeg = tripSegs[sIdx] || tripSegs[0];
            sectorLabel = `${matchedSeg.origin.code} → ${matchedSeg.destination.code}`;
          }
        }

        seatList.push({
          sector: sectorLabel,
          seatNo: String(seatNo).trim(),
        });
      });

      seatStr = seatList.map((st) => (st.sector ? `${st.seatNo} (${st.sector})` : st.seatNo)).join(', ');
    }

    // Extract Meal
    let mealStr = 'N/A';
    if (mealMap.length > 0) {
      mealStr = mealMap.map(([sec, mInfo]) => {
        const desc = typeof mInfo === 'object' ? (mInfo?.Description || mInfo?.Code) : mInfo;
        return desc;
      }).filter(Boolean).join(', ');
    }

    const stdBaggage = resolveStandardBaggage(tripInfos[0], trav);
    const stdCheckIn = stdBaggage.checkIn;
    const stdCabin = stdBaggage.cabin;

    ancillaries.push({
      id: idx + 1,
      name: travName,
      sector: defaultSector,
      baggage: {
        checkIn: stdCheckIn,
        cabin: stdCabin,
        additional: extraBaggageStr || null,
      },
      seat: seatStr || 'N/A',
      seatList,
      meal: mealStr || 'N/A',
    });
  });

  // Grouped Ancillaries by Trip (Departure first, then Return)
  const groupedAncillaries = isMultiTrip
    ? tripInfos.map((trip, tIdx) => {
      const segs = trip.SegmentList || [];
      const first = segs[0];
      const last = segs[segs.length - 1];
      const depCode = first?.da?.code || first?.da?.cityCode || first?.da?.city || first?.da?.name || '';
      const arrCode = last?.aa?.code || last?.aa?.cityCode || last?.aa?.city || last?.aa?.name || '';
      const tripTypeTitle = tIdx === 0 ? 'Departure Flight' : (tIdx === 1 ? 'Return Flight' : `Trip ${tIdx + 1}`);
      const route = depCode && arrCode ? `${depCode} → ${arrCode}` : '';
      const tripSectorKeys = segs.map((s) => {
        const d = s.da?.code || s.da?.cityCode || s.da?.city || s.da?.name || '';
        const a = s.aa?.code || s.aa?.cityCode || s.aa?.city || s.aa?.name || '';
        return `${d}-${a}`.toUpperCase();
      });
      if (depCode && arrCode) {
        tripSectorKeys.push(`${depCode}-${arrCode}`.toUpperCase());
      }
      const tripFlightIds = [
        ...segs.map((s) => String(s.FlightId || s.flightId || s.SegmentId || s.segmentId || s.sI || s.id || '')),
        String(trip.FlightId || trip.flightId || '')
      ].filter(Boolean);
      const tripSegmentIds = [
        ...segs.map((s) => String(s.SegmentId || s.segmentId || s.FlightId || s.flightId || '')),
        String(trip.SegmentId || trip.segmentId || '')
      ].filter(Boolean);

      const isSsrForThisTrip = (secKey, sInfo, sIdx, isRawArray) => {
        if (typeof sInfo === 'object' && sInfo?.TripType !== undefined) {
          return Number(sInfo.TripType) === tIdx;
        }
        const infoKey = typeof sInfo === 'object' && sInfo !== null ? String(sInfo?.Key || sInfo?.SSRKey || sInfo?.FlightId || sInfo?.SegmentId || '') : '';
        const infoSector = typeof sInfo === 'object' && sInfo !== null ? (sInfo?.Sector || sInfo?.sector || sInfo?.Segment || sInfo?.segment || '') : '';
        const sectorCandidate = (secKey && typeof secKey === 'string' && secKey.includes('-'))
          ? secKey
          : (infoSector && typeof infoSector === 'string' && infoSector.includes('-') ? infoSector : '');

        if (sectorCandidate) {
          const cleanSec = sectorCandidate.toUpperCase().replace(/\s+/g, '');
          if (tripSectorKeys.some((sk) => sk === cleanSec || sk.replace('-', '') === cleanSec.replace('-', ''))) {
            return true;
          }
        }
        if (infoKey || secKey) {
          const keyToMatch = String(infoKey || secKey);
          if (tripFlightIds.includes(keyToMatch) || tripSegmentIds.includes(keyToMatch)) {
            return true;
          }
        }
        if (!isRawArray && !isNaN(Number(secKey)) && Number(secKey) >= 0 && Number(secKey) < allBookingSegments.length) {
          return allBookingSegments[Number(secKey)].tripIndex === tIdx;
        }
        return false;
      };

      const tripItems = bookingTravellers.map((trav, idx) => {
        const travName = `${trav.Title || ''} ${trav.FirstName || ''} ${trav.LastName || ''}`.trim() || `Passenger ${idx + 1}`;

        const seatRaw = trav.ssrSeatInfos || trav.SSRSeatInfos || {};
        const baggageRaw = trav.ssrBaggageInfos || trav.SSRBaggageInfos || {};
        const mealRaw = trav.ssrMealInfos || trav.SSRMealInfos || {};

        const seatMap = typeof seatRaw === 'object' && seatRaw !== null ? Object.entries(seatRaw) : [];
        const baggageMap = typeof baggageRaw === 'object' && baggageRaw !== null ? Object.entries(baggageRaw) : [];
        const mealMap = typeof mealRaw === 'object' && mealRaw !== null ? Object.entries(mealRaw) : [];
        const isSeatRawArray = Array.isArray(seatRaw);
        const isBaggageRawArray = Array.isArray(baggageRaw);
        const isMealRawArray = Array.isArray(mealRaw);

        let tripSeatEntries = seatMap.filter(([sec, sInfo], sIdx) => isSsrForThisTrip(sec, sInfo, sIdx, isSeatRawArray));
        if (tripSeatEntries.length === 0 && seatMap.length > 0) {
          if (tripInfos.length > 1 && seatMap[tIdx]) {
            tripSeatEntries = [seatMap[tIdx]];
          } else if (tripInfos.length === 1 && seatMap[0]) {
            tripSeatEntries = [seatMap[0]];
          }
        }

        const tripBaggageEntries = baggageMap.filter(([sec, bInfo], bIdx) => isSsrForThisTrip(sec, bInfo, bIdx, isBaggageRawArray));
        const tripMealEntries = mealMap.filter(([sec, mInfo], mIdx) => isSsrForThisTrip(sec, mInfo, mIdx, isMealRawArray));

        let extraBaggageStr = '';
        if (tripBaggageEntries.length > 0) {
          extraBaggageStr = tripBaggageEntries.map(([sec, bInfo]) => {
            const desc = typeof bInfo === 'object' ? (bInfo?.Description || bInfo?.Code) : bInfo;
            return desc;
          }).filter(Boolean).join(', ');
        }

        const seatList = [];
        if (tripSeatEntries.length > 0) {
          tripSeatEntries.forEach(([secKey, sInfo], sIdx) => {
            const seatNo = typeof sInfo === 'object' ? (sInfo?.Code || sInfo?.SeatNo || sInfo?.Description || sInfo?.SSR_TypeName) : sInfo;
            if (!seatNo) return;
            let sectorLabel = '';
            const cleanSec = (secKey && typeof secKey === 'string' && secKey.includes('-')) ? secKey : (typeof sInfo === 'object' ? sInfo?.Sector || '' : '');
            if (cleanSec && cleanSec.includes('-')) {
              sectorLabel = cleanSec.replace('-', ' → ');
            }
            seatList.push({
              sector: sectorLabel,
              seatNo: String(seatNo).trim(),
            });
          });
        }

        const seatStr = seatList.length > 0
          ? seatList.map((st) => (st.sector ? `${st.seatNo} (${st.sector})` : st.seatNo)).join(', ')
          : 'N/A';

        let mealStr = 'N/A';
        if (tripMealEntries.length > 0) {
          mealStr = tripMealEntries.map(([sec, mInfo]) => {
            const desc = typeof mInfo === 'object' ? (mInfo?.Description || mInfo?.Code) : mInfo;
            return desc;
          }).filter(Boolean).join(', ');
        }

        const stdBaggage = resolveStandardBaggage(trip, trav);
        const stdCheckIn = stdBaggage.checkIn;
        const stdCabin = stdBaggage.cabin;

        return {
          id: idx + 1,
          name: travName,
          sector: route,
          baggage: {
            checkIn: stdCheckIn,
            cabin: stdCabin,
            additional: extraBaggageStr || null,
          },
          seat: seatStr || 'N/A',
          seatList,
          meal: mealStr || 'N/A',
        };
      });

      return {
        tripIndex: tIdx,
        title: tripTypeTitle,
        route,
        items: tripItems,
      };
    })
    : null;

  const ancillaryProps = {
    ancillaries,
    groupedAncillaries,
  };

  // ─── 5. Payment Details ─────────────────────────────────────────────────────
  const fareDetail = airInfo?.TotalPriceInfo?.TotalFareDetail || airInfo?.TotalFareDetail;
  const fC = fareDetail?.fC;
  const afC = fareDetail?.afC;
  const ssrpObj = afC?.SSRP;

  // Calculate Baggage, Meal, Seat SSR total
  let seatTotal = (ssrpObj && typeof ssrpObj === 'object') ? Number(ssrpObj?.SP ?? 0) : 0;
  let baggageTotal = (ssrpObj && typeof ssrpObj === 'object') ? Number(ssrpObj?.BP ?? 0) : 0;
  let mealTotal = (ssrpObj && typeof ssrpObj === 'object') ? Number(ssrpObj?.MP ?? 0) : 0;
  let ssrAmount = Number(fC?.SSRP ?? (seatTotal + baggageTotal + mealTotal)) || 0;

  if (ssrAmount === 0) {
    bookingTravellers.forEach((trav) => {
      if (trav.ssrSeatInfos) {
        Object.values(trav.ssrSeatInfos).forEach((s) => {
          const amt = Number(s?.Amount || s?.price || 0);
          ssrAmount += amt;
        });
      }
      if (trav.ssrBaggageInfos) {
        Object.values(trav.ssrBaggageInfos).forEach((b) => {
          const amt = Number(b?.Amount || b?.price || 0);
          ssrAmount += amt;
        });
      }
      if (trav.ssrMealInfos) {
        Object.values(trav.ssrMealInfos).forEach((m) => {
          const amt = Number(m?.Amount || m?.price || 0);
          ssrAmount += amt;
        });
      }
    });
  }

  const retailerMarkup = Number(detail?.RetailerMarkup || tripInfos[0]?.RetailerMarkup || 0);
  const skyvooMarkup = Number(detail?.SkyvooMarkup || tripInfos[0]?.SkyvooMarkup || 0);
  const transactionFee = Number(detail?.TransactionFee || 0);

  const rawBaseFare = Number(fC?.BF || 0);
  const rawTaxes = Number(fC?.TAF || 0);

  const baseFare = Math.ceil(rawBaseFare + Math.ceil(skyvooMarkup));
  const taxes = Math.ceil(rawTaxes + Math.ceil(retailerMarkup) + transactionFee);
  const totalPaid = baseFare + taxes + Math.ceil(ssrAmount);

  const paymentProps = {
    fare: `₹ ${(Number(baseFare) || 0).toFixed(2)}`,
    taxesAndFees: `₹ ${(Number(taxes) || 0).toFixed(2)}`,
    convenienceFee: `₹ ${(Number(ssrAmount) || 0).toFixed(2)}`,
    totalAmount: `₹ ${(Number(totalPaid) || 0).toFixed(2)}`,
  };

  // ─── 6. Footer Props (No agent info in footer as requested) ──────────────────
  const footerProps = {
    agent: {},
  };

  return {
    headerProps,
    bookingProps,
    passengerProps,
    flightProps,
    ancillaryProps,
    paymentProps,
    footerProps,
  };
}
