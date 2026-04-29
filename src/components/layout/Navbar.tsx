"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, Home, BookOpen, LogOut, PlusCircle, ShieldCheck, LayoutDashboard, Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/context/AuthContext";
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, Notification } from "@/lib/db/notifications";

function getInitials(name?: string | null, email?: string | null) {
  if (name) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }
  if (email) return email[0].toUpperCase();
  return "?";
}

function getRoleBadgeColor(role?: string) {
  if (role === "admin") return "bg-violet-100 text-violet-800";
  if (role === "owner") return "bg-amber-100 text-amber-800";
  if (role === "caretaker") return "bg-emerald-100 text-emerald-800";
  return "bg-blue-100 text-blue-800";
}

function getDashboardLink(role?: string) {
  if (role === "admin") return "/admin";
  if (role === "owner") return "/dashboard/owner";
  if (role === "caretaker") return "/dashboard/caretaker";
  return "/dashboard/tenant";
}

export function Navbar() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      getUserNotifications(user.uid)
        .then(setNotifications)
        .catch((err) => {
          console.warn("Navbar: Could not fetch notifications:", err);
          setNotifications([]);
        });
    } else {
      setNotifications([]);
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
  };

  const displayName = profile?.name || user?.displayName || user?.email?.split("@")[0] || "User";
  const displayEmail = user?.email || user?.phoneNumber || "";
  const role = profile?.role;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary tracking-tight">Savion</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/search" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Destinations
            </Link>
            <Link href="/search" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Listings
            </Link>
            <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
          </nav>
        </div>

        {/* Right: Auth State */}
        <div className="flex items-center gap-1 sm:gap-3">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="mr-1">
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {user ? (
            /* ─── LOGGED IN: Notifications & Profile ─── */
            <div className="flex items-center gap-2 sm:gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none">
                    <Bell className="w-5 h-5 text-slate-700" />
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-white"></span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between px-3 py-2 border-b">
                    <span className="font-bold">Notifications</span>
                    {notifications.some(n => !n.read) && (
                      <button
                        onClick={async () => {
                          if (user) await markAllNotificationsAsRead(user.uid, notifications);
                          setNotifications(notifications.map(n => ({ ...n, read: true })));
                        }}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">No recent notifications.</div>
                  ) : (
                    notifications.map(n => (
                      <DropdownMenuItem
                        key={n.id}
                        className={`flex flex-col items-start p-3 focus:bg-slate-50 cursor-pointer ${!n.read ? 'bg-orange-50/50' : ''}`}
                        onClick={async () => {
                          if (!n.read) {
                            await markNotificationAsRead(n.id);
                            setNotifications(notifications.map(nt => nt.id === n.id ? { ...nt, read: true } : nt));
                          }
                        }}
                      >
                        <div className="flex w-full justify-between gap-2 mb-1">
                          <span className={`font-semibold text-sm ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>{n.title}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className={`text-xs block w-full whitespace-normal ${!n.read ? 'text-slate-700' : 'text-muted-foreground'}`}>{n.message}</p>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2.5 rounded-full pl-3 pr-1.5 py-1.5 border border-border shadow-sm hover:shadow-md hover:border-primary/40 transition-all bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                    aria-label="Open profile menu"
                  >
                    <span className="text-sm font-semibold text-foreground hidden sm:block max-w-[120px] truncate">
                      {displayName}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {getInitials(displayName, displayEmail)}
                    </div>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-64">
                  {/* User Info Header */}
                  <div className="px-3 pt-3 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {getInitials(displayName, displayEmail)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
                        {displayEmail && (
                          <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
                        )}
                      </div>
                    </div>
                    {role && (
                      <span className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${getRoleBadgeColor(role)}`}>
                        {role}
                      </span>
                    )}
                  </div>

                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <Link href={getDashboardLink(role)}>
                      <DropdownMenuItem>
                        <Home className="mr-2.5 h-4 w-4 text-muted-foreground" />
                        Dashboard
                      </DropdownMenuItem>
                    </Link>
                    {role === "admin" && (
                      <Link href="/admin">
                        <DropdownMenuItem className="text-violet-700 hover:!text-violet-700 hover:!bg-violet-50">
                          <LayoutDashboard className="mr-2.5 h-4 w-4 text-violet-500" />
                          Admin Panel
                        </DropdownMenuItem>
                      </Link>
                    )}
                    {(role === "student" || role === "tenant") && (
                      <Link href="/dashboard/tenant">
                        <DropdownMenuItem>
                          <BookOpen className="mr-2.5 h-4 w-4 text-muted-foreground" />
                          My Bookings
                        </DropdownMenuItem>
                      </Link>
                    )}
                    {role === "owner" && (
                      <Link href="/dashboard/owner/add-pg">
                        <DropdownMenuItem>
                          <PlusCircle className="mr-2.5 h-4 w-4 text-muted-foreground" />
                          Add New Property
                        </DropdownMenuItem>
                      </Link>
                    )}
                    {role === "caretaker" && (
                      <Link href="/dashboard/caretaker">
                        <DropdownMenuItem>
                          <ShieldCheck className="mr-2.5 h-4 w-4 text-muted-foreground" />
                          Staff Operations
                        </DropdownMenuItem>
                      </Link>
                    )}
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600 hover:!text-red-600 hover:!bg-red-50 cursor-pointer">
                    <LogOut className="mr-2.5 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            /* ─── GUEST: CTA Buttons ─── */
            <div className="hidden md:flex items-center gap-3">
              <Link href="/signup" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                List your property
              </Link>
              <Link href="/login">
                <Button variant="outline">Log In</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign Up</Button>
              </Link>
            </div>
          )}

          {/* Mobile Hamburger */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="text-left">Navigation</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-8">
                <Link href="/search" onClick={() => setIsOpen(false)} className="text-lg font-medium hover:text-primary transition-colors">
                  Destinations
                </Link>
                <Link href="/search" onClick={() => setIsOpen(false)} className="text-lg font-medium hover:text-primary transition-colors">
                  Listings
                </Link>
                <Link href="/about" onClick={() => setIsOpen(false)} className="text-lg font-medium hover:text-primary transition-colors">
                  About
                </Link>
                {!user && (
                  <div className="flex flex-col gap-3 mt-4 pt-4 border-t">
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full">Log In</Button>
                    </Link>
                    <Link href="/signup" onClick={() => setIsOpen(false)}>
                      <Button className="w-full">Sign Up</Button>
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

