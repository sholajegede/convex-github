import type { ReactNode } from "react";

export function Corners() {
  return (
    <>
      <span className="corner corner-tl" />
      <span className="corner corner-tr" />
      <span className="corner corner-bl" />
      <span className="corner corner-br" />
    </>
  );
}

export function Card(props: { title: string; desc?: string; children: ReactNode }) {
  return (
    <section className="card">
      <h2>{props.title}</h2>
      {props.desc && <p className="card-desc">{props.desc}</p>}
      {props.children}
    </section>
  );
}

export function Field(props: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <label>{props.label}</label>
      {props.children}
    </div>
  );
}

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return <input {...props} />;
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return <textarea {...props} />;
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode },
) {
  return <select {...props}>{props.children}</select>;
}

export function Button(props: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  type?: "button" | "submit";
}) {
  const cls = ["btn", props.variant === "secondary" ? "secondary" : "", props.variant === "danger" ? "danger" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type={props.type ?? "button"}
      className={cls}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {props.children}
    </button>
  );
}

export function Badge(props: { children: ReactNode; tone?: "neutral" | "good" | "bad" | "pending" | "merged" }) {
  return <span className={`badge ${props.tone ?? "neutral"}`}>{props.children}</span>;
}

export function Chip(props: { children: ReactNode; onClick?: () => void; active?: boolean }) {
  return (
    <button type="button" className={`chip${props.active ? " active" : ""}`} onClick={props.onClick}>
      {props.children}
    </button>
  );
}

export function Empty(props: { children: ReactNode }) {
  return <p className="empty">{props.children}</p>;
}
