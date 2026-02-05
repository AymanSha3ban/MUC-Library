import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Check local storage or system preference on mount
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDark(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDark(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDark(true);
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full backdrop-blur-md border border-white/20 text-slate-500 transition-all duration-300
                 dark:bg-red-800/30 dark:border-red-600/50 dark:text-red-300 dark:shadow-[0_0_15px_rgba(225,29,72,0.4)]
                 hover:bg-black/5 dark:hover:bg-red-700/40 relative overflow-hidden group"
            aria-label="Toggle theme"
        >
            <div className="relative z-10">
                {isDark ? (
                    <Sun size={20} className="animate-spin-slow-once" />
                ) : (
                    <Moon size={20} />
                )}
            </div>
            {/* Glow effect on hover */}
            <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/10 dark:group-hover:bg-red-500/10 transition-colors duration-300" />
        </button>
    );
}
