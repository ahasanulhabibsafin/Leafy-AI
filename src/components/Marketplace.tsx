import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, ShoppingCart, Star, Filter, ArrowRight, Tag, Leaf, Zap } from 'lucide-react';

const PRODUCTS = [
  {
    id: 1,
    name: "Organic Soil Mix",
    category: "Soil",
    price: 250,
    rating: 4.8,
    reviews: 124,
    image: "https://picsum.photos/seed/soil/400/400",
    badge: "Best Seller"
  },
  {
    id: 2,
    name: "Liquid Fertilizer",
    category: "Fertilizer",
    price: 450,
    rating: 4.9,
    reviews: 89,
    image: "https://picsum.photos/seed/fertilizer/400/400",
    badge: "AI Recommended"
  },
  {
    id: 3,
    name: "Neem Oil Spray",
    category: "Medicine",
    price: 320,
    rating: 4.7,
    reviews: 56,
    image: "https://picsum.photos/seed/neem/400/400"
  },
  {
    id: 4,
    name: "Smart Watering Can",
    category: "Tools",
    price: 850,
    rating: 4.6,
    reviews: 34,
    image: "https://picsum.photos/seed/can/400/400",
    badge: "New"
  },
  {
    id: 5,
    name: "Pruning Shears",
    category: "Tools",
    price: 550,
    rating: 4.8,
    reviews: 72,
    image: "https://picsum.photos/seed/shears/400/400"
  },
  {
    id: 6,
    name: "Coco Peat Block",
    category: "Soil",
    price: 180,
    rating: 4.5,
    reviews: 45,
    image: "https://picsum.photos/seed/coco/400/400"
  }
];

const CATEGORIES = ["All", "Soil", "Fertilizer", "Medicine", "Tools"];

export default function Marketplace() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = PRODUCTS.filter(p => 
    (activeCategory === "All" || p.category === activeCategory) &&
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F0FFF0] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-extrabold text-[#1B5E20] tracking-tighter mb-4 uppercase leading-none">
            Leafy <span className="text-green-600 italic">Marketplace 🛒</span>
          </h1>
          <p className="text-xl text-[#4F4F4F] font-medium max-w-2xl">
            Curated products for your plants, recommended by AI and trusted by experts in Bangladesh.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-[#C8E6C9] rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/20 focus:border-[#4CAF50] transition-all font-medium"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all whitespace-nowrap border ${
                  activeCategory === cat 
                    ? 'bg-[#4CAF50] text-white border-[#4CAF50] shadow-lg shadow-green-100' 
                    : 'bg-white text-[#1B5E20] border-[#C8E6C9] hover:bg-green-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -10 }}
              className="group bg-white rounded-[2.5rem] p-6 border border-[#C8E6C9] shadow-xl hover:shadow-2xl transition-all relative"
            >
              {product.badge && (
                <div className="absolute top-8 left-8 z-10 px-4 py-1.5 bg-[#1B5E20] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1.5">
                  {product.badge === "AI Recommended" && <Zap className="w-3 h-3 fill-yellow-400 text-yellow-400" />}
                  {product.badge}
                </div>
              )}
              
              <div className="aspect-square rounded-3xl overflow-hidden mb-6 shadow-inner relative">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
              </div>

              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-[10px] font-black text-[#4CAF50] uppercase tracking-widest mb-1">{product.category}</p>
                  <h3 className="text-2xl font-extrabold text-[#1B5E20] tracking-tight">{product.name}</h3>
                </div>
                <div className="flex items-center gap-1 text-yellow-500 font-black text-sm">
                  <Star className="w-4 h-4 fill-current" />
                  {product.rating}
                </div>
              </div>

              <p className="text-gray-400 text-xs font-bold mb-6">{product.reviews} verified reviews</p>

              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Price</span>
                  <span className="text-3xl font-black text-[#1B5E20]">৳ {product.price}</span>
                </div>
                <button className="p-4 bg-[#4CAF50] hover:bg-[#388E3C] text-white rounded-2xl transition-all shadow-lg hover:shadow-green-200 group-active:scale-95">
                  <ShoppingCart className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-[#C8E6C9] shadow-xl">
            <div className="w-20 h-20 bg-[#F0FFF0] rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Leaf className="w-10 h-10 text-[#4CAF50]" />
            </div>
            <h3 className="text-2xl font-extrabold text-[#1B5E20] mb-2 uppercase tracking-tighter">No products found</h3>
            <p className="text-gray-500 font-medium">Try searching for something else or change the category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
