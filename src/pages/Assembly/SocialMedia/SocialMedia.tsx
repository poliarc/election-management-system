import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const SocialMediaManager = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- Form State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add'); 
  const [currentEditId, setCurrentEditId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // --- Modal State for Image Popups ---
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const initialFormState = {
    platform: 'linkedin',
    link: '',
    caption: '',
    media_type: 'image',
    media: null as File | null,
    thumbnail: null as File | null,
  };
  const [formData, setFormData] = useState(initialFormState);

  // Reusable input class
  const inputClass = "w-full px-3 py-2.5 sm:py-2 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-color)] rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all";

  // --- API Authentication Helper ---
  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_access_token'); 
    return {
      'Authorization': `Bearer ${token}`
    };
  };

  // --- 1. Fetch Data (GET) ---
  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/social-media/user-social-media?limit=100`, {
        method: 'GET',
        headers: getAuthHeaders() as any,
      });
      const result = await response.json();

      if (result.success) {
        setPosts(result.data.data || []);
      } else {
        toast.error(result.message || 'Failed to fetch social media posts');
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error('Network error while fetching posts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // --- Form Input Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setFormData({ ...formData, [name]: files[0] });
    }
  };

  const handleAddClick = () => {
    setFormData(initialFormState);
    setFormMode('add');
    setCurrentEditId(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (post: any) => {
    setCurrentEditId(post.id);
    setFormMode('edit');
    setFormData({
      platform: post.platform,
      link: post.link || '',
      caption: post.caption || '',
      media_type: post.media_type || 'image',
      media: null,
      thumbnail: null,
    });
    setIsModalOpen(true);
  };

  // --- 2. Submit Data (POST / PATCH) ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('platform', formData.platform);
      submitData.append('link', formData.link); 
      submitData.append('media_type', formData.media_type);
      
      if (formData.caption) {
        submitData.append('caption', formData.caption);
      }
      
      // Handle conditional attachments
      if (formData.media_type === 'link') {
        if (formData.thumbnail) submitData.append('thumbnail', formData.thumbnail);
      } else if (formData.media_type === 'image') {
        if (formData.media) submitData.append('media', formData.media); // Send file if uploaded
      } else if (formData.media_type === 'video') {
        if (formData.media) submitData.append('media', formData.media);
        if (formData.thumbnail) submitData.append('thumbnail', formData.thumbnail);
      }

      const url = formMode === 'add' 
        ? `${import.meta.env.VITE_API_BASE_URL}/api/social-media/create` 
        : `${import.meta.env.VITE_API_BASE_URL}/api/social-media/update/${currentEditId}`;
        
      const method = formMode === 'add' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders() as any,
        body: submitData, 
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setIsModalOpen(false);
        fetchPosts(); 
      } else {
        toast.error(result.message || 'Validation failed. Ensure link is unique.');
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error('An error occurred while saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 3. Delete Data (DELETE) ---
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/social-media/delete/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders() as any,
      });
      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        fetchPosts(); 
      } else {
        toast.error(result.message || 'Failed to delete post');
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error('Network error while deleting post');
    }
  };

  const getPlatformVisual = (platform: string, link: string) => {
    const brands: Record<string, { bg: string, text: string }> = {
      instagram: { bg: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400', text: 'Instagram' },
      facebook: { bg: 'bg-gradient-to-br from-blue-600 to-blue-800', text: 'Facebook' },
      twitter: { bg: 'bg-gradient-to-br from-gray-800 to-black', text: 'X (Twitter)' },
      youtube: { bg: 'bg-gradient-to-br from-red-600 to-red-800', text: 'YouTube' },
      linkedin: { bg: 'bg-gradient-to-br from-blue-700 to-blue-900', text: 'LinkedIn' },
      other: { bg: 'bg-gradient-to-br from-slate-600 to-slate-800', text: 'External Link' }
    };
    
    const brand = brands[platform] || brands.other;

    return (
      <a href={link} target="_blank" rel="noreferrer" className={`group relative block w-full h-full min-h-[12rem] overflow-hidden ${brand.bg}`}>
        {/* Decorative Blurred Orbs */}
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 ease-out pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-24 h-24 bg-black/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700 ease-out pointer-events-none"></div>
        
        {/* Card Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/20 group-hover:-translate-y-1 transition-transform duration-300">
            <svg className="w-6 h-6 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <span className="font-bold tracking-wide text-white drop-shadow-md mb-3">{brand.text}</span>
          
          {/* Modern CTA Pill */}
          <div className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 group-hover:bg-white/30 transition-all shadow-sm">
            <span>Visit Link</span>
            <svg className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </div>
        </div>
      </a>
    );
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 h-full flex flex-col bg-[var(--bg-main)] relative">
      
      {/* HEADER */}
      <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-4 sm:p-6 shadow-lg">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">Social Media Accounts</h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1 opacity-90">Manage and oversee social media content, posts, and links.</p>
        </div>
        <button 
          onClick={handleAddClick}
          className="px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all shadow-sm active:scale-95 border bg-white/20 text-white hover:bg-white/30 border-white/30 backdrop-blur-sm flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Add New Post
        </button>
      </div>

      {/* LIST VIEW */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm flex flex-col hover:border-emerald-300/50 hover:shadow-md transition-all group">
                
                {/* Media Display Area */}
                <div className="relative w-full h-48 bg-[var(--bg-hover)] border-b border-[var(--border-color)] overflow-hidden">
                  {post.media_type === 'image' && (
                    <div className="w-full h-full cursor-zoom-in relative" onClick={() => setPreviewImage(post.media_url)}>
                      {post.media_url ? (
                        <img src={post.media_url} alt="Post media" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No Image</div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                        <span className="opacity-0 group-hover:opacity-100 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm shadow-lg">Expand</span>
                      </div>
                    </div>
                  )}
                  {post.media_type === 'video' && (
                    <video controls className="w-full h-full object-cover bg-black" poster={post.thumbnail_url}>
                      {post.media_url && <source src={post.media_url} type="video/mp4" />}
                    </video>
                  )}
                  {post.media_type === 'link' && (
                    post.thumbnail_url ? (
                      // Modernized thumbnail link UI
                      <a href={post.link} target="_blank" rel="noreferrer" className="block w-full h-full relative cursor-pointer overflow-hidden group/link">
                        <img src={post.thumbnail_url} alt="Link thumbnail" className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/link:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover/link:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-5 py-2.5 rounded-full shadow-2xl transform translate-y-4 opacity-0 group-hover/link:translate-y-0 group-hover/link:opacity-100 transition-all duration-300 flex items-center gap-2 font-medium text-sm">
                            <span>Open Link</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          </div>
                        </div>
                      </a>
                    ) : (
                      getPlatformVisual(post.platform, post.link)
                    )
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      {post.platform} • {post.media_type}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditClick(post)}
                        className="text-xs font-bold text-sky-600 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 px-2.5 py-1 rounded-lg border border-sky-200 dark:border-sky-500/20 transition-all active:scale-95"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(post.id)}
                        className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-500/20 transition-all active:scale-95"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {post.caption && <p className="text-[var(--text-color)] text-sm mb-2 flex-1 line-clamp-3">{post.caption}</p>}
                  <a href={post.link} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline truncate mt-auto">
                    {post.link}
                  </a>
                </div>
              </div>
            ))}
            {posts.length === 0 && (
               <div className="col-span-full text-center py-16 text-[var(--text-secondary)] border-2 border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-card)]">
                 No posts found. Add one to get started!
               </div>
            )}
          </div>
        )}
      </div>

      {/* --- MODAL FORM --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4">
          <div className="bg-[var(--bg-card)] rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] sm:max-h-[95vh] overflow-hidden flex flex-col border border-[var(--border-color)] animate-slide-up sm:animate-fade-in">
            
            <div className="px-4 sm:px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex justify-between items-center sticky top-0 z-10">
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-color)] flex items-center gap-2">
                {formMode === 'edit' ? (
                  <><span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span> Edit Post #{currentEditId}</>
                ) : (
                  <><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Create New Post</>
                )}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-color)] transition-colors p-1" aria-label="Close">
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">Target Platform</label>
                    <select name="platform" value={formData.platform} onChange={handleInputChange} className={inputClass}>
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                      <option value="twitter">X (Twitter)</option>
                      <option value="youtube">YouTube</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="other">Other Platform</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">Media Type</label>
                    <select name="media_type" value={formData.media_type} onChange={handleInputChange} className={inputClass}>
                      <option value="image">Image Post</option>
                      <option value="video">Video Post</option>
                      <option value="link">Link Only</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Post URL / Origin Link <span className="text-red-500">*</span></label>
                  <input 
                    type="url" 
                    name="link" 
                    value={formData.link} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="https://..." 
                    className={inputClass} 
                  />
                  <p className="text-[10px] text-[var(--text-secondary)]">This URL must be unique across your posts.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Post Caption / Text <span className="opacity-70">(Optional)</span></label>
                  <textarea 
                    name="caption" 
                    value={formData.caption} 
                    onChange={handleInputChange} 
                    rows={3} 
                    className={`${inputClass} resize-none`} 
                    placeholder="Write your post caption..."
                  />
                </div>

                {/* Conditional Fields Wrapper for File Uploads */}
                <div className="p-4 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)] space-y-4">
                  <h4 className="text-sm font-bold text-[var(--text-color)] flex items-center gap-2 mb-2 border-b border-[var(--border-color)] pb-2">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Attachment Details
                  </h4>

                  {/* 1. Link Details */}
                  {formData.media_type === 'link' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[var(--text-secondary)]">Preview Thumbnail Image <span className="opacity-70">(Optional)</span></label>
                      <input 
                        type="file" name="thumbnail" accept="image/*" onChange={handleFileChange}
                        className="w-full text-sm text-[var(--text-secondary)] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-emerald-500/10 file:text-emerald-600 hover:file:bg-emerald-500/20 bg-[var(--bg-hover)] border border-[var(--border-color)] p-1 rounded-lg"
                      />
                      {formMode === 'edit' && <p className="text-[10px] text-[var(--text-secondary)] mt-1">Leave empty to keep current thumbnail</p>}
                    </div>
                  )}

                  {/* 2. Image Fields (File Upload Only) */}
                  {formData.media_type === 'image' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[var(--text-secondary)]">Upload Image <span className="text-red-500">*</span></label>
                      <input 
                        type="file" name="media" accept="image/*" onChange={handleFileChange} required={formMode === 'add'}
                        className="w-full text-sm text-[var(--text-secondary)] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-emerald-500/10 file:text-emerald-600 hover:file:bg-emerald-500/20 bg-[var(--bg-hover)] border border-[var(--border-color)] p-1 rounded-lg"
                      />
                      {formMode === 'edit' && <p className="text-[10px] text-[var(--text-secondary)] mt-1">Leave empty to keep current image</p>}
                    </div>
                  )}

                  {/* 3. Video Fields (File Upload Only) */}
                  {formData.media_type === 'video' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--text-secondary)]">Upload Video <span className="text-red-500">*</span></label>
                        <input 
                          type="file" name="media" accept="video/*" onChange={handleFileChange} required={formMode === 'add'}
                          className="w-full text-sm text-[var(--text-secondary)] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-emerald-500/10 file:text-emerald-600 hover:file:bg-emerald-500/20 bg-[var(--bg-hover)] border border-[var(--border-color)] p-1 rounded-lg"
                        />
                        {formMode === 'edit' && <p className="text-[10px] text-[var(--text-secondary)] mt-1">Leave empty to keep current video</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--text-secondary)]">Video Thumbnail <span className="opacity-70">(Optional)</span></label>
                        <input 
                          type="file" name="thumbnail" accept="image/*" onChange={handleFileChange}
                          className="w-full text-sm text-[var(--text-secondary)] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-emerald-500/10 file:text-emerald-600 hover:file:bg-emerald-500/20 bg-[var(--bg-hover)] border border-[var(--border-color)] p-1 rounded-lg"
                        />
                        {formMode === 'edit' && <p className="text-[10px] text-[var(--text-secondary)] mt-1">Leave empty to keep current thumbnail</p>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="mt-6 sm:mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 sm:pt-6 border-t border-[var(--border-color)]">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-6 py-3 sm:py-2.5 text-sm font-semibold text-[var(--text-color)] bg-[var(--bg-main)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className={`w-full sm:w-auto px-8 py-3 sm:py-2.5 text-sm font-bold text-white rounded-xl transition-colors shadow-md disabled:opacity-50 border ${formMode === 'edit' ? 'bg-sky-600 hover:bg-sky-700 border-sky-600' : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600'}`}>
                    {isSubmitting ? 'Saving...' : formMode === 'edit' ? 'Update Post' : 'Publish Post'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- LIGHTBOX MODAL FOR IMAGES --- */}
      {previewImage && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white bg-white/20 hover:bg-white/40 rounded-full p-2 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <img src={previewImage} alt="Enlarged preview" className="max-w-full max-h-[90vh] rounded-md shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

    </div>
  );
};

export default SocialMediaManager;