import React from "react";

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
      }}
    >
      {steps.map((step, idx) => (
        <React.Fragment key={step.label}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              minWidth: 180,
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
              style={{
                fontSize: 32,
                color: "#b0b8c1",
                margin: "0 8px",
                userSelect: "none",
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