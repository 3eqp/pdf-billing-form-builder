import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/FormField";
import { SignatureCanvasComponent } from "@/components/SignatureCanvas";
import { ReceiptUpload } from "@/components/ReceiptUpload";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AmountFieldWithCurrency } from "@/components/AmountFieldWithCurrency";
import { generatePDF, FormData } from "@/utils/pdfGenerator";
import { amountToWords } from "@/utils/amountToWords";
import { FileDown, FileText } from "lucide-react";
import { toast } from "sonner";
import { translations, Language } from "@/i18n/translations";
import { Currency } from "@/types/currency";

type FieldErrors = Record<keyof FormData, boolean>;

const Index = () => {
  const [language, setLanguage] = useState<Language>('ru');
  const [currency, setCurrency] = useState<Currency>('PLN');
  const [formData, setFormData] = useState<FormData>({
    date: "",
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

  const handleGeneratePDF = async () => {
    // Validation - all fields are mandatory except receipts
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
      return;
    }

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

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex-1 flex justify-center">
            <FileText className="h-8 w-8 text-document-header" />
          </div>
          <h1 className="text-3xl font-bold text-document-header">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date*/}
            <FormField
              label={t.date}
              value={formData.date}
              onChange={updateField("date")}
              type="date"
              error={fieldErrors.date}
            />
            {/* Amount with Currency */}
            <AmountFieldWithCurrency
              label={t.amount}
              value={formData.amount}
              currency={currency}
              onChange={handleAmountChange}
              onCurrencyChange={handleCurrencyChange}
              onBlur={handleAmountBlur}
              error={fieldErrors.amount}
            />
            {/* Issued To */}
            <FormField
              label={t.issuedTo}
              value={formData.issuedTo}
              onChange={updateField("issuedTo")}
              error={fieldErrors.issuedTo}
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

          <div className="caption">
            <p>{t.requiredFields}</p>
          </div>

          {/* Receipt Upload */}
          <div className="pt-4 border-t border-border">
            <ReceiptUpload receipts={receipts} onChange={setReceipts} language={language} />
          </div>

          {/* Generate Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              size="lg"
              className="gap-2"
            >
              <FileDown className="h-5 w-5" />
              {isGenerating ? t.generating : t.generatePDF}
            </Button>
          </div>
        </Card>

        {/* Info Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p className="mt-1 caption">{t.pdfInfo}</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
