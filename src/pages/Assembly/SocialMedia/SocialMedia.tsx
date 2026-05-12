import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

// --- Small Helper Component for the Live Countdown ---
const Countdown = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const diff = new Date(targetDate).getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft('Publishing soon...');
        return;
      }
      
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      
      if (d > 0) setTimeLeft(`${d}d ${h}h left`);
      else if (h > 0) setTimeLeft(`${h}h ${m}m left`);
      else setTimeLeft(`${m}m left`);
    };

    updateTime(); // initial call
    const interval = setInterval(updateTime, 60000); // update every minute
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="flex items-center justify-center w-[140px] gap-1.5 px-2 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-lg text-[10px] font-bold shadow-sm shadow-amber-500/5 backdrop-blur-sm">
      <svg className="w-3 h-3 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      {timeLeft}
    </div>
  );
};

const SocialMediaManager = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  
  // --- Refs ---
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- Form State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add'); 
  const [currentEditId, setCurrentEditId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false); 
  
  // --- Modal State for Image Popups & Read More ---
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [viewPostModal, setViewPostModal] = useState<any | null>(null);

  // --- Share Modal State ---
  const [shareModalData, setShareModalData] = useState<any | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isPreparingMedia, setIsPreparingMedia] = useState(false);
  
  const initialFormState = {
    platform: 'linkedin',
    link: '',
    caption: '',
    media_type: 'image',
    upcoming_date: '',
    image: null as File | null,
    video: null as File | null,
    thumbnail: null as File | null,
  };
  const [formData, setFormData] = useState(initialFormState);

  const inputClass = "w-full px-4 py-3 bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-color)] rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-[var(--text-secondary)]/50";

  const getCurrentContext = () => {
    let hType = "stateMasterData";
    let hId = null;
    try {
      const authState = localStorage.getItem('auth_state');
      if (authState) {
        const parsed = JSON.parse(authState);
        const sa = parsed?.selectedAssignment;
        if (sa) {
          if (sa.afterAssemblyData_id) {
            hType = "afterAssemblyData";
            hId = sa.afterAssemblyData_id;
          } else if (sa.stateMasterData_id) {
            hType = "stateMasterData";
            hId = sa.stateMasterData_id;
          }
        }
      }
    } catch(e) {}
    return { hierarchy_type: hType, hierarchy_id: hId };
  };

  const getAuthHeaders = () => {
    return { 'Authorization': `Bearer ${localStorage.getItem('auth_access_token')}` };
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const ctx = getCurrentContext();
      let url = `${import.meta.env.VITE_API_BASE_URL}/api/social-media/user-social-media?limit=100`;
      if (ctx.hierarchy_id) {
        url += `&hierarchy_type=${ctx.hierarchy_type}&hierarchy_id=${ctx.hierarchy_id}`;
      }
      const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() as any });
      const result = await response.json();
      if (result.success) setPosts(result.data || []);
    } catch (error) {
      toast.error('Network error while fetching posts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    try {
      const authUserStr = localStorage.getItem('auth_user');
      if (authUserStr) {
        const userObj = JSON.parse(authUserStr);
        setCurrentUserId(userObj.user_id || userObj.id); 
      }
    } catch (e) {}
    fetchPosts();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) setFormData({ ...formData, [name]: files[0] });
  };

  const handleAddClick = () => {
    setFormData(initialFormState);
    setIsScheduled(false);
    setFormMode('add');
    setCurrentEditId(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (post: any) => {
    setCurrentEditId(post.id);
    setFormMode('edit');
    setIsScheduled(!!post.upcoming_date);
    
    let formattedDate = '';
    if (post.upcoming_date) {
      const d = new Date(post.upcoming_date);
      const tzOffset = d.getTimezoneOffset() * 60000; 
      formattedDate = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
    }

    setFormData({
      platform: post.platform,
      link: post.link || '',
      caption: post.caption || '',
      media_type: post.media_type || 'link',
      upcoming_date: formattedDate,
      image: null,
      video: null,
      thumbnail: null,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('platform', formData.platform);
      if (formData.link) submitData.append('link', formData.link); 
      if (formData.caption) submitData.append('caption', formData.caption);
      
      if (isScheduled && formData.upcoming_date) {
         const d = new Date(formData.upcoming_date);
         const sqlDate = d.getFullYear() + "-" + 
           ("0"+(d.getMonth()+1)).slice(-2) + "-" +
           ("0" + d.getDate()).slice(-2) + " " +
           ("0" + d.getHours()).slice(-2) + ":" +
           ("0" + d.getMinutes()).slice(-2) + ":00";
         submitData.append('upcoming_date', sqlDate);
      }

      const ctx = getCurrentContext();
      if (ctx.hierarchy_id) {
        submitData.append('hierarchy_type', ctx.hierarchy_type);
        submitData.append('hierarchy_id', ctx.hierarchy_id.toString());
      }

      let detectedMediaType = 'link';
      if (formMode === 'edit') {
        const existingPost = posts.find(p => p.id === currentEditId);
        if (existingPost) detectedMediaType = existingPost.media_type;
      }
      if (formData.video) {
        detectedMediaType = 'video';
        submitData.append('media', formData.video);
      } else if (formData.image) {
        detectedMediaType = 'image';
        submitData.append('media', formData.image); 
      }

      submitData.append('media_type', detectedMediaType);
      if (formData.thumbnail) submitData.append('thumbnail', formData.thumbnail);

      const url = formMode === 'add' 
        ? `${import.meta.env.VITE_API_BASE_URL}/api/social-media/create` 
        : `${import.meta.env.VITE_API_BASE_URL}/api/social-media/update/${currentEditId}`;
        
      const response = await fetch(url, {
        method: formMode === 'add' ? 'POST' : 'PATCH',
        headers: getAuthHeaders() as any,
        body: submitData, 
      });

      const result = await response.json();
      if (result.success) {
        toast.success(result.message || 'Post saved successfully');
        setIsModalOpen(false);
        fetchPosts(); 
      } else {
        toast.error(result.message || 'Validation failed.');
      }
    } catch (error) {
      toast.error('An error occurred while saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/social-media/delete/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders() as any,
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Post deleted successfully");
        fetchPosts(); 
      }
    } catch (error) {
      toast.error('Network error while deleting post');
    }
  };

  const handleShare = async (post: any) => {
    let fullMediaUrl = post.media_url || post.thumbnail_url; 
    if (fullMediaUrl && !fullMediaUrl.startsWith('http')) {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      fullMediaUrl = `${baseUrl}/${fullMediaUrl.replace(/^\//, '')}`;
    }

    const shareUrl = post.media_type === 'link' 
      ? (post.link || window.location.href) 
      : (fullMediaUrl || post.link || window.location.href);

    let customShareText = post.caption ? `${post.caption}\n\n${shareUrl}` : shareUrl;

    if (post.media_type === 'link' && post.thumbnail_url) {
      let tUrl = post.thumbnail_url;
      if (!tUrl.startsWith('http')) {
        tUrl = `${import.meta.env.VITE_API_BASE_URL}/${tUrl.replace(/^\//, '')}`;
      }
      customShareText += `\n\nThumbnail: ${tUrl}`;
    }

    if (post.upcoming_date && new Date(post.upcoming_date) > new Date()) {
      const dateObj = new Date(post.upcoming_date);
      const dateStr = dateObj.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      customShareText = `*Scheduled for ${dateStr}*\n\n${customShareText}`;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(customShareText);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = customShareText;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 3000);
    } catch (err) {
      toast.error("Failed to copy link");
    }

    setMediaFile(null);
    setShareModalData({ 
      ...post, 
      resolvedShareUrl: shareUrl, 
      fullMediaUrl,
      whatsappText: customShareText
    });
  };

  useEffect(() => {
    const fetchMediaForSharing = async () => {
      if (!shareModalData) return;
      const { media_type, fullMediaUrl } = shareModalData;
      
      const isExternalSocialLink = fullMediaUrl && (
        fullMediaUrl.includes('facebook.com/watch') || 
        fullMediaUrl.includes('youtube.com/watch') 
      );

      if (fullMediaUrl && !isExternalSocialLink) {
        setIsPreparingMedia(true);
        try {
          let response;
          try {
            response = await fetch(fullMediaUrl);
            if (!response.ok) throw new Error("Direct fetch failed");
          } catch (directErr) {
            const proxyUrl = `${import.meta.env.VITE_API_BASE_URL}/api/social-media/proxy-media?url=${encodeURIComponent(fullMediaUrl)}`;
            response = await fetch(proxyUrl, { headers: getAuthHeaders() as any });
            if (!response.ok) throw new Error(`Proxy fetch failed`);
          }
          
          const blob = await response.blob();
          let extension = 'jpg';
          let mimeType = blob.type; 
          
          if (media_type === 'video' || fullMediaUrl.endsWith('.mp4')) {
             extension = 'mp4';
             mimeType = 'video/mp4'; 
          } else if (media_type === 'image' || media_type === 'link') {
             if (!mimeType || !mimeType.startsWith('image/')) {
                 mimeType = 'image/jpeg';
                 extension = 'jpg';
             } else {
                 extension = mimeType.split('/')[1] || 'jpg';
             }
          }

          const filename = `shared-media-${Date.now()}.${extension}`;
          const cleanBlob = new Blob([blob], { type: mimeType });
          setMediaFile(new File([cleanBlob], filename, { type: mimeType }));
        } catch (err: any) {
          console.error("Failed to prepare media:", err);
        } finally {
          setIsPreparingMedia(false);
        }
      }
    };
    fetchMediaForSharing();
  }, [shareModalData]);

  const triggerDownloadFallback = () => {
    if (!mediaFile) return;
    try {
      const objectUrl = window.URL.createObjectURL(mediaFile);
      const linkElement = document.createElement('a');
      linkElement.style.display = 'none';
      linkElement.href = objectUrl;
      linkElement.download = mediaFile.name;
      document.body.appendChild(linkElement);
      linkElement.click();
      window.URL.revokeObjectURL(objectUrl);
      document.body.removeChild(linkElement);
      toast.success("Media downloaded to your device!");
    } catch (dlError) {
      toast.error("Failed to download file.");
    }
  };

  const executeFileShare = async () => {
    if (!mediaFile || !shareModalData) return;
    
    if (shareModalData.media_type === 'video') {
       triggerDownloadFallback();
       return;
    }

    const shareDataFull: any = {
      title: `Check out this ${shareModalData.platform} post`,
      text: shareModalData.whatsappText, 
      files: [mediaFile]
    };

    const shareDataFileOnly: any = {
      files: [mediaFile]
    };

    const shareDataTextOnly: any = {
      title: shareDataFull.title,
      text: shareDataFull.text
    };

    if (navigator.share && navigator.canShare) {
      if (navigator.canShare(shareDataFull)) {
        try {
          await navigator.share(shareDataFull);
          return;
        } catch (error: any) {
          if (error.name === 'AbortError') return;
        }
      }

      if (shareModalData.media_type !== 'link' && navigator.canShare(shareDataFileOnly)) {
        try {
          if (navigator.clipboard) {
              await navigator.clipboard.writeText(shareModalData.whatsappText).catch(()=>{});
          }
          toast.success("Caption copied! Select app to share media.", { duration: 4000 });
          await navigator.share(shareDataFileOnly);
          return;
        } catch (error: any) {
          if (error.name === 'AbortError') return;
        }
      }

      if (shareModalData.media_type === 'link') {
          toast.error("OS restricted file sharing. Sharing text instead...", { duration: 3000 });
          try { await navigator.share(shareDataTextOnly); } catch(e){}
      } else {
          toast.error("Native media share unavailable. Downloading instead...", { duration: 3000 });
          triggerDownloadFallback();
      }
    } else {
      if (shareModalData.media_type === 'link' && navigator.share) {
          try { await navigator.share(shareDataTextOnly); } catch(e){}
      } else {
          triggerDownloadFallback();
      }
    }
  };

  const getPlatformVisual = (platform: string, link: string) => {
    const brands: Record<string, { bg: string, shadow: string, text: string, icon: React.ReactNode }> = {
      instagram: { 
        bg: 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600', 
        shadow: 'shadow-pink-500/20',
        text: 'Instagram',
        icon: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 1.738-6.98 6.082-.058 1.28-.072 1.688-.072 4.947s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.28.058 1.689.072 4.947.072s3.668-.014 4.947-.072c4.358-.2 6.78-1.738 6.98-6.082.058-1.28.072-1.689.072-4.947s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.28-.058-1.689-.072-4.947-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      },
      facebook: { 
        bg: 'bg-gradient-to-br from-blue-500 to-blue-700', 
        shadow: 'shadow-blue-500/20',
        text: 'Facebook',
        icon: <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
      },
      twitter: { 
        bg: 'bg-gradient-to-br from-gray-800 to-black', 
        shadow: 'shadow-gray-500/20',
        text: 'X (Twitter)',
        icon: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      },
      youtube: { 
        bg: 'bg-gradient-to-br from-red-500 to-red-700', 
        shadow: 'shadow-red-500/20',
        text: 'YouTube',
        icon: <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      },
      linkedin: { 
        bg: 'bg-gradient-to-br from-sky-600 to-blue-800', 
        shadow: 'shadow-sky-500/20',
        text: 'LinkedIn',
        icon: <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
      },
      other: { 
        bg: 'bg-gradient-to-br from-slate-600 to-slate-800', 
        shadow: 'shadow-slate-500/20',
        text: 'External Link',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      }
    };
    
    const brand = brands[platform] || brands.other;

    return (
      <a href={link || "#"} target="_blank" rel="noreferrer" className={`group relative block w-full h-full min-h-[14rem] overflow-hidden ${brand.bg}`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10">
          <div className={`w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center mb-4 shadow-xl border border-white/30 group-hover:-translate-y-2 transition-transform duration-500 ease-out`}>
            <svg className="w-8 h-8 text-white drop-shadow-md" fill={platform === 'other' ? 'none' : 'currentColor'} stroke={platform === 'other' ? 'currentColor' : 'none'} viewBox="0 0 24 24">
              {brand.icon}
            </svg>
          </div>
          <span className="font-extrabold tracking-wide text-white drop-shadow-md mb-4 text-lg">{brand.text}</span>
        </div>
      </a>
    );
  };

  // --- DATA SPLITTING FOR SECTIONS ---
  const now = new Date();
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(now.getDate() - 3);

  const upcomingPosts = posts.filter(p => p.upcoming_date && new Date(p.upcoming_date) > now);
  
  const recentPosts = posts.filter(p => {
    if (p.upcoming_date && new Date(p.upcoming_date) > now) return false;
    const postDate = new Date(p.upcoming_date || p.created_at);
    return postDate >= threeDaysAgo;
  });

  const marqueeItems = [...recentPosts, ...recentPosts, ...recentPosts];

  // Render a Single Post Card
  const renderPostCard = (post: any, isUpcoming = false) => (
    <div key={post.id + Math.random()} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm hover:shadow-xl hover:border-emerald-500/30 transition-all duration-300 group flex flex-col hover:-translate-y-1 overflow-hidden w-[85vw] mx-auto sm:mx-0 sm:min-w-[320px] max-w-[360px] sm:max-w-[400px] shrink-0 snap-center">
      
      <div className="relative w-full h-48 bg-[var(--bg-hover)] overflow-hidden">
        {post.media_type === 'image' && (
          <div className="w-full h-full cursor-zoom-in relative" onClick={() => setPreviewImage(post.media_url)}>
            {post.media_url ? (
              <img src={post.media_url.startsWith('http') ? post.media_url : `${import.meta.env.VITE_API_BASE_URL}/${post.media_url.replace(/^\//, '')}`} alt="Post media" className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-secondary)]/50 gap-2 bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-hover)]">
                <span className="text-sm font-medium">No Image</span>
              </div>
            )}
          </div>
        )}
        
        {post.media_type === 'video' && (
          <div className="w-full h-full relative bg-black">
            <video controls className="w-full h-full object-contain" poster={post.thumbnail_url}>
              {post.media_url && <source src={post.media_url.startsWith('http') ? post.media_url : `${import.meta.env.VITE_API_BASE_URL}/${post.media_url.replace(/^\//, '')}`} type="video/mp4" />}
            </video>
          </div>
        )}
        
        {post.media_type === 'link' && (
          post.thumbnail_url ? (
            <a href={post.link || "#"} target="_blank" rel="noreferrer" className="block w-full h-full relative cursor-pointer overflow-hidden group/link">
              <img src={post.thumbnail_url.startsWith('http') ? post.thumbnail_url : `${import.meta.env.VITE_API_BASE_URL}/${post.thumbnail_url.replace(/^\//, '')}`} alt="Link thumbnail" className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/link:scale-110" />
            </a>
          ) : (
            getPlatformVisual(post.platform, post.link)
          )
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col bg-[var(--bg-card)] relative">
        <div className="flex justify-between items-start mb-4 gap-2">
          
          <div className="flex flex-col gap-2 items-start">
            <span className="inline-flex items-center justify-center w-[140px] px-2 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              {post.platform} <span className="mx-1.5 opacity-50">•</span> {post.media_type}
            </span>
            
            <span className="inline-flex items-center justify-center w-[140px] px-2 py-1.5 rounded-lg text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--bg-hover)] border border-[var(--border-color)]" title="Date Created">
              <svg className="w-3 h-3 mr-1 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {post.upcoming_date ? new Date(post.upcoming_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            
            {isUpcoming && <Countdown targetDate={post.upcoming_date} />}
          </div>
          
          <div className="flex gap-1 shrink-0">
            <button onClick={() => handleShare(post)} className="p-1.5 text-[var(--text-secondary)] hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors" title="Share Post">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </button>
            
            {post.user_id === currentUserId && (
              <>
                <button onClick={() => handleEditClick(post)} className="p-1.5 text-[var(--text-secondary)] hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10 rounded-lg transition-colors" title="Edit Post">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button onClick={() => handleDelete(post.id)} className="p-1.5 text-[var(--text-secondary)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Delete Post">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </>
            )}
          </div>
        </div>
        
        {post.caption && (
          <div className="flex-1 flex flex-col mt-auto pt-1">
            <p className="text-[var(--text-color)] text-sm line-clamp-3 leading-relaxed font-medium">
              {post.caption}
            </p>
            {post.caption.length > 100 && (
              <button 
                onClick={() => setViewPostModal(post)}
                className="text-emerald-600 dark:text-emerald-400 text-xs font-bold mt-1.5 self-start hover:underline"
              >
                Read More
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 min-h-full flex flex-col bg-[var(--bg-main)] relative">
      
      {/* INJECT MARQUEE ANIMATION CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee ${recentPosts.length * 8}s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      {/* HEADER */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 sm:p-8 shadow-xl shadow-teal-900/10 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
        
        <div className="relative z-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Social Media Hub</h2>
          <p className="text-emerald-100 mt-2 text-sm font-medium">Manage upcoming broadcasts and view recent activity.</p>
        </div>
        <button 
          onClick={handleAddClick}
          className="relative z-10 shrink-0 px-6 py-3 text-sm font-bold rounded-xl transition-all shadow-lg active:scale-95 border bg-white/20 text-white hover:bg-white/30 border-white/40 backdrop-blur-md flex items-center justify-center gap-2 hover:shadow-white/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
          Create Post
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-32">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-t-2 border-emerald-600 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-r-2 border-teal-500 animate-spin-reverse"></div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8 pb-12">
          
          {/* SECTION 1: UPCOMING POSTS */}
          {upcomingPosts.length > 0 && (
            <section className="bg-[var(--bg-card)] border border-amber-500/20 rounded-3xl p-6 shadow-lg shadow-amber-500/5 relative shrink-0">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-t-3xl"></div>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <h3 className="text-xl font-extrabold text-[var(--text-color)]">Scheduled & Upcoming</h3>
                </div>
              </div>
              
              {/* UPDATED: Added relative wrapper and pushed absolute buttons to the exact section borders */}
              <div className="relative w-full group">
                
                <button 
                   onClick={() => scrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' })} 
                   className="absolute -left-5 sm:-left-6 top-[45%] -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-[var(--bg-card)]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-[var(--border-color)] text-emerald-600 dark:text-emerald-400 hover:scale-110 hover:bg-[var(--bg-hover)] transition-all"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                </button>
                
                <div 
                  ref={scrollRef} 
                  className="flex overflow-x-auto pb-4 gap-4 snap-x snap-mandatory hide-scrollbar -mx-6 px-6"
                >
                  {upcomingPosts.map(post => renderPostCard(post, true))}
                </div>

                <button 
                   onClick={() => scrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' })} 
                   className="absolute -right-5 sm:-right-6 top-[45%] -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-[var(--bg-card)]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-[var(--border-color)] text-emerald-600 dark:text-emerald-400 hover:scale-110 hover:bg-[var(--bg-hover)] transition-all"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </section>
          )}

          {/* SECTION 2: RECENT POSTS (3-Day Marquee) */}
          <section className="flex flex-col shrink-0 min-h-[400px]">
            <div className="flex items-center gap-3 mb-6 px-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-[var(--text-color)]">Recent Activity</h3>
                <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">Posts from the last 3 days</p>
              </div>
            </div>

            {recentPosts.length > 0 ? (
              <div className="relative w-full overflow-hidden py-4 border-y border-[var(--border-color)] bg-[var(--bg-main)]">
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[var(--bg-main)] to-transparent z-10 pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[var(--bg-main)] to-transparent z-10 pointer-events-none"></div>
                
                <div className="animate-marquee gap-4">
                  {marqueeItems.map((post) => renderPostCard(post, false))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-[var(--border-color)] rounded-3xl bg-[var(--bg-card)]/50 mx-2">
                 <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                 </div>
                 <h3 className="text-lg font-bold text-[var(--text-color)] mb-2">No Recent Posts</h3>
                 <p className="text-[var(--text-secondary)] text-sm max-w-xs mx-auto mb-6">You haven't posted anything in the last 3 days.</p>
                 <button onClick={handleAddClick} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-emerald-500/20">
                   Create New Post
                 </button>
              </div>
            )}
          </section>

        </div>
      )}

      {/* --- MODAL FORM --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-md sm:p-4">
          <div className="bg-[var(--bg-card)] rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/40 w-full max-w-2xl max-h-[90vh] sm:max-h-[95vh] overflow-hidden flex flex-col border border-[var(--border-color)] animate-slide-up sm:animate-fade-in relative">
            
            <div className="px-6 py-5 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex justify-between items-center sticky top-0 z-10">
              <h3 className="text-xl font-extrabold text-[var(--text-color)] flex items-center gap-3">
                {formMode === 'edit' ? (
                  <><span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse shadow-[0_0_8px_rgba(14,165,233,0.8)]"></span> Edit Post</>
                ) : (
                  <><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> Create New Post</>
                )}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-color)] bg-[var(--bg-hover)] hover:bg-[var(--border-color)] rounded-full p-2 transition-all">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="p-4 rounded-2xl bg-[var(--bg-hover)]/50 border border-[var(--border-color)]">
                   <div className="flex items-center justify-between">
                     <div>
                       <h4 className="text-sm font-extrabold text-[var(--text-color)] flex items-center gap-2">
                         <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                         Schedule Post (Optional)
                       </h4>
                       <p className="text-xs text-[var(--text-secondary)] mt-1">Set a future date for this post to appear in the Upcoming queue.</p>
                     </div>
                     
                     <label className="relative inline-flex items-center cursor-pointer">
                       <input type="checkbox" className="sr-only peer" checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} />
                       <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
                     </label>
                   </div>

                   {isScheduled && (
                     <div className="mt-4 pt-4 border-t border-[var(--border-color)] animate-fade-in">
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">Select Publish Date & Time</label>
                        <input 
                          type="datetime-local" 
                          name="upcoming_date" 
                          value={formData.upcoming_date} 
                          onChange={handleInputChange} 
                          required={isScheduled}
                          min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                          className={`${inputClass} !py-2.5`}
                        />
                     </div>
                   )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Target Platform</label>
                  <select name="platform" value={formData.platform} onChange={handleInputChange} className={inputClass}>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="twitter">X (Twitter)</option>
                    <option value="youtube">YouTube</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="other">Other Platform</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Post Link <span className="opacity-60 normal-case font-medium ml-1">(Optional)</span></label>
                  <input type="url" name="link" value={formData.link} onChange={handleInputChange} placeholder="https://..." className={inputClass} />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Caption <span className="opacity-60 normal-case font-medium ml-1">(Optional)</span></label>
                  <textarea name="caption" value={formData.caption} onChange={handleInputChange} rows={4} className={`${inputClass} resize-none`} placeholder="Write something engaging..." />
                </div>

                <div className="p-5 bg-[var(--bg-hover)]/50 rounded-2xl border border-[var(--border-color)] space-y-5">
                  <div>
                    <h4 className="text-sm font-extrabold text-[var(--text-color)] flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      Media Attachments
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Image File</label>
                      <div className="relative">
                        <input type="file" name="image" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className={`w-full px-4 py-3 border-2 border-dashed ${formData.image ? 'border-emerald-500 bg-emerald-500/5' : 'border-[var(--border-color)] bg-[var(--bg-main)]'} rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors`}>
                          <span className={formData.image ? 'text-emerald-600 dark:text-emerald-400 truncate max-w-[150px]' : 'text-[var(--text-secondary)]'}>
                            {formData.image ? formData.image.name : 'Choose Image'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Video File</label>
                      <div className="relative">
                        <input type="file" name="video" accept="video/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className={`w-full px-4 py-3 border-2 border-dashed ${formData.video ? 'border-emerald-500 bg-emerald-500/5' : 'border-[var(--border-color)] bg-[var(--bg-main)]'} rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors`}>
                          <span className={formData.video ? 'text-emerald-600 dark:text-emerald-400 truncate max-w-[150px]' : 'text-[var(--text-secondary)]'}>
                            {formData.video ? formData.video.name : 'Choose Video'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Thumbnail <span className="opacity-60 normal-case">(For Videos/Links)</span></label>
                      <div className="relative">
                        <input type="file" name="thumbnail" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className={`w-full px-4 py-3 border-2 border-dashed ${formData.thumbnail ? 'border-sky-500 bg-sky-500/5' : 'border-[var(--border-color)] bg-[var(--bg-main)]'} rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors`}>
                          <span className={formData.thumbnail ? 'text-sky-600 dark:text-sky-400 truncate max-w-[200px]' : 'text-[var(--text-secondary)]'}>
                            {formData.thumbnail ? formData.thumbnail.name : 'Upload Custom Thumbnail'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-[var(--border-color)]">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-[var(--text-color)] bg-[var(--bg-main)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] rounded-xl transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className={`w-full sm:w-auto px-8 py-3 text-sm font-bold text-white rounded-xl transition-all shadow-lg hover:-translate-y-0.5 ${isScheduled ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/30' : formMode === 'edit' ? 'bg-sky-600 hover:bg-sky-500 shadow-sky-500/30' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30'}`}>
                    {isSubmitting ? 'Saving...' : isScheduled ? 'Schedule Post' : formMode === 'edit' ? 'Update Post' : 'Publish Post'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- READ MORE MODAL --- */}
      {viewPostModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setViewPostModal(null)}>
          <div className="bg-[var(--bg-card)] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-[var(--border-color)] animate-slide-up flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-[var(--border-color)] flex justify-between items-center sticky top-0 z-10 bg-[var(--bg-card)]">
              <h3 className="text-xl font-extrabold text-[var(--text-color)]">Post Details</h3>
              <button onClick={() => setViewPostModal(null)} className="text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-full p-2 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              {viewPostModal.media_url && viewPostModal.media_type === 'image' && (
                <img src={viewPostModal.media_url.startsWith('http') ? viewPostModal.media_url : `${import.meta.env.VITE_API_BASE_URL}/${viewPostModal.media_url.replace(/^\//, '')}`} alt="Post media" className="w-full h-48 object-cover rounded-xl mb-4" />
              )}
              
              {viewPostModal.media_type === 'video' && (
                <video controls className="w-full h-48 rounded-xl mb-4 bg-black object-contain" poster={viewPostModal.thumbnail_url}>
                  {viewPostModal.media_url && <source src={viewPostModal.media_url.startsWith('http') ? viewPostModal.media_url : `${import.meta.env.VITE_API_BASE_URL}/${viewPostModal.media_url.replace(/^\//, '')}`} type="video/mp4" />}
                </video>
              )}

              <h4 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Caption</h4>
              <p className="text-[var(--text-color)] text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {viewPostModal.caption}
              </p>

              {viewPostModal.link && (
                <div className="mt-4">
                  <h4 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Link</h4>
                  <a href={viewPostModal.link} target="_blank" rel="noreferrer" className="text-sky-500 hover:underline text-sm break-all font-medium">
                    {viewPostModal.link}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOM SHARE MODAL --- */}
      {shareModalData && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShareModalData(null)}>
          <div className="bg-[var(--bg-card)] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-[var(--border-color)] animate-slide-up flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-extrabold text-[var(--text-color)]">Share Post</h3>
                <button onClick={() => setShareModalData(null)} className="text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-full p-2 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 transition-colors ${copiedToClipboard ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400'}`}>
                {copiedToClipboard ? (
                  <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ) : (
                  <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                )}
                <div className="overflow-hidden">
                  <p className="font-bold text-sm">{copiedToClipboard ? "Link & Caption Copied!" : "Ready to Share"}</p>
                  <p className="text-xs opacity-80 mt-0.5 truncate w-full">
                    {shareModalData.resolvedShareUrl}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Share Text Via</p>
                  <div className="grid grid-cols-2 gap-3">
                    <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareModalData.whatsappText)}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-color)] hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 transition-all group">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                      </div>
                      <span className="font-bold text-[var(--text-color)] text-sm">WhatsApp</span>
                    </a>

                    <a href={`mailto:?subject=Check out this post&body=${encodeURIComponent(shareModalData.whatsappText)}`} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-color)] hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                      </div>
                      <span className="font-bold text-[var(--text-color)] text-sm">Email</span>
                    </a>
                  </div>
                </div>

                {shareModalData.fullMediaUrl ? (
                  <div className="pt-6 border-t border-[var(--border-color)]">
                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                      {shareModalData.media_type === 'video' ? 'Download Media' : 'Share Native Post'}
                    </p>
                    {isPreparingMedia ? (
                      <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-[var(--bg-hover)] border border-dashed border-[var(--border-color)]">
                        <svg className="animate-spin h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span className="text-sm font-semibold text-[var(--text-color)]">Fetching Media from server...</span>
                      </div>
                    ) : mediaFile ? (
                      <button onClick={executeFileShare} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all font-bold shadow-lg shadow-emerald-500/20 active:scale-95">
                        {shareModalData.media_type === 'video' ? (
                           <>
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                             Download Video to Device
                           </>
                        ) : navigator.canShare && navigator.canShare({ files: [mediaFile] }) ? (
                           <>
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                             Share Image & Text Natively
                           </>
                        ) : (
                           <>
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                             {shareModalData.media_type === 'link' ? 'Native Share Link (Thumbnail unsupported)' : 'Download Image to Device'}
                           </>
                        )}
                      </button>
                    ) : (
                      navigator.share && (
                        <button 
                          onClick={() => navigator.share({
                            title: `Check out this ${shareModalData.platform} post`,
                            text: shareModalData.whatsappText, 
                          })}
                          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] hover:bg-[var(--border-color)] text-[var(--text-color)] text-sm font-bold transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                          Native Share Text (Media Failed)
                        </button>
                      )
                    )}
                  </div>
                ) : (
                  navigator.share && (
                    <button 
                      onClick={() => navigator.share({
                        title: `Check out this ${shareModalData.platform} post`,
                        text: shareModalData.whatsappText, 
                      })}
                      className="mt-3 w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] hover:bg-[var(--border-color)] text-[var(--text-color)] text-sm font-bold transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                      Native Share Link & Text
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- LIGHTBOX MODAL FOR IMAGES --- */}
      {previewImage && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md transition-opacity" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-6 right-6 text-white/50 hover:text-white bg-white/5 hover:bg-white/20 rounded-full p-3 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <img src={previewImage} alt="Enlarged preview" className="max-w-[95vw] max-h-[90vh] rounded-xl shadow-2xl ring-1 ring-white/10" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default SocialMediaManager;