import { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar as CalendarIcon, Droplets, Leaf, Scissors, Zap, CheckCircle2, Plus, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

const TASKS = [
  {
    id: 1,
    plant: "Snake Plant",
    task: "Watering",
    time: "09:00 AM",
    date: "Today",
    type: "water",
    status: "pending"
  },
  {
    id: 2,
    plant: "Monstera Deliciosa",
    task: "Fertilizing",
    time: "11:30 AM",
    date: "Today",
    type: "fertilize",
    status: "completed"
  },
  {
    id: 3,
    plant: "Aloe Vera",
    task: "Pruning",
    time: "02:00 PM",
    date: "Tomorrow",
    type: "prune",
    status: "pending"
  },
  {
    id: 4,
    plant: "Peace Lily",
    task: "Watering",
    time: "08:00 AM",
    date: "Tomorrow",
    type: "water",
    status: "pending"
  }
];

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CareCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const getIcon = (type: string) => {
    switch (type) {
      case 'water': return <Droplets className="w-5 h-5 text-blue-500" />;
      case 'fertilize': return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'prune': return <Scissors className="w-5 h-5 text-purple-500" />;
      default: return <Leaf className="w-5 h-5 text-[#4CAF50]" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F0FFF0] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-[#1B5E20] tracking-tighter mb-2 uppercase leading-none">
              Care <span className="text-green-600 italic">Calendar 📅</span>
            </h1>
            <p className="text-xl text-[#4F4F4F] font-medium">
              Never miss a watering or fertilizing session again.
            </p>
          </div>
          <button className="px-8 py-4 bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-green-200 flex items-center gap-3 uppercase tracking-widest text-xs">
            <Plus className="w-5 h-5" />
            Add New Task
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Calendar View */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-8 bg-white rounded-[2.5rem] border border-[#C8E6C9] shadow-xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-extrabold text-[#1B5E20] uppercase tracking-tighter">March 2026</h3>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-green-50 rounded-xl transition-colors"><ChevronLeft className="w-5 h-5 text-[#1B5E20]" /></button>
                  <button className="p-2 hover:bg-green-50 rounded-xl transition-colors"><ChevronRight className="w-5 h-5 text-[#1B5E20]" /></button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-2 mb-4">
                {WEEK_DAYS.map(day => (
                  <div key={day} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{day}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 31 }).map((_, i) => (
                  <button 
                    key={i}
                    className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                      i + 1 === 23 
                        ? 'bg-[#4CAF50] text-white shadow-lg shadow-green-100' 
                        : 'hover:bg-green-50 text-[#1B5E20]'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-8 bg-[#1B5E20] rounded-[2.5rem] shadow-xl text-white">
              <h3 className="text-xl font-extrabold uppercase tracking-tighter mb-4">Care Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold opacity-70">Tasks Completed</span>
                  <span className="text-2xl font-black">12/15</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '80%' }}
                    className="h-full bg-[#4CAF50]"
                  />
                </div>
                <p className="text-xs font-medium opacity-70">Great job! Your plants are thriving this month.</p>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md border border-[#C8E6C9]">
                <Clock className="w-6 h-6 text-[#4CAF50]" />
              </div>
              <h2 className="text-2xl font-extrabold text-[#1B5E20] uppercase tracking-tighter">Upcoming Tasks</h2>
            </div>

            <div className="space-y-4">
              {TASKS.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-6 rounded-[2rem] border transition-all flex items-center gap-6 shadow-lg ${
                    task.status === 'completed' 
                      ? 'bg-gray-50 border-gray-200 opacity-60' 
                      : 'bg-white border-[#C8E6C9] hover:shadow-xl'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                    task.status === 'completed' ? 'bg-gray-200' : 'bg-[#F0FFF0]'
                  }`}>
                    {getIcon(task.type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-[#4CAF50] uppercase tracking-widest">{task.date}</span>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">•</span>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{task.time}</span>
                    </div>
                    <h3 className="text-xl font-extrabold text-[#1B5E20] tracking-tight">{task.task}</h3>
                    <p className="text-sm font-bold text-gray-400">{task.plant}</p>
                  </div>

                  <button className={`p-4 rounded-2xl transition-all ${
                    task.status === 'completed' 
                      ? 'bg-green-100 text-[#4CAF50]' 
                      : 'bg-[#F0FFF0] text-[#1B5E20] hover:bg-[#4CAF50] hover:text-white border border-[#C8E6C9]'
                  }`}>
                    <CheckCircle2 className="w-6 h-6" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
