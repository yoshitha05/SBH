// data/tenants.ts

export type PaymentHistory = {
  month: string;
  amount: number;
  paidOn: string | null;
  status: "Paid" | "Late" | "Partial" | "Unpaid";
};

export type CoTenant = {
  id: string;
  name: string;
  age: string;
  phone: string;
  email: string;
  aadhar: string;
};

export type Tenant = {
  id: string;
  name: string;
  phone: string;
  email: string;
  building: string;
  flatNo: string;
  rent: number;
  status: "occupied" | "vacant" | "vacated";
  risk: "low" | "medium" | "high";
  approved: boolean;
  accessEnabled: boolean;
  upiId: string;
  monthlyDue: number;
  monthlyPaid: number;
  paymentStatus: "Paid" | "Partial" | "Unpaid" | "Pending approval" | "Overdue";
  googleFormStatus: string;
  receipts: string[];
  // NEW fields added below
  moveInDate: string;
  leaseEnd: string;
  idProof: string;
  emergencyContact: string;
  role: "admin" | "owner" | "tenant";
  paymentHistory: PaymentHistory[];
  // Added for tenant profile expansion
  age?: number;
  aadhar?: string;
  coTenants?: CoTenant[];
};

export const tenants: Tenant[] = [
  {
    id: "T001",
    name: "Ravi Kumar",
    phone: "9876543210",
    email: "ravi.kumar@example.com",
    building: "Ohm",
    flatNo: "101",
    rent: 12000,
    status: "occupied",
    risk: "low",
    approved: true,
    accessEnabled: true,
    upiId: "ravi@upi",
    monthlyDue: 12000,
    monthlyPaid: 12000,
    paymentStatus: "Paid",
    googleFormStatus: "Synced from Google Form",
    receipts: ["June 2026 Receipt", "May 2026 Receipt"],
    // NEW
    moveInDate: "2025-01-01",
    leaseEnd: "2026-12-31",
    idProof: "Aadhaar - XXXX-XXXX-1234",
    emergencyContact: "Suresh Kumar - 9876500001",
    role: "tenant",
    paymentHistory: [
      { month: "June 2026",     amount: 12000, paidOn: "2026-06-03", status: "Paid" },
      { month: "May 2026",      amount: 12000, paidOn: "2026-05-04", status: "Paid" },
      { month: "April 2026",    amount: 12000, paidOn: "2026-04-02", status: "Paid" },
      { month: "March 2026",    amount: 12000, paidOn: "2026-03-10", status: "Late" },
      { month: "February 2026", amount: 12000, paidOn: "2026-02-03", status: "Paid" },
    ],
    // Sample profile fields + co-tenants
    age: 32,
    aadhar: "1234 5678 1234",
    coTenants: [
      { id: "co1", name: "Sunita Kumar", age: "29", phone: "9876512345", email: "sunita.kumar@example.com", aadhar: "2345 6789 5678" },
      { id: "co2", name: "Aarav Kumar",  age: "6",  phone: "—",          email: "—",                          aadhar: "—" },
    ],
  },
  {
    id: "T002",
    name: "Priya Sharma",
    phone: "9876543211",
    email: "priya.sharma@example.com",
    building: "NN Elite",
    flatNo: "201",
    rent: 15000,
    status: "occupied",
    risk: "medium",
    approved: false,
    accessEnabled: false,
    upiId: "priya@upi",
    monthlyDue: 15000,
    monthlyPaid: 0,
    paymentStatus: "Pending approval",
    googleFormStatus: "Waiting for owner approval",
    receipts: [],
    // NEW
    moveInDate: "2026-06-01",
    leaseEnd: "2027-05-31",
    idProof: "PAN - ABCDE1234F",
    emergencyContact: "Meena Sharma - 9876500002",
    role: "tenant",
    paymentHistory: [],
  },
  {
    id: "T003",
    name: "Vijay Nair",
    phone: "9876543212",
    email: "vijay.nair@example.com",
    building: "Ohm",
    flatNo: "102",
    rent: 19000,
    status: "occupied",
    risk: "high",
    approved: true,
    accessEnabled: true,
    upiId: "vijay@upi",
    monthlyDue: 19000,
    monthlyPaid: 0,
    paymentStatus: "Overdue",
    googleFormStatus: "Synced from Google Form",
    receipts: ["May 2026 Receipt", "April 2026 Receipt"],
    // NEW
    moveInDate: "2024-08-01",
    leaseEnd: "2026-07-31",
    idProof: "Aadhaar - XXXX-XXXX-5678",
    emergencyContact: "Anita Nair - 9876500003",
    role: "tenant",
    paymentHistory: [
      { month: "June 2026",     amount: 0,     paidOn: null,         status: "Unpaid" },
      { month: "May 2026",      amount: 19000, paidOn: "2026-05-08", status: "Late" },
      { month: "April 2026",    amount: 19000, paidOn: "2026-04-05", status: "Paid" },
      { month: "March 2026",    amount: 19000, paidOn: "2026-03-12", status: "Late" },
      { month: "February 2026", amount: 19000, paidOn: "2026-02-06", status: "Paid" },
    ],
  },
  {
    id: "T004",
    name: "Meena Iyer",
    phone: "9876543213",
    email: "meena.iyer@example.com",
    building: "NN Elite",
    flatNo: "202",
    rent: 20000,
    status: "occupied",
    risk: "medium",
    approved: true,
    accessEnabled: true,
    upiId: "meena@upi",
    monthlyDue: 20000,
    monthlyPaid: 9000,
    paymentStatus: "Partial",
    googleFormStatus: "Synced from Google Form",
    receipts: ["May 2026 Receipt"],
    // NEW
    moveInDate: "2025-03-15",
    leaseEnd: "2027-03-14",
    idProof: "Aadhaar - XXXX-XXXX-9012",
    emergencyContact: "Raj Iyer - 9876500004",
    role: "tenant",
    paymentHistory: [
      { month: "June 2026",     amount: 9000,  paidOn: "2026-06-08", status: "Partial" },
      { month: "May 2026",      amount: 20000, paidOn: "2026-05-03", status: "Paid" },
      { month: "April 2026",    amount: 20000, paidOn: "2026-04-04", status: "Paid" },
    ],
  },
  {
    id: "T005",
    name: "Kiran Bose",
    phone: "9876543214",
    email: "kiran.bose@example.com",
    building: "Ohm",
    flatNo: "103",
    rent: 21000,
    status: "occupied",
    risk: "low",
    approved: false,
    accessEnabled: false,
    upiId: "kiran@upi",
    monthlyDue: 21000,
    monthlyPaid: 0,
    paymentStatus: "Pending approval",
    googleFormStatus: "Waiting for owner approval",
    receipts: [],
    // NEW
    moveInDate: "2026-06-12",
    leaseEnd: "2027-06-11",
    idProof: "PAN - FGHIJ5678K",
    emergencyContact: "Rina Bose - 9876500005",
    role: "tenant",
    paymentHistory: [],
  },
  {
    id: "T006",
    name: "Deepa Shah",
    phone: "9876500006",
    email: "deepa.shah@example.com",
    building: "Ohm",
    flatNo: "101",
    rent: 10500,
    status: "vacated",
    risk: "low",
    approved: true,
    accessEnabled: false,
    upiId: "deepa@upi",
    monthlyDue: 10500,
    monthlyPaid: 10500,
    paymentStatus: "Paid",
    googleFormStatus: "Synced from Google Form",
    receipts: ["December 2024 Receipt"],
    // NEW
    moveInDate: "2022-06-01",
    leaseEnd: "2024-12-31",
    idProof: "Aadhaar - XXXX-XXXX-4321",
    emergencyContact: "Kiran Shah - 9876500007",
    role: "tenant",
    paymentHistory: [
      { month: "December 2024", amount: 10500, paidOn: "2024-12-02", status: "Paid" },
      { month: "November 2024", amount: 10500, paidOn: "2024-11-03", status: "Paid" },
    ],
    age: 27,
    aadhar: "9876 5432 4321",
  },
];

// ─── Helper functions ────────────────────────────────────────────────

/** All tenants pending owner approval */
export const getPendingTenants = () =>
  tenants.filter((t) => !t.approved);

/** All tenants with login access enabled */
export const getActiveTenants = () =>
  tenants.filter((t) => t.approved && t.accessEnabled);

/** Tenants by building name */
export const getTenantsByBuilding = (building: string) =>
  tenants.filter((t) => t.building === building);

/** Single tenant by ID */
export const getTenantById = (id: string) =>
  tenants.find((t) => t.id === id) ?? null;

/** Approve a tenant (sets approved + accessEnabled to true) */
export const approveTenant = (id: string) => {
  const t = tenants.find((t) => t.id === id);
  if (t) { t.approved = true; t.accessEnabled = true; }
};

/** Vacate a tenant (disables access, marks status vacated) */
export const vacateTenant = (id: string) => {
  const t = tenants.find((t) => t.id === id);
  if (t) { t.accessEnabled = false; t.status = "vacated"; }
};
