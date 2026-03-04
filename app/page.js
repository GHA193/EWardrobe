"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import translations from "@/lib/i18n";
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

// Chinese labels for categories
const CATEGORY_LABELS_ZH = {
  tops: "上衣",
  bottoms: "裤子",
  dresses: "裙子",
  outerwear: "外套",
  shoes: "鞋子",
  bags: "包包",
  accessories: "配饰",
  sportswear: "运动装",
  underwear: "内衣",
  other: "其他",
};

export default function HomePage() {
  // ---- State ----
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Language state: default to Chinese
  const [locale, setLocale] = useState("zh");
  const t = (key) => translations[locale]?.[key] || translations.en[key] || key;

  // Get localized category label
  const getCategoryLabel = (cat) => {
    if (locale === "zh" && CATEGORY_LABELS_ZH[cat.value]) {
      return CATEGORY_LABELS_ZH[cat.value];
    }
    return cat.label;
  };

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
      showToast(t("failedToLoad"), "error");
    } finally {
      setLoading(false);
    }
  }, [activeCategory, debouncedQuery]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ---- Persist locale to localStorage ----
  useEffect(() => {
    const saved = localStorage.getItem("e-wardrobe-locale");
    if (saved === "en" || saved === "zh") setLocale(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("e-wardrobe-locale", locale);
  }, [locale]);

  // ---- Toast helper ----
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ---- Delete handler ----
  const handleDelete = async (id) => {
    if (!confirm(t("confirmDelete"))) return;
    try {
      await fetch(`/api/items/${id}`, { method: "DELETE" });
      showToast(t("itemDeleted"));
      setDetailItem(null);
      fetchItems();
    } catch {
      showToast(t("failedToDelete"), "error");
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
      showToast(editItem ? t("itemUpdated") : t("itemAdded"));
      setShowForm(false);
      setEditItem(null);
      fetchItems();
    } catch {
      showToast(t("failedToSave"), "error");
    }
  };

  // ---- Category lookup ----
  const getCategoryInfo = (val) =>
    categories.find((c) => c.value === val) || { label: val, icon: "📦", value: val };

  // ---- Unique brand count ----
  const brandCount = new Set(items.map((i) => i.brand).filter(Boolean)).size;

  return (
    <>
      {/* ===== Header ===== */}
      <header className={s.header}>
        <div className={s.headerInner}>
          <div className={s.logo}>
            <span className={s.logoIcon}>👗</span>
            <span className={s.logoGradient}>{t("appName")}</span>
          </div>

          <div className={s.searchWrapper}>
            <span className={s.searchIcon}>🔍</span>
            <input
              id="global-search"
              className={s.searchInput}
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className={s.headerActions}>
            <button
              id="lang-toggle-btn"
              className={`btn btn-ghost ${s.langToggle}`}
              onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
              title={locale === "zh" ? "Switch to English" : "切换为中文"}
            >
              {t("langToggle")}
            </button>
            <button
              id="add-item-btn"
              className="btn btn-primary"
              onClick={() => {
                setEditItem(null);
                setShowForm(true);
              }}
            >
              {t("addItem")}
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        {/* ===== Stats ===== */}
        <div className={s.statsBar}>
          <div className={s.statItem}>
            <span className={s.statValue}>{items.length}</span>
            <span className={s.statLabel}>{t("items")}</span>
          </div>
          <div className={s.statItem}>
            <span className={s.statValue}>{brandCount}</span>
            <span className={s.statLabel}>{t("brands")}</span>
          </div>
          <div className={s.statItem}>
            <span className={s.statValue}>
              {new Set(items.map((i) => i.category)).size}
            </span>
            <span className={s.statLabel}>{t("categories")}</span>
          </div>
        </div>

        {/* ===== Category Filter Chips ===== */}
        <div className={s.filterBar}>
          <button
            className={`${s.filterChip} ${activeCategory === "all" ? s.filterChipActive : ""}`}
            onClick={() => setActiveCategory("all")}
          >
            ✨ {t("all")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.value}
              className={`${s.filterChip} ${activeCategory === cat.value ? s.filterChipActive : ""}`}
              onClick={() => setActiveCategory(cat.value)}
            >
              {cat.icon} {getCategoryLabel(cat)}
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
              <div className={s.emptyTitle}>{t("emptyTitle")}</div>
              <div className={s.emptyText}>{t("emptyText")}</div>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => {
                  setEditItem(null);
                  setShowForm(true);
                }}
              >
                {t("addFirstItem")}
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
                        {t("edit")}
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ flex: 1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                      >
                        {t("delete")}
                      </button>
                    </div>
                  </div>
                </div>
                <div className={s.itemInfo}>
                  <div className={s.itemBrand}>
                    {item.brand || t("untitled")}
                  </div>
                  <div className={s.itemMeta}>
                    <span className="badge">
                      {getCategoryInfo(item.category).icon}{" "}
                      {getCategoryLabel(getCategoryInfo(item.category))}
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
          getCategoryLabel={getCategoryLabel}
          t={t}
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
          getCategoryLabel={getCategoryLabel}
          t={t}
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
function DetailModal({ item, getCategoryInfo, getCategoryLabel, t, onClose, onEdit, onDelete }) {
  const catInfo = getCategoryInfo(item.category);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 640 }}
      >
        <div className="modal-header">
          <h2 className="modal-title">{item.brand || t("clothingDetail")}</h2>
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
            <span className={s.detailLabel}>{t("category")}</span>
            <span className={s.detailValue}>
              {catInfo.icon} {getCategoryLabel(catInfo)}
            </span>
          </div>
          <div className={s.detailField}>
            <span className={s.detailLabel}>{t("brand")}</span>
            <span className={s.detailValue}>{item.brand || t("noValue")}</span>
          </div>
          <div className={s.detailField}>
            <span className={s.detailLabel}>{t("size")}</span>
            <span className={s.detailValue}>{item.size || t("noValue")}</span>
          </div>
          <div className={s.detailField}>
            <span className={s.detailLabel}>{t("color")}</span>
            <span className={s.detailValue}>{item.color || t("noValue")}</span>
          </div>
          <div className={s.detailField}>
            <span className={s.detailLabel}>{t("purchaseDate")}</span>
            <span className={s.detailValue}>{item.purchase_date || t("noValue")}</span>
          </div>
          <div className={s.detailField}>
            <span className={s.detailLabel}>{t("added")}</span>
            <span className={s.detailValue}>
              {new Date(item.created_at).toLocaleDateString()}
            </span>
          </div>
          {item.notes && (
            <div className={`${s.detailField} ${s.detailNotes}`}>
              <span className={s.detailLabel}>{t("notes")}</span>
              <span className={s.detailValue}>{item.notes}</span>
            </div>
          )}
        </div>

        <div className={s.detailActions}>
          <button className="btn btn-primary" onClick={onEdit}>
            {t("edit")}
          </button>
          <button className="btn btn-danger" onClick={onDelete}>
            {t("delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   Form Modal Component (Add / Edit)
   ============================================ */
function FormModal({ item, categories, getCategoryLabel, t, onClose, onSave }) {
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
        alert(data.error || t("uploadFailed"));
      }
    } catch {
      alert(t("uploadFailed"));
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
      alert(t("pleaseUploadImage"));
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
            {item ? t("editItem") : t("addNewItem")}
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
                      {t("changeImage")}
                    </span>
                  </div>
                </>
              ) : uploading ? (
                <span className={s.dropzoneText}>{t("uploading")}</span>
              ) : (
                <>
                  <span className={s.dropzoneIcon}>📸</span>
                  <span className={s.dropzoneText}>{t("dropzoneText")}</span>
                  <span className={s.dropzoneHint}>{t("dropzoneHint")}</span>
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
                {t("categoryLabel")}
              </label>
              <select
                id="category"
                className="select"
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.icon} {getCategoryLabel(c)}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div className="form-group">
              <label className="form-label" htmlFor="brand">
                {t("brandLabel")}
              </label>
              <input
                id="brand"
                className="input"
                type="text"
                placeholder={t("brandPlaceholder")}
                value={form.brand}
                onChange={(e) => handleChange("brand", e.target.value)}
              />
            </div>

            {/* Size */}
            <div className="form-group">
              <label className="form-label" htmlFor="size">
                {t("sizeLabel")}
              </label>
              <input
                id="size"
                className="input"
                type="text"
                placeholder={t("sizePlaceholder")}
                value={form.size}
                onChange={(e) => handleChange("size", e.target.value)}
              />
            </div>

            {/* Color */}
            <div className="form-group">
              <label className="form-label" htmlFor="color">
                {t("colorLabel")}
              </label>
              <input
                id="color"
                className="input"
                type="text"
                placeholder={t("colorPlaceholder")}
                value={form.color}
                onChange={(e) => handleChange("color", e.target.value)}
              />
            </div>

            {/* Purchase Date */}
            <div className={`form-group ${s.formFull}`}>
              <label className="form-label" htmlFor="purchaseDate">
                {t("purchaseDateLabel")}
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
                {t("notesLabel")}
              </label>
              <textarea
                id="notes"
                className="textarea"
                placeholder={t("notesPlaceholder")}
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
                {t("cancel")}
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || uploading}
              >
                {saving ? t("saving") : item ? t("saveChanges") : t("addToWardrobe")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
