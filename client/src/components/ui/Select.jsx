import React from 'react';
import { ChevronDown } from 'lucide-react';

const Select = ({ label, options = [], className = '', ...props }) => {
    return (
        <div className={`w-full group ${className}`}>
            {label && <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1 transition-colors">
                {label}
            </label>}
            <div className="relative">
                <select
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-4 h-12 
                    text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-600 focus:ring-1 
                    focus:ring-blue-600/30 transition-all duration-200 shadow-sm appearance-none cursor-pointer 
                    hover:border-slate-400 dark:hover:border-slate-600 font-medium"
                    {...props}
                >
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 py-2">
                            {opt.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-focus-within:text-accent-blue transition-colors">
                    <ChevronDown size={18} />
                </div>
            </div>
        </div>
    );
};

export default Select;
