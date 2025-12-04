import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Star, BookOpen, Clock } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

interface Book {
    id: string;
    title: string;
    description: string;
    cover_path: string;
    pdf_path: string;
    category: string;
    rating: number;
    read_count: number;
    created_at: string;
}

const BookDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, role } = useAuth();

    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);

    useEffect(() => {
        if (id) fetchBook();
    }, [id]);

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
                // Get signed URL for PDF if it's private, or public URL if public bucket
                // 'books-pdfs' is public in my setup, so getPublicUrl
                const { data: { publicUrl } } = supabase.storage
                    .from('books-pdfs')
                    .getPublicUrl(data.pdf_path);
                setPdfUrl(publicUrl);

                // Increment read count
                // Only if student? Or anyone?
                if (user) {
                    supabase.rpc('increment_read_count', { book_id: id }); // Need to implement RPC or just update
                    // Simple update for now
                    supabase
                        .from('books')
                        .update({ read_count: (data.read_count || 0) + 1 })
                        .eq('id', id)
                        .then(({ error }) => {
                            if (error) console.error('Error incrementing read count', error);
                        });
                }
            }
        }
        setLoading(false);
    };

    const getCoverUrl = (path: string) => {
        if (!path) return 'https://via.placeholder.com/300x400?text=No+Cover';
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
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-600 hover:text-primary-600 mb-8 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Library
                </button>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-3">
                        {/* Sidebar / Cover */}
                        <div className="lg:col-span-1 bg-gray-100 p-8 flex flex-col items-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full max-w-sm shadow-2xl rounded-lg overflow-hidden mb-6"
                            >
                                <img
                                    src={getCoverUrl(book.cover_path)}
                                    alt={book.title}
                                    className="w-full h-auto"
                                />
                            </motion.div>

                            <div className="w-full max-w-sm space-y-4">
                                {pdfUrl && (
                                    <a
                                        href={pdfUrl}
                                        download
                                        className="flex items-center justify-center w-full py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors"
                                    >
                                        <Download size={20} className="mr-2" />
                                        Download PDF
                                    </a>
                                )}
                                {role === 'admin' && (
                                    <div className="flex gap-2">
                                        <button className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Edit</button>
                                        <button className="flex-1 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">Delete</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="lg:col-span-2 p-8 lg:p-12">
                            <div className="flex items-center space-x-4 mb-4">
                                <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium uppercase tracking-wide">
                                    {book.category}
                                </span>
                                <div className="flex items-center text-yellow-400">
                                    <Star size={18} fill="currentColor" />
                                    <span className="ml-1 text-gray-900 font-bold">{book.rating}</span>
                                </div>
                            </div>

                            <h1 className="text-4xl font-bold text-gray-900 mb-6">{book.title}</h1>

                            <div className="flex items-center space-x-8 text-gray-500 mb-8 pb-8 border-b border-gray-100">
                                <div className="flex items-center">
                                    <BookOpen size={20} className="mr-2" />
                                    <span>{book.read_count} Reads</span>
                                </div>
                                <div className="flex items-center">
                                    <Clock size={20} className="mr-2" />
                                    <span>Added {new Date(book.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="prose max-w-none mb-12">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Description</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {book.description || 'No description available.'}
                                </p>
                            </div>

                            {/* PDF Viewer */}
                            {pdfUrl && (
                                <div className="mt-8">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">Preview</h3>
                                    <div className="w-full h-[600px] bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
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
