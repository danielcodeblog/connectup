import React, { useState, useRef } from 'react';
import { Startup } from '../types';
import { StorageService } from '../services/storageService';
import { Loading03Icon, Cancel01Icon, Upload01Icon, PencilEdit02Icon, DashboardSquare01Icon, Activity02Icon, Video01Icon } from 'hugeicons-react';
import { IconWrapper } from './IconWrapper';
import { Button } from './Button';
import { motion, AnimatePresence } from 'motion/react';

interface PitchEditorProps {
  startup: Startup | null;
  onSave: (updatedStartup: Startup) => void;
  onCancel: () => void;
}

export const PitchEditor: React.FC<PitchEditorProps> = ({ startup, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Startup>>(startup || {
    name: '',
    oneLiner: '',
    description: '',
    industry: '',
    fundingStage: '',
    askAmount: 0,
    videoUrl: '',
    tags: []
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setIsUploadingVideo(true);
        setUploadMessage(null);
        const file = e.target.files[0];
        try {
            const url = await StorageService.uploadVideo(file);
            if (url) {
                setFormData({...formData, videoUrl: url});
                setUploadMessage("Video uploaded successfully!");
                setTimeout(() => setUploadMessage(null), 3000);
            } else {
                setUploadMessage("Failed to upload video. Please try again.");
                setTimeout(() => setUploadMessage(null), 3000);
            }
        } catch (error) {
            console.error("Video upload error:", error);
            setUploadMessage("An error occurred during upload.");
            setTimeout(() => setUploadMessage(null), 3000);
        } finally {
            setIsUploadingVideo(false);
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await StorageService.saveStartup(formData as Startup);
      onSave(formData as Startup);
    } catch (error) {
      console.error('Failed to save pitch:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xl"
    >
      <motion.div 
        initial={{ y: 100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        className="bg-zinc-900 border border-zinc-800 w-full h-full sm:h-auto sm:max-w-lg md:max-w-xl lg:max-w-xl sm:rounded-[32px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative sm:max-h-[85vh] md:max-h-[80vh]"
      >
        {/* Header */}
        <div className="px-6 sm:px-8 pt-8 pb-5 flex justify-between items-start border-b border-zinc-800 bg-zinc-900">
          <div>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tighter leading-none mb-2">Refine Pitch</h2>
          </div>
          <button 
            onClick={onCancel}
            className="p-2 text-zinc-500 hover:text-white transition-colors"
          >
            <IconWrapper icon={Cancel01Icon} size={22} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 sm:py-8 space-y-8 no-scrollbar">
          
          {/* Basic Info Section */}
          <div className="space-y-5">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <IconWrapper icon={PencilEdit02Icon} size={12} /> Core Identity
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Startup Name</label>
                <input 
                  type="text" 
                  value={formData.name || ''} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. QuantumFlow"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-5 py-3.5 text-sm sm:text-base font-bold text-white focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Industry</label>
                <input 
                  type="text" 
                  value={formData.industry || ''} 
                  onChange={e => setFormData({...formData, industry: e.target.value})}
                  placeholder="e.g. Fintech, AI, Health"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-5 py-3.5 text-sm sm:text-base font-bold text-white focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">One Liner</label>
              <input 
                type="text" 
                value={formData.oneLiner || ''} 
                onChange={e => setFormData({...formData, oneLiner: e.target.value})}
                placeholder="The world's first decentralized..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-5 py-3.5 text-sm sm:text-base font-bold text-white focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
              />
            </div>
          </div>

          {/* Investment Details */}
          <div className="space-y-6">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <IconWrapper icon={Activity02Icon} size={14} /> Investment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Funding Stage</label>
                <select 
                  value={formData.fundingStage || ''} 
                  onChange={e => setFormData({...formData, fundingStage: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-base font-bold text-white focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all appearance-none"
                >
                  <option value="">Select Stage</option>
                  <option value="Pre-Seed">Pre-Seed</option>
                  <option value="Seed">Seed</option>
                  <option value="Series A">Series A</option>
                  <option value="Series B">Series B</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Ask Amount ($)</label>
                <input 
                  type="number" 
                  value={formData.askAmount || 0} 
                  onChange={e => setFormData({...formData, askAmount: parseInt(e.target.value)})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-base font-bold text-white focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
                />
              </div>
            </div>
          </div>

          {/* Media Section */}
          <div className="space-y-6">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <IconWrapper icon={Video01Icon} size={14} /> Media Assets
            </h3>
            <div className="space-y-4">
              {uploadMessage && (
                <div className={`flex items-center gap-2 text-xs font-bold p-3 rounded-xl ${uploadMessage.includes('successfully') ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'} border`}>
                  <IconWrapper icon={Activity02Icon} size={14} />
                  <span>{uploadMessage}</span>
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <button 
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold text-white border border-zinc-700 transition-colors"
                >
                  {isUploadingVideo ? 'Uploading...' : 'Upload Video File'}
                </button>
                <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleVideoUpload} />
              </div>
              <p className="text-[10px] text-zinc-400 font-medium ml-1">Upload a video file for your pitch. We support direct video uploads.</p>
            </div>
          </div>

          {/* Detailed Description */}
          <div className="space-y-6">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <IconWrapper icon={DashboardSquare01Icon} size={14} /> The Opportunity
            </h3>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Full Description</label>
              <textarea 
                value={formData.description || ''} 
                onChange={e => setFormData({...formData, description: e.target.value})}
                rows={6}
                placeholder="Describe your vision, traction, and team..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl px-6 py-5 text-base font-medium text-white focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all resize-none"
              />
            </div>
          </div>

        </form>

        {/* Footer Actions */}
        <div className="px-6 sm:px-8 py-6 sm:py-7 bg-zinc-950/80 border-t border-zinc-800 flex gap-4">
          <div 
            onClick={handleSubmit}
            className={`flex-1 h-14 sm:h-16 bg-brand-primary text-black rounded-xl sm:rounded-2xl font-black text-base sm:text-lg hover:bg-yellow-500 transition-all active:scale-[0.98] shadow-xl flex items-center justify-center gap-3 cursor-pointer ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {isSaving ? (
              <IconWrapper icon={Loading03Icon} size={24} className="animate-spin text-black" />
            ) : (
              <>
                <span>Save</span>
                <IconWrapper icon={Upload01Icon} size={20} className="text-black" />
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
