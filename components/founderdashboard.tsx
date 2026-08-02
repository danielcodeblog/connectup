
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storageService';
import { Startup, CommunityPost, Meeting } from '../types';
import { IconWrapper } from './IconWrapper';
import { 
  UserGroup02Icon, Cancel01Icon, PencilEdit02Icon, Upload01Icon, Loading03Icon, 
  DashboardSquare01Icon, ArrowRight01Icon, PlusSignIcon, ArrowLeft01Icon, Delete02Icon, Video01Icon, Call02Icon, Location01Icon, Calendar01Icon, Clock01Icon, UserIcon, Mail01Icon, Link01Icon, LinkSquare01Icon, LeftTriangleIcon,
  MagicWand01Icon
} from 'hugeicons-react';
import { Check } from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import UserProfileView from './UserProfileView';
import { PitchEditor } from './PitchEditor';
import { PitchSimulator } from './PitchSimulator';

interface FounderDashboardProps {
  userProfile?: {
    name: string;
    title: string;
    email?: string;
    location?: string;
    avatarUrl?: string;
    plan?: string;
  };
  onConnect?: (userId: string) => void;
  onEditStateChange?: (isEditing: boolean) => void;
  onPostCreationStateChange?: (isCreating: boolean) => void;
  onMeetingModalStateChange?: (isMeetingModalOpen: boolean) => void;
  isEditingDeck?: boolean;
  onNavigateHome?: () => void;
  onNavigateToSubscription?: () => void;
}

const FounderDashboard: React.FC<FounderDashboardProps> = React.memo(({ userProfile, onConnect, onEditStateChange, onPostCreationStateChange, onMeetingModalStateChange, isEditingDeck, onNavigateHome, onNavigateToSubscription }) => {
  // Real Data State - Multi-pitch support
  const [pitches, setPitches] = useState<Startup[]>([]);
  const [activePitchIndex, setActivePitchIndex] = useState<number>(0);
  const [editingPitchIndex, setEditingPitchIndex] = useState<number | null>(null);
  const [showProUpgradeModal, setShowProUpgradeModal] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const myStartup = pitches[activePitchIndex] || null;
  
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
    const list = await StorageService.getMyPitches();
    setPitches(list);
    if (activePitchIndex >= list.length && list.length > 0) {
      setActivePitchIndex(list.length - 1);
    }
  };

  const handleAddPitchClick = () => {
    const isPro = userProfile?.plan === 'pro';
    const maxAllowed = isPro ? 2 : 1;

    if (pitches.length >= maxAllowed) {
      if (!isPro) {
        setShowProUpgradeModal(true);
      } else {
        alert("Maximum 2 pitches allowed on Pro plan.");
      }
      return;
    }

    setEditingPitchIndex(pitches.length);
    setIsEditingDeck(true);
  };

  const handleDeletePitchClick = async (idxToDelete: number) => {
    const updatedList = await StorageService.deletePitch(idxToDelete);
    setPitches(updatedList);
    setActivePitchIndex(0);
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
    <div className="flex flex-col h-screen w-full relative font-sans text-zinc-900 overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 bg-white pointer-events-none fixed">
          {/* Solid Curved Yellow Header Background */}
          <div className="absolute top-0 left-0 right-0 h-[100px] sm:h-[280px] bg-brand-primary/20 rounded-b-[100%] scale-x-150 origin-top"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className={`sticky top-0 left-0 right-0 w-full px-4 py-3 sm:px-6 sm:py-4 safe-area-top z-[40] transition-all duration-200 backdrop-blur-xl bg-white dark:bg-zinc-950 border-b border-zinc-200/40 dark:border-zinc-800/40 ${isEditingDeck ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
              <div className="flex items-center justify-between w-full">
                  {/* ConnectUp Brand Logo on the left */}
                  <div className="flex items-center select-none gap-2">
                      {onNavigateHome && (
                          <button onClick={onNavigateHome} className="p-1 text-zinc-500 hover:text-zinc-900 transition-colors">
                          </button>
                      )}
                      <span className="font-display font-black text-lg sm:text-2xl tracking-tighter text-zinc-900">
                          Connect<span className="text-brand-primary">Up</span>
                      </span>
                  </div>

                  {/* Right side profile */}
                  <div className="flex items-center space-x-3 shrink-0">
                     {userProfile?.avatarUrl ? (
                         <img 
                            src={userProfile.avatarUrl} 
                            loading="lazy"
                            decoding="async"
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white shadow-sm object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                            alt="Profile"
                            onClick={() => setSelectedProfileId('me')} // Assuming 'me' or a specific ID fetches the current user
                         />
                     ) : (
                         <div 
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500 border-2 border-white shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setSelectedProfileId('me')}
                          >
                             <IconWrapper icon={UserIcon} size={20} />
                         </div>
                     )}
                  </div>
              </div>
          </div>

          <div className={`fixed inset-x-0 top-20 flex items-center justify-center pointer-events-none z-50 transition-all duration-200 ${isRefreshing || isPulling ? 'opacity-100' : 'opacity-0'}`} style={{ transform: isRefreshing ? 'none' : `translateY(${Math.min(pullDistance * 0.3, 30)}px)` }}>
             <div className="w-9 h-9 rounded-full bg-white/80 backdrop-blur-xl shadow-sm border border-zinc-200/60 flex items-center justify-center">
                 <IconWrapper icon={Loading03Icon} size={16} className={`text-zinc-900 ${isRefreshing ? 'animate-spin-fast' : ''}`} />
             </div>
          </div>

          <div 
            ref={scrollContainerRef} 
            className="w-full flex-1 relative z-10 pb-44 px-0 sm:px-6 overflow-y-auto overscroll-behavior-y-contain no-scrollbar"
            style={{ 
              transform: isPulling ? `translateY(${pullDistance}px)` : 'none', 
              transition: isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }} 
            onTouchStart={handleTouchStart} 
            onTouchMove={handleTouchMove} 
            onTouchEnd={handleTouchEnd}
          >
             <div className="py-6 w-full space-y-8 max-w-6xl mx-auto">
                 {/* Pitch Widget - Full Width with Multi-Pitch Switcher */}
                 <div className="w-full space-y-4">
                     {/* Active Pitch Card */}
                     <div className="bg-white rounded-[32px] shadow-sm border border-zinc-100 backdrop-blur-sm overflow-hidden flex flex-col">
                         <div className="p-4 sm:p-6 flex items-center justify-between gap-3 shrink-0 border-b border-zinc-100 w-full overflow-hidden">
                             <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar flex-1 min-w-0 mask-linear-fade snap-x snap-mandatory pr-10">
                                 {pitches.map((pitch, idx) => (
                                     <button
                                         key={pitch.id || idx}
                                         onClick={() => setActivePitchIndex(idx)}
                                         className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer border shrink-0 snap-start ${
                                             activePitchIndex === idx
                                                 ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                                                 : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                                         }`}
                                     >
                                         <IconWrapper icon={Video01Icon} size={14} />
                                         <span>{pitch.name || `Pitch #${idx + 1}`}</span>
                                         {activePitchIndex === idx && (
                                             <span className="ml-1 text-[9px] bg-amber-400 text-zinc-950 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold">Active</span>
                                         )}
                                     </button>
                                 ))}

                                 {/* Add Pitch Button */}
                                 {pitches.length < 2 && (
                                     <button
                                         onClick={handleAddPitchClick}
                                         className="px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 bg-amber-400 text-zinc-950 hover:bg-amber-300 cursor-pointer shadow-sm"
                                     >
                                         <IconWrapper icon={PlusSignIcon} size={14} />
                                         <span>Add Pitch</span>
                                         {userProfile?.plan !== 'pro' && pitches.length >= 1 && (
                                             <span className="ml-1 px-1.5 py-0.5 bg-zinc-950 text-white text-[9px] font-black rounded-full uppercase tracking-wider">PRO</span>
                                         )}
                                     </button>
                                 )}
                             </div>

                             <div className="flex items-center gap-2 shrink-0 ml-auto pl-2">
                                 {pitches.length > 0 && (
                                     <button
                                         onClick={() => handleDeletePitchClick(activePitchIndex)}
                                         className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer flex-shrink-0 flex items-center justify-center"
                                         title="Delete pitch"
                                     >
                                         <IconWrapper icon={Delete02Icon} size={18} />
                                     </button>
                                 )}
                                 <button 
                                     onClick={() => {
                                         setEditingPitchIndex(activePitchIndex);
                                         setIsEditingDeck(true);
                                     }}
                                     className="p-2 bg-zinc-900 text-white rounded-full hover:bg-zinc-800 transition-colors cursor-pointer flex-shrink-0 flex items-center justify-center"
                                     title="Edit Pitch"
                                 >
                                     <IconWrapper icon={PencilEdit02Icon} size={16} className="text-white" />
                                 </button>
                             </div>
                         </div>
                         <div className="relative w-full h-80 sm:h-[600px] bg-zinc-900">
                             {myStartup && myStartup.videoUrl ? (
                                 <video 
                                     src={myStartup.videoUrl} 
                                     className="w-full h-full object-cover" 
                                     controls 
                                     playsInline
                                 />
                             ) : (
                                 <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
                                      <IconWrapper icon={Link01Icon} size={32} className="text-zinc-600 mb-3" />
                                      <p className="text-base font-bold text-zinc-300 mb-1">{myStartup ? `No video for ${myStartup.name}` : "No pitch video added"}</p>
                                      <p className="text-xs text-zinc-500 max-w-sm mb-6">Upload a video pitch file or refine your startup details to showcase to investors.</p>
                                      <button 
                                          onClick={() => {
                                              setEditingPitchIndex(activePitchIndex);
                                              setIsEditingDeck(true);
                                          }}
                                          className="px-5 py-2.5 bg-amber-400 text-zinc-950 text-xs font-black rounded-full hover:bg-amber-300 transition-colors cursor-pointer"
                                      >
                                          {myStartup ? "Add Video to Pitch" : "Create First Pitch"}
                                      </button>
                                 </div>
                             )}
                         </div>
                     </div>
                 </div>

                 <div className="grid grid-cols-1 gap-6 lg:gap-10 items-stretch">
                      {/* Left Column: Schedule */}
                      <div className="w-full">
                          {/* ENHANCED SCHEDULE WIDGET - Height Synchronized */}
                          <div className="bg-white rounded-[32px] p-4 sm:p-8 shadow-sm border border-zinc-100 backdrop-blur-xl overflow-y-auto h-[500px] no-scrollbar">
                             <div className="flex items-center justify-between mb-6 sm:mb-8">
                                 <div className="flex items-center gap-3">
                                     <IconWrapper icon={Calendar01Icon} size={20} className="text-zinc-900" />
                                    <h3 className="text-lg sm:text-2xl font-display font-black text-zinc-900">Schedule</h3>
                                 </div>
                                 <div className="flex items-center gap-3">
                                     <div className="flex items-center bg-zinc-100 p-1 rounded-full border border-zinc-200 backdrop-blur-sm">
                                         <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest pl-[0.1em] transition-all cursor-pointer ${calendarView === 'Weekly' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'}`} onClick={() => setCalendarView('Weekly')}>Weekly</div>
                                         <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest pl-[0.1em] transition-all cursor-pointer ${calendarView === 'Monthly' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'}`} onClick={() => setCalendarView('Monthly')}>Monthly</div>
                                     </div>
                                 </div>
                             </div>

                             {/* Calendar Strip / Grid */}
                             <div className="mb-12">
                                 {calendarView === 'Weekly' ? (
                                     <div className="relative flex justify-center items-center animate-in fade-in slide-in-from-left-4 duration-500 w-full gap-2">
                                         <div onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 7); setSelectedDate(d); }} className="absolute left-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white/5 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-all shrink-0 cursor-pointer z-10"><IconWrapper icon={ArrowLeft01Icon} size={16} /></div>
                                         <div className="flex justify-center items-center px-8 gap-2 sm:gap-4 overflow-x-auto no-scrollbar w-full">
                                             {calendarDates.map((d, i) => {
                                                 const hasEvent = hasEventOnDay(d.fullDate.getDate(), d.fullDate.getMonth(), d.fullDate.getFullYear());
                                                 return (
                                                     <div key={i} onClick={() => setSelectedDate(d.fullDate)} className="flex flex-col items-center gap-2 sm:gap-3 cursor-pointer group shrink-0">
                                                         <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${d.active ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-600'}`}>{d.day}</span>
                                                         <div className={`w-10 h-10 sm:w-12 sm:h-12 flex flex-col items-center justify-center rounded-2xl text-xs sm:text-sm font-black transition-all relative ${d.active ? 'bg-zinc-900 text-white shadow-xl scale-110' : 'bg-zinc-50 border border-zinc-100 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900'}`}>
                                                             {d.date}
                                                             {hasEvent && <div className={`absolute bottom-1.5 w-1 h-1 rounded-full ${d.active ? 'bg-brand-primary' : 'bg-zinc-300'}`}></div>}
                                                         </div>
                                                     </div>
                                                 );
                                             })}
                                         </div>
                                         <div onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 7); setSelectedDate(d); }} className="absolute right-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white/5 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-all shrink-0 cursor-pointer z-10"><IconWrapper icon={ArrowRight01Icon} size={16} /></div>
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
                             <div className="space-y-3 min-h-[160px] animate-in fade-in duration-500 pt-6">
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
                                     <div key={m.id} onClick={() => handleOpenEditMeeting(m)} className="group relative flex items-center p-5 rounded-[2rem] border border-zinc-100 bg-white transition-all hover:bg-zinc-50 cursor-pointer shadow-sm hover:shadow-md">
                                         <div className="mr-6 min-w-[60px] text-xs font-black text-black">
                                             {new Date(m.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                         </div>
                                         <div className="flex-1 min-w-0">
                                             <h5 className="font-black text-sm sm:text-base text-black truncate">{m.title}</h5>
                                             {m.guestName && <p className="text-[10px] text-zinc-400 font-black uppercase tracking-wider truncate">{m.guestName}</p>}
                                         </div>
                                         <div className="flex items-center gap-2">
                                             <IconWrapper icon={ArrowRight01Icon} size={14} className="text-black" />
                                         </div>
                                     </div>
                                 )) : (
                                     <div className="flex flex-col items-center justify-center py-12 text-center bg-zinc-50/50 rounded-3xl border border-dashed border-zinc-200">
                                         <IconWrapper icon={Calendar01Icon} size={24} className="text-zinc-300 mb-3" />
                                         <p className="text-xs font-bold text-zinc-400">No events scheduled</p>
                                     </div>
                                 )}
                              </div>
                          </div>
                      </div>

                      {/* Right Column: Teleprompter */}
                      <div className="w-full">
                          {/* Interactive 30-Second Elevator Pitch Section */}
                          <PitchSimulator />
                      </div>
                 </div>
             </div>
          </div>

          {/* Modals outside scroll container */}
          {selectedProfileId && (
              <UserProfileView 
                userId={selectedProfileId} 
                onClose={() => setSelectedProfileId(null)} 
              />
          )}

          {/* --- REDESIGNED MEETING MODAL --- */}
          {isMeetingModalOpen && (
            <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in duration-300">
                {/* Modal Container */}
                <div className="relative w-full h-full max-w-2xl mx-auto bg-white overflow-hidden flex flex-col">
                    
                    {/* Header Section */}
                    <div className="px-5 sm:px-6 pt-6 sm:pt-8 pb-3 sm:pb-4 flex justify-between items-start bg-white">
                        <div>
                            <h3 className="font-display font-black text-xl sm:text-2xl text-zinc-900 tracking-tighter leading-none">Schedule Item</h3>
                        </div>
                        <button 
                            onClick={() => !isSavingMeeting && setIsMeetingModalOpen(false)}
                            className="p-1.5 text-zinc-400 hover:text-zinc-900 transition-colors"
                        >
                            <IconWrapper icon={Cancel01Icon} size={20} />
                        </button>
                    </div>

                    {/* Body / Form Section */}
                    <div className="px-5 sm:px-6 py-3 sm:py-4 space-y-4 overflow-y-auto max-h-[70vh] no-scrollbar">
                        
                        {/* Event Title */}
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">What's on the schedule?</label>
                            <input 
                                type="text" 
                                value={meetingForm.title || ''} 
                                onChange={(e) => setMeetingForm(prev => ({ ...prev, title: e.target.value }))} 
                                placeholder="e.g. Call with Investor" 
                                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-3 text-sm font-bold text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:bg-white transition-all shadow-sm" 
                            />
                        </div>

                        {/* guest info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Guest Name</label>
                                <input 
                                    type="text" 
                                    value={meetingForm.guestName || ''} 
                                    onChange={(e) => setMeetingForm(prev => ({ ...prev, guestName: e.target.value }))} 
                                    placeholder="Guest Name" 
                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-3 text-xs font-bold text-zinc-900 focus:outline-none focus:bg-white transition-all shadow-sm" 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Guest Email</label>
                                <input 
                                    type="email" 
                                    value={meetingForm.guestEmail || ''} 
                                    onChange={(e) => setMeetingForm(prev => ({ ...prev, guestEmail: e.target.value }))} 
                                    placeholder="guest@example.com" 
                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-3 text-xs font-bold text-zinc-900 focus:outline-none focus:bg-white transition-all shadow-sm" 
                                />
                            </div>
                        </div>

                        {/* Email Reminder Toggle */}
                        <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-2xl shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                    <IconWrapper icon={Mail01Icon} size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-zinc-900">Email Reminder</p>
                                    <p className="text-[10px] text-zinc-400 font-medium">Send automatic email reminder</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={!!meetingForm.guestEmail} // Auto-enabled if email is provided
                                    readOnly
                                />
                                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                            </label>
                        </div>

                        {/* Time */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Date</label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400">
                                        <IconWrapper icon={Calendar01Icon} size={20} />
                                    </div>
                                    <input 
                                        type="date" 
                                        value={(() => {
                                            if (!meetingForm.date) return '';
                                            const d = new Date(meetingForm.date);
                                            if (isNaN(d.getTime())) return '';
                                            const year = d.getFullYear();
                                            const month = String(d.getMonth() + 1).padStart(2, '0');
                                            const dateVal = String(d.getDate()).padStart(2, '0');
                                            return `${year}-${month}-${dateVal}`;
                                        })()} 
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val) {
                                                const currentD = meetingForm.date ? new Date(meetingForm.date) : new Date();
                                                const hours = String(currentD.getHours()).padStart(2, '0');
                                                const minutes = String(currentD.getMinutes()).padStart(2, '0');
                                                const [yr, mn, dy] = val.split('-').map(Number);
                                                const newD = new Date(yr, mn - 1, dy, Number(hours), Number(minutes));
                                                setMeetingForm(prev => ({ ...prev, date: newD.toISOString() }));
                                            }
                                        }} 
                                        className="w-full h-16 bg-zinc-50 border border-zinc-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-zinc-900 focus:outline-none focus:bg-white transition-all shadow-sm" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Time</label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400">
                                        <IconWrapper icon={Clock01Icon} size={20} />
                                    </div>
                                    <input 
                                        type="time" 
                                        value={(() => {
                                            if (!meetingForm.date) return '';
                                            const d = new Date(meetingForm.date);
                                            if (isNaN(d.getTime())) return '';
                                            const hours = String(d.getHours()).padStart(2, '0');
                                            const minutes = String(d.getMinutes()).padStart(2, '0');
                                            return `${hours}:${minutes}`;
                                        })()} 
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val) {
                                                const currentD = meetingForm.date ? new Date(meetingForm.date) : new Date();
                                                const year = currentD.getFullYear();
                                                const month = currentD.getMonth();
                                                const day = currentD.getDate();
                                                const [hours, minutes] = val.split(':').map(Number);
                                                const newD = new Date(year, month, day, hours, minutes);
                                                setMeetingForm(prev => ({ ...prev, date: newD.toISOString() }));
                                            }
                                        }} 
                                        className="w-full h-16 bg-zinc-50 border border-zinc-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-zinc-900 focus:outline-none focus:bg-white transition-all shadow-sm" 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2 w-full col-span-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Type</label>
                                <div className="flex bg-zinc-50 border border-zinc-100 rounded-2xl p-1 gap-1 h-16">
                                    {(['Video', 'Phone', 'In-Person'] as const).map((type) => (
                                        <button 
                                            key={type}
                                            onClick={() => setMeetingForm(prev => ({ ...prev, type }))}
                                            className={`flex-1 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${meetingForm.type === type ? 'bg-black text-white shadow-md' : 'text-zinc-400 hover:text-zinc-600'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Meeting Link */}
                        {(meetingForm.type === 'Video' || meetingForm.type === 'Phone') && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Meeting Link / Number</label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400">
                                        <IconWrapper icon={LinkSquare01Icon} size={20} />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={meetingForm.meetingLink || ''} 
                                        onChange={(e) => setMeetingForm(prev => ({ ...prev, meetingLink: e.target.value }))} 
                                        placeholder={meetingForm.type === 'Video' ? "https://zoom.us/j/..." : "+1 (555) ..."} 
                                        className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-zinc-900 focus:outline-none focus:bg-white transition-all shadow-sm" 
                                    />
                                </div>
                            </div>
                        )}


                    </div>

                    {/* Footer Section */}
                    <div className="px-5 sm:px-8 py-5 sm:py-6 bg-zinc-50/80 border-t border-zinc-100 flex gap-3 sm:gap-4">
                        {meetingForm.id && (
                            <div 
                                onClick={handleDeleteMeeting} 
                                className="w-14 h-14 bg-white border border-red-100 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-50 transition-all shadow-sm cursor-pointer"
                            >
                                <IconWrapper icon={Delete02Icon} size={20} />
                            </div>
                        )
                        }
                        <div 
                            onClick={handleSaveMeeting} 
                            className={`flex-1 h-14 bg-black text-white rounded-xl font-black text-base hover:bg-zinc-800 transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ${isSavingMeeting || !meetingForm.title || !meetingForm.date ? 'opacity-30 pointer-events-none' : ''}`}
                        >
                            {isSavingMeeting ? (
                                <IconWrapper icon={Loading03Icon} size={20} className="animate-spin-fast" />
                            ) : (
                                <span>{meetingForm.id ? 'Save Changes' : 'Add to Schedule'}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
          )}

          {/* Delete Meeting Confirmation Modal */}
          {isConfirmingDeleteMeeting && (
              <div className="fixed inset-0 z-[110] bg-zinc-950 flex items-center justify-center p-6 animate-in fade-in duration-300">
                  <div className="absolute inset-0 bg-zinc-950" onClick={() => !isSavingMeeting && setIsConfirmingDeleteMeeting(false)}></div>
                 <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 sm:p-12 shadow-2xl animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-8 mx-auto">
                       <IconWrapper icon={LeftTriangleIcon} size={40} />
                    </div>
                    <h2 className="text-3xl font-display font-black text-zinc-900 text-center mb-4">Cancel Meeting?</h2>
                    <p className="text-zinc-500 text-lg text-center mb-10 leading-relaxed">
                       This action is permanent. The meeting will be removed from your schedule.
                    </p>
                    <div className="space-y-4">
                        <div 
                           onClick={confirmDeleteMeeting}
                           className={`w-full h-16 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${isSavingMeeting ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                           {isSavingMeeting ? <IconWrapper icon={Loading03Icon} size={24} className="animate-spin-fast" /> : "Yes, Cancel Meeting"}
                        </div>
                        <div 
                           onClick={() => setIsConfirmingDeleteMeeting(false)}
                           className={`w-full h-16 bg-zinc-100 text-zinc-900 font-black rounded-2xl hover:bg-zinc-200 transition-all cursor-pointer flex items-center justify-center ${isSavingMeeting ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                           Cancel
                        </div>
                    </div>
                 </div>
              </div>
          )}

          {/* Pro Upgrade Modal for 2nd Pitch */}
          {showProUpgradeModal && (
              <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
                  <div className="bg-white border border-amber-200/80 w-full max-w-lg rounded-[32px] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                      <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
                      
                      <button 
                          onClick={() => setShowProUpgradeModal(false)}
                          className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-zinc-900 rounded-full transition-colors cursor-pointer"
                      >
                          <IconWrapper icon={Cancel01Icon} size={20} />
                      </button>

                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-[10px] font-black tracking-widest uppercase mb-4">
                          ⭐ Pro Connect Feature
                      </div>

                      <h3 className="text-2xl sm:text-3xl font-display font-black text-zinc-900 mb-3 tracking-tight">
                          Add a 2nd Pitch
                      </h3>

                      <p className="text-zinc-600 text-sm font-light leading-relaxed mb-6">
                          Founders on the <strong className="text-zinc-900 font-bold">Free Plan</strong> can add up to 1 pitch. Upgrade to <strong className="text-zinc-900 font-bold">Pro Connect</strong> to add and showcase up to <strong className="text-amber-600 font-bold">2 pitches</strong> simultaneously to investors!
                      </p>

                      <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 space-y-3 mb-6 text-xs text-zinc-700 font-medium">
                          <div className="flex items-center gap-2.5">
                              <Check className="h-4 w-4 text-amber-500 shrink-0 stroke-[3]" />
                              <span>Showcase up to 2 distinct startups or product pitches</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                              <Check className="h-4 w-4 text-amber-500 shrink-0 stroke-[3]" />
                              <span>Dedicated video, teleprompter & pitch simulator for each pitch</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                              <Check className="h-4 w-4 text-amber-500 shrink-0 stroke-[3]" />
                              <span>Verified Pro badge across all startup listings</span>
                          </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                          <button
                              onClick={() => {
                                  setShowProUpgradeModal(false);
                                  if (onNavigateToSubscription) {
                                      onNavigateToSubscription();
                                  } else if (onNavigateHome) {
                                      onNavigateHome();
                                  }
                              }}
                              className="flex-1 py-3.5 px-6 bg-zinc-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-lg transition-all text-center cursor-pointer"
                          >
                              Upgrade to Pro ($5/mo)
                          </button>
                          <button
                              onClick={() => setShowProUpgradeModal(false)}
                              className="py-3.5 px-6 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs uppercase tracking-wider rounded-full transition-all text-center cursor-pointer"
                          >
                              Maybe Later
                          </button>
                      </div>
                  </div>
              </div>
          )}

          {isEditingDeck && (
            <PitchEditor 
              startup={editingPitchIndex !== null && editingPitchIndex < pitches.length ? pitches[editingPitchIndex] : null} 
              onSave={async (updated) => {
                const targetIdx = editingPitchIndex !== null ? editingPitchIndex : activePitchIndex;
                const updatedList = await StorageService.savePitch(updated, targetIdx);
                setPitches(updatedList);
                setActivePitchIndex(targetIdx < updatedList.length ? targetIdx : 0);
                setIsEditingDeck(false);
                setEditingPitchIndex(null);
              }}
              onCancel={() => {
                setIsEditingDeck(false);
                setEditingPitchIndex(null);
              }}
            />
          )}
      </div>
    </div>
  );
});

export default FounderDashboard;