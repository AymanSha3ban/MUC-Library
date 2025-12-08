import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Cpu, Zap, PenTool, ArrowRight } from 'lucide-react';

const Book3D = () => {
    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh rotation={[0, 0.5, 0]}>
                <boxGeometry args={[2, 3, 0.5]} />
                <meshStandardMaterial color="#D32F2F" />
            </mesh>
            <mesh position={[0, 0, 0.26]}>
                <boxGeometry args={[1.9, 2.9, 0.05]} />
                <meshStandardMaterial color="#FFFFFF" />
            </mesh>
        </Float>
    );
};

const Home = () => {
    const categories = [
        { id: 'computer', name: 'Computer Engineering', icon: Cpu, color: 'bg-blue-500' },
        { id: 'robotics', name: 'Robotics', icon: Zap, color: 'bg-yellow-500' },
        { id: 'electrical', name: 'Electrical Engineering', icon: Zap, color: 'bg-orange-500' }, // Reusing Zap for now
        { id: 'architecture', name: 'Architecture', icon: PenTool, color: 'bg-purple-500' },
    ];

    return (
        <div className="min-h-screen pt-16">
            {/* Hero Section */}
            <section className="relative h-[600px] bg-gray-900 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-transparent z-10" />

                <div className="absolute inset-0 z-0 opacity-30">
                    {/* Placeholder for university image */}
                    <div className="w-full h-full bg-[url('/bg2.png')] bg-cover bg-center" />
                </div>

                <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                                MUC Engineering <span className="text-primary-500">Library</span>
                            </h1>
                            <p className="text-xl text-gray-300 mb-8 max-w-lg">
                                Access thousands of resources for Computer, Robotics, Electrical, and Architecture engineering.
                            </p>
                            <Link
                                to="/books"
                                className="inline-flex items-center space-x-2 px-8 py-4 bg-primary-600 text-white rounded-full font-bold text-lg hover:bg-primary-700 transition-colors"
                            >
                                <span>Browse Library</span>
                                <ArrowRight size={24} />
                            </Link>
                        </motion.div>

                        <div className="h-[400px] w-full hidden md:block">
                            <Canvas camera={{ position: [0, 0, 5] }}>
                                <ambientLight intensity={0.5} />
                                <pointLight position={[10, 10, 10]} />
                                <Suspense fallback={null}>
                                    <Book3D />
                                    <OrbitControls enableZoom={false} autoRotate />
                                </Suspense>
                            </Canvas>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Browse by Department</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Find resources tailored to your specific field of study.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {categories.map((category, index) => (
                            <motion.div
                                key={category.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Link
                                    to={`/books?category=${category.id}`}
                                    className="block group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                                >
                                    <div className={`h-2 bg-gradient-to-r ${category.color} to-primary-500`} />
                                    <div className="p-8">
                                        <div className={`w-14 h-14 ${category.color} bg-opacity-10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                            <category.icon className={`text-${category.color.split('-')[1]}-600`} size={32} />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{category.name}</h3>
                                        <p className="text-gray-500 text-sm">Explore books & resources</p>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
