import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, Info, ArrowLeft, MessageSquare, ShoppingCart, User, Dog, Box, HelpCircle, CheckCircle2, AlertTriangle, Calendar, PlusCircle, RefreshCw, Heart, Sparkles, X, Loader2, TrendingUp, Share2, Dna, Droplets, Sun, Activity, Target, ExternalLink, Download, ShieldCheck, Zap, ChevronRight, Layers } from 'lucide-react';
import { ScanResult, deepAnalyze } from '../lib/gemini';
import { db, auth, updateUserStats, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Markdown from 'react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ResultProps {
  result: ScanResult;
  imageUrl: string;
  onBack: () => void;
  onChat: () => void;
}

const CircularProgress = ({ value, label, icon: Icon, color }: { value: number, label: string, icon: any, color: string }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-100"
          />
          <motion.circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={color}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      </div>
      <div className="text-center">
        <span className="block text-xl font-black text-[#1B5E20]">{value}%</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-[#4CAF50]">{label}</span>
      </div>
    </div>
  );
};

export default function Result({ result, imageUrl, onBack, onChat }: ResultProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isDeepAnalyzing, setIsDeepAnalyzing] = useState(false);
  const [deepAnalysisResult, setDeepAnalysisResult] = useState<string | null>(null);
  const [showDeepAnalysis, setShowDeepAnalysis] = useState(false);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [growthImage, setGrowthImage] = useState<string | null>(null);
  const [showGrowthModal, setShowGrowthModal] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showMultiStep, setShowMultiStep] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState<number | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const handleDownloadReport = async () => {
    if (isGeneratingPDF || !reportRef.current) return;
    
    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#F0FFF0'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`LeafyAI_Report_${result.name.replace(/\s+/g, '_')}.pdf`);
      
      if (auth.currentUser) {
        await updateUserStats(auth.currentUser.uid, 0, 50);
      }
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleVisualizeGrowth = async () => {
    if (isVisualizing) return;
    
    setIsVisualizing(true);
    try {
      const { visualizeGrowth } = await import('../lib/gemini');
      const img = await visualizeGrowth(result.name, result.details);
      setGrowthImage(img);
      setShowGrowthModal(true);
      
      if (auth.currentUser) {
        await updateUserStats(auth.currentUser.uid, 0, 75);
      }
    } catch (err) {
      console.error('Growth visualization failed:', err);
      alert('Growth visualization failed. Please try again.');
    } finally {
      setIsVisualizing(false);
    }
  };

  const handleDeepAnalysis = async () => {
    if (isDeepAnalyzing) return;
    
    setIsDeepAnalyzing(true);
    try {
      const analysis = await deepAnalyze(imageUrl, result.name);
      setDeepAnalysisResult(analysis);
      setShowDeepAnalysis(true);
      
      // Award extra points for deep analysis
      if (auth.currentUser) {
        await updateUserStats(auth.currentUser.uid, 0, 100);
      }
    } catch (err) {
      console.error('Deep analysis failed:', err);
      alert('Deep analysis failed. Please try again.');
    } finally {
      setIsDeepAnalyzing(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Leafy AI - ${result.name} Analysis`,
          text: `Check out my ${result.name} analysis on Leafy AI!`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleSaveToProfile = async () => {
    if (!auth.currentUser || isSaved || isSaving) return;
    
    setIsSaving(true);
    try {
      const path = `users/${auth.currentUser.uid}/saved_plants`;
      await addDoc(collection(db, path), {
        userId: auth.currentUser.uid,
        name: result.name,
        imageUrl,
        type: result.type,
        details: result.details,
        createdAt: serverTimestamp(),
      });
      
      // Award points and increment saved count
      await updateUserStats(auth.currentUser.uid, 0, 50, 1);
      setIsSaved(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'saved_plants');
    } finally {
      setIsSaving(false);
    }
  };

  const getIcon = () => {
    switch (result.type) {
      case 'plant': return <Leaf className="w-8 h-8 text-[#4CAF50]" />;
      case 'animal': return <Dog className="w-8 h-8 text-orange-600" />;
      case 'human': return <User className="w-8 h-8 text-blue-600" />;
      case 'object': return <Box className="w-8 h-8 text-purple-600" />;
      default: return <HelpCircle className="w-8 h-8 text-gray-600" />;
    }
  };

  const getBgColor = () => {
    switch (result.type) {
      case 'plant': return 'bg-[#F0FFF0]';
      case 'animal': return 'bg-orange-50';
      case 'human': return 'bg-blue-50';
      case 'object': return 'bg-purple-50';
      default: return 'bg-gray-50';
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#F0FFF0] py-12 px-4" ref={reportRef}>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 no-print">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-[#1B5E20] hover:text-[#4CAF50] transition-colors font-bold uppercase tracking-widest text-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Scan
          </button>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleDownloadReport}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-[#C8E6C9] text-[#1B5E20] rounded-2xl hover:bg-green-50 transition-all font-black uppercase tracking-widest text-xs shadow-sm"
            >
              {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download Report
            </button>
            <button 
              onClick={handleShare}
              className="p-3 bg-white border border-[#C8E6C9] text-[#1B5E20] rounded-2xl hover:bg-green-50 transition-all shadow-sm"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* Left Column: Image & Main Info */}
          <div className="lg:col-span-5 space-y-8">
            <motion.div variants={item} className="relative group">
              <div ref={imageRef} className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white relative">
                <img src={imageUrl} alt="Scanned subject" className="w-full h-full object-cover" />
                
                {/* Problem Highlights Overlay */}
                {result.problemHighlights && result.problemHighlights.map((highlight, idx) => (
                  <div 
                    key={idx}
                    className="absolute"
                    style={{ left: `${highlight.x}%`, top: `${highlight.y}%` }}
                  >
                    <button
                      onMouseEnter={() => setActiveHighlight(idx)}
                      onMouseLeave={() => setActiveHighlight(null)}
                      className="w-8 h-8 -translate-x-1/2 -translate-y-1/2 bg-red-500/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white shadow-lg hover:scale-125 transition-transform animate-pulse"
                    >
                      <Target className="w-5 h-5" />
                    </button>
                    
                    <AnimatePresence>
                      {activeHighlight === idx && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.9 }}
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 p-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-red-100 z-50"
                        >
                          <p className="text-xs font-black text-red-600 uppercase tracking-widest mb-1">{highlight.label}</p>
                          <p className="text-[10px] text-[#4F4F4F] font-bold leading-tight">{highlight.description}</p>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white/95" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* Share Button Overlay */}
              <button 
                onClick={handleShare}
                className="absolute top-6 right-6 p-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl text-[#1B5E20] hover:scale-110 transition-all active:scale-95 z-20"
              >
                <Share2 className="w-6 h-6" />
              </button>
            </motion.div>
            
            <motion.div variants={item} className="p-10 bg-white rounded-[2.5rem] border border-[#C8E6C9] shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner ${getBgColor()}`}>
                    {getIcon()}
                  </div>
                  <div>
                    <h2 className="text-3xl font-extrabold text-[#1B5E20] tracking-tighter leading-none mb-2 uppercase">
                      {result.name}
                    </h2>
                    {result.banglaName && (
                      <p className="text-xl font-bold text-[#4CAF50] mb-2">{result.banglaName}</p>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner w-32">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${result.confidence * 100}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="h-full bg-gradient-to-r from-[#4CAF50] to-[#388E3C]"
                        />
                      </div>
                      <span className="text-xs font-black text-[#4CAF50] uppercase tracking-widest">
                        {Math.round(result.confidence * 100)}% Match
                      </span>
                    </div>
                  </div>
                </div>
                {result.type === 'plant' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={handleVisualizeGrowth}
                      disabled={isVisualizing}
                      className="p-3 bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-2xl shadow-lg hover:shadow-blue-200 transition-all hover:-translate-y-1 group relative"
                    >
                      {isVisualizing ? <Loader2 className="w-6 h-6 animate-spin" /> : <TrendingUp className="w-6 h-6" />}
                      <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                        Visualize Growth
                      </span>
                    </button>
                    <button 
                      onClick={handleDeepAnalysis}
                      disabled={isDeepAnalyzing}
                      className="p-3 bg-gradient-to-br from-[#1B5E20] to-[#4CAF50] text-white rounded-2xl shadow-lg hover:shadow-green-200 transition-all hover:-translate-y-1 group relative"
                    >
                      {isDeepAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                      <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#1B5E20] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                        Deep Pro Analysis
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* AI Confidence Explanation */}
              {result.confidenceExplanation && (
                <div className="mb-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <p className="text-sm text-blue-800 font-bold leading-tight">
                    <span className="uppercase tracking-widest text-[10px] block mb-1">AI Confidence Logic</span>
                    {result.confidenceExplanation}
                  </p>
                </div>
              )}

              <p className="text-[#4F4F4F] leading-relaxed font-medium text-lg">
                {result.description}
              </p>
            </motion.div>

            {/* Smart Plant Score */}
            {result.type === 'plant' && result.healthScore !== undefined && (
              <motion.div variants={item} className="p-10 bg-white rounded-[2.5rem] border border-[#C8E6C9] shadow-xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-[#1B5E20] uppercase tracking-tighter">Smart Health Score</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <CircularProgress value={result.healthScore} label="Health" icon={Heart} color="text-red-500" />
                  <CircularProgress value={result.hydrationScore || 0} label="Hydration" icon={Droplets} color="text-blue-500" />
                  <CircularProgress value={result.sunlightScore || 0} label="Sunlight" icon={Sun} color="text-yellow-500" />
                </div>
              </motion.div>
            )}

            {/* DNA Insight */}
            {result.type === 'plant' && result.dnaInsight && (
              <motion.div variants={item} className="p-10 bg-white rounded-[2.5rem] border border-[#C8E6C9] shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
                <div className="flex items-center gap-4 mb-8 relative z-10">
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                    <Dna className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-[#1B5E20] uppercase tracking-tighter">DNA Insight</h3>
                </div>
                
                <div className="space-y-6 relative z-10">
                  <div className="flex items-center justify-between p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                    <span className="text-xs font-black text-purple-600 uppercase tracking-widest">Growth Type</span>
                    <span className="font-bold text-[#1B5E20]">{result.dnaInsight.growthType}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                    <span className="text-xs font-black text-purple-600 uppercase tracking-widest">Lifespan</span>
                    <span className="font-bold text-[#1B5E20]">{result.dnaInsight.lifespan}</span>
                  </div>
                  <div className="flex flex-col gap-2 p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                    <span className="text-xs font-black text-purple-600 uppercase tracking-widest">Ideal Environment</span>
                    <span className="font-bold text-[#1B5E20] leading-tight">{result.dnaInsight.idealEnvironment}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Growth Visualization Modal */}
            <AnimatePresence>
              {showGrowthModal && growthImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl border border-[#C8E6C9] relative"
                  >
                    <button 
                      onClick={() => setShowGrowthModal(false)}
                      className="absolute top-8 right-8 p-3 hover:bg-gray-100 rounded-full transition-all"
                    >
                      <X className="w-6 h-6 text-gray-400" />
                    </button>

                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <TrendingUp className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-[#1B5E20] uppercase tracking-tighter">Growth Visualization</h3>
                        <p className="text-xs font-black text-[#4CAF50] uppercase tracking-widest">Powered by Gemini 2.5 Flash Image</p>
                      </div>
                    </div>

                    <div className="aspect-square rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white mb-8">
                      <img src={growthImage} alt="Future Growth" className="w-full h-full object-cover" />
                    </div>

                    <p className="text-[#4F4F4F] font-bold text-center leading-relaxed">
                      This is a visualization of how your <span className="text-[#4CAF50]">{result.name}</span> could look in 6 months with consistent care and proper treatment!
                    </p>

                    <div className="mt-10 pt-8 border-t border-gray-100 flex justify-end">
                      <button 
                        onClick={() => setShowGrowthModal(false)}
                        className="px-8 py-4 bg-[#1B5E20] text-white font-black uppercase tracking-widest rounded-2xl hover:bg-[#4CAF50] transition-all shadow-xl"
                      >
                        Amazing!
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Deep Analysis Modal */}
            <AnimatePresence>
              {showDeepAnalysis && deepAnalysisResult && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-[3rem] p-10 max-w-3xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-[#C8E6C9] relative"
                  >
                    <button 
                      onClick={() => setShowDeepAnalysis(false)}
                      className="absolute top-8 right-8 p-3 hover:bg-gray-100 rounded-full transition-all"
                    >
                      <X className="w-6 h-6 text-gray-400" />
                    </button>

                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#1B5E20] to-[#4CAF50] rounded-2xl flex items-center justify-center shadow-lg">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-[#1B5E20] uppercase tracking-tighter">Deep Pro Analysis</h3>
                        <p className="text-xs font-black text-[#4CAF50] uppercase tracking-widest">Powered by Gemini 3.1 Pro</p>
                      </div>
                    </div>

                    <div className="prose prose-green max-w-none">
                      <div className="markdown-body text-[#4F4F4F] font-medium leading-relaxed">
                        <Markdown>{deepAnalysisResult}</Markdown>
                      </div>
                    </div>

                    <div className="mt-10 pt-8 border-t border-gray-100 flex justify-end">
                      <button 
                        onClick={() => setShowDeepAnalysis(false)}
                        className="px-8 py-4 bg-[#1B5E20] text-white font-black uppercase tracking-widest rounded-2xl hover:bg-[#4CAF50] transition-all shadow-xl"
                      >
                        Close Analysis
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Analysis & Solutions */}
          <div className="lg:col-span-7 space-y-8">
            {/* Problem Detection Card (Why It Happened) */}
            <motion.div variants={item} className="p-10 bg-white rounded-[2.5rem] border border-[#C8E6C9] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
              
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-extrabold text-[#1B5E20] uppercase tracking-tighter">Problem Detection</h3>
              </div>
              
              <div className="space-y-4 relative z-10">
                <div className="p-6 bg-yellow-50/50 rounded-3xl border border-yellow-100">
                  <p className="text-lg text-yellow-800 font-bold mb-2">
                    {result.details.split('.')[0]}.
                  </p>
                  <p className="text-yellow-700 font-medium leading-relaxed">
                    {result.details.split('.').slice(1).join('.')}
                  </p>
                </div>

                {result.rootCause && (
                  <div className="p-6 bg-orange-50/50 rounded-3xl border border-orange-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-orange-600" />
                      <h4 className="text-xs font-black text-orange-600 uppercase tracking-widest">Why It Happened</h4>
                    </div>
                    <p className="text-orange-800 font-bold leading-relaxed">
                      {result.rootCause}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* AI Prediction Card */}
            {result.predictedIssues && result.predictedIssues.length > 0 && (
              <motion.div variants={item} className="p-10 bg-white rounded-[2.5rem] border border-[#C8E6C9] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
                <div className="flex items-center gap-4 mb-8 relative z-10">
                  <div className="w-12 h-12 bg-cyan-100 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-cyan-600" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-[#1B5E20] uppercase tracking-tighter">AI Prediction Engine</h3>
                </div>

                <div className="space-y-4 relative z-10">
                  {result.predictedIssues.map((prediction, i) => (
                    <div key={i} className="p-6 bg-cyan-50/30 rounded-3xl border border-cyan-100">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-black text-cyan-900">{prediction.issue}</h4>
                        <span className="text-[10px] font-black bg-cyan-600 text-white px-2 py-1 rounded-full uppercase tracking-widest">{prediction.timeframe}</span>
                      </div>
                      <p className="text-sm text-cyan-800 font-medium">{prediction.prevention}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Solution Card (Multi-step Guidance) */}
            <motion.div variants={item} className="p-10 bg-white rounded-[2.5rem] border border-[#C8E6C9] shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-[#4CAF50]" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-[#1B5E20] uppercase tracking-tighter">Step-by-step Solution</h3>
                </div>
                {result.multiStepGuide && (
                  <button 
                    onClick={() => setShowMultiStep(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1B5E20] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#4CAF50] transition-all shadow-lg"
                  >
                    <Layers className="w-4 h-4" />
                    Fix My Plant
                  </button>
                )}
              </div>
              
              <div className="space-y-6">
                {result.recommendations.map((tip, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + (i * 0.1) }}
                    className="flex items-start gap-4 group"
                  >
                    <div className="w-8 h-8 bg-[#F0FFF0] rounded-full flex items-center justify-center flex-shrink-0 font-black text-[#4CAF50] text-sm shadow-sm group-hover:scale-110 transition-transform">
                      {i + 1}
                    </div>
                    <p className="text-[#4F4F4F] font-bold leading-relaxed pt-1">{tip}</p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-12 flex flex-col sm:flex-row gap-4">
                <button className="flex-1 py-4 bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-green-200 flex items-center justify-center gap-3">
                  <ShoppingCart className="w-5 h-5" />
                  Buy Recommended Fertilizer
                </button>
                <button className="flex-1 py-4 bg-[#F0FFF0] border border-[#C8E6C9] text-[#1B5E20] font-bold rounded-2xl hover:bg-white transition-all flex items-center justify-center gap-3">
                  <Calendar className="w-5 h-5" />
                  Add to Care Schedule
                </button>
              </div>
            </motion.div>

            {/* Multi-step Guidance Modal */}
            <AnimatePresence>
              {showMultiStep && result.multiStepGuide && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl border border-[#C8E6C9] relative"
                  >
                    <button 
                      onClick={() => setShowMultiStep(false)}
                      className="absolute top-8 right-8 p-3 hover:bg-gray-100 rounded-full transition-all"
                    >
                      <X className="w-6 h-6 text-gray-400" />
                    </button>

                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-14 h-14 bg-[#1B5E20] rounded-2xl flex items-center justify-center shadow-lg">
                        <Layers className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-[#1B5E20] uppercase tracking-tighter">Fix My Plant</h3>
                        <p className="text-xs font-black text-[#4CAF50] uppercase tracking-widest">Guided Recovery Journey</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {result.multiStepGuide.map((step, i) => (
                        <div key={i} className="flex gap-6">
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 bg-[#1B5E20] text-white rounded-full flex items-center justify-center font-black shadow-lg z-10">
                              {step.step}
                            </div>
                            {i < result.multiStepGuide!.length - 1 && (
                              <div className="w-1 h-full bg-gray-100 -mt-2" />
                            )}
                          </div>
                          <div className="pb-8">
                            <h4 className="text-lg font-black text-[#1B5E20] mb-1">{step.title}</h4>
                            <p className="text-[#4F4F4F] font-medium leading-relaxed">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-8 border-t border-gray-100 flex justify-between items-center">
                      <p className="text-xs font-bold text-gray-400 italic">Follow these steps carefully for best results.</p>
                      <button 
                        onClick={() => setShowMultiStep(false)}
                        className="px-8 py-4 bg-[#1B5E20] text-white font-black uppercase tracking-widest rounded-2xl hover:bg-[#4CAF50] transition-all shadow-xl"
                      >
                        Got it!
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Care Kit (Fix My Plant) */}
            {result.type === 'plant' && result.careKit && (
              <motion.div variants={item} className="p-10 bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-extrabold uppercase tracking-tighter">AI-Generated Care Kit</h3>
                  </div>
                  <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest">Fix My Plant</span>
                </div>

                <div className="space-y-4 relative z-10">
                  {result.careKit.items.map((product, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + (i * 0.1) }}
                      className="p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 flex items-center justify-between group hover:bg-white/20 transition-all cursor-pointer"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-black text-lg">{product.name}</h4>
                          <span className="text-xs font-black bg-white text-[#1B5E20] px-2 py-0.5 rounded-md">{product.price}</span>
                        </div>
                        <p className="text-sm text-white/70 font-medium">{product.reason}</p>
                      </div>
                      <div className="w-10 h-10 bg-white text-[#1B5E20] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <PlusCircle className="w-6 h-6" />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <button className="w-full mt-8 py-5 bg-white text-[#1B5E20] font-black uppercase tracking-widest rounded-2xl hover:bg-green-50 transition-all shadow-2xl flex items-center justify-center gap-3 relative z-10">
                  <ShoppingCart className="w-6 h-6" />
                  Order Full Care Kit
                </button>
              </motion.div>
            )}

            {/* Quick Actions Panel */}
            <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button 
                onClick={onBack}
                className="p-5 bg-white hover:bg-gray-50 text-[#1B5E20] font-bold rounded-2xl transition-all border border-[#C8E6C9] flex items-center justify-center gap-3 shadow-md hover:-translate-y-1"
              >
                <RefreshCw className="w-5 h-5" />
                Scan Another
              </button>
              <button 
                onClick={onChat}
                className="p-5 bg-white hover:bg-gray-50 text-[#1B5E20] font-bold rounded-2xl transition-all border border-[#C8E6C9] flex items-center justify-center gap-3 shadow-md hover:-translate-y-1"
              >
                <MessageSquare className="w-5 h-5 text-[#4CAF50]" />
                Chat with AI
              </button>
              <button 
                onClick={handleSaveToProfile}
                disabled={isSaved || isSaving}
                className={`p-5 font-bold rounded-2xl transition-all border flex items-center justify-center gap-3 shadow-md hover:-translate-y-1 ${isSaved ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white hover:bg-gray-50 text-[#1B5E20] border-[#C8E6C9]'}`}
              >
                {isSaved ? <Heart className="w-5 h-5 fill-current" /> : <PlusCircle className="w-5 h-5 text-blue-500" />}
                {isSaving ? 'Saving...' : isSaved ? 'Saved to Profile' : 'Save to Profile'}
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
