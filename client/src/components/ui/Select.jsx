import React from 'react';
import { ChevronDown } from 'lucide-react';

const Select = ({ label, options = [], className = '', ...props }) => {
    return (
        <div className={`w-full group ${className}`}>
            {label && <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-1 group-focus-within:text-accent-blue transition-colors">
                {label}
            </label>}
            <div className="relative">
                <select
                    className="w-full bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl px-5 h-14 
                    text-white focus:outline-none focus:border-accent-blue/50 focus:ring-2 
                    focus:ring-accent-blue/20 transition-all duration-300 shadow-xl appearance-none cursor-pointer 
                    hover:bg-slate-800/60 hover:border-slate-600 font-medium"
                    {...props}
                >
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value} className="bg-slate-900 text-white py-4">
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
