import React, { useEffect } from "react";
import { X } from "lucide-react";

const Modal = ({ open, onClose, title, children }) => {
    useEffect(() => {
        if (!open) return;
        const originalBodyOverflow = document.body.style.overflow;
        const originalHtmlOverflow = document.documentElement.style.overflow;
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalBodyOverflow;
            document.documentElement.style.overflow = originalHtmlOverflow;
        };
    }, [open]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[10005] p-4"
            onClick={onClose}
            style={{ animation: 'fadeIn 0.25s ease-out forwards' }}
        >
            <div
                className="text-justify bg-white w-full sm:max-w-xl max-h-[90vh] rounded-2xl sm:rounded-xl overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="font-semibold text-lg">{title}</h3>
                    <button onClick={onClose}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4">{children}</div>
            </div>
        </div>
    );
};

export default Modal;
