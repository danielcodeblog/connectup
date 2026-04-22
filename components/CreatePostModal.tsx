import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface CreatePostModalProps {
  userProfile: any;
  onClose: () => void;
  onPostCreated?: (post: any) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ userProfile, onClose, onPostCreated }) => {
  const [newPostContent, setNewPostContent] = useState('');
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
      const { success, post } = await StorageService.createCommunityPost(newPostContent, [], {
        name: userProfile.name,
        title: userProfile.title,
        avatarUrl: userProfile.avatarUrl
      }, selectedImage || undefined);
      
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
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isPosting && onClose()}></div>
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl md:rounded-[32px] shadow-2xl animate-in slide-in-from-bottom-8 md:zoom-in-95 duration-300 overflow-hidden flex flex-col border-t border-zinc-100 md:border border-zinc-100 h-[85vh] md:h-auto md:max-h-[90vh]">
        <div className="px-6 py-5 border-b border-zinc-50 flex justify-between items-center bg-white shrink-0">
          <h3 className="font-bold text-xl text-zinc-900">Create Post</h3>
          <button onClick={() => !isPosting && onClose()} className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400 hover:text-zinc-900">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto no-scrollbar">
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
                placeholder="Share an update with the community..."
                className="w-full min-h-[140px] text-zinc-800 bg-transparent border-none outline-none resize-none placeholder:text-zinc-300 text-lg font-medium leading-relaxed"
                autoFocus
              />
              
              {imagePreview && (
                <div className="relative rounded-2xl overflow-hidden border border-zinc-100 mb-4 bg-zinc-50">
                  <img src={imagePreview} className="w-full max-h-[400px] object-cover" alt="Preview" />
                  <button 
                    onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                    className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2.5 text-sm font-bold text-zinc-500 hover:text-brand-primary transition-colors px-3 py-2 rounded-full hover:bg-brand-primary/5"
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
                  className="px-8 py-2.5 bg-zinc-900 text-white font-bold rounded-full hover:bg-zinc-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-zinc-200 active:scale-95"
                >
                  {isPosting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
