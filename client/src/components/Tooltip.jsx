import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Tooltip Component
 * Shows a tooltip on hover using a portal to avoid overflow clipping
 */
const Tooltip = ({ children, text, className = '' }) => {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const wrapperRef = useRef(null);
  const tooltipRef = useRef(null);

  const updatePosition = () => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 6, // Position above the element
        left: rect.left + rect.width / 2, // Center horizontally
      });
    }
  };

  useEffect(() => {
    if (show) {
      updatePosition();
      // Update position on scroll and resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [show]);

  // Portal tooltip to document.body to avoid overflow issues
  const tooltipContent = show && typeof document !== 'undefined' ? (
    createPortal(
      <div
        ref={tooltipRef}
        className="fixed z-[99999] px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-lg whitespace-nowrap pointer-events-none"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: 'translate(-50%, -100%)',
          opacity: show ? 1 : 0,
          transition: 'opacity 0.15s ease-in-out'
        }}
      >
        {text}
        <div
          className="absolute top-full left-1/2 transform -translate-x-1/2"
          style={{
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderTop: '4px solid #111827'
          }}
        ></div>
      </div>,
      document.body
    )
  ) : null;

  return (
    <>
      <div
        ref={wrapperRef}
        className={`relative inline-block ${className}`}
        onMouseEnter={() => {
          setShow(true);
          updatePosition();
        }}
        onMouseLeave={() => setShow(false)}
        onMouseMove={updatePosition}
      >
        {children}
      </div>
      {tooltipContent}
    </>
  );
};

export default Tooltip;
