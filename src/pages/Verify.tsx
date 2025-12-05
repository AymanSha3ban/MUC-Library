import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Verify = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const tokenFromUrl = searchParams.get('token');

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!tokenFromUrl) {
            setError('Invalid link. Please open the link from your email again.');
        }
    }, [tokenFromUrl]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!tokenFromUrl) {
            setError('Verification token is missing.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 1. استدعاء الـ Edge Function
            // هام: تأكد أن اسم الفولدر في Supabase هو 'verify-token' أو غير الاسم هنا
            const { data, error } = await supabase.functions.invoke('verify-token', {
                body: { token: tokenFromUrl, code },
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            // 2. النجاح! التوجيه للرابط السحري
            if (data?.redirectUrl) {
                // هذا التوجيه هو الذي يقوم بتسجيل الدخول فعلياً
                window.location.href = data.redirectUrl;
            } else {
                // احتياطي لو مفيش رابط رجع (نادر الحدوث)
                navigate('/');
            }

        } catch (err: any) {
            console.error('Verification error:', err);
            setError(err.message || 'Verification failed. Please check the code and try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto text-primary-600 mb-4">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Security Verification</h1>
                    <p className="text-gray-600">Enter the 6-digit code from your email</p>
                </div>

                <form onSubmit={handleVerify} className="space-y-6">
                    <div>
                        <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                            Verification Code
                        </label>
                        <input
                            type="text"
                            id="code"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="123456"
                            className="w-full text-center text-3xl tracking-widest py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-mono"
                            required
                            pattern="\d{6}"
                            disabled={loading}
                        />
                        {error && <p className="mt-2 text-sm text-center text-red-600">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || code.length !== 6}
                        className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                <span>Verify & Sign In</span>
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default Verify;