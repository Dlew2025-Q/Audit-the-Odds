import React from 'react';

export function FilterControls({ resetApp }) {
    return (
        <div className="mb-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <p className="text-center">Filters and Parlay Builders will be migrated here.</p>
            <button onClick={resetApp} className="utility-btn text-sm">New Analysis</button>
        </div>
    );
}
