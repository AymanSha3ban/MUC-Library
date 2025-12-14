import React, { useState, useEffect } from 'react';
import { Upload, Loader2, Edit, Trash2, BookOpen, Plus, School, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [books, setBooks] = useState<any[]>([]);
    const [colleges, setColleges] = useState<any[]>([]);
    const [editingBook, setEditingBook] = useState<any>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('computer');
    const [collegeId, setCollegeId] = useState('');
    const [bookFormat, setBookFormat] = useState<'digital' | 'physical' | 'external' | 'bsh'>('digital');
    const [shelfLocation, setShelfLocation] = useState('');
    const [externalLink, setExternalLink] = useState('');
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [pdfFile, setPdfFile] = useState<File | null>(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchColleges();
        fetchBooks();
    }, [user, navigate]);

    const fetchColleges = async () => {
        const { data, error } = await supabase.from('colleges').select('*').order('name');
        if (error) console.error('Error fetching colleges:', error);
        else setColleges(data || []);
    };

    const fetchBooks = async () => {
        const { data, error } = await supabase
            .from('books')
            .select('*, colleges(name)')
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching books:', error);
        else setBooks(data || []);
    };

    const handleAddCollege = async () => {
        const { value: collegeName } = await Swal.fire({
            title: 'Add New College',
            input: 'text',
            inputLabel: 'College Name',
            inputPlaceholder: 'e.g. Engineering',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) return 'You need to write something!';
            }
        });

        if (collegeName) {
            try {
                const { error } = await supabase.from('colleges').insert([{ name: collegeName }]);
                if (error) throw error;
                Swal.fire('Success', 'College added successfully', 'success');
                fetchColleges();
            } catch (err: any) {
                Swal.fire('Error', err.message, 'error');
            }
        }
    };

    const handleDeleteCollege = async (id: string) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This will also delete all books associated with this college!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const { error } = await supabase.from('colleges').delete().eq('id', id);
                if (error) throw error;
                Swal.fire('Deleted!', 'College has been deleted.', 'success');
                fetchColleges();
            } catch (err: any) {
                Swal.fire('Error', err.message, 'error');
            }
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!editingBook) {
            if (!coverFile) {
                setMessage('Please select a cover image.');
                return;
            }
            if ((bookFormat === 'digital' || bookFormat === 'bsh') && !pdfFile) {
                setMessage('Please select a PDF file for digital books.');
                return;
            }
            if (bookFormat === 'external' && !externalLink) {
                setMessage('Please provide an external link.');
                return;
            }
            if (bookFormat === 'physical' && !shelfLocation) {
                setMessage('Please provide a shelf location.');
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

            // 2. Upload PDF if changed and format is digital or bsh
            if (pdfFile && (bookFormat === 'digital' || bookFormat === 'bsh')) {
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
                category: bookFormat === 'bsh' ? 'Basic Science & Humanities' : category,
                college_id: collegeId || null,
                book_format: bookFormat === 'bsh' ? 'digital' : bookFormat,
                shelf_location: bookFormat === 'physical' ? shelfLocation : null,
                external_link: bookFormat === 'external' ? externalLink : null,
                cover_path: coverPath,
                pdf_path: (bookFormat === 'digital' || bookFormat === 'bsh') ? pdfPath : null,
                type: bookFormat === 'external' ? 'paid' : 'free' // Backward compatibility
            };

            if (editingBook) {
                const { error: updateError } = await supabase
                    .from('books')
                    .update(bookData)
                    .eq('id', editingBook.id);

                if (updateError) throw updateError;
                setMessage('Book updated successfully!');
            } else {
                const { error: insertError } = await supabase
                    .from('books')
                    .insert({
                        ...bookData,
                        created_by: (await supabase.auth.getUser()).data.user?.id
                    });

                if (insertError) throw insertError;
                setMessage('Book added successfully!');
            }

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
            confirmButtonText: 'Yes, delete it!'
        });

        if (!result.isConfirmed) return;

        try {
            const { error } = await supabase.from('books').delete().eq('id', id);
            if (error) throw error;
            Swal.fire('Deleted!', 'Book deleted successfully.', 'success');
            fetchBooks();
        } catch (err: any) {
            Swal.fire('Error!', `Error deleting book: ${err.message}`, 'error');
        }
    };

    const startEdit = (book: any) => {
        setEditingBook(book);
        setTitle(book.title);
        setDescription(book.description);
        setCategory(book.category);
        setCollegeId(book.college_id || '');

        // Determine format based on category and book_format
        let format = book.book_format;
        if (book.category === 'Basic Science & Humanities') {
            format = 'bsh';
        } else if (book.type === 'paid') {
            format = 'external';
        } else if (!format) {
            format = 'digital';
        }
        setBookFormat(format);

        setShelfLocation(book.shelf_location || '');
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
        setCollegeId('');
        setBookFormat('digital');
        setShelfLocation('');
        setExternalLink('');
        setCoverFile(null);
        setPdfFile(null);
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24 flex flex-col h-[calc(100vh-120px)]">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-between flex-shrink-0">
                                <span className="flex items-center">
                                    {editingBook ? <Edit className="mr-2" size={20} /> : <Upload className="mr-2" size={20} />}
                                    {editingBook ? 'Edit Book' : 'Add New Book'}
                                </span>
                                {editingBook && (
                                    <button onClick={resetForm} className="text-sm text-red-600 hover:text-red-700">
                                        Cancel
                                    </button>
                                )}
                            </h2>

                            <form onSubmit={handleUpload} className="flex flex-col h-full overflow-hidden">
                                <div className="overflow-y-auto pr-2 flex-1 space-y-4 mb-4">
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">College / Section</label>
                                        <select
                                            value={collegeId}
                                            onChange={(e) => setCollegeId(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        >
                                            {colleges.map((college) => (
                                                <option key={college.id} value={college.id}>{college.name}</option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">Select the college this book belongs to.</p>
                                    </div>

                                    {colleges.find(c => c.id === collegeId)?.name === 'Engineering' && bookFormat !== 'bsh' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Department / Category</label>
                                            <select
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                            >
                                                <option value="computer">Computer</option>
                                                <option value="robotics">Robotics</option>
                                                <option value="electrical">Electrical</option>
                                                <option value="architecture">Architecture</option>
                                            </select>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Book Format</label>
                                        <select
                                            value={bookFormat}
                                            onChange={(e) => setBookFormat(e.target.value as any)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        >
                                            <option value="digital">Digital (free pdf)</option>
                                            <option value="external">External Link (Paid)</option>
                                            <option value="physical">Physical Book</option>
                                            <option value="bsh">Basic Science & Humanities</option>
                                        </select>
                                    </div>

                                    {bookFormat === 'physical' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Shelf Location</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                                <input
                                                    type="text"
                                                    value={shelfLocation}
                                                    onChange={(e) => setShelfLocation(e.target.value)}
                                                    placeholder="e.g. Row A, Shelf 3"
                                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {bookFormat === 'external' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">External Link</label>
                                            <input
                                                type="url"
                                                value={externalLink}
                                                onChange={(e) => setExternalLink(e.target.value)}
                                                placeholder="https://example.com/book"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                                required
                                            />
                                        </div>
                                    )}

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

                                        {(bookFormat === 'digital' || bookFormat === 'bsh') && (
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
                                        )}
                                    </div>

                                    {message && (
                                        <div className={`p-3 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                            {message}
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary-600 text-white py-2 rounded-lg font-bold hover:bg-primary-700 transition-colors flex items-center justify-center disabled:opacity-70 mt-auto flex-shrink-0"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : (editingBook ? 'Update Book' : 'Add Book')}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* List Section */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Colleges Management */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                                    <School className="mr-2" /> Colleges ({colleges.length})
                                </h2>
                                <button
                                    onClick={handleAddCollege}
                                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <Plus size={18} />
                                    <span>Add College</span>
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {colleges.map((college) => (
                                    <div key={college.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                                        <span className="font-medium text-gray-900">{college.name}</span>
                                        <button
                                            onClick={() => handleDeleteCollege(college.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Books List */}
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
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {book.colleges ? (
                                                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                                                {book.colleges.name}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                                                                Global
                                                            </span>
                                                        )}
                                                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full capitalize">
                                                            {book.book_format}
                                                        </span>
                                                    </div>
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