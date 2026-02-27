import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const Alert = ({ children, type = 'info', className = '' }) => {
    const types = {
        info: {
            bg: 'bg-accent-blue/10',
            border: 'border-accent-blue/30',
            text: 'text-accent-blue',
            icon: Info
        },
        success: {
            bg: 'bg-accent-green/10',
            border: 'border-accent-green/30',
            text: 'text-accent-green',
            icon: CheckCircle2
        },
        error: {
            bg: 'bg-accent-red/10',
            border: 'border-accent-red/30',
            text: 'text-accent-red',
            icon: AlertCircle
        }
    };

    const style = types[type];
    const Icon = style.icon;

    if (!children) return null;

    return (
        <div className={`flex items-center gap-3 p-4 border rounded-xl ${style.bg} ${style.border} ${style.text} ${className}`}>
            <Icon size={18} />
            <div className="text-sm font-medium">{children}</div>
        </div>
    );
};

export default Alert;
