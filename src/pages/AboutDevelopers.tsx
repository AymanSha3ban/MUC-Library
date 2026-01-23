import { motion } from 'framer-motion';
import { Users, Linkedin } from 'lucide-react';

const developers = [
    { name: 'Ayman Shaaban', image: '/Ayman.png', linkedin: 'https://www.linkedin.com/in/ayman-shaaban-204516273/' },
    { name: 'Omran Amr', image: '/Omran0.png', linkedin: 'https://www.linkedin.com/in/omran10/' },
    { name: 'Karim reda', image: '/Karim.png', linkedin: 'https://www.linkedin.com/in/karim-reda-a0b1022b1/' },
    { name: 'Abdo Nasr', image: '/Abdonasr.png', linkedin: 'https://www.linkedin.com/in/abdo-nasser-96a374394/' },
    { name: 'Abdo Hatem', image: '/Abdohatem.png', linkedin: 'https://www.linkedin.com/in/abdel-rahman-hatem-563b5a379/' },
    { name: 'Abdo Elmasry', image: '/Abdomasry.png', linkedin: 'https://www.linkedin.com/in/abdelrhaman-elmasry-620a8431a/' },
    { name: 'Sharqawy', image: '/Sharqawy.png', linkedin: 'https://www.linkedin.com/in/abdelrahman-al-shrqawy-a4b50936a/' },
    { name: 'Yousef Elbadre', image: '/Yousefbadre.png', linkedin: 'https://www.linkedin.com/in/yousef-mohamed-4bb659291/' },
    { name: 'Yousef Mohamed', image: '/Yousef.png', linkedin: 'https://www.linkedin.com/in/youssef-mohamed-6a1a36361/' },
    { name: 'Mohammed Sayed', image: '/Mohamed.png', linkedin: 'https://www.linkedin.com/in/mohamed-sayed520/' },
];

const AboutDevelopers = () => {
    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-7xl mx-auto space-y-16">
                {/* Hero Section */}
                <div className="flex flex-col items-center text-center space-y-8">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.3 }}
                        className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl"
                    >
                        <img
                            src="/bg2.png"
                            alt="MUC Engineering Library Development Team"
                            className="w-full h-auto object-cover"
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="max-w-3xl space-y-4"
                    >
                        <div className="flex items-center justify-center space-x-3 text-primary-600">
                            <Users size={32} />
                            <h1 className="text-3xl font-bold text-gray-900">
                                MUC Engineering Library Development Team
                            </h1>
                        </div>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            MUC Library System is a comprehensive digital library designed to serve the entire university community, providing centralized access to academic resources across multiple colleges. The system supports digital materials, physical library references, and shared scientific and humanities resources, ensuring efficient access for students and administrators.
                        </p>
                    </motion.div>
                </div>

                {/* Academic Supervision Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="relative text-center space-y-8 bg-white/90 backdrop-blur-2xl p-12 rounded-[2.5rem] shadow-2xl border border-red-100/50 max-w-4xl mx-auto overflow-hidden group hover:border-red-200/80 transition-all duration-500"
                >
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 via-red-600 to-red-500 opacity-80"></div>

                    <div className="relative z-10 space-y-2">
                        <h3 className="text-3xl font-bold text-gray-900 tracking-tight font-serif">
                            Academic Supervision
                        </h3>
                        <div className="h-1 w-24 bg-red-100 mx-auto rounded-full overflow-hidden">
                            <div className="h-full w-1/2 bg-red-500 rounded-full animate-slide-shine" />
                        </div>
                        <p className="text-gray-500 font-medium pt-2">
                            This project was developed under the guidance of:
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
                        {['Dr. Hassan Ibrahim', 'Dr. Seham Muawad' ,'Eng. Yasmin Abdelnaby'].map((name, index) => (
                            <motion.div
                                key={name}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + (index * 0.1) }}
                                className="group/item flex items-center space-x-3 px-6 py-3 rounded-full hover:bg-red-50/50 transition-colors duration-300 cursor-default"
                            >
                                <span className="h-2.5 w-2.5 rounded-full bg-red-500 group-hover/item:animate-ping opacity-75"></span>
                                <span className="h-2.5 w-2.5 rounded-full bg-red-500 absolute ml-0"></span>

                                <p className="text-2xl font-bold text-gray-800 group-hover/item:text-transparent group-hover/item:bg-clip-text group-hover/item:bg-gradient-to-r group-hover/item:from-red-700 group-hover/item:to-red-500 transition-all duration-300 transform group-hover/item:scale-105">
                                    {name}
                                </p>

                                <span className="h-2.5 w-2.5 rounded-full bg-red-500 group-hover/item:animate-ping opacity-75"></span>
                                <span className="h-2.5 w-2.5 rounded-full bg-red-500 absolute right-6 opacity-0 group-hover/item:opacity-100"></span>
                            </motion.div>
                        ))}
                    </div>

                    {/* Decorative background elements */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none animate-pulse-slow"></div>
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none animate-pulse-slow delay-700"></div>
                </motion.div>

                {/* Team Grid */}
                <div className="space-y-12">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl font-bold text-gray-900">
                            Meet the Developers
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                            The brilliant minds behind the MUC Library System, dedicated to innovation and excellence.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
                        {developers.map((dev, index) => (
                            <motion.div
                                key={dev.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="group relative bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-gray-100"
                            >
                                {/* Image Container */}
                                <div className="relative aspect-[4/5] overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                                    <img
                                        src={dev.image}
                                        alt={dev.name}
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                                    />

                                    {/* Social Actions - Slide Up */}
                                    <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-20">
                                        <a
                                            href={dev.linkedin}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full"
                                        >
                                            <button className="w-full flex items-center justify-center space-x-2 bg-white text-[#0077b5] py-3 rounded-xl hover:bg-blue-50 transition-colors font-bold shadow-lg transform active:scale-95 duration-200">
                                                <Linkedin size={20} />
                                                <span>Connect</span>
                                            </button>
                                        </a>
                                    </div>
                                </div>

                                {/* Info Section */}
                                <div className="p-6 text-center relative z-20 bg-white border-t border-gray-50">
                                    <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors duration-300">
                                        {dev.name}
                                    </h3>
                                    <p className="text-sm text-primary-500 font-semibold uppercase tracking-wider">
                                        Developer
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutDevelopers;
