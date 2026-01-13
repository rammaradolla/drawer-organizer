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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        width: "calc(100% + 2rem)", // Full width accounting for parent padding (px-4 = 1rem on each side)
        height: 80,
        background: "#14b8a6", // Teal color matching logo
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 20, // Reduced from 32 for better spacing
        borderRadius: 0, // No rounded corners
        margin: 0,
        marginLeft: "-1rem", // Negative margin to break out of parent padding (1rem = 16px = px-4)
        marginRight: "-1rem",
        padding: "0 32px", // Increased from 24px for better edge spacing
        overflow: "hidden",
        position: "relative",
      }}
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
              fontSize: 20,
              color: "#ffffff", // White text for contrast on teal
              letterSpacing: 0.1,
              textAlign: "right",
              display: "flex",
              alignItems: "center",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Your organizer, in 4 steps <span style={{ fontSize: 44, marginLeft: 12, display: "inline-flex", alignItems: "center", flexShrink: 0 }}>👉</span>
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
              gap: 10, // Reduced from 12 for tighter spacing
              minWidth: 160, // Reduced from 180 for more compact steps
              borderRadius: 8,
              padding: "0 12px", // Increased from 8px for better internal spacing
            }}
          >
            <img
              src={step.img}
              alt={step.alt}
              style={{
                height: 56,
                width: 56,
                objectFit: "contain",
                borderRadius: 8,
                background: "#f5f5f5",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
            />
            <span
              style={{
                fontWeight: 600,
                fontSize: 18,
                color: "#ffffff", // White text for contrast on teal
                letterSpacing: 0.2,
              }}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <span
              className={`arrow-animate${activeStep === idx ? " arrow-animate" : ""}`}
              style={{
                fontSize: 32,
                margin: "0 12px", // Increased from 8px for better arrow spacing
                userSelect: "none",
                display: "inline-block",
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