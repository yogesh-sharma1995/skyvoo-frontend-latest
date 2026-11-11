import React from "react";
import {
    Briefcase,
    HeartPulse,
    Clock,
    Plane,
    AlertTriangle,
    Stethoscope,
    Phone,
    UserCheck,
    Ambulance,
} from "lucide-react";

export default function TripBenefitsModal({ onClose }) {
    React.useEffect(() => {
        const originalBodyOverflow = document.body.style.overflow;
        const originalHtmlOverflow = document.documentElement.style.overflow;
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalBodyOverflow;
            document.documentElement.style.overflow = originalHtmlOverflow;
        };
    }, []);

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-9999 "
            onClick={onClose}
            style={{ animation: "fadeIn 0.3s ease-out forwards" }}
        >
            <div
                className="bg-white shadow-xl p-8 w-[460px] relative"
                onClick={(e) => e.stopPropagation()}
                style={{ animation: "scaleIn 0.3s ease-out forwards" }}
            >
                {/* Close button */}
                <button
                    className="absolute cursor-pointer top-4 right-4 text-gray-500 hover:text-black"
                    onClick={onClose}
                >
                    ✕
                </button>

                {/* Title */}
                <h2 className="text-xl font-semibold mb-2">Trip Secure Benefits</h2>
                <a
                    href="#"
                    className="text-sm text-blue-600 underline mb-4 inline-block"
                >
                    View T&Cs
                </a>

                {/* Benefits List */}
                <div className="space-y-5 text-gray-700 overflow-y-auto relative max-h-[40vh]">
                    <Benefit
                        icon={<Briefcase className="text-teal-500" size={18} />}
                        title="Baggage Assistance"
                        subtitle="24x7 support"
                        description="Get assistance in case your checked-in baggage is delayed/lost."
                    />

                    <Benefit
                        icon={<HeartPulse className="text-red-500" size={18} />}
                        title="Personal Accident"
                        subtitle="Flat ₹ 50,000"
                        description="Provides coverage up to the sum insured for cases of death or permanent disability to the insured person resulting from an accident during the trip."
                    />

                    <Benefit
                        icon={<Briefcase className="text-blue-500" size={18} />}
                        title="Loss of Checked-In Baggage"
                        subtitle="Flat ₹ 2,000"
                        description="For the total loss of checked-in baggage by the airline. The cover is limited to the travel destinations specified in the Proposal Form. All halts and via destinations included in this air travel ticket will be covered under this benefit."
                    />

                    <Benefit
                        icon={<Clock className="text-orange-500" size={18} />}
                        title="Delay of Checked-In Baggage"
                        subtitle="Flat ₹ 2,000"
                        description="If your checked-in baggage is delayed by more than 4 hours from the expected time of delivery, by the airline."
                    />

                    <Benefit
                        icon={<Plane className="text-purple-500" size={18} />}
                        title="Missed Flight"
                        subtitle="Flat ₹ 2,500"
                        description="If a connecting flight has been missed due to cancellation or delay of the prior flight purchased along with this insurance."
                    />

                    <Benefit
                        icon={<AlertTriangle className="text-yellow-500" size={18} />}
                        title="Common Carrier Cancellation"
                        subtitle="upto ₹ 3,500"
                        description="Covers if the trip is cancelled before the trip start date by the airlines."
                    />

                    <Benefit
                        icon={<Plane className="text-indigo-500" size={18} />}
                        title="Diverted Flight"
                        subtitle="Flat ₹ 2,500"
                        description="When the flight is diverted due to emergency situations."
                    />

                    <Benefit
                        icon={<Clock className="text-green-500" size={18} />}
                        title="Common Carrier Delay"
                        subtitle="Flat ₹ 1,200"
                        description="In case the flight is delayed by 120 minutes or more."
                    />

                    <Benefit
                        icon={<Phone className="text-cyan-500" size={18} />}
                        title="Emergency Assistance"
                        subtitle="24x7 support"
                    />

                    <Benefit
                        icon={<Stethoscope className="text-pink-500" size={18} />}
                        title="Doctor Tele Consultation"
                        subtitle="24x7 support"
                    />

                    <Benefit
                        icon={<Ambulance className="text-red-400" size={18} />}
                        title="Road Side Assistance"
                        subtitle="24x7 support"
                    />

                    <Benefit
                        icon={<UserCheck className="text-lime-500" size={18} />}
                        title="Paramedic Assistance"
                        subtitle="24x7 support"
                    />

                    <Benefit
                        icon={<HeartPulse className="text-rose-500" size={18} />}
                        title="Second Medical Opinion"
                        subtitle="24x7 support"
                    />

                    <Benefit
                        icon={<Stethoscope className="text-amber-600" size={18} />}
                        title="Visit from Doctor"
                        subtitle="24x7 support"
                    />
                </div>
            </div>

            <style>
                {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { transform: scale(0.95); }
            to { transform: scale(1); }
          }

          /* Custom scrollbar */
          .scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(0,0,0,0.2);
            border-radius: 3px;
          }
        `}
            </style>
        </div>
    );
}

/* Reusable Benefit Component */
function Benefit({ icon, title, subtitle, description }) {
    return (
        <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="mt-1">
                {icon}
            </div>

            {/* Text Content */}
            <div className="flex-1">
                <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-gray-900">{title}</span>
                    {subtitle && <span className="text-sm text-gray-600">{subtitle}</span>}
                </div>

                {description && (
                    <p className="text-sm text-gray-700 mt-1">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}

