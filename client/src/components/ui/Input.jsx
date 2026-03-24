import React from 'react';

const Input = ({ label, error, className = '', containerClassName = '', leftElement, rightElement, ...props }) => {
    return (
        <div className={`w-full ${containerClassName}`}>
            {label && <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5 ml-1">{label}</label>}
            <div className="relative group/input">
                <input
                    className={`
            w-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-300 dark:border-slate-700/50 rounded-xl px-4 py-3 
            text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none 
            focus:border-accent-blue focus:ring-1 focus:ring-accent-blue 
            transition-all duration-200 shadow-sm
            ${leftElement ? 'pl-11' : ''}
            ${rightElement ? 'pr-11' : ''}
            ${error ? 'border-accent-red focus:border-accent-red focus:ring-accent-red' : ''}
            ${className}
          `}
                    {...props}
                />
                {leftElement && (
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                        {leftElement}
                    </div>
                )}
                {rightElement && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                        {rightElement}
                    </div>
                )}
            </div>
            {error && <p className="mt-1 text-xs text-accent-red ml-1">{error}</p>}
        </div>
    );
};

export default Input;
