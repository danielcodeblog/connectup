
// ... keep imports ...
import React, { useState, useRef, useEffect } from 'react';
import { 
  SendHorizontal, Mic, Paperclip, ChevronLeft, 
  Search, Video, MessageCircle,
  User, CheckCheck, FileText, Download,
  ImagePlus, Trash2
} from 'lucide-react';
import { UserRole, Message, ChatSession } from '../types';
import { StorageService } from '../services/storageService';
import { supabase } from '../services/supabaseClient';

interface ChatInterfaceProps {
  role: UserRole;
  activeStartupId: string | null;
  soundEnabled?: boolean;
  readReceiptsEnabled?: boolean;
  onChatStateChange?: (isOpen: boolean) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = React.memo(({ 
  role, 
  activeStartupId,
  soundEnabled = true,
  readReceiptsEnabled = true,
  onChatStateChange
}) => {
  // --- State ---
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Notification Toast State
  const [notification, setNotification] = useState<{ id: string, name: string, message: string } | null>(null);
  const notificationTimerRef = useRef<any>(null);

  // Loading States
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  // Audio/Media State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const soundRef = useRef<boolean>(soundEnabled);

  // --- Initialization ---

  // Keep ref in sync for callbacks
  useEffect(() => {
      soundRef.current = soundEnabled;
  }, [soundEnabled]);

  const playNotificationSound = () => {
      if (!soundRef.current) return;
      try {
          // Simple subtle pop sound
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(500, audioCtx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.1);
          
          gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
          
          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.1);
      } catch (e) {
          // Ignore audio context errors
      }
  };

  useEffect(() => {
    const init = async () => {
      // Use StorageService for safe mock handling
      const userId = await StorageService.getCurrentUserId();
      if (userId) {
        setCurrentUserId(userId);
        await loadChats();
      }
    };
    init();
  }, []);

  // Notify parent of state (for mobile nav hiding)
  useEffect(() => {
    onChatStateChange?.(!!selectedChatId);
  }, [selectedChatId, onChatStateChange]);

  // Handle Prop-based Match/Navigation
  useEffect(() => {
    const connectToStartup = async () => {
      if (activeStartupId) {
        // If we are already selected this chat, do nothing
        const existing = chats.find(c => c.startupId === activeStartupId);
        if (existing && selectedChatId === existing.id) return;
        
        if (existing) {
          setSelectedChatId(existing.id);
        } else {
          // Create new connection if none exists
          const newId = await StorageService.ensureConnection(activeStartupId);
          if (newId) {
            await loadChats(); // Reload chats to include the new one
            setSelectedChatId(newId);
          }
        }
      }
    };

    if (activeStartupId) {
        connectToStartup();
    }
  }, [activeStartupId, chats]); // Re-run if chats change or prop changes

  // --- Data Loading ---

  const loadChats = async () => {
    setIsLoadingChats(true);
    const data = await StorageService.getChats();
    setChats(data);
    setIsLoadingChats(false);
  };

  const loadMessages = async (chatId: string) => {
    const msgs = await StorageService.getMessages(chatId);
    setMessages(msgs);
    scrollToBottom();
  };

  // Refs for subscription stability
  const selectedChatIdRef = useRef(selectedChatId);
  const soundEnabledRef = useRef(soundEnabled);
  const roleRef = useRef(role);

  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  // --- Realtime Global Subscription for Chat List ---
  useEffect(() => {
    if (!currentUserId) return;

    const sub = StorageService.subscribeToGlobalMessages((msg) => {
        const isMe = msg.sender_id === currentUserId;

        setChats(prevChats => {
            const chatIndex = prevChats.findIndex(c => c.id === msg.chat_id);
            
            // If chat is new (not in list), reload to fetch details
            if (chatIndex === -1) {
                if (!isMe) {
                    loadChats().then(async () => {
                        const chats = await StorageService.getChats();
                        const newChat = chats.find(c => c.id === msg.chat_id);
                        if (newChat) {
                            const senderName = newChat.startupName;
                            setNotification({
                                id: Date.now().toString(),
                                name: senderName,
                                message: msg.content || (
                                    msg.type === 'image' ? 'Sent an image' : 
                                    msg.type === 'audio' ? 'Audio Message' : 
                                    msg.type === 'document' ? 'Attachment' : 'New message'
                                )
                            });
                            if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
                            notificationTimerRef.current = setTimeout(() => {
                                setNotification(null);
                            }, 4000);
                        }
                    });
                    if (soundEnabledRef.current) playNotificationSound();
                }
                return prevChats;
            }

            // Update existing chat
            const newChats = [...prevChats];
            const chat = { ...newChats[chatIndex] };
            
            chat.lastMessage = msg.content || (
                msg.type === 'image' ? 'Sent an image' : 
                msg.type === 'audio' ? 'Audio Message' : 
                msg.type === 'document' ? 'Attachment' : 'Message'
            );
            chat.timestamp = msg.created_at;

            // If incoming message is not for selected chat, notify
            if (!isMe && msg.chat_id !== selectedChatIdRef.current) {
                chat.unread = (chat.unread || 0) + 1;
                if (soundEnabledRef.current) playNotificationSound();
                
                // Show toast notification
                const senderName = (roleRef.current === UserRole.INVESTOR ? chat.startupName : chat.investorName) || 'User';
                setNotification({
                    id: Date.now().toString(),
                    name: senderName,
                    message: chat.lastMessage
                });
                
                if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
                notificationTimerRef.current = setTimeout(() => {
                    setNotification(null);
                }, 4000);
            }

            // Move to top
            newChats.splice(chatIndex, 1);
            newChats.unshift(chat);
            return newChats;
        });
    });

    return () => {
        sub.unsubscribe();
    };
  }, [currentUserId]);

  // --- Realtime Subscription for Selected Chat ---
  useEffect(() => {
    if (!selectedChatId || !currentUserId) return;

    loadMessages(selectedChatId);
    StorageService.markAllMessagesAsRead(selectedChatId);

    const subscription = StorageService.subscribeToMessages(selectedChatId, (payload) => {
      if (payload.type === 'INSERT') {
        const raw = payload.message;
        
        if (raw.sender_id !== currentUserId) {
            playNotificationSound();
            StorageService.markMessageAsRead(raw.id);
        }

        setMessages(prev => {
          if (prev.some(m => m.id === raw.id)) return prev;
          return [...prev, {
            id: raw.id,
            senderId: raw.sender_id,
            text: raw.content,
            type: raw.type,
            timestamp: raw.created_at,
            isMe: raw.sender_id === currentUserId,
            fileName: raw.file_name,
            fileSize: raw.file_size,
            duration: raw.duration,
            reactions: raw.reactions || [],
            status: raw.status
          }];
        });
        scrollToBottom();
      } else if (payload.type === 'UPDATE') {
        const raw = payload.message;
        setMessages(prev => prev.map(m => m.id === raw.id ? { ...m, status: raw.status, reactions: raw.reactions || [] } : m));
      }
    });

    const typingSub = StorageService.subscribeToTypingStatus(selectedChatId, (payload) => {
        setIsPartnerTyping(payload.isTyping);
    });

    return () => {
      subscription.unsubscribe();
      typingSub.unsubscribe();
    };
  }, [selectedChatId, currentUserId]);

  // --- Typing Status Sender ---
  useEffect(() => {
      if (!selectedChatId || !currentUserId) return;
      
      const isTyping = input.length > 0;
      StorageService.sendTypingStatus(selectedChatId, isTyping);

      // Clear typing status after 3 seconds of inactivity
      const timeout = setTimeout(() => {
          if (isTyping) StorageService.sendTypingStatus(selectedChatId, false);
      }, 3000);

      return () => clearTimeout(timeout);
  }, [input, selectedChatId, currentUserId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // --- Actions ---

  const handleSendMessage = async (overrideContent?: string, overrideType: 'text' | 'image' | 'audio' = 'text', additionalData?: any) => {
    if ((!input.trim() && !overrideContent && !isRecording) || !selectedChatId || !currentUserId) return;

    const tempId = `temp-${Date.now()}`;
    const content = overrideContent || input.trim();
    
    const optimisticMsg: Message = {
      id: tempId,
      senderId: currentUserId,
      text: content,
      type: overrideType as any,
      timestamp: new Date().toISOString(),
      isMe: true,
      ...additionalData
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setInput('');
    scrollToBottom();
    setIsSending(true);

    try {
      const saved = await StorageService.addMessage(optimisticMsg, selectedChatId);
      if (saved) {
        // Replace temp with real
        setMessages(prev => prev.map(m => m.id === tempId ? { ...saved, isMe: true } : m));
      } else {
        console.error("Failed to save message to DB");
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, text: "Failed to send: " + m.text } : m));
      }
    } catch (e) {
      console.error("Send failed", e);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChatId || !currentUserId) return;

    // TODO: Implement actual file upload to storage bucket
    // For now, mocking the DB entry as if upload succeeded
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      senderId: currentUserId,
      text: file.name,
      type: 'document',
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      timestamp: new Date().toISOString(),
      isMe: true
    };

    setMessages(prev => [...prev, optimisticMsg]);
    scrollToBottom();

    // Simulate upload delay then save
    const saved = await StorageService.addMessage(optimisticMsg, selectedChatId);
    if (saved) {
       setMessages(prev => prev.map(m => m.id === tempId ? { ...saved, isMe: true } : m));
    }
  };

  const handleVideoCall = () => {
      // Open Google Meet in a new tab
      window.open('https://meet.google.com/new', '_blank');
  };

  // --- Voice Recording Logic ---

  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                  audioChunksRef.current.push(event.data);
              }
          };

          mediaRecorder.start();
          setIsRecording(true);
          setRecordingDuration(0);

          timerRef.current = setInterval(() => {
              setRecordingDuration(prev => prev + 1);
          }, 1000);
      } catch (err) {
          console.error("Error accessing microphone:", err);
          alert("Could not access microphone. Please check permissions.");
      }
  };

  const stopRecording = (cancel = false) => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
          
          if (timerRef.current) clearInterval(timerRef.current);
          setIsRecording(false);

          if (!cancel) {
              // Allow a moment for the 'stop' event to finalize chunks
              setTimeout(() => {
                 const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                 // In a real app, upload blob to storage, get URL.
                 // For now, we'll fake a URL or just send text saying [Audio Message]
                 handleSendMessage('Audio Message', 'audio', { duration: recordingDuration });
              }, 200);
          }
      }
  };

  const formatDuration = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- Render Components ---

  const filteredChats = chats.filter(c => 
    c.startupName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeChat = chats.find(c => c.id === selectedChatId);
  const headerName = activeChat?.startupName || 'Loading...'; 
  const headerAvatar = activeChat?.avatarUrl || undefined;
  const headerSubtitle = activeChat?.subtitle || 'Active now';

  // Time formatter
  const formatTime = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-full bg-[#F5F5F5] relative overflow-hidden font-sans">
      
      {/* --- LEFT SIDEBAR (CHAT LIST) --- */}
      <div className={`
        w-full md:w-[380px] bg-white border-r border-zinc-200 flex flex-col z-20 transition-transform duration-300 absolute md:relative h-full
        ${selectedChatId ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
      `}>
        {/* Header */}
        <div className="px-3 py-3 sm:px-5 sm:py-4 border-b border-zinc-100 bg-white/80 backdrop-blur-md sticky top-0 z-10 pt-safe-top">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-display font-bold tracking-tight">Messages</h1>
            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
               <User size={16} className="text-zinc-500" />
            </div>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-100 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingChats ? (
             <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div></div>
          ) : filteredChats.length === 0 ? (
             <div className="p-8 text-center text-zinc-400 text-sm">No messages yet. Start swiping!</div>
          ) : (
             <div className="divide-y divide-zinc-50">
               {filteredChats.map(chat => (
                 <button
                   key={chat.id}
                   onClick={() => setSelectedChatId(chat.id)}
                   className={`w-full p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:bg-zinc-50 transition-colors text-left group ${selectedChatId === chat.id ? 'bg-zinc-50' : ''}`}
                 >
                   <div className="relative shrink-0">
                     {chat.avatarUrl ? <img 
                       src={chat.avatarUrl} 
                       alt={chat.startupName} 
                       className="w-12 h-12 rounded-full object-cover border border-zinc-100 shadow-sm"
                     /> : <div className="w-12 h-12 rounded-full bg-zinc-200 border border-zinc-100 shadow-sm" />}
                     {/* Online Indicator */}
                     <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                   </div>
                   
                   <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-baseline mb-1">
                       <h3 className="font-bold text-sm text-zinc-900 truncate pr-2">{chat.startupName}</h3>
                       <span className="text-[10px] text-zinc-400 font-medium whitespace-nowrap">
                         {new Date(chat.timestamp).toLocaleDateString() === new Date().toLocaleDateString() 
                            ? formatTime(chat.timestamp)
                            : new Date(chat.timestamp).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                       </span>
                     </div>
                     <p className={`text-xs truncate ${chat.unread > 0 ? 'font-bold text-zinc-900' : 'text-zinc-500'}`}>
                       {chat.lastMessage}
                     </p>
                   </div>
                   
                   {chat.unread > 0 && (
                     <div className="shrink-0 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                       {chat.unread}
                     </div>
                   )}
                 </button>
               ))}
             </div>
          )}
        </div>
      </div>

      {/* --- RIGHT SIDE (CONVERSATION) --- */}
      <div className={`
        flex-1 flex flex-col bg-[#F2F2F2] h-full absolute md:relative w-full z-30 transition-transform duration-300
        ${selectedChatId ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        {selectedChatId ? (
          <>
            {/* Chat Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-zinc-200 px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between shrink-0 sticky top-0 pt-safe-top z-20 shadow-sm">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedChatId(null)}
                  className="md:hidden p-2 -ml-2 rounded-full hover:bg-zinc-100 text-zinc-600"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <div className="relative">
                  {headerAvatar ? (
                    <img src={headerAvatar} className="w-10 h-10 rounded-full object-cover border border-zinc-100 bg-zinc-100" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500 border border-zinc-100">
                      <User size={20} />
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                
                <div className="flex flex-col">
                  <h2 className="font-bold text-sm text-zinc-900 leading-none mb-0.5">{headerName}</h2>
                  <div className="flex items-center gap-1.5 h-3">
                    {isPartnerTyping ? (
                       <div className="flex items-center gap-1 animate-in fade-in duration-300">
                          <div className="flex space-x-0.5 mt-0.5">
                             <div className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                             <div className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                             <div className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce"></div>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-medium ml-1">Typing...</span>
                       </div>
                    ) : (
                       <div className="flex items-center gap-1.5 animate-in fade-in duration-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          <span className="text-[10px] text-zinc-500 font-medium truncate max-w-[200px]">{headerSubtitle}</span>
                       </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-zinc-400 relative">
                <button 
                    onClick={handleVideoCall}
                    className="p-2 hover:bg-zinc-100 rounded-full hover:text-black transition-colors"
                    title="Start Google Meet"
                >
                    <Video size={20} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
               {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                      <p className="text-sm font-medium">No messages yet</p>
                      <p className="text-xs">Say hello to start the conversation!</p>
                  </div>
               ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.isMe;
                    const showAvatar = !isMe && (idx === 0 || messages[idx - 1].isMe);
                    
                    return (
                      <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-[85%] sm:max-w-[70%] items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          
                          {/* Avatar for Them */}
                          {!isMe && (
                            <div className="w-8 h-8 shrink-0 pb-1">
                              {showAvatar && (
                                headerAvatar ? (
                                  <img src={headerAvatar} className="w-8 h-8 rounded-full object-cover border border-zinc-200 bg-zinc-100" alt="" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500 border border-zinc-100">
                                    <User size={16} />
                                  </div>
                                )
                              )}
                            </div>
                          )}

                          {/* Bubble */}
                          <div className={`
                            relative px-4 py-2.5 rounded-[20px] shadow-sm text-[15px] leading-relaxed break-words group
                            ${isMe 
                              ? 'bg-black text-white rounded-tr-sm' 
                              : 'bg-white text-zinc-900 border border-zinc-100 rounded-tl-sm'}
                          `}>
                            
                            {/* Text Content */}
                            {msg.type === 'text' && (
                               msg.text?.startsWith('http') && (msg.text.includes('giphy') || msg.text.includes('gif')) ? (
                                   <img src={msg.text} alt="GIF" className="rounded-lg max-w-full h-auto" />
                               ) : (
                                   <p>{msg.text}</p>
                               )
                            )}

                            {/* Audio Content */}
                            {msg.type === 'audio' && (
                                <div className="flex items-center gap-3 min-w-[120px]">
                                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-black">
                                        <Mic size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold">Audio Message</span>
                                        <span className="text-[10px] text-zinc-400">{msg.duration ? formatDuration(msg.duration) : '0:00'}</span>
                                    </div>
                                </div>
                            )}

                            {/* Document Content */}
                            {msg.type === 'document' && (
                              <div className="flex items-center gap-3 pr-2">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isMe ? 'bg-white/20' : 'bg-zinc-100 text-zinc-500'}`}>
                                  <FileText size={20} />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                  <span className="font-bold text-sm truncate max-w-[150px]">{msg.fileName}</span>
                                  <span className={`text-[10px] ${isMe ? 'text-white/60' : 'text-zinc-400'}`}>{msg.fileSize}</span>
                                </div>
                                <button className={`p-1.5 rounded-full ml-2 ${isMe ? 'hover:bg-white/20' : 'hover:bg-zinc-100 text-zinc-400'}`}>
                                  <Download size={16} />
                                </button>
                              </div>
                            )}

                            {/* Metadata & Status */}
                            <div className={`
                              flex items-center justify-end gap-1 mt-1 
                              ${isMe ? 'text-white/40' : 'text-zinc-300'}
                            `}>
                              <span className="text-[10px] font-medium">{formatTime(msg.timestamp)}</span>
                              {isMe && readReceiptsEnabled && (
                                <div className="flex items-center">
                                  {msg.status === 'read' ? (
                                    <CheckCheck size={12} className="text-blue-400" />
                                  ) : (
                                    <CheckCheck size={12} className="opacity-50" />
                                  )}
                                </div>
                              )}
                            </div>

                          </div>
                        </div>
                      </div>
                    );
                  })
               )}
               <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-4 bg-white/95 backdrop-blur-md border-t border-zinc-100 sticky bottom-0 z-20 w-full" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
              
              <div className="pt-3">
              
              <div className="bg-zinc-100 rounded-[28px] pl-4 pr-3 py-3.5 flex items-center gap-3 transition-all focus-within:ring-2 focus-within:ring-black/5 focus-within:bg-white border border-transparent focus-within:border-zinc-200">
                
                {isRecording ? (
                    // Recording UI
                    <div className="flex-1 flex items-center justify-between pl-2 pr-1 animate-in fade-in">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                            <span className="text-base font-mono font-bold text-red-500">{formatDuration(recordingDuration)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => stopRecording(true)} className="px-4 py-2 text-zinc-400 hover:text-red-500 bg-zinc-50 hover:bg-red-50 rounded-full transition-all text-xs font-bold flex items-center gap-2">
                                <Trash2 size={16} /> Cancel
                            </button>
                            <button onClick={() => stopRecording(false)} className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md">
                                <SendHorizontal size={18} className="ml-0.5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    // Default Input UI
                    <>
                        <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-8 h-8 rounded-full bg-zinc-200/50 text-zinc-500 hover:text-black hover:bg-zinc-200 flex items-center justify-center transition-colors shrink-0"
                        >
                        <Paperclip size={18} />
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

                        <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Message..."
                        className="flex-1 bg-transparent text-[15px] font-medium text-zinc-900 placeholder-zinc-400 focus:outline-none"
                        style={{ minHeight: '24px' }}
                        />

                        {input.trim() ? (
                        <button 
                            onClick={() => handleSendMessage()}
                            className="w-10 h-10 rounded-full bg-brand-primary text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm shrink-0 ml-1"
                        >
                            <SendHorizontal size={18} strokeWidth={2.5} className="ml-0.5" />
                        </button>
                        ) : (
                        <button 
                            onClick={startRecording}
                            className="w-10 h-10 rounded-full bg-black text-white hover:bg-zinc-800 flex items-center justify-center transition-all shrink-0 ml-1 shadow-sm"
                        >
                            <Mic size={20} />
                        </button>
                        )}
                    </>
                )}
              </div>
              
              </div>
            </div>
          </>
        ) : (
          /* Empty State (Desktop) */
          <div className="hidden md:flex flex-1 items-center justify-center flex-col text-center p-8 bg-white/50">
             <div className="w-24 h-24 bg-gradient-to-tr from-zinc-100 to-white rounded-full shadow-xl flex items-center justify-center mb-6 border border-white">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center text-white">
                   <SendHorizontal size={32} className="ml-1" />
                </div>
             </div>
             <h2 className="text-2xl font-display font-bold text-zinc-900 mb-2">Your Conversations</h2>
             <p className="text-zinc-500 max-w-xs leading-relaxed text-sm">
               Select a chat from the sidebar to view messages, schedule meetings, or share documents.
             </p>
          </div>
        )}
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black/90 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-[90%] sm:max-w-sm">
           <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center shrink-0">
             <MessageCircle size={16} className="text-brand-primary" />
           </div>
           <div className="flex flex-col min-w-0">
             <span className="text-xs font-bold text-white/90 truncate">{notification.name}</span>
             <span className="text-sm text-white/70 truncate">{notification.message}</span>
           </div>
        </div>
      )}
    </div>
  );
});

export default ChatInterface;
