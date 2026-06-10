import React from 'react';
import { cn } from '@/lib/utils';
import { Circle } from 'lucide-react';

const RadioGroupContext = React.createContext({});

const RadioGroup = React.forwardRef(({ className, value, onValueChange, children, ...props }, ref) => {
    return (
        <RadioGroupContext.Provider value={{ value, onValueChange }}>
            <div className={cn("grid gap-2", className)} ref={ref} {...props}>
                {children}
            </div>
        </RadioGroupContext.Provider>
    );
});
RadioGroup.displayName = "RadioGroup";

const RadioGroupItem = React.forwardRef(({ className, value: itemValue, ...props }, ref) => {
    const { value, onValueChange } = React.useContext(RadioGroupContext);
    const isChecked = value === itemValue;

    return (
        <button
            type="button"
            role="radio"
            aria-checked={isChecked}
            ref={ref}
            className={cn(
                "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            onClick={() => onValueChange && onValueChange(itemValue)}
            {...props}
        >
            <span className="flex items-center justify-center">
                {isChecked && <Circle className="h-2.5 w-2.5 fill-current text-current" />}
            </span>
        </button>
    )
});
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
