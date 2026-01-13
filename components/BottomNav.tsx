import React, { useState, useRef, useEffect, useMemo } from 'react';

type Page = 'calculator' | 'dashboard' | 'tournament';

interface BottomNavProps {
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentPage, setCurrentPage }) => {
    const [indicatorStyle, setIndicatorStyle] = useState({});
    const navRef = useRef<HTMLDivElement>(null);

    const dashboardRef = useRef<HTMLButtonElement>(null);
    const calculatorRef = useRef<HTMLButtonElement>(null);
    const tournamentRef = useRef<HTMLButtonElement>(null);

    const buttonRefs = useMemo(() => ({
        dashboard: dashboardRef,
        calculator: calculatorRef,
        tournament: tournamentRef,
    }), []);

    useEffect(() => {
        const activeButtonRef = buttonRefs[currentPage];
        if (activeButtonRef.current) {
            const { offsetLeft, offsetWidth } = activeButtonRef.current;
            const indicatorWidth = offsetWidth * 0.4; // 40% of button width
            const indicatorLeft = offsetLeft + (offsetWidth - indicatorWidth) / 2;
            setIndicatorStyle({
                left: `${indicatorLeft}px`,
                width: `${indicatorWidth}px`,
            });
        }
    }, [currentPage, buttonRefs]);

    const NavButton: React.FC<{ page: Page; emoji: string }> = ({ page, emoji }) => {
        const isActive = currentPage === page;
        return (
            <button
                ref={buttonRefs[page]}
                onClick={() => setCurrentPage(page)}
                className={`flex-1 py-3 text-2xl transition-all duration-300 ease-in-out relative z-10 ${
                    isActive ? 'text-white scale-110' : 'text-[var(--color-text-muted)] hover:text-white'
                }`}
            >
                {emoji}
            </button>
        );
    };

    return (
        <footer
            ref={navRef}
            className="fixed bottom-0 left-0 w-full flex justify-evenly items-center bg-[var(--color-surface)] z-40 border-t border-[var(--color-border)] shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.3)] animate-slide-in-up backdrop-blur-md"
            style={{ paddingBottom: `env(safe-area-inset-bottom)` }}
        >
            <div
                className="absolute bg-[var(--color-primary)] h-1 top-0 rounded-full transition-all duration-500 ease-in-out box-shadow-[0_0_10px_var(--color-primary)]"
                style={{ ...indicatorStyle }}
            />
            <NavButton page="dashboard" emoji="📊" />
            <NavButton page="calculator" emoji="🧮" />
            <NavButton page="tournament" emoji="🏆" />
        </footer>
    );
};

export default BottomNav;