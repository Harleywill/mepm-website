'use client';

import { useRef } from 'react';

interface FocalPointPickerProps {
  imageUrl: string;
  cropX: number;
  cropY: number;
  /** Fires continuously while dragging, for live UI feedback. */
  onChange: (x: number, y: number) => void;
  /** Fires once when the drag/click ends — the right moment to persist. */
  onChangeEnd?: (x: number, y: number) => void;
}

/** Click or drag on the image to choose the focal point kept visible when
 *  it's cropped to fill a fixed box elsewhere (the homepage project card). */
export default function FocalPointPicker({ imageUrl, cropX, cropY, onChange, onChangeEnd }: FocalPointPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastPos = useRef({ x: cropX, y: cropY });

  const positionFromEvent = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    const pos = positionFromEvent(e.clientX, e.clientY);
    if (pos) {
      lastPos.current = pos;
      onChange(pos.x, pos.y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const pos = positionFromEvent(e.clientX, e.clientY);
    if (pos) {
      lastPos.current = pos;
      onChange(pos.x, pos.y);
    }
  };

  const handleMouseUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    onChangeEnd?.(lastPos.current.x, lastPos.current.y);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    dragging.current = true;
    const t = e.touches[0];
    const pos = positionFromEvent(t.clientX, t.clientY);
    if (pos) {
      lastPos.current = pos;
      onChange(pos.x, pos.y);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    e.preventDefault();
    const t = e.touches[0];
    const pos = positionFromEvent(t.clientX, t.clientY);
    if (pos) {
      lastPos.current = pos;
      onChange(pos.x, pos.y);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="mepm-spec text-slate-500">
          Focal point <span className="normal-case text-slate-400">— click or drag to reposition</span>
        </span>
        <button
          type="button"
          onClick={() => {
            onChange(0.5, 0.5);
            onChangeEnd?.(0.5, 0.5);
          }}
          className="text-xs font-medium text-green-700 hover:text-green-800"
        >
          Reset to centre
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mepm-spec mb-1.5 text-slate-400">Drag to reposition</p>
          <div
            ref={containerRef}
            className="relative select-none overflow-hidden rounded-lg border border-slate-200"
            style={{ cursor: 'crosshair' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            <img
              src={imageUrl}
              alt="Set focal point"
              className="block w-full pointer-events-none"
              draggable={false}
            />
            <div
              className="pointer-events-none absolute"
              style={{ left: `${cropX * 100}%`, top: `${cropY * 100}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div
                style={{
                  position: 'absolute',
                  width: 28,
                  height: 28,
                  marginLeft: -14,
                  marginTop: -14,
                  borderRadius: '50%',
                  border: '2.5px solid #fff',
                  boxShadow: '0 0 0 1.5px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.25)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: 8,
                  height: 8,
                  marginLeft: -4,
                  marginTop: -4,
                  borderRadius: '50%',
                  background: '#68B830',
                }}
              />
            </div>
          </div>
        </div>

        <div>
          <p className="mepm-spec mb-1.5 text-slate-400">Homepage card preview</p>
          <div className="overflow-hidden rounded-lg border border-slate-200" style={{ aspectRatio: '16/9' }}>
            <img
              src={imageUrl}
              alt="Preview"
              className="pointer-events-none h-full w-full object-cover"
              style={{ objectPosition: `${cropX * 100}% ${cropY * 100}%` }}
              draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
