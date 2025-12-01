import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/FormField";
import { SignatureCanvasComponent } from "@/components/SignatureCanvas";
import { ReceiptUpload } from "@/components/ReceiptUpload";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AmountFieldWithCurrency } from "@/components/AmountFieldWithCurrency";
import { generatePDF, generatePDFFile, FormData } from "@/utils/pdfGenerator";
import { amountToWords } from "@/utils/amountToWords";
import { FileDown, FileText, Share2 } from "lucide-react";
import { toast } from "sonner";
import { translations, Language } from "@/i18n/translations";
import { Currency } from "@/types/currency";

type FieldErrors = Record<keyof FormData, boolean>;

// Helper function to get current date in YYYY-MM-DD format
const getCurrentDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Index = () => {
  const [language, setLanguage] = useState<Language>('ru');
  const [currency, setCurrency] = useState<Currency>('PLN');
  const [formData, setFormData] = useState<FormData>({
    date: getCurrentDate(),
    amount: "",
    currency: "PLN",
    issuedTo: "",
    accountInfo: "",
    departmentName: "",
    basedOn: "",
    amountInWords: "",
    recipientSignature: "",
  });

  const [receipts, setReceipts] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    date: false,
    amount: false,
    currency: false,
    issuedTo: false,
    accountInfo: false,
    departmentName: false,
    basedOn: false,
    amountInWords: false,
    recipientSignature: false,
  });
  
  const t = translations[language];

  const updateField = (field: keyof FormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  // Sanitize amount input - remove non-numeric chars except decimal
  const sanitizeAmount = (value: string): string => {
    // Remove all non-numeric characters except decimal point and comma
    let cleaned = value.replace(/[^\d.,]/g, '');
    // Replace comma with dot for consistency
    cleaned = cleaned.replace(',', '.');
    // Remove multiple decimal points, keep only the first decimal part
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts[1];
    }
    return cleaned;
  };

  // Format amount to always have 2 decimal places
  const formatAmount = (value: string): string => {
    const cleaned = sanitizeAmount(value);
    
    if (!cleaned || cleaned === '.') {
      return '';
    }

    const parsed = parseFloat(cleaned);
    if (isNaN(parsed)) {
      return '';
    }

    return parsed.toFixed(2);
  };

  const handleAmountChange = (value: string) => {
    // Allow typing with partial input (don't format while typing)
    const sanitized = sanitizeAmount(value);
    
    // Prevent more than 2 decimal places while typing
    const parts = sanitized.split('.');
    let processedValue = sanitized;
    if (parts.length > 1 && parts[1].length > 2) {
      processedValue = parts[0] + '.' + parts[1].slice(0, 2);
    }
    
    const words = amountToWords(processedValue, language, currency);
    setFormData((prev) => ({
      ...prev,
      amount: processedValue,
      amountInWords: words,
    }));
  };

  const handleAmountBlur = () => {
    if (formData.amount) {
      const formatted = formatAmount(formData.amount);
      const words = amountToWords(formatted, language, currency);
      setFormData((prev) => ({
        ...prev,
        amount: formatted,
        amountInWords: words,
      }));
    }
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    // Update amountInWords when language changes if there's an amount
    if (formData.amount) {
      const words = amountToWords(formData.amount, newLanguage, currency);
      setFormData((prev) => ({
        ...prev,
        amountInWords: words,
      }));
    }
  };

  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    // Update amountInWords when currency changes if there's an amount
    if (formData.amount) {
      const words = amountToWords(formData.amount, language, newCurrency);
      setFormData((prev) => ({
        ...prev,
        currency: newCurrency,
        amountInWords: words,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        currency: newCurrency,
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: FieldErrors = {
      date: !formData.date,
      amount: !formData.amount,
      currency: !formData.currency,
      issuedTo: !formData.issuedTo,
      accountInfo: !formData.accountInfo,
      departmentName: !formData.departmentName,
      basedOn: !formData.basedOn,
      amountInWords: !formData.amountInWords,
      recipientSignature: !formData.recipientSignature,
    };

    const hasErrors = Object.values(errors).some((error) => error);

    if (hasErrors) {
      setFieldErrors(errors);
      toast.error(t.validationError);
      return false;
    }
    return true;
  };

  const handleGeneratePDF = async () => {
    if (!validateForm()) return;

    setIsGenerating(true);
    try {
      await generatePDF(formData, receipts);
      toast.success(t.successMessage);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(t.errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSharePDF = async () => {
    if (!validateForm()) return;

    // Check if Web Share API is available and supports file sharing
    if (!navigator.share || !('canShare' in navigator)) {
      toast.error(t.shareNotSupported);
      return;
    }

    setIsSharing(true);
    try {
      const pdfFile = await generatePDFFile(formData, receipts);
      
      // Check if we can share this file type
      if (!navigator.canShare({ files: [pdfFile] })) {
        toast.error(t.shareNotSupported);
        return;
      }

      await navigator.share({
        files: [pdfFile],
        title: pdfFile.name,
      });
      toast.success(t.successMessage);
    } catch (error) {
      // User cancelled sharing - don't show error
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error("Error sharing PDF:", error);
      toast.error(t.errorMessage);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex-1 flex justify-center">
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-document-header" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-document-header">
            {t.title}
          </h1>
          <p className="caption">
            {t.church}
          </p>
          <div className="h-1 my-4" />
          <div className="flex-1 flex justify-center">
              <LanguageSwitcher currentLanguage={language} onLanguageChange={handleLanguageChange} />
          </div>
        </div>
      
        {/* Main Form Card */}
        <Card className="p-6 space-y-6 shadow-lg">
          <div className="caption">
            <p>{t.requiredFields}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[0.8fr_0.8fr_1.4fr]">
            {/* Date*/}
            <FormField
              label={t.date}
              value={formData.date}
              onChange={updateField("date")}
              type="date"
              error={fieldErrors.date}
              className="max-w-full"
            />
            <AmountFieldWithCurrency
              label={t.amount}
              value={formData.amount}
              currency={currency}
              onChange={handleAmountChange}
              onCurrencyChange={handleCurrencyChange}
              onBlur={handleAmountBlur}
              error={fieldErrors.amount}
              className="max-w-full"
            />
            <FormField
              label={t.issuedTo}
              value={formData.issuedTo}
              onChange={updateField("issuedTo")}
              error={fieldErrors.issuedTo}
              className="max-w-full"
            />
          </div>

          {/* Account Info */}
          <FormField
            label={t.accountInfo}
            value={formData.accountInfo}
            onChange={updateField("accountInfo")}
            error={fieldErrors.accountInfo}
          />

          {/* Department Name */}
          <FormField
            label={t.departmentName}
            value={formData.departmentName}
            onChange={updateField("departmentName")}
            error={fieldErrors.departmentName}
          />

          {/* Based On */}
          <FormField
            label={t.basedOn}
            value={formData.basedOn}
            onChange={updateField("basedOn")}
            multiline
            rows={2}
            error={fieldErrors.basedOn}
          />

          {/* Amount in Words */}
          <FormField
            label={t.amountInWords}
            value={formData.amountInWords}
            onChange={updateField("amountInWords")}
            error={fieldErrors.amountInWords}
            multiline
            rows={2}
          />

          {/* Recipient Signature */}
          <div className="pt-4">
            <SignatureCanvasComponent
              label={t.recipientSignature}
              onChange={updateField("recipientSignature")}
              language={language}
              error={fieldErrors.recipientSignature}
            />
          </div>

          {/* Receipt Upload */}
            <div className="pt-4 border border-dashed border-border p-4 rounded-md">
            <ReceiptUpload
              receipts={receipts}
              onChange={setReceipts}
              language={language}
            />
            </div>

          {/* Generate Button */}
          <div className="pt-4 space-y-2">
            <Button
              onClick={handleGeneratePDF}
              disabled={isGenerating || isSharing}
              size="lg"
              className="w-full gap-2"
            >
              <FileDown className="h-5 w-5" />
              {isGenerating ? t.generating : t.generatePDF}
            </Button>
            {/* Share button - mobile only */}
            <Button
              onClick={handleSharePDF}
              disabled={isGenerating || isSharing}
              size="lg"
              variant="outline"
              className="w-full gap-2 sm:hidden"
            >
              <Share2 className="h-5 w-5" />
              {isSharing ? t.sharing : t.sharePDF}
            </Button>
          </div>
        </Card>

        {/* Info Footer */}
        <div className="mt-4 p-3">
            <p className="text-center caption">{t.pdfInfo}</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
