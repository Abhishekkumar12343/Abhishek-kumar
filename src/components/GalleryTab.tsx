import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Library, 
  Image as ImageIcon, 
  Video, 
  LayoutDashboard, 
  Trash2, 
  ExternalLink,
  Search,
  Filter,
  Download,
  Calendar,
  Loader2,
  Play,
  ArrowLeft
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Simulation, GeneratedAsset } from '../types';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import SimulationSandbox from './SimulationSandbox';

type AssetType = 'all' | 'simulation' | 'image' | 'video';

interface GalleryTabProps {
  onLoadSimulation?: (sim: Simulation) => void;
}

export default function GalleryTab({ onLoadSimulation }: GalleryTabProps) {
  const [activeType, setActiveType] = useState<AssetType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    setLoading(true);
    const userId = auth.currentUser.uid;

    // Listen for simulations
    const simQuery = query(
      collection(db, 'simulations'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    // Listen for images/videos
    const assetQuery = query(
      collection(db, 'assets'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubSims = onSnapshot(simQuery, (snapshot) => {
      const sims = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Simulation[];
      setSimulations(sims);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'simulations');
      setLoading(false);
    });

    const unsubAssets = onSnapshot(assetQuery, (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as GeneratedAsset[];
      setAssets(items);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'assets');
    });

    return () => {
      unsubSims();
      unsubAssets();
    };
  }, []);

  const handleDelete = async (id: string, type: 'sim' | 'asset') => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const collectionName = type === 'sim' ? 'simulations' : 'assets';
      await deleteDoc(doc(db, collectionName, id));
      toast.success('Item deleted successfully');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `Collection: ${type}`);
    }
  };

  const filteredItems = [
    ...simulations.map(s => ({ ...s, galleryType: 'simulation' as const })),
    ...assets.map(a => ({ ...a, galleryType: a.type as 'image' | 'video' }))
  ].filter(item => {
    const matchesType = activeType === 'all' || item.galleryType === activeType;
    const searchString = ('concept' in item ? item.concept : (item as GeneratedAsset).prompt).toLowerCase();
    const matchesSearch = searchString.includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  }).sort((a, b) => {
    const dateA = a.createdAt ? (a.createdAt as any).seconds || 0 : 0;
    const dateB = b.createdAt ? (b.createdAt as any).seconds || 0 : 0;
    return dateB - dateA;
  });

  return (
    <div className="h-full flex flex-col gap-8">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between glass p-4 md:p-6 rounded-3xl shrink-0">
        <div className="relative flex-1 w-full md:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-indigo-400 transition-colors" />
          <input
            type="text"
            placeholder="Search library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/5 focus:border-indigo-500/30 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-white/10"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto custom-scrollbar pb-2 md:pb-0">
          {(['all', 'simulation', 'image', 'video'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                activeType === type
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                  : "bg-white/5 text-white/40 hover:text-white/60 hover:bg-white/10 border border-white/5"
              )}
            >
              {type}s
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-12">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 opacity-50">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">Accessing Data Stores...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-20 border-2 border-dashed border-white/5 rounded-[3rem]">
            <Library className="w-16 h-16 mb-4" />
            <h3 className="text-xl font-display font-medium text-white mb-2">No assets found</h3>
            <p className="text-sm max-w-xs">Start generating simulations to build your personal library.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8 pb-12">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onMouseEnter={() => setHoveredId(item.id!)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="group relative glass-dark border border-white/5 rounded-[2rem] overflow-hidden hover:border-indigo-500/30 transition-all flex flex-col shadow-xl"
                >
                  {/* Preview Area */}
                  <div className="aspect-video relative bg-black/40 overflow-hidden group-hover:bg-black/60 transition-colors">
                    {item.galleryType === 'image' && (
                      <img 
                        src={(item as GeneratedAsset).url} 
                        alt="Generated" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
                      />
                    )}
                    {item.galleryType === 'video' && (
                      <video 
                        src={(item as GeneratedAsset).url} 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                        loop muted
                        onMouseOver={e => e.currentTarget.play()}
                        onMouseOut={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                      />
                    )}
                    {item.galleryType === 'simulation' && (
                      <div className="w-full h-full relative">
                        {hoveredId === item.id ? (
                          <div className="w-full h-full">
                            <SimulationSandbox 
                              plain
                              code={(item as Simulation).code} 
                              controlValues={
                                (item as Simulation).controls.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.default }), {})
                              } 
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-indigo-500/[0.02]">
                            <div className="relative">
                              <LayoutDashboard className="w-10 h-10 text-indigo-400 opacity-20" />
                              <motion.div 
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 flex items-center justify-center"
                              >
                                <Play size={16} className="text-indigo-400 ml-1 translate-x-px" />
                              </motion.div>
                            </div>
                            <span className="text-[9px] font-bold text-indigo-400/40 uppercase tracking-[0.2em]">Live Preview Available</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Overlay Actions */}
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2 translate-y-2 group-hover:translate-y-0 transition-transform">
                      {item.galleryType !== 'simulation' ? (
                        <a 
                          href={(item as GeneratedAsset).url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all backdrop-blur-md border border-white/5 active:scale-90"
                          title="Open full size"
                        >
                          <ExternalLink size={16} />
                        </a>
                      ) : (
                        <button 
                          onClick={() => {
                            if (onLoadSimulation) {
                              onLoadSimulation(item as Simulation);
                            }
                          }}
                          className="p-2.5 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-white shadow-xl shadow-indigo-500/20 active:scale-90 transition-all font-bold"
                          title="Load in Simulator"
                        >
                          <Play size={16} className="fill-current" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(item.id!, item.galleryType === 'simulation' ? 'sim' : 'asset')}
                        className="p-2.5 bg-red-500/10 hover:bg-red-500 rounded-xl text-red-500 hover:text-white transition-all backdrop-blur-md border border-red-500/20 active:scale-90"
                        title="Delete from collection"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Info Area */}
                  <div className="p-5 md:p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-[9px] font-bold uppercase tracking-widest text-white/40">
                        {item.galleryType}
                      </div>
                      <div className="h-0.5 w-0.5 rounded-full bg-white/20" />
                      <div className="text-[9px] font-mono text-white/20 uppercase">
                        {item.createdAt ? new Date((item.createdAt as any).seconds * 1000).toLocaleDateString() : 'RECENT'}
                      </div>
                    </div>
                    
                    <h3 className="text-[13px] font-medium text-white/90 line-clamp-2 leading-relaxed mb-4 flex-1">
                      {'concept' in item ? item.concept : (item as GeneratedAsset).prompt}
                    </h3>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-1.5 opacity-30">
                        <Calendar size={12} />
                        <span className="text-[10px] font-mono tracking-tighter uppercase tabular-nums">REF_{item.id?.slice(-4).toUpperCase()}</span>
                      </div>
                      <button 
                        className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5 p-2 hover:bg-indigo-500/5 rounded-lg"
                        onClick={() => item.galleryType === 'simulation' ? (onLoadSimulation && onLoadSimulation(item as Simulation)) : null}
                      >
                        Inspect
                        <ArrowLeft size={12} className="rotate-180" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
