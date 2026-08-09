import React, { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isDarkTheme, toggleTheme } from '../../../style/theme';

export default function ThemeToggle() {
    const [dark, setDark] = useState(isDarkTheme());

    const handleToggle = () => {
        setDark(toggleTheme() === 'dark');
    };

    return (
        <Button
            variant="ghost"
            size="icon-sm"
            className="mx-[5px] text-white! hover:bg-white/20"
            aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
            onClick={handleToggle}
        >
            {dark ? <Sun /> : <Moon />}
        </Button>
    );
}
