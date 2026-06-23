// data/collections.ts

export type PaymentMode = "UPI" | "NEFT" | "IMPS" | "Cash" | "Cheque";
export type CollectionStatus = "paid" | "unpaid" | "overdue" | "partial";

export type Collection = {
  id: string;
  tenantId: string;
  tenantName: string;
  building: string;
  flatNo: string;
  amount: number;
  paymentMode: PaymentMode | null;
  receiptNo: string | null;
  dueDate: string;
  paidOn: string | null;
  status: CollectionStatus;
  month: string;
};

export const collections: Collection[] = [
  // ── Ohm ──────────────────────────────────────────────────────────
  { id: "C001", tenantId: "T001", tenantName: "Ravi Kumar",      building: "Ohm",         flatNo: "101", amount: 12000, paymentMode: "UPI",   receiptNo: "RCP-001", dueDate: "2026-06-01", paidOn: "2026-06-03", status: "paid",    month: "Jun 2026" },
  { id: "C002", tenantId: "T003", tenantName: "Vijay Nair",      building: "Ohm",         flatNo: "102", amount: 19000, paymentMode: null,    receiptNo: null,      dueDate: "2026-06-01", paidOn: null,         status: "overdue", month: "Jun 2026" },
  { id: "C003", tenantId: "T005", tenantName: "Kiran Bose",      building: "Ohm",         flatNo: "103", amount: 21000, paymentMode: null,    receiptNo: null,      dueDate: "2026-06-01", paidOn: null,         status: "unpaid",  month: "Jun 2026" },
  { id: "C004", tenantId: "T006", tenantName: "Suresh Reddy",    building: "Ohm",         flatNo: "104", amount: 14000, paymentMode: "NEFT",  receiptNo: "RCP-004", dueDate: "2026-06-01", paidOn: "2026-06-04", status: "paid",    month: "Jun 2026" },
  { id: "C005", tenantId: "T007", tenantName: "Anita Rao",       building: "Ohm",         flatNo: "105", amount: 13000, paymentMode: "UPI",   receiptNo: "RCP-005", dueDate: "2026-06-01", paidOn: "2026-06-02", status: "paid",    month: "Jun 2026" },
  { id: "C006", tenantId: "T008", tenantName: "Deepak Verma",    building: "Ohm",         flatNo: "106", amount: 15000, paymentMode: "UPI",   receiptNo: "RCP-006", dueDate: "2026-06-01", paidOn: "2026-06-08", status: "partial", month: "Jun 2026" },

  // ── NN Elite ─────────────────────────────────────────────────────
  { id: "C007", tenantId: "T002", tenantName: "Priya Sharma",    building: "NN Elite",    flatNo: "201", amount: 15000, paymentMode: null,    receiptNo: null,      dueDate: "2026-06-01", paidOn: null,         status: "unpaid",  month: "Jun 2026" },
  { id: "C008", tenantId: "T004", tenantName: "Meena Iyer",      building: "NN Elite",    flatNo: "202", amount: 20000, paymentMode: "IMPS",  receiptNo: "RCP-008", dueDate: "2026-06-01", paidOn: "2026-06-08", status: "partial", month: "Jun 2026" },
  { id: "C009", tenantId: "T015", tenantName: "Gopal Krishna",   building: "NN Elite",    flatNo: "203", amount: 15000, paymentMode: "UPI",   receiptNo: "RCP-009", dueDate: "2026-06-01", paidOn: "2026-06-05", status: "paid",    month: "Jun 2026" },
  { id: "C010", tenantId: "T016", tenantName: "Kavitha Nair",    building: "NN Elite",    flatNo: "204", amount: 16000, paymentMode: "NEFT",  receiptNo: "RCP-010", dueDate: "2026-06-01", paidOn: "2026-06-03", status: "paid",    month: "Jun 2026" },

  // ── RVB ──────────────────────────────────────────────────────────
  { id: "C011", tenantId: "T026", tenantName: "Arjun Mehta",     building: "RVB",         flatNo: "301", amount: 16000, paymentMode: "UPI",   receiptNo: "RCP-011", dueDate: "2026-06-01", paidOn: "2026-06-04", status: "paid",    month: "Jun 2026" },
  { id: "C012", tenantId: "T028", tenantName: "Prakash Rao",     building: "RVB",         flatNo: "303", amount: 14000, paymentMode: null,    receiptNo: null,      dueDate: "2026-06-01", paidOn: null,         status: "overdue", month: "Jun 2026" },
  { id: "C013", tenantId: "T032", tenantName: "Sunil Joshi",     building: "RVB",         flatNo: "307", amount: 14000, paymentMode: "Cash",  receiptNo: "RCP-013", dueDate: "2026-06-01", paidOn: "2026-06-10", status: "partial", month: "Jun 2026" },

  // ── Renuka ───────────────────────────────────────────────────────
  { id: "C014", tenantId: "T036", tenantName: "Krishna Murthy",  building: "Renuka",      flatNo: "401", amount: 15000, paymentMode: "UPI",   receiptNo: "RCP-014", dueDate: "2026-06-01", paidOn: "2026-06-02", status: "paid",    month: "Jun 2026" },
  { id: "C015", tenantId: "T038", tenantName: "Rajesh Khanna",   building: "Renuka",      flatNo: "403", amount: 16000, paymentMode: null,    receiptNo: null,      dueDate: "2026-06-01", paidOn: null,         status: "overdue", month: "Jun 2026" },
  { id: "C016", tenantId: "T042", tenantName: "Ganesh Babu",     building: "Renuka",      flatNo: "407", amount: 16000, paymentMode: "NEFT",  receiptNo: "RCP-016", dueDate: "2026-06-01", paidOn: "2026-06-07", status: "partial", month: "Jun 2026" },

  // ── Pearls ───────────────────────────────────────────────────────
  { id: "C017", tenantId: "T044", tenantName: "Venu Gopal",      building: "Pearls",      flatNo: "501", amount: 15000, paymentMode: "UPI",   receiptNo: "RCP-017", dueDate: "2026-06-01", paidOn: "2026-06-03", status: "paid",    month: "Jun 2026" },
  { id: "C018", tenantId: "T047", tenantName: "Chandrika Rao",   building: "Pearls",      flatNo: "504", amount: 16000, paymentMode: null,    receiptNo: null,      dueDate: "2026-06-01", paidOn: null,         status: "overdue", month: "Jun 2026" },
  { id: "C019", tenantId: "T051", tenantName: "Kamala Kumari",   building: "Pearls",      flatNo: "508", amount: 14000, paymentMode: "UPI",   receiptNo: "RCP-019", dueDate: "2026-06-01", paidOn: "2026-06-06", status: "partial", month: "Jun 2026" },

  // ── Sree Harsha ──────────────────────────────────────────────────
  { id: "C020", tenantId: "T056", tenantName: "Harish Babu",     building: "Sree Harsha", flatNo: "601", amount: 16000, paymentMode: "IMPS",  receiptNo: "RCP-020", dueDate: "2026-06-01", paidOn: "2026-06-04", status: "paid",    month: "Jun 2026" },
  { id: "C021", tenantId: "T058", tenantName: "Subramaniam",     building: "Sree Harsha", flatNo: "603", amount: 14000, paymentMode: null,    receiptNo: null,      dueDate: "2026-06-01", paidOn: null,         status: "overdue", month: "Jun 2026" },
  { id: "C022", tenantId: "T062", tenantName: "Prasad Rao",      building: "Sree Harsha", flatNo: "607", amount: 15000, paymentMode: "UPI",   receiptNo: "RCP-022", dueDate: "2026-06-01", paidOn: "2026-06-09", status: "partial", month: "Jun 2026" },

  // ── May 2026 history (for timeline) ──────────────────────────────
  { id: "C023", tenantId: "T001", tenantName: "Ravi Kumar",      building: "Ohm",         flatNo: "101", amount: 12000, paymentMode: "UPI",   receiptNo: "RCP-023", dueDate: "2026-05-01", paidOn: "2026-05-04", status: "paid",    month: "May 2026" },
  { id: "C024", tenantId: "T004", tenantName: "Meena Iyer",      building: "NN Elite",    flatNo: "202", amount: 20000, paymentMode: "NEFT",  receiptNo: "RCP-024", dueDate: "2026-05-01", paidOn: "2026-05-03", status: "paid",    month: "May 2026" },
  { id: "C025", tenantId: "T026", tenantName: "Arjun Mehta",     building: "RVB",         flatNo: "301", amount: 16000, paymentMode: "UPI",   receiptNo: "RCP-025", dueDate: "2026-05-01", paidOn: "2026-05-05", status: "paid",    month: "May 2026" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const getCollectionsByBuilding = (building: string) =>
  collections.filter((c) => c.building === building);

export const getCollectionsByMonth = (month: string) =>
  collections.filter((c) => c.month === month);

export const getCollectionsByTenant = (tenantId: string) =>
  collections.filter((c) => c.tenantId === tenantId);

export const getPaidReceipts = () =>
  collections.filter((c) => c.receiptNo !== null);