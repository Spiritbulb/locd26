'use client';
import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Menu, X, User, Heart, Mail, Lock, UserPlus, LogOut
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { createClient } from '@/lib/client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { cartItems } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'recover'>('signin');
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = createClient();

  // ── Auth state management ──────────────────────────────────────
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsAuthenticated(!!user);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session?.user);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  // ── Scroll behavior ────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 50);

      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // ── Auth helpers ───────────────────────────────────────────────
  const resetAuthForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setAuthMessage('');
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (authMode === 'recover') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setAuthMessage('Password reset email sent! Check your inbox.');
      } else if (authMode === 'signup') {
        if (password !== confirmPassword) {
          setAuthMessage('Passwords do not match');
          return;
        }
        if (password.length < 6) {
          setAuthMessage('Password must be at least 6 characters long');
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { first_name: firstName, last_name: lastName },
          },
        });
        if (error) throw error;
        setAuthMessage('Account created! Please check your email to verify.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setAuthMessage('Login successful!');
      }

      // Auto-close on success
      setTimeout(() => {
        setMobileOpen(false);
        resetAuthForm();
      }, 2000);
    } catch (error: any) {
      setAuthMessage(error.message || 'An error occurred');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error: any) {
      console.error('Logout error:', error.message);
    }
  };

  const navigationLinks = [
    { href: '/products', label: 'Products' },
    { href: '/collections', label: 'Collections' },
  ];

  const isLinkActive = (href: string) =>
    href === '/' ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* ── Main Navbar ────────────────────────────────────────────── */}
      <nav
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out
          ${isVisible ? 'translate-y-0' : '-translate-y-full'}
          ${
            isScrolled
              ? 'bg-background/95 backdrop-blur-md border-b border-border shadow-sm'
              : 'bg-background/90 backdrop-blur-md border-b border-border/50'
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            
            {/* ── Brand/Logo ───────────────────────────────────────── */}
            <Link
              href="/"
              className="flex items-center gap-2 group hover:scale-[1.02] transition-transform duration-200"
            >
              <img
                src="/logoloc.png"
                alt="Loc'd Essence Logo"
                className="h-9 sm:h-10 w-auto object-contain group-hover:scale-105 transition-transform"
              />
              <div className="hidden sm:block">
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[#8a6e5d] via-[#a38776] to-[#7e4507] bg-clip-text text-transparent leading-tight">
                  Loc'd Essence
                </span>
                <div className="text-xs text-muted-foreground -mt-1 font-light">
                  Hair • Jewelry • Beauty
                </div>
              </div>
            </Link>

            {/* ── Desktop Navigation ───────────────────────────────── */}
            <div className="hidden md:flex items-center gap-1 sm:gap-2">
              {navigationLinks.map(({ href, label }) => (
                <Button
                  key={href}
                  variant={isLinkActive(href) ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-9 px-3 sm:px-4 font-normal text-sm sm:text-base"
                  onClick={() => router.push(href)}
                >
                  {label}
                </Button>
              ))}
            </div>

            {/* ── Desktop Right Actions ────────────────────────────── */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 sm:h-10 sm:w-10"
                onClick={() => router.push('/cart')}
              >
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                {cartItems.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center min-w-[20px]"
                  >
                    {cartItems.length > 99 ? '99+' : cartItems.length}
                  </Badge>
                )}
              </Button>

              <Separator orientation="vertical" className="h-6 mx-2 hidden sm:block" />

              {/* ── Auth Dropdown ─────────────────────────────────── */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-9 px-3 gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline max-w-[120px] truncate text-sm">
                        {user?.user_metadata?.first_name || 'Account'}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.user_metadata?.first_name}{' '}
                        {user?.user_metadata?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/account')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>My Account</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/orders')}>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      <span>Orders</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  size="sm"
                  className="h-9 px-4 text-sm sm:text-base font-normal"
                >
                  Sign In
                </Button>
              )}
            </div>

            {/* ── Mobile Menu Trigger ───────────────────────────────── */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0 sm:w-[400px]">
                <div className="flex flex-col h-full">
                  
                  {/* ── Mobile Header ───────────────────────────────── */}
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                      <SheetTitle className="text-lg font-normal">Menu</SheetTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMobileOpen(false)}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* ── Mobile Content ───────────────────────────────── */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* ── Navigation Links ───────────────────────────── */}
                    <nav className="space-y-2">
                      {navigationLinks.map(({ href, label }) => (
                        <Button
                          key={href}
                          variant={isLinkActive(href) ? 'secondary' : 'ghost'}
                          className="w-full justify-start h-12 font-normal text-base"
                          onClick={() => {
                            router.push(href);
                            setMobileOpen(false);
                          }}
                        >
                          {label}
                        </Button>
                      ))}
                    </nav>

                    <Separator />

                    {/* ── Cart Button ─────────────────────────────────── */}
                    <Button
                      variant="outline"
                      className="w-full h-12 justify-start text-base gap-3"
                      onClick={() => {
                        router.push('/cart');
                        setMobileOpen(false);
                      }}
                    >
                      <ShoppingCart className="h-5 w-5 shrink-0" />
                      Cart ({cartItems.length})
                    </Button>

                    <Separator />

                    {/* ── Auth Section ────────────────────────────────── */}
                    {isAuthenticated ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-medium truncate">
                              {user?.user_metadata?.first_name}{' '}
                              {user?.user_metadata?.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {user?.email}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full h-12 text-base"
                          onClick={() => {
                            handleLogout();
                            setMobileOpen(false);
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </Button>
                      </div>
                    ) : (
                      <Card>
                        <CardHeader className="pb-4">
                          <CardTitle className="text-base font-normal">
                            {authMode === 'signup' 
                              ? 'Create Account' 
                              : authMode === 'recover' 
                                ? 'Reset Password' 
                                : 'Welcome Back'
                            }
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-4">
                          <form onSubmit={handleAuthSubmit}>
                            {authMode === 'signup' && (
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label htmlFor="firstName" className="text-xs">First Name</Label>
                                  <Input
                                    id="firstName"
                                    size="sm"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="lastName" className="text-xs">Last Name</Label>
                                  <Input
                                    id="lastName"
                                    size="sm"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                  />
                                </div>
                              </div>
                            )}
                            <div className="space-y-2">
                              <Label htmlFor="email" className="text-xs">Email</Label>
                              <Input
                                id="email"
                                type="email"
                                size="sm"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                              />
                            </div>
                            {authMode !== 'recover' && (
                              <div className="space-y-2">
                                <Label htmlFor="password" className="text-xs">Password</Label>
                                <Input
                                  id="password"
                                  type="password"
                                  size="sm"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  required
                                />
                              </div>
                            )}
                            {authMode === 'signup' && (
                              <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-xs">Confirm Password</Label>
                                <Input
                                  id="confirmPassword"
                                  type="password"
                                  size="sm"
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  required
                                />
                              </div>
                            )}
                            <Button type="submit" className="w-full h-11 text-sm">
                              {authMode === 'recover'
                                ? 'Send Reset Link'
                                : authMode === 'signup'
                                  ? 'Create Account'
                                  : 'Sign In'}
                            </Button>
                          </form>
                          
                          {/* Mode switchers */}
                          <div className="space-y-2 pt-2">
                            {authMode === 'signin' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start h-9 text-xs"
                                  type="button"
                                  onClick={() => {
                                    setAuthMode('signup');
                                    resetAuthForm();
                                  }}
                                >
                                  <UserPlus className="mr-2 h-3 w-3" />
                                  Don't have an account? Create one
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start h-9 text-xs"
                                  type="button"
                                  onClick={() => {
                                    setAuthMode('recover');
                                    resetAuthForm();
                                  }}
                                >
                                  Forgot Password?
                                </Button>
                              </>
                            )}
                            {(authMode === 'signup' || authMode === 'recover') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start h-9 text-xs"
                                type="button"
                                onClick={() => {
                                  setAuthMode('signin');
                                  resetAuthForm();
                                }}
                              >
                                Back to Sign In
                              </Button>
                            )}
                          </div>

                          {authMessage && (
                            <p
                              className={`text-xs text-center mt-3 p-2 rounded ${
                                authMessage.includes('successful') || authMessage.includes('sent')
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : 'bg-destructive/10 text-destructive border border-destructive/20'
                              }`}
                            >
                              {authMessage}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

          </div>
        </div>
      </nav>

      {/* ── Spacer to prevent content jumping ─────────────────────── */}
      <div className="h-14 sm:h-16" />
    </>
  );
};

export default Navbar;