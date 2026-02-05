import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Star, BookOpen, MapPin, Library, FlaskConical } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { analytics } from '../lib/analytics';

interface Book {
    id: string;
    title: string;
    description: string;
    cover_path: string | null;
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
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCollege, setSelectedCollege] = useState<string>(collegeParam || 'all');
    const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'all');
    const [selectedType, setSelectedType] = useState<'all' | 'free' | 'paid'>('all');
    const [pageTitle, setPageTitle] = useState('Library Collection');
    const [categoryCount, setCategoryCount] = useState(0);

    useEffect(() => {
        fetchColleges();
        fetchDepartments();
    }, []);

    useEffect(() => {
        setSelectedCollege(collegeParam || 'all');
    }, [collegeParam]);

    useEffect(() => {
        if (selectedCollege === 'all' || colleges.find(c => c.id === selectedCollege)?.name !== 'Engineering') {
            setSelectedCategory('all');
        }
    }, [selectedCollege, colleges]);

    useEffect(() => {
        fetchBooks();
        fetchTopRatedBooks();
        updatePageTitle();
        if (selectedCategory !== 'all') {
            analytics.getCategoryBookCount(selectedCategory, selectedCollege).then(setCategoryCount);
        } else {
            setCategoryCount(0);
        }
    }, [selectedCollege, selectedCategory, selectedType, sectionParam, formatParam, colleges]);

    const fetchColleges = async () => {
        const { data } = await supabase.from('colleges').select('*').order('name');
        if (data) setColleges(data);
    };

    const fetchDepartments = async () => {
        const { data } = await supabase.from('departments').select('*').order('name');
        if (data) setDepartments(data);
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
            query = query.ilike('category', selectedCategory);
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
            query = query.ilike('category', selectedCategory);
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

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-slate-950 transition-colors duration-700">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 flex items-center">
                            {formatParam === 'physical' && <Library className="mr-3 text-emerald-600" size={32} />}
                            {categoryParam === 'Basic Science & Humanities' && <FlaskConical className="mr-3 text-indigo-600" size={32} />}
                            {pageTitle}
                        </h1>
                        <div className="flex flex-col mt-1">
                            {selectedCollege !== 'all' && <p className="text-gray-500 dark:text-slate-400">Browsing resources for this college</p>}
                            {selectedCategory !== 'all' && (
                                <p className="text-primary-600 font-medium text-sm animate-fade-in">
                                    Showing {categoryCount} books in this category
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search books..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none w-full sm:w-64 dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-red-500 dark:focus:border-red-500 transition-colors"
                            />
                        </div>

                        <div className="flex bg-white rounded-lg p-1 border border-gray-200 dark:bg-slate-900/50 dark:border-slate-800">
                            {(['all', 'free', 'paid'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => {
                                        setSelectedType(type);
                                        if (formatParam === 'physical') {
                                            setSearchParams(prev => {
                                                const newParams = new URLSearchParams(prev);
                                                newParams.delete('format');
                                                return newParams;
                                            });
                                        }
                                    }}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${selectedType === type && formatParam !== 'physical'
                                        ? 'bg-primary-100 text-primary-700 shadow-sm dark:bg-red-900/30 dark:text-red-300 dark:border dark:border-red-900/50'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                            <button
                                onClick={() => {
                                    setSelectedType('all');
                                    setSearchParams(prev => {
                                        const newParams = new URLSearchParams(prev);
                                        newParams.set('format', 'physical');
                                        return newParams;
                                    });
                                }}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${formatParam === 'physical'
                                    ? 'bg-primary-100 text-primary-700 shadow-sm dark:bg-red-900/30 dark:text-red-300 dark:border dark:border-red-900/50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
                                    }`}
                            >
                                Physical
                            </button>
                        </div>

                        <div className="flex items-center space-x-2 overflow-x-auto pb-2 sm:pb-0">
                            <button
                                onClick={() => {
                                    setSelectedCollege('all');
                                    setSearchParams({});
                                }}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCollege === 'all'
                                    ? 'bg-primary-600 text-white dark:bg-red-700'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800'
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
                                        ? 'bg-primary-600 text-white dark:bg-red-700'
                                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800'
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
                                ? 'bg-gray-800 text-white dark:bg-slate-700'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
                                }`}
                        >
                            All {colleges.find(c => c.id === selectedCollege)?.name} Books
                        </button>

                        {departments
                            .filter(d => d.college_id === selectedCollege)
                            .map(dept => (
                                <button
                                    key={dept.id}
                                    onClick={() => {
                                        setSelectedCategory(dept.name);
                                        setSearchParams({ college: selectedCollege, category: dept.name });
                                    }}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory === dept.name
                                        ? 'bg-indigo-600 text-white dark:bg-indigo-700'
                                        : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200 dark:bg-slate-900/50 dark:text-indigo-400 dark:border-slate-800 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    {dept.name}
                                </button>
                            ))
                        }
                    </div>
                )}

                {
                    !loading && topRatedBooks.length > 0 && selectedType === 'all' && !searchTerm && (
                        <div className="mb-12">
                            <div className="flex items-center mb-6">
                                <Star className="text-yellow-400 mr-2" size={28} fill="currentColor" />
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
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
                                        className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group border-2 border-yellow-100 dark:bg-white/5 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] dark:hover:bg-white/10 dark:hover:shadow-[0_0_20px_rgba(225,29,72,0.2)]"
                                    >
                                        <div className="aspect-[3/4] relative overflow-hidden bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                                            <div className="absolute top-2 right-2 z-10 bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md flex items-center">
                                                <Star size={12} fill="currentColor" className="mr-1" />
                                                Top Rated
                                            </div>

                                            {/* Chic Fallback for Missing Cover */}
                                            {book.cover_path ? (
                                                <img
                                                    src={supabase.storage.from('books-covers').getPublicUrl(book.cover_path).data.publicUrl}
                                                    alt={book.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-indigo-50/50 to-slate-200/50 dark:from-purple-900/50 dark:to-rose-900/50 p-4 text-center group-hover:from-primary-50/50 group-hover:to-primary-100/50 dark:group-hover:from-red-900/50 dark:group-hover:to-purple-900/50 transition-all duration-500 border dark:border-white/10">
                                                    <BookOpen size={48} strokeWidth={1} className="text-slate-400 dark:text-white/60 mb-2 opacity-70 group-hover:text-primary-500 dark:group-hover:text-red-300 transition-colors duration-500" />
                                                    <span className="text-xs text-slate-500 dark:text-white/70 font-semibold mt-2 line-clamp-2">Defualt Cover</span>
                                                </div>
                                            )}

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
                                            <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-1 line-clamp-1">{book.title}</h3>
                                            <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mb-4">
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
                                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group dark:bg-white/5 dark:backdrop-blur-xl dark:border dark:border-white/10 dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] dark:hover:bg-white/10 dark:hover:shadow-[0_0_20px_rgba(225,29,72,0.2)]"
                                >
                                    <div className="aspect-[3/4] relative overflow-hidden bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                                        {/* Chic Fallback for Missing Cover */}
                                        {book.cover_path ? (
                                            <img
                                                src={supabase.storage.from('books-covers').getPublicUrl(book.cover_path).data.publicUrl}
                                                alt={book.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-indigo-50/50 to-slate-200/50 dark:from-purple-900/50 dark:to-rose-900/50 p-4 text-center group-hover:from-primary-50/50 group-hover:to-primary-100/50 dark:group-hover:from-red-900/50 dark:group-hover:to-purple-900/50 transition-all duration-500 border dark:border-white/10">
                                                <BookOpen size={64} strokeWidth={1} className="text-slate-400 dark:text-white/60 mb-2 opacity-70 group-hover:text-primary-500 dark:group-hover:text-red-300 transition-colors duration-500" />
                                                <span className="text-sm text-slate-500 dark:text-white/70 font-semibold mt-2 line-clamp-2">Book Cover</span>
                                            </div>
                                        )}

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
                                            <span className="text-xs font-semibold text-primary-600 dark:text-red-400 uppercase tracking-wider">
                                                {book.colleges?.name || 'Global'}
                                            </span>
                                            {book.book_format === 'physical' ? (
                                                <span className="text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border dark:border-emerald-900/50 flex items-center">
                                                    <MapPin size={10} className="mr-1" />
                                                    Physical
                                                </span>
                                            ) : (
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${book.type === 'free' ? 'bg-green-100 text-green-700 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border dark:border-emerald-900/50' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border dark:border-blue-900/50'
                                                    }`}>
                                                    {book.type || 'free'}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-1 line-clamp-1">{book.title}</h3>

                                        {book.book_format === 'physical' && book.shelf_location && (
                                            <p className="text-xs text-emerald-600 font-medium mb-2 flex items-center">
                                                <MapPin size={12} className="mr-1" />
                                                {book.shelf_location}
                                            </p>
                                        )}

                                        <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mb-4">
                                            {book.description || 'No description available.'}
                                        </p>

                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="flex items-center text-yellow-400 dark:text-yellow-300 text-xs">
                                                <Star size={14} fill="currentColor" />
                                                <span className="ml-1 text-gray-600 dark:text-gray-400">{book.rating || 0}</span>
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