// import React from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

const developers = [
    { name: 'Ayman Shaaban', image: '/Ayman.png' },
    { name: 'Omran Amr', image: '/Omran.png' },
    { name: 'Karim reda', image: '/Karim.png' },
    { name: 'Abdo Nasr', image: '/Abdohatem.png' },
    { name: 'Abdo Hatem', image: '/Abdonasr.png' },
    { name: 'Abdo Elmasry', image: '/Abdomasry.png' },
    { name: 'Sharqawy', image: '/Sharqawy.png' },
    { name: 'Yousef Elbadre', image: '/Yousefbadre.png' },
    { name: 'Yousef', image: '/Yousef.png' },
    { name: 'Mohammed Sayed', image: '/Mohamed.png' },
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
                            MUC Library is a comprehensive project developed by a group of third-year students from the Computer Engineering Department in 2025. The website aims to serve as the University's central digital library, hosting specialized resources and books for all engineering divisions (Computer, Robotics, Electrical, and Architecture), ensuring students have efficient access to modern academic materials.
                        </p>
                    </motion.div>
                </div>

                {/* Team Grid */}
                <div className="space-y-8">
                    <h2 className="text-2xl font-bold text-center text-gray-900">
                        Meet the Developers
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                        {developers.map((dev, index) => (
                            <motion.div
                                key={dev.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex flex-col items-center space-y-4 group cursor-pointer"
                            >
                                <motion.div
                                    whileHover={{
                                        scale: 1.15,
                                        rotate: 5,
                                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                                    }}
                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                    className="w-48 h-48 rounded-2xl overflow-hidden shadow-lg border-4 border-white group-hover:border-primary-500 transition-colors duration-300 bg-white"
                                >
                                    <img
                                        src={dev.image}
                                        alt={dev.name}
                                        className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                                    />
                                </motion.div>
                                <motion.h3
                                    className="font-bold text-gray-900 text-center group-hover:text-primary-600 transition-colors duration-300"
                                    layout
                                >
                                    {dev.name}
                                </motion.h3>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutDevelopers;
