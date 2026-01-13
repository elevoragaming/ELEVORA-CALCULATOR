import React, { useState, useMemo, useRef } from 'react';
import { MatchRecord, MapType, MatchType } from '../types';
import { MAP_OPTIONS, MATCH_TYPES } from '../constants';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ConfirmationModal from './ConfirmationModal';
import UndoToast from './UndoToast';

interface DashboardProps {
    matchHistory: MatchRecord[];
    onRemoveMatch: (matchId: string) => void;
    onAddMatch: (match: MatchRecord) => void;
}

type SortKey = keyof MatchRecord | '';
type SortOrder = 'asc' | 'desc';

const formatCurrency = (value: number) => `PKR ${Math.round(value).toLocaleString('en-US')}`;

const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode, delay: number }> = ({ title, value, icon, delay }) => (
    <div className="bg-[var(--color-surface)] p-6 rounded-lg shadow-lg flex items-center space-x-4 border-l-4 border-[var(--color-primary)] animate-slide-in-up" style={{ animationDelay: `${delay}ms`}}>
        <div className="text-4xl text-[var(--color-primary)]">{icon}</div>
        <div>
            <p className="text-lg text-[var(--color-text-muted)] uppercase">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
        </div>
    </div>
);

const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const tableHeaders: { key: SortKey; label: string }[] = [
    { key: 'date', label: 'Date' },
    { key: 'map', label: 'Map' },
    { key: 'mode', label: 'Mode' },
    { key: 'entryFee', label: 'Entry Fee' },
    { key: 'totalPlayers', label: 'Players' },
    { key: 'totalPool', label: 'Total Pool' },
    { key: 'totalPayout', label: 'Total Payout' },
    { key: 'profit', label: 'Profit' },
];


const Dashboard: React.FC<DashboardProps> = ({ matchHistory, onRemoveMatch, onAddMatch }) => {
    const [mapFilter, setMapFilter] = useState<MapType | 'All'>('All');
    const [modeFilter, setModeFilter] = useState<MatchType | 'All'>('All');
    const [sortKey, setSortKey] = useState<SortKey>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [matchToDelete, setMatchToDelete] = useState<string | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [lastDeletedMatch, setLastDeletedMatch] = useState<MatchRecord | null>(null);
    const [showUndoToast, setShowUndoToast] = useState(false);
    const undoTimeoutRef = useRef<number | null>(null);

    const filteredHistory = useMemo(() => {
        return matchHistory
            .filter(match => (mapFilter === 'All' || match.map === mapFilter))
            .filter(match => (modeFilter === 'All' || match.mode === modeFilter));
    }, [matchHistory, mapFilter, modeFilter]);

    const sortedHistory = useMemo(() => {
        if (!sortKey) return filteredHistory;
        return [...filteredHistory].sort((a, b) => {
            const valA = a[sortKey];
            const valB = b[sortKey];
            
            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredHistory, sortKey, sortOrder]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('desc');
        }
    };

    const handleFilterChange = (filterSetter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
        setIsTransitioning(true); // Start fade-out animation
        setTimeout(() => {
            filterSetter(value);
            setIsTransitioning(false); // End animation phase
        }, 300); // Duration should match the fade-out animation
    };

    const handleRemoveClick = (matchId: string) => {
        setMatchToDelete(matchId);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmRemove = () => {
        if (matchToDelete) {
            const matchToRemove = matchHistory.find(match => match.id === matchToDelete);
            if (matchToRemove) {
                setLastDeletedMatch(matchToRemove);
                onRemoveMatch(matchToDelete);
                setShowUndoToast(true);
                if (undoTimeoutRef.current) {
                    clearTimeout(undoTimeoutRef.current);
                }
            }
        }
        setIsConfirmModalOpen(false);
        setMatchToDelete(null);
    };

    const handleUndo = () => {
        if (lastDeletedMatch) {
            onAddMatch(lastDeletedMatch);
        }
    };
    
    const handleToastClose = () => {
        setLastDeletedMatch(null); 
        setShowUndoToast(false);
    };

    const summaryStats = useMemo(() => {
        return filteredHistory.reduce((acc, match) => {
            acc.totalProfit += match.profit;
            acc.totalPayouts += match.totalPayout;
            acc.totalCollected += match.totalPool;
            return acc;
        }, { totalProfit: 0, totalPayouts: 0, totalCollected: 0 });
    }, [filteredHistory]);

    const chartData = useMemo(() => {
        return [...filteredHistory]
            .reverse() // chart from oldest to newest
            .map(match => ({
                name: new Date(match.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                Profit: match.profit,
            }));
    }, [filteredHistory]);

    const renderSortArrow = (key: SortKey) => {
        if (sortKey !== key) return null;
        return sortOrder === 'desc' ? ' ▼' : ' ▲';
    };

    return (
        <>
            <div className="space-y-8">
                <header className="text-center animate-slide-in-up" style={{ animationDelay: '100ms' }}>
                    <h1 className="text-5xl md:text-7xl font-bold text-[var(--color-primary)] uppercase header-glow">Performance Dashboard</h1>
                    <p className="text-xl text-[var(--color-text-muted)]">Summary & Profit Tracker</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-2xl">
                    <StatCard title="Total Matches" value={String(filteredHistory.length)} icon={'📊'} delay={200} />
                    <StatCard title="Total Profit" value={formatCurrency(summaryStats.totalProfit)} icon={'💰'} delay={300} />
                    <StatCard title="Total Payouts" value={formatCurrency(summaryStats.totalPayouts)} icon={'💸'} delay={400}/>
                    <StatCard title="Total Collected" value={formatCurrency(summaryStats.totalCollected)} icon={'💵'} delay={500} />
                </div>
                
                <div className="bg-[var(--color-surface)] p-6 rounded-lg shadow-lg animate-slide-in-up" style={{ animationDelay: '600ms' }}>
                    <h2 className="text-3xl font-bold text-[var(--color-primary)] uppercase border-b-2 border-[var(--color-primary)] pb-2 mb-4">Profit Over Time</h2>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="name" stroke="var(--color-text-muted)" />
                                <YAxis stroke="var(--color-text-muted)" tickFormatter={(value) => `${value / 1000}k`} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface-light)', border: '1px solid var(--color-border)' }} />
                                <Legend />
                                <Line type="monotone" dataKey="Profit" stroke="var(--color-success)" strokeWidth={3} dot={{ r: 5, fill: 'var(--color-success)' }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-[var(--color-surface)] p-6 rounded-lg shadow-lg animate-slide-in-up" style={{ animationDelay: '700ms' }}>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-4">
                        <h2 className="text-3xl font-bold text-[var(--color-primary)] uppercase flex-shrink-0">Match History</h2>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                            <select value={mapFilter} onChange={(e) => handleFilterChange(setMapFilter, e.target.value as any)} className="filter-select">
                                <option value="All">All Maps</option>
                                {MAP_OPTIONS.map(map => <option key={map} value={map}>{map}</option>)}
                            </select>
                            <select value={modeFilter} onChange={(e) => handleFilterChange(setModeFilter, e.target.value as any)} className="filter-select">
                                <option value="All">All Modes</option>
                                {MATCH_TYPES.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <table className="w-full text-left dashboard-table">
                            <thead className="hidden md:table-header-group">
                                <tr>
                                {tableHeaders.map(({ key, label }) => (
                                        <th key={key} className="cursor-pointer whitespace-nowrap" onClick={() => handleSort(key)}>
                                            {label.toUpperCase()}
                                            {renderSortArrow(key)}
                                        </th>
                                    ))}
                                    <th className="text-right">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedHistory.map((match, index) => (
                                    <React.Fragment key={match.id}>
                                        {/* Desktop Row */}
                                        <tr 
                                          className={`hidden md:table-row ${isTransitioning ? 'row-fade-out' : 'animate-slide-in-up'}`}
                                          style={{ animationDelay: isTransitioning ? '0s' : `${index * 50}ms` }}
                                        >
                                            <td className="whitespace-nowrap">{new Date(match.date).toLocaleString()}</td>
                                            <td>{match.map}</td>
                                            <td>{match.mode}</td>
                                            <td>{formatCurrency(match.entryFee)}</td>
                                            <td>{match.totalPlayers}</td>
                                            <td>{formatCurrency(match.totalPool)}</td>
                                            <td>{formatCurrency(match.totalPayout)}</td>
                                            <td className={match.profit >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}>
                                                {formatCurrency(match.profit)}
                                            </td>
                                            <td className="text-right">
                                                <button 
                                                    onClick={() => handleRemoveClick(match.id)}
                                                    className="text-[var(--color-danger)] hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-500/10"
                                                    title="Remove Match"
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </td>
                                        </tr>
                                        {/* Mobile Card Row */}
                                        <tr
                                          className={`md:hidden ${isTransitioning ? 'row-fade-out' : 'animate-slide-in-up'}`}
                                          style={{ animationDelay: isTransitioning ? '0s' : `${index * 50}ms` }}
                                        >
                                            <td colSpan={tableHeaders.length + 1} className="p-0">
                                                <div className="p-4 space-y-3 border-b border-[var(--color-border)]">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="text-xl font-bold text-white">{match.map} <span className="text-lg font-normal text-[var(--color-text-muted)]">({match.mode})</span></p>
                                                            <p className="text-base text-[var(--color-text-muted)]">{new Date(match.date).toLocaleString()}</p>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleRemoveClick(match.id)}
                                                            className="text-[var(--color-danger)] hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-500/10 -mt-2 -mr-2 flex-shrink-0"
                                                            title="Remove Match"
                                                        >
                                                            <TrashIcon />
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-base">
                                                        <div>
                                                            <p className="text-sm uppercase text-[var(--color-text-muted)]">Entry Fee</p>
                                                            <p>{formatCurrency(match.entryFee)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm uppercase text-[var(--color-text-muted)]">Players</p>
                                                            <p>{match.totalPlayers}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm uppercase text-[var(--color-text-muted)]">Total Pool</p>
                                                            <p>{formatCurrency(match.totalPool)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm uppercase text-[var(--color-text-muted)]">Total Payout</p>
                                                            <p>{formatCurrency(match.totalPayout)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="pt-2 border-t border-[var(--color-border)]/50">
                                                         <p className="text-sm uppercase text-[var(--color-text-muted)]">Profit</p>
                                                         <p className={`text-xl font-bold ${match.profit >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                                                            {formatCurrency(match.profit)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                        {sortedHistory.length === 0 && !isTransitioning && (
                            <p className="text-center text-2xl text-[var(--color-text-muted)] py-8">No matches found. Try adjusting filters or save a match from the calculator!</p>
                        )}
                    </div>
                </div>
            </div>
            <ConfirmationModal 
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmRemove}
                title="Confirm Deletion"
                message="Are you sure you want to remove this match record? This can be undone for a few seconds."
            />
            <UndoToast
                show={showUndoToast}
                onUndo={handleUndo}
                onClose={handleToastClose}
                message="Match record deleted."
            />
        </>
    );
};

export default Dashboard;