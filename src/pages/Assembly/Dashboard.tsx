// import { useNavigate } from "react-router-dom";
// import { useState, useMemo } from "react";
// import type { KeyboardEvent } from "react";

// const CARD_THEMES = [
//   {
//     bg: "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50",
//     ring: "focus-visible:ring-blue-500/60",
//     accent: "text-blue-600",
//     button: "from-blue-500 to-indigo-600",
//     hoverShadow: "hover:shadow-blue-100",
//   },
//   {
//     bg: "bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50",
//     ring: "focus-visible:ring-emerald-500/60",
//     accent: "text-emerald-600",
//     button: "from-emerald-500 to-green-600",
//     hoverShadow: "hover:shadow-emerald-100",
//   },
//   {
//     bg: "bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50",
//     ring: "focus-visible:ring-amber-500/60",
//     accent: "text-amber-600",
//     button: "from-orange-500 to-amber-500",
//     hoverShadow: "hover:shadow-amber-100",
//   },
//   {
//     bg: "bg-gradient-to-br from-rose-50 via-pink-50 to-red-50",
//     ring: "focus-visible:ring-rose-500/60",
//     accent: "text-rose-600",
//     button: "from-rose-500 to-pink-600",
//     hoverShadow: "hover:shadow-rose-100",
//   },
// ];

// type NavCard = {
//   key: string;
//   title: string;
//   subtitle: string;
//   path: string;
//   stats?: { label: string; value: string | number; colorClass?: string }[];
// };

// export const Dashboard = () => {
//   const navigate = useNavigate();
//   const [searchTerm, setSearchTerm] = useState("");

//   // NOTE: API calls removed as requested. Using static/mock totals for demo.
//   // no api integration needed here — using static/demo totals

//   const totalBlocks = 12;
//   const totalMandals = 34;
//   const totalKaryakartas = 1024;
//   const totalBooths = 540;
//   const totalPollingCenters = 120;

//   const navCards: NavCard[] = useMemo(
//     () => [
//       {
//         key: "block",
//         title: "Blocks",
//         subtitle: "Block administration",
//         path: "/assembly/block",
//         stats: [
//           { label: "Blocks", value: totalBlocks },
//           { label: "Teams", value: 0 },
//         ],
//       },
//       {
//         key: "mandal",
//         title: "Mandals",
//         subtitle: "Mandal operations",
//         path: "/assembly/mandal",
//         stats: [
//           { label: "Mandals", value: totalMandals },
//           { label: "Workers", value: 0 },
//         ],
//       },
//       {
//         key: "pollingBooths",
//         title: "Polling Booths",
//         subtitle: "Polling level data",
//         path: "/assembly/polling-center",
//         stats: [
//           { label: "Polling Centers", value: totalPollingCenters },
//         ],
//       },
//       {
//         key: "booths",
//         title: "Booths",
//         subtitle: "Booth level data",
//         path: "/assembly/booth",
//         stats: [
//           { label: "Booths", value: totalBooths },
//           { label: "Workers", value: 0 },
//         ],
//       },
//       {
//         key: "karyakarta",
//         title: "Karyakarta",
//         subtitle: "Grassroot workers",
//         path: "/assembly/karyakarta",
//         stats: [
//           { label: "Total", value: totalKaryakartas },
//           { label: "Active", value: 0 },
//         ],
//       },
//     ],
//     [totalBlocks, totalMandals, totalKaryakartas, totalBooths, totalPollingCenters]
//   );

//   const filteredCards = useMemo(() => {
//     if (!searchTerm.trim()) return navCards;
//     const q = searchTerm.toLowerCase();
//     return navCards.filter(
//       (c) => c.title.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q)
//     );
//   }, [searchTerm, navCards]);

//   const goTo = (path: string) => navigate(path);

//   const handleKeyActivate = (e: KeyboardEvent<HTMLLIElement>, path: string) => {
//     if (e.key === "Enter" || e.key === " ") {
//       e.preventDefault();
//       goTo(path);
//     }
//   };

//   return (
//     <div className="w-full py-8 min-h-screen box-border rounded-2xl shadow-md bg-gray-50 transition-all mx-auto px-4">
//       {/* Header & Search */}
//       <header className="mb-8 space-y-6">
//         <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:justify-between">
//           <div className="space-y-1">
//             <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
//               Explore Data Layers
//             </h1>
//             <p className="text-sm text-gray-600 dark:text-gray-400">
//               Navigate to administrative & organizational sections.
//             </p>
//           </div>
//           <div className="relative max-w-md w-full lg:w-80 group">
//             <input
//               type="text"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               placeholder="Search..."
//               className="peer block w-full rounded-xl border border-gray-300 bg-white/70 pl-10 pr-10 py-2.5 text-sm placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition"
//             />
//             {searchTerm && (
//               <button
//                 type="button"
//                 onClick={() => setSearchTerm("")}
//                 className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 rounded"
//                 aria-label="Clear search"
//               >
//                 &times;
//               </button>
//             )}
//           </div>
//         </div>
//       </header>

//       {/* Cards */}
//       {filteredCards.length === 0 ? (
//         <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-gray-300 rounded-2xl bg-white/50">
//           <p className="text-sm text-gray-600">No data matches your search.</p>
//           <button onClick={() => setSearchTerm("")} className="mt-4 text-xs font-medium text-blue-600 hover:text-blue-700">
//             Reset search
//           </button>
//         </div>
//       ) : (
//         <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="list">
//           {filteredCards.map((card, index) => {
//             const theme = CARD_THEMES[index % CARD_THEMES.length];
//             return (
//               <li
//                 key={card.key}
//                 role="button"
//                 tabIndex={0}
//                 aria-label={`Open ${card.title}`}
//                 onClick={() => goTo(card.path)}
//                 onKeyDown={(e) => handleKeyActivate(e, card.path)}
//                 className={`group relative isolate rounded-2xl border border-gray-200 bg-white shadow-sm ${theme.hoverShadow} transition hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 ${theme.ring}`}
//               >
//                 <div className={`absolute inset-0 -z-10 opacity-70 group-hover:opacity-90 transition ${theme.bg}`}></div>
//                 <div className="p-5 flex flex-col h-full">
//                   <div className="flex-1 space-y-2">
//                     <h3 className={`text-base font-semibold leading-tight text-gray-800 transition-colors`}>
//                       {card.title}
//                     </h3>
//                     <p className="text-[11px] font-medium text-gray-500 tracking-wide uppercase">
//                       {card.subtitle}
//                     </p>
//                     {card.stats && (
//                       <div className="mt-3 space-y-1.5 text-[11px] font-medium">
//                         {card.stats.map((s) => (
//                           <div key={s.label} className="flex justify-between text-gray-600">
//                             <span>{s.label}</span>
//                             <span className={s.colorClass ?? "text-gray-700"}>{s.value}</span>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                   <div className="pt-5">
//                     <span className={`inline-flex items-center justify-center w-full rounded-lg bg-linear-to-r ${theme.button} text-white text-xs font-medium py-2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition`}>
//                       Open →
//                     </span>
//                   </div>
//                 </div>
//               </li>
//             );
//           })}
//         </ul>
//       )}
//     </div>
//   );
// };

// export default Dashboard;


export default function AssemblyDashboard() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard page</h1>
            <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600">Assembly Dashboard will be displayed here</p>
            </div>
        </div>
    );
}