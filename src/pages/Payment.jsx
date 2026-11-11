import React, { useState } from 'react';
import { ChevronRight, Plane, Clock, User, Mail, Phone, Shield, Settings, CreditCard, Smartphone, Building2, Wallet, Gift, QrCode, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import Bhim from '@/assets/imgs/upiIcons/bhim.png'
import Gpay from '@/assets/imgs/upiIcons/gpay.png'
import Paytm from '@/assets/imgs/upiIcons/paytm.avif'
import Phonepe from '@/assets/imgs/upiIcons/phonepe.webp'
import MYQR from '@/assets/imgs/upiIcons/myqr.png'

const flight = {
    from: "Delhi (DEL)",
    to: "Osaka (KIX)",
    airline: "Adarsh Joshi",
    date: "Fri, 7 Nov'25",
    departure: "12:40 AM",
    arrival: "8:30 AM",
    duration: "28h 20m",
    stops: "1 stop",
    email: "adarshjoshi200513@gmail.com",
    phone: "+91-9667479529",
    flightNumber: "AF-2847",
    class: "Economy",
    baggage: "15 Kg (1 piece only)"
};

const pricing = {
    fare: 31766,
    convenienceFee: 1599,
    discount: 1588,
    protectionFee: 399
};

const upiOptions = [
    { id: Gpay, name: 'Google Pay', icon: '🟢' },
    { id: Phonepe, name: 'PhonePe', icon: '🟣' },
    { id: Paytm, name: 'Paytm', icon: '🔵' },
    { id: Bhim, name: 'BHIM UPI', icon: '🟠' }
];

const cardTypes = [
    { id: 'credit', name: 'Credit Card' },
    { id: 'debit', name: 'Debit Card' }
];

const banks = [
    { id: 'hdfc', name: 'HDFC Bank' },
    { id: 'icici', name: 'ICICI Bank' },
    { id: 'sbi', name: 'State Bank of India' },
    { id: 'axis', name: 'Axis Bank' },
    { id: 'kotak', name: 'Kotak Mahindra Bank' }
];

const paymentMethods = [
    {
        id: 'upi',
        name: 'UPI Options',
        description: 'Pay Directly From Your Bank Account',
        icon: <Smartphone className="w-6 h-6 text-purple-600" />
    },
    {
        id: 'card',
        name: 'Credit & Debit Cards',
        description: 'Visa, Mastercard, Amex, Rupay and more',
        icon: <CreditCard className="w-6 h-6 text-blue-600" />
    },
    {
        id: 'emi',
        name: 'EMI',
        description: 'Credit/Debit Card & Cardless EMI available',
        icon: <CreditCard className="w-6 h-6 text-green-600" />,
        badge: 'NO COST EMI'
    },
    {
        id: 'netbanking',
        name: 'Net Banking',
        description: '40+ Banks Available',
        icon: <Building2 className="w-6 h-6 text-orange-600" />
    },
    {
        id: 'paylater',
        name: 'Pay Later',
        description: 'Lazypay, Amazon',
        icon: <Clock className="w-6 h-6 text-pink-600" />
    },
    {
        id: 'giftcard',
        name: 'Gift Cards & e-wallets',
        description: 'MMT Gift cards & Amazon Pay',
        icon: <Gift className="w-6 h-6 text-red-600" />
    }
];

export default function FlightPaymentPage() {
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [addProtection, setAddProtection] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [expandedPayment, setExpandedPayment] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Payment sub-options
    const [selectedUPI, setSelectedUPI] = useState(null);
    const [selectedCard, setSelectedCard] = useState(null);
    const [selectedBank, setSelectedBank] = useState(null);

    const calculateTotal = () => {
        let total = pricing.fare + pricing.convenienceFee - pricing.discount;
        if (addProtection) total += pricing.protectionFee;
        return total;
    };

    const handlePaymentSelect = (methodId) => {
        setSelectedPayment(methodId);
        setExpandedPayment(expandedPayment === methodId ? null : methodId);
        // Reset sub-selections when switching payment methods
        setSelectedUPI(null);
        setSelectedCard(null);
        setSelectedBank(null);
    };

    const handleProceedPayment = () => {
        setIsProcessing(true);
        // Simulate payment processing
        setTimeout(() => {
            setIsProcessing(false);
            setShowSuccessModal(true);
            try {
                localStorage.removeItem("skyvoo_booking");
                sessionStorage.removeItem("skyvoo_booking");
            } catch (e) {
                // ignore
            }
        }, 2000);
    };

    return (
        <>
            <div className="max-w-7xl mx-auto relative z-100 px-3 sm:px-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Section */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Flight Card */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-red-600 rounded flex items-center justify-center">
                                        <Plane className="w-6 h-6 text-white" />
                                    </div>
                                    {/* <img src={AirlineLogo} alt="airline logo" /> */}

                                    <div>
                                        <h2 className="text-sm xs:text-lg font-bold text-gray-900">
                                            {flight.from} → {flight.to}
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] xs:text-sm text-gray-600 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {flight.date}
                                            </span>
                                            <span>{flight.departure} — {flight.arrival}</span>
                                            <span className="text-gray-500">({flight.duration})</span>
                                            <span className="bg-gray-100 px-2 py-1 rounded text-xs">{flight.stops}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors flex items-center gap-1"
                                >
                                    VIEW DETAILS
                                    {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* Expandable Flight Details */}
                            {showDetails && (
                                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-in slide-in-from-top">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-600">Flight Number</p>
                                            <p className="font-semibold">{flight.flightNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Class</p>
                                            <p className="font-semibold">{flight.class}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Baggage</p>
                                            <p className="font-semibold">{flight.baggage}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Status</p>
                                            <p className="font-semibold text-green-600">Confirmed</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 pt-4 border-t">
                                <span className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    {flight.airline} (Primary)
                                </span>
                                <span className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    {flight.email}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    {flight.phone}
                                </span>
                            </div>
                        </div>

                        {/* Payment Options */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Payment Options</h3>
                            <div className="space-y-2">
                                {paymentMethods.map((method) => (
                                    <div key={method.id}>
                                        <button
                                            onClick={() => handlePaymentSelect(method.id)}
                                            className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-lg border-2 transition-all ${selectedPayment === method.id
                                                ? 'border-blue-600 bg-blue-50 shadow-md'
                                                : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                {method.icon}
                                                <div className="text-left">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-gray-900">{method.name}</h4>
                                                        {method.badge && (
                                                            <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                                                {method.badge}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600">{method.description}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className={`w-5 h-5 transition-transform 
                                                ${expandedPayment === method.id ? 'rotate-90' : ''} 
                                                ${selectedPayment === method.id ? 'text-blue-600' : 'text-gray-400'}`}
                                            />
                                        </button>

                                        {/* Expanded Payment Options */}
                                        {expandedPayment === method.id && (
                                            <div className="mt-2 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 animate-in slide-in-from-top">

                                                {method.id === 'upi' && (
                                                    <div className="space-y-2">
                                                        <p className="text-sm font-semibold text-gray-700 mb-3">Select UPI App</p>
                                                        {upiOptions.map((upi) => (
                                                            <button
                                                                key={upi.id}
                                                                onClick={() => setSelectedUPI(upi.id)}
                                                                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${selectedUPI === upi.id
                                                                    ? 'border-purple-600 bg-purple-50'
                                                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                                                    }`}
                                                            >
                                                                <img src={upi.id} className='w-8 h-8 object-contain' alt="" />
                                                                <span className="font-medium">{upi.name}</span>
                                                                {selectedUPI === upi.id && (
                                                                    <Check className="w-5 h-5 text-purple-600 ml-auto" />
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {method.id === 'card' && (
                                                    <div className="space-y-2">
                                                        <p className="text-sm font-semibold text-gray-700 mb-3">Select Card Type</p>
                                                        {cardTypes.map((card) => (
                                                            <button
                                                                key={card.id}
                                                                onClick={() => setSelectedCard(card.id)}
                                                                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${selectedCard === card.id
                                                                    ? 'border-blue-600 bg-blue-50'
                                                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                                                    }`}
                                                            >
                                                                <CreditCard className="w-5 h-5" />
                                                                <span className="font-medium">{card.name}</span>
                                                                {selectedCard === card.id && (
                                                                    <Check className="w-5 h-5 text-blue-600 ml-auto" />
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {method.id === 'netbanking' && (
                                                    <div className="space-y-2">
                                                        <p className="text-sm font-semibold text-gray-700 mb-3">Select Your Bank</p>
                                                        {banks.map((bank) => (
                                                            <button
                                                                key={bank.id}
                                                                onClick={() => setSelectedBank(bank.id)}
                                                                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${selectedBank === bank.id
                                                                    ? 'border-orange-600 bg-orange-50'
                                                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                                                    }`}
                                                            >
                                                                <Building2 className="w-5 h-5" />
                                                                <span className="font-medium">{bank.name}</span>
                                                                {selectedBank === bank.id && (
                                                                    <Check className="w-5 h-5 text-orange-600 ml-auto" />
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {(method.id === 'emi' || method.id === 'paylater' || method.id === 'giftcard') && (
                                                    <div className="text-center py-4">
                                                        <p className="text-gray-600 mb-3">Enter your details to proceed</p>
                                                        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                                                            Continue with {method.name}
                                                        </button>
                                                    </div>
                                                )}

                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="lg:col-span-1">
                        {/* Gradient Border Wrapper */}
                        <div className="p-[2px] rounded-lg bg-gradient-to-r from-[#78080B] to-[#B20000] lg:sticky lg:top-4">

                            {/* Actual Card */}
                            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">

                                <div className='flex justify-between mb-3'>
                                    <h3 className="text-2xl font-bold text-gray-900 flex justify-center items-center">
                                        Total Due
                                    </h3>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        <span className="text-blue-600">₹{calculateTotal().toLocaleString()}</span>
                                    </h3>
                                </div>

                                <div className="space-y-3 mb-6 pb-6 border-b border-[#B8B6B6]">
                                    <div className="flex justify-between text-gray-700">
                                        <span>Fare</span>
                                        <span>₹{pricing.fare.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-700">
                                        <span>Convenience Fee</span>
                                        <span>₹{pricing.convenienceFee.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <span>SKYVOOOFF</span>
                                        <span>-₹{pricing.discount.toLocaleString()}</span>
                                    </div>

                                    {addProtection && (
                                        <div className="flex justify-between text-gray-700 animate-in slide-in-from-right">
                                            <span className="flex items-center gap-1">
                                                <Shield className="w-4 h-4 text-green-600" />
                                                Protection Fee
                                            </span>
                                            <span>₹{pricing.protectionFee.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Scan to Pay */}
                                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 mb-6 border border-blue-200">
                                    <h4 className="font-bold text-gray-900 mb-2">Scan to Pay</h4>
                                    <p className="text-xs text-gray-600 mb-3">Instant Refund & High Success Rate</p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <img src={Bhim} className="w-8 h-8 object-contain" />
                                            <img src={Gpay} className="w-8 h-8 object-contain" />
                                            <img src={Phonepe} className="w-8 h-8 object-contain" />
                                            <img src={Paytm} className="w-8 h-8 object-contain" />
                                        </div>

                                        <button
                                            onClick={() => setShowQR(true)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all transform hover:scale-105 flex items-center gap-2"
                                        >
                                            <QrCode className="w-4 h-4" />
                                            VIEW QR
                                        </button>
                                    </div>
                                </div>

                                {/* CTA */}
                                <button
                                    onClick={handleProceedPayment}
                                    disabled={!selectedPayment || isProcessing}
                                    className={`w-full py-4 rounded-lg font-bold text-lg transition-all shadow-lg ${selectedPayment && !isProcessing
                                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-xl transform hover:scale-105'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    {isProcessing ? 'Processing...' : selectedPayment ? 'Proceed to Payment' : 'Select Payment Method'}
                                </button>

                                {!selectedPayment && (
                                    <p className="text-xs text-gray-500 text-center mt-2">
                                        Please select a payment method to continue
                                    </p>
                                )}

                                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                                    <Shield className="w-4 h-4" />
                                    <span>100% Secure Payment</span>
                                </div>

                            </div>
                        </div>
                    </div>

                </div>




            </div>

            {/* QR Code Modal */}
            {showQR && (
                <div className="fixed inset-0 bg-black flex items-center justify-center z-9999 p-4">
                    <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 max-w-md w-full relative animate-in zoom-in">
                        <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                            <X className="w-6 h-6" />
                        </button>

                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Scan & Pay</h3>
                        <p className="text-gray-600 mb-6">Use any UPI app to scan and complete payment</p>

                        <div
                            className="flex bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl mb-6 justify-center"
                        >
                            <div className="bg-white p-4 rounded-lg inline-block">
                                <div className="w-48 h-48 bg-gray-900 rounded-lg flex items-center justify-center">
                                    <img src={MYQR} alt="Barcode" />
                                </div>
                            </div>
                        </div>

                        <div className="text-center mb-6">
                            <p className="text-lg font-bold text-gray-900">₹{calculateTotal().toLocaleString()}</p>
                            <p className="text-sm text-gray-600">Amount to Pay</p>
                        </div>

                        <div className="flex gap-3 justify-around mb-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <img src={Bhim} className='w-8 h-8 object-contain' alt="" />
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <img src={Gpay} className='w-8 h-8 object-contain' alt="" />
                            </div>
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <img src={Paytm} className='w-8 h-8 object-contain' alt="" />
                            </div>
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <img src={Phonepe} className='w-8 h-8 object-contain' alt="" />
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 text-center">
                            Supported apps: Google Pay, PhonePe, Paytm, BHIM & more
                        </p>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-9999 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center animate-in zoom-in">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
                        <p className="text-gray-600 mb-6">Your booking has been confirmed</p>

                        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">Booking ID</span>
                                <span className="font-semibold">BK{Date.now().toString().slice(-8)}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">Amount Paid</span>
                                <span className="font-semibold">₹{calculateTotal().toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Flight</span>
                                <span className="font-semibold">{flight.from} → {flight.to}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowSuccessModal(false)}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            View Booking Details
                        </button>
                    </div>
                </div>
            )}

        </>
    );
}