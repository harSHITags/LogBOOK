import React from "react";

//   Decorative sample data: shows what the product looks like before sign-in.
const SAMPLE_ROWS = [
  { name: "Ceramic pour-over set", price: "₹1,899.00", qty: 42, status: "in", label: "In stock" },
  { name: "Canvas tote, natural", price: "₹649.00", qty: 7, status: "low", label: "Low stock" },
  { name: "Walnut desk tray", price: "₹1,250.00", qty: 0, status: "out", label: "Out of stock" },
];

function AuthShowcase({ title, text, footer }) {
  return (
    <aside className="auth-showcase">
      <img src="/logbook-logo.png" alt="LogBook logo" className="logo-image logo-image-auth" />

      <div className="showcase-copy">
        <h2>{title}</h2>
        <p>{text}</p>
      </div>

      <div className="ledger" aria-hidden="true">
        <div className="ledger-sheet">
          {SAMPLE_ROWS.map((row) => (
            <div className="ledger-row" key={row.name}>
              <div>
                <span className="ledger-name">{row.name}</span>
                <span className="ledger-price">{row.price}</span>
              </div>
              <span className="ledger-qty">{row.qty}</span>
              <span className={`status status-${row.status}`}>{row.label}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="auth-footer">{footer}</p>
    </aside>
  );
}

export default AuthShowcase;