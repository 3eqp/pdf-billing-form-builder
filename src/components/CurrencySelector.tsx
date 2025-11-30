import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Currency, currencies } from "@/types/currency";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CurrencySelectorProps {
  value: Currency;
  onChange: (currency: Currency) => void;
  label?: string;
  error?: boolean;
}

export const CurrencySelector = ({ value, onChange, label, error }: CurrencySelectorProps) => {
  return (
    <div className="space-y-2">
      {label && (
        <Label className={cn("text-sm font-medium", error ? "text-red-500" : "text-foreground")}>
          {label}
        </Label>
      )}
      <Select value={value} onValueChange={(val) => onChange(val as Currency)}>
        <SelectTrigger className={cn(
          "bg-card transition-colors",
          error ? "border-red-500 focus:border-red-500" : "border-border focus:border-primary"
        )}>
          <SelectValue>
            {currencies[value].symbol} {currencies[value].code}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.values(currencies).map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              {currency.symbol} {currency.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
