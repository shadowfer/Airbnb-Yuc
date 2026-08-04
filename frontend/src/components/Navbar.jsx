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
          {/* Logo */}
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
                <Link to="/search" className="text-dark-600 hover:text-primary-500 font-medium text-sm transition-colors">
                  Buscar
                </Link>
                <Link to="/reservations/my" className="text-dark-600 hover:text-primary-500 font-medium text-sm transition-colors">
                  Mis Reservas
                </Link>
                {user?.role === 'host' && (
                  <Link to="/host/reservations" className="text-dark-600 hover:text-primary-500 font-medium text-sm transition-colors">
                    Reservas Recibidas
                  </Link>
                )}
                <Link to="/dashboard" className="text-dark-600 hover:text-primary-500 font-medium text-sm transition-colors">
                  Panel
                </Link>
                {user?.role === 'host' && (
                  <Link to="/host/properties/create" className="text-primary-500 hover:text-primary-600 font-semibold transition-colors bg-primary-50 px-3 py-1.5 rounded-xl border border-primary-100 flex items-center gap-1 text-sm">
                    <span>🏡</span>
                    <span>Publicar</span>
                  </Link>
                )}

                <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-dark-50 border border-dark-100">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xs">
                    {user?.firstName?.[0]?.toUpperCase()}
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-dark-800 leading-tight">{user?.firstName}</p>
                    <p className="text-dark-400 text-[10px]">{roleLabel}</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="btn-secondary text-xs py-1.5 px-3"
                  id="btn-logout"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-dark-600 hover:text-primary-500 font-medium text-sm transition-colors"
                  id="nav-login"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm py-2 px-4"
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
          <div className="md:hidden border-t border-dark-100 py-4 animate-fade-in space-y-2">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-50 mb-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                    {user?.firstName?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-dark-800 text-sm">{user?.firstName} {user?.lastName}</p>
                    <p className="text-dark-400 text-xs">{roleLabel}</p>
                  </div>
                </div>
                <Link
                  to="/search"
                  className="block px-3 py-2 rounded-lg text-dark-600 hover:bg-dark-50 font-medium text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Buscar hospedajes
                </Link>
                <Link
                  to="/reservations/my"
                  className="block px-3 py-2 rounded-lg text-dark-600 hover:bg-dark-50 font-medium text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mis Reservas
                </Link>
                {user?.role === 'host' && (
                  <Link
                    to="/host/reservations"
                    className="block px-3 py-2 rounded-lg text-dark-600 hover:bg-dark-50 font-medium text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Reservas Recibidas
                  </Link>
                )}
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 rounded-lg text-dark-600 hover:bg-dark-50 font-medium text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Panel de usuario
                </Link>
                {user?.role === 'host' && (
                  <Link
                    to="/host/properties/create"
                    className="block px-3 py-2 rounded-lg text-primary-600 hover:bg-primary-50 font-semibold text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    🏡 Publicar nueva propiedad
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold text-sm pt-2"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-lg text-dark-600 hover:bg-dark-50 font-medium text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-lg text-primary-500 hover:bg-primary-50 font-medium text-sm"
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