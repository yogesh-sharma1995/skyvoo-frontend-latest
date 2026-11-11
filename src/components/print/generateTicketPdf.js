import jsPDF from 'jspdf';
import { toCanvas, toPng } from 'html-to-image';

/**
 * Gathers vertical breakpoint candidates from the DOM.
 * Detects section boxes, flight cards, tables, and table rows so we never cut elements in half.
 */
function getElementBreakpoints(container) {
  const containerRect = container.getBoundingClientRect();
  const containerTop = containerRect.top + window.scrollY;
  const breakpoints = [];

  // Focus on atomic rows and cards rather than whole-section wrappers
  const candidates = container.querySelectorAll(
    'tr, h2, .flight-card, .flight-segment, .ticket-header, .important-info, .ticket-footer, .terms-item'
  );

  candidates.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const top = Math.round(rect.top + window.scrollY - containerTop);
    const bottom = Math.round(rect.bottom + window.scrollY - containerTop);
    const height = Math.round(rect.height);

    if (height > 6 && top >= 0) {
      breakpoints.push({ top, bottom, height, el });
    }
  });

  // Sort by top ascending
  breakpoints.sort((a, b) => a.top - b.top);
  return breakpoints;
}

/**
 * Calculates page slices [ { startY, endY }, ... ] ensuring no section or table row is split.
 */
function computePageSlices(totalHeight, maxPageHeight, breakpoints) {
  const slices = [];
  let currentY = 0;
  const minPageHeight = maxPageHeight * 0.35; // Don't break if page is less than 35% filled

  while (currentY < totalHeight - 5) {
    const targetBottom = currentY + maxPageHeight;

    if (targetBottom >= totalHeight) {
      slices.push({ startY: currentY, endY: totalHeight });
      break;
    }

    // Check which elements cross the targetBottom line
    const crossing = breakpoints.filter(
      (bp) => bp.top < targetBottom && bp.bottom > targetBottom
    );

    let breakY = targetBottom;

    if (crossing.length > 0) {
      // Find the highest top boundary among crossing elements to keep previous content on this page
      const validCrossingTops = crossing
        .map((bp) => bp.top)
        .filter((t) => t >= currentY + minPageHeight && t < targetBottom);

      if (validCrossingTops.length > 0) {
        breakY = Math.max(...validCrossingTops);
      }
    } else {
      // If no element crosses, break at the bottom of the last element that fits completely
      const validBottoms = breakpoints
        .map((bp) => bp.bottom)
        .filter((b) => b >= currentY + minPageHeight && b <= targetBottom);

      if (validBottoms.length > 0) {
        breakY = Math.max(...validBottoms);
      }
    }

    // Safety fallback to guarantee progress
    if (breakY <= currentY + 15) {
      breakY = targetBottom;
    }

    slices.push({ startY: currentY, endY: breakY });
    currentY = breakY;
  }

  return slices;
}

/**
 * Converts a DOM element into a high-res, multi-page PDF Blob without cutting any content.
 */
export async function generateTicketPdfBlob(element) {
  if (!element) {
    throw new Error('Ticket element not found for PDF generation');
  }

  // 1. Capture high-res canvas of the ticket element
  let fullCanvas;
  try {
    fullCanvas = await toCanvas(element, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
    });
  } catch {
    // Fallback using toPng -> Image -> Canvas
    const imgData = await toPng(element, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
    });
    const img = new Image();
    img.src = imgData;
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
    });
    fullCanvas = document.createElement('canvas');
    fullCanvas.width = img.width;
    fullCanvas.height = img.height;
    const ctx = fullCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
  }

  const containerWidth = element.offsetWidth || 850;
  const totalHeight = element.offsetHeight || fullCanvas.height / 2;
  const scale = fullCanvas.width / containerWidth;

  // Standard A4 PDF dimensions in mm
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = 210;
  const pdfHeight = 297;
  const margin = 5; // 5mm margin
  const contentWidth = pdfWidth - margin * 2; // 200mm
  const contentHeight = pdfHeight - margin * 2; // 287mm

  // Max height in CSS pixels corresponding to 1 A4 content page
  const maxPageHeightInPx = Math.round(containerWidth * (contentHeight / contentWidth));

  // 2. If the ticket fits cleanly on 1 page (up to 8% overflow scaled slightly)
  if (totalHeight <= maxPageHeightInPx * 1.08) {
    const finalImgHeight = Math.min(contentHeight, (totalHeight / containerWidth) * contentWidth);
    const imgDataUrl = fullCanvas.toDataURL('image/png');
    pdf.addImage(imgDataUrl, 'PNG', margin, margin, contentWidth, finalImgHeight, undefined, 'FAST');
    return pdf.output('blob');
  }

  // 3. Multi-page intelligent section-aware slicing
  const breakpoints = getElementBreakpoints(element);
  const slices = computePageSlices(totalHeight, maxPageHeightInPx, breakpoints);

  for (let i = 0; i < slices.length; i++) {
    const { startY, endY } = slices[i];
    const sliceHeightPx = endY - startY;

    if (sliceHeightPx <= 0) continue;

    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = fullCanvas.width;
    sliceCanvas.height = Math.round(sliceHeightPx * scale);

    const ctx = sliceCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);

    ctx.drawImage(
      fullCanvas,
      0,
      Math.round(startY * scale),
      fullCanvas.width,
      Math.round(sliceHeightPx * scale),
      0,
      0,
      sliceCanvas.width,
      sliceCanvas.height
    );

    const sliceImgData = sliceCanvas.toDataURL('image/png');
    const imgMmHeight = (sliceHeightPx / containerWidth) * contentWidth;

    if (i > 0) {
      pdf.addPage();
    }

    pdf.addImage(
      sliceImgData,
      'PNG',
      margin,
      margin,
      contentWidth,
      imgMmHeight,
      undefined,
      'FAST'
    );
  }

  return pdf.output('blob');
}

