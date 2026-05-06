"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  FileText,
  Users,
  GraduationCap,
  LayoutDashboard,
  Building2,
  LogOut,
  Menu,
  X,
  Shield,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Library,
  Bot,
  Settings,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
// @ts-ignore
import { UserRole } from "@prisma/client";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: UserRole[];
  children?: { href: string; label: string }[];
}

const farmaciaNavItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/pops",
    label: "POPs",
    icon: FileText,
  },
  {
    href: "/dashboard/biblioteca",
    label: "Biblioteca POPs",
    icon: Library,
  },
  {
    href: "/dashboard/documentos",
    label: "RQ's e MBP",
    icon: ClipboardList,
  },
  {
    href: "/dashboard/treinamentos",
    label: "Treinamentos",
    icon: GraduationCap,
  },
  {
    href: "/dashboard/colaboradores",
    label: "Colaboradores",
    icon: Users,
  },
  {
    href: "/dashboard/progresso",
    label: "Progresso LMS",
    icon: BarChart3,
    roles: ["ADMIN_FARMACIA", "RT", "ANALISTA_CQ"],
  },
  {
    href: "/dashboard/relatorios",
    label: "Relatórios",
    icon: ClipboardList,
    roles: ["ADMIN_FARMACIA", "RT", "ANALISTA_CQ"],
  },
  {
    href: "/dashboard/assistente",
    label: "VISA Assistente",
    icon: Bot,
  },
];

const superAdminNavItems: NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/farmacias",
    label: "Farmácias",
    icon: Building2,
  },
  {
    href: "/admin/logs",
    label: "Logs de Auditoria",
    icon: Shield,
  },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();
  const { data: session } = useSession() || {};

  const user = session?.user as any;
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const navItems = isSuperAdmin ? superAdminNavItems : farmaciaNavItems;

  const toggleExpand = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href)
        ? prev.filter((item) => item !== href)
        : [...prev, href]
    );
  };

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role);
  });

  const NavContent = () => (
    <>
      <div className="flex h-16 items-center border-b px-4">
        <Link href={isSuperAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-blue-600">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
            VISADOCS
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto lg:hidden"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            const isExpanded = expandedItems.includes(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                {item.children ? (
                  <>
                    <button
                      onClick={() => toggleExpand(item.href)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {isExpanded && (
                      <ul className="ml-8 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={cn(
                                "block rounded-lg px-3 py-2 text-sm transition-colors",
                                pathname === child.href
                                  ? "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              )}
                              onClick={() => setIsOpen(false)}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t p-4">
        <div className="mb-4 rounded-lg bg-muted p-3">
          <p className="text-sm font-medium truncate">{user?.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          {user?.tenantName && (
            <p className="text-xs text-teal-600 mt-1 truncate">{user.tenantName}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            asChild
          >
            <Link href="/perfil">
              <Settings className="h-4 w-4 mr-2" />
              Perfil
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-background transition-transform lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-background">
        <NavContent />
      </aside>
    </>
  );
}
