import React, { useState } from 'react';
import { useServer } from '../context/ServerContext';
import { useAuth } from '../context/AuthContext';
import { Focusable } from '../navigation/Focusable';
import { TvVirtualKeyboard } from '../components/TvVirtualKeyboard';
import { Server, Wifi, CheckCircle2, AlertCircle, RefreshCw, Tv, HelpCircle, LogOut } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { config, updateConfig, testConnection, refreshLibrary } = useServer();
  const { user, isDemoUser, signOut } = useAuth();

  const [serverUrl, setServerUrl] = useState(config.serverUrl);
  const [serverConnectionId, setServerConnectionId] = useState(config.serverConnectionId);
  const [authToken, setAuthToken] = useState(config.authToken || '');

  // Active virtual keyboard input field
  const [activeField, setActiveField] = useState<'serverUrl' | 'connectionId' | 'authToken' | null>(null);

  const [testStatus, setTestStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    latency?: number;
  }>({
    tested: false,
    success: false,
    message: '',
  });
  const [isTesting, setIsTesting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleTest = async () => {
    setIsTesting(true);
    setTestStatus({ tested: false, success: false, message: 'Pinging Sonzra host...' });
    const result = await testConnection(serverUrl, serverConnectionId);
    setTestStatus({
      tested: true,
      success: result.success,
      message: result.message,
      latency: result.latency,
    });
    setIsTesting(false);
  };

  const handleSave = () => {
    updateConfig({
      serverUrl,
      serverConnectionId,
      authToken,
      demoMode: false,
    });
    refreshLibrary();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const isTizenDetected =
    typeof window !== 'undefined' &&
    (window.tizen !== undefined || window.webapis !== undefined);

  // Virtual keyboard event handlers
  const handleKeyboardInput = (char: string) => {
    if (activeField === 'serverUrl') setServerUrl((prev) => prev + char);
    if (activeField === 'connectionId') setServerConnectionId((prev) => prev + char);
    if (activeField === 'authToken') setAuthToken((prev) => prev + char);
  };

  const handleKeyboardBackspace = () => {
    if (activeField === 'serverUrl') setServerUrl((prev) => prev.slice(0, -1));
    if (activeField === 'connectionId') setServerConnectionId((prev) => prev.slice(0, -1));
    if (activeField === 'authToken') setAuthToken((prev) => prev.slice(0, -1));
  };

  const handleKeyboardClear = () => {
    if (activeField === 'serverUrl') setServerUrl('');
    if (activeField === 'connectionId') setServerConnectionId('');
    if (activeField === 'authToken') setAuthToken('');
  };

  const activeFieldLabel =
    activeField === 'serverUrl'
      ? 'Sonzra Host / Server URL'
      : activeField === 'connectionId'
      ? 'Connection ID'
      : activeField === 'authToken'
      ? 'Authentication Bearer Token'
      : '';

  return (
    <div className="relative w-full flex-1 flex flex-col justify-start pb-32 select-none" role="main" aria-label="Settings & Profile">
      {/* Viewport Header */}
      <header className="flex flex-col gap-1 mb-8">
        <div className="flex items-center gap-3">
          <span className="text-secondary text-xs font-mono font-bold uppercase tracking-widest bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20">
            SYSTEM SETTINGS · AUDIOPHILE DAC
          </span>
          <span className="text-outline text-xs font-mono">10FT OLED EXPERIENCE</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">
            Settings & User Profile
          </h1>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_#43D7C6]"></span>
            <span className="text-xs font-mono text-secondary font-semibold">
              BIT-PERFECT DAC ACTIVE
            </span>
          </div>
        </div>
        <p className="text-sm text-on-surface-variant max-w-2xl">
          Manage your server connection, audio streaming endpoints, user identity, and Samsung Tizen platform diagnostics.
        </p>
      </header>

      {/* Main 2-Column Responsive TV Grid */}
      <div className="grid grid-cols-12 gap-8 items-start w-full">
        {/* Left Column (7 cols): Server & Endpoint Configuration */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          <section
            className="p-6 rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl border border-white/[0.06] shadow-2xl flex flex-col gap-5"
            aria-label="Server Connection Settings"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <Server size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-on-surface">Sonzra Server Connection</h2>
                  <p className="text-xs text-on-surface-variant">Core media server and streaming host address</p>
                </div>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-surface-container-high text-outline border border-white/[0.04]">
                REST + HLS / PCM
              </span>
            </div>

            {/* Field: Server URL */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Sonzra Host / Server URL
              </label>
              <Focusable
                focusId="input-server-url"
                group="settings-form"
                className="w-full cursor-pointer rounded-2xl"
                onEnter={() => setActiveField(activeField === 'serverUrl' ? null : 'serverUrl')}
                onClick={() => setActiveField(activeField === 'serverUrl' ? null : 'serverUrl')}
              >
                {({ isFocused }) => (
                  <div
                    className={`p-3.5 px-4 rounded-2xl flex items-center justify-between border transition-all ${
                      isFocused
                        ? 'bg-surface-container-high border-secondary ring-2 ring-secondary shadow-[0_0_20px_rgba(73,220,202,0.5)] scale-101'
                        : 'bg-surface-container/60 border-white/[0.06] hover:bg-surface-container/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="material-symbols-outlined text-outline text-[20px]">dns</span>
                      <span className="font-mono text-sm text-on-surface truncate">
                        {serverUrl || 'http://192.168.1.100:3000'}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-secondary px-2.5 py-1 rounded-lg bg-secondary/10 border border-secondary/20">
                      {activeField === 'serverUrl' ? 'Close Keyboard' : 'Press Enter to Edit'}
                    </span>
                  </div>
                )}
              </Focusable>
            </div>

            {/* Field: Connection ID */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Active Server Connection ID
              </label>
              <Focusable
                focusId="input-connection-id"
                group="settings-form"
                className="w-full cursor-pointer rounded-2xl"
                onEnter={() => setActiveField(activeField === 'connectionId' ? null : 'connectionId')}
                onClick={() => setActiveField(activeField === 'connectionId' ? null : 'connectionId')}
              >
                {({ isFocused }) => (
                  <div
                    className={`p-3.5 px-4 rounded-2xl flex items-center justify-between border transition-all ${
                      isFocused
                        ? 'bg-surface-container-high border-secondary ring-2 ring-secondary shadow-[0_0_20px_rgba(73,220,202,0.5)] scale-101'
                        : 'bg-surface-container/60 border-white/[0.06] hover:bg-surface-container/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="material-symbols-outlined text-outline text-[20px]">hub</span>
                      <span className="font-mono text-sm text-on-surface truncate">
                        {serverConnectionId || '1'}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-secondary px-2.5 py-1 rounded-lg bg-secondary/10 border border-secondary/20">
                      {activeField === 'connectionId' ? 'Close Keyboard' : 'Press Enter to Edit'}
                    </span>
                  </div>
                )}
              </Focusable>
            </div>

            {/* Field: Auth Token */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Authentication Token / Bearer Key (Optional)
              </label>
              <Focusable
                focusId="input-auth-token"
                group="settings-form"
                className="w-full cursor-pointer rounded-2xl"
                onEnter={() => setActiveField(activeField === 'authToken' ? null : 'authToken')}
                onClick={() => setActiveField(activeField === 'authToken' ? null : 'authToken')}
              >
                {({ isFocused }) => (
                  <div
                    className={`p-3.5 px-4 rounded-2xl flex items-center justify-between border transition-all ${
                      isFocused
                        ? 'bg-surface-container-high border-secondary ring-2 ring-secondary shadow-[0_0_20px_rgba(73,220,202,0.5)] scale-101'
                        : 'bg-surface-container/60 border-white/[0.06] hover:bg-surface-container/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="material-symbols-outlined text-outline text-[20px]">vpn_key</span>
                      <span className="font-mono text-sm text-on-surface truncate">
                        {authToken ? '••••••••••••••••••••' : 'No token set (Default Cookie Auth)'}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-secondary px-2.5 py-1 rounded-lg bg-secondary/10 border border-secondary/20">
                      {activeField === 'authToken' ? 'Close Keyboard' : 'Press Enter to Edit'}
                    </span>
                  </div>
                )}
              </Focusable>
            </div>

            {/* Integrated TV Virtual Keyboard Drawer */}
            {activeField && (
              <div className="mt-2 pt-4 border-t border-white/[0.06] animate-fadeIn">
                <TvVirtualKeyboard
                  activeFieldLabel={activeFieldLabel}
                  onKeyPress={handleKeyboardInput}
                  onBackspace={handleKeyboardBackspace}
                  onClear={handleKeyboardClear}
                  onSubmit={() => setActiveField(null)}
                />
              </div>
            )}


            {/* Action Buttons: Test Connection & Save */}
            <div className="flex items-center gap-4 pt-2">
              <Focusable
                focusId="btn-test-connection"
                group="settings-form"
                className="flex-1 cursor-pointer rounded-2xl"
                onEnter={handleTest}
                onClick={handleTest}
              >
                {({ isFocused }) => (
                  <button
                    disabled={isTesting}
                    className={`w-full py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-sm transition-all cursor-pointer ${
                      isFocused
                        ? 'bg-surface-container-highest text-secondary ring-2 ring-secondary shadow-[0_0_20px_rgba(73,220,202,0.6)] scale-102'
                        : 'bg-surface-container-high text-on-surface border border-white/[0.06] hover:bg-surface-container-highest'
                    }`}
                  >
                    <Wifi size={18} className={isTesting ? 'animate-spin' : ''} />
                    <span>{isTesting ? 'Pinging Host...' : 'Test Connection'}</span>
                  </button>
                )}
              </Focusable>

              <Focusable
                focusId="btn-save-settings"
                group="settings-form"
                className="flex-1 cursor-pointer rounded-2xl"
                onEnter={handleSave}
                onClick={handleSave}
              >
                {({ isFocused }) => (
                  <button
                    className={`w-full py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-sm transition-all cursor-pointer ${
                      isFocused
                        ? 'bg-secondary text-surface-container-lowest ring-2 ring-secondary shadow-[0_0_24px_rgba(73,220,202,0.85)] scale-102'
                        : 'bg-primary-container text-on-primary-container hover:bg-secondary hover:text-surface-container-lowest'
                    }`}
                  >
                    <RefreshCw size={18} />
                    <span>{isSaved ? 'Saved & Synced!' : 'Save & Sync Library'}</span>
                  </button>
                )}
              </Focusable>
            </div>

            {/* Test Connection Telemetry Feedback */}
            {testStatus.tested && (
              <div
                className={`p-4 rounded-2xl flex items-center gap-3 border transition-all ${
                  testStatus.success
                    ? 'bg-secondary/10 border-secondary/30 text-secondary'
                    : 'bg-error/10 border-error/30 text-error'
                }`}
              >
                {testStatus.success ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">
                      {testStatus.success ? 'Server Reachable & Verified' : 'Connection Failed'}
                    </span>
                    {testStatus.latency !== undefined && (
                      <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-secondary/20">
                        {testStatus.latency} ms
                      </span>
                    )}
                  </div>
                  <span className="text-xs opacity-90 truncate">{testStatus.message}</span>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Column (5 cols): Audiophile Profile Card & Tizen Telemetry */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          {/* Audiophile Profile Card */}
          <section
            className="p-6 rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl border border-white/[0.06] shadow-2xl flex flex-col gap-5"
            aria-label="Active User Account"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-surface-container-lowest font-extrabold text-2xl shadow-[0_0_24px_rgba(73,220,202,0.4)]">
                {user?.email_address ? user.email_address[0].toUpperCase() : 'S'}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-on-surface truncate">
                    {user ? user.email_address : isDemoUser ? 'Audiophile Demo' : 'Guest Account'}
                  </span>
                </div>
                <span className="text-xs text-secondary font-mono">
                  {isDemoUser ? 'Local Offline Preview' : 'User-Scoped Server API'}
                </span>
                <span className="text-[11px] text-outline mt-0.5">
                  Stereo PCM · Bit-Perfect DAC Stream Active
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Stream Quality</span>
                <span className="font-mono font-semibold text-secondary">Master FLAC 96kHz / 24-bit</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">eARC Master Hub</span>
                <span className="font-mono text-on-surface">Living Room Q90C</span>
              </div>
            </div>

            {/* Glowing Sign Out Button */}
            <Focusable
              focusId="btn-sign-out"
              group="settings-form"
              className="w-full cursor-pointer rounded-2xl mt-1"
              onEnter={signOut}
              onClick={signOut}
            >
              {({ isFocused }) => (
                <button
                  className={`w-full py-3 px-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition-all cursor-pointer ${
                    isFocused
                      ? 'bg-error text-white ring-2 ring-error shadow-[0_0_24px_rgba(255,84,73,0.8)] scale-102'
                      : 'bg-error/15 text-error border border-error/30 hover:bg-error/25'
                  }`}
                >
                  <LogOut size={18} />
                  <span>Sign Out & Switch User</span>
                </button>
              )}
            </Focusable>
          </section>

          {/* Tizen Diagnostics Card */}
          <section
            className="p-6 rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl border border-white/[0.06] shadow-2xl flex flex-col gap-4"
            aria-label="Platform Diagnostics"
          >
            <div className="flex items-center gap-3 pb-2 border-b border-white/[0.06]">
              <div className="w-9 h-9 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary">
                <Tv size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-on-surface">Tizen TV Environment</h2>
                <p className="text-xs text-on-surface-variant">Hardware target and rendering pipeline</p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Platform Detection</span>
                <span
                  className={`font-semibold font-mono ${
                    isTizenDetected ? 'text-secondary' : 'text-primary'
                  }`}
                >
                  {isTizenDetected ? 'Samsung Smart TV (Tizen 6.0+)' : 'Web Browser Simulator'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Canvas Resolution</span>
                <span className="font-mono text-on-surface">1920 × 1080 (1080p FHD 60Hz)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">GPU Compositing Plane</span>
                <span className="font-mono text-secondary font-semibold">
                  translateZ(0) · 90ms Curve
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Navigation Engine</span>
                <span className="font-mono text-secondary font-semibold">
                  2D Euclidean Spatial Matrix
                </span>
              </div>
            </div>
          </section>

          {/* Remote Control Mapping Card */}
          <section
            className="p-6 rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl border border-white/[0.06] shadow-2xl flex flex-col gap-4"
            aria-label="Remote Control Mapping"
          >
            <div className="flex items-center gap-3 pb-2 border-b border-white/[0.06]">
              <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center text-outline">
                <HelpCircle size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-on-surface">Remote Control Shortcuts</h2>
                <p className="text-xs text-on-surface-variant">10-Foot spatial key bindings</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-surface-container/60 border border-white/[0.04] flex flex-col gap-1">
                <span className="font-mono font-bold text-secondary text-[11px]">D-PAD ARROWS</span>
                <span className="text-on-surface-variant text-[11px]">Move 2D spatial focus</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container/60 border border-white/[0.04] flex flex-col gap-1">
                <span className="font-mono font-bold text-secondary text-[11px]">ENTER / OK</span>
                <span className="text-on-surface-variant text-[11px]">Select & play</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container/60 border border-white/[0.04] flex flex-col gap-1">
                <span className="font-mono font-bold text-secondary text-[11px]">RETURN / BACK</span>
                <span className="text-on-surface-variant text-[11px]">Go back to rail</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container/60 border border-white/[0.04] flex flex-col gap-1">
                <span className="font-mono font-bold text-secondary text-[11px]">GREEN KEY / 'P'</span>
                <span className="text-on-surface-variant text-[11px]">Jump to player dock</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
