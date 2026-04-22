
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storageService';
import { Startup, CommunityPost, Meeting } from '../types';
import { IconWrapper } from './IconWrapper';
import { 
  UserGroup02Icon, Cancel01Icon, PencilEdit02Icon, Upload01Icon, Loading03Icon, 
  DashboardSquare01Icon, ArrowRight01Icon, PlusSignIcon, ArrowLeft01Icon, Delete02Icon, Video01Icon, Call02Icon, Location01Icon, Calendar01Icon, Clock01Icon, UserIcon, Mail01Icon, Link01Icon, LinkSquare01Icon, Activity02Icon, GlobalIcon, LeftTriangleIcon
} from 'hugeicons-react';
import { VideoPlayer } from './VideoPlayer';
import UserProfileView from './UserProfileView';
import { PitchEditor } from './PitchEditor';

interface FounderDashboardProps {
  userProfile?: {
    name: string;
    title: string;
    email?: string;
    location?: string;
    avatarUrl?: string;
  };
  onConnect?: (userId: string) => void;
  onEditStateChange?: (isEditing: boolean) => void;
  onPostCreationStateChange?: (isCreating: boolean) => void;
  onMeetingModalStateChange?: (isMeetingModalOpen: boolean) => void;
  isEditingDeck?: boolean;
}

const FounderDashboard: React.FC<FounderDashboardProps> = React.memo(({ userProfile, onConnect, onEditStateChange, onPostCreationStateChange, onMeetingModalStateChange, isEditingDeck }) => {
  // Real Data State
  const [myStartup, setMyStartup] = useState<Startup | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Pull to Refresh State
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const startTouchY = useRef(0);
  const PULL_THRESHOLD = 80;

  // Calendar State
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [calendarView, setCalendarView] = useState<'Weekly' | 'Monthly'>('Weekly');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Modal States
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isConfirmingDeleteMeeting, setIsConfirmingDeleteMeeting] = useState(false);
  const [isSavingMeeting, setIsSavingMeeting] = useState(false);

  useEffect(() => {
    if (onMeetingModalStateChange) onMeetingModalStateChange(isMeetingModalOpen);
  }, [isMeetingModalOpen]);
  const [meetingForm, setMeetingForm] = useState<Partial<Meeting>>({});
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const setIsEditingDeck = (isEditing: boolean) => {
    if (onEditStateChange) onEditStateChange(isEditing);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setIsRefreshing(true);
    await Promise.all([
        loadStartupData(),
        loadMeetings()
    ]);
    setIsRefreshing(false);
  };

  const loadStartupData = async () => {
    const s = await StorageService.getMyStartup();
    if (s) setMyStartup(s);
  };

  const loadMeetings = async () => {
      const msgs = await StorageService.getMeetings();
      setMeetings(msgs);
  };

  // --- Calendar Logic ---

  const hasEventOnDay = (day: number, month: number, year: number) => {
      return meetings.some(m => {
          const d = new Date(m.date);
          return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
      });
  };

  const filteredMeetings = useMemo(() => {
      return meetings.filter(m => {
          const mDate = new Date(m.date);
          return mDate.getDate() === selectedDate.getDate() &&
                 mDate.getMonth() === selectedDate.getMonth() &&
                 mDate.getFullYear() === selectedDate.getFullYear();
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [meetings, selectedDate]);

  const calendarDates = useMemo(() => {
      const dates = [];
      const start = new Date(selectedDate);
      start.setDate(selectedDate.getDate() - 3);
      for (let i = 0; i < 7; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          dates.push({
              day: d.toLocaleDateString('en-US', { weekday: 'short' }),
              date: d.getDate(),
              fullDate: d,
              active: d.getDate() === selectedDate.getDate() && 
                      d.getMonth() === selectedDate.getMonth() &&
                      d.getFullYear() === selectedDate.getFullYear()
          });
      }
      return dates;
  }, [selectedDate]);

  const monthData = useMemo(() => {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const firstDayOfMonth = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const emptySlots = Array(firstDayOfMonth).fill(null);
      const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
      
      return { year, month, emptySlots, days };
  }, [selectedDate]);

  // --- Modal Handlers ---

  const handleOpenAddMeeting = () => {
      const defaultTime = new Date(selectedDate);
      defaultTime.setHours(new Date().getHours() + 1, 0, 0, 0);

      setMeetingForm({
          title: '',
          guestName: '',
          guestEmail: '',
          date: defaultTime.toISOString(),
          duration: 30,
          type: 'Video',
          status: 'confirmed'
      });
      setIsMeetingModalOpen(true);
  };

  const handleOpenEditMeeting = (m: Meeting) => {
      setMeetingForm({ ...m, date: new Date(m.date).toISOString() });
      setIsMeetingModalOpen(true);
  };

  const handleSaveMeeting = async () => {
      if (!meetingForm.title || !meetingForm.date) return;
      setIsSavingMeeting(true);
      try {
          const payload = {
              ...meetingForm,
              guestName: meetingForm.guestName || 'Guest'
          };
          if (meetingForm.id) {
              await StorageService.updateMeeting(meetingForm.id, payload);
          } else {
              await StorageService.createMeeting(payload);
          }
          await loadMeetings();
          setIsMeetingModalOpen(false);
      } catch (e) {
          console.error(e);
      } finally {
          setIsSavingMeeting(false);
      }
  };

  const handleDeleteMeeting = async () => {
      if (!meetingForm.id) return;
      setIsConfirmingDeleteMeeting(true);
  };

  const confirmDeleteMeeting = async () => {
      if (!meetingForm.id) return;
      setIsSavingMeeting(true);
      try {
        await StorageService.deleteMeeting(meetingForm.id);
        await loadMeetings();
        setIsMeetingModalOpen(false);
        setIsConfirmingDeleteMeeting(false);
      } finally {
        setIsSavingMeeting(false);
      }
  };

  // --- Pull to Refresh ---

  const handleTouchStart = (e: React.TouchEvent) => {
      if (scrollContainerRef.current?.scrollTop === 0) {
          startTouchY.current = e.touches[0].pageY;
          setIsPulling(true);
      }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (isPulling && !isRefreshing) {
          const diff = e.touches[0].pageY - startTouchY.current;
          if (diff > 0) setPullDistance(Math.min(diff * 0.4, 150));
      }
  };

  const handleTouchEnd = () => {
      if (pullDistance >= PULL_THRESHOLD) refreshData();
      setPullDistance(0);
      setIsPulling(false);
  };

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden font-sans text-zinc-900">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 bg-[#FFFCF0] pointer-events-none">
          {/* Solid Curved Yellow Header Background */}
          <div className="absolute top-0 left-0 right-0 h-[100px] sm:h-[280px] bg-[#FFF2C2] rounded-b-[100%] scale-x-150 origin-top"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div className={`absolute top-0 left-0 right-0 px-4 py-1.5 sm:px-6 sm:py-4 safe-area-top z-20 transition-all duration-200 backdrop-blur-md bg-white/30 border-b border-white/20 ${isEditingDeck ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
              <div className="flex items-center justify-between">
                  <h1 className="text-base sm:text-xl font-display font-black tracking-tighter text-zinc-900 group cursor-default">
                      <span className="inline-block transition-transform duration-300 group-hover:-translate-x-0.5">Connect</span>
                      <span className="text-brand-primary inline-block transition-transform duration-300 group-hover:translate-x-0.5">Up</span>
                  </h1>
                  <div className="flex items-center space-x-3">
                     {userProfile?.avatarUrl ? (
                         <img 
                            src={userProfile.avatarUrl} 
                            className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                            alt="Profile"
                            onClick={() => setSelectedProfileId('me')} // Assuming 'me' or a specific ID fetches the current user
                         />
                     ) : (
                         <div 
                            className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500 border-2 border-white shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setSelectedProfileId('me')}
                         >
                             <IconWrapper icon={UserIcon} size={20} />
                         </div>
                     )}
                  </div>
              </div>
          </div>

          <div className={`absolute left-0 right-0 flex justify-center pointer-events-none z-50 transition-all duration-200 ${isRefreshing || isPulling ? 'opacity-100' : 'opacity-0'}`} style={{ top: '125px', transform: isRefreshing ? `translateY(10px)` : `translateY(${Math.min(pullDistance * 0.3, 30)}px)` }}>
             <div className="w-9 h-9 rounded-full bg-white/80 backdrop-blur-xl shadow-sm border border-zinc-200/60 flex items-center justify-center">
                 <IconWrapper icon={Loading03Icon} size={16} className={`text-zinc-900 ${isRefreshing ? 'animate-spin-fast' : ''}`} />
             </div>
          </div>

          <div 
            ref={scrollContainerRef} 
            className="w-full h-full relative z-10 overflow-y-auto overflow-x-hidden pb-44 pt-12 sm:pt-20 no-scrollbar"
            style={{ transform: isPulling ? `translateY(${pullDistance}px)` : (isRefreshing ? `translateY(${PULL_THRESHOLD}px)` : 'none'), transition: isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' }} 
            onTouchStart={handleTouchStart} 
            onTouchMove={handleTouchMove} 
            onTouchEnd={handleTouchEnd}
          >
             <div className="p-0 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 sm:gap-6 lg:gap-8">
                     {/* Left Column: Pitch & Primary Content */}
                     <div className="lg:col-span-7 space-y-0 sm:space-y-6 lg:space-y-8">
                         {/* Pitch Widget */}
                         <div className="bg-zinc-100/80 rounded-none sm:rounded-[32px] shadow-sm border-x-0 sm:border border-zinc-200/50 backdrop-blur-sm overflow-hidden">
                             <div className="p-3 sm:p-6 flex justify-between items-center">
                                 <div className="flex items-center gap-3">
                                     <IconWrapper icon={Video01Icon} size={20} className="text-zinc-900" />
                                     <h3 className="font-display font-bold text-base sm:text-xl text-zinc-900">My Pitch</h3>
                                 </div>
                                 <button 
                                     onClick={() => setIsEditingDeck(true)}
                                     className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-full text-[9px] font-black uppercase tracking-widest text-zinc-900 hover:bg-zinc-50 transition-all active:scale-95 shadow-sm"
                                 >
                                     <IconWrapper icon={PencilEdit02Icon} size={10} />
                                     Edit Pitch
                                 </button>
                             </div>
                             <div className="relative w-full aspect-video bg-zinc-900">
                                 {myStartup ? (
                                    <VideoPlayer src={myStartup.videoUrl || ''} className="w-full h-full object-cover" controls={true} loop={true} autoPlay={true} muted={true} />
                                 ) : (
                                     <div className="flex flex-col items-center justify-center py-20 text-center">
                                          <IconWrapper icon={Link01Icon} size={24} className="text-zinc-300 mb-3" />
                                          <p className="text-sm font-bold text-zinc-400">No pitch video added</p>
                                          <p className="text-xs text-zinc-300 mt-1">Add a video URL to showcase your startup</p>
                                     </div>
                                 )}
                             </div>
                         </div>

                         {/* Quick Stats or other content can go here in the future */}
                     </div>

                     {/* Right Column: Schedule & Secondary Content */}
                     <div className="lg:col-span-5 space-y-0 sm:space-y-6 lg:space-y-8">
                         {/* ENHANCED SCHEDULE WIDGET */}
                         <div className="bg-white/60 rounded-none sm:rounded-[32px] p-4 sm:p-8 shadow-sm border-x-0 sm:border border-white/60 backdrop-blur-xl overflow-hidden h-full">
                            <div className="flex items-center justify-between mb-6 sm:mb-8">
                                <div className="flex items-center gap-3">
                                    <IconWrapper icon={Calendar01Icon} size={20} className="text-zinc-900" />
                                   <h3 className="text-lg sm:text-2xl font-display font-black text-zinc-900">Schedule</h3>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-white/50 p-1 rounded-full border border-white/60 backdrop-blur-sm">
                                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest pl-[0.1em] transition-all ${calendarView === 'Weekly' ? 'bg-white text-black shadow-sm' : 'text-zinc-400'}`} onClick={() => setCalendarView('Weekly')}>Weekly</div>
                                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest pl-[0.1em] transition-all ${calendarView === 'Monthly' ? 'bg-white text-black shadow-sm' : 'text-zinc-400'}`} onClick={() => setCalendarView('Monthly')}>Monthly</div>
                                    </div>
                                </div>
                            </div>

                            {/* Calendar Strip / Grid */}
                            <div className="mb-12 px-0 sm:px-2">
                                {calendarView === 'Weekly' ? (
                                    <div className="relative flex justify-center items-center animate-in fade-in slide-in-from-left-4 duration-500 w-full gap-2">
                                        <div onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 7); setSelectedDate(d); }} className="absolute left-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-zinc-50 rounded-full text-zinc-300 hover:text-black hover:bg-zinc-100 transition-all shrink-0 cursor-pointer"><IconWrapper icon={ArrowLeft01Icon} size={16} /></div>
                                        <div className="flex justify-center items-center px-2 sm:px-4 gap-2 sm:gap-4">
                                            {calendarDates.map((d, i) => {
                                                const hasEvent = hasEventOnDay(d.fullDate.getDate(), d.fullDate.getMonth(), d.fullDate.getFullYear());
                                                return (
                                                    <div key={i} onClick={() => setSelectedDate(d.fullDate)} className="flex flex-col items-center gap-2 sm:gap-3 cursor-pointer group">
                                                        <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] pl-[0.1em] sm:pl-[0.2em] transition-colors ${d.active ? 'text-black' : 'text-zinc-400 group-hover:text-zinc-600'}`}>{d.day}</span>
                                                        <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 flex flex-col items-center justify-center rounded-xl lg:rounded-2xl text-xs sm:text-sm lg:text-base font-black transition-all relative ${d.active ? 'bg-black text-white shadow-xl scale-110 -rotate-3' : 'bg-white border border-zinc-100 text-zinc-400 group-hover:text-black group-hover:border-zinc-300'}`}>
                                                            {d.date}
                                                            {hasEvent && <div className={`absolute bottom-1 sm:bottom-2 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${d.active ? 'bg-brand-primary' : 'bg-zinc-300'}`}></div>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 7); setSelectedDate(d); }} className="absolute right-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-zinc-50 rounded-full text-zinc-300 hover:text-black hover:bg-zinc-100 transition-all shrink-0 cursor-pointer"><IconWrapper icon={ArrowRight01Icon} size={16} /></div>
                                    </div>
                                ) : (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                                        <div className="flex items-center justify-between mb-6 px-2">
                                            <h4 className="text-sm font-black uppercase tracking-widest text-black">{selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
                                            <div className="flex gap-2">
                                                <div onClick={() => { const d = new Date(selectedDate); d.setMonth(d.getMonth() - 1); setSelectedDate(d); }} className="p-1.5 bg-zinc-50 rounded-full text-zinc-400 hover:text-black cursor-pointer"><IconWrapper icon={ArrowLeft01Icon} size={16} /></div>
                                                <div onClick={() => { const d = new Date(selectedDate); d.setMonth(d.getMonth() + 1); setSelectedDate(d); }} className="p-1.5 bg-zinc-50 rounded-full text-zinc-400 hover:text-black cursor-pointer"><IconWrapper icon={ArrowRight01Icon} size={16} /></div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-7 gap-y-2 text-center">
                                            {['S','M','T','W','T','F','S'].map((d, i) => <span key={`${d}-${i}`} className="text-[9px] font-black text-zinc-300 mb-2 uppercase">{d}</span>)}
                                            {monthData.emptySlots.map((_, i) => <div key={`empty-${i}`} className="h-10" />)}
                                            {monthData.days.map((day) => {
                                                const isSelected = day === selectedDate.getDate() && 
                                                                 monthData.month === selectedDate.getMonth() && 
                                                                 monthData.year === selectedDate.getFullYear();
                                                const hasEvent = hasEventOnDay(day, monthData.month, monthData.year);
                                                return (
                                                    <div key={day} onClick={() => { const d = new Date(selectedDate); d.setDate(day); setSelectedDate(d); }} className="flex flex-col items-center justify-center cursor-pointer h-10 relative group">
                                                        <div className={`w-9 h-9 flex items-center justify-center rounded-full text-xs font-bold transition-all ${isSelected ? 'bg-black text-white shadow-lg scale-110' : 'text-zinc-600 hover:bg-zinc-50'}`}>{day}</div>
                                                        {hasEvent && <div className={`w-1 h-1 rounded-full absolute bottom-0 ${isSelected ? 'bg-brand-primary' : 'bg-zinc-300'}`}></div>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Meeting List for Selected Date */}
                            <div className="space-y-3 min-h-[160px] animate-in fade-in duration-500">
                                <div className="flex items-center justify-between px-2 mb-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Events for {selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                    <button 
                                        onClick={handleOpenAddMeeting}
                                        className="w-8 h-8 flex items-center justify-center bg-zinc-900 text-white rounded-full hover:bg-zinc-800 transition-all active:scale-90 shadow-sm"
                                    >
                                        <IconWrapper icon={PlusSignIcon} size={14} />
                                    </button>
                                </div>
                                
                                {filteredMeetings.length > 0 ? filteredMeetings.map(m => (
                                    <div key={m.id} onClick={() => handleOpenEditMeeting(m)} className="group relative flex items-center p-3 sm:p-4 rounded-2xl border transition-all hover:translate-x-1 cursor-pointer overflow-hidden bg-zinc-50 border-zinc-100 hover:bg-white">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="mr-6 min-w-[60px] text-sm font-black text-black">
                                            {new Date(m.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h5 className="font-bold text-sm text-black truncate">{m.title}</h5>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-zinc-400">
                                                <span className="text-[10px] font-bold uppercase flex items-center gap-1.5">
                                                    {m.type === 'Video' ? <IconWrapper icon={Video01Icon} size={10} /> : m.type === 'Phone' ? <IconWrapper icon={Call02Icon} size={10} /> : <IconWrapper icon={Location01Icon} size={10} />}
                                                    {m.duration} Min
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <IconWrapper icon={ArrowRight01Icon} size={14} className="text-zinc-300 group-hover:text-black" />
                                        </div>
                                    </div>
                                )) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center bg-zinc-50/50 rounded-3xl border border-dashed border-zinc-200">
                                        <IconWrapper icon={Calendar01Icon} size={24} className="text-zinc-300 mb-3" />
                                    </div>
                                )}
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
          </div>

      {selectedProfileId && (
          <UserProfileView 
            userId={selectedProfileId} 
            onClose={() => setSelectedProfileId(null)} 
            onMessage={(uid) => {
                setSelectedProfileId(null);
                if (onConnect) onConnect(uid);
            }}
          />
      )}

      {/* --- REDESIGNED MEETING MODAL --- */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-md" 
                onClick={() => !isSavingMeeting && setIsMeetingModalOpen(false)}
            ></div>

            {/* Modal Container */}
            <div className="relative w-[95vw] max-w-lg bg-white rounded-[32px] sm:rounded-[40px] shadow-2xl animate-in zoom-in-95 duration-400 overflow-hidden flex flex-col border border-white/20 sm:max-h-[90vh]">
                
                {/* Header Section */}
                <div className="px-6 sm:px-8 pt-8 sm:pt-10 pb-6 sm:pb-8 flex justify-between items-start bg-white">
                    <div>
                        <h3 className="font-display font-black text-3xl sm:text-4xl text-zinc-900 tracking-tighter leading-none mb-2 sm:mb-3">Schedule Match</h3>
                    </div>
                    <button 
                        onClick={() => !isSavingMeeting && setIsMeetingModalOpen(false)}
                        className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                        <IconWrapper icon={Cancel01Icon} size={24} />
                    </button>
                </div>

                {/* Body / Form Section */}
                <div className="px-6 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 overflow-y-auto max-h-[70vh] no-scrollbar">
                    
                    {/* Meeting Type Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] sm:text-[11px] font-black text-zinc-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] ml-1">Meeting Type</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'Video', icon: Video01Icon, label: 'Video' },
                                { id: 'Phone', icon: Call02Icon, label: 'Phone' },
                                { id: 'In-Person', icon: Location01Icon, label: 'In-Person' }
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setMeetingForm(prev => ({ ...prev, type: type.id as any }))}
                                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${meetingForm.type === type.id ? 'bg-zinc-900 border-zinc-900 text-white shadow-lg' : 'bg-zinc-50 border-zinc-100 text-zinc-400 hover:bg-white hover:border-zinc-200'}`}
                                >
                                    <IconWrapper icon={type.icon} size={20} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Event Title */}
                    <div className="space-y-2 sm:space-y-3">
                        <label className="text-[10px] sm:text-[11px] font-black text-zinc-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] ml-1">Event Topic</label>
                        <input 
                            type="text" 
                            value={meetingForm.title || ''} 
                            onChange={(e) => setMeetingForm(prev => ({ ...prev, title: e.target.value }))} 
                            placeholder="e.g. Series A Pitch Demo" 
                            className="w-full bg-zinc-50 border border-zinc-100 rounded-[20px] sm:rounded-[24px] px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-bold text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:bg-white focus:ring-8 focus:ring-brand-primary/5 focus:border-brand-primary transition-all shadow-sm" 
                        />
                    </div>

                    {/* Guest Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2 sm:space-y-3">
                            <label className="text-[10px] sm:text-[11px] font-black text-zinc-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] ml-1">Guest Name</label>
                            <div className="relative">
                                <IconWrapper icon={UserIcon} size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300" />
                                <input 
                                    type="text" 
                                    value={meetingForm.guestName || ''} 
                                    onChange={(e) => setMeetingForm(prev => ({ ...prev, guestName: e.target.value }))} 
                                    placeholder="e.g. John Doe" 
                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:bg-white transition-all shadow-sm" 
                                />
                            </div>
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                            <label className="text-[10px] sm:text-[11px] font-black text-zinc-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] ml-1">Guest Email</label>
                            <div className="relative">
                                <IconWrapper icon={Mail01Icon} size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300" />
                                <input 
                                    type="email" 
                                    value={meetingForm.guestEmail || ''} 
                                    onChange={(e) => setMeetingForm(prev => ({ ...prev, guestEmail: e.target.value }))} 
                                    placeholder="john@example.com" 
                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:bg-white transition-all shadow-sm" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Time & Duration Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] ml-1">Date & Time</label>
                            <div className="relative group">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-brand-primary transition-colors">
                                    <IconWrapper icon={Calendar01Icon} size={20} />
                                </div>
                                <input 
                                    type="datetime-local" 
                                    value={meetingForm.date ? new Date(meetingForm.date).toISOString().slice(0, 16) : ''} 
                                    onChange={(e) => setMeetingForm(prev => ({ ...prev, date: new Date(e.target.value).toISOString() }))} 
                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-zinc-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all shadow-sm" 
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] ml-1">Duration</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[15, 30, 60].map((mins) => (
                                    <button
                                        key={mins}
                                        type="button"
                                        onClick={() => setMeetingForm(prev => ({ ...prev, duration: mins }))}
                                        className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${meetingForm.duration === mins ? 'bg-zinc-900 border-zinc-900 text-white shadow-md' : 'bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200'}`}
                                    >
                                        {mins < 60 ? `${mins}m` : '1h'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Meeting Link (Conditional) */}
                    {meetingForm.type === 'Video' && (
                        <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                            <label className="text-[10px] sm:text-[11px] font-black text-zinc-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] ml-1">Meeting Link</label>
                            <div className="relative">
                                <IconWrapper icon={Link01Icon} size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300" />
                                <input 
                                    type="url" 
                                    value={meetingForm.meetingLink || ''} 
                                    onChange={(e) => setMeetingForm(prev => ({ ...prev, meetingLink: e.target.value }))} 
                                    placeholder="e.g. meet.google.com/abc-defg-hij" 
                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:bg-white transition-all shadow-sm" 
                                />
                            </div>
                        </div>
                    )}

                    {/* Additional Attendees */}
                    <div className="space-y-3">
                        <label className="text-[10px] sm:text-[11px] font-black text-zinc-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] ml-1">Additional Attendees (Optional)</label>
                        <div className="relative">
                            <IconWrapper icon={UserIcon} size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300" />
                            <input 
                                type="text" 
                                placeholder="Add emails separated by commas" 
                                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:bg-white transition-all shadow-sm" 
                            />
                        </div>
                        <p className="text-[9px] font-medium text-zinc-400 ml-1 italic">Invitations will be sent automatically upon confirmation.</p>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="px-6 sm:px-8 py-6 sm:py-8 bg-zinc-50/80 border-t border-zinc-100 flex gap-3 sm:gap-4">
                    {meetingForm.id && (
                        <div 
                            onClick={handleDeleteMeeting} 
                            className="w-14 h-14 sm:w-16 sm:h-16 bg-white border border-red-100 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-all shadow-sm active:scale-95 cursor-pointer"
                        >
                            <IconWrapper icon={Delete02Icon} size={20} sm:size={24} />
                        </div>
                    )
                    }
                    <div 
                        onClick={handleSaveMeeting} 
                        className={`flex-1 h-14 sm:h-16 bg-black text-white rounded-2xl font-black text-base sm:text-lg hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-xl flex items-center justify-center gap-2 sm:gap-3 cursor-pointer ${isSavingMeeting || !meetingForm.title || !meetingForm.date ? 'opacity-30 pointer-events-none' : ''}`}
                    >
                        {isSavingMeeting ? (
                            <IconWrapper icon={Loading03Icon} size={20} sm:size={24} className="animate-spin-fast" />
                        ) : (
                            <>
                                <span>{meetingForm.id ? 'Update Schedule' : 'Confirm Meeting'}</span>
                                <IconWrapper icon={ArrowRight01Icon} size={16} sm:size={20} className="text-brand-primary group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Delete Meeting Confirmation Modal */}
      {isConfirmingDeleteMeeting && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSavingMeeting && setIsConfirmingDeleteMeeting(false)}></div>
             <div className="relative bg-white w-full max-w-sm md:max-w-md rounded-[40px] p-8 shadow-2xl animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                   <IconWrapper icon={LeftTriangleIcon} size={32} />
                </div>
                <h2 className="text-2xl font-display font-bold text-zinc-900 text-center mb-3">Cancel Meeting?</h2>
                <p className="text-zinc-500 text-sm text-center mb-8 leading-relaxed">
                   This action is permanent. The meeting will be removed from your schedule.
                </p>
                <div className="space-y-3">
                    <div 
                       onClick={confirmDeleteMeeting}
                       className={`w-full h-14 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${isSavingMeeting ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                       {isSavingMeeting ? <IconWrapper icon={Loading03Icon} size={20} className="animate-spin-fast" /> : "Yes, Cancel Meeting"}
                    </div>
                    <div 
                       onClick={() => setIsConfirmingDeleteMeeting(false)}
                       className={`w-full h-14 bg-zinc-100 text-zinc-900 font-bold rounded-2xl hover:bg-zinc-200 transition-all cursor-pointer ${isSavingMeeting ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                       Cancel
                    </div>
                </div>
             </div>
          </div>
      )}

      {isEditingDeck && (
        <PitchEditor 
          startup={myStartup} 
          onSave={(updated) => {
            setMyStartup(updated);
            setIsEditingDeck(false);
          }}
          onCancel={() => setIsEditingDeck(false)}
        />
      )}
      </div>
    </div>
  );
});

export default FounderDashboard;
