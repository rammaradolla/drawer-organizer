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
        width: "100%",
        height: 80,
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        borderRadius: 12,
        margin: "16px 0",
        padding: "0 24px",
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
            box-shadow: 0 0 0 4px #e0eaff, 0 1px 4px rgba(0,0,0,0.04);
            background: #f5faff;
          }
          .arrow-animate {
            animation: arrowPulse 1.2s infinite;
          }
          @keyframes arrowPulse {
            0% { color: #b0b8c1; transform: scale(1);}
            50% { color: #3b82f6; transform: scale(1.25);}
            100% { color: #b0b8c1; transform: scale(1);}
          }
        `}
      </style>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "center",
          marginRight: 32,
          minWidth: 220,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            marginRight: 32,
            minWidth: 260,
          }}
        >
          <span
            style={{
              fontWeight: 500,
              fontSize: 20,
              color: "#2563eb",
              letterSpacing: 0.1,
              textAlign: "right",
              display: "flex",
              alignItems: "center",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Your organizer, in 4 steps <span style={{ fontSize: 44, marginLeft: 14, display: "inline-flex", alignItems: "center" }}>👉</span>
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
              gap: 12,
              minWidth: 180,
              borderRadius: 8,
              padding: "0 8px",
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
                color: "#1a2233",
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
                margin: "0 8px",
                userSelect: "none",
                display: "inline-block",
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