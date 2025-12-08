import React, { useState, useEffect } from 'react';

import { Upload, Plus, Loader2, Edit, Trash2, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';

const AdminDashboard = () => {
    const { role } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect if not admin
    if (role && role !== 'admin') {
        navigate('/');
        return null;
    }

    const [books, setBooks] = useState<any[]>([]);
    const [editingBook, setEditingBook] = useState<any | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('computer');
    const [bookType, setBookType] = useState<'free' | 'paid'>('free');
    const [externalLink, setExternalLink] = useState('');
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Fetch books on mount
    useEffect(() => {
        fetchBooks();
        if (location.state?.editBook) {
            startEdit(location.state.editBook);
            // Optional: Clear state so it doesn't persist if they navigate away and back? 
            // For now, this is fine.
            window.history.replaceState({}, document.title);
        }
    }, []);

    const fetchBooks = async () => {
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching books:', error);
        else setBooks(data || []);
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation: For new books, files are required. For edit, they are optional.
        if (!editingBook) {
            if (!coverFile) {
                setMessage('Please select a cover image.');
                return;
            }
            if (bookType === 'free' && !pdfFile) {
                setMessage('Please select a PDF file for free books.');
                return;
            }
            if (bookType === 'paid' && !externalLink) {
                setMessage('Please provide an external link for paid books.');
                return;
            }
        }

        setLoading(true);
        setMessage('');

        try {
            let coverPath = editingBook?.cover_path;
            let pdfPath = editingBook?.pdf_path;

            // 1. Upload Cover if changed
            if (coverFile) {
                const coverExt = coverFile.name.split('.').pop();
                const coverName = `${Date.now()}-cover.${coverExt}`;
                const { data: coverData, error: coverError } = await supabase.storage
                    .from('books-covers')
                    .upload(coverName, coverFile);

                if (coverError) throw coverError;
                coverPath = coverData.path;
            }

            // 2. Upload PDF if changed
            if (pdfFile) {
                const pdfExt = pdfFile.name.split('.').pop();
                const pdfName = `${Date.now()}-book.${pdfExt}`;
                const { data: pdfData, error: pdfError } = await supabase.storage
                    .from('books-pdfs')
                    .upload(pdfName, pdfFile);

                if (pdfError) throw pdfError;
                pdfPath = pdfData.path;
            }

            const bookData = {
                title,
                description,
                category,
                type: bookType,
                external_link: bookType === 'paid' ? externalLink : null,
                cover_path: coverPath,
                pdf_path: bookType === 'free' ? pdfPath : null,
            };

            if (editingBook) {
                // Update existing book
                const { error: updateError } = await supabase
                    .from('books')
                    .update(bookData)
                    .eq('id', editingBook.id);

                if (updateError) throw updateError;
                setMessage('Book updated successfully!');
            } else {
                // Insert new book
                const { error: insertError } = await supabase
                    .from('books')
                    .insert({
                        ...bookData,
                        created_by: (await supabase.auth.getUser()).data.user?.id
                    });

                if (insertError) throw insertError;
                setMessage('Book added successfully!');
            }

            // Reset form and refresh list
            resetForm();
            fetchBooks();

        } catch (err: any) {
            console.error('Operation error:', err);
            setMessage(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };





    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (!result.isConfirmed) return;

        try {
            const { error } = await supabase.from('books').delete().eq('id', id);
            if (error) throw error;

            Swal.fire(
                'Deleted!',
                'Book deleted successfully.',
                'success'
            );
            fetchBooks();
        } catch (err: any) {
            console.error('Delete error:', err);
            Swal.fire(
                'Error!',
                `Error deleting book: ${err.message}`,
                'error'
            );
        }
    };

    const startEdit = (book: any) => {
        setEditingBook(book);
        setTitle(book.title);
        setDescription(book.description);
        setCategory(book.category);
        setBookType(book.type || 'free');
        setExternalLink(book.external_link || '');
        setCoverFile(null);
        setPdfFile(null);
        setMessage('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditingBook(null);
        setTitle('');
        setDescription('');
        setCategory('computer');
        setBookType('free');
        setExternalLink('');
        setCoverFile(null);
        setPdfFile(null);
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-between">
                                <span className="flex items-center">
                                    {editingBook ? <Edit className="mr-2" size={20} /> : <Plus className="mr-2" size={20} />}
                                    {editingBook ? 'Edit Book' : 'Add New Book'}
                                </span>
                                {editingBook && (
                                    <button onClick={resetForm} className="text-sm text-red-600 hover:text-red-700">
                                        Cancel
                                    </button>
                                )}
                            </h2>

                            <form onSubmit={handleUpload} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Book Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    >
                                        <option value="computer">Computer Engineering</option>
                                        <option value="robotics">Robotics</option>
                                        <option value="electrical">Electrical Engineering</option>
                                        <option value="architecture">Architecture</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Book Type</label>
                                    <select
                                        value={bookType}
                                        onChange={(e) => setBookType(e.target.value as 'free' | 'paid')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    >
                                        <option value="free">Free (PDF)</option>
                                        <option value="paid">Paid (External Link)</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {editingBook ? 'Update Cover (Optional)' : 'Cover Image'}
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                        />
                                    </div>



                                    {bookType === 'free' ? (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {editingBook ? 'Update PDF (Optional)' : 'Book PDF'}
                                            </label>
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">External Link</label>
                                            <input
                                                type="url"
                                                value={externalLink}
                                                onChange={(e) => setExternalLink(e.target.value)}
                                                placeholder="https://example.com/book"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                                required={bookType === 'paid'}
                                            />
                                        </div>
                                    )}
                                </div>

                                {message && (
                                    <div className={`p-3 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                        {message}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary-600 text-white py-2 rounded-lg font-bold hover:bg-primary-700 transition-colors flex items-center justify-center disabled:opacity-70"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : (editingBook ? 'Update Book' : 'Add Book')}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* List Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                <BookOpen className="mr-2" /> Library Collection ({books.length})
                            </h2>

                            <div className="space-y-4">
                                {books.map((book) => (
                                    <div key={book.id} className="flex items-start p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div className="w-16 h-24 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                                            {book.cover_path ? (
                                                <img
                                                    src={supabase.storage.from('books-covers').getPublicUrl(book.cover_path).data.publicUrl}
                                                    alt={book.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <BookOpen size={24} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="ml-4 flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{book.title}</h3>
                                                    <p className="text-sm text-gray-500 capitalize">{book.category}</p>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => startEdit(book)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(book.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{book.description}</p>
                                        </div>
                                    </div>
                                ))}

                                {books.length === 0 && (
                                    <div className="text-center py-12 text-gray-500">
                                        No books found. Add your first book!
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
