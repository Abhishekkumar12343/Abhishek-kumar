import React, { useState, useEffect, useRef } from 'react';
import { Play, Sparkles, Sliders, Loader2, Info, RefreshCw, Save, Check, Library, Trash2, Upload, X, Download, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SimulationSandbox from './SimulationSandbox';
import { Control, Simulation } from '../types';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { FEATURED_SIMULATIONS } from '../constants/examples';

import { generateSimulation } from '../services/gemini';

interface SimulatorTabProps {
  initialSimulation?: Simulation | null;
  onClearInitial?: () => void;
}

const SimulatorTab: React.FC<SimulatorTabProps> = ({ initialSimulation, onClearInitial }) => {
  const [concept, setConcept] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [controlValues, setControlValues] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [savedSimulations, setSavedSimulations] = useState<Simulation[]>([]);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadingPhrases = [
    "Initializing Intelligence Core...",
    image ? "Analyzing Visual Patterns..." : "Synthesizing Physics Model...",
    "Generating Canvas Logic...",
    "Compiling P5.js Runtime...",
    "Optimizing Interaction Matrix...",
    "Finishing Synthesis..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % loadingPhrases.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading, image]);

  useEffect(() => {
    if (initialSimulation) {
      loadSimulation(initialSimulation);
      if (onClearInitial) {
        onClearInitial();
      }
    }
  }, [initialSimulation]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'simulations'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sims = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Simulation[];
      setSavedSimulations(sims);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'simulations');
    });

    return () => unsubscribe();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim() && !image) return;

    setLoading(true);
    setError(null);
    try {
      const data = await generateSimulation(concept, image || undefined);
      setSimulation(data);
      
      const initialValues: Record<string, number> = {};
      data.controls.forEach((c: Control) => {
        initialValues[c.name] = c.value;
      });
      setControlValues(initialValues);
    } catch (error: any) {
      console.error(error);
      setError(error.message || 'Error generating simulation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!simulation || !auth.currentUser) return;

    setSaveLoading(true);
    const path = 'simulations';
    try {
      await addDoc(collection(db, path), {
        userId: auth.currentUser.uid,
        concept: simulation.concept,
        explanation: simulation.explanation || null,
        code: simulation.code,
        controls: simulation.controls,
        createdAt: serverTimestamp()
      });
      toast.success('Simulation saved to your collection!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this simulation?')) return;

    try {
      await deleteDoc(doc(db, 'simulations', id));
      toast.success('Simulation removed');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'simulations/' + id);
    }
  };

  const loadSimulation = (sim: Simulation) => {
    setSimulation(sim);
    setConcept(sim.concept);
    const initialValues: Record<string, number> = {};
    sim.controls.forEach((c: Control) => {
      initialValues[c.name] = c.value;
    });
    setControlValues(initialValues);
    toast.success(`Loaded: ${sim.concept}`);
  };

  const handleExport = () => {
    if (!simulation) return;
    const blob = new Blob([simulation.code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${simulation.concept.toLowerCase().replace(/[^a-z0-9]/g, '-')}.js`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Simulation code exported!');
  };

  const handleControlChange = (name: string, value: number) => {
    setControlValues(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[400px_1fr] gap-6 md:gap-8 h-full min-h-0">
      {/* Sidebar Controls */}
      <div className="flex flex-col gap-6 overflow-y-auto lg:pr-2 custom-scrollbar order-2 lg:order-1">
        <section className="bg-white/5 rounded-2xl p-5 md:p-6 border border-white/10 shrink-0">
          <h2 className="text-xs md:text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Define Concept or Analyze Image
          </h2>
          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Image Upload Area */}
            {!image ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed border-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/5 rounded-2xl p-5 md:p-6 transition-all cursor-pointer text-center"
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden" 
                  accept="image/*"
                />
                <div className="w-8 h-8 md:w-10 md:h-10 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-500/20 group-hover:scale-110 transition-all">
                  <Upload className="w-4 h-4 md:w-5 md:h-5 text-white/40 group-hover:text-indigo-400" />
                </div>
                <p className="text-[11px] md:text-xs font-medium text-white/40 group-hover:text-white/60">Upload photo of a machine or item</p>
                <p className="text-[9px] md:text-[10px] text-white/20 mt-1 uppercase tracking-tighter font-bold">to analyze and simulate</p>
              </div>
            ) : (
              <div className="relative group rounded-2xl overflow-hidden aspect-video bg-black border border-white/10">
                <img src={image} alt="Upload" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    type="button"
                    onClick={() => setImage(null)}
                    className="p-2 bg-red-500 rounded-full text-white shadow-xl hover:scale-110 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            )}

            <textarea
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder={image ? "Describe what to simulate from this image (optional)..." : "e.g., Brownian motion of particles in a gas, or a double pendulum system..."}
              className="w-full bg-black border border-white/10 rounded-xl p-3 md:p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all min-h-[100px] md:min-h-[120px] resize-none placeholder:text-white/20"
            />
            <button
              type="submit"
              disabled={loading || (!concept.trim() && !image)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-semibold py-2.5 md:py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/10 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                  Analyzing & Generating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 md:w-5 md:h-5" />
                  {image ? 'Analyze & Simulate' : 'Generate Simulation'}
                </>
              )}
            </button>
          </form>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[11px] flex items-start gap-2"
            >
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {error}
            </motion.div>
          )}
        </section>

        <AnimatePresence mode="wait">
          {simulation && (
            <div className="space-y-4 md:space-y-6">
              {simulation.explanation && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-indigo-500/10 rounded-2xl p-5 md:p-6 border border-indigo-500/20 shrink-0"
                >
                  <h2 className="text-xs md:text-sm font-medium text-indigo-300 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Scientific Explanation
                  </h2>
                  <p className="text-[11px] md:text-xs text-white/70 leading-relaxed italic">
                    {simulation.explanation}
                  </p>
                </motion.section>
              )}

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/5 rounded-2xl p-5 md:p-6 border border-white/10 shrink-0"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xs md:text-sm font-medium text-white/60 flex items-center gap-2">
                    <Sliders className="w-4 h-4" />
                    Parameters
                  </h2>
                  <button 
                    onClick={() => {
                      const reset: Record<string, number> = {};
                      simulation.controls.forEach(c => reset[c.name] = c.default);
                      setControlValues(reset);
                    }}
                    className="text-[10px] md:text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset
                  </button>
                </div>

                <div className="space-y-6 md:space-y-8">
                  {simulation.controls.length > 0 ? (
                    simulation.controls.map((control) => (
                      <div key={control.name} className="space-y-3">
                        <div className="flex justify-between text-[11px] md:text-xs">
                          <span className="text-white/80 font-mono">{control.name}</span>
                          <span className="text-indigo-400 font-mono">{controlValues[control.name]?.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min={control.min}
                          max={control.max}
                          step={(control.max - control.min) / 100}
                          value={controlValues[control.name] ?? control.default}
                          onChange={(e) => handleControlChange(control.name, parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
                        />
                        <div className="flex justify-between text-[9px] md:text-[10px] text-white/20 font-mono">
                          <span>{control.min}</span>
                          <span>{control.max}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 md:py-8 text-white/20 italic text-sm">
                      No adjustable parameters found for this simulation.
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button
                      onClick={handleSave}
                      disabled={saveLoading || !auth.currentUser}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 text-white font-medium py-2 md:py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-[11px] md:text-xs"
                    >
                      {saveLoading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      {saveLoading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleExport}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-2 md:py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-[11px] md:text-xs"
                    >
                      <Download size={12} />
                      Export .js
                    </button>
                  </div>
                </div>
              </motion.section>
            </div>
          )}
        </AnimatePresence>

        {/* Saved Simulations Library */}
        <section className="bg-white/5 rounded-2xl p-5 md:p-6 border border-white/10 flex-col min-h-[300px] hidden lg:flex">
          <h2 className="text-xs md:text-sm font-medium text-white/60 mb-4 flex items-center gap-2 shrink-0">
            <Library className="w-4 h-4" />
            My Collection
          </h2>
          
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
            <div className="space-y-3 pb-6">
              <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-2 mb-2 flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Featured
              </div>
              {FEATURED_SIMULATIONS.map((sim) => (
                <button
                  key={sim.id}
                  onClick={() => loadSimulation(sim)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all group flex items-start gap-3",
                    simulation?.id === sim.id 
                      ? "bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/30" 
                      : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                  )}
                >
                  <div className="mt-1 w-6 h-6 rounded bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <Play className="w-3 h-3 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80 truncate mb-1">{sim.concept}</p>
                    <p className="text-[10px] text-white/30 truncate">Standard P5.js Pattern</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-2 mb-2 flex items-center gap-2">
                <Library className="w-3 h-3" />
                My Saved
              </div>
              {savedSimulations.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center p-4 opacity-20 border border-dashed border-white/10 rounded-xl">
                  <Library size={24} className="mb-2" />
                  <p className="text-[11px]">Your saved simulations will appear here</p>
                </div>
              ) : (
                savedSimulations.map((sim) => (
                  <div
                    key={sim.id}
                    onClick={() => loadSimulation(sim)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        loadSimulation(sim);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border transition-all group flex items-start gap-3 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                      simulation?.id === sim.id 
                        ? "bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/30" 
                        : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                    )}
                  >
                    <div className="mt-1 w-6 h-6 rounded bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <Play className="w-3 h-3 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/80 truncate mb-1">{sim.concept}</p>
                      <p className="text-[10px] text-white/30">
                        {sim.controls.length} controls • {sim.createdAt && new Date((sim.createdAt as any).seconds * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, sim.id!)}
                      className="p-2 text-white/10 hover:text-red-400 transition-colors shrink-0"
                      aria-label="Delete simulation"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      <div className={cn(
        "relative h-[300px] sm:h-[400px] md:h-[500px] lg:h-full min-h-0 order-1 lg:order-2",
        isFullscreen && "fixed inset-0 z-[100] bg-black p-4 h-screen sm:h-screen md:h-screen lg:h-screen"
      )}>
        {!loading && simulation && (
          <div className="absolute top-4 right-4 z-[101] flex gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 md:p-3 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-xl text-white/70 hover:text-white border border-white/10 transition-all shadow-xl"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center p-8 md:p-12 overflow-hidden"
            >
              {/* Pulse Core Animation */}
              <div className="relative mb-8 md:mb-12 scale-75 md:scale-100">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-20 h-20 md:w-24 md:h-24 bg-indigo-500/20 rounded-full blur-2xl"
                />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border border-indigo-500/30 rounded-full border-dashed"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-indigo-400 animate-pulse" />
                </div>
              </div>

              <div className="space-y-4 max-w-xs">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-xs md:text-sm font-medium text-white/90"
                  >
                    {loadingPhrases[loadingStep]}
                  </motion.p>
                </AnimatePresence>
                
                <div className="w-32 md:w-48 h-1 bg-white/5 rounded-full mx-auto overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ 
                      duration: loadingPhrases.length * 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                  />
                </div>
                <p className="text-[8px] md:text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">
                  Neural Synthesis in Progress
                </p>
              </div>
            </motion.div>
          ) : simulation ? (
            <motion.div
              key="simulation"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full h-full rounded-2xl overflow-hidden"
            >
              <SimulationSandbox code={simulation.code} controlValues={controlValues} />
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full bg-white/5 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-8 md:p-12"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 md:mb-6">
                <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-white/20" />
              </div>
              <h3 className="text-base md:text-lg font-medium text-white/60 mb-2">Ready to Simulate</h3>
              <p className="text-[11px] md:text-sm text-white/30 max-w-xs">
                Enter a scientific concept on the left to generate an interactive P5.js simulation.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Library (Visible only on small screens) */}
      <section className="lg:hidden bg-white/5 rounded-2xl p-5 border border-white/10 flex flex-col order-3 mt-4">
        <h2 className="text-xs font-medium text-white/60 mb-4 flex items-center gap-2">
          <Library className="w-4 h-4" />
          My Collection
        </h2>
        <div className="max-h-64 overflow-y-auto space-y-3 custom-scrollbar pr-2">
          {/* Reuse logic for mobile simulation list */}
          <div className="space-y-3 pb-4">
            <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">Featured</div>
            {FEATURED_SIMULATIONS.slice(0, 3).map((sim) => (
              <button
                key={sim.id}
                onClick={() => {
                  loadSimulation(sim);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3"
              >
                <Play className="w-3 h-3 text-indigo-400" />
                <p className="text-xs font-medium text-white/80 truncate">{sim.concept}</p>
              </button>
            ))}
          </div>
          {savedSimulations.length > 0 && (
            <div className="space-y-3">
              <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">Saved</div>
              {savedSimulations.slice(0, 5).map((sim) => (
                <button
                  key={sim.id}
                  onClick={() => {
                    loadSimulation(sim);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3"
                >
                  <Play className="w-3 h-3 text-indigo-400" />
                  <p className="text-xs font-medium text-white/80 truncate">{sim.concept}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SimulatorTab;
