import { IconHanger } from "@tabler/icons-react";
import Link from "next/link";

export function Logo({ href = "/home", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link className={`brand${light ? " brand-light" : ""}`} href={href} aria-label="Dolaby home">
      <span className="brand-mark" aria-hidden="true">
        <IconHanger size={25} stroke={1.8} />
      </span>
      <span>dolaby</span>
    </Link>
  );
}
