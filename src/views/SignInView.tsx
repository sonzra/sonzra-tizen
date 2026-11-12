import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useServer } from '../context/ServerContext';
import { Focusable } from '../navigation/Focusable';
import { TvVirtualKeyboard } from '../components/TvVirtualKeyboard';

type ActiveField = 'email' | 'password' | 'server';

export const SignInView: React.FC = () => {
  const { signIn, enterDemoMode, loading: authLoading } = useAuth();
  const { config } = useServer();

  const [email, setEmail] = useState<string>('demo@sonzra.com');
  const [password, setPassword] = useState<string>('password');
  const [serverUrl, setServerUrl] = useState<string>(config.serverUrl || 'http://192.168.31.139:3000');
  const [activeField, setActiveField] = useState<ActiveField>('email');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAdvancedServer, setShowAdvancedServer] = useState<boolean>(false);

  const handleKeyPress = (char: string) => {
    setErrorMessage(null);
    if (activeField === 'email') {
      setEmail((prev) => prev + char);
    } else if (activeField === 'password') {
      setPassword((prev) => prev + char);
    } else if (activeField === 'server') {
      setServerUrl((prev) => prev + char);
    }
  };

  const handleBackspace = () => {
    setErrorMessage(null);
    if (activeField === 'email') {
      setEmail((prev) => prev.slice(0, -1));
    } else if (activeField === 'password') {
      setPassword((prev) => prev.slice(0, -1));
    } else if (activeField === 'server') {
      setServerUrl((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    setErrorMessage(null);
    if (activeField === 'email') setEmail('');
    if (activeField === 'password') setPassword('');
    if (activeField === 'server') setServerUrl('');
  };

  const handleFormSubmit = async () => {
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      setActiveField('email');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      setActiveField('password');
      return;
    }

    setErrorMessage(null);
    try {
      await signIn(email.trim(), password, serverUrl.trim());
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-background text-on-surface antialiased select-none flex items-center justify-center p-12"
      role="region"
      aria-label="Sonzra TV Sign In"
    >
      {/* Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_20%_25%,rgba(122,90,248,0.25)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(73,220,202,0.18)_0%,transparent_45%)]"></div>

      <div className="relative z-10 grid grid-cols-12 gap-12 w-full max-w-7xl h-full max-h-[920px] items-center">
        {/* Left Column: Branding, Mission, Demo CTA */}
        <div className="col-span-12 lg:col-span-5 flex flex-col justify-center gap-6 pr-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-container to-secondary flex items-center justify-center shadow-[0_0_32px_rgba(122,90,248,0.65)] ring-1 ring-white/10">
              <span className="material-symbols-outlined text-surface-container-lowest text-[36px] font-bold">
                graphic_eq
              </span>
            </div>
            <div>
              <span className="text-[12px] font-bold uppercase tracking-[0.25em] text-secondary font-mono">
                10-FOOT LIVING ROOM EDITION
              </span>
              <h1 className="text-[38px] font-serif-title font-extrabold tracking-tight text-on-surface leading-tight">
                Sonzra Audio
              </h1>
            </div>
          </div>

          <p className="text-body-md text-on-surface-variant text-[16px] leading-relaxed">
            Welcome to your distraction-free audiophile music room. Sign in with your Sonzra account to access high-res FLAC libraries, bit-perfect streams, and personal listening history.
          </p>

          <div className="flex flex-col gap-3 p-5 rounded-2xl bg-surface-container-low/70 border border-white/[0.04] backdrop-blur-md">
            <div className="flex items-center gap-2 text-secondary text-[13px] font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(73,220,202,0.8)]"></span>
              <span>HOST: {serverUrl}</span>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant text-[13px]">
              <span className="material-symbols-outlined text-[18px] text-primary">verified_user</span>
              <span>User-scoped sessions and persistent Tizen token caching.</span>
            </div>
          </div>

          {/* Quick Demo Connect CTA */}
          <div className="pt-2">
            <Focusable
              focusId="signin-btn-demo"
              group="signin-side-actions"
              rightId="signin-field-email"
              upId="signin-field-email"
              downId="signin-btn-submit"
              className="w-full rounded-2xl cursor-pointer transition-all"
              onEnter={enterDemoMode}
              onClick={enterDemoMode}
            >
              {({ isFocused }) => (
                <div
                  className={`w-full py-4 px-6 rounded-2xl flex items-center justify-between transition-all duration-200 ${
                    isFocused
                      ? 'bg-surface-container-highest text-secondary ring-2 ring-secondary shadow-[0_0_24px_rgba(73,220,202,0.5)] scale-102'
                      : 'bg-surface-container-low/90 text-on-surface border border-white/[0.04] hover:bg-surface-container-high'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[24px] text-secondary">
                      play_circle
                    </span>
                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-[15px]">Quick Connect (Demo Account)</span>
                      <span className="text-[12px] text-on-surface-variant font-mono">
                        Instant sign-in with server demo credentials
                      </span>
                    </div>
                  </div>
                  <span className="text-[12px] font-mono text-outline">[ENTER]</span>
                </div>
              )}
            </Focusable>
          </div>
        </div>

        {/* Right Column: Input Fields & Virtual Keyboard */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-4">
          {/* Error Banner */}
          {errorMessage && (
            <div
              className="flex items-center gap-3 p-4 rounded-xl bg-error/20 border border-error/50 text-error text-[14px] font-semibold animate-in fade-in"
              role="alert"
            >
              <span className="material-symbols-outlined text-[20px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Input Fields Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Email Field Selector */}
            <Focusable
              focusId="signin-field-email"
              group="signin-inputs"
              autoFocus={true}
              leftId="signin-btn-demo"
              rightId="signin-field-password"
              downId="signin-btn-toggle-server"
              className="rounded-xl cursor-pointer"
              onEnter={() => setActiveField('email')}
              onClick={() => setActiveField('email')}
            >
              {({ isFocused }) => {
                const isActive = activeField === 'email';
                return (
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      isFocused
                        ? 'bg-surface-container-high ring-2 ring-secondary shadow-[0_0_20px_rgba(73,220,202,0.6)] scale-102 border-secondary'
                        : isActive
                        ? 'bg-surface-container-high/90 border-secondary/60 ring-1 ring-secondary/30'
                        : 'bg-surface-container-low/80 border-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant font-bold">
                        Email Address
                      </span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_6px_#43d7c6]"></span>
                      )}
                    </div>
                    <div className="text-[15px] font-mono text-on-surface truncate font-semibold">
                      {email || <span className="text-outline">name@domain.com</span>}
                    </div>
                  </div>
                );
              }}
            </Focusable>

            {/* Password Field Selector */}
            <Focusable
              focusId="signin-field-password"
              group="signin-inputs"
              leftId="signin-field-email"
              downId="signin-btn-toggle-pw"
              className="rounded-xl cursor-pointer"
              onEnter={() => setActiveField('password')}
              onClick={() => setActiveField('password')}
            >
              {({ isFocused }) => {
                const isActive = activeField === 'password';
                return (
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      isFocused
                        ? 'bg-surface-container-high ring-2 ring-secondary shadow-[0_0_20px_rgba(73,220,202,0.6)] scale-102 border-secondary'
                        : isActive
                        ? 'bg-surface-container-high/90 border-secondary/60 ring-1 ring-secondary/30'
                        : 'bg-surface-container-low/80 border-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant font-bold">
                        Password
                      </span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_6px_#43d7c6]"></span>
                      )}
                    </div>
                    <div className="text-[15px] font-mono text-on-surface truncate font-semibold">
                      {password ? (
                        showPassword ? (
                          password
                        ) : (
                          '•'.repeat(password.length)
                        )
                      ) : (
                        <span className="text-outline">••••••••</span>
                      )}
                    </div>
                  </div>
                );
              }}
            </Focusable>
          </div>

          {/* Advanced Server URL Toggle */}
          <div className="flex items-center justify-between px-1">
            <Focusable
              focusId="signin-btn-toggle-server"
              group="signin-inputs"
              upId="signin-field-email"
              rightId="signin-btn-toggle-pw"
              leftId="signin-btn-demo"
              downId="kb-num-0"
              className="rounded-lg cursor-pointer"
              onEnter={() => setShowAdvancedServer((prev) => !prev)}
              onClick={() => setShowAdvancedServer((prev) => !prev)}
            >
              {({ isFocused }) => (
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[12px] font-mono transition-all ${
                    isFocused
                      ? 'bg-secondary text-surface-container-lowest ring-2 ring-secondary'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {showAdvancedServer ? 'unfold_less' : 'dns'}
                  </span>
                  <span>{showAdvancedServer ? 'Hide Server URL' : 'Change Sonzra Server URL'}</span>
                </div>
              )}
            </Focusable>

            {/* Password Visibility Toggle */}
            <Focusable
              focusId="signin-btn-toggle-pw"
              group="signin-inputs"
              upId="signin-field-password"
              leftId="signin-btn-toggle-server"
              downId="kb-num-6"
              className="rounded-lg cursor-pointer"
              onEnter={() => setShowPassword((prev) => !prev)}
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {({ isFocused }) => (
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[12px] font-mono transition-all ${
                    isFocused
                      ? 'bg-secondary text-surface-container-lowest ring-2 ring-secondary'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                  <span>{showPassword ? 'Hide Password' : 'Show Password'}</span>
                </div>
              )}
            </Focusable>
          </div>

          {/* Optional Server URL Input */}
          {showAdvancedServer && (
            <Focusable
              focusId="signin-field-server"
              group="signin-inputs"
              className="rounded-xl cursor-pointer"
              onEnter={() => setActiveField('server')}
              onClick={() => setActiveField('server')}
            >
              {({ isFocused }) => {
                const isActive = activeField === 'server';
                return (
                  <div
                    className={`p-3 rounded-xl border transition-all ${
                      isFocused
                        ? 'bg-surface-container-high ring-2 ring-secondary shadow-[0_0_20px_rgba(73,220,202,0.6)] scale-102 border-secondary'
                        : isActive
                        ? 'bg-surface-container-high/90 border-secondary/60'
                        : 'bg-surface-container-low/80 border-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant font-bold">
                        Server URL / Host
                      </span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_6px_#43d7c6]"></span>
                      )}
                    </div>
                    <div className="text-[14px] font-mono text-on-surface truncate font-semibold">
                      {serverUrl || 'http://localhost:3000'}
                    </div>
                  </div>
                );
              }}
            </Focusable>
          )}

          {/* On-Screen TV Virtual Keyboard */}
          <TvVirtualKeyboard
            onKeyPress={handleKeyPress}
            onBackspace={handleBackspace}
            onClear={handleClear}
            onSubmit={handleFormSubmit}
            activeFieldLabel={
              activeField === 'email'
                ? 'Email Address'
                : activeField === 'password'
                ? 'Password'
                : 'Server URL'
            }
          />

          {/* Action Row: Sign In Submit Button */}
          <div className="flex items-center gap-4 mt-2">
            <Focusable
              focusId="signin-btn-submit"
              group="signin-actions"
              leftId="signin-btn-demo"
              className="flex-1 rounded-2xl cursor-pointer"
              onEnter={handleFormSubmit}
              onClick={handleFormSubmit}
              disabled={authLoading}
            >
              {({ isFocused }) => (
                <button
                  type="button"
                  disabled={authLoading}
                  className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-semibold text-[17px] transition-all cursor-pointer ${
                    isFocused
                      ? 'bg-primary-container text-on-primary-container ring-2 ring-secondary shadow-[0_0_32px_rgba(122,90,248,0.9)] scale-103'
                      : 'bg-primary-container/90 text-on-primary-container shadow-lg hover:bg-primary-container'
                  }`}
                >
                  {authLoading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[22px]">
                        progress_activity
                      </span>
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[24px]">login</span>
                      <span>Sign In to Sonzra</span>
                      <span className="text-[12px] font-mono opacity-80">[ENTER]</span>
                    </>
                  )}
                </button>
              )}
            </Focusable>
          </div>
        </div>
      </div>
    </div>
  );
};
