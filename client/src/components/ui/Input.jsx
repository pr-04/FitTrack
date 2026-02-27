import React from 'react';

const Input = ({ label, error, className = '', containerClassName = '', rightElement, ...props }) => {
    return (
        <div className={`w-full ${containerClassName}`}>
            {label && <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">{label}</label>}
            <div className="relative group/input">
                <input
                    className={`
            w-full bg-dark-900 border border-slate-700 rounded-xl px-4 py-3 
            text-slate-100 placeholder-slate-500 focus:outline-none 
            focus:border-accent-blue focus:ring-1 focus:ring-accent-blue 
            transition-all duration-200
            ${rightElement ? 'pr-20' : ''}
            ${error ? 'border-accent-red focus:border-accent-red focus:ring-accent-red' : ''}
            ${className}
          `}
                    {...props}
                />
                {rightElement && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        {rightElement}
                    </div>
                )}
            </div>
            {error && <p className="mt-1 text-xs text-accent-red ml-1">{error}</p>}
        </div>
    );
};

export default Input;
