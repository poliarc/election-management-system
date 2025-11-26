import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CampaignImageSliderProps {
  images: string[];
  alt: string;
  className?: string;
}

export const CampaignImageSlider: React.FC<CampaignImageSliderProps> = ({
  images,
  alt,
  className = "w-full h-full object-cover",
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Images are already parsed, just filter valid ones
  const validImages = images.filter(
    (img) => img && typeof img === "string" && img.trim().length > 0
  );

  // If no valid images, show placeholder
  if (validImages.length === 0) {
    return (
      <img
        src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800"
        alt={alt}
        className={className}
      />
    );
  }

  // If only one image, show it directly
  if (validImages.length === 1) {
    return <img src={validImages[0]} alt={alt} className={className} />;
  }

  // Auto-slide functionality for multiple images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === validImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, [validImages.length]);

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
      {/* Current Image */}
      <img
        src={validImages[currentImageIndex]}
        alt={`${alt} - Image ${currentImageIndex + 1}`}
        className={className}
      />

      {/* Navigation Arrows - only show on hover for multiple images */}
      {validImages.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>

          {/* Image Counter */}
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200">
            {currentImageIndex + 1}/{validImages.length}
          </div>

          {/* Dots Indicator */}
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
                    ? "bg-white"
                    : "bg-white/50 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
