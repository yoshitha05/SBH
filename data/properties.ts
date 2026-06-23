export type FlatStatus = "paid" | "overdue" | "partial" | "vacant" | "pending";

export type Flat = {
  flatNo: string;
  tenantId: string | null;
  tenantName: string | null;
  rent: number;
  status: FlatStatus;
};

export type Property = {
  id: string;
  name: string;
  address: string;
  totalFlats: number;
  occupiedFlats: number;
  vacantFlats: number;
  monthlyCollection: number;
  tenantCount: number;
  flats: Flat[];
};

export const properties: Property[] = [
  {
    id: "ohm",
    name: "Ohm",
    address: "Banjara Hills, Hyderabad",
    totalFlats: 15,
    occupiedFlats: 12,
    vacantFlats: 3,
    monthlyCollection: 180000,
    tenantCount: 12,
    flats: [
      { flatNo: "101", tenantId: "T001", tenantName: "Ravi Kumar",      rent: 12000, status: "paid" },
      { flatNo: "102", tenantId: "T003", tenantName: "Vijay Nair",      rent: 19000, status: "overdue" },
      { flatNo: "103", tenantId: "T005", tenantName: "Kiran Bose",      rent: 21000, status: "pending" },
      { flatNo: "104", tenantId: "T006", tenantName: "Suresh Reddy",    rent: 14000, status: "paid" },
      { flatNo: "105", tenantId: "T007", tenantName: "Anita Rao",       rent: 13000, status: "paid" },
      { flatNo: "106", tenantId: "T008", tenantName: "Deepak Verma",    rent: 15000, status: "partial" },
      { flatNo: "107", tenantId: "T009", tenantName: "Lakshmi Devi",    rent: 14000, status: "paid" },
      { flatNo: "108", tenantId: "T010", tenantName: "Rahul Singh",     rent: 16000, status: "paid" },
      { flatNo: "109", tenantId: "T011", tenantName: "Pooja Menon",     rent: 13000, status: "paid" },
      { flatNo: "110", tenantId: "T012", tenantName: "Arun Kumar",      rent: 15000, status: "paid" },
      { flatNo: "111", tenantId: "T013", tenantName: "Sita Ramesh",     rent: 14000, status: "paid" },
      { flatNo: "112", tenantId: "T014", tenantName: "Venkat Rao",      rent: 14000, status: "paid" },
      { flatNo: "113", tenantId: null,   tenantName: null,              rent: 0,     status: "vacant" },
      { flatNo: "114", tenantId: null,   tenantName: null,              rent: 0,     status: "vacant" },
      { flatNo: "115", tenantId: null,   tenantName: null,              rent: 0,     status: "vacant" },
    ],
  },
  {
    id: "nn-elite",
    name: "NN Elite",
    address: "Jubilee Hills, Hyderabad",
    totalFlats: 15,
    occupiedFlats: 13,
    vacantFlats: 2,
    monthlyCollection: 195000,
    tenantCount: 13,
    flats: [
      { flatNo: "201", tenantId: "T002", tenantName: "Priya Sharma",    rent: 15000, status: "pending" },
      { flatNo: "202", tenantId: "T004", tenantName: "Meena Iyer",      rent: 20000, status: "partial" },
      { flatNo: "203", tenantId: "T015", tenantName: "Gopal Krishna",   rent: 15000, status: "paid" },
      { flatNo: "204", tenantId: "T016", tenantName: "Kavitha Nair",    rent: 16000, status: "paid" },
      { flatNo: "205", tenantId: "T017", tenantName: "Ramesh Babu",     rent: 15000, status: "paid" },
      { flatNo: "206", tenantId: "T018", tenantName: "Sunita Pillai",   rent: 14000, status: "paid" },
      { flatNo: "207", tenantId: "T019", tenantName: "Harish Chandra",  rent: 16000, status: "paid" },
      { flatNo: "208", tenantId: "T020", tenantName: "Bhavana Reddy",   rent: 15000, status: "paid" },
      { flatNo: "209", tenantId: "T021", tenantName: "Nikhil Sharma",   rent: 15000, status: "paid" },
      { flatNo: "210", tenantId: "T022", tenantName: "Divya Menon",     rent: 14000, status: "paid" },
      { flatNo: "211", tenantId: "T023", tenantName: "Santosh Kumar",   rent: 15000, status: "paid" },
      { flatNo: "212", tenantId: "T024", tenantName: "Rekha Singh",     rent: 16000, status: "paid" },
      { flatNo: "213", tenantId: "T025", tenantName: "Mohan Das",       rent: 14000, status: "paid" },
      { flatNo: "214", tenantId: null,   tenantName: null,              rent: 0,     status: "vacant" },
      { flatNo: "215", tenantId: null,   tenantName: null,              rent: 0,     status: "vacant" },
    ],
  },
  {
    id: "rvb",
    name: "RVB",
    address: "Kondapur, Hyderabad",
    totalFlats: 12,
    occupiedFlats: 10,
    vacantFlats: 2,
    monthlyCollection: 150000,
    tenantCount: 10,
    flats: [
      { flatNo: "301", tenantId: "T026", tenantName: "Arjun Mehta",     rent: 16000, status: "paid" },
      { flatNo: "302", tenantId: "T027", tenantName: "Shalini Gupta",   rent: 15000, status: "paid" },
      { flatNo: "303", tenantId: "T028", tenantName: "Prakash Rao",     rent: 14000, status: "overdue" },
      { flatNo: "304", tenantId: "T029", tenantName: "Usha Devi",       rent: 15000, status: "paid" },
      { flatNo: "305", tenantId: "T030", tenantName: "Manoj Tiwari",    rent: 16000, status: "paid" },
      { flatNo: "306", tenantId: "T031", tenantName: "Geeta Patel",     rent: 15000, status: "paid" },
      { flatNo: "307", tenantId: "T032", tenantName: "Sunil Joshi",     rent: 14000, status: "partial" },
      { flatNo: "308", tenantId: "T033", tenantName: "Ananya Krishnan", rent: 15000, status: "paid" },
      { flatNo: "309", tenantId: "T034", tenantName: "Vikram Bose",     rent: 16000, status: "paid" },
      { flatNo: "310", tenantId: "T035", tenantName: "Padma Laxmi",     rent: 14000, status: "paid" },
      { flatNo: "311", tenantId: null,   tenantName: null,              rent: 0,     status: "vacant" },
      { flatNo: "312", tenantId: null,   tenantName: null,              rent: 0,     status: "vacant" },
    ],
  },
  {
    id: "renuka",
    name: "Renuka",
    address: "Madhapur, Hyderabad",
    totalFlats: 10,
    occupiedFlats: 8,
    vacantFlats: 2,
    monthlyCollection: 120000,
    tenantCount: 8,
    flats: [
      { flatNo: "401", tenantId: "T036", tenantName: "Krishna Murthy",  rent: 15000, status: "paid" },
      { flatNo: "402", tenantId: "T037", tenantName: "Sudha Rani",      rent: 14000, status: "paid" },
      { flatNo: "403", tenantId: "T038", tenantName: "Rajesh Khanna",   rent: 16000, status: "overdue" },
      { flatNo: "404", tenantId: "T039", tenantName: "Nirmala Devi",    rent: 15000, status: "paid" },
      { flatNo: "405", tenantId: "T040", tenantName: "Anil Kumar",      rent: 14000, status: "paid" },
      { flatNo: "406", tenantId: "T041", tenantName: "Swathi Reddy",    rent: 15000, status: "paid" },
      { flatNo: "407", tenantId: "T042", tenantName: "Ganesh Babu",     rent: 16000, status: "partial" },
      { flatNo: "408", tenantId: "T043", tenantName: "Lalitha Kumari",  rent: 15000, status: "paid" },
      { flatNo: "409", tenantId: null,   tenantName: null,              rent: 0,     status: "vacant" },
      { flatNo: "410", tenantId: null,   tenantName: null,              rent: 0,     status: "vacant" },
    ],
  },
  {
    id: "pearls",
    name: "Pearls",
    address: "Gachibowli, Hyderabad",
    totalFlats: 14,
    occupiedFlats: 12,
    vacantFlats: 2,
    monthlyCollection: 175000,
    tenantCount: 12,
    flats: [
      { flatNo: "501", tenantId: "T044", tenantName: "Venu Gopal",      rent: 15000, status: "paid" },
      { flatNo: "502", tenantId: "T045", tenantName: "Saritha Menon",   rent: 14000, status: "paid" },
      { flatNo: "503", tenantId: "T046", tenantName: "Ramu Yadav",      rent: 15000, status: "paid" },
      { flatNo: "504", tenantId: "T047", tenantName: "Chandrika Rao",   rent: 16000, status: "overdue" },
      { flatNo: "505", tenantId: "T048", tenantName: "Balaji Iyer",     rent: 15000, status: "paid" },
      { flatNo: "506", tenantId: "T049", tenantName: "Mythili Devi",    rent: 14000, status: "paid" },
      { flatNo: "507", tenantId: "T050", tenantName: "Naresh Reddy",    rent: 15000, status: "paid" },
      { flatNo: "508", tenantId: "T051", tenantName: "Kamala Kumari",   rent: 14000, status: "partial" },
      { flatNo: "509", tenantId: "T052", tenantName: "Srinivas Rao",    rent: 16000, status: "paid" },
      { flatNo: "510", tenantId: "T053", tenantName: "Vijaya Lakshmi",  rent: 15000, status: "paid" },
      { flatNo: "511", tenantId: "T054", tenantName: "Kishore Kumar",   rent: 14000, status: "paid" },
      { flatNo: "512", tenantId: "T055", tenantName: "Bhagyalakshmi",   rent: 15000, status: "paid" },
      { flatNo: "513", tenantId: null,   tenantName: null,              rent: 0,     status: "vacant" },
      { flatNo: "514", tenantId: null,   tenantName: null,              rent: 0,     status: "vacant" },
    ],
  },
  {
    id: "sree-harsha",
    name: "Sree Harsha",
    address: "Kukatpally, Hyderabad",
    totalFlats: 15,
    occupiedFlats: 11,
    vacantFlats: 4,
    monthlyCollection: 165000,
    tenantCount: 11,
    flats: [
      { flatNo: "601", tenantId: "T056", tenantName: "Harish Babu",     rent: 16000, status: "paid" },
      { flatNo: "602", tenantId: "T057", tenantName: "Radha Krishna",   rent: 15000, status: "paid" },
      { flatNo: "603", tenantId: "T058", tenantName: "Subramaniam",     rent: 14000, status: "overdue" },
      { flatNo: "604", tenantId: "T059", tenantName: "Jayalakshmi",     rent: 15000, status: "paid" },
      { flatNo: "605", tenantId: "T060", tenantName: "Ravi Shankar",    rent: 16000, status: "paid" },
      { flatNo: "606", tenantId: "T061", tenantName: "Sumathi Devi",    rent: 14000, status: "paid" },
      { flatNo: "607", tenantId: "T062", tenantName: "Prasad Rao",      rent: 15000, status: "partial" },
      { flatNo: "608", tenantId: "T063", tenantName: "Ambika Reddy",    rent: 15000, status: "paid" },
      { flatNo: "609", tenantId: "T064", tenantName: "Madhava Rao",     rent: 16000, status: "paid" },
      { flatNo: "610", tenantId: "T065", tenantName: "Vasantha Kumari", rent: 14000, status: "paid" },
      { flatNo: "611", tenantId: "T066", tenantName: "Nagaraju",        rent: 15000, status: "paid" },
      { flatNo: "612", tenantId: null,   tenantName: null,              rent: 0,     status: "vacant" },
      { flatNo: "613", tenantId: null,   tenantName: null,              rent: 0,     status: "vacant" },
      { flatNo: "614", tenantId: null,   tenantName: null,              rent: 0,     status: "vacant" },
      { flatNo: "615", tenantId: null,   tenantName: null,              rent: 0,     status: "vacant" },
    ],
  },
];

// ─── Helper functions ─────────────────────────────────────────────────────────

/** Get a single property by id */
export const getPropertyById = (id: string) =>
  properties.find((p) => p.id === id) ?? null;

/** Total flats across all buildings */
export const getTotalFlats = () =>
  properties.reduce((s, p) => s + p.totalFlats, 0);

/** Total occupied flats across all buildings */
export const getTotalOccupied = () =>
  properties.reduce((s, p) => s + p.occupiedFlats, 0);

/** Total monthly collection across all buildings */
export const getTotalCollection = () =>
  properties.reduce((s, p) => s + p.monthlyCollection, 0);

/** All flats with a given status across all buildings */
export const getFlatsByStatus = (status: FlatStatus) =>
  properties.flatMap((p) =>
    p.flats
      .filter((f) => f.status === status)
      .map((f) => ({ ...f, building: p.name, buildingId: p.id }))
  );

/** Count of overdue flats across all buildings */
export const getOverdueCount = () =>
  properties.reduce(
    (s, p) => s + p.flats.filter((f) => f.status === "overdue").length,
    0
  );