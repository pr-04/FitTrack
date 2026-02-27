import React from 'react';

const Select = ({ label, options = [], className = '', ...props }) => {
    return (
        <div className={`w-full ${className}`}>
            {label && <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">{label}</label>}
            <select
                className="w-full bg-dark-900 border border-slate-700 rounded-xl px-4 py-3 
                 text-slate-100 focus:outline-none focus:border-accent-blue focus:ring-1 
                 focus:ring-accent-blue transition-all duration-200"
                {...props}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
};

export default Select;
