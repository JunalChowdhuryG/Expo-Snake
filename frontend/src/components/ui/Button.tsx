import React, { forwardRef } from "react"
import type { ButtonHTMLAttributes } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost"
    size?: "sm" | "md" | "lg"
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        { className = "", variant = "primary", size = "md", children, ...props },
        ref
    ) => {
        const baseStyles =
            "font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"

        const variants = {
            primary:
                "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 focus:ring-emerald-500/30",
            secondary:
                "bg-slate-700 hover:bg-slate-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 focus:ring-slate-500/30",
            outline:
                "border-2 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/20 bg-slate-800/60 backdrop-blur-sm hover:border-emerald-400/60 focus:ring-emerald-500/20",
            ghost:
                "text-emerald-400 hover:bg-emerald-500/10 focus:ring-emerald-500/20",
        }

        const sizes = {
            sm: "px-4 py-2 text-sm",
            md: "px-6 py-3 text-base",
            lg: "px-8 py-4 text-lg",
        }

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                {...props}
            >
                {children}
            </button>
        )
    }
)

Button.displayName = "Button"

export { Button }
