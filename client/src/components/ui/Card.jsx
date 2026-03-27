import React from 'react';

const Card = ({ children, className = '', ...props }) => {
    return (
        <div
            className={`glass-card rounded-[32px] p-6 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
