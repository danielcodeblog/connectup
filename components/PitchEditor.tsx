import React, { useState } from 'react';
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

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingVideo(true);
    try {
      const url = await StorageService.uploadVideo(file);
      if (url) {
        setFormData({ ...formData, videoUrl: url });
      } else {
        alert("Failed to upload video. Please try again.");
      }
    } catch (error) {
      console.error("Video upload error:", error);
      alert("An error occurred during video upload.");
    } finally {
      setIsUploadingVideo(false);
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
        className="bg-white w-full h-full sm:h-auto sm:max-w-3xl sm:rounded-[48px] shadow-2xl overflow-hidden flex flex-col relative"
      >
        {/* Header */}
        <div className="px-8 pt-10 pb-6 flex justify-between items-start border-b border-zinc-100">
          <div>
            <h2 className="text-4xl font-display font-black text-zinc-900 tracking-tighter leading-none mb-3">Refine Pitch</h2>
            <p className="text-zinc-400 text-[11px] font-black uppercase tracking-[0.25em]">Perfect your narrative for investors</p>
          </div>
          <button 
            onClick={onCancel} 
            className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-black hover:border-black transition-all shadow-sm"
          >
            <IconWrapper icon={Cancel01Icon} size={24} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-8 space-y-10 no-scrollbar">
          
          {/* Basic Info Section */}
          <div className="space-y-6">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <IconWrapper icon={PencilEdit02Icon} size={14} /> Core Identity
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Startup Name</label>
                <input 
                  type="text" 
                  value={formData.name || ''} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. QuantumFlow"
                  className="w-full bg-white border border-zinc-100 rounded-2xl px-6 py-4 text-base font-bold text-zinc-900 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Industry</label>
                <input 
                  type="text" 
                  value={formData.industry || ''} 
                  onChange={e => setFormData({...formData, industry: e.target.value})}
                  placeholder="e.g. Fintech, AI, Health"
                  className="w-full bg-white border border-zinc-100 rounded-2xl px-6 py-4 text-base font-bold text-zinc-900 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">One Liner</label>
              <input 
                type="text" 
                value={formData.oneLiner || ''} 
                onChange={e => setFormData({...formData, oneLiner: e.target.value})}
                placeholder="The world's first decentralized..."
                className="w-full bg-white border border-zinc-100 rounded-2xl px-6 py-4 text-base font-bold text-zinc-900 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
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
                  className="w-full bg-white border border-zinc-100 rounded-2xl px-6 py-4 text-base font-bold text-zinc-900 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all appearance-none"
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
                  className="w-full bg-white border border-zinc-100 rounded-2xl px-6 py-4 text-base font-bold text-zinc-900 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
                />
              </div>
            </div>
          </div>

          {/* Media Section */}
          <div className="space-y-6">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <IconWrapper icon={Video01Icon} size={14} /> Media Assets
            </h3>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Video Pitch</label>
              <div className="relative">
                <input 
                  type="file" 
                  accept="video/*"
                  onChange={handleVideoUpload}
                  disabled={isUploadingVideo}
                  className="w-full bg-white border border-zinc-100 rounded-2xl px-6 py-4 text-base font-bold text-zinc-900 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20 disabled:opacity-50"
                />
                {isUploadingVideo && (
                  <div className="absolute inset-y-0 right-6 flex items-center">
                    <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              {formData.videoUrl && !isUploadingVideo && (
                <p className="text-xs text-green-600 font-medium ml-1 mt-2">✓ Video uploaded successfully</p>
              )}
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
                className="w-full bg-white border border-zinc-100 rounded-3xl px-6 py-5 text-base font-medium text-zinc-900 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all resize-none"
              />
            </div>
          </div>

        </form>

        {/* Footer Actions */}
        <div className="px-8 py-8 bg-white border-t border-zinc-100 flex gap-4">
          <button 
            type="button"
            onClick={onCancel}
            className="px-8 py-4 bg-zinc-200 text-zinc-900 font-bold rounded-2xl hover:bg-zinc-300 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 h-16 bg-zinc-800 text-white rounded-2xl font-black text-lg hover:bg-zinc-700 transition-all active:scale-[0.98] shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSaving ? (
              <IconWrapper icon={Loading03Icon} size={24} className="animate-spin" />
            ) : (
              <>
                <span>Save</span>
                <IconWrapper icon={Upload01Icon} size={20} className="text-brand-primary" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
