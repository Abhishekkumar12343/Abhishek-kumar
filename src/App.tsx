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

        <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="border-b border-white/5 bg-black/50 backdrop-blur-xl h-16 shrink-0 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <div className="text-xs font-bold text-white/20 uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-400" />
              AI Studio Labs
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="text-sm font-medium text-white/60 capitalize">
              {activeTab.replace('-', ' ')}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-widest font-bold">
              <Info size={12} />
              Powered by Gemini 3.1
            </div>
            <Auth />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + (user ? 'auth' : 'noauth')}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderTab()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        /* Markdown Styles */
        .prose pre {
          background: rgba(0, 0, 0, 0.3) !important;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.75rem;
        }
        .prose code {
          color: #818cf8 !important;
          background: rgba(129, 140, 248, 0.1);
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
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
