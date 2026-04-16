import { motion } from 'motion/react';
import { ShoppingCart, Star, ArrowRight } from 'lucide-react';

interface MarketplaceTeaserProps {
  onMarketplace?: () => void;
}

export default function MarketplaceTeaser({ onMarketplace }: MarketplaceTeaserProps) {
  const products = [
    {
      name: "Organic Soil Mix",
      price: "৳ 250",
      rating: 4.8,
      image: "https://picsum.photos/seed/soil/400/400"
    },
    {
      name: "Liquid Fertilizer",
      price: "৳ 450",
      rating: 4.9,
      image: "https://picsum.photos/seed/fertilizer/400/400"
    },
    {
      name: "Neem Oil Spray",
      price: "৳ 320",
      rating: 4.7,
      image: "https://picsum.photos/seed/neem/400/400"
    }
  ];

  return (
    <section className="py-32 bg-gray-50 overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-24"
        >
          <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 uppercase tracking-tighter">
            Smart-suggested products <br />
            <span className="text-green-600 italic">your plant needs</span>
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium">
            Explore our curated selection of high-quality plant care products.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {products.map((product, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              whileHover={{ y: -10 }}
              className="p-6 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all group"
              onClick={onMarketplace}
            >
              <div className="aspect-square rounded-3xl overflow-hidden mb-8 shadow-inner">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-gray-900">{product.name}</h3>
                <div className="flex items-center gap-1 text-yellow-500 font-bold">
                  <Star className="w-4 h-4 fill-current" />
                  {product.rating}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-green-600">{product.price}</span>
                <button className="p-3 bg-gray-900 text-white rounded-2xl hover:bg-black transition-colors">
                  <ShoppingCart className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <button 
            onClick={onMarketplace}
            className="group inline-flex items-center gap-3 text-xl font-bold text-gray-900 hover:text-green-600 transition-colors"
          >
            Explore Marketplace
            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
}
