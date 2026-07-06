"use client";

import {
  DAY_KEYS,
  emptyHours,
  type DayKey,
  type Product,
  type Storefront,
} from "@/lib/storefront";
import { t, type UiLang } from "@/lib/i18n";
import styles from "./storefront-editor.module.css";

/**
 * A lightweight per-field editor for a structured storefront. Lives next to the
 * preview card (never inside StorefrontCard — that component is shared with the
 * public page and must stay a pure renderer). Fully controlled: every keystroke
 * flows up through onChange so the preview updates live and the existing publish
 * flow persists the edits. Testers reach for this the moment the AI mishears a
 * name, price, or hour — no need to re-speak.
 */
export function StorefrontEditor({
  value,
  lang,
  onChange,
}: {
  value: Storefront;
  lang: UiLang;
  onChange: (next: Storefront) => void;
}) {
  const tr = t(lang);

  const setField = <K extends keyof Storefront>(key: K, v: Storefront[K]) =>
    onChange({ ...value, [key]: v });

  const setDay = (day: DayKey, part: "open" | "close", raw: string) => {
    const base = value.hours ?? emptyHours();
    const current = base[day] ?? { open: null, close: null };
    const nextDay = { ...current, [part]: raw || null };
    onChange({
      ...value,
      hours: {
        ...base,
        [day]: nextDay.open || nextDay.close ? nextDay : null,
      },
    });
  };

  const setProduct = (index: number, patch: Partial<Product>) =>
    onChange({
      ...value,
      products: value.products.map((p, i) =>
        i === index ? { ...p, ...patch } : p,
      ),
    });

  const addProduct = () =>
    onChange({
      ...value,
      products: [...value.products, { name: "", price: null, note: null }],
    });

  const removeProduct = (index: number) =>
    onChange({
      ...value,
      products: value.products.filter((_, i) => i !== index),
    });

  return (
    <div className={styles.editor}>
      <p className={styles.intro}>{tr.editIntro}</p>

      <label className={styles.field}>
        <span className={styles.label}>{tr.editName}</span>
        <input
          className={styles.input}
          type="text"
          value={value.name ?? ""}
          onChange={(e) => setField("name", e.target.value)}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>{tr.editTagline}</span>
        <input
          className={styles.input}
          type="text"
          value={value.tagline ?? ""}
          onChange={(e) => setField("tagline", e.target.value)}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>{tr.editCategory}</span>
        <input
          className={styles.input}
          type="text"
          value={value.category ?? ""}
          onChange={(e) => setField("category", e.target.value)}
        />
      </label>

      <div className={styles.pair}>
        <label className={styles.field}>
          <span className={styles.label}>{tr.editPhone}</span>
          <input
            className={styles.input}
            type="tel"
            inputMode="tel"
            value={value.phone ?? ""}
            onChange={(e) => setField("phone", e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>WhatsApp</span>
          <input
            className={styles.input}
            type="tel"
            inputMode="tel"
            value={value.whatsapp ?? ""}
            onChange={(e) => setField("whatsapp", e.target.value)}
          />
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>{tr.address}</span>
        <input
          className={styles.input}
          type="text"
          value={value.address ?? ""}
          onChange={(e) => setField("address", e.target.value)}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>{tr.editAbout}</span>
        <textarea
          className={styles.textarea}
          rows={2}
          value={value.about ?? ""}
          onChange={(e) => setField("about", e.target.value)}
        />
      </label>

      <div className={styles.field}>
        <span className={styles.label}>{tr.hours}</span>
        <div className={styles.hours}>
          {DAY_KEYS.map((day) => {
            const d = value.hours?.[day];
            return (
              <div key={day} className={styles.dayRow}>
                <span className={styles.dayLabel}>{tr.dayLabels[day]}</span>
                <input
                  className={styles.timeInput}
                  type="time"
                  aria-label={`${tr.dayLabels[day]} ${tr.editOpen}`}
                  value={d?.open ?? ""}
                  onChange={(e) => setDay(day, "open", e.target.value)}
                />
                <span className={styles.dash}>–</span>
                <input
                  className={styles.timeInput}
                  type="time"
                  aria-label={`${tr.dayLabels[day]} ${tr.editClose}`}
                  value={d?.close ?? ""}
                  onChange={(e) => setDay(day, "close", e.target.value)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>{tr.editProducts}</span>
        <div className={styles.products}>
          {value.products.map((product, i) => (
            <div key={i} className={styles.productRow}>
              <div className={styles.productMain}>
                <input
                  className={styles.input}
                  type="text"
                  placeholder={tr.editItemName}
                  value={product.name}
                  onChange={(e) => setProduct(i, { name: e.target.value })}
                />
                <input
                  className={styles.priceInput}
                  type="text"
                  inputMode="numeric"
                  placeholder={tr.editItemPrice}
                  value={product.price ?? ""}
                  onChange={(e) => setProduct(i, { price: e.target.value })}
                />
                <button
                  type="button"
                  className={styles.removeBtn}
                  aria-label={tr.editRemoveItem}
                  title={tr.editRemoveItem}
                  onClick={() => removeProduct(i)}
                >
                  ×
                </button>
              </div>
              <input
                className={styles.input}
                type="text"
                placeholder={tr.editItemNote}
                value={product.note ?? ""}
                onChange={(e) => setProduct(i, { note: e.target.value })}
              />
            </div>
          ))}
          <button
            type="button"
            className={styles.addBtn}
            onClick={addProduct}
          >
            {tr.editAddItem}
          </button>
        </div>
      </div>
    </div>
  );
}
