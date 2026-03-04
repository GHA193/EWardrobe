/**
 * Internationalization strings for the E-Wardrobe app.
 * Supported locales: zh (Chinese, default), en (English).
 */
const translations = {
    zh: {
        // Header
        appName: "E-Wardrobe",
        searchPlaceholder: "搜索品牌、备注、颜色、尺码...",
        addItem: "＋ 添加衣物",

        // Stats
        items: "件衣物",
        brands: "个品牌",
        categories: "个分类",

        // Filter
        all: "全部",

        // Empty state
        emptyTitle: "衣橱还是空的",
        emptyText: "开始添加你的衣物，打造你的数字衣橱吧。",
        addFirstItem: "＋ 添加第一件衣物",

        // Card overlay
        edit: "✏️ 编辑",
        delete: "🗑 删除",
        untitled: "未命名",

        // Detail modal
        clothingDetail: "衣物详情",
        category: "分类",
        brand: "品牌",
        size: "尺码",
        color: "颜色",
        purchaseDate: "购买日期",
        added: "添加时间",
        notes: "备注",
        noValue: "—",

        // Form modal
        editItem: "编辑衣物",
        addNewItem: "添加新衣物",
        dropzoneText: "拖拽图片到此处或点击上传",
        dropzoneHint: "JPEG, PNG, WebP — 最大 10 MB",
        changeImage: "点击或拖拽更换图片",
        uploading: "上传中…",
        categoryLabel: "分类",
        brandLabel: "品牌",
        brandPlaceholder: "如 Nike, Zara",
        sizeLabel: "尺码",
        sizePlaceholder: "如 M, 42, 9.5",
        colorLabel: "颜色",
        colorPlaceholder: "如 黑色, 深蓝",
        purchaseDateLabel: "购买日期",
        notesLabel: "备注",
        notesPlaceholder: "关于这件衣物的其他信息...",
        cancel: "取消",
        saving: "保存中…",
        saveChanges: "保存修改",
        addToWardrobe: "添加到衣橱",

        // Toast
        itemDeleted: "衣物已删除",
        itemUpdated: "衣物已更新",
        itemAdded: "衣物已添加",
        failedToLoad: "加载失败",
        failedToDelete: "删除失败",
        failedToSave: "保存失败",
        uploadFailed: "上传失败，请重试",
        pleaseUploadImage: "请先上传一张图片",

        // Confirm
        confirmDelete: "确定要删除这件衣物吗？",

        // Language toggle
        langToggle: "EN",
    },

    en: {
        // Header
        appName: "E-Wardrobe",
        searchPlaceholder: "Search by brand, notes, color, size...",
        addItem: "＋ Add Item",

        // Stats
        items: "Items",
        brands: "Brands",
        categories: "Categories",

        // Filter
        all: "All",

        // Empty state
        emptyTitle: "Your wardrobe is empty",
        emptyText: "Start adding your clothing items to build your digital closet.",
        addFirstItem: "＋ Add Your First Item",

        // Card overlay
        edit: "✏️ Edit",
        delete: "🗑 Delete",
        untitled: "Untitled",

        // Detail modal
        clothingDetail: "Clothing Detail",
        category: "Category",
        brand: "Brand",
        size: "Size",
        color: "Color",
        purchaseDate: "Purchase Date",
        added: "Added",
        notes: "Notes",
        noValue: "—",

        // Form modal
        editItem: "Edit Item",
        addNewItem: "Add New Item",
        dropzoneText: "Drop an image here or click to upload",
        dropzoneHint: "JPEG, PNG, WebP — max 10 MB",
        changeImage: "Click or drop to change",
        uploading: "Uploading…",
        categoryLabel: "Category",
        brandLabel: "Brand",
        brandPlaceholder: "e.g. Nike, Zara",
        sizeLabel: "Size",
        sizePlaceholder: "e.g. M, 42, 9.5",
        colorLabel: "Color",
        colorPlaceholder: "e.g. Black, Navy Blue",
        purchaseDateLabel: "Purchase Date",
        notesLabel: "Notes",
        notesPlaceholder: "Any additional information about this item...",
        cancel: "Cancel",
        saving: "Saving…",
        saveChanges: "Save Changes",
        addToWardrobe: "Add to Wardrobe",

        // Toast
        itemDeleted: "Item deleted successfully",
        itemUpdated: "Item updated",
        itemAdded: "Item added",
        failedToLoad: "Failed to load items",
        failedToDelete: "Failed to delete item",
        failedToSave: "Failed to save item",
        uploadFailed: "Upload failed. Please try again.",
        pleaseUploadImage: "Please upload an image first.",

        // Confirm
        confirmDelete: "Are you sure you want to delete this item?",

        // Language toggle
        langToggle: "中",
    },
};

export default translations;
