import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Currency, currencies } from "@/types/currency";
import { cn } from "@/lib/utils";

interface AmountFieldWithCurrencyProps {
  label: string;
  value: string;
  currency: Currency;
  onChange: (value: string) => void;
  onCurrencyChange: (currency: Currency) => void;
  onBlur?: () => void;
  error?: boolean;
  className?: string;
}

export const AmountFieldWithCurrency = ({
  label,
  value,
  currency,
  onChange,
  onCurrencyChange,
  onBlur,
  error = false,
  className,
}: AmountFieldWithCurrencyProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className={cn("text-sm font-medium", error ? "text-red-500" : "text-foreground")}>
        {label}
      </Label>
      <div className="flex">
        <Select value={currency} onValueChange={(val) => onCurrencyChange(val as Currency)}>
          <SelectTrigger 
            className={cn(
              "w-[60px] rounded-r-none border-r-0 bg-card transition-colors flex-shrink-0",
              error ? "border-red-500 focus:border-red-500" : "border-border focus:border-primary"
            )}
          >
            <SelectValue>
              {currencies[currency].symbol}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.values(currencies).map((curr) => (
              <SelectItem key={curr.code} value={curr.code}>
                {curr.symbol} {curr.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={cn(
            "rounded-l-none bg-card transition-colors flex-1",
            error ? "border-red-500 focus:border-red-500" : "border-border focus:border-primary"
          )}
          placeholder="0.00"
        />
      </div>
    </div>
  );
};
