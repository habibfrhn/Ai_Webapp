import React, { useState, useRef, useEffect } from 'react';

interface ImagePreviewScreenProps {
  invoiceId: string;
}

const ImagePreviewScreen: React.FC<ImagePreviewScreenProps> = ({ invoiceId }) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  const imgContainerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Fetch the invoice image
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    let objectUrl: string | null = null;

    fetch(`http://localhost:3000/api/invoice/temp/${invoiceId}/image`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Image request failed: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        objectUrl = URL.createObjectURL(blob);
        setImageSrc(objectUrl);
      })
      .catch(err => {
        console.error('Failed to load image:', err);
      });

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [invoiceId]);

  // Compute initial scale and translation on image load
  const handleImageLoad = () => {
    if (!imgContainerRef.current || !imgRef.current) return;

    const containerRect = imgContainerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    const naturalWidth = imgRef.current.naturalWidth;
    const naturalHeight = imgRef.current.naturalHeight;

    const scaleToFitWidth = containerWidth / naturalWidth;
    const scaleToFitHeight = containerHeight / naturalHeight;
    const initialScale = Math.min(scaleToFitWidth, scaleToFitHeight);

    const imageDisplayWidth = naturalWidth * initialScale;
    const imageDisplayHeight = naturalHeight * initialScale;
    const offsetX = (containerWidth - imageDisplayWidth) / 2;
    const offsetY = (containerHeight - imageDisplayHeight) / 2;

    setScale(initialScale);
    setTranslate({ x: offsetX, y: offsetY });
  };

  // Dragging logic (only for left-click)
  const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setDragging(true);
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!dragging) return;
    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    setTranslate(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  // Zoom with mouse wheel on the container
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.5, prev + delta));
  };

  return (
    <div
      ref={imgContainerRef}
      onWheel={handleWheel}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        outline: 'none',
      }}
    >
      {imageSrc ? (
        <img
          ref={imgRef}
          src={imageSrc}
          alt="Invoice"
          onLoad={handleImageLoad}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            cursor: dragging ? 'grabbing' : 'grab',
            transition: 'transform 0.1s',
            outline: 'none',
          }}
        />
      ) : (
        <p>Loading invoice image...</p>
      )}
    </div>
  );
};

export default ImagePreviewScreen;
