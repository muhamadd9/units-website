import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Package, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = user
  ? [
      { path: '/units/zaya-development', label: 'Zaya Development' },
      { path: '/units/rikaz-development', label: 'Rikaz Development' },
    ]
  : [];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <Link to={user ? '/units/zaya-development' : '/login'} className="flex items-center group text-lg font-semibold">
            Dashboard
          </Link>

          <div className="flex items-center gap-2">
            {navLinks.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-base font-medium transition-all duration-200",
                  isActive(path)
                    ? "text-foreground bg-gray-100"
                    : "text-gray-600 hover:text-foreground hover:bg-gray-100"
                )}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 px-3 py-2 hover:bg-gray-100">
                    <div className="h-9 w-9 rounded-full bg-foreground text-white flex items-center justify-center text-sm font-semibold">
                      {user.fullName?.[0]?.toUpperCase()}
                    </div>
                    <span className="hidden md:inline text-base text-foreground">{user.fullName}</span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {user.role === 'admin' && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Package className="h-4 w-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="px-4 py-2 text-base hover:bg-gray-100">
                  Login
                </Button>
                <Button size="sm" onClick={() => navigate('/signup')} className="px-4 py-2 text-base">
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
