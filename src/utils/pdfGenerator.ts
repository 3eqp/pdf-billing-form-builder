import { jsPDF } from "jspdf";
import { RobotoRegular, RobotoBold } from "../fonts/roboto";

export interface FormData {
  date: string;
  amount: string;
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
  
  // Amount cell
  const amountLabelX = margin + halfWidth + 2;
  doc.setFillColor(240, 240, 240);
  doc.rect(amountLabelX, yPos, labelWidth, rowHeight, "F");
  doc.rect(amountLabelX, yPos, labelWidth, rowHeight);
  doc.text("Kwota", amountLabelX + cellPadding, yPos + rowHeight - cellPadding);
  doc.rect(amountLabelX + labelWidth, yPos, halfWidth - labelWidth - 2, rowHeight);
  doc.text(formData.amount, amountLabelX + labelWidth + cellPadding, yPos + rowHeight - cellPadding);

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

  yPos += 10;

  // Signature boxes
  const signatureBoxWidth = 70;
  const signatureBoxHeight = 25;
  const signatureLabelHeight = 6;
  
  // Podpis kasjera (left side)
  doc.setFontSize(9);
  doc.setFont("Roboto", "normal");
  doc.text("Podpis kasjera", margin, yPos);
  doc.rect(margin, yPos + signatureLabelHeight, signatureBoxWidth, signatureBoxHeight);

  // Podpis odbiorcy (right side)
  const rightSignatureX = pageWidth - margin - signatureBoxWidth;
  doc.text("Podpis odbiorcy", rightSignatureX, yPos);
  doc.rect(rightSignatureX, yPos + signatureLabelHeight, signatureBoxWidth, signatureBoxHeight);
  
  if (formData.recipientSignature) {
    try {
      doc.addImage(
        formData.recipientSignature, 
        "PNG", 
        rightSignatureX + 2, 
        yPos + signatureLabelHeight + 2, 
        signatureBoxWidth - 4, 
        signatureBoxHeight - 4
      );
    } catch (e) {
      console.error("Error adding recipient signature:", e);
    }
  }

  // Add receipt pages
  for (let i = 0; i < receipts.length; i++) {
    doc.addPage();
    
    try {
      const receiptData = await loadImageAsDataURL(receipts[i]);
      const maxWidth = contentWidth;
      const maxHeight = pageHeight - 2 * margin;
      
      await fitImageToPage(doc, receiptData, maxWidth, maxHeight, margin, margin);
    } catch (error) {
      console.error(`Error adding receipt ${i + 1}:`, error);
      doc.setFontSize(12);
      doc.text(`Error loading receipt: ${receipts[i].name}`, margin, pageHeight / 2);
    }
  }

  // Save the PDF
  const fileName = `Dowod_wyplaty_${formData.date.replace(/\//g, "-") || "document"}.pdf`;
  doc.save(fileName);
};
