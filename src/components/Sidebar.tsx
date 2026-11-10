import React from 'react';
import { useSpatialNav } from '../navigation/SpatialNavigationContext';
import { Focusable } from '../navigation/Focusable';
import { ActiveView } from '../types/navigation';

export const Sidebar: React.FC = () => {
  const { activeView, goToView } = useSpatialNav();

  const navItems: Array<{ id: string; view: ActiveView; label: string; icon: string }> = [
    { id: 'sidebar-home', view: 'home', label: 'Home', icon: 'home' },
    { id: 'sidebar-library', view: 'library', label: 'Library', icon: 'grid_view' },
    { id: 'sidebar-now-playing', view: 'now-playing', label: 'Now Playing', icon: 'music_note' },
    { id: 'sidebar-search', view: 'search', label: 'Search', icon: 'search' },
  ];

  return (
    <aside
      className="fixed left-0 top-0 h-full w-24 bg-surface-container-lowest/90 backdrop-blur-2xl z-50 flex flex-col items-center py-6 justify-between border-r border-white/[0.04] shadow-[0_1px_8px_rgba(0,0,0,0.04)] select-none"
      role="navigation"
      aria-label="TV Main Navigation"
    >
      <div className="flex flex-col items-center gap-7 w-full">
        {/* Brand Glyph */}
        <div
          className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary-container to-secondary flex items-center justify-center shadow-[0_0_24px_rgba(122,90,248,0.55)] cursor-pointer"
          onClick={() => goToView('home')}
          title="Sonzra TV"
        >
          <span className="material-symbols-outlined text-surface-container-lowest text-[28px] font-bold">
            graphic_eq
          </span>
        </div>

        {/* TV Nav Icons */}
        <nav className="flex flex-col items-center gap-4 w-full px-2">
          {navItems.map((item) => {
            const isActive =
              activeView === item.view ||
              (item.view === 'library' && (activeView === 'albums' || activeView === 'album-detail' || activeView === 'artists' || activeView === 'artist-detail'));

            return (
              <Focusable
                key={item.id}
                focusId={item.id}
                group="sidebar"
                className="w-14 h-14 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-200"
                onEnter={() => goToView(item.view)}
                onClick={() => goToView(item.view)}
              >
                {({ isFocused }) => (
                  <div
                    className={`w-full h-full rounded-2xl flex items-center justify-center transition-all duration-200 ${
                      isFocused
                        ? 'bg-surface-container-high text-primary ring-2 ring-secondary shadow-[0_0_22px_rgba(73,220,202,0.5)] scale-105'
                        : isActive
                        ? 'bg-surface-container-high text-primary ring-1 ring-secondary/50 shadow-[0_0_15px_rgba(73,220,202,0.25)]'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    }`}
                    title={item.label}
                  >
                    <span className="material-symbols-outlined text-[28px]">
                      {item.icon}
                    </span>
                  </div>
                )}
              </Focusable>
            );
          })}
        </nav>
      </div>

      {/* Bottom Settings & Account Profile */}
      <div className="flex flex-col items-center gap-4 w-full px-2">
        <Focusable
          focusId="sidebar-settings"
          group="sidebar"
          className="w-14 h-14 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-200"
          onEnter={() => goToView('settings')}
          onClick={() => goToView('settings')}
        >
          {({ isFocused }) => {
            const isActive = activeView === 'settings';
            return (
              <div
                className={`w-full h-full rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  isFocused
                    ? 'bg-surface-container-high text-primary ring-2 ring-secondary shadow-[0_0_22px_rgba(73,220,202,0.5)] scale-105'
                    : isActive
                    ? 'bg-surface-container-high text-primary ring-1 ring-secondary/50'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
                title="Settings"
              >
                <span className="material-symbols-outlined text-[26px]">settings</span>
              </div>
            );
          }}
        </Focusable>

        <div
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-[0_0_14px_rgba(202,190,255,0.35)] ring-2 ring-primary/40 cursor-pointer"
          title="User Profile"
        >
          <span className="material-symbols-outlined text-on-primary text-[20px]">person</span>
        </div>
      </div>
    </aside>
  );
};
