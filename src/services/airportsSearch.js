import api from '@/services/api.js';

// In-memory cache for resolved airport data and in-flight promises
const airportCache = new Map();

export const fetchAirportsByCode = async (airportCode, signal) => {
    const code = String(airportCode || "").trim().toUpperCase();
    if (!code) return [];

    // Return cached result or active promise if already requested
    if (airportCache.has(code)) {
        return airportCache.get(code);
    }

    const fetchPromise = (async () => {
        const res = await api.post(
            `/Flight/ListAirportsByCode?airportCode=${code}`,
            {},          // empty body
            { signal }   // config — abort signal for react-query cancellation
        );

        if (!res.data?.IsSuccess) {
            throw new Error(res.data?.ErrorMessage || "Failed to fetch airports");
        }

        const data = (res.data?.Data || []).map((item) => ({
            airportCode: item.AirportCode,
            airportName: item.AirportName,
            city: item.CityName,
            cityCode: item.CityCode,
            countryCode: item.CountryCode,
            countryName: item.CountryName || (item.CountryCode === 'IND' || item.CountryCode === 'IN' ? 'India' : item.CountryCode),
        }));

        return data;
    })();

    // Store in-flight promise so concurrent callers share the exact same request
    airportCache.set(code, fetchPromise);

    try {
        const result = await fetchPromise;
        // Replace promise with resolved value
        airportCache.set(code, result);
        return result;
    } catch (err) {
        // Remove from cache on error so future retries are possible
        airportCache.delete(code);
        throw err;
    }
};
