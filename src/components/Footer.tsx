import { motion } from 'motion/react';
import { Leaf, Facebook, Twitter, Instagram, Mail, ArrowRight } from 'lucide-react';

interface FooterProps {
  onNavigate?: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'scan', label: 'Scan' },
    { id: 'chat', label: 'Chat' },
    { id: 'marketplace', label: 'Marketplace' },
    { id: 'history', label: 'History' }
  ];

  return (
    <footer className="bg-gray-950 text-white py-32 lg:py-48 overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tighter uppercase">Leafy AI 🌿</span>
            </div>
            <p className="text-gray-400 text-lg leading-relaxed font-medium">
              The future of plant care. AI-powered diagnosis and support for your garden.
            </p>
            <div className="flex gap-4">
              {[Facebook, Twitter, Instagram].map((Icon, i) => (
                <a key={i} href="#" className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-green-600 transition-colors">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <h3 className="text-xl font-bold uppercase tracking-widest">Navigation</h3>
            <ul className="space-y-4 text-gray-400 font-medium">
              {navItems.map((item, i) => (
                <li key={i}>
                  <button 
                    onClick={() => onNavigate?.(item.id)}
                    className="hover:text-green-600 transition-colors text-left"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-8">
            <h3 className="text-xl font-bold uppercase tracking-widest">Company</h3>
            <ul className="space-y-4 text-gray-400 font-medium">
              {['About Us', 'Privacy Policy', 'Terms of Service', 'Contact Us'].map((link, i) => (
                <li key={i}>
                  <a href="#" className="hover:text-green-600 transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-8">
            <h3 className="text-xl font-bold uppercase tracking-widest">Newsletter</h3>
            <p className="text-gray-400 font-medium">Get plant tips straight to your inbox.</p>
            <div className="relative group">
              <input 
                type="email" 
                placeholder="Your email address"
                className="w-full p-5 pr-16 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-green-600 transition-all font-medium"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-green-600 rounded-xl hover:bg-green-700 transition-colors">
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-gray-500 font-medium">
            © 2026 Leafy AI. Optimized for Bangladesh 🇧🇩
          </p>
          <div className="flex gap-8 text-sm font-bold uppercase tracking-widest text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
