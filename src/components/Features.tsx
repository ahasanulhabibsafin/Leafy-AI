import { motion } from 'motion/react';
import { Leaf, Search, Pill } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: Leaf,
      title: "Smart ID",
      desc: "Instant identification of 10,000+ species with 99% accuracy.",
      color: "bg-green-50 text-green-600",
      span: "md:col-span-2"
    },
    {
      icon: Search,
      title: "Health Scan",
      desc: "AI-powered disease detection for leaves and stems.",
      color: "bg-emerald-50 text-emerald-600",
      span: "md:col-span-1"
    },
    {
      icon: Pill,
      title: "Care Plans",
      desc: "Personalized treatment schedules and reminders.",
      color: "bg-teal-50 text-teal-600",
      span: "md:col-span-1"
    },
    {
      icon: Search,
      title: "Expert Chat",
      desc: "24/7 access to our botanical AI for any plant questions.",
      color: "bg-green-100 text-green-700",
      span: "md:col-span-2"
    }
  ];

  return (
    <section className="py-40 bg-white relative overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-24">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[10px] font-black uppercase tracking-[0.4em] text-green-600 mb-4 block"
          >
            Capabilities
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight font-display uppercase"
          >
            Everything your <br />
            <span className="text-gray-400">garden needs.</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8 }}
              className={`p-12 bg-[#fcfcfc] rounded-[3rem] border border-gray-100 transition-all group relative overflow-hidden ${feature.span}`}
            >
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-green-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative z-10">
                <div className={`w-20 h-20 ${feature.color} rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm`}>
                  <feature.icon className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-6 tracking-tight font-display uppercase">{feature.title}</h3>
                <p className="text-gray-500/80 text-xl leading-relaxed font-medium tracking-tight">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
