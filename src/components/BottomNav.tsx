import React from 'react';
import { motion } from 'motion/react';
import { Home, Camera, ShoppingCart, Calendar, User, Search, TrendingUp } from 'lucide-react';
import { useScrollDirection } from '../hooks/useScrollDirection';

interface BottomNavProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  onOpenSearch: () => void;
}

export default function BottomNav({ onNavigate, currentPage, onOpenSearch }: BottomNavProps) {
  const scrollDirection = useScrollDirection();
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'scan', label: 'Scan AI', icon: Camera },
    { id: 'growth-log', label: 'Growth', icon: TrendingUp },
    { id: 'marketplace', label: 'Shop', icon: ShoppingCart },
    { id: 'calendar', label: 'Care', icon: Calendar },
    { id: 'profile', label: 'Me', icon: User },
  ];

  return (
    <motion.nav 
      initial={{ y: 0 }}
      animate={{ 
        y: scrollDirection === 'down' ? 120 : 0,
      }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
    >
      <div className="bg-white/90 backdrop-blur-2xl border-t border-gray-100 px-4 py-3 pb-8 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="relative flex flex-col items-center gap-1 group flex-1"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-3 w-8 h-1 bg-[#4CAF50] rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <div className={`p-2 rounded-2xl transition-all ${
                isActive ? 'bg-[#F0FFF0] text-[#4CAF50]' : 'text-gray-400 group-hover:text-[#1B5E20]'
              }`}>
                <item.icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-tighter transition-colors ${
                isActive ? 'text-[#4CAF50]' : 'text-gray-400'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}
