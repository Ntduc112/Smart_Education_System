import { Fragment } from "react";
import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm mb-6">
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <span className="text-[rgba(4,14,32,0.2)] select-none px-0.5">/</span>
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="text-[rgba(4,14,32,0.45)] hover:text-[#1b61c9] transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[#181d26] font-medium">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
