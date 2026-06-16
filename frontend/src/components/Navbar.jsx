

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const roleLabel = user?.role === 'host' ? 'Anfitrión' : 'Huésped';

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-dark-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🏠</span>
            <span className="text-xl font-display font-bold text-gradient">
              Hospedaje
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-dark-50">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                    {user?.firstName?.[0]?.toUpperCase()}
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-dark-800">{user?.firstName} {user?.lastName}</p>
                    <p className="text-dark-400 text-xs">{roleLabel}</p>
                  </div>
                </div>
                <Link to="/search" className="text-dark-600 hover:text-primary-500 font-medium transition-colors">
                  Buscar
                </Link>
                <Link to="/dashboard" className="text-dark-600 hover:text-primary-500 font-medium transition-colors">
                  Panel
                </Link>
                {user?.role === 'host' && (
                  <Link to="/host/properties/create" className="text-primary-500 hover:text-primary-600 font-semibold transition-colors bg-primary-50 px-3 py-1.5 rounded-xl border border-primary-100 flex items-center gap-1 text-sm">
                    <span>🏡</span>
                    <span>Publicar</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="btn-secondary text-sm py-2"
                  id="btn-logout"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-dark-600 hover:text-primary-500 font-medium transition-colors"
                  id="nav-login"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm py-2"
                  id="nav-register"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-dark-100 transition-colors"
            aria-label="Abrir menú"
            id="btn-mobile-menu"
          >
            <svg className="w-6 h-6 text-dark-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-dark-100 py-4 animate-fade-in">
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-50">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                    {user?.firstName?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-dark-800">{user?.firstName} {user?.lastName}</p>
                    <p className="text-dark-400 text-sm">{roleLabel}</p>
                  </div>
                </div>
                <Link
                  to="/search"
                  className="block px-3 py-2 rounded-lg text-dark-600 hover:bg-dark-50 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Buscar
                </Link>
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 rounded-lg text-dark-600 hover:bg-dark-50 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Panel
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 font-medium"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-lg text-dark-600 hover:bg-dark-50 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-lg text-primary-500 hover:bg-primary-50 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;