import React, { useState, useCallback, lazy, Suspense } from 'react';
import CompactFlightCard from './CompactFlightCard.jsx';

const ViewFlightDetails = lazy(() => import('./ViewFlightDetails'));

function RoundTripFlightRow({
    outboundFlight,
    returnFlight,
    onToggleCompare,
    onViewPrices,
    selectedOutbound,
    selectedReturn,
    onSelectOutbound,
    onSelectReturn,
    showFareBreakdown,
}) {
    const isOutboundSelected =
        !!outboundFlight &&
        selectedOutbound?.AirlineCodeAndId === outboundFlight?.AirlineCodeAndId;
    const isReturnSelected =
        !!returnFlight &&
        selectedReturn?.AirlineCodeAndId === returnFlight?.AirlineCodeAndId;
    // null | 'outbound' | 'return'
    const [openDetails, setOpenDetails] = useState(null);

    const handleToggle = useCallback((leg) => {
        setOpenDetails(prev => prev === leg ? null : leg);
    }, []);

    return (
        <div className="rounded-2xl">

            {/* ---- Two compact cards side by side ---- */}
            <div className="flex flex-row gap-2 sm:gap-3">
                <CompactFlightCard
                    flight={outboundFlight}
                    label="DEPARTURE"
                    isDetailsOpen={openDetails === 'outbound'}
                    onToggleDetails={() => handleToggle('outbound')}
                    isSelected={isOutboundSelected}
                    onSelect={onSelectOutbound}
                    showFareBreakdown={showFareBreakdown}
                />
                <CompactFlightCard
                    flight={returnFlight}
                    label="RETURN"
                    isDetailsOpen={openDetails === 'return'}
                    onToggleDetails={() => handleToggle('return')}
                    isSelected={isReturnSelected}
                    onSelect={onSelectReturn}
                    showFareBreakdown={showFareBreakdown}
                />
            </div>

            {/* ---- Flight Details Modal ---- */}
            {openDetails === 'outbound' && (
                <Suspense fallback={null}>
                    <ViewFlightDetails flight={outboundFlight} onClose={() => handleToggle(null)} />
                </Suspense>
            )}
            {openDetails === 'return' && (
                <Suspense fallback={null}>
                    <ViewFlightDetails flight={returnFlight} onClose={() => handleToggle(null)} />
                </Suspense>
            )}

        </div>
    );
}

export default React.memo(RoundTripFlightRow);
