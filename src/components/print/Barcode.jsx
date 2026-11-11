import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

/**
 * 1D Linear Barcode component using CODE128.
 * Renders an inline vector SVG element compatible with html-to-image and jsPDF.
 */
const Barcode = ({
  value = '',
  width = 1.25,
  height = 36,
  displayValue = false,
  className = '',
}) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        // Clear any previous child nodes
        while (svgRef.current.firstChild) {
          svgRef.current.removeChild(svgRef.current.firstChild);
        }

        JsBarcode(svgRef.current, String(value), {
          format: 'CODE128',
          width: 1.35,
          height: 40,
          displayValue: false,
          margin: 6,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch (err) {
        console.warn('JsBarcode render failed for value:', value, err);
      }
    }
  }, [value, width, height, displayValue]);

  if (!value) return null;

  return (
    <div className={`shrink-0 flex items-center justify-center ${className}`}>
      <svg
        ref={svgRef}
        className="max-w-[140px] sm:max-w-[160px] h-auto block"
      />
    </div>
  );
};

export default Barcode;
