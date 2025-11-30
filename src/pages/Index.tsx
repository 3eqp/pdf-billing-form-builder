import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/FormField";
import { SignatureCanvasComponent } from "@/components/SignatureCanvas";
import { ReceiptUpload } from "@/components/ReceiptUpload";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { generatePDF, FormData } from "@/utils/pdfGenerator";
import { amountToWords } from "@/utils/amountToWords";
import { FileDown, FileText } from "lucide-react";
import { toast } from "sonner";
import { translations, Language } from "@/i18n/translations";

const Index = () => {
  const [language, setLanguage] = useState<Language>('ru');
  const [formData, setFormData] = useState<FormData>({
    date: "",
    amount: "",
    issuedTo: "",
    accountInfo: "",
    departmentName: "",
    basedOn: "",
    amountInWords: "",
    recipientSignature: "",
  });

  const [receipts, setReceipts] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const t = translations[language];

  const updateField = (field: keyof FormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Format amount to always have 2 decimal places
  const formatAmount = (value: string): string => {
    // Remove all non-numeric characters except decimal point and comma
    let cleaned = value.replace(/[^\d.,]/g, '');
    // Replace comma with dot for consistency
    cleaned = cleaned.replace(',', '.');
    // Remove multiple decimal points, keep only the first
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    
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
    // Only allow digits, decimal point and comma
    const sanitized = value.replace(/[^\d.,]/g, '').replace(',', '.');
    
    // Prevent more than 2 decimal places while typing
    const parts = sanitized.split('.');
    let processedValue = sanitized;
    if (parts.length > 1 && parts[1].length > 2) {
      processedValue = parts[0] + '.' + parts[1].slice(0, 2);
    }
    
    const words = amountToWords(processedValue, language);
    setFormData((prev) => ({
      ...prev,
      amount: processedValue,
      amountInWords: words,
    }));
  };

  const handleAmountBlur = () => {
    if (formData.amount) {
      const formatted = formatAmount(formData.amount);
      const words = amountToWords(formatted, language);
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
      const words = amountToWords(formData.amount, newLanguage);
      setFormData((prev) => ({
        ...prev,
        amountInWords: words,
      }));
    }
  };

  const handleGeneratePDF = async () => {
    // Validation
    if (!formData.date || !formData.amount || !formData.issuedTo) {
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1"></div>
            <div className="flex items-center gap-2">
              <FileText className="h-8 w-8 text-document-header" />
            </div>
            <div className="flex-1 flex justify-end">
              <LanguageSwitcher currentLanguage={language} onLanguageChange={handleLanguageChange} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-document-header">
            {t.title}
          </h1>
          <p className="text-muted-foreground">
            {t.church}
          </p>
        </div>

        {/* Main Form Card */}
        <Card className="p-6 space-y-6 shadow-lg">
          {/* Date and Amount Row */}
          <div className="grid md:grid-cols-2 gap-4">
            <FormField
              label={t.date}
              value={formData.date}
              onChange={updateField("date")}
              type="date"
            />
            <FormField
              label={t.amount}
              value={formData.amount}
              onChange={handleAmountChange}
              onBlur={handleAmountBlur}
            />
          </div>

          {/* Issued To */}
          <FormField
            label={t.issuedTo}
            value={formData.issuedTo}
            onChange={updateField("issuedTo")}
          />

          {/* Account Info */}
          <FormField
            label={t.accountInfo}
            value={formData.accountInfo}
            onChange={updateField("accountInfo")}
          />

          {/* Department Name */}
          <FormField
            label={t.departmentName}
            value={formData.departmentName}
            onChange={updateField("departmentName")}
          />

          {/* Based On */}
          <FormField
            label={t.basedOn}
            value={formData.basedOn}
            onChange={updateField("basedOn")}
            multiline
            rows={3}
          />

          {/* Amount in Words */}
          <FormField
            label={t.amountInWords}
            value={formData.amountInWords}
            onChange={updateField("amountInWords")}
            multiline
            rows={3}
          />

          {/* Recipient Signature */}
          <div className="pt-4">
            <SignatureCanvasComponent
              label={t.recipientSignature}
              onChange={updateField("recipientSignature")}
              language={language}
            />
          </div>

          {/* Receipt Upload */}
          <div className="pt-4 border-t border-border">
            <ReceiptUpload receipts={receipts} onChange={setReceipts} language={language} />
          </div>

          {/* Generate Button */}
          <div className="flex justify-end pt-4">
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
          <p>{t.requiredFields}</p>
          <p className="mt-1">{t.pdfInfo}</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
