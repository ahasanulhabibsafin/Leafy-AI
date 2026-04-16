import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Calendar, MapPin, TrendingUp, History, 
  ChevronRight, Camera, Loader2, ArrowLeft, 
  MessageSquare, Info, CheckCircle2, AlertCircle,
  LineChart as LineChartIcon, Trash2, X, Save, Mic, Square, Play, Pause, Volume2
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, serverTimestamp, doc, updateDoc, deleteDoc,
  getDocs, limit, Timestamp
} from 'firebase/firestore';
import { compareGrowth, GrowthAnalysis, generateSpeech } from '../lib/gemini';

interface Plant {
  id: string;
  name: string;
  imageUrl: string;
  type: string;
  location?: string;
  healthScore: number;
  createdAt: any;
}

interface GrowthLogEntry {
  id: string;
  plantId: string;
  imageUrl: string;
  healthScore: number;
  aiAnalysis: string;
  notes: string;
  improvement: number;
  prediction: string;
  voiceUrl?: string;
  createdAt: any;
}

export default function GrowthLog() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [entries, setEntries] = useState<GrowthLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingPlant, setIsAddingPlant] = useState(false);
  const [isAddingUpdate, setIsAddingUpdate] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [isReading, setIsReading] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Form states
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newImage, setNewImage] = useState<string | null>(null);
  const [newNotes, setNewNotes] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const plantsRef = collection(db, 'users', auth.currentUser.uid, 'saved_plants');
    const q = query(plantsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plantList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Plant[];
      setPlants(plantList);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'saved_plants');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!auth.currentUser || !selectedPlant) {
      setEntries([]);
      return;
    }

    const entriesRef = collection(db, 'users', auth.currentUser.uid, 'growth_log_entries');
    const q = query(
      entriesRef, 
      where('plantId', '==', selectedPlant.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entryList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GrowthLogEntry[];
      setEntries(entryList);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'growth_log_entries');
    });

    return () => unsubscribe();
  }, [selectedPlant]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPlant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newName || !newImage) return;

    setIsAnalyzing(true);
    try {
      // First analysis for the new plant
      const analysis = await compareGrowth(null, newImage);
      
      const plantData = {
        userId: auth.currentUser.uid,
        name: newName,
        imageUrl: newImage,
        location: newLocation,
        healthScore: analysis.healthScore,
        createdAt: serverTimestamp(),
      };

      const plantDoc = await addDoc(collection(db, 'users', auth.currentUser.uid, 'saved_plants'), plantData);
      
      // Add first log entry
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'growth_log_entries'), {
        userId: auth.currentUser.uid,
        plantId: plantDoc.id,
        imageUrl: newImage,
        healthScore: analysis.healthScore,
        aiAnalysis: analysis.aiAnalysis,
        notes: "Initial entry",
        improvement: 0,
        prediction: analysis.prediction,
        createdAt: serverTimestamp(),
      });

      setIsAddingPlant(false);
      setNewName('');
      setNewLocation('');
      setNewImage(null);
    } catch (err) {
      console.error("Error adding plant:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !selectedPlant || !newImage) return;

    setIsAnalyzing(true);
    try {
      const lastImage = entries.length > 0 ? entries[0].imageUrl : selectedPlant.imageUrl;
      const analysis = await compareGrowth(lastImage, newImage);

      await addDoc(collection(db, 'users', auth.currentUser.uid, 'growth_log_entries'), {
        userId: auth.currentUser.uid,
        plantId: selectedPlant.id,
        imageUrl: newImage,
        healthScore: analysis.healthScore,
        aiAnalysis: analysis.aiAnalysis,
        notes: newNotes,
        improvement: analysis.improvement,
        prediction: analysis.prediction,
        voiceUrl: audioUrl,
        createdAt: serverTimestamp(),
      });

      // Update plant's overall health score and image
      await updateDoc(doc(db, 'users', auth.currentUser.uid, 'saved_plants', selectedPlant.id), {
        healthScore: analysis.healthScore,
        imageUrl: newImage,
      });

      setIsAddingUpdate(false);
      setNewImage(null);
      setNewNotes('');
      setAudioUrl(null);
    } catch (err) {
      console.error("Error adding update:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioUrl(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playVoiceNote = (url: string, id: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onplay = () => setIsPlaying(id);
    audio.onended = () => setIsPlaying(null);
    audio.play();
  };

  const readAloud = async (text: string, id: string) => {
    if (isReading === id) return;
    setIsReading(id);
    try {
      const url = await generateSpeech(text);
      const audio = new Audio(url);
      audio.onended = () => setIsReading(null);
      audio.play();
    } catch (err) {
      console.error("Error reading aloud:", err);
      setIsReading(null);
    }
  };

  const handleDeletePlant = async (plantId: string) => {
    if (!auth.currentUser || !window.confirm("Are you sure you want to delete this plant and all its logs?")) return;

    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'saved_plants', plantId));
      // Optionally delete all entries too, but Firestore doesn't support recursive delete easily from client
      setSelectedPlant(null);
    } catch (err) {
      console.error("Error deleting plant:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0FFF0]">
        <Loader2 className="w-12 h-12 animate-spin text-[#4CAF50]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0FFF0] pb-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!selectedPlant ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-4xl font-black text-[#1B5E20] uppercase tracking-tighter">Growth Log</h1>
                  <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-1">Fitness tracker for your plants</p>
                </div>
                <button
                  onClick={() => setIsAddingPlant(true)}
                  className="p-4 bg-[#1B5E20] text-white rounded-2xl hover:bg-[#4CAF50] transition-all shadow-xl flex items-center gap-2"
                >
                  <Plus className="w-6 h-6" />
                  <span className="font-black uppercase text-xs tracking-widest">Add Plant</span>
                </button>
              </div>

              {plants.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-12 text-center border border-[#C8E6C9] shadow-xl">
                  <div className="w-20 h-20 bg-[#F0FFF0] rounded-full flex items-center justify-center mx-auto mb-6">
                    <TrendingUp className="w-10 h-10 text-[#4CAF50]" />
                  </div>
                  <h2 className="text-2xl font-black text-[#1B5E20] mb-2">No Plants Tracked Yet</h2>
                  <p className="text-gray-500 font-bold mb-8">Start your first growth log to track progress and get AI insights.</p>
                  <button
                    onClick={() => setIsAddingPlant(true)}
                    className="px-8 py-4 bg-[#1B5E20] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#4CAF50] transition-all shadow-lg"
                  >
                    Track My First Plant
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {plants.map((plant) => (
                    <motion.div
                      key={plant.id}
                      whileHover={{ y: -5 }}
                      onClick={() => setSelectedPlant(plant)}
                      className="bg-white rounded-[2.5rem] overflow-hidden border border-[#C8E6C9] shadow-xl cursor-pointer group"
                    >
                      <div className="aspect-[4/3] relative overflow-hidden">
                        <img 
                          src={plant.imageUrl} 
                          alt={plant.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${plant.healthScore > 70 ? 'bg-green-500' : plant.healthScore > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                            <span className="text-xs font-black text-[#1B5E20]">{plant.healthScore}% Health</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-black text-[#1B5E20] uppercase tracking-tight">{plant.name}</h3>
                          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#4CAF50] transition-colors" />
                        </div>
                        <div className="flex items-center gap-4 text-gray-400">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{plant.location || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                              {plant.createdAt?.toDate ? plant.createdAt.toDate().toLocaleDateString() : 'Just now'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button
                onClick={() => setSelectedPlant(null)}
                className="flex items-center gap-2 text-[#4CAF50] font-black uppercase text-xs tracking-widest mb-8 hover:translate-x-[-4px] transition-transform"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Plants
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Plant Info & Graph */}
                <div className="lg:col-span-4 space-y-8">
                  <div className="bg-white rounded-[3rem] p-8 border border-[#C8E6C9] shadow-xl">
                    <div className="aspect-square rounded-[2rem] overflow-hidden mb-6 shadow-lg border-4 border-[#F0FFF0]">
                      <img 
                        src={selectedPlant.imageUrl} 
                        alt={selectedPlant.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-3xl font-black text-[#1B5E20] uppercase tracking-tighter">{selectedPlant.name}</h2>
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{selectedPlant.location || 'No location set'}</p>
                      </div>
                      <button 
                        onClick={() => handleDeletePlant(selectedPlant.id)}
                        className="p-2 text-red-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="p-6 bg-[#F0FFF0] rounded-2xl border border-[#C8E6C9] mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-[#4CAF50] uppercase tracking-widest">Overall Health</span>
                        <span className="text-xl font-black text-[#1B5E20]">{selectedPlant.healthScore}%</span>
                      </div>
                      <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-[#C8E6C9]">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${selectedPlant.healthScore}%` }}
                          className={`h-full ${selectedPlant.healthScore > 70 ? 'bg-green-500' : selectedPlant.healthScore > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => setIsAddingUpdate(true)}
                      className="w-full py-4 bg-[#1B5E20] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#4CAF50] transition-all shadow-xl flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Add New Update
                    </button>
                  </div>

                  {/* Health Graph */}
                  <div className="bg-white rounded-[3rem] p-8 border border-[#C8E6C9] shadow-xl">
                    <div className="flex items-center gap-2 mb-6">
                      <LineChartIcon className="w-5 h-5 text-[#4CAF50]" />
                      <h3 className="text-lg font-black text-[#1B5E20] uppercase tracking-tight">Health Trend</h3>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[...entries].reverse()}>
                          <defs>
                            <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#4CAF50" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                          <XAxis 
                            dataKey="createdAt" 
                            hide 
                          />
                          <YAxis domain={[0, 100]} hide />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              borderRadius: '1rem', 
                              border: '1px solid #C8E6C9',
                              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                              fontFamily: 'inherit',
                              fontWeight: 'bold'
                            }}
                            labelFormatter={() => 'Health Score'}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="healthScore" 
                            stroke="#4CAF50" 
                            strokeWidth={4}
                            fillOpacity={1} 
                            fill="url(#colorHealth)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Right Column: Timeline */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <History className="w-5 h-5 text-[#4CAF50]" />
                    <h3 className="text-xl font-black text-[#1B5E20] uppercase tracking-tight">Growth Timeline</h3>
                  </div>

                  <div className="space-y-8 relative before:absolute before:left-8 before:top-4 before:bottom-4 before:w-1 before:bg-[#C8E6C9] before:rounded-full">
                    {entries.map((entry, idx) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="relative pl-20"
                      >
                        {/* Timeline Dot */}
                        <div className="absolute left-6 top-8 w-5 h-5 bg-white border-4 border-[#4CAF50] rounded-full z-10 shadow-md" />
                        
                        <div className="bg-white rounded-[2.5rem] p-8 border border-[#C8E6C9] shadow-xl hover:shadow-2xl transition-all group">
                          <div className="flex flex-col md:flex-row gap-8">
                            <div className="md:w-48 flex-shrink-0">
                              <div className="aspect-square rounded-2xl overflow-hidden shadow-md border-2 border-[#F0FFF0]">
                                <img 
                                  src={entry.imageUrl} 
                                  alt="Update" 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="mt-4 flex items-center justify-center gap-2 px-3 py-1 bg-[#F0FFF0] rounded-full">
                                <Calendar className="w-3 h-3 text-[#4CAF50]" />
                                <span className="text-[10px] font-black text-[#4CAF50] uppercase tracking-widest">
                                  {entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                </span>
                              </div>
                            </div>

                            <div className="flex-1 space-y-4">
                              <div className="flex flex-wrap items-center gap-4">
                                <div className="px-4 py-2 bg-green-50 rounded-xl border border-green-100">
                                  <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                    <span className="text-sm font-black text-green-700">{entry.healthScore}% Health</span>
                                  </div>
                                </div>
                                {entry.improvement !== 0 && (
                                  <div className={`px-4 py-2 rounded-xl border ${entry.improvement > 0 ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                    <span className="text-sm font-black">
                                      {entry.improvement > 0 ? '+' : ''}{entry.improvement}% Improvement
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-[#1B5E20]">
                                    <Info className="w-4 h-4" />
                                    <h4 className="text-xs font-black uppercase tracking-widest">AI Analysis</h4>
                                  </div>
                                  <button
                                    onClick={() => readAloud(entry.aiAnalysis, entry.id)}
                                    className={`p-2 rounded-full transition-all ${isReading === entry.id ? 'bg-[#4CAF50] text-white animate-pulse' : 'bg-[#F0FFF0] text-[#4CAF50] hover:bg-[#C8E6C9]'}`}
                                  >
                                    <Volume2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <p className="text-sm text-[#4F4F4F] font-bold leading-relaxed bg-[#F0FFF0]/50 p-4 rounded-2xl border border-dashed border-[#C8E6C9]">
                                  {entry.aiAnalysis}
                                </p>
                              </div>

                              {(entry.notes || entry.voiceUrl) && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-gray-400">
                                      <MessageSquare className="w-4 h-4" />
                                      <h4 className="text-xs font-black uppercase tracking-widest">My Notes</h4>
                                    </div>
                                    {entry.voiceUrl && (
                                      <button
                                        onClick={() => playVoiceNote(entry.voiceUrl!, entry.id)}
                                        className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all ${isPlaying === entry.id ? 'bg-[#1B5E20] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                      >
                                        {isPlaying === entry.id ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                        <span className="text-[10px] font-black uppercase tracking-widest">Voice Note</span>
                                      </button>
                                    )}
                                  </div>
                                  {entry.notes && <p className="text-sm text-gray-500 italic font-medium">"{entry.notes}"</p>}
                                </div>
                              )}

                              <div className="pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-2 text-orange-500 mb-2">
                                  <AlertCircle className="w-4 h-4" />
                                  <h4 className="text-[10px] font-black uppercase tracking-widest">AI Prediction</h4>
                                </div>
                                <p className="text-xs font-bold text-orange-600/80">{entry.prediction}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Plant Modal */}
      <AnimatePresence>
        {isAddingPlant && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[3rem] p-8 max-w-md w-full shadow-2xl border border-[#C8E6C9]"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-[#1B5E20] uppercase tracking-tighter">New Growth Log</h2>
                <button onClick={() => setIsAddingPlant(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleAddPlant} className="space-y-6">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-video bg-[#F0FFF0] rounded-[2rem] border-4 border-dashed border-[#C8E6C9] flex flex-col items-center justify-center cursor-pointer hover:bg-green-50 transition-all overflow-hidden relative"
                >
                  {newImage ? (
                    <img src={newImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera className="w-10 h-10 text-[#4CAF50] mb-2" />
                      <span className="text-xs font-black text-[#4CAF50] uppercase tracking-widest">Snap First Photo</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#4CAF50] uppercase tracking-widest mb-2">Plant Name</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-6 py-4 bg-[#F0FFF0] border border-[#C8E6C9] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50] font-bold text-[#1B5E20]"
                    placeholder="e.g., My Monstera"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#4CAF50] uppercase tracking-widest mb-2">Location (Optional)</label>
                  <input 
                    type="text" 
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-6 py-4 bg-[#F0FFF0] border border-[#C8E6C9] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50] font-bold text-[#1B5E20]"
                    placeholder="e.g., Living Room Window"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAnalyzing || !newImage || !newName}
                  className="w-full py-4 bg-[#1B5E20] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#4CAF50] transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      AI Analyzing...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Start Tracking
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Update Modal */}
      <AnimatePresence>
        {isAddingUpdate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[3rem] p-8 max-w-md w-full shadow-2xl border border-[#C8E6C9]"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-[#1B5E20] uppercase tracking-tighter">Add Progress Update</h2>
                <button onClick={() => setIsAddingUpdate(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleAddUpdate} className="space-y-6">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-video bg-[#F0FFF0] rounded-[2rem] border-4 border-dashed border-[#C8E6C9] flex flex-col items-center justify-center cursor-pointer hover:bg-green-50 transition-all overflow-hidden relative"
                >
                  {newImage ? (
                    <img src={newImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera className="w-10 h-10 text-[#4CAF50] mb-2" />
                      <span className="text-xs font-black text-[#4CAF50] uppercase tracking-widest">Snap New Photo</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#4CAF50] uppercase tracking-widest mb-2">My Notes</label>
                  <textarea 
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full px-6 py-4 bg-[#F0FFF0] border border-[#C8E6C9] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50] font-bold text-[#1B5E20] min-h-[100px]"
                    placeholder="e.g., Watered today, added fertilizer..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#4CAF50] uppercase tracking-widest mb-2">Voice Note (Optional)</label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-[#F0FFF0] text-[#4CAF50] border border-[#C8E6C9] hover:bg-green-50'}`}
                    >
                      {isRecording ? (
                        <>
                          <Square className="w-5 h-5" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="w-5 h-5" />
                          Record Voice
                        </>
                      )}
                    </button>
                    {audioUrl && !isRecording && (
                      <button
                        type="button"
                        onClick={() => playVoiceNote(audioUrl, 'preview')}
                        className={`p-4 rounded-2xl transition-all ${isPlaying === 'preview' ? 'bg-[#1B5E20] text-white' : 'bg-[#F0FFF0] text-[#4CAF50] border border-[#C8E6C9]'}`}
                      >
                        {isPlaying === 'preview' ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                      </button>
                    )}
                  </div>
                  {audioUrl && !isRecording && (
                    <p className="text-[10px] font-bold text-[#4CAF50] mt-2 uppercase tracking-widest text-center">Voice note recorded! ✅</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isAnalyzing || !newImage}
                  className="w-full py-4 bg-[#1B5E20] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#4CAF50] transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      AI Comparing Progress...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-5 h-5" />
                      Analyze & Save
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
