import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Leaf, 
  History, 
  MessageSquare, 
  User, 
  Command, 
  X,
  ArrowRight,
  Zap,
  Settings,
  HelpCircle,
  Clock,
  Image as ImageIcon
} from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { ScanResult } from '../lib/gemini';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: any) => void;
  onViewResult: (result: ScanResult, imageUrl: string) => void;
}

const ACTIONS = [
  { id: 'scan', name: 'Scan a Plant', icon: Leaf, shortcut: 'S', description: 'Analyze any plant or leaf with AI' },
  { id: 'history', name: 'View History', icon: History, shortcut: 'H', description: 'Access your previous scan results' },
  { id: 'chat', name: 'Chat with AI', icon: MessageSquare, shortcut: 'C', description: 'Ask questions about plant care' },
  { id: 'profile', name: 'My Profile', icon: User, shortcut: 'P', description: 'Check your stats and achievements' },
  { id: 'settings', name: 'Settings', icon: Settings, shortcut: ',', description: 'App preferences and account' },
  { id: 'help', name: 'Help & Support', icon: HelpCircle, shortcut: '?', description: 'Get help using Leafy AI' },
];

export default function CommandPalette({ isOpen, onClose, onNavigate, onViewResult }: CommandPaletteProps) {
  const [queryStr, setQueryStr] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentScans, setRecentScans] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && auth.currentUser) {
      const fetchRecent = async () => {
        const path = `users/${auth.currentUser?.uid}/scans`;
        const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(5));
        const snapshot = await getDocs(q);
        setRecentScans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      };
      fetchRecent();
    }
  }, [isOpen]);

  const filteredActions = ACTIONS.filter(action => 
    action.name.toLowerCase().includes(queryStr.toLowerCase()) ||
    action.description.toLowerCase().includes(queryStr.toLowerCase())
  );

  const filteredScans = recentScans.filter(scan => 
    scan.name.toLowerCase().includes(queryStr.toLowerCase())
  );

  const allItems = [
    ...filteredActions.map(a => ({ ...a, type: 'action' })),
    ...filteredScans.map(s => ({ ...s, type: 'scan' }))
  ];

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % allItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allItems.length) % allItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = allItems[selectedIndex];
      if (item) {
        if (item.type === 'action') {
          onNavigate(item.id);
        } else {
          onViewResult(item as any, item.imageUrl);
        }
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [allItems, selectedIndex, onNavigate, onViewResult, onClose]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      setSelectedIndex(0);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-[#C8E6C9]"
          >
            {/* Search Input */}
            <div className="flex items-center px-6 py-5 border-b border-[#E8F5E9]">
              <Search className="w-6 h-6 text-[#4CAF50] mr-4" />
              <input
                autoFocus
                type="text"
                placeholder="Type a command or search history..."
                value={queryStr}
                onChange={(e) => setQueryStr(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-xl text-[#1B5E20] placeholder-[#81C784] font-medium"
              />
              <div className="flex items-center gap-2 px-3 py-1 bg-[#F1F8E9] rounded-xl border border-[#C8E6C9]">
                <Command className="w-4 h-4 text-[#4CAF50]" />
                <span className="text-xs font-bold text-[#4CAF50]">K</span>
              </div>
              <button 
                onClick={onClose}
                className="ml-4 p-2 hover:bg-[#F1F8E9] rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#81C784]" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {allItems.length > 0 ? (
                <div className="space-y-4">
                  {filteredActions.length > 0 && (
                    <div className="space-y-2">
                      <div className="px-4 py-2">
                        <span className="text-[10px] font-black text-[#81C784] uppercase tracking-widest">Actions</span>
                      </div>
                      {filteredActions.map((action, index) => {
                        const globalIndex = index;
                        return (
                          <button
                            key={action.id}
                            onClick={() => {
                              onNavigate(action.id);
                              onClose();
                            }}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`w-full flex items-center p-4 rounded-[1.5rem] transition-all group ${
                              globalIndex === selectedIndex ? 'bg-[#4CAF50] text-white shadow-lg' : 'hover:bg-[#F1F8E9] text-[#1B5E20]'
                            }`}
                          >
                            <div className={`p-3 rounded-2xl mr-4 transition-colors ${
                              globalIndex === selectedIndex ? 'bg-white/20' : 'bg-[#E8F5E9]'
                            }`}>
                              <action.icon className={`w-6 h-6 ${globalIndex === selectedIndex ? 'text-white' : 'text-[#4CAF50]'}`} />
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-bold text-lg">{action.name}</div>
                              <div className={`text-sm ${globalIndex === selectedIndex ? 'text-white/80' : 'text-[#81C784]'}`}>
                                {action.description}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {action.shortcut && (
                                <div className={`px-2 py-1 rounded-lg border font-mono text-xs font-bold ${
                                  globalIndex === selectedIndex ? 'border-white/40 bg-white/10' : 'border-[#C8E6C9] bg-white text-[#81C784]'
                                }`}>
                                  {action.shortcut}
                                </div>
                              )}
                              <ArrowRight className={`w-5 h-5 transition-transform ${
                                globalIndex === selectedIndex ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'
                              }`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {filteredScans.length > 0 && (
                    <div className="space-y-2">
                      <div className="px-4 py-2">
                        <span className="text-[10px] font-black text-[#81C784] uppercase tracking-widest">Recent Scans</span>
                      </div>
                      {filteredScans.map((scan, index) => {
                        const globalIndex = filteredActions.length + index;
                        return (
                          <button
                            key={scan.id}
                            onClick={() => {
                              onViewResult(scan as any, scan.imageUrl);
                              onClose();
                            }}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`w-full flex items-center p-4 rounded-[1.5rem] transition-all group ${
                              globalIndex === selectedIndex ? 'bg-[#4CAF50] text-white shadow-lg' : 'hover:bg-[#F1F8E9] text-[#1B5E20]'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-2xl mr-4 overflow-hidden border-2 ${
                              globalIndex === selectedIndex ? 'border-white/40' : 'border-[#C8E6C9]'
                            }`}>
                              <img src={scan.imageUrl} alt={scan.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-bold text-lg">{scan.name}</div>
                              <div className={`flex items-center gap-2 text-sm ${globalIndex === selectedIndex ? 'text-white/80' : 'text-[#81C784]'}`}>
                                <Clock className="w-3 h-3" />
                                {scan.createdAt?.toDate ? scan.createdAt.toDate().toLocaleDateString() : 'Recent'}
                              </div>
                            </div>
                            <ArrowRight className={`w-5 h-5 transition-transform ${
                              globalIndex === selectedIndex ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'
                            }`} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 bg-[#F1F8E9] rounded-full flex items-center justify-center mb-4">
                    <Zap className="w-10 h-10 text-[#81C784]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1B5E20]">No results found</h3>
                  <p className="text-[#81C784]">Try searching for something else</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-[#F9FBF9] border-t border-[#E8F5E9] flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-white border border-[#C8E6C9] rounded shadow-sm">
                    <ArrowRight className="w-3 h-3 rotate-90 text-[#81C784]" />
                  </div>
                  <span className="text-[10px] font-bold text-[#81C784] uppercase">Select</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-1.5 py-0.5 bg-white border border-[#C8E6C9] rounded shadow-sm text-[10px] font-bold text-[#81C784]">
                    ENTER
                  </div>
                  <span className="text-[10px] font-bold text-[#81C784] uppercase">Open</span>
                </div>
              </div>
              <div className="text-[10px] font-bold text-[#81C784] uppercase tracking-tighter">
                Leafy AI Smart Navigation
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
