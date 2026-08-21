import Link from "next/link";

export function Logo({ href = "/home", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link className={`brand${light ? " brand-light" : ""}`} href={href} aria-label="Dolaby home">
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
      </span>
      <span>dolaby</span>
    </Link>
  );
}
