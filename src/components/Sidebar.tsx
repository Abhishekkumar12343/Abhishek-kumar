import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  LayoutDashboard,
  Settings,
  Library
} from 'lucide-react';
import { TabType } from '../types';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'simulator', label: 'Simulator', icon: LayoutDashboard, desc: 'Neural Engine' },
    { id: 'gallery', label: 'Gallery', icon: Library, desc: 'Synaptic Library' },
  ];

  return (
    <aside className="w-20 md:w-64 glass-dark shrink-0 flex flex-col h-full z-20">
      <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group cursor-pointer hover:border-indigo-500/50 transition-colors">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <h1 className="text-sm font-display font-bold tracking-[0.2em] text-white hidden md:block">LAB-01</h1>
        </div>
      </div>

      <nav className="flex-1 p-3 md:p-6 space-y-4 overflow-y-auto custom-scrollbar">
        <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-2 mb-6 hidden md:block">
          Navigation
        </div>
        
        <div className="space-y-1.5">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={cn(
                "w-full flex items-center gap-3 px-2 md:px-4 py-3 rounded-xl text-sm font-medium transition-all group relative overflow-hidden",
                activeTab === item.id 
                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/10" 
                  : "text-white/30 hover:text-white/60 hover:bg-white/5 border border-transparent"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 shrink-0 transition-colors",
                activeTab === item.id ? "text-indigo-400" : "text-white/20 group-hover:text-white/40"
              )} />
              <div className="hidden md:flex flex-col items-start leading-none text-left">
                <span className="text-xs font-bold tracking-tight">{item.label}</span>
                <span className="text-[9px] font-mono text-white/20 uppercase mt-1 tracking-widest">{item.desc}</span>
              </div>
              
              {activeTab === item.id && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-r-full"
                />
              )}
            </button>
          ))}
        </div>
      </nav>

      <div className="p-3 md:p-6 border-t border-white/5">
        <button className="w-full flex items-center justify-center md:justify-start gap-3 px-2 md:px-4 py-3 rounded-xl text-sm font-medium text-white/20 hover:text-white/60 hover:bg-white/5 transition-all group">
          <Settings className="w-5 h-5 shrink-0 text-white/10 group-hover:text-white/40" />
          <span className="hidden md:block text-xs font-bold uppercase tracking-widest">Settings</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
