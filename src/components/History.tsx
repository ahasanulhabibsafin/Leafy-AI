import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Trash2, ChevronRight, Leaf, Search, Filter, Clock } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

interface ScanHistory {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  details?: string;
  type?: string;
  createdAt: any;
}

interface HistoryProps {
  onViewResult: (result: any, imageUrl: string) => void;
  onChat: (result: any) => void;
}

export default function History({ onViewResult, onChat }: HistoryProps) {
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!auth.currentUser) return;

    const path = `users/${auth.currentUser.uid}/scans`;
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ScanHistory[];
      setHistory(items);
      setIsLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'scans');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (!auth.currentUser) return;
    try {
      const path = `users/${auth.currentUser.uid}/scans/${id}`;
      await deleteDoc(doc(db, path));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'scans');
    }
  };

  const filteredHistory = history.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F0FFF0] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0FFF0] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-extrabold text-[#1B5E20] tracking-tighter mb-4 uppercase leading-none">
            Scan <span className="text-green-600 italic">History 📜</span>
          </h1>
          <p className="text-xl text-[#4F4F4F] font-medium">
            Review your past plant diagnoses and track their health journey.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search your scans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-[#C8E6C9] rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/20 focus:border-[#4CAF50] transition-all font-medium"
            />
          </div>
          <button className="px-6 py-4 bg-white text-[#1B5E20] border border-[#C8E6C9] rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-green-50 transition-all">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-[#C8E6C9] shadow-xl">
            <div className="w-20 h-20 bg-[#F0FFF0] rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Leaf className="w-10 h-10 text-[#4CAF50]" />
            </div>
            <h3 className="text-2xl font-extrabold text-[#1B5E20] mb-2 uppercase tracking-tighter">No scans yet</h3>
            <p className="text-gray-500 font-medium">Start by scanning your first plant to see it here!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredHistory.map((item, i) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group bg-white p-6 rounded-[2.5rem] border border-[#C8E6C9] shadow-xl hover:shadow-2xl transition-all flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
              >
                <div className="w-full md:w-48 h-48 rounded-[2rem] overflow-hidden flex-shrink-0 shadow-inner">
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <div className="px-3 py-1 bg-[#F0FFF0] text-[#4CAF50] text-[10px] font-black uppercase tracking-widest rounded-full border border-[#C8E6C9]">
                      Diagnosis Complete
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <Clock className="w-3 h-3" />
                      {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Just now'}
                    </div>
                  </div>
                  <h3 className="text-3xl font-extrabold text-[#1B5E20] tracking-tighter mb-2 uppercase">{item.name}</h3>
                  <p className="text-[#4F4F4F] font-medium leading-relaxed line-clamp-2 mb-6">
                    {item.description}
                  </p>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <button 
                      onClick={() => onViewResult(item, item.imageUrl)}
                      className="px-6 py-2.5 bg-[#4CAF50] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#388E3C] transition-all shadow-md"
                    >
                      View Results
                    </button>
                    <button 
                      onClick={() => onChat(item)}
                      className="px-6 py-2.5 bg-white text-[#4CAF50] text-xs font-black uppercase tracking-widest rounded-xl hover:bg-green-50 transition-all border border-[#C8E6C9]"
                    >
                      Chat with AI
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="px-6 py-2.5 bg-red-50 text-red-500 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="hidden md:flex items-center justify-center w-12 h-12 bg-gray-50 rounded-full group-hover:bg-[#4CAF50] group-hover:text-white transition-all cursor-pointer">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
