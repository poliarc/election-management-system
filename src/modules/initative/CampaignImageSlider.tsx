import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CampaignImageSliderProps {
  images: string[];
  alt: string;
  className?: string;
}

const isVideo = (url: string): boolean => {
  const lower = url.toLowerCase();
  return (
    lower.includes(".mp4") ||
    lower.includes(".webm") ||
    lower.includes(".ogg") ||
    lower.includes(".mov") ||
    lower.startsWith("data:video")
  );
};

const MediaItem: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
  if (isVideo(src)) {
    return (
      <video
        src={src}
        className={className}
        muted
        playsInline
        loop
        autoPlay
        controls={false}
      />
    );
  }
  return <img src={src} alt={alt} className={className} />;
};

export const CampaignImageSlider: React.FC<CampaignImageSliderProps> = ({
  images,
  alt,
  className = "w-full h-full object-cover",
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const validImages = images.filter(
    (img) => img && typeof img === "string" && img.trim().length > 0
  );

  if (validImages.length === 0) {
    return (
      <img
        src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800"
        alt={alt}
        className={className}
      />
    );
  }

  if (validImages.length === 1) {
    return <MediaItem src={validImages[0]} alt={alt} className={className} />;
  }

  useEffect(() => {
    // Don't auto-slide if current item is a video
    if (isVideo(validImages[currentImageIndex])) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === validImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [validImages.length, currentImageIndex]);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) =>
      prevIndex === validImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? validImages.length - 1 : prevIndex - 1
    );
  };

  return (
    <div className="relative w-full h-full group">
      <MediaItem
        src={validImages[currentImageIndex]}
        alt={`${alt} - ${currentImageIndex + 1}`}
        className={className}
      />

      {validImages.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-[var(--text-color)]/50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-[var(--text-color)]/50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>

          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200">
            {isVideo(validImages[currentImageIndex]) ? "▶ " : ""}{currentImageIndex + 1}/{validImages.length}
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
            {validImages.map((_: string, index: number) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                  index === currentImageIndex
                    ? "bg-[var(--bg-color)]"
                    : "bg-[var(--bg-color)]/50 hover:bg-[var(--bg-color)]/75"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};



