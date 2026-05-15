import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const MiniCalendar = ({ exams }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Helper to determine test status for a given day
  const getTestStatus = (day) => {
    if (!exams || exams.length === 0) return null;
    
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hasExam = exams.some(exam => {
      const examDate = new Date(exam.examDate);
      return examDate.getDate() === checkDate.getDate() &&
             examDate.getMonth() === checkDate.getMonth() &&
             examDate.getFullYear() === checkDate.getFullYear();
    });

    if (!hasExam) return null;

    if (checkDate < today) return 'past';
    if (checkDate > today) return 'upcoming';
    return 'active';
  };

  return (
    <div className="glass p-6 rounded-[24px] space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold">Schedule</h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <ChevronLeft size={18} />
          </button>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="text-center font-semibold text-gray-700 dark:text-gray-300 mb-4">
        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-xs font-bold text-gray-400">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {Array.from({ length: firstDayOfMonth }).map((_, index) => (
          <div key={`empty-${index}`} className="h-8"></div>
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const status = getTestStatus(day);
          const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();

          let dotClass = '';
          if (status === 'past') dotClass = 'bg-purple-500';
          if (status === 'active') dotClass = 'bg-green-500';
          if (status === 'upcoming') dotClass = 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]';

          return (
            <motion.div 
              whileHover={{ scale: 1.1 }}
              key={day} 
              className={`h-8 w-8 mx-auto flex items-center justify-center rounded-full text-sm relative transition cursor-pointer ${isToday ? 'bg-gray-200 dark:bg-gray-700 font-bold' : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}
            >
              {day}
              {status && (
                <div className={`absolute bottom-0 w-1.5 h-1.5 rounded-full ${dotClass}`}></div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-gray-100 dark:border-gray-800 mt-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div> Upcoming Test
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 rounded-full bg-green-500"></div> Active Today
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 rounded-full bg-purple-500"></div> Past Test
        </div>
      </div>
    </div>
  );
};

export default MiniCalendar;
