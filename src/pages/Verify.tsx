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
        if (tokenFromUrl) {
            // If token is present, we still need the code.
            // Or maybe the token alone is enough if it's a magic link?
            // The requirements said: "The verify page asks for the 6-digit code."
            // So even with token, we ask for code.
        }
    }, [tokenFromUrl]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // If we have token from URL, use it. If not, we might need another flow?
            // Requirement: "If opened with ?token=..., show 6-digit input."
            // What if opened without token? Maybe manual entry of token + code?
            // But the email link has the token.
            // Let's assume token is required in URL for this flow, or we need to ask for email again?
            // The prompt says "Verify via Edge Function...".

            if (!tokenFromUrl) {
                throw new Error('Invalid verification link. Please check your email.');
            }

            const { data, error } = await supabase.functions.invoke('verify-token', {
                body: { token: tokenFromUrl, code },
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            // Success!
            // The function returns a session or we need to sign in.
            // If the function returns a session/link, we use it.
            // In my implementation of verify-token, I returned `session: linkData`.
            // linkData from generateLink contains `action_link` or `hashed_token`.
            // If it's a magic link, we might need to redirect to it?
            // Or if it returns access_token directly?
            // `generateLink` returns `properties: { action_link, email_otp, hashed_token, verification_type }`.

            // If we used `generateLink`, we can't directly sign in with the result unless we visit the link.
            // BUT, we can use `supabase.auth.verifyOtp` with the token if we had one.

            // Let's assume the Edge Function handles the "verification" logic (checking the code against DB)
            // and then we need to sign the user in.
            // If the Edge Function returns success, maybe we can just use `signInWithOtp` on the client with the email?
            // But that would send another email.

            // Let's look at what I implemented in `verify-token`:
            // It returns `session: linkData`.
            // `linkData` has `action_link`.
            // We can redirect the user to `action_link`!

            if (data.session?.action_link) {
                window.location.href = data.session.action_link;
                return;
            }

            // Fallback
            navigate('/');

        } catch (err: any) {
            console.error('Verification error:', err);
            setError(err.message || 'Verification failed');
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
