import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface CreatePostModalProps {
  userProfile: any;
  onClose: () => void;
  onPostCreated?: (post: any) => void;
  quotedPost?: any;
  initialTopic?: string;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ userProfile, onClose, onPostCreated, quotedPost, initialTopic }) => {
  const [newPostContent, setNewPostContent] = useState(
    initialTopic ? `#${initialTopic.replace(/^#/, '')} ` : ''
  );
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    setIsPosting(true);
    try {
      const extractedTags = Array.from(newPostContent.matchAll(/#([\w-]+)/g)).map(m => m[1]);
      if (initialTopic && !extractedTags.some(t => t.toLowerCase() === initialTopic.toLowerCase())) {
        extractedTags.push(initialTopic.replace(/^#/, ''));
      }

      const { success, post } = await StorageService.createCommunityPost(
        newPostContent, 
        extractedTags, 
        {
          name: userProfile.name,
          title: userProfile.title,
          avatarUrl: userProfile.avatarUrl
        }, 
        selectedImage || undefined,
        quotedPost?.id
      );
      
      if (success && post) {
        if (onPostCreated) onPostCreated(post);
        onClose();
      }
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden touch-none sm:touch-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPosting) onClose();
      }}
    >
      <motion.div 
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        drag="y"
        dragDirectionLock
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.05, bottom: 0.8 }}
        dragSnapToOrigin
        onDragEnd={(_, info) => {
          if (info.offset.y > 100 || info.velocity.y > 350) {
            onClose();
          }
        }}
        className="relative w-full max-w-xl bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-zinc-100 max-h-[90vh]"
      >
        {/* Mobile Drag Handle */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden bg-white shrink-0 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-zinc-300 rounded-full"></div>
        </div>

        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-white shrink-0">
          <h3 className="font-bold text-xl text-zinc-900 font-display">Create Post</h3>
          <button onClick={() => !isPosting && onClose()} className="p-2 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400 hover:text-zinc-900 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto no-scrollbar flex-1">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-zinc-50 shrink-0">
              {userProfile?.avatarUrl ? (
                <img src={userProfile.avatarUrl} className="w-full h-full object-cover" alt="You" />
              ) : (
                <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-400 font-bold">
                  {userProfile?.name?.[0] || 'U'}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <textarea 
                value={newPostContent}
                onChange={e => setNewPostContent(e.target.value)}
                placeholder={quotedPost ? "Add a comment..." : "Share an update with the community..."}
                className="w-full min-h-[140px] text-zinc-800 bg-transparent border-none outline-none resize-none placeholder:text-zinc-300 text-lg font-medium leading-relaxed"
                autoFocus
              />
              
              {quotedPost && (
                <div className="border border-zinc-100 rounded-2xl p-4 bg-zinc-50/50 mb-4 pointer-events-none">
                  <div className="flex items-center gap-2 mb-2">
                    <img src={quotedPost.avatar} className="w-5 h-5 rounded-full" alt="" />
                    <span className="text-xs font-bold text-zinc-900">{quotedPost.author}</span>
                  </div>
                  <p className="text-sm text-zinc-600 line-clamp-2">{quotedPost.content}</p>
                </div>
              )}
              
              {imagePreview && (
                <div className="relative rounded-2xl overflow-hidden border border-zinc-100 mb-4 bg-zinc-50">
                  <img src={imagePreview} className="w-full max-h-[400px] object-cover" alt="Preview" />
                  <button 
                    onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                    className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-black/70 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2.5 text-sm font-bold text-zinc-500 hover:text-brand-primary transition-colors px-3 py-2 rounded-full hover:bg-brand-primary/5 cursor-pointer"
                >
                  <ImageIcon className="w-5 h-5" />
                  <span>Add Image</span>
                </button>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  ref={fileInputRef}
                  onChange={handleImageSelect} 
                />
                
                <button 
                  onClick={handleCreatePost}
                  disabled={isPosting || !newPostContent.trim()}
                  className="px-8 py-2.5 bg-zinc-900 text-white font-bold rounded-full hover:bg-zinc-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-zinc-200 active:scale-95 cursor-pointer"
                >
                  {isPosting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
