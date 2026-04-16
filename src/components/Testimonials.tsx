import { motion } from 'motion/react';
import { Quote } from 'lucide-react';

export default function Testimonials() {
  const testimonials = [
    {
      quote: "Leafy AI saved my plant in 24 hours!",
      author: "Plant Lover, Dhaka",
      color: "text-green-600"
    },
    {
      quote: "The best plant care app I've ever used.",
      author: "Garden Enthusiast, Chittagong",
      color: "text-blue-600"
    },
    {
      quote: "Localized advice for Bangladesh is a game-changer.",
      author: "Urban Farmer, Sylhet",
      color: "text-purple-600"
    }
  ];

  return (
    <section className="py-32 lg:py-48 bg-white overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex flex-col items-center text-center">
          <Quote className="w-16 h-16 text-green-100 mb-12" />
          
          <div className="space-y-24">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-4xl mx-auto"
              >
                <h2 className={`text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter mb-8 leading-none uppercase ${testimonial.color}`}>
                  “{testimonial.quote}”
                </h2>
                <p className="text-xl md:text-2xl text-gray-400 font-bold uppercase tracking-widest">
                  — {testimonial.author}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
