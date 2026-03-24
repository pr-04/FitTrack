import React from 'react';

const Select = ({ label, options = [], className = '', ...props }) => {
    return (
        <div className={`w-full ${className}`}>
            {label && <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5 ml-1">{label}</label>}
            <select
                className="w-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-300 dark:border-slate-700/50 rounded-xl px-4 py-3 
                 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-accent-blue focus:ring-1 
                 focus:ring-accent-blue transition-all duration-200 shadow-sm appearance-none cursor-pointer"
                {...props}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">{opt.label}</option>
                ))}
            </select>
        </div>
    );
};

export default Select;
