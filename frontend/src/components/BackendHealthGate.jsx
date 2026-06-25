import React, { useState, useEffect, useRef } from 'react';
import { WifiOff, RefreshCw, Terminal } from 'lucide-react';
import { API_URL } from '../utils/api';

const BackendHealthGate = ({ children }) => {
  const [isHealthy, setIsHealthy] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  const [retryCountdown, setRetryCountdown] = useState(5);
  const checkingInProgress = useRef(false);

  const getHealthCheckUrl = () => {
    let url = API_URL;
    return url.endsWith('/') ? `${url}health` : `${url}/health`;
  };

  const checkHealth = async () => {
    if (checkingInProgress.current) return;
    checkingInProgress.current = true;
    setIsChecking(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 seconds timeout

    try {
      const url = getHealthCheckUrl();
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      
      clearTimeout(timeoutId);
      
      // If we got any response (even error status codes), the server is reachable and active
      if (response) {
        setIsHealthy(true);
      } else {
        setIsHealthy(false);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      setIsHealthy(false);
    } finally {
      setIsChecking(false);
      checkingInProgress.current = false;
    }
  };

  // Check health on mount
  useEffect(() => {
    checkHealth();
  }, []);

  // Countdown timer for automatic retry when offline
  useEffect(() => {
    if (isHealthy) return;

    const interval = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev <= 1) {
          checkHealth();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isHealthy]);

  const handleManualRetry = () => {
    setRetryCountdown(5);
    checkHealth();
  };

  if (isHealthy) {
    return children;
  }

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Decorative background grid and glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-[#111827]/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          
          {/* Unreachable Server Visual */}
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 bg-rose-500/10 rounded-full animate-ping opacity-75 duration-1000" />
            <div className="relative w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <WifiOff className="w-8 h-8" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-tight font-outfit">
              Backend Server Offline
            </h1>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              We couldn't connect to the API server at <code className="text-rose-400 bg-rose-950/30 border border-rose-900/30 px-1.5 py-0.5 rounded text-xs font-mono">{API_URL}</code>.
            </p>
          </div>

          {/* Setup / Instructions */}
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5 text-left space-y-3.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" /> Quick Resolution Steps
            </h2>
            <ul className="text-xs text-slate-300 space-y-2.5">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-[10px] mt-0.5">1</span>
                <span>Open the project folder on your machine.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-[10px] mt-0.5">2</span>
                <span>
                  Double-click <code className="text-indigo-300 bg-indigo-950/40 px-1 py-0.5 rounded border border-indigo-900/40 font-mono font-bold text-[10px]">start.bat</code> to launch both the backend and frontend automatically.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-[10px] mt-0.5">3</span>
                <span>
                  The app will automatically reconnect as soon as the backend is healthy.
                </span>
              </li>
            </ul>
          </div>

          {/* Action button & countdown status */}
          <div className="space-y-4 pt-2">
            <button
              onClick={handleManualRetry}
              disabled={isChecking}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl text-sm font-semibold shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? 'Checking Connection...' : 'Retry Connection Now'}
            </button>

            <div className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-pulse" />
              Auto-checking connection in <span className="font-semibold text-slate-400">{retryCountdown}s</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BackendHealthGate;
