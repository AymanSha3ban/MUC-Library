import { Facebook, Linkedin, Youtube, Instagram } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="relative bg-gradient-to-br from-[#8B0000] via-[#990000] to-[#660000] text-white py-16 overflow-hidden">
            {/* Subtle Pattern Overlay */}
            <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-12">

                    {/* Logo & Copyright Section */}
                    <div className="flex flex-col items-center md:items-start space-y-6">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-white/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <img
                                src="/footer-logo.png"
                                alt="MUC Logo"
                                className="relative h-28 w-auto object-contain drop-shadow-lg transform group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                        <div className="text-center md:text-left">
                            <p className="text-gray-200 font-light tracking-wide text-sm">
                                &copy; {new Date().getFullYear()} <span className="font-semibold text-white">MUC University</span>. All Rights Reserved.
                            </p>
                        </div>
                    </div>

                    {/* Social Media Section */}
                    <div className="flex flex-col items-center md:items-start space-y-5">
                        <h3 className="text-lg font-semibold text-red-100 mb-2 border-b-2 border-red-400/30 pb-1">Connect With Us</h3>

                        <a href="https://www.facebook.com/MayUniversityCairo" target="_blank" rel="noopener noreferrer"
                            className="group flex items-center space-x-4 text-gray-200 hover:text-white transition-all duration-300 hover:translate-x-2">
                            <div className="p-2 bg-white/10 rounded-lg group-hover:bg-blue-600/80 transition-colors duration-300 shadow-lg backdrop-blur-sm">
                                <Facebook size={20} />
                            </div>
                            <span className="font-medium tracking-wide group-hover:tracking-wider transition-all duration-300">Facebook</span>
                        </a>

                        <a href="https://www.linkedin.com/school/may-university-in-cairo/posts/?feedView=all" target="_blank" rel="noopener noreferrer"
                            className="group flex items-center space-x-4 text-gray-200 hover:text-white transition-all duration-300 hover:translate-x-2">
                            <div className="p-2 bg-white/10 rounded-lg group-hover:bg-blue-700/80 transition-colors duration-300 shadow-lg backdrop-blur-sm">
                                <Linkedin size={20} />
                            </div>
                            <span className="font-medium tracking-wide group-hover:tracking-wider transition-all duration-300">LinkedIn</span>
                        </a>

                        <a href="https://www.youtube.com/@mayuniversityincairo6810" target="_blank" rel="noopener noreferrer"
                            className="group flex items-center space-x-4 text-gray-200 hover:text-white transition-all duration-300 hover:translate-x-2">
                            <div className="p-2 bg-white/10 rounded-lg group-hover:bg-red-600/80 transition-colors duration-300 shadow-lg backdrop-blur-sm">
                                <Youtube size={20} />
                            </div>
                            <span className="font-medium tracking-wide group-hover:tracking-wider transition-all duration-300">Youtube</span>
                        </a>

                        <a href="https://www.instagram.com/mayuniversityincairo/" target="_blank" rel="noopener noreferrer"
                            className="group flex items-center space-x-4 text-gray-200 hover:text-white transition-all duration-300 hover:translate-x-2">
                            <div className="p-2 bg-white/10 rounded-lg group-hover:bg-pink-600/80 transition-colors duration-300 shadow-lg backdrop-blur-sm">
                                <Instagram size={20} />
                            </div>
                            <span className="font-medium tracking-wide group-hover:tracking-wider transition-all duration-300">Instagram</span>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
