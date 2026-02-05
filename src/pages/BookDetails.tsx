import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Star, BookOpen, Clock } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import SEO from '../components/SEO';

interface Book {
    id: string;
    title: string;
    description: string;
    cover_path: string | null;
    pdf_path: string;
    category: string;
    type: 'free' | 'paid';
    external_link?: string;
    rating: number;
    read_count: number;
    created_at: string;
    book_format?: 'digital' | 'external' | 'physical';
}

const BookDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, role } = useAuth();

    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [userRating, setUserRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);

    const incrementedRef = useRef(false);

    useEffect(() => {
        if (id) fetchBook();
        return () => {
            incrementedRef.current = false;
        };
    }, [id, user]);

    const fetchBook = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching book:', error);
            navigate('/books');
        } else {
            setBook(data);
            if (data.pdf_path) {
                const { data: { publicUrl } } = supabase.storage
                    .from('books-pdfs')
                    .getPublicUrl(data.pdf_path);
                setPdfUrl(publicUrl);

                if (user && !incrementedRef.current) {
                    incrementedRef.current = true;
                    supabase
                        .rpc('increment_read_count', { book_id: id })
                        .then(({ error }) => {
                            if (error) console.error('Error incrementing read count', error);
                        });
                }
            }

            if (user) {
                const { data: ratingData } = await supabase
                    .from('ratings')
                    .select('rating')
                    .eq('book_id', id)
                    .eq('user_id', user.id)
                    .single();

                if (ratingData) {
                    setUserRating(ratingData.rating);
                }
            }
        }
        setLoading(false);
    };

    const handleRate = async (rating: number) => {
        if (!user) {
            Swal.fire('Error', 'You must be logged in to rate books.', 'error');
            return;
        }

        try {
            const { error } = await supabase
                .from('ratings')
                .upsert({
                    book_id: id,
                    user_id: user.id,
                    rating: rating
                }, { onConflict: 'user_id,book_id' });

            if (error) throw error;

            setUserRating(rating);

            const { data: updatedBook } = await supabase
                .from('books')
                .select('rating')
                .eq('id', id)
                .single();

            if (updatedBook) {
                setBook(prev => prev ? { ...prev, rating: updatedBook.rating } : null);
            }

            Swal.fire({
                icon: 'success',
                title: 'Rated!',
                text: `You rated this book ${rating} stars.`,
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error: any) {
            console.error('Error rating book:', error);
            Swal.fire('Error', error.message, 'error');
        }
    };

    const getCoverUrl = (path: string | null) => {
        if (!path) return '';
        return supabase.storage.from('books-covers').getPublicUrl(path).data.publicUrl;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!book) return null;

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-slate-950 transition-colors duration-700">
            <SEO
                title={book.title}
                description={book.description}
                image={book.cover_path ? getCoverUrl(book.cover_path) : undefined}
                type="book"
            />
            <div className="max-w-7xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-600 hover:text-primary-600 mb-8 transition-colors dark:text-slate-400 dark:hover:text-red-400"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Library
                </button>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden dark:bg-slate-900/50 dark:backdrop-blur-md dark:border dark:border-white/10 dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
                    <div className="grid grid-cols-1 lg:grid-cols-3">
                        {/* Sidebar / Cover */}
                        <div className="lg:col-span-1 bg-gray-100 dark:bg-slate-900/50 p-8 flex flex-col items-center border-r dark:border-white/5">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full max-w-sm shadow-2xl rounded-lg overflow-hidden mb-6 bg-white aspect-[3/4] flex items-center justify-center relative"
                            >
                                {book.cover_path ? (
                                    <img
                                        src={getCoverUrl(book.cover_path)}
                                        alt={book.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-purple-950/70 to-red-950/70 p-8 text-center border-2 border-white/20 shadow-inner shadow-white/5 relative overflow-hidden">
                                        <div className="absolute inset-0 z-0 bg-gradient-to-br from-transparent via-red-900/10 to-transparent animate-pulse opacity-20" /> {/* Subtle glowing effect */}
                                        <div className="p-6 bg-white/10 rounded-full mb-6 backdrop-blur-md shadow-lg border border-white/20 z-10">
                                            <BookOpen size={80} strokeWidth={0.8} className="text-white/70" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2 line-clamp-3 leading-tight px-4 z-10 font-serif">
                                            {book.title}
                                        </h3>
                                        {book.book_format === 'physical' && (
                                            <span className="mt-4 py-1.5 px-4 rounded-full text-xs font-bold uppercase tracking-widest bg-red-800/60 text-white shadow-sm ring-1 ring-white/20 z-10">
                                                Physical Copy
                                            </span>
                                        )}
                                    </div>
                                )}
                            </motion.div>

                            <div className="w-full max-w-sm space-y-4">
                                {book.type === 'free' && pdfUrl && (
                                    <a
                                        href={pdfUrl}
                                        download
                                        className="flex items-center justify-center w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors dark:bg-gradient-to-r dark:from-emerald-600 dark:to-teal-700 dark:hover:from-emerald-700 dark:hover:to-teal-800 shadow-lg dark:shadow-emerald-900/20"
                                    >
                                        <Download size={20} className="mr-2" />
                                        Download PDF
                                    </a>
                                )}

                                {book.type === 'paid' && book.external_link && (
                                    <a
                                        href={book.external_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors dark:bg-gradient-to-r dark:from-sky-600 dark:to-blue-700 dark:hover:from-sky-700 dark:hover:to-blue-800 shadow-lg dark:shadow-blue-900/20"
                                    >
                                        <BookOpen size={20} className="mr-2" />
                                        Go to Source
                                    </a>
                                )}
                                {role === 'admin' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => navigate('/admin', { state: { editBook: book } })}
                                            className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:border-slate-600 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const result = await Swal.fire({
                                                    title: 'Are you sure?',
                                                    text: "You won't be able to revert this!",
                                                    icon: 'warning',
                                                    showCancelButton: true,
                                                    confirmButtonColor: '#d33',
                                                    cancelButtonColor: '#3085d6',
                                                    confirmButtonText: 'Yes, delete it!'
                                                });

                                                if (result.isConfirmed) {
                                                    try {
                                                        const { error } = await supabase.from('books').delete().eq('id', id);
                                                        if (error) throw error;

                                                        await Swal.fire(
                                                            'Deleted!',
                                                            'The book has been deleted.',
                                                            'success'
                                                        );
                                                        navigate('/');
                                                    } catch (err: any) {
                                                        console.error('Error deleting book:', err);
                                                        Swal.fire(
                                                            'Error!',
                                                            `Error deleting book: ${err.message}`,
                                                            'error'
                                                        );
                                                    }
                                                }
                                            }}
                                            className="flex-1 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:border-red-700 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="lg:col-span-2 p-8 lg:p-12">
                            <div className="flex items-center space-x-4 mb-4">
                                <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium uppercase tracking-wide dark:bg-red-900/30 dark:text-red-300 dark:border dark:border-red-900">
                                    {book.category}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium uppercase tracking-wide ${book.type === 'free' ? 'bg-green-100 text-green-800 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border dark:border-emerald-900' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:border dark:border-blue-900'
                                    }`}>
                                    {book.type}
                                </span>
                                <div className="flex items-center text-yellow-400 dark:text-yellow-300">
                                    <Star size={18} fill="currentColor" />
                                    <span className="ml-1 text-gray-900 dark:text-slate-100 font-bold">{book.rating}</span>
                                </div>
                            </div>

                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 font-serif tracking-tight">{book.title}</h1>

                            <div className="flex items-center space-x-8 text-gray-500 mb-8 pb-8 border-b border-gray-100 dark:text-slate-400 dark:border-white/10">
                                <div className="flex items-center">
                                    <BookOpen size={20} className="mr-2" />
                                    <span>{book.read_count} Reads</span>
                                </div>
                                <div className="flex items-center">
                                    <Clock size={20} className="mr-2" />
                                    <span>Added {new Date(book.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="mb-8 p-6 bg-gray-50 rounded-xl dark:bg-slate-900/50 dark:border dark:border-white/5">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Rate this book</h3>
                                <div className="flex items-center space-x-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            onClick={() => handleRate(star)}
                                            className="focus:outline-none transition-transform hover:scale-110"
                                        >
                                            <Star
                                                size={32}
                                                className={`${star <= (hoverRating || userRating)
                                                    ? 'text-yellow-400 dark:text-yellow-300 fill-current'
                                                    : 'text-gray-300 dark:text-slate-600'
                                                    } transition-colors`}
                                            />
                                        </button>
                                    ))}
                                    <span className="ml-3 text-sm text-gray-500">
                                        {userRating > 0 ? `Your rating: ${userRating}` : 'Click to rate'}
                                    </span>
                                </div>
                            </div>

                            <div className="prose max-w-none mb-12 dark:prose-invert">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Description</h3>
                                <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
                                    {book.description || 'No description available.'}
                                </p>
                            </div>

                            {book.type === 'free' && pdfUrl && (
                                <div className="mt-8">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Preview</h3>
                                    <div className="w-full h-[600px] bg-gray-100 rounded-xl overflow-hidden border border-gray-200 dark:bg-slate-900 dark:border-slate-700">
                                        <iframe
                                            src={`https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
                                            className="w-full h-full"
                                            title="PDF Viewer"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookDetails;