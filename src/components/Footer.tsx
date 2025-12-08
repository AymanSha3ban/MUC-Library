import { Facebook, Linkedin, Youtube, Instagram } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-[#990000] text-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-start">
                    {/* Logo & Copyright Section */}
                    <div className="flex flex-col items-center md:items-start space-y-4">
                        <img
                            src="/footer-logo.png"
                            alt="MUC Logo"
                            className="h-24 w-auto object-contain"
                        />
                        <div className="text-sm text-gray-200 text-center md:text-left mt-4">
                            <p className="whitespace-nowrap">Copyright 2025 MUC. All Rights Reserved</p>
                        </div>
                    </div>

                    {/* Social Media Section */}
                    <div className="flex flex-col items-center md:items-start space-y-6 mt-8 md:mt-0">
                        <a href="https://www.facebook.com/MayUniversityCairo" target="_blank" className="flex items-center space-x-3 hover:text-gray-200 transition-all duration-300 hover:scale-110 transform origin-left">
                            <Facebook size={24} />
                            <span className="font-medium">Facebook</span>
                        </a>
                        <a href="https://www.linkedin.com/school/may-university-in-cairo/posts/?feedView=all" target="_blank" className="flex items-center space-x-3 hover:text-gray-200 transition-all duration-300 hover:scale-110 transform origin-left">
                            <Linkedin size={24} />
                            <span className="font-medium">Linked in</span>
                        </a>
                        <a href="https://www.youtube.com/@mayuniversityincairo6810" target="_blank" className="flex items-center space-x-3 hover:text-gray-200 transition-all duration-300 hover:scale-110 transform origin-left">
                            <Youtube size={24} />
                            <span className="font-medium">Youtube</span>
                        </a>
                        <a href="https://www.instagram.com/mayuniversityincairo/" target="_blank" className="flex items-center space-x-3 hover:text-gray-200 transition-all duration-300 hover:scale-110 transform origin-left">
                            <Instagram size={24} />
                            <span className="font-medium">Instagram</span>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
