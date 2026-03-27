import React from 'react';

const Input = ({ label, error, className = '', containerClassName = '', leftElement, rightElement, ...props }) => {
    return (
        <div className={`w-full ${containerClassName}`}>
            {label && <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5 ml-1">{label}</label>}
            <div className="relative group/input">
                <input
                    className={`
            w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 
            text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none 
            focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30
            transition-all duration-200 shadow-sm
            ${leftElement ? 'pl-11' : ''}
            ${rightElement ? 'pr-11' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : ''}
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
