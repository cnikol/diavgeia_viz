"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, Shield } from "lucide-react"
import { NavLinks } from "@/components/layout/nav-links"
import { GlobalSearch } from "@/components/layout/global-search"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5">
            <Shield className="h-7 w-7 text-blue-200" />
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-tight tracking-tight">
                TransparencyGov
              </span>
              <span className="text-[11px] leading-tight text-blue-200">
                Δήμος Καρδίτσας
              </span>
            </div>
          </Link>

          {/* Global search */}
          <GlobalSearch />

          {/* Desktop navigation */}
          <NavLinks className="hidden md:flex" />

          {/* Mobile hamburger button */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-blue-100 hover:bg-white/10 hover:text-white md:hidden"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile navigation panel — CSS transition instead of conditional render */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-blue-600 px-4 pb-3 pt-2">
          <NavLinks
            className="flex-col items-stretch"
            onLinkClick={() => setMobileMenuOpen(false)}
          />
        </div>
      </div>
    </header>
  )
}
