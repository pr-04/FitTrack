// Reusable summary/stat card for the dashboard
const SummaryCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend, progress }) => {
    const colorMap = {
        blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
        purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
        green: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
        orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
        cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
        red: 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400',
    };

    const iconBg = {
        blue: 'bg-blue-500/20 text-blue-400',
        purple: 'bg-purple-500/20 text-purple-400',
        green: 'bg-emerald-500/20 text-emerald-400',
        orange: 'bg-orange-500/20 text-orange-400',
        cyan: 'bg-cyan-500/20 text-cyan-400',
        red: 'bg-red-500/20 text-red-400',
    };

    const progressBg = {
        blue: 'bg-blue-400',
        purple: 'bg-purple-400',
        green: 'bg-emerald-400',
        orange: 'bg-orange-400',
        cyan: 'bg-cyan-400',
        red: 'bg-red-400',
    };

    return (
        <div className={`glass-card rounded-[32px] p-6 transition-all duration-500 hover:scale-[1.03] group ${colorMap[color]}`}>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">{title}</p>
                </div>
                {Icon && (
                    <div className={`w-10 h-10 rounded-xl ${iconBg[color]} flex items-center justify-center`}>
                        <Icon size={20} />
                    </div>
                )}
            </div>
            <div>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{value ?? '—'}</p>
                {subtitle && <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{subtitle}</p>}

                {progress !== undefined && (
                    <div className="w-full bg-slate-200 dark:bg-dark-900 rounded-full h-1.5 mt-4 overflow-hidden shadow-inner">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${progress >= 100 && color === 'orange' ? 'bg-red-500' : progressBg[color]}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>
                )}

                {trend !== undefined && (
                    <p className={`text-xs mt-2 font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% from last week
                    </p>
                )}
            </div>
        </div>
    );
};

export default SummaryCard;
