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

    const links = [
        { name: 'Home', path: '/', icon: HomeIcon },
        { name: 'Books', path: '/books', icon: BookOpen },
        { name: 'Developers', path: '/about-developers', icon: Users },
    ];

    if (role === 'admin') {
        links.push({ name: 'Admin', path: '/admin', icon: Shield });
    }

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 group">
                        <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                            className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold"
                        >
                            M
                        </motion.div>
                        <span className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                            MUC Library
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        {links.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`flex items-center space-x-1 text-sm font-medium transition-colors ${location.pathname === link.path
                                    ? 'text-primary-600'
                                    : 'text-gray-600 hover:text-primary-600'
                                    }`}
                            >
                                <link.icon size={18} />
                                <span>{link.name}</span>
                            </Link>
                        ))}

                        {user ? (
                            <div className="relative group">
                                <Link to="/profile" className="flex items-center space-x-2 text-gray-600 hover:text-primary-600">
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border border-gray-200">
                                        {profilePath ? (
                                            <img
                                                src={supabase.storage.from('profiles').getPublicUrl(profilePath).data.publicUrl}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User size={20} />
                                        )}
                                    </div>
                                </Link>
                                {/* Dropdown for logout could go here */}
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-gray-600 hover:text-primary-600 focus:outline-none"
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
                        className="md:hidden bg-white border-b border-gray-200 overflow-hidden"
                    >
                        <div className="px-4 pt-2 pb-4 space-y-2">
                            {links.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${location.pathname === link.path
                                        ? 'bg-primary-50 text-primary-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'
                                        }`}
                                >
                                    <link.icon size={20} />
                                    <span>{link.name}</span>
                                </Link>
                            ))}
                            {user ? (
                                <>
                                    <Link
                                        to="/profile"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-primary-600"
                                    >
                                        <User size={20} />
                                        <span>Profile</span>
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
                                        className="flex w-full items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                                    >
                                        <LogOut size={20} />
                                        <span>Sign Out</span>
                                    </button>
                                </>
                            ) : (
                                <Link
                                    to="/login"
                                    onClick={() => setIsOpen(false)}
                                    className="block w-full text-center px-4 py-2 mt-4 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700"
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
