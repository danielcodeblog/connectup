
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
    <div className="flex flex-col h-screen w-full relative font-sans text-zinc-900 dark:text-zinc-100 overflow-hidden bg-zinc-50/70 dark:bg-zinc-950">
      {/* Refined Ambient Glow Background */}
      <div className="absolute inset-0 pointer-events-none fixed overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[340px] bg-gradient-to-b from-amber-400/10 via-amber-400/5 to-transparent blur-3xl opacity-80" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-zinc-200/40 dark:bg-zinc-800/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="relative z-10 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className={`sticky top-0 left-0 right-0 w-full px-4 py-3 sm:px-6 sm:py-4 safe-area-top z-[40] transition-all duration-200 backdrop-blur-xl bg-white/40 dark:bg-zinc-950/40 border-b border-zinc-200/40 dark:border-zinc-800/40 ${isEditingDeck ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
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
                     <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xs border border-zinc-200/80 dark:border-zinc-800 overflow-hidden flex flex-col">
                         <div className="p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0 border-b border-zinc-200/60 dark:border-zinc-800 w-full overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/50">
                             <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar flex-1 min-w-0 snap-x snap-mandatory pr-6">
                                 {pitches.map((pitch, idx) => (
                                     <button
                                         key={pitch.id || idx}
                                         onClick={() => setActivePitchIndex(idx)}
                                         className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border shrink-0 snap-start ${
                                             activePitchIndex === idx
                                                 ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xs"
                                                 : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                                         }`}
                                     >
                                         <IconWrapper icon={Video01Icon} size={14} />
                                         <span>{pitch.name || `Pitch #${idx + 1}`}</span>
                                         {activePitchIndex === idx && (
                                             <span className="ml-1 text-[9px] bg-amber-400 text-zinc-950 px-1.5 py-0.5 rounded-md uppercase tracking-wider font-extrabold">Active</span>
                                         )}
                                     </button>
                                 ))}

                                 {/* Add Pitch Button */}
                                 {pitches.length < 2 && (
                                     <button
                                         onClick={handleAddPitchClick}
                                         className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-amber-400 text-zinc-950 hover:bg-amber-300 cursor-pointer shadow-xs active:scale-95 shrink-0"
                                     >
                                         <IconWrapper icon={PlusSignIcon} size={14} />
                                         <span>Add Pitch</span>
                                         {userProfile?.plan !== 'pro' && pitches.length >= 1 && (
                                             <span className="ml-1 px-1.5 py-0.5 bg-zinc-950 text-white text-[9px] font-black rounded-md uppercase tracking-wider">PRO</span>
                                         )}
                                     </button>
                                 )}
                             </div>

                             <div className="flex items-center gap-2 shrink-0 ml-auto pl-2">
                                 {pitches.length > 0 && (
                                     <button
                                         onClick={() => handleDeletePitchClick(activePitchIndex)}
                                         className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors cursor-pointer flex-shrink-0 flex items-center justify-center border border-transparent hover:border-red-200 dark:hover:border-red-900/30"
                                         title="Delete pitch"
                                     >
                                         <IconWrapper icon={Delete02Icon} size={16} />
                                     </button>
                                 )}
                                 <button 
                                     onClick={() => {
                                         setEditingPitchIndex(activePitchIndex);
                                         setIsEditingDeck(true);
                                     }}
                                     className="px-3.5 py-1.5 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all cursor-pointer flex-shrink-0 flex items-center gap-1.5 text-xs font-bold shadow-xs active:scale-95"
                                     title="Edit Pitch"
                                 >
                                     <IconWrapper icon={PencilEdit02Icon} size={14} />
                                     <span>Edit Deck</span>
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
                          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-7 shadow-xs border border-zinc-200/70 dark:border-zinc-800 backdrop-blur-xl overflow-y-auto h-[500px] no-scrollbar">
                             <div className="flex items-center justify-between mb-6">
                                 <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
                                         <IconWrapper icon={Calendar01Icon} size={18} />
                                     </div>
                                     <div>
                                        <h3 className="text-base sm:text-lg font-display font-bold text-zinc-950 dark:text-white">Investor Schedule</h3>
                                        <p className="text-[11px] text-zinc-400">Manage pitch calls & partner meetings</p>
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-2">
                                     <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50">
                                         <button type="button" className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${calendarView === 'Weekly' ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`} onClick={() => setCalendarView('Weekly')}>Weekly</button>
                                         <button type="button" className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${calendarView === 'Monthly' ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`} onClick={() => setCalendarView('Monthly')}>Monthly</button>
                                     </div>
                                 </div>
                             </div>

                             {/* Calendar Strip / Grid */}
                             <div className="mb-8">
                                 {calendarView === 'Weekly' ? (
                                     <div className="relative flex justify-center items-center animate-in fade-in slide-in-from-left-4 duration-500 w-full gap-2">
                                         <button type="button" onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 7); setSelectedDate(d); }} className="w-8 h-8 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-xl text-zinc-600 dark:text-zinc-300 transition-all shrink-0 cursor-pointer"><IconWrapper icon={ArrowLeft01Icon} size={15} /></button>
                                         <div className="flex justify-center items-center px-2 gap-2 sm:gap-3 overflow-x-auto no-scrollbar w-full">
                                             {calendarDates.map((d, i) => {
                                                 const hasEvent = hasEventOnDay(d.fullDate.getDate(), d.fullDate.getMonth(), d.fullDate.getFullYear());
                                                 return (
                                                     <div key={i} onClick={() => setSelectedDate(d.fullDate)} className="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0">
                                                         <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${d.active ? 'text-zinc-950 dark:text-white font-extrabold' : 'text-zinc-400 group-hover:text-zinc-600'}`}>{d.day}</span>
                                                         <div className={`w-10 h-10 sm:w-11 sm:h-11 flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-all relative ${d.active ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-md scale-105' : 'bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'}`}>
                                                             {d.date}
                                                             {hasEvent && <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${d.active ? 'bg-amber-400' : 'bg-zinc-400'}`} />}
                                                         </div>
                                                     </div>
                                                 );
                                             })}
                                         </div>
                                         <button type="button" onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 7); setSelectedDate(d); }} className="w-8 h-8 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-xl text-zinc-600 dark:text-zinc-300 transition-all shrink-0 cursor-pointer"><IconWrapper icon={ArrowRight01Icon} size={15} /></button>
                                     </div>
                                 ) : (
                                     <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                                         <div className="flex items-center justify-between mb-4 px-2">
                                             <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">{selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
                                             <div className="flex gap-1.5">
                                                 <button type="button" onClick={() => { const d = new Date(selectedDate); d.setMonth(d.getMonth() - 1); setSelectedDate(d); }} className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-950 cursor-pointer"><IconWrapper icon={ArrowLeft01Icon} size={14} /></button>
                                                 <button type="button" onClick={() => { const d = new Date(selectedDate); d.setMonth(d.getMonth() + 1); setSelectedDate(d); }} className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-950 cursor-pointer"><IconWrapper icon={ArrowRight01Icon} size={14} /></button>
                                             </div>
                                         </div>
                                         <div className="grid grid-cols-7 gap-y-1.5 text-center">
                                             {['S','M','T','W','T','F','S'].map((d, i) => <span key={`${d}-${i}`} className="text-[10px] font-bold text-zinc-400 mb-1 uppercase">{d}</span>)}
                                             {monthData.emptySlots.map((_, i) => <div key={`empty-${i}`} className="h-8" />)}
                                             {monthData.days.map((day) => {
                                                 const isSelected = day === selectedDate.getDate() && 
                                                                  monthData.month === selectedDate.getMonth() && 
                                                                  monthData.year === selectedDate.getFullYear();
                                                 const hasEvent = hasEventOnDay(day, monthData.month, monthData.year);
                                                 return (
                                                     <div key={day} onClick={() => { const d = new Date(selectedDate); d.setDate(day); setSelectedDate(d); }} className="flex flex-col items-center justify-center cursor-pointer h-8 relative group">
                                                         <div className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${isSelected ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'}`}>{day}</div>
                                                         {hasEvent && <div className={`w-1 h-1 rounded-full absolute bottom-0 ${isSelected ? 'bg-amber-400' : 'bg-zinc-400'}`} />}
                                                     </div>
                                                 );
                                             })}
                                         </div>
                                     </div>
                                 )}
                             </div>

                             {/* Meeting List for Selected Date */}
                             <div className="space-y-2.5 animate-in fade-in duration-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                 <div className="flex items-center justify-between px-1 mb-2">
                                     <span className="text-[11px] font-semibold text-zinc-500">Calls for {selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                     <button 
                                         onClick={handleOpenAddMeeting}
                                         className="px-2.5 py-1 flex items-center gap-1.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold rounded-lg hover:bg-zinc-800 transition-all active:scale-95 shadow-xs cursor-pointer"
                                     >
                                         <IconWrapper icon={PlusSignIcon} size={13} />
                                         <span>Schedule Call</span>
                                     </button>
                                 </div>
                                 
                                 {filteredMeetings.length > 0 ? filteredMeetings.map(m => (
                                     <div key={m.id} onClick={() => handleOpenEditMeeting(m)} className="group relative flex items-center p-3.5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 hover:bg-zinc-100/80 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-xs">
                                         <div className="mr-4 min-w-[55px] text-xs font-bold text-zinc-900 dark:text-white">
                                             {new Date(m.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                         </div>
                                         <div className="flex-1 min-w-0">
                                             <h5 className="font-semibold text-sm text-zinc-950 dark:text-white truncate">{m.title}</h5>
                                             {m.guestName && <p className="text-[11px] text-zinc-400 truncate mt-0.5">{m.guestName} {m.guestEmail ? `· ${m.guestEmail}` : ''}</p>}
                                         </div>
                                         <div className="flex items-center gap-2 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                                             <IconWrapper icon={ArrowRight01Icon} size={14} />
                                         </div>
                                     </div>
                                 )) : (
                                     <div className="flex flex-col items-center justify-center py-10 text-center bg-zinc-50/40 dark:bg-zinc-800/20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                                         <IconWrapper icon={Calendar01Icon} size={22} className="text-zinc-300 dark:text-zinc-600 mb-2" />
                                         <p className="text-xs font-medium text-zinc-500">No calls scheduled for this date</p>
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
            <div className="fixed inset-0 z-[100] bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                {/* Modal Container */}
                <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
                    
                    {/* Header Section */}
                    <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900">
                        <div>
                            <h3 className="font-display font-bold text-lg sm:text-xl text-zinc-950 dark:text-white tracking-tight">Schedule Investor Call</h3>
                            <p className="text-xs text-zinc-400 mt-0.5">Add to your calendar and send direct reminders</p>
                        </div>
                        <button 
                            onClick={() => !isSavingMeeting && setIsMeetingModalOpen(false)}
                            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                            <IconWrapper icon={Cancel01Icon} size={18} />
                        </button>
                    </div>

                    {/* Body / Form Section */}
                    <div className="px-5 sm:px-6 py-3 sm:py-4 space-y-4 overflow-y-auto max-h-[70vh] no-scrollbar">
                        
                        {/* Event Title */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider ml-1">Meeting Objective</label>
                            <input 
                                type="text" 
                                value={meetingForm.title || ''} 
                                onChange={(e) => setMeetingForm(prev => ({ ...prev, title: e.target.value }))} 
                                placeholder="e.g. Series Seed Pitch with Accel" 
                                className="w-full bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-950 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 transition-all shadow-xs" 
                            />
                        </div>

                        {/* guest info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider ml-1">Guest Name</label>
                                <input 
                                    type="text" 
                                    value={meetingForm.guestName || ''} 
                                    onChange={(e) => setMeetingForm(prev => ({ ...prev, guestName: e.target.value }))} 
                                    placeholder="e.g. Sarah Jenkins" 
                                    className="w-full bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-950 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 transition-all shadow-xs" 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider ml-1">Guest Email</label>
                                <input 
                                    type="email" 
                                    value={meetingForm.guestEmail || ''} 
                                    onChange={(e) => setMeetingForm(prev => ({ ...prev, guestEmail: e.target.value }))} 
                                    placeholder="sarah@accel.com" 
                                    className="w-full bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-950 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 transition-all shadow-xs" 
                                />
                            </div>
                        </div>

                        {/* Email Reminder Toggle */}
                        <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800 rounded-2xl shadow-xs">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-amber-400/10 text-amber-500 flex items-center justify-center">
                                    <IconWrapper icon={Mail01Icon} size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-zinc-950 dark:text-white">Direct Email Reminder</p>
                                    <p className="text-[11px] text-zinc-400 font-medium">Automatic calendar invite sent upon booking</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={!!meetingForm.guestEmail} // Auto-enabled if email is provided
                                    readOnly
                                />
                                <div className="w-10 h-5 bg-zinc-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400"></div>
                            </label>
                        </div>

                        {/* Time */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider ml-1">Date</label>
                                <div className="relative group">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                                        <IconWrapper icon={Calendar01Icon} size={16} />
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
                                        className="w-full h-11 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl pl-10 pr-3 py-2 text-xs font-semibold text-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 transition-all shadow-xs" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider ml-1">Time</label>
                                <div className="relative group">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                                        <IconWrapper icon={Clock01Icon} size={16} />
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
                                        className="w-full h-11 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl pl-10 pr-3 py-2 text-xs font-semibold text-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 transition-all shadow-xs" 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider ml-1">Session Medium</label>
                            <div className="flex bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl p-1 gap-1">
                                {(['Video', 'Phone', 'In-Person'] as const).map((type) => (
                                    <button 
                                        key={type}
                                        type="button"
                                        onClick={() => setMeetingForm(prev => ({ ...prev, type }))}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            meetingForm.type === type 
                                                ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs' 
                                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Meeting Link */}
                        {(meetingForm.type === 'Video' || meetingForm.type === 'Phone') && (
                            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider ml-1">Call Room / URL</label>
                                <div className="relative group">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                                        <IconWrapper icon={LinkSquare01Icon} size={16} />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={meetingForm.meetingLink || ''} 
                                        onChange={(e) => setMeetingForm(prev => ({ ...prev, meetingLink: e.target.value }))} 
                                        placeholder={meetingForm.type === 'Video' ? "https://meet.google.com/..." : "+1 (555) 019-2834"} 
                                        className="w-full h-11 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl pl-10 pr-3 py-2 text-xs font-semibold text-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 transition-all shadow-xs" 
                                    />
                                </div>
                            </div>
                        )}


                    </div>

                    {/* Footer Section */}
                    <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex gap-3">
                        {meetingForm.id && (
                            <button 
                                type="button"
                                onClick={handleDeleteMeeting} 
                                className="w-12 h-12 bg-white dark:bg-zinc-800 border border-red-200 dark:border-red-900/40 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/20 transition-all shadow-xs cursor-pointer"
                                title="Delete Meeting"
                            >
                                <IconWrapper icon={Delete02Icon} size={18} />
                            </button>
                        )}
                        <button 
                            type="button"
                            onClick={handleSaveMeeting} 
                            disabled={isSavingMeeting || !meetingForm.title || !meetingForm.date}
                            className={`flex-1 h-12 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl font-bold text-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${isSavingMeeting || !meetingForm.title || !meetingForm.date ? 'opacity-40 pointer-events-none' : ''}`}
                        >
                            {isSavingMeeting ? (
                                <IconWrapper icon={Loading03Icon} size={18} className="animate-spin-fast" />
                            ) : (
                                <span>{meetingForm.id ? 'Save Changes' : 'Confirm & Schedule Call'}</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
          )}

          {/* Delete Meeting Confirmation Modal */}
          {isConfirmingDeleteMeeting && (
              <div className="fixed inset-0 z-[110] bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
                  <div className="absolute inset-0 bg-transparent" onClick={() => !isSavingMeeting && setIsConfirmingDeleteMeeting(false)}></div>
                 <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 w-full max-w-sm rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
                    <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-4 mx-auto border border-red-500/20">
                       <IconWrapper icon={Delete02Icon} size={24} />
                    </div>
                    <h2 className="text-xl font-display font-bold text-zinc-950 dark:text-white mb-2">Cancel Meeting?</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-6 leading-relaxed">
                       This action is permanent. The scheduled investor call will be deleted.
                    </p>
                    <div className="space-y-2.5">
                        <button 
                           onClick={confirmDeleteMeeting}
                           disabled={isSavingMeeting}
                           className={`w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${isSavingMeeting ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                           {isSavingMeeting ? <IconWrapper icon={Loading03Icon} size={18} className="animate-spin-fast" /> : "Yes, Cancel Call"}
                        </button>
                        <button 
                           onClick={() => setIsConfirmingDeleteMeeting(false)}
                           disabled={isSavingMeeting}
                           className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                        >
                           Dismiss
                        </button>
                    </div>
                 </div>
              </div>
          )}

          {/* Pro Upgrade Modal for 2nd Pitch */}
          {showProUpgradeModal && (
              <div className="fixed inset-0 z-[120] bg-zinc-950/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                      <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                      
                      <button 
                          onClick={() => setShowProUpgradeModal(false)}
                          className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-zinc-950 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
                      >
                          <IconWrapper icon={Cancel01Icon} size={18} />
                      </button>

                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/15 text-amber-600 dark:text-amber-400 border border-amber-400/25 rounded-md text-[10px] font-black tracking-wider uppercase mb-4">
                          PRO CONNECT FEATURE
                      </div>

                      <h3 className="text-2xl font-display font-black text-zinc-950 dark:text-white mb-2 tracking-tight">
                          Unlock a Second Pitch
                      </h3>

                      <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed mb-5">
                          Founders on the free tier can maintain 1 active startup pitch. Upgrade to <strong className="text-zinc-900 dark:text-white font-bold">Pro Connect</strong> to showcase up to <strong className="text-amber-500 font-bold">2 distinct ventures</strong> directly in the investor deal stream.
                      </p>

                      <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-2xl p-4 space-y-2.5 mb-6 text-xs text-zinc-700 dark:text-zinc-300">
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
                              className="flex-1 py-3 px-5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all text-center cursor-pointer active:scale-95"
                          >
                              Upgrade to Pro ($5/mo)
                          </button>
                          <button
                              onClick={() => setShowProUpgradeModal(false)}
                              className="py-3 px-5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all text-center cursor-pointer"
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