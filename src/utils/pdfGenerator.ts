import { jsPDF } from "jspdf";

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

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  // Page 1: Form
  // Header
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const headerText = "ZBÓR CHRZEŚCIJAN BAPTYSTÓW «BOŻA ŁASKA» W WARSZAWIE";
  const headerWidth = doc.getTextWidth(headerText);
  doc.text(headerText, (pageWidth - headerWidth) / 2, 20);

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  const titleText = "Dowód wypłaty";
  const titleWidth = doc.getTextWidth(titleText);
  doc.text(titleText, (pageWidth - titleWidth) / 2, 32);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  let yPos = 45;

  // Date and Amount row
  doc.text("Data:", margin, yPos);
  doc.rect(margin + 12, yPos - 4, 70, 7);
  doc.text(formData.date, margin + 14, yPos);

  doc.text("Kwota:", margin + 90, yPos);
  doc.rect(margin + 105, yPos - 4, 70, 7);
  doc.text(formData.amount, margin + 107, yPos);

  yPos += 12;

  // Issued to
  doc.text("Wydano (imię nazwisko):", margin, yPos);
  doc.line(margin + 45, yPos + 1, pageWidth - margin, yPos + 1);
  doc.text(formData.issuedTo, margin + 46, yPos);

  yPos += 10;

  // Account info
  doc.text("Konto dla.pszeliewa (numer telefonu, lub konto bankowe):", margin, yPos);
  doc.line(margin + 95, yPos + 1, pageWidth - margin, yPos + 1);
  doc.text(formData.accountInfo, margin + 96, yPos);

  yPos += 10;

  // Department name
  doc.text("Nazwa działu:", margin, yPos);
  doc.line(margin + 25, yPos + 1, pageWidth - margin, yPos + 1);
  doc.text(formData.departmentName, margin + 26, yPos);

  yPos += 12;

  // Based on
  doc.text("Na podstawie", margin, yPos);
  const basedOnLines = doc.splitTextToSize(formData.basedOn, contentWidth - 5);
  doc.line(margin + 25, yPos + 1, pageWidth - margin, yPos + 1);
  doc.text(basedOnLines[0] || "", margin + 26, yPos);
  
  yPos += 8;
  for (let i = 1; i < Math.min(basedOnLines.length, 3); i++) {
    doc.line(margin, yPos + 1, pageWidth - margin, yPos + 1);
    doc.text(basedOnLines[i], margin + 2, yPos);
    yPos += 8;
  }

  yPos += 4;

  // Amount in words
  doc.text("Kwota słownie:", margin, yPos);
  const amountLines = doc.splitTextToSize(formData.amountInWords, contentWidth - 5);
  doc.line(margin + 30, yPos + 1, pageWidth - margin, yPos + 1);
  doc.text(amountLines[0] || "", margin + 31, yPos);
  
  yPos += 8;
  for (let i = 1; i < Math.min(amountLines.length, 3); i++) {
    doc.line(margin, yPos + 1, pageWidth - margin, yPos + 1);
    doc.text(amountLines[i], margin + 2, yPos);
    yPos += 8;
  }

  yPos += 12;

  // Cashier and recipient signature boxes
  const signatureBoxWidth = 70;
  const signatureBoxHeight = 20;
  
  // Podpis kasjera (left side - empty box)
  doc.text("Podpis kasjera:", margin, yPos);
  doc.rect(margin, yPos + 2, signatureBoxWidth, signatureBoxHeight);

  // Podpis odbiorcy (right side - with signature if provided)
  doc.text("Podpis odbiorcy:", margin + 90, yPos);
  doc.rect(margin + 90, yPos + 2, signatureBoxWidth, signatureBoxHeight);
  
  if (formData.recipientSignature) {
    try {
      doc.addImage(formData.recipientSignature, "PNG", margin + 92, yPos + 4, signatureBoxWidth - 4, signatureBoxHeight - 4);
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
