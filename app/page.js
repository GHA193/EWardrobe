"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import s from "./page.module.css";

// Default categories in case API call fails
const FALLBACK_CATEGORIES = [
  { value: "tops", label: "Tops", icon: "👕" },
  { value: "bottoms", label: "Bottoms", icon: "👖" },
  { value: "dresses", label: "Dresses", icon: "👗" },
  { value: "outerwear", label: "Outerwear", icon: "🧥" },
  { value: "shoes", label: "Shoes", icon: "👟" },
  { value: "bags", label: "Bags", icon: "👜" },
  { value: "accessories", label: "Accessories", icon: "⌚" },
  { value: "sportswear", label: "Sportswear", icon: "🏃" },
  { value: "underwear", label: "Underwear", icon: "🩲" },
  { value: "other", label: "Other", icon: "📦" },
];

export default function HomePage() {
  // ---- State ----
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [toast, setToast] = useState(null);

  // ---- Debounced search ----
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ---- Fetch categories ----
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => { });
  }, []);

  // ---- Fetch items whenever filter or search changes ----
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== "all") params.set("category", activeCategory);
      if (debouncedQuery) params.set("q", debouncedQuery);
      const res = await fetch(`/api/items?${params.toString()}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      showToast("Failed to load items", "error");
    } finally {
      setLoading(false);
    }
  }, [activeCategory, debouncedQuery]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ---- Toast helper ----
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ---- Delete handler ----
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await fetch(`/api/items/${id}`, { method: "DELETE" });
      showToast("Item deleted successfully");
      setDetailItem(null);
      fetchItems();
    } catch {
      showToast("Failed to delete item", "error");
    }
  };

  // ---- Save handler (create / update) ----
  const handleSave = async (formData) => {
    try {
      const url = editItem ? `/api/items/${editItem.id}` : "/api/items";
      const method = editItem ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      showToast(editItem ? "Item updated" : "Item added");
      setShowForm(false);
      setEditItem(null);
      fetchItems();
    } catch {
      showToast("Failed to save item", "error");
    }
  };

  // ---- Category lookup ----
  const getCategoryInfo = (val) =>
    categories.find((c) => c.value === val) || { label: val, icon: "📦" };

  // ---- Unique brand count ----
  const brandCount = new Set(items.map((i) => i.brand).filter(Boolean)).size;

  return (
    <>
      {/* ===== Header ===== */}
      <header className={s.header}>
        <div className={s.headerInner}>
          <div className={s.logo}>
            <span className={s.logoIcon}>👗</span>
            <span className={s.logoGradient}>E-Wardrobe</span>
          </div>

          <div className={s.searchWrapper}>
            <span className={s.searchIcon}>🔍</span>
            <input
              id="global-search"
              className={s.searchInput}
              type="text"
              placeholder="Search by brand, notes, color, size..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className={s.headerActions}>
            <button
              id="add-item-btn"
              className="btn btn-primary"
              onClick={() => {
                setEditItem(null);
                setShowForm(true);
              }}
            >
              ＋ Add Item
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        {/* ===== Stats ===== */}
        <div className={s.statsBar}>
          <div className={s.statItem}>
            <span className={s.statValue}>{items.length}</span>
            <span className={s.statLabel}>Items</span>
          </div>
          <div className={s.statItem}>
            <span className={s.statValue}>{brandCount}</span>
            <span className={s.statLabel}>Brands</span>
          </div>
          <div className={s.statItem}>
            <span className={s.statValue}>
              {new Set(items.map((i) => i.category)).size}
            </span>
            <span className={s.statLabel}>Categories</span>
          </div>
        </div>

        {/* ===== Category Filter Chips ===== */}
        <div className={s.filterBar}>
          <button
            className={`${s.filterChip} ${activeCategory === "all" ? s.filterChipActive : ""}`}
            onClick={() => setActiveCategory("all")}
          >
            ✨ All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.value}
              className={`${s.filterChip} ${activeCategory === cat.value ? s.filterChipActive : ""}`}
              onClick={() => setActiveCategory(cat.value)}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* ===== Item Grid ===== */}
        <div className={s.grid}>
          {loading ? (
            <div className={s.spinner}>
              <div className={s.spinnerDot} />
              <div className={s.spinnerDot} />
              <div className={s.spinnerDot} />
            </div>
          ) : items.length === 0 ? (
            <div className={s.emptyState}>
              <div className={s.emptyIcon}>👔</div>
              <div className={s.emptyTitle}>Your wardrobe is empty</div>
              <div className={s.emptyText}>
                Start adding your clothing items to build your digital closet.
              </div>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => {
                  setEditItem(null);
                  setShowForm(true);
                }}
              >
                ＋ Add Your First Item
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={s.itemCard}
                onClick={() => setDetailItem(item)}
              >
                <div className={s.itemImageWrapper}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className={s.itemImage}
                    src={item.image_url}
                    alt={item.brand || "Clothing item"}
                    loading="lazy"
                  />
                  <div className={s.itemOverlay}>
                    <div className={s.itemOverlayActions}>
                      <button
                        className="btn btn-ghost"
                        style={{ flex: 1, color: "#fff" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditItem(item);
                          setShowForm(true);
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ flex: 1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                </div>
                <div className={s.itemInfo}>
                  <div className={s.itemBrand}>
                    {item.brand || "Untitled"}
                  </div>
                  <div className={s.itemMeta}>
                    <span className="badge">
                      {getCategoryInfo(item.category).icon}{" "}
                      {getCategoryInfo(item.category).label}
                    </span>
                    {item.size && <span>· {item.size}</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* ===== Detail Modal ===== */}
      {detailItem && (
        <DetailModal
          item={detailItem}
          categories={categories}
          getCategoryInfo={getCategoryInfo}
          onClose={() => setDetailItem(null)}
          onEdit={() => {
            setEditItem(detailItem);
            setDetailItem(null);
            setShowForm(true);
          }}
          onDelete={() => handleDelete(detailItem.id)}
        />
      )}

      {/* ===== Form Modal ===== */}
      {showForm && (
        <FormModal
          item={editItem}
          categories={categories}
          onClose={() => {
            setShowForm(false);
            setEditItem(null);
          }}
          onSave={handleSave}
        />
      )}

      {/* ===== Toast ===== */}
      {toast && (
        <div
          className={`${s.toast} ${toast.type === "error" ? s.toastError : s.toastSuccess}`}
        >
          {toast.type === "error" ? "❌" : "✅"} {toast.message}
        </div>
      )}
    </>
  );
}

/* ============================================
   Detail Modal Component
   ============================================ */
function DetailModal({ item, getCategoryInfo, onClose, onEdit, onDelete }) {
  const catInfo = getCategoryInfo(item.category);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 640 }}
      >
        <div className="modal-header">
          <h2 className="modal-title">{item.brand || "Clothing Detail"}</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={s.detailImage}
          src={item.image_url}
          alt={item.brand || "Clothing"}
        />

        <div className={s.detailGrid}>
          <div className={s.detailField}>
            <span className={s.detailLabel}>Category</span>
            <span className={s.detailValue}>
              {catInfo.icon} {catInfo.label}
            </span>
          </div>
          <div className={s.detailField}>
            <span className={s.detailLabel}>Brand</span>
            <span className={s.detailValue}>{item.brand || "—"}</span>
          </div>
          <div className={s.detailField}>
            <span className={s.detailLabel}>Size</span>
            <span className={s.detailValue}>{item.size || "—"}</span>
          </div>
          <div className={s.detailField}>
            <span className={s.detailLabel}>Color</span>
            <span className={s.detailValue}>{item.color || "—"}</span>
          </div>
          <div className={s.detailField}>
            <span className={s.detailLabel}>Purchase Date</span>
            <span className={s.detailValue}>{item.purchase_date || "—"}</span>
          </div>
          <div className={s.detailField}>
            <span className={s.detailLabel}>Added</span>
            <span className={s.detailValue}>
              {new Date(item.created_at).toLocaleDateString()}
            </span>
          </div>
          {item.notes && (
            <div className={`${s.detailField} ${s.detailNotes}`}>
              <span className={s.detailLabel}>Notes</span>
              <span className={s.detailValue}>{item.notes}</span>
            </div>
          )}
        </div>

        <div className={s.detailActions}>
          <button className="btn btn-primary" onClick={onEdit}>
            ✏️ Edit
          </button>
          <button className="btn btn-danger" onClick={onDelete}>
            🗑 Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   Form Modal Component (Add / Edit)
   ============================================ */
function FormModal({ item, categories, onClose, onSave }) {
  const [form, setForm] = useState({
    image_url: item?.image_url || "",
    category: item?.category || "tops",
    brand: item?.brand || "",
    purchase_date: item?.purchase_date || "",
    size: item?.size || "",
    color: item?.color || "",
    notes: item?.notes || "",
  });
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Upload image file
  const uploadFile = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        handleChange("image_url", data.url);
      } else {
        alert(data.error || "Upload failed");
      }
    } catch {
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Drag & drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.image_url) {
      alert("Please upload an image first.");
      return;
    }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {item ? "Edit Item" : "Add New Item"}
          </h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={s.formGrid}>
            {/* Image Upload Dropzone */}
            <div
              className={`${s.dropzone} ${dragActive ? s.dropzoneActive : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {form.image_url ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className={s.previewImage}
                    src={form.image_url}
                    alt="Preview"
                  />
                  <div className={s.previewOverlay}>
                    <span style={{ color: "#fff", fontSize: "0.875rem" }}>
                      Click or drop to change
                    </span>
                  </div>
                </>
              ) : uploading ? (
                <span className={s.dropzoneText}>Uploading…</span>
              ) : (
                <>
                  <span className={s.dropzoneIcon}>📸</span>
                  <span className={s.dropzoneText}>
                    Drop an image here or click to upload
                  </span>
                  <span className={s.dropzoneHint}>
                    JPEG, PNG, WebP — max 10 MB
                  </span>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files?.[0]) uploadFile(e.target.files[0]);
                }}
              />
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                className="select"
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div className="form-group">
              <label className="form-label" htmlFor="brand">
                Brand
              </label>
              <input
                id="brand"
                className="input"
                type="text"
                placeholder="e.g. Nike, Zara"
                value={form.brand}
                onChange={(e) => handleChange("brand", e.target.value)}
              />
            </div>

            {/* Size */}
            <div className="form-group">
              <label className="form-label" htmlFor="size">
                Size
              </label>
              <input
                id="size"
                className="input"
                type="text"
                placeholder="e.g. M, 42, 9.5"
                value={form.size}
                onChange={(e) => handleChange("size", e.target.value)}
              />
            </div>

            {/* Color */}
            <div className="form-group">
              <label className="form-label" htmlFor="color">
                Color
              </label>
              <input
                id="color"
                className="input"
                type="text"
                placeholder="e.g. Black, Navy Blue"
                value={form.color}
                onChange={(e) => handleChange("color", e.target.value)}
              />
            </div>

            {/* Purchase Date */}
            <div className={`form-group ${s.formFull}`}>
              <label className="form-label" htmlFor="purchaseDate">
                Purchase Date
              </label>
              <input
                id="purchaseDate"
                className="input"
                type="date"
                value={form.purchase_date}
                onChange={(e) =>
                  handleChange("purchase_date", e.target.value)
                }
              />
            </div>

            {/* Notes */}
            <div className={`form-group ${s.formFull}`}>
              <label className="form-label" htmlFor="notes">
                Notes
              </label>
              <textarea
                id="notes"
                className="textarea"
                placeholder="Any additional information about this item..."
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className={s.formActions}>
              <button
                type="button"
                className="btn"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || uploading}
              >
                {saving ? "Saving…" : item ? "Save Changes" : "Add to Wardrobe"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
