import { motion } from 'motion/react';
import { Globe } from 'lucide-react';

export default function BangladeshBlock() {
  return (
    <section className="py-32 lg:py-48 bg-green-600 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 -skew-x-12 translate-x-1/4 pointer-events-none" />
      
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-center justify-between gap-12"
        >
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-bold uppercase tracking-widest mb-8 border border-white/20">
              <Globe className="w-4 h-4" />
              Bangladesh Ready 🇧🇩
            </div>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tighter mb-8 leading-none uppercase">
              Personalized care <br />
              <span className="text-green-200 italic">for local climate</span>
            </h2>
            <p className="text-xl md:text-2xl text-green-50 font-medium leading-relaxed max-w-2xl">
              Our AI is trained on Bangladesh's unique weather patterns and seasonal shifts.
            </p>
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            className="w-64 h-64 md:w-96 md:h-96 bg-white/10 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-sm"
          >
            <span className="text-9xl md:text-[12rem] drop-shadow-2xl">🇧🇩</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
