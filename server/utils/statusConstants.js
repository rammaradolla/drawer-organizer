const STATUSES = {
  pending: {
    description: "The order has been placed and is awaiting payment confirmation.",
    operational_statuses: [
      "Awaiting Payment",
    ],
  },
  in_progress: {
    description: "Your custom organizer is being built by our craftsmen.",
    operational_statuses: [
      "Payment Confirmed",
      "Design Review",
      "Material Sourcing",
      "Cutting & Milling",
      "Assembly",
      "Sanding & Finishing",
      "Final Quality Check",
    ],
  },
  fulfilled: {
    description: "Your order has been completed and is on its way.",
    operational_statuses: [
      "Packaging",
      "Awaiting Carrier Pickup",
      "Shipped",
      "Delivered",
    ],
  },
  on_hold: {
    description: "There is a temporary hold on your order. We are working to resolve it.",
    operational_statuses: [
      "Blocked",
      "On Hold - Awaiting Customer Response",
      "On Hold - Supply Issue",
      "On Hold - Shop Backlog",
    ],
  },
  cancelled: {
    description: "The order has been cancelled.",
    operational_statuses: [
      "Cancelled",
    ],
  },
};

const ALL_OPERATIONAL_STATUSES = Object.values(STATUSES).flatMap(s => s.operational_statuses);

const getCustomerFacingStatus = (granularStatus) => {
  for (const highLevelStatus in STATUSES) {
    if (STATUSES[highLevelStatus].operational_statuses.includes(granularStatus)) {
      return highLevelStatus;
    }
  }
  return 'pending'; // Default fallback
};

module.exports = {
  STATUSES,
  ALL_OPERATIONAL_STATUSES,
  getCustomerFacingStatus,
}; 