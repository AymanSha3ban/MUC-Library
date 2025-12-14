import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Star, BookOpen, MapPin, Library, FlaskConical } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface Book {
    id: string;
    title: string;
    description: string;
    cover_path: string;
    category: string;
    type: 'free' | 'paid';
    book_format: 'digital' | 'external' | 'physical';
    shelf_location?: string;
    rating: number;
    read_count: number;
    college_id?: string;
    colleges?: { name: string };
    external_link?: string;
    pdf_path?: string;
}

interface College {
    id: string;
    name: string;
}

const Books = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const collegeParam = searchParams.get('college');
    const sectionParam = searchParams.get('section');
    const formatParam = searchParams.get('format');
    const categoryParam = searchParams.get('category');

    const [books, setBooks] = useState<Book[]>([]);
    const [topRatedBooks, setTopRatedBooks] = useState<Book[]>([]);
    const [colleges, setColleges] = useState<College[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCollege, setSelectedCollege] = useState<string>(collegeParam || 'all');
    const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'all');
    const [selectedType, setSelectedType] = useState<'all' | 'free' | 'paid'>('all');
    const [pageTitle, setPageTitle] = useState('Library Collection');

    useEffect(() => {
        fetchColleges();
    }, []);

    useEffect(() => {
        setSelectedCollege(collegeParam || 'all');
    }, [collegeParam]);

    // Reset category when college changes
    useEffect(() => {
        if (selectedCollege === 'all' || colleges.find(c => c.id === selectedCollege)?.name !== 'Engineering') {
            // We might want to keep 'Basic Science & Humanities' even if switching colleges?
            // For now, let's reset to keep it simple, user can re-select.
            setSelectedCategory('all');
        }
    }, [selectedCollege, colleges]);

    useEffect(() => {
        fetchBooks();
        fetchTopRatedBooks();
        updatePageTitle();
    }, [selectedCollege, selectedCategory, selectedType, sectionParam, formatParam, colleges]);

    const fetchColleges = async () => {
        const { data } = await supabase.from('colleges').select('*').order('name');
        if (data) setColleges(data);
    };

    const updatePageTitle = async () => {
        if (formatParam === 'physical') {
            setPageTitle('Physical Books Collection');
        } else if (selectedCollege !== 'all') {
            const college = colleges.find(c => c.id === selectedCollege);
            if (college) {
                if (categoryParam === 'Basic Science & Humanities') {
                    setPageTitle(`${college.name} - Basic Science & Humanities`);
                } else {
                    setPageTitle(`${college.name} Collection`);
                }
            }
        } else {
            setPageTitle('Library Collection');
        }
    };

    const fetchTopRatedBooks = async () => {
        let query = supabase
            .from('books')
            .select('*, colleges(name)')
            .gt('rating', 0)
            .order('rating', { ascending: false })
            .limit(4);

        if (selectedCollege !== 'all') query = query.eq('college_id', selectedCollege);
        if (formatParam === 'physical') query = query.eq('book_format', 'physical');

        if (selectedCategory !== 'all') {
            query = query.eq('category', selectedCategory);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching top rated books:', error);
        } else {
            setTopRatedBooks(data || []);
        }
    };

    const fetchBooks = async () => {
        setLoading(true);
        let query = supabase.from('books').select('*, colleges(name)');

        if (selectedCollege !== 'all') query = query.eq('college_id', selectedCollege);
        if (formatParam === 'physical') query = query.eq('book_format', 'physical');

        if (selectedCategory !== 'all') {
            query = query.eq('category', selectedCategory);
        }

        if (selectedType !== 'all') {
            query = query.eq('type', selectedType);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching books:', error);
        } else {
            setBooks(data || []);
        }
        setLoading(false);
    };

    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getCoverUrl = (path: string) => {
        if (!path) return 'https://via.placeholder.com/300x400?text=No+Cover';
        return supabase.storage.from('books-covers').getPublicUrl(path).data.publicUrl;
    };

    const isEngineering = colleges.find(c => c.id === selectedCollege)?.name === 'Engineering';
    const engineeringCategories = ['Computer', 'Robotics', 'Electrical', 'Architecture'];

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                            {formatParam === 'physical' && <Library className="mr-3 text-emerald-600" size={32} />}
                            {categoryParam === 'Basic Science & Humanities' && <FlaskConical className="mr-3 text-indigo-600" size={32} />}
                            {pageTitle}
                        </h1>
                        {selectedCollege !== 'all' && <p className="text-gray-500 mt-1">Browsing resources for this college</p>}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search books..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none w-full sm:w-64"
                            />
                        </div>

                        {formatParam !== 'physical' && (
                            <div className="flex bg-white rounded-lg p-1 border border-gray-200">
                                {(['all', 'free', 'paid'] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setSelectedType(type)}
                                        className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${selectedType === type
                                            ? 'bg-primary-100 text-primary-700 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center space-x-2 overflow-x-auto pb-2 sm:pb-0">
                            <button
                                onClick={() => {
                                    setSelectedCollege('all');
                                    setSearchParams({});
                                }}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCollege === 'all'
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                    }`}
                            >
                                All
                            </button>

                            {colleges.map(college => (
                                <button
                                    key={college.id}
                                    onClick={() => {
                                        setSelectedCollege(college.id);
                                        setSearchParams({ college: college.id });
                                    }}
                                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCollege === college.id
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                        }`}
                                >
                                    {college.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* College Sections & Categories */}
                {selectedCollege !== 'all' && (
                    <div className="flex flex-wrap gap-2 mb-8 justify-center md:justify-start">
                        <button
                            onClick={() => {
                                setSelectedCategory('all');
                                setSearchParams({ college: selectedCollege });
                            }}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory === 'all' && !sectionParam && !formatParam
                                ? 'bg-gray-800 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            All {colleges.find(c => c.id === selectedCollege)?.name} Books
                        </button>

                        {isEngineering && engineeringCategories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => {
                                    setSelectedCategory(cat.toLowerCase());
                                    setSearchParams({ college: selectedCollege, category: cat.toLowerCase() });
                                }}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory === cat.toLowerCase()
                                    ? 'bg-gray-800 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}

                        <button
                            onClick={() => {
                                setSelectedCategory('Basic Science & Humanities');
                                setSearchParams({ college: selectedCollege, category: 'Basic Science & Humanities' });
                            }}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory === 'Basic Science & Humanities'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200'
                                }`}
                        >
                            Basic Science & Humanities
                        </button>

                        <button
                            onClick={() => {
                                setSearchParams({ college: selectedCollege, format: 'physical' });
                            }}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${formatParam === 'physical'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white text-emerald-600 hover:bg-emerald-50 border border-emerald-200'
                                }`}
                        >
                            Physical Books
                        </button>
                    </div>
                )}

                {
                    !loading && topRatedBooks.length > 0 && selectedType === 'all' && !searchTerm && (
                        <div className="mb-12">
                            <div className="flex items-center mb-6">
                                <Star className="text-yellow-400 mr-2" size={28} fill="currentColor" />
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {selectedCollege === 'all'
                                        ? 'Top Rated Books'
                                        : `Top Rated in ${colleges.find(c => c.id === selectedCollege)?.name || 'College'}`}
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                {topRatedBooks.map((book) => (
                                    <motion.div
                                        key={`top-${book.id}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group border-2 border-yellow-100"
                                    >
                                        <div className="aspect-[3/4] relative overflow-hidden">
                                            <div className="absolute top-2 right-2 z-10 bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md flex items-center">
                                                <Star size={12} fill="currentColor" className="mr-1" />
                                                Top Rated
                                            </div>
                                            <img
                                                src={getCoverUrl(book.cover_path)}
                                                alt={book.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                <Link
                                                    to={`/book/${book.id}`}
                                                    className="px-6 py-2 bg-white text-gray-900 rounded-full font-bold transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                                                >
                                                    View Details
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
                                                    {book.colleges?.name || 'Global'}
                                                </span>
                                                <div className="flex items-center text-yellow-400 text-xs font-bold">
                                                    <Star size={14} fill="currentColor" />
                                                    <span className="ml-1 text-gray-700">{book.rating || 0}</span>
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{book.title}</h3>
                                            <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                                                {book.description || 'No description available.'}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )
                }

                {
                    loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {filteredBooks.map((book) => (
                                <motion.div
                                    key={book.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
                                >
                                    <div className="aspect-[3/4] relative overflow-hidden">
                                        <img
                                            src={getCoverUrl(book.cover_path)}
                                            alt={book.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                            <Link
                                                to={`/book/${book.id}`}
                                                className="px-6 py-2 bg-white text-gray-900 rounded-full font-bold transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                                            >
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
                                                {book.colleges?.name || 'Global'}
                                            </span>
                                            {book.book_format === 'physical' ? (
                                                <span className="text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-700 flex items-center">
                                                    <MapPin size={10} className="mr-1" />
                                                    Physical
                                                </span>
                                            ) : (
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${book.type === 'free' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {book.type || 'free'}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{book.title}</h3>

                                        {book.book_format === 'physical' && book.shelf_location && (
                                            <p className="text-xs text-emerald-600 font-medium mb-2 flex items-center">
                                                <MapPin size={12} className="mr-1" />
                                                {book.shelf_location}
                                            </p>
                                        )}

                                        <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                                            {book.description || 'No description available.'}
                                        </p>

                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="flex items-center text-yellow-400 text-xs">
                                                <Star size={14} fill="currentColor" />
                                                <span className="ml-1 text-gray-600">{book.rating || 0}</span>
                                            </div>
                                            <div className="flex items-center text-gray-400 text-xs">
                                                <BookOpen size={14} className="mr-1" />
                                                <span>{book.read_count || 0} reads</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )
                }
            </div>
        </div>
    );
};

export default Books;
