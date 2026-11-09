import React, { useState } from 'react';
import { useServer } from '../context/ServerContext';
import { Focusable } from '../navigation/Focusable';
import { FocusableButton } from '../components/FocusableButton';
import { Server, Wifi, CheckCircle2, AlertCircle, RefreshCw, Tv, HelpCircle } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { config, updateConfig, testConnection, refreshLibrary } = useServer();

  const [serverUrl, setServerUrl] = useState(config.serverUrl);
  const [serverConnectionId, setServerConnectionId] = useState(config.serverConnectionId);
  const [authToken, setAuthToken] = useState(config.authToken || '');
  const [demoMode, setDemoMode] = useState(config.demoMode);

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

  const handleTest = async () => {
    setIsTesting(true);
    setTestStatus({ tested: false, success: false, message: 'Testing connection...' });
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
      demoMode,
    });
    refreshLibrary();
  };

  const isTizenDetected =
    typeof window !== 'undefined' &&
    (window.tizen !== undefined || window.webapis !== undefined);

  return (
    <div className="tv-view-content tv-settings-view" role="main" aria-label="Settings">
      <header className="tv-view-header">
        <div className="tv-header-info">
          <div className="tv-eyebrow">CONFIGURATION</div>
          <h1 className="tv-page-title">Settings & Connection</h1>
          <p className="tv-header-meta">
            Connect this Samsung Smart TV to your Sonzra music server.
          </p>
        </div>
      </header>

      <div className="tv-settings-grid">
        {/* Left Column: Server Connection Form */}
        <section className="tv-settings-card" aria-label="Server Settings">
          <div className="tv-settings-card-header">
            <Server className="tv-settings-header-icon" size={24} />
            <h2>Sonzra Server Connection</h2>
          </div>

          <div className="tv-form-group">
            <label className="tv-form-label" htmlFor="input-server-url">
              Sonzra Host / Server URL
            </label>
            <Focusable
              focusId="input-server-url"
              group="settings-form"
              className="tv-input-focusable"
              onEnter={() => {
                const val = prompt('Enter Sonzra Server URL:', serverUrl);
                if (val !== null) setServerUrl(val);
              }}
            >
              {({ isFocused }) => (
                <div className={`tv-input-box ${isFocused ? 'tv-input-focused' : ''}`}>
                  <input
                    id="input-server-url"
                    type="text"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    placeholder="http://192.168.1.100:3000"
                    className="tv-text-input"
                  />
                  {isFocused && <span className="tv-input-hint">Press Enter to edit</span>}
                </div>
              )}
            </Focusable>
          </div>

          <div className="tv-form-group">
            <label className="tv-form-label" htmlFor="input-connection-id">
              Active Server Connection ID
            </label>
            <Focusable
              focusId="input-connection-id"
              group="settings-form"
              className="tv-input-focusable"
              onEnter={() => {
                const val = prompt('Enter Server Connection ID (e.g. 1):', serverConnectionId);
                if (val !== null) setServerConnectionId(val);
              }}
            >
              {({ isFocused }) => (
                <div className={`tv-input-box ${isFocused ? 'tv-input-focused' : ''}`}>
                  <input
                    id="input-connection-id"
                    type="text"
                    value={serverConnectionId}
                    onChange={(e) => setServerConnectionId(e.target.value)}
                    placeholder="1"
                    className="tv-text-input"
                  />
                  {isFocused && <span className="tv-input-hint">Press Enter to edit</span>}
                </div>
              )}
            </Focusable>
          </div>

          <div className="tv-form-group">
            <label className="tv-form-label" htmlFor="input-auth-token">
              Authentication Token / Bearer Key (Optional)
            </label>
            <Focusable
              focusId="input-auth-token"
              group="settings-form"
              className="tv-input-focusable"
              onEnter={() => {
                const val = prompt('Enter Auth Token / API Key:', authToken);
                if (val !== null) setAuthToken(val);
              }}
            >
              {({ isFocused }) => (
                <div className={`tv-input-box ${isFocused ? 'tv-input-focused' : ''}`}>
                  <input
                    id="input-auth-token"
                    type="password"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="tv-text-input"
                  />
                  {isFocused && <span className="tv-input-hint">Press Enter to edit</span>}
                </div>
              )}
            </Focusable>
          </div>

          {/* Demo Mode Toggle */}
          <div className="tv-form-group tv-toggle-group">
            <Focusable
              focusId="toggle-demo-mode"
              group="settings-form"
              className="tv-toggle-focusable"
              onEnter={() => setDemoMode((prev) => !prev)}
              onClick={() => setDemoMode((prev) => !prev)}
            >
              {({ isFocused }) => (
                <div className={`tv-toggle-box ${isFocused ? 'tv-control-focused' : ''}`}>
                  <div className="tv-toggle-info">
                    <span className="tv-toggle-title">Standalone Demo Mode</span>
                    <span className="tv-toggle-desc">
                      Uses built-in sample albums and live audio streams for offline or test evaluation.
                    </span>
                  </div>
                  <div className={`tv-switch ${demoMode ? 'tv-switch-on' : 'tv-switch-off'}`}>
                    <div className="tv-switch-knob" />
                  </div>
                </div>
              )}
            </Focusable>
          </div>

          {/* Form Actions */}
          <div className="tv-settings-buttons">
            <FocusableButton
              focusId="btn-test-connection"
              group="settings-form"
              label={isTesting ? 'Testing...' : 'Test Connection'}
              icon={<Wifi size={20} />}
              variant="secondary"
              size="md"
              disabled={isTesting}
              onEnter={handleTest}
              onClick={handleTest}
            />

            <FocusableButton
              focusId="btn-save-settings"
              group="settings-form"
              label="Save & Connect"
              icon={<RefreshCw size={20} />}
              variant="primary"
              size="md"
              onEnter={handleSave}
              onClick={handleSave}
            />
          </div>

          {/* Test Status feedback */}
          {testStatus.tested && (
            <div
              className={`tv-test-result ${
                testStatus.success ? 'tv-test-success' : 'tv-test-failure'
              }`}
            >
              {testStatus.success ? (
                <CheckCircle2 size={24} className="tv-test-icon" />
              ) : (
                <AlertCircle size={24} className="tv-test-icon" />
              )}
              <div className="tv-test-meta">
                <span className="tv-test-title">
                  {testStatus.success ? 'Server Reachable' : 'Connection Failed'}
                </span>
                <span className="tv-test-message">{testStatus.message}</span>
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Tizen TV Environment & Remote Control Guide */}
        <div className="tv-settings-side-column">
          <section className="tv-settings-card" aria-label="System Diagnostics">
            <div className="tv-settings-card-header">
              <Tv className="tv-settings-header-icon" size={24} />
              <h2>Tizen Diagnostics</h2>
            </div>
            <div className="tv-diag-rows">
              <div className="tv-diag-row">
                <span className="tv-diag-label">Tizen Environment</span>
                <span className={`tv-diag-value ${isTizenDetected ? 'tv-status-online' : 'tv-status-sim'}`}>
                  {isTizenDetected ? 'Tizen TV Hardware' : 'Web / Simulator Mode'}
                </span>
              </div>
              <div className="tv-diag-row">
                <span className="tv-diag-label">Canvas Resolution</span>
                <span className="tv-diag-value">1920 × 1080 (1080p FHD)</span>
              </div>
              <div className="tv-diag-row">
                <span className="tv-diag-label">Target Architecture</span>
                <span className="tv-diag-value">Samsung Smart TV (Tizen 6.0+)</span>
              </div>
              <div className="tv-diag-row">
                <span className="tv-diag-label">Spatial Navigation</span>
                <span className="tv-diag-value tv-status-online">Active 2D Euclidean</span>
              </div>
            </div>
          </section>

          <section className="tv-settings-card" aria-label="Remote Control Help">
            <div className="tv-settings-card-header">
              <HelpCircle className="tv-settings-header-icon" size={24} />
              <h2>Remote Control Mapping</h2>
            </div>
            <div className="tv-diag-rows tv-remote-help">
              <div className="tv-diag-row">
                <span className="tv-key-badge">D-Pad (Arrows)</span>
                <span className="tv-diag-desc">Move 2D spatial focus</span>
              </div>
              <div className="tv-diag-row">
                <span className="tv-key-badge">Enter / OK</span>
                <span className="tv-diag-desc">Select, play, or open</span>
              </div>
              <div className="tv-diag-row">
                <span className="tv-key-badge">Return / Back</span>
                <span className="tv-diag-desc">Go back or return to Sidebar</span>
              </div>
              <div className="tv-diag-row">
                <span className="tv-key-badge">Play / Pause</span>
                <span className="tv-diag-desc">Toggle audio playback</span>
              </div>
              <div className="tv-diag-row">
                <span className="tv-key-badge">Next / Prev</span>
                <span className="tv-diag-desc">Skip forward or restart track</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
