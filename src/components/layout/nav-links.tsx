"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export interface NavItem {
  label: string
  href: string
}

export const navItems: NavItem[] = [
  { label: "Επισκόπηση", href: "/" },
  { label: "Απευθείας Αναθέσεις", href: "/direct-assignments" },
  { label: "Δικαιούχοι", href: "/beneficiaries" },
  { label: "Όροι Χρήσης", href: "/disclaimer" },
]

interface NavLinksProps {
  className?: string
  onLinkClick?: () => void
}

export function NavLinks({ className, onLinkClick }: NavLinksProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("flex items-center gap-1", className)}>
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onLinkClick}
            className={cn(
              "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-white/20 text-white"
                : "text-blue-100 hover:bg-white/10 hover:text-white"
            )}
          >
            {item.label}
            {/* Animated underline indicator */}
            <span
              className={cn(
                "absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-white transition-all duration-300",
                isActive ? "w-2/3" : "w-0"
              )}
            />
          </Link>
        )
      })}
    </nav>
  )
}
