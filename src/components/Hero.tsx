import { motion, useScroll, useTransform } from 'motion/react';
import { Camera, Search } from 'lucide-react';
import { useRef } from 'react';
import { PlantGrowthAnimation } from './PlantGrowthAnimation';

interface HeroProps {
  onStart: () => void;
}

export default function Hero({ onStart }: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <div ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#fafafa]">
      {/* Atmospheric Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div 
          style={{ y: y1 }}
          className="absolute -top-20 -left-[10%] w-[40vw] h-[40vw] bg-green-100/40 rounded-full blur-[120px]"
        />
        <motion.div 
          style={{ y: y2 }}
          className="absolute -bottom-20 -right-[10%] w-[50vw] h-[50vw] bg-emerald-50/50 rounded-full blur-[150px]"
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,#fafafa_100%)]" />
        
        {/* Floating Elements */}
        <motion.div 
          animate={{ 
            y: [0, -30, 0],
            rotate: [0, 15, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] right-[15%] text-7xl opacity-[0.08] pointer-events-none select-none"
        >
          🌿
        </motion.div>
        <motion.div 
          animate={{ 
            y: [0, 40, 0],
            rotate: [0, -20, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[20%] left-[10%] text-6xl opacity-[0.08] pointer-events-none select-none"
        >
          🍃
        </motion.div>
      </div>

      <motion.div 
        style={{ opacity, scale }}
        className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 text-center relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-12 relative inline-block">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="relative z-10 bg-white/40 backdrop-blur-xl p-4 rounded-[3rem] border border-white/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)]"
            >
              <PlantGrowthAnimation />
            </motion.div>
            <div className="absolute -inset-4 bg-green-400/10 blur-3xl rounded-full -z-10 animate-pulse" />
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/80 backdrop-blur-md text-green-700 text-[10px] font-black uppercase tracking-[0.3em] mb-10 border border-green-100/50 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
              The Future of Plant Care 🌿
            </span>
          </motion.div>
          
          <h1 className="text-7xl md:text-9xl lg:text-[10rem] 2xl:text-[14rem] font-black text-gray-900 tracking-[-0.04em] mb-10 leading-[0.85] uppercase font-display">
            AI-Powered <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">Diagnosis</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-xl md:text-2xl text-gray-500/80 mb-16 font-medium leading-relaxed tracking-tight">
            Upload an image and let our advanced neural networks <br className="hidden md:block" />
            tell you exactly what your plant needs — in seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <motion.button 
              onClick={onStart}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="group relative px-12 py-6 bg-gray-900 text-white font-black rounded-full transition-all shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)] hover:shadow-[0_32px_64px_-16px_rgba(34,197,94,0.3)] flex items-center gap-4 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.22,1,0.36,1]" />
              <span className="relative z-10 flex items-center gap-3 uppercase tracking-widest text-sm">
                <Search className="w-5 h-5" />
                Scan My Plant Now
              </span>
            </motion.button>
            
            <button className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 hover:text-green-600 transition-colors flex items-center gap-2 group">
              Explore Features
              <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>→</motion.span>
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Refined Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
      >
        <span className="text-[9px] uppercase tracking-[0.5em] font-black text-gray-300">Scroll</span>
        <div className="w-[1px] h-16 bg-gradient-to-b from-gray-200 via-gray-100 to-transparent" />
      </motion.div>
    </div>
  );
}
