'use client';
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Menu, X, User, Heart, Mail, Lock, UserPlus, LogOut } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = createClient();

  // Check authentication state on mount
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsAuthenticated(!!user);
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

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
            data: {
              first_name: firstName,
              last_name: lastName,
            },
          },
        });

        if (error) throw error;
        setAuthMessage('Account created successfully! Please check your email to verify.');

        setTimeout(() => {
          setAuthOpen(false);
          resetAuthForm();
        }, 2000);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        setAuthMessage('Login successful!');

        setTimeout(() => {
          setAuthOpen(false);
          resetAuthForm();
        }, 1500);
      }
    } catch (error: any) {
      setAuthMessage(error.message || 'An error occurred');
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/');
    } catch (error: any) {
      console.error('Logout error:', error.message);
    }
  };

  const navigationLinks = [
    { href: '/products', label: 'Products' },
    { href: '/collections', label: 'Collections' }
  ];

  const isLinkActive = (href: string) => {
    if (href === '/') return pathname === href;
    return pathname.startsWith(href);
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 50);

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
        } ${isScrolled
          ? 'bg-background backdrop-blur-sm border-b'
          : 'bg-background backdrop-blur-sm border-b border-border/50'
        }`}
    >
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Section - Links to Homepage */}
          <Link href="/" className="flex items-center gap-2 group transition-all duration-300 hover:scale-105">
            <img
              src="/logoloc.png"
              alt="Loc'd Essence Logo"
              className="h-12 w-auto object-contain"
            />
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-[#8a6e5d] via-[#a38776] to-[#7e4507] bg-clip-text text-transparent">
                Loc'd Essence
              </span>
              <div className="text-xs text-gray-500 -mt-1">
                Hair • Jewelry • Beauty
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navigationLinks.map((link) => (
              <Button
                key={link.href}
                variant={isLinkActive(link.href) ? 'secondary' : 'ghost'}
                onClick={() => router.push(link.href)}
                className="font-normal"
              >
                {link.label}
              </Button>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/favourites')}
            >
              <Heart className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/cart')}
              className="relative"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItems.length > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {cartItems.length}
                </Badge>
              )}
            </Button>

            <Separator orientation="vertical" className="h-6 mx-2" />

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="max-w-[100px] truncate">
                      {user?.user_metadata?.first_name || 'Account'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">
                        {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/account')}>
                    <User className="mr-2 h-4 w-4" />
                    My Account
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/orders')}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Orders
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu open={authOpen} onOpenChange={setAuthOpen}>
                <DropdownMenuTrigger asChild>
                  <Button>Sign In</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0">
                  <Card className="border-0 shadow-none">
                    <CardHeader>
                      <CardTitle className="text-lg font-normal">
                        {authMode === 'signup' ? 'Create Account' : authMode === 'recover' ? 'Reset Password' : 'Welcome Back'}
                      </CardTitle>
                      <CardDescription>
                        {authMode === 'signup'
                          ? 'Join our community'
                          : authMode === 'recover'
                            ? 'Enter your email to receive a reset link'
                            : 'Sign in to your account'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleAuthSubmit} className="space-y-4">
                        {authMode === 'signup' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="firstName">First Name</Label>
                              <Input
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="lastName">Last Name</Label>
                              <Input
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="email"
                              type="email"
                              className="pl-9"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="your@email.com"
                              required
                            />
                          </div>
                        </div>

                        {authMode !== 'recover' && (
                          <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="password"
                                type="password"
                                className="pl-9"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                        )}

                        {authMode === 'signup' && (
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="confirmPassword"
                                type="password"
                                className="pl-9"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                        )}

                        <Button type="submit" className="w-full">
                          {authMode === 'recover' ? 'Send Reset Link' : authMode === 'signup' ? 'Create Account' : 'Sign In'}
                        </Button>
                      </form>

                      <div className="mt-4 space-y-2 text-center text-sm">
                        {authMode === 'signin' && (
                          <>
                            <Button
                              variant="link"
                              onClick={() => { setAuthMode('signup'); resetAuthForm(); }}
                              className="text-xs w-full"
                            >
                              Don't have an account? Create one
                            </Button>
                            <Button
                              variant="link"
                              onClick={() => { setAuthMode('recover'); resetAuthForm(); }}
                              className="text-xs w-full"
                            >
                              Forgot Password?
                            </Button>
                          </>
                        )}
                        {(authMode === 'signup' || authMode === 'recover') && (
                          <Button
                            variant="link"
                            onClick={() => { setAuthMode('signin'); resetAuthForm(); }}
                            className="text-xs w-full"
                          >
                            Back to Sign In
                          </Button>
                        )}
                      </div>

                      {authMessage && (
                        <p className={`mt-3 text-xs text-center ${authMessage.includes('successful') || authMessage.includes('sent') || authMessage.includes('created')
                          ? 'text-green-600'
                          : 'text-destructive'
                          }`}>
                          {authMessage}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-80">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Mobile Nav Links */}
                <nav className="space-y-1">
                  {navigationLinks.map((link) => (
                    <Button
                      key={link.href}
                      variant={isLinkActive(link.href) ? 'secondary' : 'ghost'}
                      className="w-full justify-start font-normal"
                      onClick={() => { router.push(link.href); setMobileOpen(false); }}
                    >
                      {link.label}
                    </Button>
                  ))}
                </nav>

                <Separator />

                {/* Mobile Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => { router.push('/favourites'); setMobileOpen(false); }}
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    Wishlist
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => { router.push('/cart'); setMobileOpen(false); }}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Cart ({cartItems.length})
                  </Button>
                </div>

                <Separator />

                {/* Mobile Auth */}
                {isAuthenticated ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-muted">
                      <div className="h-10 w-10 bg-background flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full py-12" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {authMode === 'signup' ? 'Create Account' : authMode === 'recover' ? 'Reset Password' : 'Sign In'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleAuthSubmit} className="space-y-3">
                        {authMode === 'signup' && (
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="First Name"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              required
                            />
                            <Input
                              placeholder="Last Name"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              required
                            />
                          </div>
                        )}
                        <Input
                          type="email"
                          placeholder="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                        {authMode !== 'recover' && (
                          <>
                            <Input
                              type="password"
                              placeholder="Password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                            />
                            {authMode === 'signup' && (
                              <Input
                                type="password"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                              />
                            )}
                          </>
                        )}
                        <Button type="submit" className="w-full">
                          {authMode === 'recover' ? 'Send Link' : authMode === 'signup' ? 'Sign Up' : 'Sign In'}
                        </Button>
                      </form>

                      <div className="mt-3 space-y-2">
                        {authMode === 'signin' && (
                          <>
                            <Button variant="link" size="sm" onClick={() => { setAuthMode('signup'); resetAuthForm(); }} className="w-full text-xs">
                              Create Account
                            </Button>
                            <Button variant="link" size="sm" onClick={() => { setAuthMode('recover'); resetAuthForm(); }} className="w-full text-xs">
                              Forgot Password?
                            </Button>
                          </>
                        )}
                        {(authMode === 'signup' || authMode === 'recover') && (
                          <Button variant="link" size="sm" onClick={() => { setAuthMode('signin'); resetAuthForm(); }} className="w-full text-xs">
                            Back to Sign In
                          </Button>
                        )}
                      </div>

                      {authMessage && (
                        <p className={`mt-2 text-xs text-center ${authMessage.includes('successful') ? 'text-green-600' : 'text-destructive'}`}>
                          {authMessage}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;