import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, BookOpen, Home as HomeIcon, Shield, LogOut, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Swal from 'sweetalert2';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const { user, role, signOut, profilePath } = useAuth();

    const isActive = (path: string) => {
        return location.pathname + location.search === path;
    };

    const links = [
        { name: 'Home', path: '/', icon: HomeIcon },
        { name: 'Books', path: '/books', icon: BookOpen },
        { name: 'Developers', path: '/about-developers', icon: Users },
    ];

    if (role === 'admin') {
        links.push({ name: 'Admin', path: '/admin', icon: Shield });
    }

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-3 group">
                        <motion.div
                            whileHover={{ rotate: 180, scale: 1.1 }}
                            transition={{ duration: 0.6, type: "spring" }}
                            className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center text-white font-bold shadow-lg"
                        >
                            <span className="text-xl">M</span>
                        </motion.div>
                        <span className="text-xl font-bold text-gray-900 tracking-tight group-hover:text-primary-700 transition-colors">
                            MUC Library
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-2">
                        {links.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`relative px-4 py-2 rounded-full flex items-center space-x-2 text-sm font-medium transition-all duration-300 ${isActive(link.path)
                                    ? 'text-primary-700 bg-primary-50 shadow-sm'
                                    : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                                    }`}
                            >
                                <link.icon size={18} className={isActive(link.path) ? "text-primary-600" : "text-gray-500"} />
                                <span>{link.name}</span>
                            </Link>
                        ))}

                        <div className="w-px h-8 bg-gray-200 mx-4" />

                        {user ? (
                            <div className="relative group pl-2">
                                <Link to="/profile" className="flex items-center space-x-3">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md ring-2 ring-gray-100 group-hover:ring-primary-200 transition-all duration-300">
                                            {profilePath ? (
                                                <img
                                                    src={supabase.storage.from('profiles').getPublicUrl(profilePath).data.publicUrl}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                                    <User size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                    </div>
                                </Link>
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="px-6 py-2.5 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-primary-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-gray-50 focus:outline-none transition-colors"
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
                        className="md:hidden bg-white/95 backdrop-blur-xl border-b border-gray-200 overflow-hidden shadow-lg"
                    >
                        <div className="px-4 pt-2 pb-6 space-y-2">
                            {links.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${isActive(link.path)
                                        ? 'bg-primary-50 text-primary-700 shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'
                                        }`}
                                >
                                    <link.icon size={20} />
                                    <span>{link.name}</span>
                                </Link>
                            ))}

                            <div className="h-px bg-gray-100 my-4" />

                            {user ? (
                                <>
                                    <Link
                                        to="/profile"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-primary-600 transition-all"
                                    >
                                        <User size={20} />
                                        <span>My Profile</span>
                                    </Link>
                                    <button
                                        onClick={() => {
                                            setIsOpen(false);
                                            Swal.fire({
                                                title: 'Sign out?',
                                                text: "Are you sure you want to sign out?",
                                                icon: 'warning',
                                                showCancelButton: true,
                                                confirmButtonColor: '#3085d6',
                                                cancelButtonColor: '#d33',
                                                confirmButtonText: 'Yes, sign out!'
                                            }).then((result) => {
                                                if (result.isConfirmed) {
                                                    signOut();
                                                }
                                            });
                                        }}
                                        className="flex w-full items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 transition-all"
                                    >
                                        <LogOut size={20} />
                                        <span>Sign Out</span>
                                    </button>
                                </>
                            ) : (
                                <Link
                                    to="/login"
                                    onClick={() => setIsOpen(false)}
                                    className="block w-full text-center px-4 py-3 mt-4 rounded-xl bg-gray-900 text-white font-medium hover:bg-primary-600 shadow-lg transition-all"
                                >
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
