import React from 'react';

const Card = ({ children, className = '', ...props }) => {
    return (
        <div
            className={`bg-dark-800 rounded-2xl p-6 border border-slate-700/50 shadow-xl ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
