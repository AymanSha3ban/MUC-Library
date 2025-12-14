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
        setMessage('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
                    <div className="text-sm text-gray-500 font-medium bg-white px-4 py-2 rounded-full shadow-soft border border-gray-100">
                        Welcome back, Admin
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Form Section */}
                    <div className="lg:col-span-4">
                        <div className="glass rounded-3xl p-6 sticky top-24 flex flex-col h-[calc(100vh-120px)] transition-all duration-300 hover:shadow-float border border-white/40">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-between flex-shrink-0">
                                <span className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${editingBook ? 'bg-blue-100 text-blue-600' : 'bg-primary-100 text-primary-600'}`}>
                                        {editingBook ? <Edit size={20} /> : <Upload size={20} />}
                                    </div>
                                    {editingBook ? 'Edit Book' : 'Add New Book'}
                                </span>
                                {editingBook && (
                                    <button onClick={resetForm} className="text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 px-3 py-1 rounded-full transition-colors">
                                        Cancel
                                    </button>
                                )}
                            </h2>

                            <form onSubmit={handleUpload} className="flex flex-col h-full overflow-hidden">
                                <div className="overflow-y-auto pr-2 flex-1 space-y-5 mb-4 scrollbar-default">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-gray-700 ml-1">Book Title</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all duration-200"
                                            placeholder="Enter book title"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-gray-700 ml-1">Description</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all duration-200 resize-none"
                                            placeholder="Brief description of the book..."
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-gray-700 ml-1">College / Section</label>
                                        <div className="relative">
                                            <select
                                                value={collegeId}
                                                onChange={(e) => setCollegeId(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all duration-200 appearance-none"
                                            >
                                                <option value="" disabled>Select College</option>
                                                {colleges.map((college) => (
                                                    <option key={college.id} value={college.id}>{college.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>

                                    {colleges.find(c => c.id === collegeId)?.name === 'Engineering' && bookFormat !== 'bsh' && (
                                        <div className="space-y-1.5 animate-fade-in">
                                            <label className="block text-sm font-semibold text-gray-700 ml-1">Department</label>
                                            <div className="relative">
                                                <select
                                                    value={category}
                                                    onChange={(e) => setCategory(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all duration-200 appearance-none"
                                                >
                                                    <option value="computer">Computer</option>
                                                    <option value="robotics">Robotics</option>
                                                    <option value="electrical">Electrical</option>
                                                    <option value="architecture">Architecture</option>
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-gray-700 ml-1">Format</label>
                                        <div className="relative">
                                            <select
                                                value={bookFormat}
                                                onChange={(e) => setBookFormat(e.target.value as any)}
                                                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all duration-200 appearance-none"
                                            >
                                                <option value="digital">Digital (PDF)</option>
                                                <option value="external">External Link (Paid)</option>
                                                <option value="physical">Physical Book</option>
                                                <option value="bsh">Basic Science & Humanities</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>

                                    {bookFormat === 'physical' && (
                                        <div className="space-y-1.5 animate-fade-in">
                                            <label className="block text-sm font-semibold text-gray-700 ml-1">Shelf Location</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                                <input
                                                    type="text"
                                                    value={shelfLocation}
                                                    onChange={(e) => setShelfLocation(e.target.value)}
                                                    placeholder="e.g. Row A, Shelf 3"
                                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all duration-200"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {bookFormat === 'external' && (
                                        <div className="space-y-1.5 animate-fade-in">
                                            <label className="block text-sm font-semibold text-gray-700 ml-1">External Link</label>
                                            <input
                                                type="url"
                                                value={externalLink}
                                                onChange={(e) => setExternalLink(e.target.value)}
                                                placeholder="https://example.com/book"
                                                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all duration-200"
                                                required
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-4 pt-2">
                                        <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50/30 transition-all duration-300 group cursor-pointer relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="flex flex-col items-center justify-center text-center space-y-2">
                                                <div className="p-2 bg-gray-100 rounded-full group-hover:bg-primary-100 transition-colors">
                                                    <Upload size={20} className="text-gray-500 group-hover:text-primary-600" />
                                                </div>
                                                <div className="text-sm">
                                                    <span className="font-semibold text-primary-600">Click to upload</span>
                                                    <span className="text-gray-500"> cover image</span>
                                                </div>
                                                {coverFile && <p className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">{coverFile.name}</p>}
                                            </div>
                                        </div>

                                        {(bookFormat === 'digital' || bookFormat === 'bsh') && (
                                            <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50/30 transition-all duration-300 group cursor-pointer relative animate-fade-in">
                                                <input
                                                    type="file"
                                                    accept=".pdf"
                                                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                />
                                                <div className="flex flex-col items-center justify-center text-center space-y-2">
                                                    <div className="p-2 bg-gray-100 rounded-full group-hover:bg-primary-100 transition-colors">
                                                        <Upload size={20} className="text-gray-500 group-hover:text-primary-600" />
                                                    </div>
                                                    <div className="text-sm">
                                                        <span className="font-semibold text-primary-600">Click to upload</span>
                                                        <span className="text-gray-500"> PDF file</span>
                                                    </div>
                                                    {pdfFile && <p className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">{pdfFile.name}</p>}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {message && (
                                        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in ${message.includes('Error') ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                            {message.includes('Error') ? (
                                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            ) : (
                                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                            )}
                                            {message}
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed mt-auto flex-shrink-0"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : (editingBook ? 'Update Book' : 'Add Book')}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* List Section */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Colleges Management */}
                        <div className="glass rounded-3xl p-8 border border-white/40">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl mr-3">
                                        <School size={24} />
                                    </div>
                                    Colleges <span className="ml-3 text-sm font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{colleges.length}</span>
                                </h2>
                                <button
                                    onClick={handleAddCollege}
                                    className="flex items-center space-x-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 font-medium"
                                >
                                    <Plus size={18} />
                                    <span>Add College</span>
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {colleges.map((college) => (
                                    <div key={college.id} className="group flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl hover:shadow-card hover:border-primary-100 transition-all duration-300">
                                        <span className="font-semibold text-gray-800 text-lg group-hover:text-primary-700 transition-colors">{college.name}</span>
                                        <button
                                            onClick={() => handleDeleteCollege(college.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                            title="Delete College"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Books List */}
                        <div className="glass rounded-3xl p-8 border border-white/40">
                            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl mr-3">
                                    <BookOpen size={24} />
                                </div>
                                Library Collection <span className="ml-3 text-sm font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{books.length}</span>
                            </h2>

                            <div className="space-y-4">
                                {books.map((book) => (
                                    <div key={book.id} className="group flex items-start p-5 bg-white border border-gray-100 rounded-2xl hover:shadow-card hover:border-primary-100 transition-all duration-300">
                                        <div className="w-20 h-28 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow-md transition-all">
                                            {book.cover_path ? (
                                                <img
                                                    src={supabase.storage.from('books-covers').getPublicUrl(book.cover_path).data.publicUrl}
                                                    alt={book.title}
                                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                                                    <BookOpen size={32} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="ml-6 flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div className="pr-4">
                                                    <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-primary-700 transition-colors">{book.title}</h3>
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        {book.colleges ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                                {book.colleges.name}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                                                Global
                                                            </span>
                                                        )}
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 capitalize">
                                                            {book.book_format}
                                                        </span>
                                                        {book.category && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100 capitalize">
                                                                {book.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    <button
                                                        onClick={() => startEdit(book)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(book.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-3 line-clamp-2 leading-relaxed">{book.description}</p>
                                        </div>
                                    </div>
                                ))}

                                {books.length === 0 && (
                                    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <BookOpen size={32} className="text-gray-300" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900">No books found</h3>
                                        <p className="text-gray-500 mt-1">Get started by adding your first book to the collection.</p>
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