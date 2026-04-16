import { motion } from 'motion/react';
import { MessageSquare, Bot } from 'lucide-react';

interface ChatPromoProps {
  onChat: () => void;
}

export default function ChatPromo({ onChat }: ChatPromoProps) {
  return (
    <section className="py-32 lg:py-48 bg-white overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-32">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-50 text-green-700 text-sm font-bold uppercase tracking-widest mb-10 border border-green-100 shadow-sm">
              <Bot className="w-5 h-5" />
              Meet Leafy AI 🌿
            </div>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 tracking-tighter mb-10 leading-[0.9] uppercase font-display">
              Got plant <br className="hidden lg:block" /> questions? <br />
              <span className="text-green-600 italic">Chat with Leafy AI anytime.</span>
            </h2>
            <p className="text-xl md:text-2xl lg:text-3xl text-gray-500 font-medium leading-relaxed max-w-3xl mb-14 tracking-tight">
              Our AI assistant is available 24/7 to help you with diseases, care tips, and more.
            </p>
            <button 
              onClick={onChat}
              className="group relative px-12 py-6 bg-gray-900 hover:bg-black text-white font-black rounded-full transition-all shadow-2xl hover:shadow-green-200 hover:-translate-y-1 flex items-center gap-4 overflow-hidden"
            >
              <div className="absolute inset-0 bg-green-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-expo" />
              <span className="relative z-10 flex items-center gap-4 uppercase tracking-widest text-sm">
                <MessageSquare className="w-6 h-6" />
                Ask Leafy AI
              </span>
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative w-full max-w-2xl aspect-square bg-green-50 rounded-[4rem] border border-green-100 flex items-center justify-center overflow-hidden shadow-inner"
          >
            {/* Animated Chat Bubbles */}
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[15%] left-[10%] p-6 bg-white rounded-3xl shadow-2xl border border-gray-100 text-lg font-bold text-gray-700 max-w-[280px] z-20"
            >
              "My leaves are turning yellow 🍂"
            </motion.div>
            <motion.div
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-[15%] right-[10%] p-6 bg-green-600 rounded-3xl shadow-2xl text-lg font-bold text-white max-w-[280px] z-20"
            >
              "Don't worry, we can fix this 🌿"
            </motion.div>
            
            <div className="w-48 h-48 bg-white rounded-[3rem] flex items-center justify-center shadow-2xl border border-gray-50 relative z-10">
              <Bot className="w-24 h-24 text-green-600" />
            </div>
            
            {/* Decorative background circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
