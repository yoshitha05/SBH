"use client";

// app/owner/properties/page.tsx
// (also rendered at /admin/properties via that page's re-export)
//
// Converted to Supabase: building list, metric cards, Add building, and
// Delete building all now read/write the real `properties` table instead
// of the static data/properties.ts file.

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Building2, Home, TrendingUp, AlertTriangle, Search, Plus, X, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type SupabaseProperty = {
  id: number;
  name: string;
  address: string;
  total_flats: number;
  monthly_collection: number;
};

const EMPTY_FORM = { name: "", address: "", totalFlats: 0, monthlyCollection: 0 };

export default function PropertiesListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const section = pathname.startsWith("/admin") ? "admin" : "owner";
  const detailRoute = `/${section}/properties`;

  const [properties, setProperties] = useState<SupabaseProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [newBuilding, setNewBuilding] = useState(EMPTY_FORM);
  const [addError, setAddError] = useState("");

  async function loadProperties() {
    setLoading(true);
    setLoadError("");
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      setLoadError(error.message);
    } else {
      setProperties(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadProperties();
  }, []);

  const filtered = properties.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.address.toLowerCase().includes(search.toLowerCase())
  );

  // Portfolio-wide metrics, computed from real rows. Occupied/vacant per
  // building isn't tracked on the properties table itself (that data
  // lives on the tenants table), so for this page-level summary we show
  // total flats and monthly collection, which ARE real columns here.
  const totalFlats = properties.reduce((sum, p) => sum + (p.total_flats ?? 0), 0);
  const totalCollection = properties.reduce((sum, p) => sum + (p.monthly_collection ?? 0), 0);

  function openAddModal() {
    setNewBuilding(EMPTY_FORM);
    setAddError("");
    setShowAddModal(true);
  }
  async function submitNewBuilding() {
    if (!newBuilding.name.trim() || !newBuilding.address.trim()) {
      setAddError("Please enter at least a building name and address.");
      return;
    }
    setAddError("");

    const { error } = await supabase.from("properties").insert({
      name: newBuilding.name.trim(),
      address: newBuilding.address.trim(),
      total_flats: newBuilding.totalFlats,
      monthly_collection: newBuilding.monthlyCollection,
    });

    if (error) {
      setAddError(error.message);
      return;
    }

    setShowAddModal(false);
    await loadProperties();
  }

  async function deleteBuilding(p: SupabaseProperty, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Delete "${p.name}"? This cannot be undone. Tenants linked to this building will NOT be deleted automatically — remove or reassign them first.`)) return;

    const { error } = await supabase.from("properties").delete().eq("id", p.id);
    if (error) {
      alert(`Couldn't delete building: ${error.message}`);
      return;
    }
    await loadProperties();
  }

  if (loading) {
    return (
      <div className="p-10 text-center" style={{ color: "#9CA3AF" }}>
        <Loader2 size={28} className="mx-auto mb-3 animate-spin opacity-50" />
        <p className="text-sm">Loading properties from database...</p>
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="p-10 text-center" style={{ color: "#A32D2D" }}>
        <AlertTriangle size={32} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm font-medium">Couldn't load properties from the database</p>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{loadError}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>Properties</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
            {properties.length} buildings · manage flats and tenants
          </p>
        </div>
        <button onClick={openAddModal}
          className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg font-medium"
          style={{ background: "#1B4FBB", color: "#fff", border: "none", cursor: "pointer" }}>
          <Plus size={14} /> Add building
        </button>
      </div>

      {/* Portfolio metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg p-3" style={{ background: "#F5F7FB" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}>
            <Building2 size={13} /> Buildings
          </div>
          <div className="text-xl font-semibold" style={{ color: "#111827" }}>{properties.length}</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: "#F5F7FB", border: "2px solid #F0C040" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}>
            <Home size={13} /> Total flats
          </div>
          <div className="text-xl font-semibold" style={{ color: "#111827" }}>{totalFlats}</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: "#F5F7FB", border: "1.5px solid rgba(27,79,187,0.18)" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}>
            <TrendingUp size={13} /> Monthly collection
          </div>
          <div className="text-xl font-semibold" style={{ color: "#0F6E56" }}>
            ₹{(totalCollection / 100000).toFixed(1)}L
          </div>
        </div>
        <div className="rounded-lg p-3" style={{ background: "#F5F7FB", border: "1.5px solid rgba(27,79,187,0.18)" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}>
            <AlertTriangle size={13} /> Overdue flats
          </div>
          <div className="text-xl font-semibold" style={{ color: "#9CA3AF" }}>—</div>
          <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>coming with payment_history</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 w-full md:w-80">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
        <input
          type="text"
          placeholder="Search building or area..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg"
          style={{ border: "1.5px solid rgba(27,79,187,0.18)", outline: "none", color: "#111827", background: "#fff" }}
        />
      </div>

      {/* Building cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((property) => (
          <div
            key={property.id}
            onClick={() => router.push(`${detailRoute}/${property.name.toLowerCase()}`)}
            className="rounded-xl p-4 cursor-pointer transition-all hover:shadow-md relative"
            style={{ border: "1.5px solid rgba(27,79,187,0.18)", background: "#fff" }}
          >
            <button onClick={(e) => deleteBuilding(property, e)}
              className="absolute top-3 right-3 w-7 h-7 rounded flex items-center justify-center"
              style={{ background: "transparent", border: "none", color: "#D1D5DB", cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.background="#FCEBEB"; e.currentTarget.style.color="#A32D2D"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#D1D5DB"; }}>
              <Trash2 size={14} />
            </button>

            <div className="flex items-start justify-between mb-4 pr-8">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "#E8F0FE" }}>
                    <Building2 size={14} style={{ color: "#1B4FBB" }} />
                  </div>
                  <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>{property.name}</h2>
                </div>
                <p className="text-xs mt-1 ml-9" style={{ color: "#9CA3AF" }}>{property.address}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg mb-2"
              style={{ background: "#F5F7FB" }}>
              <span style={{ color: "#6B7280" }}>Total flats</span>
              <span className="font-semibold" style={{ color: "#111827" }}>{property.total_flats}</span>
            </div>
            <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg mb-4"
              style={{ background: "#F5F7FB" }}>
              <span style={{ color: "#6B7280" }}>Monthly collection</span>
              <span className="font-semibold" style={{ color: "#0F6E56" }}>
                ₹{property.monthly_collection.toLocaleString("en-IN")}
              </span>
            </div>

            <button
              className="w-full py-2 rounded-lg text-sm font-medium"
              style={{ background: "#1B4FBB", color: "#fff", border: "none" }}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`${detailRoute}/${property.name.toLowerCase()}`);
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#1339A0")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#1B4FBB")}
            >
              View details →
            </button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16" style={{ color: "#9CA3AF" }}>
          <Building2 size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{properties.length === 0 ? "No buildings yet — click \"Add building\" to create one" : "No buildings match your search"}</p>
        </div>
      )}

      {/* ── ADD BUILDING MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(17,24,39,0.5)" }}>
          <div className="rounded-xl p-6 w-full max-w-md" style={{ background: "#fff" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: "#111827" }}>Add building</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Building name</label>
                <input value={newBuilding.name} onChange={(e) => setNewBuilding({ ...newBuilding, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg" placeholder="e.g. Greenfield Residency"
                  style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Address</label>
                <input value={newBuilding.address} onChange={(e) => setNewBuilding({ ...newBuilding, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg" placeholder="e.g. Madhapur, Hyderabad"
                  style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Total flats</label>
                  <input type="number" value={newBuilding.totalFlats} onChange={(e) => setNewBuilding({ ...newBuilding, totalFlats: +e.target.value || 0 })}
                    className="w-full px-3 py-2 text-sm rounded-lg"
                    style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Monthly collection (₹)</label>
                  <input type="number" value={newBuilding.monthlyCollection} onChange={(e) => setNewBuilding({ ...newBuilding, monthlyCollection: +e.target.value || 0 })}
                    className="w-full px-3 py-2 text-sm rounded-lg"
                    style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
                </div>
              </div>
            </div>

            {addError && <p className="text-xs mt-3" style={{ color: "#A32D2D" }}>{addError}</p>}

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{ background: "#F5F7FB", color: "#6B7280", border: "1px solid rgba(27,79,187,0.15)", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={submitNewBuilding}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
                style={{ background: "#1B4FBB", color: "#fff", border: "none", cursor: "pointer" }}>
                Add building
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
