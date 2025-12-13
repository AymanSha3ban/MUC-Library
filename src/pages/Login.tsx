import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import SEO from '../components/SEO';

const Login = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!email.endsWith('@muc.edu.eg')) {
            setError('Please use your university email (@muc.edu.eg)');
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.functions.invoke('send-verification', {
                body: { email },
            });

            if (error) throw error;
            setSent(true);
        } catch (err: any) {
            console.error('Login error:', err);
            // Improved error logging
            const errorMessage = err.message || (err.context && err.context.json && await err.context.json().then((res: any) => res.error).catch(() => '')) || 'Failed to send verification email';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setVerifyLoading(true);
        setError('');

        try {
            // ✅ التعديل هنا: نستخدم دالتنا الخاصة بدلاً من دالة Supabase
            // نرسل الإيميل والكود للدالة
            const { data, error } = await supabase.functions.invoke('verify-token', {
                body: {
                    email: email,
                    code: otp
                },
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            // ✅ النجاح: الدالة بترجع رابط دخول، بنروح عليه
            if (data?.redirectUrl) {
                window.location.href = data.redirectUrl;
            } else {
                throw new Error("حدث خطأ أثناء تسجيل الدخول، لم يتم استلام الرابط.");
            }

        } catch (err: any) {
            console.error('Verification error:', err);
            setError(err.message || 'Failed to verify code');
        } finally {
            setVerifyLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <SEO
                title="Login"
                description="Sign in to MUC Library to access engineering resources."
            />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8"
            >
                {sent ? (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-primary-600 mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <path d="m9 12 2 2 4-4" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Security Verification</h1>
                        <p className="text-gray-600 mb-8">Enter the 6-digit code from your email</p>

                        <form onSubmit={handleVerify} className="space-y-6">
                            <div className="text-left">
                                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                                    Verification Code
                                </label>
                                <input
                                    type="text"
                                    id="otp"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="123456"
                                    className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-red-500 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                    maxLength={6}
                                    required
                                />
                                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={verifyLoading}
                                className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {verifyLoading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        <span>Verify & Sign In</span>
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                            <p className="text-gray-600">Sign in to access the MUC Library</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    University Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="student@muc.edu.eg"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                        required
                                    />
                                </div>
                                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary-600 text-white py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        <span>Send Verification</span>
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </form>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default Login;