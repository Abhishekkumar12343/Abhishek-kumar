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
  Loader2
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Simulation, GeneratedAsset } from '../types';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

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
    <div className="h-full flex flex-col space-y-6 overflow-hidden">
      {/* Search & Filter Header */}
      <header className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shrink-0">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search your collection..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/5 w-full md:w-auto overflow-x-auto no-scrollbar">
          {(['all', 'simulation', 'image', 'video'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-all whitespace-nowrap",
                activeType === type 
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                  : "text-white/40 hover:text-white/60 hover:bg-white/5"
              )}
            >
              {type}s
            </button>
          ))}
        </div>
      </header>

      {/* Main Grid Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-8">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-white/20 gap-4">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">Loading collection...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-white/20 gap-4 border border-dashed border-white/5 rounded-3xl">
            <Library size={48} strokeWidth={1} />
            <div className="text-center">
              <p className="text-sm font-medium text-white/40">No items found</p>
              <p className="text-xs">Start creating to build your collection</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 hover:bg-white/10 transition-all flex flex-col"
                >
                  {/* Preview Area */}
                  <div className="aspect-video relative bg-black/50 overflow-hidden">
                    {item.galleryType === 'image' && (
                      <img 
                        src={(item as GeneratedAsset).url} 
                        alt="Generated" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                      />
                    )}
                    {item.galleryType === 'video' && (
                      <video 
                        src={(item as GeneratedAsset).url} 
                        className="w-full h-full object-cover"
                        loop muted
                        onMouseOver={e => e.currentTarget.play()}
                        onMouseOut={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                      />
                    )}
                    {item.galleryType === 'simulation' && (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-indigo-500/5">
                        <LayoutDashboard className="w-10 h-10 text-indigo-400 opacity-50" />
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Simulation</span>
                      </div>
                    )}

                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      {item.galleryType !== 'simulation' ? (
                        <a 
                          href={(item as GeneratedAsset).url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md"
                          title="Open full size"
                        >
                          <ExternalLink size={20} />
                        </a>
                      ) : (
                        <button 
                          onClick={() => {
                            if (onLoadSimulation) {
                              onLoadSimulation(item as Simulation);
                            }
                          }}
                          className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md"
                          title="Load in Simulator"
                        >
                          <LayoutDashboard size={20} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(item.id!, item.galleryType === 'simulation' ? 'sim' : 'asset')}
                        className="p-3 bg-red-500/20 hover:bg-red-500 rounded-full text-red-400 hover:text-white transition-all backdrop-blur-md border border-red-500/30"
                        title="Delete from collection"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Info Area */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-sm font-medium text-white/90 line-clamp-2 leading-relaxed">
                        {'concept' in item ? item.concept : (item as GeneratedAsset).prompt}
                      </h3>
                      <div className={cn(
                        "p-1.5 rounded-lg shrink-0",
                        item.galleryType === 'simulation' ? "bg-indigo-500/10 text-indigo-400" :
                        item.galleryType === 'image' ? "bg-emerald-500/10 text-emerald-400" :
                        "bg-orange-500/10 text-orange-400"
                      )}>
                        {item.galleryType === 'simulation' ? <LayoutDashboard size={14} /> :
                         item.galleryType === 'image' ? <ImageIcon size={14} /> :
                         <Video size={14} />}
                      </div>
                    </div>

                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5">
                      <div className="flex items-center gap-1.5 text-[10px] text-white/30 font-medium">
                        <Calendar size={12} strokeWidth={2} />
                        {item.createdAt && new Date((item.createdAt as any).seconds * 1000).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                        {item.galleryType}
                      </div>
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
