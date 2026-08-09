import React from 'react';
import StatusIndicator from './status_indicator';
import ProfilesDropdown from '../dropdowns/profiles_menu';
import ThemeToggle from './theme_toggle';

function HeaderAppbar() {

    return (
        <header
            className="static w-full bg-brand-black text-white border-b shadow-sm"
        >
            <div
                className="flex items-center justify-between min-h-[38px] px-4"
            >
                <h6 className="text-xl font-medium leading-relaxed">
                    HeliosTrace
                </h6>

                <div className="flex items-center justify-end text-[12px]">
                    <ProfilesDropdown />
                    <ThemeToggle />
                    <StatusIndicator />
                </div>
            </div>
        </header>
    );
}

export default HeaderAppbar;
