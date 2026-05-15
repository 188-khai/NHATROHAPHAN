import React from 'react';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value: number;
    onChangeValue: (val: number) => void;
}

export default function CurrencyInput({ value, onChangeValue, ...props }: CurrencyInputProps) {
    const displayValue = value === 0 ? '' : value.toLocaleString('vi-VN');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        onChangeValue(rawValue ? Number(rawValue) : 0);
    };

    return (
        <input
            {...props}
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
        />
    );
}
