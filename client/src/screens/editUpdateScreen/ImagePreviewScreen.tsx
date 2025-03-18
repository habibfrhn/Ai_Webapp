// ImagePreviewScreen.tsx
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
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const imgContainerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const token = localStorage.getItem('token');

  // Fetch invoice details to determine total number of pages.
  useEffect(() => {
    if (!token) return;
    fetch(`http://localhost:3000/api/invoice/${invoiceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(response => {
        if (!response.ok) throw new Error("Invoice not found");
        return response.json();
      })
      .then(data => {
        if (data.invoice && data.invoice.invoiceImages) {
          setTotalPages(data.invoice.invoiceImages.length);
        }
      })
      .catch(err => {
        console.error("Failed to fetch invoice details:", err);
      });
  }, [invoiceId, token]);

  // Fetch the image for the current page.
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    let objectUrl: string | null = null;
    // Updated endpoint to use /api/invoice/image/:id instead of the old temp endpoint.
    fetch(`http://localhost:3000/api/invoice/image/${invoiceId}?page=${currentPage}`, {
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
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load image:', err);
        setLoading(false);
      });

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [invoiceId, currentPage, token]);

  const handleImageLoad = () => {
    if (!imgContainerRef.current || !imgRef.current) return;
    const containerRect = imgContainerRef.current.getBoundingClientRect();
    const naturalWidth = imgRef.current.naturalWidth;
    const naturalHeight = imgRef.current.naturalHeight;
    const scaleToFitWidth = containerRect.width / naturalWidth;
    const scaleToFitHeight = containerRect.height / naturalHeight;
    const initialScale = Math.min(scaleToFitWidth, scaleToFitHeight);
    const imageDisplayWidth = naturalWidth * initialScale;
    const imageDisplayHeight = naturalHeight * initialScale;
    const offsetX = (containerRect.width - imageDisplayWidth) / 2;
    const offsetY = (containerRect.height - imageDisplayHeight) / 2;
    setScale(initialScale);
    setTranslate({ x: offsetX, y: offsetY });
  };

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

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.5, prev + delta));
  };

  const goToPrevious = () => {
    setCurrentPage(prev => Math.max(prev - 1, 0));
  };

  const goToNext = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
  };

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div
        ref={imgContainerRef}
        onWheel={handleWheel}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {loading ? (
          <p>Loading invoice image...</p>
        ) : imageSrc ? (
          <img
            ref={imgRef}
            src={imageSrc}
            alt={`Invoice Page ${currentPage + 1}`}
            onLoad={handleImageLoad}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
              cursor: dragging ? 'grabbing' : 'grab',
              transition: 'transform 0.1s',
              outline: 'none'
            }}
          />
        ) : (
          <p>No image available</p>
        )}
      </div>
      {totalPages > 1 && (
        <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center' }}>
          <button onClick={goToPrevious} disabled={currentPage === 0}>Previous</button>
          <span style={{ margin: '0 10px' }}>
            Page {currentPage + 1} of {totalPages}
          </span>
          <button onClick={goToNext} disabled={currentPage === totalPages - 1}>Next</button>
        </div>
      )}
    </div>
  );
};

export default ImagePreviewScreen;
