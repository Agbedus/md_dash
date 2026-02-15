"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useDashboard } from "./dashboard-layout";
import {
  FiHome,
  FiFileText,
  FiCalendar,
  FiCpu,
  FiSettings,
  FiLayers,
  FiCheckSquare,
  FiClock,
  FiLogOut,
  FiBriefcase,
  FiUsers,
} from "react-icons/fi";

import { logout } from "@/app/lib/actions";

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    roles?: string[];
  };
}

const Sidebar = ({ user }: SidebarProps) => {
  const pathname = usePathname();
  const {
    isMobileExpanded,
    setIsMobileExpanded,
    isDesktopCollapsed,
    setIsDesktopCollapsed,
  } = useDashboard();

  // Existing expansion logic
  const isExpandedMobile = isMobileExpanded;
  const isExpandedDesktop = !isDesktopCollapsed;

  /* ---------------- Styles ---------------- */

  const widthClass = `${isExpandedMobile ? "w-64" : "w-20"} md:${
    isExpandedDesktop ? "w-64" : "w-20"
  }`;

  // Always left-aligned with consistent padding
  const itemAlignmentClass = "justify-start px-6";

  const contentVisibilityClass = `${isExpandedMobile ? "block" : "hidden"} md:${
    isExpandedDesktop ? "block" : "hidden"
  }`;

  const inverseContentVisibilityClass = `${isExpandedMobile ? "hidden" : "block"} md:${
    isExpandedDesktop ? "hidden" : "block"
  }`;

  // Mobile: smaller spacing, Desktop: normal spacing
  const iconSpacingClass = `${isExpandedMobile ? "gap-3 md:gap-4" : ""} md:${
    isExpandedDesktop ? "gap-4" : ""
  }`;

  // Mobile: smaller icons, Desktop: normal icons
  const iconSizeClass = `${isExpandedMobile ? "text-sm md:text-base" : "text-lg md:text-xl"} md:${
    isExpandedDesktop ? "text-base" : "text-xl"
  }`;

  /* ---------- Header ---------- */

  const headerClass = `
    h-20 flex items-center border-b border-white/5 transition-all duration-300
    justify-start px-6
  `;

  const headerInnerClass = `
    flex items-center w-full
    ${isExpandedMobile || isExpandedDesktop ? "justify-between" : "justify-start gap-2"}
  `;

  /* ---------- Menu container ---------- */
  const menuContainerClass = `
    flex-1 overflow-y-auto overflow-x-hidden
    py-4 px-0.5
  `;

  // Mobile: smaller padding, Desktop: normal padding
  const baseLinkClasses =
    "flex items-center py-1.5 md:py-2 rounded-lg transition-all duration-200 font-light text-sm hover:bg-white/5 hover:text-white whitespace-nowrap";

  const activeLinkClasses =
    "bg-white/10 text-white border border-white/10 font-medium";

  const inactiveLinkClasses = "text-zinc-400";

  /* ---------------- Menus ---------------- */

  const mainMenuItems = [
    { href: "/", icon: FiHome, label: "Dashboard", color: "text-blue-400" },
    { href: "/tasks", icon: FiCheckSquare, label: "Tasks", color: "text-purple-400" },
    { href: "/projects", icon: FiBriefcase, label: "Projects", color: "text-pink-400" },
    { href: "/notes", icon: FiFileText, label: "Notes", color: "text-yellow-400" },
    { href: "/calendar", icon: FiCalendar, label: "Calendar", color: "text-green-400" },
  ];

  const toolMenuItems = [
    { href: "/focus", icon: FiClock, label: "Focus Mode", color: "text-orange-400" },
    { href: "/assistant", icon: FiCpu, label: "AI Assistant", color: "text-cyan-400" },
    { href: "/settings", icon: FiSettings, label: "Settings", color: "text-indigo-400" },
  ];

  const renderMenuItem = (item: any) => (
    <Link
      key={item.href}
      href={item.href}
      className={`${baseLinkClasses} ${
        pathname === item.href ? activeLinkClasses : inactiveLinkClasses
      } ${itemAlignmentClass} ${iconSpacingClass}`}
    >
      <item.icon className={`flex-shrink-0 ${iconSizeClass} ${item.color}`} />
      <span className={contentVisibilityClass}>{item.label}</span>
    </Link>
  );

  return (
    <div
      className={`glass border-r border-white/5 transition-all duration-300 hidden md:flex flex-col h-full ${widthClass}`}
    >
      {/* ---------- Header ---------- */}
      <div className={headerClass}>
        <div className={headerInnerClass}>
          <button
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth < 768) {
                setIsMobileExpanded(!isMobileExpanded);
              } else {
                setIsDesktopCollapsed(!isDesktopCollapsed);
              }
            }}
            className="flex items-center gap-3 hover-scale focus:outline-none"
          >
            <div className="p-1.5 bg-white/5 rounded-lg border border-white/10">
              <FiLayers className="text-lg text-white" />
            </div>
            <span className={`text-xl font-bold text-white ${contentVisibilityClass}`}>
              MD<span className="text-emerald-500">*</span>
            </span>
          </button>
        </div>
      </div>

      {/* ---------- Menu ---------- */}
      <div className={menuContainerClass}>
        <h3
          className={`px-6 text-[10px] font-semibold text-zinc-500 uppercase mb-2 ${contentVisibilityClass}`}
        >
          Menu
        </h3>
        <nav className="space-y-2">{mainMenuItems.map(renderMenuItem)}</nav>

        <h3
          className={`px-6 mt-6 text-[10px] font-semibold text-zinc-500 uppercase mb-2 ${contentVisibilityClass}`}
        >
          Tools
        </h3>
        <nav className="space-y-2">
          {toolMenuItems.map(renderMenuItem)}

          {user?.roles?.some((r) => ["admin", "super_admin"].includes(r)) && (
            <>
              {renderMenuItem({ href: "/users", icon: FiUsers, label: "Users", color: "text-teal-400" })}
              {renderMenuItem({ href: "/clients", icon: FiUsers, label: "Clients", color: "text-violet-400" })}
            </>
          )}
        </nav>
      </div>

      {/* ---------- Footer ---------- */}
      <div className="py-3 border-t border-white/5 space-y-3">
        {user && (
          <div className={`flex items-center ${itemAlignmentClass} py-2`}>
            <div className="relative w-8 h-8">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || "User"}
                  fill
                  className="rounded-full object-cover border border-emerald-500/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                  {(user.name || user.email || "?")[0].toUpperCase()}
                </div>
              )}
            </div>

            <div className={`ml-3 overflow-hidden ${contentVisibilityClass}`}>
              <p className="text-sm text-white truncate">{user.name}</p>
              <p className="text-xs text-zinc-500 capitalize">
                {user.roles?.[0]?.replace("_", " ") || "Member"}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => logout()}
          className={`flex items-center w-full py-2 rounded-xl text-zinc-400 hover:bg-red-500/10 hover:text-red-400 ${itemAlignmentClass} ${iconSpacingClass}`}
        >
          <FiLogOut className={iconSizeClass} />
          <span className={contentVisibilityClass}>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;