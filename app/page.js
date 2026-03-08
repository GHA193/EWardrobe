"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import translations from "@/lib/i18n";
import s from "./page.module.css";

export default function HomePage() {
  // ---- State ----
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Language state: default to Chinese
  const [locale, setLocale] = useState("zh");
  const t = useCallback((key) => translations[locale]?.[key] || translations.en[key] || key, [locale]);

  // Get localized category label (only translates 'uncategorized')
  const getCategoryLabel = useCallback((cat) => {
    if (!cat) return "";
    if (cat.value === "uncategorized") return t("uncategorized");
    return cat.label;
  }, [t]);

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [toast, setToast] = useState(null);

  // Batch Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());

  // ---- Debounced search ----
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ---- Fetch categories ----
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data);
    } catch { }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
  }, [activeCategory, debouncedQuery, t]);

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

  // ---- Batch Delete handler ----
  const handleBatchDelete = async () => {
    if (selectedItems.size === 0) return;
    if (!confirm(t("confirmBatchDelete"))) return;
    try {
      const res = await fetch("/api/items/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedItems) })
      });
      if (!res.ok) throw new Error("Batch delete failed");
      showToast(t("itemDeleted"));
      setIsSelectionMode(false);
      setSelectedItems(new Set());
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
            <SettingsMenu t={t} onChangePassword={() => setShowChangePassword(true)} />
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
        <div className={s.filterContainer}>
          <div className={s.filterBar}>
            <button
              className={`${s.filterChip} ${activeCategory === "all" ? s.filterChipActive : ""}`}
              onClick={() => setActiveCategory("all")}
            >
              ✨ {t("all")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`${s.filterChip} ${activeCategory === cat.value ? s.filterChipActive : ""}`}
                onClick={() => setActiveCategory(cat.value)}
              >
                {cat.icon} {getCategoryLabel(cat)}
              </button>
            ))}
          </div>
          <div className={s.filterActions}>
            <button
              className="btn btn-ghost"
              style={{ flexShrink: 0 }}
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelectedItems(new Set());
              }}
            >
              {t(isSelectionMode ? "cancelSelect" : "batchSelect")}
            </button>
            <button
              className="btn btn-ghost"
              style={{ flexShrink: 0 }}
              onClick={() => setShowCategoryManager(true)}
            >
              ⚙️ {t("manageCategories")}
            </button>
          </div>
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
                className={`${s.itemCard} ${selectedItems.has(item.id) ? s.itemCardSelected : ""}`}
                onClick={() => {
                  if (isSelectionMode) {
                    const next = new Set(selectedItems);
                    if (next.has(item.id)) next.delete(item.id);
                    else next.add(item.id);
                    setSelectedItems(next);
                  } else {
                    setDetailItem(item);
                  }
                }}
              >
                <div className={s.itemImageWrapper}>
                  {isSelectionMode && (
                    <div className={s.selectionOverlay}>
                      <span className={s.selectionOverlayCheck}>✓</span>
                    </div>
                  )}
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
                        className="btn btn-primary"
                        style={{ flex: 1 }}
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

      {/* ===== Batch Action Bar ===== */}
      <div className={`${s.actionBar} ${isSelectionMode ? s.actionBarVisible : ""}`}>
        <div className={s.actionBarInfo}>
          {t("selectedCount")} {selectedItems.size}
        </div>
        <div className={s.actionBarActions}>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setIsSelectionMode(false);
              setSelectedItems(new Set());
            }}
          >
            {t("cancelSelect")}
          </button>
          <button
            className="btn btn-danger"
            disabled={selectedItems.size === 0}
            onClick={handleBatchDelete}
          >
            {t("batchDelete")}
          </button>
        </div>
      </div>

      {/* ===== Detail Modal ===== */}
      {detailItem && (
        <DetailModal
          item={detailItem}
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

      {/* ===== Category Manager Modal ===== */}
      {showCategoryManager && (
        <CategoryManagerModal
          categories={categories}
          fetchCategories={fetchCategories}
          fetchItems={fetchItems}
          getCategoryLabel={getCategoryLabel}
          t={t}
          onClose={() => setShowCategoryManager(false)}
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

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePasswordModal
          t={t}
          onClose={() => setShowChangePassword(false)}
          showToast={showToast}
        />
      )}
    </>
  );
}

/* ============================================
   Settings Menu Component
   ============================================ */
function SettingsMenu({ t, onChangePassword }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        className="btn btn-icon btn-ghost"
        onClick={() => setOpen(!open)}
        title={t("settings")}
      >
        ⚙️
      </button>
      {open && (
        <>
          <div className={s.dropdownOverlay} onClick={() => setOpen(false)} />
          <div className={s.settingsDropdown}>
            <button
              className={s.dropdownItem}
              onClick={() => { setOpen(false); onChangePassword(); }}
            >
              🔒 {t("changePassword")}
            </button>
            <button
              className={`${s.dropdownItem} ${s.dropdownItemDanger}`}
              onClick={() => { setOpen(false); handleLogout(); }}
            >
              🚪 {t("logout")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================
   Change Password Modal Component
   ============================================ */
function ChangePasswordModal({ t, onClose, showToast }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;
    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(t("changePasswordSuccess"));
      onClose();
    } catch (err) {
      alert(err.message || t("changePasswordError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h2 className="modal-title">{t("changePassword")}</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              {t("oldPassword")}
            </label>
            <input
              type="password"
              className="input"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              {t("newPassword")}
            </label>
            <input
              type="password"
              className="input"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 6 }}>
              {t("passwordRequirement")}
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }} disabled={saving}>
            {saving ? "..." : t("changePassword")}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ============================================
   Category Manager Modal Component
   ============================================ */

const PRESET_EMOJIS = [
  "👕", "👖", "👗", "🧥", "👚", "👔", "🩲", "🩱", "👙", "👘",
  "🥻", "👟", "👞", "🥾", "🥿", "👠", "👡", "👢", "🎒", "👜",
  "💼", "🧳", "👓", "🕶", "🧣", "🧤", "🧢", "👒", "🎩",
  "🎓", "👑", "💍", "👝", "👛", "⌚", "⏱", "🌂", "☂", "📦",
  "✨", "💎", "🏃", "🧦"
];

function CategoryManagerModal({ categories, fetchCategories, fetchItems, getCategoryLabel, t, onClose }) {
  const [editingCatId, setEditingCatId] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [showEditEmojiPicker, setShowEditEmojiPicker] = useState(false);

  const [newLabel, setNewLabel] = useState("");
  const [newIcon, setNewIcon] = useState(PRESET_EMOJIS[0]);
  const [showNewEmojiPicker, setShowNewEmojiPicker] = useState(false);

  const handleSaveEdit = async (id) => {
    if (!editLabel.trim() || !editIcon.trim()) return;
    try {
      await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: editLabel, icon: editIcon }),
      });
      setEditingCatId(null);
      setShowEditEmojiPicker(false);
      fetchCategories();
      fetchItems();
    } catch {
      alert("Error updating category");
    }
  };

  const handleAdd = async () => {
    if (!newLabel.trim() || !newIcon.trim()) return;
    try {
      await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel, icon: newIcon }),
      });
      setNewLabel("");
      setNewIcon(PRESET_EMOJIS[0]);
      setShowNewEmojiPicker(false);
      fetchCategories();
    } catch {
      alert("Error adding category");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t("deleteCategoryConfirm"))) return;
    try {
      await fetch(`/api/categories/${id}`, { method: "DELETE" });
      fetchCategories();
      fetchItems();
    } catch {
      alert("Error deleting category");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => {
        e.stopPropagation();
        setShowNewEmojiPicker(false);
        setShowEditEmojiPicker(false);
      }} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <h2 className="modal-title">{t("manageCategories")}</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>✕</button>
        </div>

        <div className={s.categoryManagerList}>
          {categories.map((cat) => (
            <div key={cat.id} className={s.categoryRow}>
              {editingCatId === cat.id ? (
                <div style={{ display: "flex", gap: 8, flex: 1, alignItems: "center", position: "relative" }}>
                  <div className={s.emojiPickerContainer} onClick={(e) => e.stopPropagation()}>
                    <button
                      className={s.emojiSelectBtn}
                      onClick={() => setShowEditEmojiPicker(!showEditEmojiPicker)}
                    >
                      {editIcon}
                    </button>
                    {showEditEmojiPicker && (
                      <div className={s.emojiDropdown}>
                        {PRESET_EMOJIS.map(emoji => (
                          <div
                            key={emoji}
                            className={s.emojiOption}
                            onClick={() => {
                              setEditIcon(emoji);
                              setShowEditEmojiPicker(false);
                            }}
                          >
                            {emoji}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <input
                    className="input"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    placeholder="Name"
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-primary" onClick={() => handleSaveEdit(cat.id)}>✓</button>
                  <button className="btn btn-ghost" onClick={() => {
                    setEditingCatId(null);
                    setShowEditEmojiPicker(false);
                  }}>✕</button>
                </div>
              ) : (
                <>
                  <div className={s.categoryInfo}>
                    <span className={s.categoryIconLg}>{cat.icon}</span>
                    <span className={s.categoryLabelLg}>{getCategoryLabel(cat)}</span>
                    {cat.is_system ? (
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: 8 }}>
                        {t("systemCategory")}
                      </span>
                    ) : null}
                  </div>
                  {!cat.is_system && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn btn-ghost"
                        onClick={() => {
                          setEditingCatId(cat.id);
                          setEditLabel(cat.label);
                          setEditIcon(cat.icon);
                        }}
                      >
                        {t("edit")}
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(cat.id)}
                      >
                        {t("delete")}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        <div className={s.categoryAddRow}>
          <h4>{t("addCategory")}</h4>
          <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", position: "relative" }}>
            <div className={s.emojiPickerContainer} onClick={(e) => e.stopPropagation()}>
              <button
                className={s.emojiSelectBtn}
                title={t("categoryIcon")}
                onClick={() => setShowNewEmojiPicker(!showNewEmojiPicker)}
              >
                {newIcon}
              </button>
              {showNewEmojiPicker && (
                <div className={`${s.emojiDropdown} ${s.emojiDropdownUp}`}>
                  {PRESET_EMOJIS.map(emoji => (
                    <div
                      key={emoji}
                      className={s.emojiOption}
                      onClick={() => {
                        setNewIcon(emoji);
                        setShowNewEmojiPicker(false);
                      }}
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <input
              className="input"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder={t("categoryNamePlaceholder")}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={handleAdd}>
              ＋
            </button>
          </div>
        </div>
      </div>
    </div>
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
    category: item?.category || "uncategorized",
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
    // 1. Validate file size (max 10MB) client-side
    const MAX_SIZE = 10 * 1024 * 1024;
    // 2. Validate file type client-side
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (file.size > MAX_SIZE) {
      alert(t("uploadFailed") + " - Max 10MB");
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert(t("uploadFailed") + " - Invalid Image Type");
      return;
    }

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

