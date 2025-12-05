import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import { User, Mail, Phone, Camera, Save, Loader2, LogOut, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../lib/canvasUtils';

const Profile = () => {
    const { user, role, signOut, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');

    const [profile, setProfile] = useState({
        display_name: '',
        phone: '',
        profile_path: '',
    });

    // Cropping State
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isCropping, setIsCropping] = useState(false);

    useEffect(() => {
        if (user) fetchProfile();
    }, [user]);

    const fetchProfile = async () => {
        try {
            console.log("Fetching profile for user:", user?.id);
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', user?.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            console.log("Fetched Data from DB:", data);

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
        if (!user) return;

        setLoading(true);
        setMessage('');

        try {
            const { data, error } = await supabase
                .from('users')
                .update({
                    display_name: profile.display_name,
                    phone: profile.phone,
                })
                .eq('id', user.id)
                .select();

            if (error) throw error;

            if (data.length === 0) {
                console.error("Update returned 0 rows! Check RLS Policy.");
                throw new Error("Update failed quietly. RLS blocked the edit.");
            }

            setMessage('Profile updated successfully');
        } catch (error: any) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setImageSrc(reader.result as string);
            setIsCropping(true);
        });
        reader.readAsDataURL(file);
        // Reset input value so same file can be selected again if needed
        e.target.value = '';
    };

    const handleSaveCrop = async () => {
        if (!imageSrc || !croppedAreaPixels || !user) return;

        try {
            setUploading(true);
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

            if (!croppedImageBlob) {
                throw new Error('Could not crop image');
            }

            const fileName = `${user.id}/${Date.now()}.jpg`;
            const file = new File([croppedImageBlob], 'profile.jpg', { type: 'image/jpeg' });

            console.log("Uploading file:", fileName);
            const { error: uploadError } = await supabase.storage
                .from('profiles')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            console.log("Updating DB with path:", fileName);
            const { data, error: dbError } = await supabase
                .from('users')
                .update({
                    profile_path: fileName,
                })
                .eq('id', user.id)
                .select();

            if (dbError) throw dbError;

            if (data.length === 0) {
                console.error("❌ DB Update failed: No rows affected.");
                throw new Error("Image uploaded but DB update failed (Row not found or RLS blocked).");
            }

            console.log("✅ DB Updated successfully:", data);

            setProfile(prev => ({ ...prev, profile_path: fileName }));
            setMessage('Profile picture updated');
            await refreshProfile();
            setIsCropping(false);
            setImageSrc(null);
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
                                        <img
                                            src={getProfileUrl()!}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                console.error("Image load failed:", getProfileUrl());
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <User size={64} className="text-gray-400" />
                                    )}
                                    {getProfileUrl() && <User size={64} className="text-gray-400 absolute -z-10" />}
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

                    <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex justify-end">
                        <button
                            onClick={() => {
                                Swal.fire({
                                    title: 'Are you sure?',
                                    text: "You will be signed out of your account.",
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonColor: '#3085d6',
                                    cancelButtonColor: '#d33',
                                    confirmButtonText: 'Yes, sign out!'
                                }).then((result) => {
                                    if (result.isConfirmed) {
                                        signOut();
                                    }
                                });
                            }}
                            className="text-red-600 hover:text-red-700 font-medium flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                        >
                            <LogOut size={20} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Cropping Modal */}
            {isCropping && imageSrc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
                    <div className="bg-white rounded-2xl overflow-hidden w-full max-w-lg shadow-2xl">
                        <div className="relative h-80 w-full bg-gray-900">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>
                        <div className="p-6">
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Zoom</label>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setIsCropping(false);
                                        setImageSrc(null);
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium flex items-center"
                                >
                                    <X size={18} className="mr-2" />
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveCrop}
                                    disabled={uploading}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center disabled:opacity-70"
                                >
                                    {uploading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Check size={18} className="mr-2" />}
                                    Save & Upload
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;