import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, BookOpen, Home as HomeIcon, Shield, LogOut, Users, ChevronDown, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Swal from 'sweetalert2';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const location = useLocation();
    const { user, role, signOut, profilePath } = useAuth();
    const profileRef = useRef<HTMLDivElement>(null);

    const isActive = (path: string) => {
        return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
    };

    const links = [
        { name: 'Home', path: '/', icon: HomeIcon },
        { name: 'Books', path: '/books', icon: BookOpen },
        { name: 'Developers', path: '/about-developers', icon: Users },
    ];

    if (role === 'admin') {
        links.push({ name: 'Admin', path: '/admin', icon: Shield });
    }

    // Close profile dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = () => {
        setIsProfileOpen(false);
        setIsOpen(false);
        Swal.fire({
            title: 'Sign out?',
            text: "Are you sure you want to sign out?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, sign out!'
        }).then((result) => {
            if (result.isConfirmed) {
                signOut();
            }
        });
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm transition-all duration-300 supports-[backdrop-filter]:bg-white/60 dark:bg-black/40 dark:border-white/10 dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-3 group">
                        <motion.img
                            src="/muc.png"
                            alt="MUC Library Logo"
                            whileHover={{ rotate: 180, scale: 1.1 }}
                            transition={{ duration: 0.6, type: "spring" }}
                            className="
                                        w-10 h-10 
                                        rounded-xl 
                                        bg-white/90 
                                        shadow-[0_6px_20px_rgba(153,27,27,0.25)]
                                        ring-1 ring-red-800/20
                                        backdrop-blur-sm
                                        "
                        />
                        <span className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight group-hover:text-primary-700 dark:group-hover:text-red-400 transition-colors">
                            MUC Library
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-1">
                        {links.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`relative px-4 py-2 rounded-full flex items-center space-x-2 text-sm font-medium transition-colors duration-300 ${isActive(link.path) ? 'text-primary-700 dark:text-red-400' : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-red-300'}`}
                            >
                                {isActive(link.path) && (
                                    <motion.div
                                        layoutId="navbar-active"
                                        className="absolute inset-0 bg-primary-50 dark:bg-red-900/30 rounded-full"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center space-x-2">
                                    <link.icon size={18} />
                                    <span>{link.name}</span>
                                </span>
                            </Link>
                        ))}

                        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-4" />

                        <div className="mr-4">
                            <ThemeToggle />
                        </div>

                        {user ? (
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center space-x-3 group focus:outline-none"
                                >
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-gray-700 shadow-md ring-2 ring-gray-100 dark:ring-gray-700 group-hover:ring-primary-200 dark:group-hover:ring-red-900 transition-all duration-300">
                                            {profilePath ? (
                                                <img
                                                    src={supabase.storage.from('profiles').getPublicUrl(profilePath).data.publicUrl}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                                                    <User size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                                    </div>
                                    <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                <AnimatePresence>
                                    {isProfileOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-float dark:shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-gray-800 py-2 overflow-hidden z-50"
                                        >
                                            <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800">
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">Signed in as</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                            </div>
                                            <div className="py-1">
                                                <Link
                                                    to="/profile"
                                                    onClick={() => setIsProfileOpen(false)}
                                                    className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-red-400 transition-colors"
                                                >
                                                    <User size={16} className="mr-3" />
                                                    Your Profile
                                                </Link>
                                                {role === 'admin' && (
                                                    <Link
                                                        to="/admin"
                                                        onClick={() => setIsProfileOpen(false)}
                                                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-red-400 transition-colors"
                                                    >
                                                        <Settings size={16} className="mr-3" />
                                                        Admin Dashboard
                                                    </Link>
                                                )}
                                            </div>
                                            <div className="py-1 border-t border-gray-50 dark:border-gray-800">
                                                <button
                                                    onClick={handleSignOut}
                                                    className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                >
                                                    <LogOut size={16} className="mr-3" />
                                                    Sign out
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="px-6 py-2.5 rounded-full bg-gray-900 dark:bg-red-700 text-white text-sm font-medium hover:bg-primary-600 dark:hover:bg-red-600 hover:shadow-lg dark:hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] hover:-translate-y-0.5 transition-all duration-300 shadow-md shadow-gray-900/20"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-4">
                        <ThemeToggle />
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none transition-colors"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="md:hidden bg-white/95 dark:bg-black/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 overflow-hidden shadow-lg"
                    >
                        <div className="px-4 pt-2 pb-6 space-y-2">
                            {links.map((link, index) => (
                                <motion.div
                                    key={link.path}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Link
                                        to={link.path}
                                        onClick={() => setIsOpen(false)}
                                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${isActive(link.path)
                                            ? 'bg-primary-50 dark:bg-red-900/20 text-primary-700 dark:text-red-400 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-red-300'
                                            }`}
                                    >
                                        <link.icon size={20} />
                                        <span>{link.name}</span>
                                    </Link>
                                </motion.div>
                            ))}

                            <div className="h-px bg-gray-100 dark:bg-gray-800 my-4" />

                            {user ? (
                                <>
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: links.length * 0.1 }}
                                    >
                                        <Link
                                            to="/profile"
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-red-400 transition-all"
                                        >
                                            <User size={20} />
                                            <span>My Profile</span>
                                        </Link>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: (links.length + 1) * 0.1 }}
                                    >
                                        <button
                                            onClick={handleSignOut}
                                            className="flex w-full items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                        >
                                            <LogOut size={20} />
                                            <span>Sign Out</span>
                                        </button>
                                    </motion.div>
                                </>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <Link
                                        to="/login"
                                        onClick={() => setIsOpen(false)}
                                        className="block w-full text-center px-4 py-3 mt-4 rounded-xl bg-gray-900 dark:bg-red-700 text-white font-medium hover:bg-primary-600 dark:hover:bg-red-600 shadow-lg dark:hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all"
                                    >
                                        Sign In
                                    </Link>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
