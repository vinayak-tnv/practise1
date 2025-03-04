
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, ChevronLeft, ChevronRight, User, Quote, CalendarDays } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import TimeSlot from '@/components/dashboard/TimeSlot';
import TaskCard from '@/components/dashboard/TaskCard';
import DonutChart from '@/components/charts/DonutChart';
import PriorityChart from '@/components/charts/PriorityChart';
import WeatherWidget from '@/components/WeatherWidget';
import LiveClock from '@/components/dashboard/LiveClock';
import SleepAnalysis from '@/components/dashboard/SleepAnalysis';
import { TimeSlot as TimeSlotType, WeatherData } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useTasks } from '@/context/TaskContext';
import { format, addDays, subDays, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isToday, isSameDay } from 'date-fns';

const timeSlots: TimeSlotType[] = [
  { id: '1', time: '09:00' },
  { id: '2', time: '12:30' },
  { id: '3', time: '15:00' },
];

const weatherData: WeatherData = {
  temp: 32,
  location: 'Hyderabad',
  condition: 'sunny',
  forecast: [
    { day: 'Wed', condition: 'sunny', temp: 31 },
    { day: 'Thu', condition: 'cloudy', temp: 33 },
    { day: 'Fri', condition: 'sunny', temp: 35 },
    { day: 'Sat', condition: 'sunny', temp: 34 },
    { day: 'Sun', condition: 'cloudy', temp: 30 }
  ]
};

const motivationalQuotes = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "Success is not final, failure is not fatal: It is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" }
];

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const generateHours = () => {
  const hours = [];
  for (let i = 0; i <= 23; i++) {
    hours.push({
      label: `${i.toString().padStart(2, '0')}:00`,
      value: i,
    });
  }
  return hours;
};

const generateMonthDays = (date: Date) => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const startDay = monthStart.getDay();
  const prevDaysNeeded = startDay;
  const prevDays = [];
  for (let i = prevDaysNeeded - 1; i >= 0; i--) {
    prevDays.push(subDays(monthStart, i + 1));
  }
  
  const lastDay = monthEnd.getDay();
  const nextDaysNeeded = 6 - lastDay;
  const nextDays = [];
  for (let i = 1; i <= nextDaysNeeded; i++) {
    nextDays.push(addDays(monthEnd, i));
  }
  
  return [...prevDays, ...days, ...nextDays];
};

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { tasks, toggleTaskCompletion, deleteTask, getTasksForDate, isWeekend } = useTasks();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('day');
  const hours = generateHours();
  const [quote, setQuote] = useState(motivationalQuotes[0]);
  const monthDays = generateMonthDays(selectedDate);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    setQuote(motivationalQuotes[randomIndex]);
    
    const quoteInterval = setInterval(() => {
      const newRandomIndex = Math.floor(Math.random() * motivationalQuotes.length);
      setQuote(motivationalQuotes[newRandomIndex]);
    }, 60000);
    
    return () => clearInterval(quoteInterval);
  }, []);

  const handleToggleComplete = (taskId: string) => {
    toggleTaskCompletion(taskId);
    
    const taskToUpdate = tasks.find(task => task.id === taskId);
    
    if (taskToUpdate) {
      const newCompleted = !taskToUpdate.completed;
      
      if (newCompleted) {
        toast({
          title: "Task completed",
          description: `You've completed "${taskToUpdate.title}"!`,
        });
      }
    }
  };
  
  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = tasks.find(task => task.id === taskId);
    
    if (taskToDelete) {
      deleteTask(taskId);
      
      toast({
        title: "Task deleted",
        description: `"${taskToDelete.title}" has been removed from your schedule.`,
      });
    }
  };

  const completionStatus = {
    completed: tasks.filter(task => task.completed).length,
    pending: tasks.filter(task => !task.completed).length
  };

  const priorityStatus = {
    high: tasks.filter(task => task.priority === 'high').length,
    medium: tasks.filter(task => task.priority === 'medium').length,
    low: tasks.filter(task => task.priority === 'low').length
  };

  const getTasksByHour = (hour: number) => {
    const tasksForDate = getTasksForDate(selectedDate);
    return tasksForDate.filter(task => {
      const timeString = task.time;
      if (!timeString) return false;
      
      const [hourValue, minutes] = timeString.split(':').map(Number);
      
      return hourValue === hour;
    });
  };

  const getTasksByDayOfWeek = (dayIndex: number) => {
    const currentDate = new Date(selectedDate);
    const currentDayIndex = currentDate.getDay();
    
    const diff = dayIndex - currentDayIndex;
    const targetDate = new Date(currentDate);
    targetDate.setDate(currentDate.getDate() + diff);
    
    return getTasksForDate(targetDate);
  };

  const goToPreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const goToNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const goToPreviousMonth = () => {
    setSelectedDate(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setSelectedDate(prev => addMonths(prev, 1));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const getWeekDates = () => {
    const currentDate = new Date(selectedDate);
    const currentDayIndex = currentDate.getDay();
    
    return daysOfWeek.map((day, index) => {
      const diff = index - currentDayIndex;
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() + diff);
      return {
        day: day.substring(0, 3),
        date: date,
        formattedDate: format(date, 'd'),
        isWeekend: isWeekend(date)
      };
    });
  };

  // Define weekDates before using it
  const weekDates = getWeekDates();

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {user && (
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full" />
                ) : (
                  <User className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-medium">Welcome back, {user.name}!</h2>
                <p className="text-sm text-gray-600">You have {tasks.filter(t => !t.completed).length} pending tasks today</p>
              </div>
            </div>
            
            <div className="hidden md:block">
              <LiveClock />
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="md:hidden mb-6">
        <LiveClock />
      </div>
      
      <Card className="mb-6 bg-gray-50 border-none">
        <CardContent className="p-4 flex items-start">
          <Quote className="h-6 w-6 text-blue-500 mr-4 flex-shrink-0 mt-1" />
          <div>
            <p className="text-lg font-medium italic text-gray-800">{quote.text}</p>
            <p className="text-sm text-gray-600 mt-1">— {quote.author}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-8 bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 text-amber-500 mr-2" />
            <CardTitle className="text-lg font-medium">AI Suggested Times</CardTitle>
          </div>
          <CardDescription>
            Based on your schedule and productivity patterns, these times might work best for your next task.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {timeSlots.map(slot => (
              <TimeSlot key={slot.id} slot={slot} />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            AI suggestions are based on your past scheduling patterns and calendar availability
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-4">
                    <button 
                      className="p-1 rounded-full hover:bg-gray-100"
                      onClick={activeTab === 'month' ? goToPreviousMonth : goToPreviousDay}
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-500" />
                    </button>
                    <h3 className="text-lg font-medium">
                      {activeTab === 'month' 
                        ? format(selectedDate, 'MMMM yyyy')
                        : format(selectedDate, 'MMMM d, yyyy')}
                    </h3>
                    <button 
                      className="p-1 rounded-full hover:bg-gray-100"
                      onClick={activeTab === 'month' ? goToNextMonth : goToNextDay}
                    >
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center">
                  <button 
                    className="text-sm text-gray-500 hover:text-gray-900"
                    onClick={goToToday}
                  >
                    Today
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="day" onValueChange={setActiveTab} className="mb-8">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                </TabsList>
                
                <TabsContent value="day" className="mt-4">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-1">
                      {hours.map((hour) => {
                        const hourTasks = getTasksByHour(hour.value);
                        return (
                          <div key={hour.value} className="grid grid-cols-12 py-2 text-sm group hover:bg-gray-50 rounded-md">
                            <div className="col-span-2 text-right pr-4 text-gray-500">
                              {hour.label}
                            </div>
                            <div className="col-span-10 border-l pl-4 min-h-16">
                              {hourTasks.length > 0 ? (
                                <div className="space-y-2 py-1">
                                  {hourTasks.map(task => (
                                    <div 
                                      key={task.id} 
                                      className={`p-2 rounded-md border-l-4 ${task.priority === 'high' ? 'border-red-500 bg-red-50' : task.priority === 'medium' ? 'border-amber-500 bg-amber-50' : 'border-green-500 bg-green-50'}`}
                                    >
                                      <div className="flex items-start">
                                        <div className="flex-1">
                                          <div className="flex items-center">
                                            <h4 className={`font-medium text-sm ${task.completed ? 'line-through text-gray-500' : ''}`}>
                                              {task.title}
                                            </h4>
                                          </div>
                                          <div className="flex items-center mt-1 text-xs text-gray-500">
                                            <span>{task.time}</span>
                                            {task.duration && <span className="ml-1">• {task.duration}</span>}
                                            <span className="ml-2 capitalize">{task.category}</span>
                                            {task.recurrence && (
                                              <span className="ml-2 flex items-center">
                                                <CalendarDays className="h-3 w-3 mr-1" />
                                                {task.recurrence.type === 'daily' ? 'Daily' : 
                                                 task.recurrence.type === 'weekly' ? 'Weekly' : 
                                                 task.recurrence.type === 'monthly' ? 'Monthly' : 'Recurring'}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="week" className="mt-4">
                  <ScrollArea className="h-[400px]">
                    <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-md overflow-hidden">
                      {weekDates.map((dayInfo, index) => {
                        const dayTasks = getTasksByDayOfWeek(index);
                        return (
                          <div 
                            key={dayInfo.day} 
                            className={`bg-white ${dayInfo.isWeekend ? 'bg-gray-50' : ''}`}
                          >
                            <div className={`py-2 text-center border-b ${dayInfo.isWeekend ? 'bg-blue-50' : ''}`}>
                              <p className={`text-sm font-medium ${dayInfo.isWeekend ? 'text-blue-600' : ''}`}>
                                {dayInfo.day}
                              </p>
                              <p className="text-xs text-gray-500">{dayInfo.formattedDate}</p>
                            </div>
                            <div className="min-h-[350px] p-1">
                              {dayTasks.length > 0 ? (
                                dayTasks.map(task => (
                                  <div 
                                    key={task.id} 
                                    className={`p-1 my-1 text-xs rounded border-l-2 ${task.priority === 'high' ? 'border-red-500 bg-red-50' : task.priority === 'medium' ? 'border-amber-500 bg-amber-50' : 'border-green-500 bg-green-50'}`}
                                  >
                                    <p className={`truncate font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                                      {task.title}
                                    </p>
                                    <p className="text-xs text-gray-500">{task.time}</p>
                                    {task.recurrence && (
                                      <p className="text-xs text-gray-500 flex items-center">
                                        <CalendarDays className="h-3 w-3 mr-1" />
                                        {task.recurrence.type.charAt(0).toUpperCase()}
                                      </p>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <p className="text-xs text-gray-400">No tasks</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="month" className="mt-4">
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-xs font-medium text-gray-500 py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  <ScrollArea className="h-[360px]">
                    <div className="grid grid-cols-7 gap-1">
                      {monthDays.map((day, index) => {
                        const dayTasks = getTasksForDate(day);
                        const isCurrentMonth = isSameMonth(day, selectedDate);
                        const isWeekendDay = isWeekend(day);
                        return (
                          <div 
                            key={index}
                            onClick={() => setSelectedDate(day)}
                            className={`
                              min-h-[80px] p-1 rounded-md border cursor-pointer 
                              ${isSameDay(day, selectedDate) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                              ${!isCurrentMonth ? 'opacity-40' : ''}
                              ${isWeekendDay ? 'bg-amber-50' : ''}
                              ${isToday(day) ? 'font-bold' : ''}
                              hover:bg-gray-50
                            `}
                          >
                            <div className="flex justify-between items-center">
                              <span className={`text-xs ${isToday(day) ? 'bg-blue-600 text-white h-5 w-5 rounded-full flex items-center justify-center' : ''}`}>
                                {format(day, 'd')}
                              </span>
                              {dayTasks.length > 0 && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded-full">
                                  {dayTasks.length}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 space-y-1">
                              {dayTasks.slice(0, 2).map((task) => (
                                <div 
                                  key={task.id} 
                                  className={`
                                    text-xs truncate px-1 py-0.5 rounded
                                    ${task.priority === 'high' ? 'bg-red-100 text-red-800' : 
                                      task.priority === 'medium' ? 'bg-amber-100 text-amber-800' : 
                                      'bg-green-100 text-green-800'}
                                    ${task.completed ? 'line-through opacity-50' : ''}
                                  `}
                                >
                                  {task.title}
                                </div>
                              ))}
                              {dayTasks.length > 2 && (
                                <div className="text-xs text-gray-500 px-1">
                                  +{dayTasks.length - 2} more
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">
                  {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') 
                    ? "Today's Tasks" 
                    : `Tasks for ${format(selectedDate, 'MMMM d')}`}
                </CardTitle>
                <button className="text-xs text-gray-500 flex items-center">
                  Hide Completed
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {getTasksForDate(selectedDate).length > 0 ? (
                  getTasksForDate(selectedDate).map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onDeleteTask={handleDeleteTask}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No tasks for this day. Add tasks from the Tasks page.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <SleepAnalysis />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Task Progress</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Completion Status</h4>
                <DonutChart data={completionStatus} />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Task Priority</h4>
                <PriorityChart data={priorityStatus} />
              </div>
            </CardContent>
          </Card>

          <WeatherWidget weatherData={weatherData} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
