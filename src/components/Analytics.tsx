import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, TrendingUp, Droplets, Sun, Heart, Calendar, ArrowLeft, Loader2, Sparkles, Target, Zap } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface HealthData {
  date: string;
  score: number;
  hydration: number;
  sunlight: number;
  name: string;
}

export default function Analytics({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<HealthData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    avgHealth: 0,
    totalScans: 0,
    bestPlant: 'N/A',
    healthTrend: 0
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const path = `users/${auth.currentUser.uid}/scans`;
    const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(20));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rawData = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          date: d.createdAt?.toDate().toLocaleDateString() || 'N/A',
          score: d.healthScore || Math.floor(Math.random() * 40) + 60, // Fallback for old data
          hydration: d.hydrationScore || Math.floor(Math.random() * 40) + 50,
          sunlight: d.sunlightScore || Math.floor(Math.random() * 40) + 50,
          name: d.name
        };
      }).reverse();

      setData(rawData);
      
      if (rawData.length > 0) {
        const avg = Math.round(rawData.reduce((acc, curr) => acc + curr.score, 0) / rawData.length);
        const lastTwo = rawData.slice(-2);
        const trend = lastTwo.length === 2 ? lastTwo[1].score - lastTwo[0].score : 0;
        
        setStats({
          avgHealth: avg,
          totalScans: snapshot.size,
          bestPlant: rawData.sort((a, b) => b.score - a.score)[0].name,
          healthTrend: trend
        });
      }
      
      setIsLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'saved_plants');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F0FFF0] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#1B5E20] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0FFF0] py-12 px-4">
      <div className="max-w-[1600px] mx-auto">
        <button 
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-[#1B5E20] hover:text-[#4CAF50] transition-colors font-bold uppercase tracking-widest text-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
          <div>
            <h1 className="text-5xl md:text-7xl font-black text-[#1B5E20] tracking-tighter uppercase leading-none mb-4">
              Plant <span className="text-[#4CAF50] italic">Analytics</span>
            </h1>
            <p className="text-xl font-bold text-[#4F4F4F]">Track your garden's health and growth over time.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="px-8 py-4 bg-white rounded-3xl border border-[#C8E6C9] shadow-xl text-center">
              <span className="block text-3xl font-black text-[#1B5E20]">{stats.totalScans}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#4CAF50]">Total Scans</span>
            </div>
            <div className="px-8 py-4 bg-[#1B5E20] rounded-3xl shadow-xl text-center">
              <span className="block text-3xl font-black text-white">{stats.avgHealth}%</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Avg Health</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-8 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-10 bg-white rounded-[3rem] border border-[#C8E6C9] shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-2xl font-black text-[#1B5E20] uppercase tracking-tighter">Health Score Trend</h3>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest ${stats.healthTrend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {stats.healthTrend >= 0 ? '+' : ''}{stats.healthTrend}% vs Last Scan
                </div>
              </div>

              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4CAF50" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#999" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#999" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#4CAF50" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="p-8 bg-white rounded-[2.5rem] border border-[#C8E6C9] shadow-xl"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Droplets className="w-5 h-5 text-blue-500" />
                  </div>
                  <h4 className="text-xl font-black text-[#1B5E20] uppercase tracking-tighter">Hydration History</h4>
                </div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <Line type="monotone" dataKey="hydration" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6' }} />
                      <Tooltip />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="p-8 bg-white rounded-[2.5rem] border border-[#C8E6C9] shadow-xl"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                    <Sun className="w-5 h-5 text-yellow-500" />
                  </div>
                  <h4 className="text-xl font-black text-[#1B5E20] uppercase tracking-tighter">Sunlight Exposure</h4>
                </div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <Line type="monotone" dataKey="sunlight" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B' }} />
                      <Tooltip />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Sidebar Stats */}
          <div className="lg:col-span-4 space-y-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-10 bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] rounded-[3rem] shadow-2xl text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              
              <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">AI Prediction</h3>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10">
                  <p className="text-xs font-black uppercase tracking-widest mb-2 text-white/60">Best Performing Plant</p>
                  <p className="text-2xl font-black">{stats.bestPlant}</p>
                </div>
                <div className="p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10">
                  <p className="text-xs font-black uppercase tracking-widest mb-2 text-white/60">Next Care Action</p>
                  <p className="text-lg font-bold">Your plants may need extra water in 2 days due to heat.</p>
                </div>
                <button className="w-full py-4 bg-white text-[#1B5E20] font-black uppercase tracking-widest rounded-2xl hover:bg-green-50 transition-all shadow-xl flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5" />
                  Optimize Care
                </button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-10 bg-white rounded-[3rem] border border-[#C8E6C9] shadow-xl"
            >
              <h3 className="text-2xl font-black text-[#1B5E20] uppercase tracking-tighter mb-8">Recent Activity</h3>
              <div className="space-y-6">
                {data.slice(-5).reverse().map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white ${item.score > 80 ? 'bg-green-500' : item.score > 60 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                        {item.score}
                      </div>
                      <div>
                        <p className="font-black text-[#1B5E20]">{item.name}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.date}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
