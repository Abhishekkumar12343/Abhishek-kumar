import React from 'react';
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
    { id: 'simulator', label: 'Simulator', icon: LayoutDashboard },
    { id: 'gallery', label: 'Gallery', icon: Library },
  ];

  return (
    <aside className="w-64 border-r border-white/5 bg-black/50 backdrop-blur-xl flex flex-col h-full">
      <div className="p-6 flex items-center gap-3 border-b border-white/5">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-white">Simulacrum</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-4 mb-4">
          Capabilities
        </div>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as TabType)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
              activeTab === item.id 
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                : "text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-colors",
              activeTab === item.id ? "text-indigo-400" : "text-white/20 group-hover:text-white/40"
            )} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition-all group">
          <Settings className="w-5 h-5 text-white/20 group-hover:text-white/40" />
          Settings
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
