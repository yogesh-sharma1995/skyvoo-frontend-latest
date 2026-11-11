import React, { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, X, Plane, Globe, Trash2, AlertCircle, Search, CheckCircle2, Loader2 } from 'lucide-react';
import Select, { components } from 'react-select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api.js';
import { useAuth } from '@/contexts/AuthContext';

function MarkUp() {
    const { user, isB2B: authIsB2B } = useAuth();
    const rawUserType = (user?.UserType || user?.userType || user?.Role || user?.role || "").toLowerCase();
    const isB2C = rawUserType === "b2c";
    const isB2B = (authIsB2B || rawUserType === "b2b") && !isB2C;

    if (isB2C || !isB2B) {
        return <Navigate to="/my-profile" replace />;
    }

    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [markupType, setMarkupType] = useState('location'); // 'location' or 'airline'
    const [selectedTripTypeId, setSelectedTripTypeId] = useState(1);
    const [selectedAirline, setSelectedAirline] = useState(null);
    const [valueType, setValueType] = useState('percentage');
    const [amount, setAmount] = useState('');
    const [formError, setFormError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Fetch Markup Master (Airline list & Trip Type list)
    const {
        data: markupMasterData,
        isLoading: isMarkupMasterLoading,
        error: markupMasterError,
    } = useQuery({
        queryKey: ['markupMaster'],
        queryFn: async () => {
            const response = await api.post('/flight/GetMarkupMaster', {});
            if (!response.data?.IsSuccess) {
                throw new Error(
                    response.data?.ErrorMessage || 'Failed to fetch markup master'
                );
            }
            return response.data;
        },
        staleTime: Infinity,
        refetchOnWindowFocus: false,
    });

    // Fetch Markup List (One-time API call)
    const {
        data: markupListData,
        isLoading: isMarkupListLoading,
        error: markupListError,
        refetch: refetchMarkupList,
    } = useQuery({
        queryKey: ['markupList'],
        queryFn: async () => {
            try {
                const response = await api.post(
                    '/flight/GetMarkupList?markupid=&markupparty=R',
                    {}
                );
                if (!response.data?.IsSuccess) {
                    throw new Error(
                        response.data?.ErrorMessage || 'Failed to fetch markup list'
                    );
                }
                return response.data;
            } catch (err) {
                // Fallback to GET if endpoint is configured as GET
                if (err.response?.status === 405) {
                    const getRes = await api.get(
                        '/flight/GetMarkupList?markupid=&markupparty=R'
                    );
                    if (!getRes.data?.IsSuccess) {
                        throw new Error(
                            getRes.data?.ErrorMessage || 'Failed to fetch markup list'
                        );
                    }
                    return getRes.data;
                }
                throw err;
            }
        },
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    });

    // Airline Options from GetMarkupMaster API
    const airlineOptions = useMemo(() => {
        const list = markupMasterData?.Data?.AirlineDetailList;
        if (Array.isArray(list) && list.length > 0) {
            return list.map((item) => ({
                value: item.CodeListId,
                label: item.CodeListDescription,
                codeListId: item.CodeListId,
            }));
        }
        return [];
    }, [markupMasterData]);

    // Trip Type List (Domestic, International) from GetMarkupMaster API
    const tripTypeList = useMemo(() => {
        const list = markupMasterData?.Data?.TripTypeDetailList;
        if (Array.isArray(list) && list.length > 0) {
            return list;
        }
        return [
            { CodeListId: 1, CodeListDescription: 'Domestic' },
            { CodeListId: 2, CodeListDescription: 'International' },
        ];
    }, [markupMasterData]);

    const markups = useMemo(() => {
        const list = markupListData?.Data;
        if (Array.isArray(list)) {
            return list;
        }
        return [];
    }, [markupListData]);

    // Filter markups by category description
    const filteredMarkups = useMemo(() => {
        if (!searchTerm.trim()) return markups;
        const lower = searchTerm.toLowerCase().trim();
        return markups.filter((item) =>
            (item.CodeListDescription || '').toLowerCase().includes(lower)
        );
    }, [markups, searchTerm]);

    // Mutation for Add/Update Markup API
    const addMarkupMutation = useMutation({
        mutationFn: async (payload) => {
            const response = await api.post('/Flight/AddUpdateMarkup', payload);
            if (!response.data?.IsSuccess) {
                throw new Error(
                    response.data?.ErrorMessage || 'Failed to add markup'
                );
            }
            return response.data;
        },
        onSuccess: (data) => {
            setSuccessMessage(data?.SuccessMessage || 'Markup added successfully!');
            queryClient.invalidateQueries({ queryKey: ['markupList'] });
            refetchMarkupList();
            setTimeout(() => {
                handleCloseModal();
            }, 1000);
        },
        onError: (err) => {
            setFormError(err.message || 'Failed to save markup. Please try again.');
        },
    });

    const handleAddMarkup = () => {
        setFormError(null);
        setSuccessMessage(null);

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setFormError('Please enter a valid markup amount greater than 0.');
            return;
        }

        let codeListId = null;
        if (markupType === 'location') {
            codeListId = selectedTripTypeId || 1;
        } else if (markupType === 'airline') {
            if (!selectedAirline) {
                setFormError('Please select an airline.');
                return;
            }
            codeListId = selectedAirline.value || selectedAirline.codeListId;
        }

        const payload = {
            MarkupAmount: parsedAmount,
            MarkupType: valueType === 'percentage' ? 'P' : 'F',
            CodeListId: codeListId,
            MarkupParty: 'R',
        };

        addMarkupMutation.mutate(payload);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setMarkupType('location');
        setSelectedTripTypeId(1);
        setSelectedAirline(null);
        setValueType('percentage');
        setAmount('');
        setFormError(null);
        setSuccessMessage(null);
    };

    // Custom styles for react-select
    const customSelectStyles = {
        control: (base, state) => ({
            ...base,
            padding: '4px',
            borderWidth: '2px',
            borderColor: state.isFocused ? '#78080B' : '#e5e7eb',
            borderRadius: '0.75rem',
            boxShadow: state.isFocused ? '0 0 0 3px rgba(120, 8, 11, 0.1)' : 'none',
            '&:hover': {
                borderColor: '#78080B'
            }
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
                ? '#78080B'
                : state.isFocused
                    ? '#fee2e2'
                    : 'white',
            color: state.isSelected ? 'white' : '#1f2937',
            padding: '12px 16px',
            cursor: 'pointer',
            '&:active': {
                backgroundColor: '#5c0608'
            }
        }),
        menu: (base) => ({
            ...base,
            borderRadius: '0.75rem',
            overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
        })
    };

    // Custom option component with icon
    const CustomOption = (props) => (
        <components.Option {...props}>
            <div className="flex items-center gap-2">
                <Plane size={16} className="text-[#78080B]" />
                <span>{props.data.label}</span>
            </div>
        </components.Option>
    );

    const formatMarkupAmount = (amount, type) => {
        const num = Number(amount);
        const formattedNum = isNaN(num) ? amount : num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const upperType = type?.toUpperCase();
        if (upperType === 'FIXED' || upperType === 'F') {
            return `₹${formattedNum}`;
        }
        if (upperType === 'PERCENT' || upperType === 'PERCENTAGE' || upperType === 'P') {
            return `${amount}%`;
        }
        return `₹${formattedNum}`;
    };

    const isLocationCategory = (desc) => {
        if (!desc) return false;
        const lower = desc.toLowerCase();
        return lower === 'domestic' || lower === 'international' || lower.includes('domestic') || lower.includes('international');
    };

    return (
        <>
            <div className="relative max-w-7xl mx-auto z-888 px-4 sm:px-6 py-6 sm:py-8">
                {/* Header */}
                <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">
                            Markup Management
                        </h1>
                        <p className="text-gray-600 text-sm sm:text-base">
                            Configure pricing markups for flights and airlines
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {/* Search by Category */}
                        <div className="relative min-w-[240px] sm:w-72">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by airline/category..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#78080B]/20 focus:border-[#78080B] shadow-sm transition-all"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                    title="Clear search"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-[#78080B] text-white px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer whitespace-nowrap"
                        >
                            Add/Update Markup
                        </button>
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm sm:text-base">
                            <thead>
                                <tr className="bg-[#78080B] text-white">
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Airline / Category</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Amount</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isMarkupListLoading ? (
                                    // Loading skeleton
                                    Array.from({ length: 4 }).map((_, index) => (
                                        <tr key={index} className="animate-pulse">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="h-5 bg-gray-200 rounded w-16"></div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="h-8 bg-gray-200 rounded w-8 mx-auto"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : markupListError ? (
                                    // Error State
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="p-3 bg-red-100 text-red-600 rounded-full">
                                                    <AlertCircle size={32} />
                                                </div>
                                                <p className="text-lg font-semibold text-gray-800">
                                                    Failed to load markups
                                                </p>
                                                <p className="text-sm text-gray-500 max-w-md">
                                                    {markupListError.message || 'There was an issue fetching the markup list.'}
                                                </p>
                                                <button
                                                    onClick={() => refetchMarkupList()}
                                                    className="mt-2 px-4 py-2 bg-[#78080B] text-white rounded-lg text-sm font-medium hover:bg-[#5c0608] transition-colors cursor-pointer"
                                                >
                                                    Try Again
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredMarkups.length === 0 ? (
                                    // Empty State
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center gap-3">
                                                <Plane size={48} className="text-gray-300" />
                                                <p className="text-lg font-medium text-gray-800">
                                                    {searchTerm ? `No airline matching "${searchTerm}"` : 'No markups configured yet'}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {searchTerm ? (
                                                        <button
                                                            onClick={() => setSearchTerm('')}
                                                            className="text-[#78080B] hover:underline font-medium cursor-pointer"
                                                        >
                                                            Clear search filter
                                                        </button>
                                                    ) : (
                                                        'Click "Add Markup" to create your first markup rule'
                                                    )}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    // Data Rows
                                    filteredMarkups.map((markup, index) => {
                                        const isFixed = markup.MarkupType?.toUpperCase() === 'FIXED' || markup.MarkupType?.toUpperCase() === 'F';
                                        const isLocation = isLocationCategory(markup.CodeListDescription);

                                        return (
                                            <tr
                                                key={markup.MarkupId || index}
                                                className={`border-b border-gray-100 hover:bg-red-50/60 transition-colors ${index % 2 === 0 ? 'bg-gray-50/60' : 'bg-white'
                                                    }`}
                                            >
                                                {/* Category / Description */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${isLocation ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-[#78080B]'
                                                            }`}>
                                                            {isLocation ? <Globe size={18} /> : <Plane size={18} />}
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-gray-800 block">
                                                                {markup.CodeListDescription || `Code: ${markup.CodeListId}`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Markup Type */}
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${isFixed
                                                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                            }`}
                                                    >
                                                        {isFixed ? 'Fixed' : 'Percentage'}
                                                    </span>
                                                </td>

                                                {/* Amount */}
                                                <td className="px-6 py-4">
                                                    <span className="text-base font-bold text-gray-900">
                                                        {formatMarkupAmount(markup.MarkupAmount, markup.MarkupType)}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                const confirmed = window.confirm(
                                                                    `Are you sure you want to delete this markup?`
                                                                );
                                                                if (confirmed) {
                                                                    // Handle delete action
                                                                }
                                                            }}
                                                            className="p-2 text-red-600 hover:bg-red-100/70 rounded-lg transition-colors cursor-pointer"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-2 sm:p-4 z-9999 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="bg-[#78080B] text-white px-6 py-4 flex justify-between items-center rounded-t-2xl">
                            <h2 className="text-2xl font-bold">Add New Markup</h2>
                            <button
                                onClick={handleCloseModal}
                                disabled={addMarkupMutation.isPending}
                                className="hover:bg-white hover:text-black hover:bg-opacity-20 p-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Feedback alerts */}
                            {formError && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
                                    <AlertCircle size={20} className="shrink-0 text-red-500" />
                                    <span>{formError}</span>
                                </div>
                            )}

                            {successMessage && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 text-sm">
                                    <CheckCircle2 size={20} className="shrink-0 text-green-500" />
                                    <span>{successMessage}</span>
                                </div>
                            )}

                            {/* Markup Type Selection (Location vs Airline) */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Markup Category Type
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setMarkupType('location')}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer ${markupType === 'location'
                                            ? 'border-[#78080B] bg-red-50/60 shadow-md'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <Globe size={30} className={markupType === 'location' ? 'text-[#78080B]' : 'text-gray-400'} />
                                        <span className={`font-semibold text-sm sm:text-base ${markupType === 'location' ? 'text-[#78080B]' : 'text-gray-600'}`}>
                                            Location Based
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMarkupType('airline')}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer ${markupType === 'airline'
                                            ? 'border-[#78080B] bg-red-50/60 shadow-md'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <Plane size={30} className={markupType === 'airline' ? 'text-[#78080B]' : 'text-gray-400'} />
                                        <span className={`font-semibold text-sm sm:text-base ${markupType === 'airline' ? 'text-[#78080B]' : 'text-gray-600'}`}>
                                            Airline Specific
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Location Type (Dynamic from TripTypeDetailList) */}
                            {markupType === 'location' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        Flight Type
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {tripTypeList.map((trip) => (
                                            <label
                                                key={trip.CodeListId}
                                                className={`flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border-2 transition-all ${selectedTripTypeId === trip.CodeListId
                                                    ? 'border-[#78080B] bg-red-50/50'
                                                    : 'border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="tripType"
                                                    value={trip.CodeListId}
                                                    className="w-4 h-4 text-[#78080B] accent-[#78080B]"
                                                    checked={selectedTripTypeId === trip.CodeListId}
                                                    onChange={() => setSelectedTripTypeId(trip.CodeListId)}
                                                />
                                                <span className="font-semibold text-gray-800 text-sm">
                                                    {trip.CodeListDescription}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Airline Selection (Dynamic from AirlineDetailList) */}
                            {markupType === 'airline' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        Select Airline <span className="text-red-500">*</span>
                                    </label>
                                    {markupMasterError && (
                                        <p className="text-xs text-red-500 mb-2">
                                            Failed to load airline list. Please try again.
                                        </p>
                                    )}
                                    <Select
                                        value={selectedAirline}
                                        onChange={setSelectedAirline}
                                        options={airlineOptions}
                                        isLoading={isMarkupMasterLoading}
                                        styles={customSelectStyles}
                                        components={{ Option: CustomOption }}
                                        placeholder={isMarkupMasterLoading ? "Loading airlines..." : "Search and select an airline..."}
                                        noOptionsMessage={() => isMarkupMasterLoading ? "Loading airlines..." : "No airlines found"}
                                        isSearchable
                                        className="text-base"
                                    />
                                </div>
                            )}

                            {/* Value Type */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Markup Value Type
                                </label>
                                <div className="flex gap-4">
                                    <label className={`flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border-2 flex-1 transition-all ${valueType === 'percentage'
                                        ? 'border-emerald-600 bg-emerald-50/50'
                                        : 'border-gray-200 hover:bg-gray-50'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="valueType"
                                            value="percentage"
                                            checked={valueType === 'percentage'}
                                            onChange={(e) => setValueType(e.target.value)}
                                            className="w-4 h-4 text-emerald-600 accent-emerald-600"
                                        />
                                        <span className="font-semibold text-gray-800 text-sm">Percentage (P) %</span>
                                    </label>
                                    <label className={`flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border-2 flex-1 transition-all ${valueType === 'fixed'
                                        ? 'border-blue-600 bg-blue-50/50'
                                        : 'border-gray-200 hover:bg-gray-50'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="valueType"
                                            value="fixed"
                                            checked={valueType === 'fixed'}
                                            onChange={(e) => setValueType(e.target.value)}
                                            className="w-4 h-4 text-blue-600 accent-blue-600"
                                        />
                                        <span className="font-semibold text-gray-800 text-sm">Fixed Amount (F) ₹</span>
                                    </label>
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Markup Amount <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                                        {valueType === 'percentage' ? '%' : '₹'}
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder={valueType === 'percentage' ? 'e.g. 5' : 'e.g. 300'}
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#78080B] focus:ring-2 focus:ring-[#78080B]/10 outline-none transition-all text-gray-800 font-medium"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    disabled={addMarkupMutation.isPending}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddMarkup}
                                    disabled={
                                        !amount ||
                                        (markupType === 'airline' && !selectedAirline) ||
                                        addMarkupMutation.isPending
                                    }
                                    className="flex-1 px-6 py-3 bg-[#78080B] text-white rounded-xl font-semibold hover:bg-[#5c0608] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2"
                                >
                                    {addMarkupMutation.isPending ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <span>Save Markup</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default MarkUp;