import React, { useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload as UploadIcon, X, Loader2, Globe, Zap, Languages, Search, Sparkles, MessageSquare } from 'lucide-react';
import { analyzeImage, ScanResult } from '../lib/gemini';
import { identifyPlant } from '../lib/plantnet';
import { resizeImage } from '../lib/utils';
import { db, auth, handleFirestoreError, OperationType, updateUserStats } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface UploadProps {
  onResult: (result: ScanResult, imageUrl: string) => void;
}

export default function Upload({ onResult }: UploadProps) {
  const [image, setImage] = useState<string | null>(null);
  const [userQuery, setUserQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isBangladeshMode, setIsBangladeshMode] = useState(true);
  const [isHighAccuracy, setIsHighAccuracy] = useState(false);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;

    setIsAnalyzing(true);
    setProgress(0);

    // Fake progress bar
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 2;
      });
    }, 200);

    try {
      console.log('Starting analysis...', { isBangladeshMode, language, isHighAccuracy, userQuery });
      
      // Resize image to avoid Firestore 1MB limit and speed up analysis
      const resizedImage = await resizeImage(image);
      
      // Step 1: Try PlantNet if it's potentially a plant
      let plantNetData = null;
      try {
        console.log('Attempting PlantNet identification...');
        plantNetData = await identifyPlant(resizedImage);
        console.log('PlantNet result:', plantNetData);
      } catch (err) {
        console.warn('PlantNet failed, falling back to Gemini only:', err);
      }

      // Step 2: Use Gemini for full analysis
      console.log('Calling Gemini analyzeImage...');
      const result = await analyzeImage(resizedImage, isBangladeshMode, language, plantNetData, userQuery, isHighAccuracy ? 'high' : 'standard');
      console.log('Gemini analysis successful:', result);
      setProgress(100);
      
      // Save to history if logged in
      if (auth.currentUser) {
        console.log('Saving scan to history...');
        try {
          const path = `users/${auth.currentUser.uid}/scans`;
          await addDoc(collection(db, path), {
            userId: auth.currentUser.uid,
            imageUrl: resizedImage, 
            name: result.name,
            confidence: result.confidence,
            description: result.description,
            details: result.details,
            type: result.type,
            userQuery,
            isBangladeshMode,
            language,
            healthScore: result.healthScore || 0,
            hydrationScore: result.hydrationScore || 0,
            sunlightScore: result.sunlightScore || 0,
            createdAt: serverTimestamp(),
          });
          console.log('Scan saved to history.');
          
          // Increment scan count and award points
          await updateUserStats(auth.currentUser.uid, 1, 10);
          console.log('User stats updated.');
        } catch (err) {
          console.error('Failed to save scan to history (non-fatal):', err);
          // Don't use handleFirestoreError here as it throws and we want to show the result anyway
        }
      }

      setTimeout(() => {
        onResult(result, resizedImage);
        setIsAnalyzing(false);
      }, 500);
    } catch (error) {
      console.error('Analysis failed with error:', error);
      setIsAnalyzing(false);
      alert(language === 'bn' ? 'বিশ্লেষণ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।' : 'Failed to analyze image. Please try again.');
    } finally {
      clearInterval(interval);
    }
  };

  const statusMessages = language === 'bn' ? [
    "ভিজ্যুয়াল প্যাটার্ন স্ক্যান করা হচ্ছে...",
    "পাতার রঙ পরীক্ষা করা হচ্ছে...",
    "গাছের ধরন শনাক্ত করা হচ্ছে...",
    "রোগের লক্ষণ খোঁজা হচ্ছে...",
    "বিশেষজ্ঞ তথ্য সংগ্রহ করা হচ্ছে...",
    "বিশ্লেষণ চূড়ান্ত করা হচ্ছে..."
  ] : [
    "Scanning visual patterns...",
    "Checking leaf color...",
    "Identifying plant species...",
    "Detecting disease patterns...",
    "Retrieving expert care data...",
    "Finalizing analysis..."
  ];

  const currentStatusIndex = Math.min(Math.floor((progress / 100) * statusMessages.length), statusMessages.length - 1);

  return (
    <div className="min-h-screen bg-[#F0FFF0]">
      {/* Hero Scan Section */}
      <section className="pt-24 pb-12 px-4">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl border border-white/50">
          {/* Cinematic Background Image */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=2000" 
              alt="Cinematic Plant" 
              className="w-full h-full object-cover opacity-30"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#E8F5E9]/60 to-[#C8E6C9]/60 backdrop-blur-[2px]" />
          </div>

          {/* Floating Leaves Background */}
          <motion.div 
            animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute top-10 right-10 text-4xl opacity-20 pointer-events-none z-10"
          >
            🌿
          </motion.div>
          <motion.div 
            animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, delay: 1 }}
            className="absolute bottom-10 left-10 text-4xl opacity-20 pointer-events-none z-10"
          >
            🍃
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-left"
          >
            <div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-[#1B5E20] tracking-tighter mb-6 uppercase leading-none">
                Scan Your Plant. <br />
                <span className="text-green-600 italic">Save It Instantly 🌿</span>
              </h1>
              <p className="max-w-xl text-lg md:text-xl text-[#4F4F4F] mb-12 font-medium leading-relaxed">
                Upload a photo or use live camera. AI detects plant type, disease, and suggests treatment in seconds.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative px-8 py-4 bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-green-200 hover:-translate-y-1 flex items-center gap-3 overflow-hidden"
                >
                  <Camera className="w-6 h-6" />
                  Scan My Plant Now
                </button>
                
                <div className="flex items-center gap-4">
                  {/* Language Toggle */}
                  <button 
                    onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
                    className="flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-white/50 text-xs font-bold text-[#1B5E20] uppercase tracking-wider hover:bg-white/80 transition-all"
                  >
                    <Languages className="w-4 h-4" />
                    {language === 'en' ? 'English' : 'বাংলা'}
                  </button>

                  {/* BD Mode Toggle */}
                  <button 
                    onClick={() => setIsBangladeshMode(!isBangladeshMode)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-xs font-bold uppercase tracking-wider ${isBangladeshMode ? 'bg-green-600 text-white border-green-700' : 'bg-white/50 text-[#1B5E20] border-white/50'}`}
                  >
                    <Globe className="w-4 h-4" />
                    {language === 'bn' ? 'বিডি মোড' : 'BD Mode'}
                  </button>

                  {/* High Accuracy Toggle */}
                  <button 
                    onClick={() => setIsHighAccuracy(!isHighAccuracy)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-xs font-bold uppercase tracking-wider ${isHighAccuracy ? 'bg-purple-600 text-white border-purple-700 shadow-lg shadow-purple-200' : 'bg-white/50 text-[#1B5E20] border-white/50'}`}
                  >
                    <Zap className="w-4 h-4" />
                    {language === 'bn' ? 'উচ্চ নির্ভুলতা' : 'High Accuracy'}
                  </button>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block relative"
            >
              <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white/30 rotate-3 hover:rotate-0 transition-transform duration-500">
                <img 
                  src="https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&q=80&w=1000" 
                  alt="Cinematic Plant" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-400 rounded-full blur-3xl opacity-30 animate-pulse" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-green-400 rounded-full blur-3xl opacity-30 animate-pulse" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Upload Box Section */}
      <section className="pb-24 px-4">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {!isAnalyzing ? (
              <motion.div
                key="upload-box"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-[#C8E6C9] overflow-hidden"
              >
                {!image ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setImage(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="group cursor-pointer aspect-video rounded-3xl border-4 border-dashed border-gray-100 hover:border-[#4CAF50] hover:bg-[#F0FFF0]/50 transition-all flex flex-col items-center justify-center gap-6"
                  >
                    <div className="w-20 h-20 bg-gray-50 group-hover:bg-green-100 rounded-full flex items-center justify-center transition-all group-hover:scale-110 shadow-inner">
                      <Sparkles className="w-10 h-10 text-gray-300 group-hover:text-[#4CAF50]" />
                    </div>
                    <div className="text-center px-4">
                      <p className="text-xl font-bold text-[#1B5E20] mb-2">
                        {language === 'bn' ? 'আপনার গাছের ছবি এখানে ড্র্যাগ করুন' : 'Drag & drop your plant image here'}
                      </p>
                      <p className="text-gray-400 font-medium">
                        {language === 'bn' ? 'অথবা আপলোড করতে ক্লিক করুন' : 'OR click to upload'}
                      </p>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative aspect-video rounded-3xl overflow-hidden group shadow-2xl">
                      <img src={image} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button 
                          onClick={() => setImage(null)}
                          className="p-4 bg-white rounded-full text-red-600 hover:bg-red-50 transition-all hover:scale-110 shadow-xl"
                        >
                          <X className="w-8 h-8" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-4 bg-[#F1F8E9]/50 p-6 rounded-3xl border border-[#C8E6C9] mb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-[#4CAF50] rounded-lg flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-white" />
                        </div>
                        <label className="text-sm font-black text-[#1B5E20] uppercase tracking-widest">
                          {language === 'bn' ? 'আপনার প্রশ্ন (বাংলা বা ইংরেজি)' : 'Ask a Question (Bangla or English)'}
                        </label>
                      </div>
                      <textarea
                        value={userQuery}
                        onChange={(e) => setUserQuery(e.target.value)}
                        placeholder={language === 'bn' ? 'যেমন: এই গাছটির পাতায় কেন কালো দাগ হচ্ছে? প্রতিকার কী?' : 'e.g., Why are there black spots on the leaves? What is the cure?'}
                        className="w-full px-6 py-4 bg-white border border-[#C8E6C9] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50] transition-all font-medium text-[#1B5E20] placeholder-[#81C784] resize-none h-32 shadow-inner"
                      />
                      <div className="flex items-center gap-2 text-[10px] font-bold text-[#4CAF50] uppercase tracking-widest">
                        <Sparkles className="w-3 h-3" />
                        AI will analyze both your image and your question
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={handleAnalyze}
                        className="flex-1 py-5 bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-green-200 flex items-center justify-center gap-3 text-lg relative overflow-hidden group"
                      >
                        {isHighAccuracy && (
                          <div className="absolute top-0 right-0 bg-yellow-400 text-black text-[10px] px-3 py-1 font-black uppercase tracking-widest rounded-bl-xl shadow-sm z-10">
                            Pro
                          </div>
                        )}
                        <Zap className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        {language === 'bn' ? 'শনাক্ত ও বিশ্লেষণ করুন' : 'Identify & Analyze'}
                      </button>
                      <button 
                        onClick={() => setImage(null)}
                        className="px-8 py-5 bg-white border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all"
                      >
                        {language === 'bn' ? 'বাতিল' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Future: Live Scan Button */}
                {!image && (
                  <div className="mt-8 pt-8 border-t border-gray-50 flex justify-center">
                    <button className="flex items-center gap-3 text-[#4CAF50] font-bold hover:text-[#388E3C] transition-colors group">
                      <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Camera className="w-5 h-5" />
                      </div>
                      Scan live with your camera (Coming Soon)
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="loading-box"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-[2.5rem] p-12 shadow-2xl border border-[#C8E6C9] text-center"
              >
                <div className="relative w-32 h-32 mx-auto mb-8">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-4 border-dashed border-[#4CAF50] rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Leaf className="w-12 h-12 text-[#4CAF50]" />
                    </motion.div>
                  </div>
                </div>

                <h2 className="text-3xl font-extrabold text-[#1B5E20] mb-4 uppercase tracking-tighter">
                  {language === 'bn' ? 'আপনার গাছ বিশ্লেষণ করা হচ্ছে... 🌱' : 'Analyzing your plant... 🌱'}
                </h2>
                
                <div className="max-w-md mx-auto mb-8">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Progress</span>
                    <span className="text-xs font-bold text-[#4CAF50]">{progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-gradient-to-r from-[#4CAF50] to-[#388E3C]"
                    />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentStatusIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-lg text-[#4CAF50] font-bold italic"
                  >
                    {statusMessages[currentStatusIndex]}
                  </motion.p>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Cinematic Inspiration Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-4xl md:text-5xl font-black text-[#1B5E20] uppercase tracking-tighter leading-none">
                Visualize Your <br />
                Plant's Potential.
              </h2>
              <p className="text-xl text-gray-600 font-medium">
                Our AI doesn't just diagnose; it envisions. See how your plant can thrive with the right care and attention.
              </p>
              <div className="flex gap-4">
                <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex-1">
                  <div className="text-2xl font-bold text-[#4CAF50] mb-1">99%</div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Accuracy</div>
                </div>
                <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex-1">
                  <div className="text-2xl font-bold text-[#4CAF50] mb-1">24/7</div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Support</div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl group"
            >
              <img 
                src="https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&q=80&w=1000" 
                alt="Cinematic Plant" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                <p className="text-white font-bold italic text-lg">
                  "Nature always wears the colors of the spirit." — Ralph Waldo Emerson
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Leaf({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8a7 7 0 0 1-10 10Z" />
      <path d="M11 20c-1.2-.5-2-1.3-2-2" />
      <path d="M9 10c0-2 .5-4 2-6" />
      <path d="M11 20v-5" />
      <path d="M11 15c-1-1-2-2-2-4" />
      <path d="M11 15c1-1 2-2 2-4" />
    </svg>
  );
}
