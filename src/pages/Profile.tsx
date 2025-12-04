import { useState, useEffect } from 'react';

import { User, Mail, Phone, Camera, Save, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const { user, role } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');

    const [profile, setProfile] = useState({
        display_name: '',
        phone: '',
        profile_path: '',
    });

    useEffect(() => {
        if (user) fetchProfile();
    }, [user]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', user?.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                setProfile({
                    display_name: data.display_name || '',
                    phone: data.phone || '',
                    profile_path: data.profile_path || '',
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const { error } = await supabase
                .from('users')
                .upsert({
                    id: user?.id,
                    email: user?.email,
                    role: role || 'student', // Ensure role is preserved or set
                    display_name: profile.display_name,
                    phone: profile.phone,
                    updated_at: new Date(),
                });

            if (error) throw error;
            setMessage('Profile updated successfully');
        } catch (error: any) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('profiles')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Update profile path in DB
            const { error: dbError } = await supabase
                .from('users')
                .upsert({
                    id: user?.id,
                    email: user?.email,
                    role: role || 'student',
                    profile_path: fileName,
                });

            if (dbError) throw dbError;

            setProfile(prev => ({ ...prev, profile_path: fileName }));
            setMessage('Profile picture updated');
        } catch (error: any) {
            console.error('Upload error:', error);
            setMessage(`Error uploading image: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const getProfileUrl = () => {
        if (!profile.profile_path) return null;
        return supabase.storage.from('profiles').getPublicUrl(profile.profile_path).data.publicUrl;
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="h-32 bg-primary-600 relative">
                        <div className="absolute -bottom-16 left-8">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden flex items-center justify-center">
                                    {getProfileUrl() ? (
                                        <img src={getProfileUrl()!} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={64} className="text-gray-400" />
                                    )}
                                </div>
                                <label htmlFor="profile-upload" className="absolute bottom-0 right-0 bg-gray-900 text-white p-2 rounded-full cursor-pointer hover:bg-gray-800 transition-colors shadow-lg">
                                    <Camera size={16} />
                                </label>
                                <input
                                    type="file"
                                    id="profile-upload"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-20 px-8 pb-8">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">{profile.display_name || 'Student'}</h2>
                            <p className="text-gray-500 flex items-center mt-1">
                                <Mail size={16} className="mr-2" />
                                {user?.email}
                            </p>
                            <p className="text-primary-600 font-medium mt-2 capitalize">{role}</p>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                                <input
                                    type="text"
                                    value={profile.display_name}
                                    onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="tel"
                                        value={profile.phone}
                                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="+20 123 456 7890"
                                    />
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
                                className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-70"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : (
                                    <>
                                        <Save size={20} />
                                        <span>Save Changes</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
