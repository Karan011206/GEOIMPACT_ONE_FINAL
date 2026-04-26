"use client";
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/src/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label="Toggle theme"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="theme-toggle-track">
        <div className={`theme-toggle-thumb ${theme}`}>
          {theme === 'light' ? (
            <Sun size={16} className="sun-icon" />
          ) : (
            <Moon size={16} className="moon-icon" />
          )}
        </div>
      </div>
      <span className="theme-label">
        {theme === 'light' ? 'Light' : 'Dark'}
      </span>
    </button>
  );
}
