import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, parseAmount } from '@/lib/format';
import { useState } from 'react';

interface AmountInputProps {
    name: string;
    label?: string;
    value?: number;
    onChange?: (value: number) => void;
    currency?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
}

export function AmountInput({
    name,
    label,
    value = 0,
    onChange,
    currency = 'CHF',
    error,
    required,
    disabled,
    className,
}: AmountInputProps) {
    const [displayValue, setDisplayValue] = useState(
        value > 0 ? value.toFixed(2) : '',
    );
    const [isFocused, setIsFocused] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        setDisplayValue(inputValue);

        const numericValue = parseAmount(inputValue);
        onChange?.(numericValue);
    };

    const handleBlur = () => {
        setIsFocused(false);
        const numericValue = parseAmount(displayValue);
        if (numericValue > 0) {
            setDisplayValue(numericValue.toFixed(2));
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
    };

    return (
        <div className={className}>
            {label && (
                <Label htmlFor={name}>
                    {label}
                    {required && <span className="text-destructive">*</span>}
                </Label>
            )}
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {currency}
                </span>
                <Input
                    id={name}
                    name={name}
                    type="text"
                    inputMode="decimal"
                    value={displayValue}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder="0.00"
                    disabled={disabled}
                    aria-invalid={!!error}
                    className="pl-12"
                />
                {!isFocused && displayValue && parseAmount(displayValue) > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        {formatCurrency(parseAmount(displayValue), currency)}
                    </span>
                )}
            </div>
            {error && (
                <p className="mt-1 text-sm text-destructive">{error}</p>
            )}
        </div>
    );
}
