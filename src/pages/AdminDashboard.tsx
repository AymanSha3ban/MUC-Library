import { useState } from 'react';

import { Upload, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { role } = useAuth();
    const navigate = useNavigate();

    // Redirect if not admin
    if (role && role !== 'admin') {
        navigate('/');
        return null;
    }

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('computer');
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!coverFile || !pdfFile) {
            setMessage('Please select both cover and PDF files.');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            // 1. Upload Cover
            const coverExt = coverFile.name.split('.').pop();
            const coverName = `${Date.now()}-cover.${coverExt}`;
            const { data: coverData, error: coverError } = await supabase.storage
                .from('books-covers')
                .upload(coverName, coverFile);

            if (coverError) throw coverError;

            // 2. Upload PDF
            const pdfExt = pdfFile.name.split('.').pop();
            const pdfName = `${Date.now()}-book.${pdfExt}`;
            const { data: pdfData, error: pdfError } = await supabase.storage
                .from('books-pdfs')
                .upload(pdfName, pdfFile);

            if (pdfError) throw pdfError;

            // 3. Insert into DB
            const { error: dbError } = await supabase.from('books').insert({
                title,
                description,
                category,
                cover_path: coverData.path,
                pdf_path: pdfData.path,
                created_by: (await supabase.auth.getUser()).data.user?.id
            });

            if (dbError) throw dbError;

            setMessage('Book added successfully!');
            setTitle('');
            setDescription('');
            setCoverFile(null);
            setPdfFile(null);

        } catch (err: any) {
            console.error('Upload error:', err);
            setMessage(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <Plus className="mr-2" /> Add New Book
                    </h2>

                    <form onSubmit={handleUpload} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Book Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            >
                                <option value="computer">Computer Engineering</option>
                                <option value="robotics">Robotics</option>
                                <option value="electrical">Electrical Engineering</option>
                                <option value="architecture">Architecture</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                        id="cover-upload"
                                    />
                                    <label htmlFor="cover-upload" className="cursor-pointer flex flex-col items-center">
                                        <Upload className="text-gray-400 mb-2" />
                                        <span className="text-sm text-gray-600">
                                            {coverFile ? coverFile.name : 'Click to upload cover'}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Book PDF</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                        id="pdf-upload"
                                    />
                                    <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                                        <Upload className="text-gray-400 mb-2" />
                                        <span className="text-sm text-gray-600">
                                            {pdfFile ? pdfFile.name : 'Click to upload PDF'}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-lg ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 transition-colors flex items-center justify-center disabled:opacity-70"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Add Book'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
