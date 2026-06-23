// "use client";

// import { motion } from "framer-motion";

// export default function DashboardPreview() {
//   return (
//     <motion.div
//       initial={{
//         opacity: 0,
//         y: 40,
//       }}
//       whileInView={{
//         opacity: 1,
//         y: 0,
//       }}
//       transition={{
//         duration: 0.7,
//       }}
//       className="max-w-6xl mx-auto mt-24 rounded-[2rem] overflow-hidden brand-card"
//     >
//       <div className="grid lg:grid-cols-2">
//         <div className="p-8 border-r border-[rgba(35,47,79,0.12)]">
//           <p className="text-xs uppercase tracking-[0.3em] mb-4" style={{ color: "var(--gold-deep)" }}>
//             At a glance
//           </p>
//           <div className="grid grid-cols-2 gap-4">

//             <Card
//               title="Total Rent"
//               value="₹54,000"
//             />

//             <Card
//               title="Collected"
//               value="₹46,000"
//             />

//             <Card
//               title="Outstanding"
//               value="₹8,000"
//             />

//             <Card
//               title="Occupancy"
//               value="83%"
//             />

//           </div>
//         </div>

//         <div className="p-8">
//           <p className="text-xs uppercase tracking-[0.3em] mb-4" style={{ color: "var(--gold-deep)" }}>
//             Tenant alerts
//           </p>
//           <Risk
//             name="Vijay Sharma"
//             risk={78}
//           />

//           <Risk
//             name="Meena Iyer"
//             risk={52}
//           />

//           <Risk
//             name="Arjun Nair"
//             risk={18}
//           />
//         </div>
//       </div>
//     </motion.div>
//   );
// }

// function Card({
//   title,
//   value,
// }: {
//   title: string;
//   value: string;
// }) {
//   return (
//     <div
//       className="rounded-2xl p-5"
//       style={{ background: "linear-gradient(180deg, rgba(35,47,79,0.94), rgba(35,47,79,0.82))", color: "#fff" }}
//     >
//       <p className="text-white/60">
//         {title}
//       </p>

//       <h3 className="text-2xl font-bold mt-2">
//         {value}
//       </h3>
//     </div>
//   );
// }

// function Risk({
//   name,
//   risk,
// }: {
//   name: string;
//   risk: number;
// }) {
//   return (
//     <div className="mb-6">

//       <div className="flex justify-between">
//         <span>{name}</span>

//         <span>{risk}%</span>
//       </div>

//       <div
//         className="
//         h-2
//         bg-slate-700
//         rounded-full
//         mt-2
//         "
//       >
//         <div
//           style={{
//             width: `${risk}%`,
//           }}
//           className="
//           h-full
//           rounded-full
//           bg-gradient-to-r
//           from-red-500
//           to-orange-400
//           "
//         />
//       </div>

//     </div>
//   );
// }