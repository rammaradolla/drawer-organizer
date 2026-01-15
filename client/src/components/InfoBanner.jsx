import React, { useEffect, useState } from "react";

const steps = [
  {
    img: "/images/banner-images/Start Measuring.png",
    label: "Start Measuring",
    alt: "Start Measuring",
  },
  {
    img: "/images/banner-images/Start Designing.png",
    label: "Start Designing",
    alt: "Start Designing",
  },
  {
    img: "/images/banner-images/preview in 3D.png",
    label: "Preview in 3D",
    alt: "Preview in 3D",
  },
  {
    img: "/images/banner-images/Add to Cart.png",
    label: "Add to Cart",
    alt: "Add to Cart",
  },
];

export default function InfoBanner() {
  const [activeStep, setActiveStep] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        width: windowWidth < 640 ? "calc(100% + 1rem)" : "calc(100% + 2rem)", // Full width accounting for parent padding
        height: windowWidth < 640 ? 60 : 80, // Smaller height on mobile
        background: "#14b8a6", // Teal color matching logo
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: windowWidth < 640 ? 12 : windowWidth < 1024 ? 16 : 20, // Responsive gap
        borderRadius: 0, // No rounded corners
        margin: 0,
        marginLeft: windowWidth < 640 ? "-0.5rem" : "-1rem", // Responsive negative margin
        marginRight: windowWidth < 640 ? "-0.5rem" : "-1rem",
        padding: windowWidth < 640 ? "0 8px" : windowWidth < 1024 ? "0 16px" : "0 32px", // Responsive padding
        overflow: "hidden",
        position: "relative",
      }}
      className="banner-container"
    >
      <style>
        {`
          .step-animate {
            transition: box-shadow 0.4s, background 0.4s;
          }
          .step-active {
            box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.3), 0 2px 8px rgba(0,0,0,0.2);
            background: rgba(255, 255, 255, 0.25);
          }
          .arrow-animate {
            animation: arrowPulse 1.2s infinite;
          }
          @keyframes arrowPulse {
            0% { color: rgba(255, 255, 255, 0.7); transform: scale(1);}
            50% { color: #ffffff; transform: scale(1.25);}
            100% { color: rgba(255, 255, 255, 0.7); transform: scale(1);}
          }
        `}
      </style>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "center",
          marginRight: 24, // Reduced from 32 for tighter spacing
          minWidth: "auto",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            minWidth: "auto",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontWeight: 500,
              fontSize: windowWidth < 640 ? 14 : windowWidth < 1024 ? 16 : 20,
              color: "#ffffff", // White text for contrast on teal
              letterSpacing: 0.1,
              textAlign: "right",
              display: "flex",
              alignItems: "center",
              whiteSpace: windowWidth < 640 ? "normal" : "nowrap",
              flexShrink: 0,
            }}
            className="banner-text"
          >
            <span className="hidden sm:inline">Your organizer, in 4 steps</span>
            <span className="sm:hidden">4 steps</span>
            <span style={{ fontSize: windowWidth < 640 ? 28 : windowWidth < 1024 ? 36 : 44, marginLeft: windowWidth < 640 ? 6 : 12, display: "inline-flex", alignItems: "center", flexShrink: 0 }}>👉</span>
          </span>
        </div>
      </div>
      {steps.map((step, idx) => (
        <React.Fragment key={step.label}>
          <div
            className={`step-animate${activeStep === idx ? " step-active" : ""}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: windowWidth < 640 ? 8 : windowWidth < 1024 ? 10 : 10,
              minWidth: windowWidth < 640 ? "auto" : windowWidth < 1024 ? 120 : 160,
              borderRadius: 8,
              padding: windowWidth < 640 ? "0 6px" : windowWidth < 1024 ? "0 8px" : "0 12px",
            }}
          >
            <img
              src={step.img}
              alt={step.alt}
              style={{
                height: windowWidth < 640 ? 36 : windowWidth < 1024 ? 44 : 56,
                width: windowWidth < 640 ? 36 : windowWidth < 1024 ? 44 : 56,
                objectFit: "contain",
                borderRadius: 8,
                background: "#f5f5f5",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
            />
            <span
              style={{
                fontWeight: 600,
                fontSize: windowWidth < 640 ? 12 : windowWidth < 1024 ? 14 : 18,
                color: "#ffffff", // White text for contrast on teal
                letterSpacing: 0.2,
              }}
              className="hidden sm:inline"
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <span
              className={`arrow-animate${activeStep === idx ? " arrow-animate" : ""} hidden sm:inline-block`}
              style={{
                fontSize: windowWidth < 1024 ? 24 : 32,
                margin: windowWidth < 640 ? "0 8px" : windowWidth < 1024 ? "0 10px" : "0 12px",
                userSelect: "none",
                color: "#ffffff", // White arrow for contrast
              }}
            >
              →
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
} 