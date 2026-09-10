"use client";

import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

type ImagePreviewProps = {
  src: string;
  alt?: string;
  className?: string;
};

/** Single image that opens full-size preview on click. */
export function ImagePreview({
  src,
  alt = "",
  className = "",
}: ImagePreviewProps) {
  return (
    <PhotoProvider>
      <PhotoView src={src}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={`cursor-pointer ${className}`.trim()}
        />
      </PhotoView>
    </PhotoProvider>
  );
}

type ImagePreviewGalleryProps = {
  children: React.ReactNode;
};

/** Wrap a list of preview items to browse as one gallery. */
export function ImagePreviewGallery({ children }: ImagePreviewGalleryProps) {
  return <PhotoProvider>{children}</PhotoProvider>;
}

export function ImagePreviewItem({
  src,
  alt = "",
  className = "",
}: ImagePreviewProps) {
  return (
    <PhotoView src={src}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`cursor-pointer ${className}`.trim()}
      />
    </PhotoView>
  );
}
