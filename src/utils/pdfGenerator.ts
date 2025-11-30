import { jsPDF } from "jspdf";
import { PDFDocument } from "pdf-lib";
import { RobotoRegular, RobotoBold } from "../fonts/roboto";
import { Currency, currencies } from "@/types/currency";

export interface FormData {
  date: string;
  amount: string;
  currency: Currency;
  issuedTo: string;
  accountInfo: string;
  departmentName: string;
  basedOn: string;
  amountInWords: string;
  recipientSignature: string;
}

const loadImageAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const loadFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (result instanceof ArrayBuffer) {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

const isPdfFile = (file: File): boolean => {
  return file.type === "application/pdf";
};

const fitImageToPage = (
  doc: jsPDF,
  imgData: string,
  maxWidth: number,
  maxHeight: number,
  x: number,
  y: number
) => {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const imgWidth = img.width;
      const imgHeight = img.height;
      const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
      const width = imgWidth * ratio;
      const height = imgHeight * ratio;
      const centerX = x + (maxWidth - width) / 2;
      const centerY = y + (maxHeight - height) / 2;
      
      doc.addImage(imgData, "JPEG", centerX, centerY, width, height);
      resolve();
    };
    img.src = imgData;
  });
};

export const generatePDF = async (formData: FormData, receipts: File[]): Promise<void> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Register Roboto font with Cyrillic support
  doc.addFileToVFS("Roboto-Regular.ttf", RobotoRegular);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFileToVFS("Roboto-Bold.ttf", RobotoBold);
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  const rowHeight = 8;
  const cellPadding = 2;

  // Helper function to draw a table row with label and value
  const drawTableRow = (y: number, label: string, value: string, labelWidth: number = 50) => {
    const valueWidth = contentWidth - labelWidth;
    // Label cell (gray background)
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, labelWidth, rowHeight, "F");
    doc.rect(margin, y, labelWidth, rowHeight);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(9);
    doc.text(label, margin + cellPadding, y + rowHeight - cellPadding);
    // Value cell
    doc.rect(margin + labelWidth, y, valueWidth, rowHeight);
    doc.text(value, margin + labelWidth + cellPadding, y + rowHeight - cellPadding);
  };

  // Helper function to draw a multi-line table row
  const drawMultiLineRow = (y: number, label: string, value: string, labelWidth: number = 50, numLines: number = 3) => {
    const valueWidth = contentWidth - labelWidth;
    const totalHeight = rowHeight * numLines;
    // Label cell (gray background)
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, labelWidth, totalHeight, "F");
    doc.rect(margin, y, labelWidth, totalHeight);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(9);
    doc.text(label, margin + cellPadding, y + rowHeight - cellPadding);
    // Value cell
    doc.rect(margin + labelWidth, y, valueWidth, totalHeight);
    const lines = doc.splitTextToSize(value, valueWidth - 2 * cellPadding);
    for (let i = 0; i < Math.min(lines.length, numLines); i++) {
      doc.text(lines[i], margin + labelWidth + cellPadding, y + rowHeight * (i + 1) - cellPadding);
    }
    return totalHeight;
  };

  let yPos = margin;

  // Organization Header
  doc.setFontSize(10);
  doc.setFont("Roboto", "normal");
  const headerText = "ZBÓR CHRZEŚCIJAN BAPTYSTÓW «BOŻA ŁASKA» W WARSZAWIE";
  const headerWidth = doc.getTextWidth(headerText);
  doc.text(headerText, (pageWidth - headerWidth) / 2, yPos);

  yPos += 12;

  // Title
  doc.setFontSize(14);
  doc.setFont("Roboto", "bold");
  const titleText = "Dowód wypłaty";
  const titleWidth = doc.getTextWidth(titleText);
  doc.text(titleText, (pageWidth - titleWidth) / 2, yPos);

  yPos += 10;

  // Date and Amount row (two columns)
  doc.setFontSize(9);
  doc.setFont("Roboto", "normal");
  const halfWidth = contentWidth / 2;
  const labelWidth = 25;
  
  // Date cell
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, labelWidth, rowHeight, "F");
  doc.rect(margin, yPos, labelWidth, rowHeight);
  doc.text("Data", margin + cellPadding, yPos + rowHeight - cellPadding);
  doc.rect(margin + labelWidth, yPos, halfWidth - labelWidth - 2, rowHeight);
  doc.text(formData.date, margin + labelWidth + cellPadding, yPos + rowHeight - cellPadding);
  
  // Amount cell - show currency code in label and symbol with amount value
  const currencyInfo = currencies[formData.currency];
  const amountLabelX = margin + halfWidth + 2;
  doc.setFillColor(240, 240, 240);
  doc.rect(amountLabelX, yPos, labelWidth, rowHeight, "F");
  doc.rect(amountLabelX, yPos, labelWidth, rowHeight);
  doc.text(`Kwota (${currencyInfo.code})`, amountLabelX + cellPadding, yPos + rowHeight - cellPadding);
  doc.rect(amountLabelX + labelWidth, yPos, halfWidth - labelWidth - 2, rowHeight);
  doc.text(`${currencyInfo.symbol} ${formData.amount}`, amountLabelX + labelWidth + cellPadding, yPos + rowHeight - cellPadding);

  yPos += rowHeight + 4;

  // Issued to (imię nazwisko)
  drawTableRow(yPos, "Wydano (imię nazwisko)", formData.issuedTo);
  yPos += rowHeight;

  // Account info (konto dla przelewu)
  drawTableRow(yPos, "Konto dla przelewu", formData.accountInfo);
  yPos += rowHeight;

  // Department name
  drawTableRow(yPos, "Nazwa działu", formData.departmentName);
  yPos += rowHeight;

  // Based on (multi-line)
  const basedOnHeight = drawMultiLineRow(yPos, "Na podstawie", formData.basedOn, 50, 3);
  yPos += basedOnHeight;

  // Amount in words (multi-line)
  const amountWordsHeight = drawMultiLineRow(yPos, "Kwota słownie", formData.amountInWords, 50, 2);
  yPos += amountWordsHeight;

  yPos += 16;

  // Kasjer and Podpis kasjera in one row with underlines
  doc.setFontSize(9);
  doc.setFont("Roboto", "normal");
  const underlineLength = 55;
  
  // Kasjer:______ on the left
  doc.text("Kasjer:", margin, yPos);
  const kasjerTextWidth = doc.getTextWidth("Kasjer:");
  doc.line(margin + kasjerTextWidth + 2, yPos, margin + kasjerTextWidth + 2 + underlineLength, yPos);
  
  // Podpis kasjera:______ on the right
  const podpisKasjeraLabel = "Podpis kasjera:";
  const podpisKasjeraX = margin + contentWidth / 2 + 5;
  doc.text(podpisKasjeraLabel, podpisKasjeraX, yPos);
  const podpisKasjeraTextWidth = doc.getTextWidth(podpisKasjeraLabel);
  doc.line(podpisKasjeraX + podpisKasjeraTextWidth + 2, yPos, podpisKasjeraX + podpisKasjeraTextWidth + 2 + underlineLength, yPos);

  yPos += 16;

  // Podpis odbiorcy - full width bold frame
  const recipientBoxHeight = 30;
  doc.setFont("Roboto", "bold");
  doc.text("Podpis odbiorcy", margin, yPos);
  doc.setFont("Roboto", "normal");
  
  yPos += 4;
  
  // Draw bold frame (thicker line)
  doc.setLineWidth(0.5);
  doc.rect(margin, yPos, contentWidth, recipientBoxHeight);
  doc.setLineWidth(0.2); // Reset to default
  
  if (formData.recipientSignature) {
    try {
      doc.addImage(
        formData.recipientSignature, 
        "PNG", 
        margin + 2, 
        yPos + 2, 
        contentWidth - 4, 
        recipientBoxHeight - 4
      );
    } catch (e) {
      console.error("Error adding recipient signature:", e);
    }
  }

  // Add image receipt pages (skip PDF files for now - they'll be added via pdf-lib)
  const imageReceipts = receipts.filter(file => !isPdfFile(file));
  const pdfReceipts = receipts.filter(file => isPdfFile(file));
  
  for (let i = 0; i < imageReceipts.length; i++) {
    doc.addPage();
    
    try {
      const receiptData = await loadImageAsDataURL(imageReceipts[i]);
      const maxWidth = contentWidth;
      const maxHeight = pageHeight - 2 * margin;
      
      await fitImageToPage(doc, receiptData, maxWidth, maxHeight, margin, margin);
    } catch (error) {
      console.error(`Error adding receipt ${i + 1}:`, error);
      doc.setFontSize(12);
      doc.text(`Error loading receipt: ${imageReceipts[i].name}`, margin, pageHeight / 2);
    }
  }

  // If there are no PDF receipts, save directly
  if (pdfReceipts.length === 0) {
    const fileName = `Dowod_wyplaty_${formData.date.replace(/\//g, "-") || "document"}.pdf`;
    doc.save(fileName);
    return;
  }

  // Merge with PDF receipts using pdf-lib
  const jspdfOutput = doc.output("arraybuffer");
  const finalPdf = await PDFDocument.load(jspdfOutput);

  // A4 dimensions in points (1 point = 1/72 inch)
  const A4_WIDTH = 595.28;
  const A4_HEIGHT = 841.89;
  const MM_TO_POINTS = 2.83465;
  const SIZE_TOLERANCE = 1; // tolerance for size comparison in points

  for (const pdfFile of pdfReceipts) {
    try {
      const pdfBytes = await loadFileAsArrayBuffer(pdfFile);
      const receiptPdf = await PDFDocument.load(pdfBytes);
      const pageIndices = receiptPdf.getPageIndices();
      
      for (const pageIndex of pageIndices) {
        const [sourcePage] = await finalPdf.copyPages(receiptPdf, [pageIndex]);
        const { width: srcWidth, height: srcHeight } = sourcePage.getSize();
        
        // Check if the page needs to be scaled to fit A4
        if (Math.abs(srcWidth - A4_WIDTH) > SIZE_TOLERANCE || Math.abs(srcHeight - A4_HEIGHT) > SIZE_TOLERANCE) {
          // Create a new A4 page
          const newPage = finalPdf.addPage([A4_WIDTH, A4_HEIGHT]);
          
          // Embed the source page as an XObject
          const embeddedPage = await finalPdf.embedPage(sourcePage);
          
          // Calculate scale to fit within A4 with margins (15mm margin)
          const marginPts = 15 * MM_TO_POINTS;
          const maxWidth = A4_WIDTH - 2 * marginPts;
          const maxHeight = A4_HEIGHT - 2 * marginPts;
          
          const scale = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
          const scaledWidth = srcWidth * scale;
          const scaledHeight = srcHeight * scale;
          
          // Center the content on the page
          const x = (A4_WIDTH - scaledWidth) / 2;
          const y = (A4_HEIGHT - scaledHeight) / 2;
          
          newPage.drawPage(embeddedPage, {
            x,
            y,
            width: scaledWidth,
            height: scaledHeight,
          });
        } else {
          // Page is already A4 size, add it directly
          finalPdf.addPage(sourcePage);
        }
      }
    } catch (error) {
      console.error(`Error adding PDF receipt: ${pdfFile.name}`, error);
    }
  }

  // Save the merged PDF
  const finalPdfBytes = await finalPdf.save();
  const blob = new Blob([finalPdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Dowod_wyplaty_${formData.date.replace(/\//g, "-") || "document"}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};
