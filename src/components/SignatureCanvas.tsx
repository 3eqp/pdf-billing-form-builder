import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eraser } from "lucide-react";
import { translations, Language } from "@/i18n/translations";

interface SignatureCanvasComponentProps {
  label: string;
  onChange: (signature: string) => void;
  language?: Language;
  error?: boolean;
}

export const SignatureCanvasComponent = ({ label, onChange, language = 'ru', error = false }: SignatureCanvasComponentProps) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const t = translations[language];

  const clear = () => {
    sigCanvas.current?.clear();
    onChange("");
  };

  const handleEnd = () => {
    if (sigCanvas.current) {
      const signature = sigCanvas.current.toDataURL();
      onChange(signature);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className={`text-sm font-medium ${error ? "text-red-500" : "text-foreground"}`}>{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clear}
          className="h-8 px-2"
        >
          <Eraser className="h-4 w-4 mr-1" />
          {t.clear}
        </Button>
      </div>
      <div className={`border-2 rounded-md bg-white overflow-hidden ${error ? "border-red-500" : "border-signature-border"}`}>
        <SignatureCanvas
          ref={sigCanvas}
          onEnd={handleEnd}
          canvasProps={{
            className: "w-full h-32 cursor-crosshair",
            style: { touchAction: "none" }
          }}
          backgroundColor="#ffffff"
          penColor="#000000"
        />
      </div>
    </div>
  );
};
