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
        primary: 'bg-gradient-to-r from-accent-blue to-accent-purple text-white shadow-lg shadow-accent-blue/20 hover:shadow-accent-blue/40 border-transparent',
        danger: 'bg-accent-red/10 dark:bg-accent-red/20 text-accent-red border border-accent-red/30 hover:bg-accent-red hover:text-white',
        ghost: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 border-transparent',
        outline: 'border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
    };

    const baseStyles = 'inline-flex items-center justify-center font-bold px-6 py-3 rounded-2xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 btn-premium tracking-tight';

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
