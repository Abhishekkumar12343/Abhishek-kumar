import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';
import SimulatorTab from './components/SimulatorTab';
import GalleryTab from './components/GalleryTab';
import { TabType, Simulation } from './types';
import { Sparkles, Info, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Toaster } from 'sonner';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      let friendlyMessage = "";
      
      try {
        if (this.state.error.friendlyMessage) {
          friendlyMessage = this.state.error.friendlyMessage;
        }
        const parsed = JSON.parse(this.state.error.message);
        errorMessage = `Firestore Error: ${parsed.operationType} at ${parsed.path} failed. ${parsed.error}`;
      } catch (e) {
        errorMessage = this.state.error.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Application Error</h2>
            <p className="text-red-400 text-sm mb-2 font-medium">{friendlyMessage || "A critical error occurred."}</p>
            <p className="text-white/20 text-[10px] mb-6 font-mono break-all">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-500 hover:bg-red-400 text-white rounded-xl transition-all font-medium"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [user, loading] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState<TabType>('simulator');
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null);

  useEffect(() => {
    if (user) {
      const path = `users/${user.uid}`;
      // Sync user profile to Firestore
      setDoc(doc(db, path), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLogin: serverTimestamp()
      }, { merge: true }).catch(error => {
        handleFirestoreError(error, OperationType.WRITE, path);
      });
    }
  }, [user]);

  const renderTab = () => {
    if (!user && activeTab !== 'simulator') {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center p-12">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 border border-indigo-500/20">
            <ShieldCheck className="w-10 h-10 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">Authentication Required</h2>
          <p className="text-white/40 max-w-sm mb-8">
            Please sign in to access your saved simulations and gallery.
          </p>
          <Auth />
        </div>
      );
    }

    switch (activeTab) {
      case 'simulator': 
        return (
          <SimulatorTab 
            initialSimulation={selectedSimulation} 
            onClearInitial={() => setSelectedSimulation(null)} 
          />
        );
      case 'gallery': 
        return (
          <GalleryTab 
            onLoadSimulation={(sim) => {
              setSelectedSimulation(sim);
              setActiveTab('simulator');
            }} 
          />
        );
      default: return <SimulatorTab />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-indigo-400 font-medium animate-pulse">Initializing AI Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Toaster position="top-right" theme="dark" closeButton richColors />
      <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-indigo-500/30 flex overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          {/* Subtle Background Glows */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

          {/* Header */}
          <header className="glass h-16 shrink-0 flex items-center justify-between px-6 md:px-10 z-10">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-sm font-display font-bold tracking-tight text-white leading-none">NEURAL SIM</h1>
                  <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] mt-1 font-bold">Physics Engine v2.4</p>
                </div>
              </div>
              
              <div className="h-6 w-px bg-white/10 hidden sm:block" />
              
              <div className="hidden lg:flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">
                <Info size={12} className="text-indigo-400" />
                Powered by Gemini AI
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] text-white/40 uppercase tracking-widest font-bold hidden md:flex">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                System Ready
              </div>
              <Auth />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-hidden p-4 md:p-8 lg:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab + (user ? 'auth' : 'noauth')}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="h-full"
              >
                {renderTab()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        <style>{`
          /* Markdown Styles */
          .prose pre {
            background: rgba(0, 0, 0, 0.3) !important;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 1rem;
          }
          .prose code {
            color: #818cf8 !important;
            background: rgba(129, 140, 248, 0.1);
            padding: 0.2rem 0.4rem;
            border-radius: 0.375rem;
            font-size: 0.85em;
          }
          .prose code::before, .prose code::after {
            content: "" !important;
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
}
