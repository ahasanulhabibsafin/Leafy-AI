import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, Menu, X, User, LogIn, ShoppingCart, Calendar, History, LogOut, Search, TrendingUp } from 'lucide-react';
import { auth, signInWithGoogle, logout } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useScrollDirection } from '../hooks/useScrollDirection';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  onOpenCommandPalette: () => void;
}

export default function Navbar({ onNavigate, currentPage, onOpenCommandPalette }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [user] = useAuthState(auth);
  const [scrolled, setScrolled] = useState(false);
  const scrollDirection = useScrollDirection();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'home', label: 'Home', icon: null },
    { id: 'scan', label: 'Scan AI', icon: null },
    { id: 'growth-log', label: 'Growth', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'marketplace', label: 'Marketplace', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setIsOpen(false);
  };

  return (
    <motion.nav 
      initial={{ y: 0 }}
      animate={{ 
        y: scrollDirection === 'down' && scrolled ? -120 : 0,
      }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        scrolled ? 'py-4' : 'py-8'
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
        <div className={`relative bg-white/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/40 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] transition-all duration-700 ${
          scrolled ? 'px-8 py-3' : 'px-12 py-6'
        }`}>
          <div className="flex justify-between items-center">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              onClick={() => onNavigate('home')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-all duration-500">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tighter uppercase font-display">Leafy <span className="text-green-600 italic">AI</span></span>
            </motion.div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={onOpenCommandPalette}
                className="flex items-center gap-4 px-5 py-3 mr-6 bg-gray-50/50 text-gray-400 rounded-2xl border border-gray-100 hover:bg-white hover:text-green-600 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Search className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Quick Search</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-100 rounded-lg shadow-sm">
                  <span className="text-[9px] font-black opacity-30 tracking-tighter">⌘</span>
                  <span className="text-[9px] font-black tracking-tighter">K</span>
                </div>
              </button>

              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${
                    currentPage === link.id 
                      ? 'bg-gray-900 text-white shadow-xl shadow-gray-200' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-white'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </button>
              ))}
              
              <div className="w-px h-6 bg-gray-200/50 mx-6" />

              {user ? (
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => onNavigate('history')}
                    className={`p-3 rounded-2xl transition-all ${
                      currentPage === 'history' ? 'bg-green-50 text-green-600' : 'text-gray-400 hover:text-gray-900 hover:bg-white'
                    }`}
                  >
                    <History className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => onNavigate('profile')}
                    className={`flex items-center gap-3 pl-1.5 pr-5 py-1.5 rounded-full border transition-all ${
                      currentPage === 'profile' 
                        ? 'bg-white border-green-500 text-gray-900 shadow-sm' 
                        : 'border-gray-100 hover:border-green-200 text-gray-500 bg-white/50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-sm">
                      <img 
                        src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=4CAF50&color=fff`} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Account</span>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={signInWithGoogle}
                  className="px-8 py-3.5 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-gray-200 flex items-center gap-3"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile Menu Toggle - Hidden as we use BottomNav */}
            <div className="flex items-center gap-2 md:hidden">
              {/* Search is now in BottomNav for mobile */}
            </div>
          </div>
        </div>

        {/* Mobile Nav - Removed as we use BottomNav */}
      </div>
    </motion.nav>
  );
}
