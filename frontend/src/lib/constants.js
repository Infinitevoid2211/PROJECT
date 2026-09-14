export const RISK = {
  CRITICAL: { color: "#DC2626", bg: "#FEF2F2", ring: "#FCA5A5", label: "Critical" },
  HIGH: { color: "#EA580C", bg: "#FFF7ED", ring: "#FDBA74", label: "High" },
  MODERATE: { color: "#CA8A04", bg: "#FEFCE8", ring: "#FDE047", label: "Moderate" },
  LOW: { color: "#16A34A", bg: "#F0FDF4", ring: "#86EFAC", label: "Low" },
};

export const riskOf = (lvl) => RISK[lvl] || RISK.LOW;

export const AIZAWL_CENTER = [92.7176, 23.7271];
