export const parsePriceNumber = (val) => {
    if (val === null || val === undefined) return 0;
    if (typeof val === "number") return isNaN(val) ? 0 : val;
    if (typeof val === "string") {
        const cleaned = val.replace(/[^0-9.-]+/g, "");
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    }
    if (typeof val === "object") {
        const nested = val.Amount ?? val.amount ?? val.Value ?? val.value ?? val.Total ?? val.total ?? val.NetFare ?? val.Commission ?? val.Markup;
        if (nested !== undefined && nested !== null && typeof nested !== "object") {
            return parsePriceNumber(nested);
        }
        return 0;
    }
    return 0;
};

export const getFareComponents = (flight) => {
    if (!flight || typeof flight !== "object") {
        return {
            totalFare: 0,
            retailerMarkup: 0,
            skyvooMarkup: 0,
            platformFee: 0,
            commission: 0,
            netFareDirect: 0,
        };
    }

    const priceList = (flight.PriceList && typeof flight.PriceList === "object")
        ? flight.PriceList
        : (flight.TotalPriceList?.[0]?.PriceList && typeof flight.TotalPriceList[0].PriceList === "object")
            ? flight.TotalPriceList[0].PriceList
            : (flight.TotalPriceList?.[0] && typeof flight.TotalPriceList[0] === "object")
                ? flight.TotalPriceList[0]
                : {};

    const retailerMarkup = parsePriceNumber(
        priceList.RetailerMarkup ?? priceList.retailerMarkup ?? flight.RetailerMarkup ?? flight.retailerMarkup ?? 0
    );
    const commission = parsePriceNumber(
        priceList.Commission ?? priceList.commission ?? priceList.NetCommision ?? priceList.netCommision ?? flight.Commission ?? flight.commission ?? flight.NetCommision ?? 0
    );
    const totalFare = parsePriceNumber(
        priceList.TotalFare ?? priceList.totalFare ?? flight.TotalFare ?? flight.totalFare ?? flight.AirlineMinNetPrice ?? flight.AirlineMinPrice ?? 0
    );
    const skyvooMarkup = parsePriceNumber(
        priceList.SkyVooMarkup ?? priceList.SkyvooMarkup ?? priceList.skyvooMarkup ?? priceList.SkyVoomarkup ?? flight.SkyVooMarkup ?? flight.SkyvooMarkup ?? 0
    );
    const platformFee = parsePriceNumber(
        priceList.PlatFormFee ?? priceList.PlatformFee ?? priceList.platformFee ?? flight.PlatFormFee ?? flight.PlatformFee ?? 0
    );
    const netFareDirect = parsePriceNumber(
        priceList.NetFare ?? priceList.netFare ?? flight.NetFare ?? flight.netFare ?? flight.AirlineMinNetPrice ?? 0
    );

    return {
        totalFare,
        retailerMarkup,
        skyvooMarkup,
        platformFee,
        commission,
        netFareDirect,
    };
};

/**
 * Display price shown on flight cards:
 * Formula: TotalFare + RetailerMarkup + SkyVooMarkup + PlatFormFee
 */
export const getFlightDisplayPrice = (flight) => {
    if (!flight || typeof flight !== "object") return 0;
    const { totalFare, retailerMarkup, skyvooMarkup, platformFee } = getFareComponents(flight);
    const calculated = totalFare + retailerMarkup + skyvooMarkup + platformFee;
    if (calculated > 0) {
        return calculated;
    }
    return parsePriceNumber(flight.AirlineMinNetPrice ?? flight.AirlineMinPrice ?? 0);
};

/**
 * B2B Fare breakdown details:
 * Net Fare Formula: TotalFare + SkyVooMarkup + PlatFormFee - Commission
 */
export const getB2BFareBreakdown = (flight) => {
    if (!flight || typeof flight !== "object") return null;
    const {
        totalFare,
        retailerMarkup,
        skyvooMarkup,
        platformFee,
        commission,
        netFareDirect,
    } = getFareComponents(flight);

    const netFare = (totalFare > 0 || skyvooMarkup > 0 || platformFee > 0 || commission > 0)
        ? (totalFare + skyvooMarkup + platformFee - commission)
        : netFareDirect;

    return {
        retailerMarkup,
        commission,
        netFare,
        totalFare,
        skyvooMarkup,
        platformFee,
    };
};
