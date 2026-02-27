import React from 'react';

const Button = ({
    children,
    variant = 'primary',
    className = '',
    loading = false,
    disabled = false,
    ...props
}) => {
    const variants = {
        primary: 'bg-gradient-to-r from-accent-blue to-accent-purple text-white shadow-lg shadow-accent-blue/20 hover:shadow-accent-blue/40',
        danger: 'bg-accent-red/10 text-accent-red border border-accent-red/30 hover:bg-accent-red hover:text-white',
        ghost: 'text-slate-400 hover:text-white hover:bg-slate-700/50',
        outline: 'border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
    };

    const baseStyles = 'inline-flex items-center justify-center font-semibold px-6 py-3 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Loading...</span>
                </span>
            ) : children}
        </button>
    );
};

export default Button;
