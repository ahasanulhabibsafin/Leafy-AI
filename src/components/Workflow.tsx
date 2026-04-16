import { motion } from 'motion/react';
import { Upload, Cpu, CheckCircle } from 'lucide-react';

export default function Workflow() {
  const steps = [
    {
      icon: Upload,
      title: "1. Upload Photo",
      desc: "Take a clear picture of your plant's leaf or stem.",
      color: "text-blue-500"
    },
    {
      icon: Cpu,
      title: "2. AI Analysis",
      desc: "Our neural network analyzes leaf color, patterns, and texture.",
      color: "text-green-500"
    },
    {
      icon: CheckCircle,
      title: "3. Get Results",
      desc: "Receive instant diagnosis and personalized care suggestions.",
      color: "text-purple-500"
    }
  ];

  return (
    <section className="py-32 lg:py-48 bg-gray-50 overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-24"
        >
          <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 uppercase tracking-tighter">
            How It Works
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium">
            Our advanced AI workflow ensures your plants get the best care possible.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 -z-10" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.3 }}
                className="flex flex-col items-center text-center group"
              >
                <div className={`w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-xl border-4 border-gray-50 group-hover:scale-110 transition-transform`}>
                  <step.icon className={`w-10 h-10 ${step.color}`} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-500 text-lg leading-relaxed max-w-xs">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
