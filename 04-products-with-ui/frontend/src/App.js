
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "./App.css";
import TaglineSection from "./TaglineSection";
import Login from "./components/Login";
import Register from "./components/Register";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ------------------------------------------------------------------ */
/* Constants & helpers                                                 */
/* ------------------------------------------------------------------ */

// Products at or below this quantity are flagged as "low stock".
const LOW_STOCK_THRESHOLD = 10;

const EMPTY_FORM = { id: "", name: "", description: "", price: "", quantity: "" };
const NUMERIC_SORT_FIELDS = ["id", "price", "quantity"];

const STOCK_FILTERS = [
  { key: "all", label: "All" },
  { key: "in", label: "In stock" },
  { key: "low", label: "Low stock", hint: `${LOW_STOCK_THRESHOLD} units or fewer` },
  { key: "out", label: "Out of stock" },
];

const STATUS_LABEL = { in: "In stock", low: "Low stock", out: "Out of stock" };

const SORT_OPTIONS = [
  { field: "id", label: "ID" },
  { field: "name", label: "Product" },
  { field: "price", label: "Price" },
  { field: "quantity", label: "Stock" },
];

function getStockStatus(quantity) {
  const qty = Number(quantity);
  if (qty <= 0) return "out";
  if (qty <= LOW_STOCK_THRESHOLD) return "low";
  return "in";
}

const inr = (value, digits = 2) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

// FastAPI returns `detail` as a string for most errors but as an array of
// objects for validation errors (422). Rendering that array directly would
// crash React, so always normalise to a string.
function getErrorMessage(err, fallback) {
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string" && detail) return detail;
  if (Array.isArray(detail) && detail.length) {
    const text = detail
      .map((item) => [item?.loc?.[item.loc.length - 1], item?.msg].filter(Boolean).join(": "))
      .filter(Boolean)
      .join("; ");
    if (text) return text;
  }
  return fallback;
}

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */

const ICON_PATHS = {
  plus: ["M5 12h14", "M12 5v14"],
  edit: ["M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z", "m15 5 4 4"],
  trash: ["M3 6h18", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"],
  refresh: [
    "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",
    "M21 3v5h-5",
    "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",
    "M3 16h5v5",
  ],
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "m16 17 5-5-5-5", "M21 12H9"],
  search: ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z", "m21 21-4.3-4.3"],
  close: ["M18 6 6 18", "m6 6 12 12"],
  check: ["M20 6 9 17l-5-5"],
  alert: [
    "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z",
    "M12 9v4",
    "M12 17h.01",
  ],
  package: [
    "m7.5 4.27 9 5.15",
    "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",
    "m3.3 7 8.7 5 8.7-5",
    "M12 22V12",
  ],
  up: ["m18 15-6-6-6 6"],
  down: ["m6 9 6 6 6-6"],
  sort: ["m7 15 5 5 5-5", "m7 9 5-5 5 5"],
};

function Icon({ name, size = 18, className }) {
  return (
    <svg
      className={className ? `icon ${className}` : "icon"}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICON_PATHS[name].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

// Sortable header cell. Uses a real <button> so sorting works from the
// keyboard, and `aria-sort` so screen readers announce the current order.
function SortHeader({ label, field, sortField, sortDirection, onSort, align }) {
  const active = sortField === field;
  const ariaSort = active ? (sortDirection === "asc" ? "ascending" : "descending") : "none";
  return (
    <th scope="col" aria-sort={ariaSort} className={align === "right" ? "th-right" : undefined}>
      <button type="button" className={`sort-btn${active ? " is-active" : ""}`} onClick={() => onSort(field)}>
        {label}
        <Icon className="sort-icon" name={active ? (sortDirection === "asc" ? "up" : "down") : "sort"} size={14} />
      </button>
    </th>
  );
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

function App() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // fetching the list
  const [saving, setSaving] = useState(false); // create / update / delete in flight
  const [filter, setFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");
  const [formOpen, setFormOpen] = useState(false); // only matters below 1024px
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [token, setToken] = useState(() => sessionStorage.getItem("access_token") || "");
  const [authError, setAuthError] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [registerMessage, setRegisterMessage] = useState("");

  const formPanelRef = useRef(null);
  const nameInputRef = useRef(null);
  const modalRef = useRef(null);
  const cancelDeleteRef = useRef(null);

  const isEditing = editId !== null;

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    []
  );

  /* ---------- auth ---------- */

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setEditId(null);
  }, []);

  const handleLogin = async (username, password) => {
    try {
      setAuthError("");
      setRegisterMessage("");
      const response = await api.post("/login", { username, password });
      const accessToken = response.data.access_token;
      sessionStorage.setItem("access_token", accessToken);
      setToken(accessToken);
    } catch (err) {
      setAuthError(getErrorMessage(err, "Login failed. Please check your credentials."));
    }
  };

  const handleRegister = async (username, email, password) => {
    try {
      setAuthError("");
      setRegisterMessage("");
      const response = await api.post("/register", { username, email, password });
      setRegisterMessage(response.data.message || "Registration successful! Sign in to continue.");
      setShowRegister(false);
    } catch (err) {
      setAuthError(getErrorMessage(err, "Registration failed. Please try again."));
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("access_token");
    setToken("");
    setProducts([]);
    setDeleteTarget(null);
    setFormOpen(false);
    setFilter("");
    setStockFilter("all");
    resetForm();
  };

  /* ---------- data ---------- */

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/products/");
      setProducts(res.data);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Couldn’t load your products. Check your connection and try again."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) fetchProducts();
  }, [token, fetchProducts]);

  // Toasts dismiss themselves.
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 7000);
    return () => clearTimeout(timer);
  }, [error]);

  /* ---------- derived data ---------- */

  const stats = useMemo(() => {
    const result = { units: 0, value: 0, in: 0, low: 0, out: 0 };
    for (const product of products) {
      const qty = Number(product.quantity) || 0;
      result.units += qty;
      result.value += qty * (Number(product.price) || 0);
      result[getStockStatus(qty)] += 1;
    }
    return result;
  }, [products]);

  const counts = { all: products.length, in: stats.in, low: stats.low, out: stats.out };

  const filteredProducts = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const matches = products.filter((product) => {
      if (stockFilter !== "all" && getStockStatus(product.quantity) !== stockFilter) return false;
      if (!q) return true;
      return (
        String(product.user_product_number).includes(q) ||
        product.name?.toLowerCase().includes(q) ||
        product.description?.toLowerCase().includes(q)
      );
    });

    return [...matches].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (NUMERIC_SORT_FIELDS.includes(sortField)) {
        aVal = Number(aVal);
        bVal = Number(bVal);
      } else {
        aVal = String(aVal ?? "").toLowerCase();
        bVal = String(bVal ?? "").toLowerCase();
      }
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [products, filter, stockFilter, sortField, sortDirection]);

  const visibleValue = useMemo(
    () =>
      filteredProducts.reduce(
        (sum, product) => sum + (Number(product.price) || 0) * (Number(product.quantity) || 0),
        0
      ),
    [filteredProducts]
  );

  const needsRestock = stats.low + stats.out;
  const isFiltered = filter.trim() !== "" || stockFilter !== "all";

  /* ---------- table & form handlers ---------- */

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const clearFilters = () => {
    setFilter("");
    setStockFilter("all");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  // On small screens the form is collapsed; open it, bring it into view and
  // move focus to the first field so keyboard users land in the right place.
  const focusForm = useCallback(() => {
    setFormOpen(true);
    requestAnimationFrame(() => {
      if (window.matchMedia("(max-width: 1023px)").matches) {
        formPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      nameInputRef.current?.focus({ preventScroll: true });
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const payload = {
      ...form,
      id: Number(form.id),
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      quantity: Number(form.quantity),
    };

    try {
      if (isEditing) {
        await api.put(`/products/${editId}`, payload);
        setMessage(`Saved changes to “${payload.name}”.`);
      } else {
        await api.post("/products/", payload);
        setMessage(`Added “${payload.name}”.`);
      }
      resetForm();
      await fetchProducts();
      nameInputRef.current?.focus({ preventScroll: true });
    } catch (err) {
      setError(getErrorMessage(err, "Couldn’t save the product. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product) => {
    setForm({
      id: product.user_product_number,
      name: product.name ?? "",
      description: product.description ?? "",
      price: product.price,
      quantity: product.quantity,
    });
    setEditId(product.user_product_number);
    setMessage("");
    setError("");
    focusForm();
  };

  const handleCancelEdit = () => {
    resetForm();
    setMessage("");
    setError("");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await api.delete(`/products/${target.id}`);
      if (editId === target.id) resetForm();
      setMessage(`Deleted “${target.name}”.`);
      await fetchProducts();
    } catch (err) {
      setError(getErrorMessage(err, "Couldn’t delete the product. Please try again."));
    } finally {
      setSaving(false);
      setDeleteTarget(null);
    }
  };

  /* ---------- delete dialog: focus, Escape, focus trap, scroll lock ---------- */

  useEffect(() => {
    if (!deleteTarget) return undefined;

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelDeleteRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setDeleteTarget(null);
        return;
      }
      if (e.key !== "Tab" || !modalRef.current) return;
      const items = modalRef.current.querySelectorAll("button:not(:disabled)");
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [deleteTarget]);

  /* ---------- signed-out views ---------- */

  if (!token) {
    if (showRegister) {
      return (
        <Register
          onRegister={handleRegister}
          onShowLogin={() => {
            setShowRegister(false);
            setAuthError("");
            setRegisterMessage("");
          }}
          authError={authError}
          message={registerMessage}
        />
      );
    }
    return (
      <Login
        onLogin={handleLogin}
        onShowRegister={() => {
          setShowRegister(true);
          setAuthError("");
          setRegisterMessage("");
        }}
        authError={authError}
        message={registerMessage}
      />
    );
  }

  /* ---------- signed-in view ---------- */

  const sortProps = { sortField, sortDirection, onSort: handleSort };
  const resultSummary =
    products.length === 0
      ? "No products yet"
      : isFiltered
      ? `${filteredProducts.length} of ${plural(products.length, "product")} match`
      : plural(products.length, "product");

  return (
    <div className="app-bg">
      <header className="topbar">
        <a className="brand" href="/" aria-label="LogBook home">
          <img src="/logbook-logo.png" alt="LogBook logo" className="logo-image logo-image-header" />
          <span className="brand-sub">Inventory workspace</span>
        </a>
        <div className="top-actions">
          <span className={`sync${loading ? " is-syncing" : ""}`}>
            <span className="status-dot" />
            {loading ? "Syncing…" : "Up to date"}
          </span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={fetchProducts} disabled={loading}>
            <Icon name="refresh" size={16} />
            <span className="btn-label">Refresh</span>
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
            <Icon name="logout" size={16} />
            <span className="btn-label">Log out</span>
          </button>
        </div>
      </header>

      <main className="container">
        <section className="page-head">
          <div>
            <h1>Inventory</h1>
            <p>Track stock levels, prices and product details.</p>
          </div>
          <p className="today">{today}</p>
        </section>

        <section className="stats" aria-label="Inventory summary">
          <div className="stat stat-lead">
            <p className="stat-label">Inventory value</p>
            <p className="stat-value">₹{inr(stats.value, 0)}</p>
            <p className="stat-note">Price × quantity across all products</p>
          </div>
          <div className="stat">
            <p className="stat-label">Products</p>
            <p className="stat-value">{products.length}</p>
            <p className="stat-note">In your catalogue</p>
          </div>
          <div className="stat">
            <p className="stat-label">Units in stock</p>
            <p className="stat-value">{stats.units.toLocaleString("en-IN")}</p>
            <p className="stat-note">Across all products</p>
          </div>
          <div className={`stat${needsRestock > 0 ? " stat-alert" : ""}`}>
            <p className="stat-label">Needs restocking</p>
            <p className="stat-value">{needsRestock}</p>
            <p className="stat-note">
              {needsRestock === 0
                ? "Everything is stocked"
                : `${stats.out} out of stock, ${stats.low} running low`}
            </p>
          </div>
        </section>

        <div className="workspace">
          {/* ---------------- Form ---------------- */}
          <section className="card form-panel" ref={formPanelRef} aria-labelledby="form-title">
            <div className="panel-head">
              <div>
                <h2 id="form-title">{isEditing ? "Edit product" : "Add a product"}</h2>
                <p>
                  {isEditing
                    ? `Editing product #${editId}. Save when you’re done.`
                    : "Fill in the details to add an item to your inventory."}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm form-toggle"
                aria-expanded={formOpen}
                aria-controls="product-form"
                onClick={() => setFormOpen((open) => !open)}
              >
                {formOpen ? "Close" : "Open"}
              </button>
            </div>

            <form id="product-form" className={`product-form${formOpen ? " is-open" : ""}`} onSubmit={handleSubmit}>
              <div className="field field-full">
                <label htmlFor="product-name">Product name</label>
                <input
                  id="product-name"
                  ref={nameInputRef}
                  type="text"
                  name="name"
                  placeholder="e.g. Wireless keyboard"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="off"
                  required
                />
              </div>
              <div className="field field-full">
                <label htmlFor="product-description">Description</label>
                <textarea
                  id="product-description"
                  name="description"
                  rows={2}
                  placeholder="A short description of this item"
                  value={form.description}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="product-id">Product ID</label>
                <input
                  id="product-id"
                  type="number"
                  name="id"
                  placeholder="e.g. 101"
                  value={form.id}
                  onChange={handleChange}
                  disabled={isEditing}
                  title={isEditing ? "A product’s ID can’t be changed" : undefined}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="product-quantity">Quantity</label>
                <input
                  id="product-quantity"
                  type="number"
                  name="quantity"
                  placeholder="e.g. 25"
                  min="0"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="field field-full">
                <label htmlFor="product-price">Price (₹)</label>
                <div className="input-prefix">
                  <span aria-hidden="true">₹</span>
                  <input
                    id="product-price"
                    type="number"
                    name="price"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {!isEditing && !saving && <Icon name="plus" size={16} />}
                  {saving ? "Saving…" : isEditing ? "Save changes" : "Add product"}
                </button>
                {isEditing && (
                  <button className="btn btn-secondary" type="button" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* ---------------- Table ---------------- */}
          <section className="card list-card" aria-labelledby="inventory-title">
            <div className="list-head">
              <div>
                <h2 id="inventory-title">Products</h2>
                <p className="list-sub">{resultSummary}</p>
              </div>
              <label className="search-box">
                <Icon name="search" size={18} />
                <input
                  type="search"
                  aria-label="Search products"
                  placeholder="Search by ID, name or description"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
                {filter && (
                  <button type="button" className="clear-search" onClick={() => setFilter("")} aria-label="Clear search">
                    <Icon name="close" size={14} />
                  </button>
                )}
              </label>
            </div>

            <div className="filters">
              <div className="chip-group" role="group" aria-label="Filter by stock level">
                {STOCK_FILTERS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    title={option.hint}
                    className={`chip-btn${stockFilter === option.key ? " is-active" : ""}`}
                    aria-pressed={stockFilter === option.key}
                    onClick={() => setStockFilter(option.key)}
                  >
                    {option.label}
                    <span>{counts[option.key]}</span>
                  </button>
                ))}
              </div>

              {/* Column headings are hidden in the mobile card layout, so sorting moves here. */}
              <div className="mobile-sort">
                <label className="sr-only" htmlFor="sort-field">
                  Sort by
                </label>
                <select
                  id="sort-field"
                  value={sortField}
                  onChange={(e) => {
                    setSortField(e.target.value);
                    setSortDirection("asc");
                  }}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.field} value={option.field}>
                      Sort by {option.label.toLowerCase()}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-secondary btn-icon"
                  aria-label={`Sorted ${sortDirection === "asc" ? "ascending" : "descending"}. Switch direction`}
                  onClick={() => setSortDirection((d) => (d === "asc" ? "desc" : "asc"))}
                >
                  <Icon name={sortDirection === "asc" ? "up" : "down"} size={16} />
                </button>
              </div>
            </div>

            {loading && products.length === 0 ? (
              <div className="loading-state">
                <span className="spinner" />
                Loading your inventory…
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty">
                <span className="empty-mark">
                  <Icon name={products.length === 0 ? "package" : "search"} size={22} />
                </span>
                <h3>{products.length === 0 ? "No products yet" : "No products match"}</h3>
                <p>
                  {products.length === 0
                    ? "Add your first product to start tracking stock and prices."
                    : "Try a different search term or clear the filters."}
                </p>
                {products.length === 0 ? (
                  <button type="button" className="btn btn-primary btn-sm" onClick={focusForm}>
                    <Icon name="plus" size={16} />
                    Add a product
                  </button>
                ) : (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={clearFilters}>
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="scroll-x">
                <table className="product-table">
                  <caption className="sr-only">Product inventory, sortable by column</caption>
                  <thead>
                    <tr>
                      <SortHeader label="ID" field="id" {...sortProps} />
                      <SortHeader label="Product" field="name" {...sortProps} />
                      <SortHeader label="Price" field="price" align="right" {...sortProps} />
                      <SortHeader label="Stock" field="quantity" {...sortProps} />
                      <th scope="col">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const status = getStockStatus(product.quantity);
                      return (
                        <tr key={product.user_product_number} className={editId === product.user_product_number ? "is-editing" : undefined}>
                          <td className="cell-id">#{product.user_product_number}</td>
                          <td className="cell-product">
                            <span className="product-name">{product.name}</span>
                            {product.description && (
                              <span className="product-desc" title={product.description}>
                                {product.description}
                              </span>
                            )}
                          </td>
                          <td className="cell-price td-right">₹{inr(product.price)}</td>
                          <td className="cell-stock">
                            <span className="stock">
                              <span className="stock-qty">{product.quantity}</span>
                              <span className={`status status-${status}`}>{STATUS_LABEL[status]}</span>
                            </span>
                          </td>
                          <td className="cell-actions">
                            <div className="row-actions">
                              <button
                                type="button"
                                className="btn btn-icon btn-quiet btn-quiet-edit"
                                onClick={() => handleEdit(product)}
                                aria-label={`Edit ${product.name}`}
                                title="Edit"
                              >
                                <Icon name="edit" size={17} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-icon btn-quiet btn-quiet-delete"
                                onClick={() => setDeleteTarget(product)}
                                aria-label={`Delete ${product.name}`}
                                title="Delete"
                              >
                                <Icon name="trash" size={17} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {products.length > 0 && (
              <div className="table-foot">
                <span>
                  Showing {filteredProducts.length} of {products.length}
                </span>
                <span>Stock value of these products: ₹{inr(visibleValue)}</span>
              </div>
            )}
          </section>
        </div>

        <div className="tagline-slot">
          <TaglineSection />
        </div>
      </main>

      {/* ---------------- Toasts ---------------- */}
      <div className="toast-region">
        {message && (
          <div className="toast toast-success" role="status">
            <Icon name="check" size={18} />
            <span>{message}</span>
            <button type="button" className="toast-close" onClick={() => setMessage("")} aria-label="Dismiss message">
              <Icon name="close" size={14} />
            </button>
          </div>
        )}
        {error && (
          <div className="toast toast-error" role="alert">
            <Icon name="alert" size={18} />
            <span>{error}</span>
            <button type="button" className="toast-close" onClick={() => setError("")} aria-label="Dismiss error">
              <Icon name="close" size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ---------------- Delete confirmation ---------------- */}
      {deleteTarget && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !saving) setDeleteTarget(null);
          }}
        >
          <div
            className="modal"
            ref={modalRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            aria-describedby="delete-desc"
          >
            <h2 id="delete-title">Delete “{deleteTarget.name}”?</h2>
            <p id="delete-desc">This removes the product from your inventory. You can’t undo this.</p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                ref={cancelDeleteRef}
                onClick={() => setDeleteTarget(null)}
                disabled={saving}
              >
                Keep product
              </button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={saving}>
                {saving ? "Deleting…" : "Delete product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;