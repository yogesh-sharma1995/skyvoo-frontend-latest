import React from 'react';

const TicketFooter = () => {
  return (
    <div className="pt-2 border-t border-slate-200 flex items-center justify-end text-left">

      {/* Right Column: Signature / Brand Slogan */}
      <div className="flex flex-col items-start sm:items-end justify-center self-end sm:self-center">
        <div className="relative text-right">
          <p className="text-base sm:text-lg font-serif italic text-slate-600 font-medium tracking-wide leading-tight">
            More Than Travel
          </p>
          <p className="text-base sm:text-lg font-serif italic text-slate-600 font-medium tracking-wide leading-tight">
            A Better Tomorrow
          </p>
          {/* Red decorative underline stroke */}
          <div className="w-full flex justify-end mt-0.5">
            <svg
              className="w-24 sm:w-28 h-1 text-[#a31d24]"
              viewBox="0 0 160 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 5.5C45 1.5 115 1.5 159 6.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketFooter;
