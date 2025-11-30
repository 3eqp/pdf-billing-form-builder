import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  className?: string;
  type?: string;
  error?: boolean;
}

export const FormField = ({ 
  label, 
  value, 
  onChange, 
  multiline = false, 
  rows = 1,
  className,
  type = "text",
  error = false
}: FormFieldProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className={cn("text-sm font-medium", error ? "text-red-500" : "text-foreground")}>{label}</Label>
      {multiline ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className={cn(
            "resize-none bg-card transition-colors",
            error ? "border-red-500 focus:border-red-500" : "border-border focus:border-primary"
          )}
        />
      ) : (
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "bg-card transition-colors",
            error ? "border-red-500 focus:border-red-500" : "border-border focus:border-primary"
          )}
        />
      )}
    </div>
  );
};
