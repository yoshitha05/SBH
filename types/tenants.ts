export type Tenant = {
id: string;
name: string;
propertyId: string;
flatNo: string;
rent: number;
status: "Paid" | "Pending";
approved: boolean;
};