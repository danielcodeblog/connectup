import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, Loader2, Volume2, VolumeX } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  onLoadedData?: () => void;
  preload?: 'none' | 'metadata' | 'auto';
  controls?: boolean;
  disableIntersectionObserver?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = React.memo(({ 
  src, 
  poster,
  className = '', 
  autoPlay = false, 
  loop = false, 
  muted = false, 
  onLoadedData,
  preload = 'auto',
  controls = false,
  disableIntersectionObserver = false
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  
  useEffect(() => {
      setIsMuted(muted);
  }, [muted]);
  const [progress, setProgress] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  
  const playerRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
    
    const video = playerRef.current;
    if (!video) return;

    // Apply muted property directly to DOM element (crucial for React + browser autoplay rules)
    video.muted = isMuted;

    if (isPlaying) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromiseRef.current = playPromise;
        playPromise.then(() => {
          playPromiseRef.current = null;
        }).catch(error => {
          playPromiseRef.current = null;
          if (error.name === 'AbortError') {
             console.log("Video play aborted (temporary source switch/buffer transition):", src);
             return; // Do not turn off isPlaying
          }
          if (error.name === 'NotAllowedError') {
             console.warn("Autoplay blocked by browser policy without user interaction or unmute.");
             setIsPlaying(false);
          } else {
             console.error("Playback failed:", error);
          }
        });
      }
    } else {
      if (playPromiseRef.current) {
        playPromiseRef.current.then(() => {
          video.pause();
        }).catch(() => {
          video.pause();
        });
      } else {
        video.pause();
      }
    }
  }, [isPlaying, isMuted, src]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      const video = playerRef.current;
      if (video) {
        video.pause();
        video.src = "";
        try {
           video.load();
        } catch (e) {
           // Ignore load error during unmount
        }
      }
      setIsPlaying(false);
    };
  }, []);

  // --- INTERSECTION OBSERVER (Performance) ---
  useEffect(() => {
    if (disableIntersectionObserver) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && isPlayingRef.current) {
             setIsPlaying(false);
          } else if (entry.isIntersecting && autoPlay && !isPlayingRef.current) {
             setIsPlaying(true);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [autoPlay, disableIntersectionObserver]);

  // Sync autoPlay prop change directly to isPlaying state
  useEffect(() => {
    console.log(`VideoPlayer: autoPlay prop changed: ${autoPlay} for ${src}`);
    setIsPlaying(autoPlay);
    
    // Explicitly apply mute/play if active to bypass stale state issues
    if (playerRef.current) {
      playerRef.current.muted = isMuted;
      if (autoPlay) {
        playerRef.current.play().catch(e => {
          if (e.name !== 'AbortError') {
            console.log("Buffered autoPlay trigger handled:", e.message);
          }
        });
      }
    }
  }, [autoPlay, src, isMuted]);

  // Only load the video when the actual source URL changes, preserving buffering for the same source
  useEffect(() => {
    if (playerRef.current) {
        playerRef.current.load();
        // Keep playing if intended
        if (isPlaying) {
          playerRef.current.muted = isMuted;
          playerRef.current.play().catch(() => {});
        }
    }
  }, [src]);

  // --- HANDLERS ---
  const togglePlay = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsPlaying(!isPlaying);
    if (controls) showControlsTemporarily();
  }, [isPlaying, controls]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (controls) showControlsTemporarily();
  }, [isMuted, controls]);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (!isMounted.current) return;
    const current = e.currentTarget.currentTime;
    setCurrentTime(current);
    if (duration > 0) {
      setProgress((current / duration) * 100);
    }
    setIsBuffering(false);
    if (current > 0) setHasStarted(true);
  };

  const handleDurationChange = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (!isMounted.current) return;
    const dur = e.currentTarget.duration;
    setDuration(dur);
    if (onLoadedData) onLoadedData();
    setIsBuffering(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    const time = (val / 100) * duration;
    if (playerRef.current) {
      playerRef.current.currentTime = time;
    }
    setProgress(val);
    setCurrentTime(time);
  };

  const showControlsTemporarily = () => {
    if (!controls) return;
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
       if (isPlaying) setShowControls(false);
    }, 2000);
  };

  const handleMouseMove = () => {
      if (controls) showControlsTemporarily();
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div 
      ref={containerRef}
      className={`relative group bg-black overflow-hidden select-none ${className}`}
      onMouseMove={handleMouseMove}
      onClick={togglePlay}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={playerRef}
        src={src}
        preload={preload}
        muted={isMuted}
        playsInline
        loop={loop}
        autoPlay={autoPlay}
        crossOrigin="anonymous"
        className={`w-full h-full ${className.includes('object-cover') ? 'object-cover' : 'object-contain'} transition-opacity duration-300 ${hasStarted ? 'opacity-100' : 'opacity-0'}`}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onLoadedMetadata={() => {
            if (isPlaying && playerRef.current) {
                playerRef.current.play().catch(e => console.error("Autoplay failed:", e));
            }
        }}
        onLoadStart={() => console.log('Video load start:', src)}
        onWaiting={() => setIsBuffering(true)}
        onError={(e) => {
            const video = e.currentTarget;
            console.error('Video error:', video.error?.message, 'src:', src, 'error code:', video.error?.code);
            setIsBuffering(false);
        }}
        onPlaying={() => { 
            if (isMounted.current) { 
                setIsBuffering(false); 
                setHasStarted(true); 
            } 
        }}
        onPlay={() => {
            if (isMounted.current) {
                setHasStarted(true);
                setIsBuffering(false);
            }
        }}
        onEnded={() => {
            if (playerRef.current) {
                playerRef.current.currentTime = 0;
                if (loop) {
                  playerRef.current.play().catch(() => {});
                } else {
                  setIsPlaying(false);
                }
            }
        }}
      />
      
      {poster && !hasStarted && (
        <img 
          src={poster} 
          className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none" 
          alt="" 
        />
      )}

      {isBuffering && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/10 backdrop-blur-[1px] pointer-events-none transition-all duration-300">
           <div className="relative">
               <div className="absolute inset-0 bg-brand-primary/20 blur-xl rounded-full scale-150 animate-pulse"></div>
               <Loader2 className="w-10 h-10 text-brand-primary animate-spin relative z-10 drop-shadow-[0_0_15px_rgba(255,208,0,0.6)]" />
           </div>
        </div>
      )}

      {controls && (
        <div 
            className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 flex flex-col justify-end p-4 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}
            onClick={(e) => {
              if (e.currentTarget === e.target) {
                togglePlay(e);
              } else {
                e.stopPropagation();
              }
            }}
        >
            <div className="relative w-full h-1 bg-white/20 rounded-full mb-3 cursor-pointer group/seek">
                <div 
                    className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-150" 
                    style={{ width: `${progress}%` }}
                />
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="0.1"
                    value={progress} 
                    onChange={handleSeek}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div 
                    className="absolute top-1/2 -mt-1.5 -ml-1.5 w-3 h-3 bg-white rounded-full shadow-sm opacity-0 group-hover/seek:opacity-100 pointer-events-none transition-opacity"
                    style={{ left: `${progress}%` }}
                />
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={togglePlay} 
                        className="w-8 h-8 flex items-center justify-center text-white hover:text-white/80 transition-colors"
                    >
                        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                    </button>
                    
                    <span className="text-[10px] font-mono font-medium text-white/80 tracking-wide">
                        {formatTime(currentTime)} <span className="text-white/40">/</span> {formatTime(duration)}
                    </span>
                </div>
                
                <button 
                    onClick={toggleMute} 
                    className="w-8 h-8 flex items-center justify-center text-white hover:text-white/80 transition-colors"
                >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
            </div>
        </div>
      )}
    </div>
  );
});
