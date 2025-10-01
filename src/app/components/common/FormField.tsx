"use client";

import { UseFormRegister, FieldErrors } from "react-hook-form";
import clsx from "clsx";

interface FormFieldProps {
    name: string;
    label: string;
    type?: "text" | "number" | "password" | "textarea";
    register: UseFormRegister<any>;
    errors: FieldErrors;
    placeholder?: string;
    rows?: number;
    className?: string;
}

export function FormField({
    name,
    label,
    type = "text",
    register,
    errors,
    placeholder,
    rows = 3,
    className = "",
}: FormFieldProps) {
    const error = errors[name];
    const baseStyle =
        "w-full p-3 border-2 rounded-xl focus:border-primary focus:outline-none transition-colors duration-200";
    const errorStyle = error ? "border-error" : "border-gray-200";

    return (
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
                {label}
            </label>
            {type === "textarea" ? (
                <textarea
                    {...register(name)}
                    className={clsx(
                        baseStyle,
                        errorStyle,
                        "resize-none",
                        className
                    )}
                    placeholder={placeholder}
                    rows={rows}
                />
            ) : (
                <input
                    type={type}
                    {...register(name)}
                    className={clsx(baseStyle, errorStyle, className)}
                    placeholder={placeholder}
                />
            )}
            {error && (
                <p className="text-error text-sm font-medium mt-1">
                    {error.message as string}
                </p>
            )}
        </div>
    );
}
