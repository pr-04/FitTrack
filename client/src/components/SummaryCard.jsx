// Reusable summary/stat card for the dashboard
const SummaryCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend, progress }) => {
    const colorMap = {
        blue: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/5 text-blue-600 dark:text-blue-400',
        purple: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/5 text-purple-600 dark:text-purple-400',
        green: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/5 text-emerald-600 dark:text-emerald-400',
        orange: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/5 text-orange-600 dark:text-orange-400',
        cyan: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/5 text-cyan-600 dark:text-cyan-400',
        red: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/5 text-red-600 dark:text-red-400',
    };

    const iconBg = {
        blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
        purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
        green: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        orange: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400',
        cyan: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
        red: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
    };

    const progressBg = {
        blue: 'bg-blue-500',
        purple: 'bg-purple-500',
        green: 'bg-emerald-500',
        orange: 'bg-orange-500',
        cyan: 'bg-cyan-500',
        red: 'bg-red-500',
    };

    return (
        <div className={`rounded-xl p-6 border transition-all duration-200 ${colorMap[color]}`}>
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
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-4 overflow-hidden">
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
