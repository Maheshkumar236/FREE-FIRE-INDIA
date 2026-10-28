import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { auth, googleProvider } from '../firebase/firebaseConfig';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { KeyRound, ArrowLeft, CheckCircle2, Chrome } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Signed in with Google!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Google Sign-In failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast.success('Welcome back to ELITESTAR!');
      navigate('/');
    } catch (error: any) {
      if (error?.code === 'auth/operation-not-allowed') {
        toast.error('Please use "Continue with Google" below (or enable Email/Password in Firebase Console -> Authentication).');
      } else {
        toast.error(error.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error('Please enter your registered email address');
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSent(true);
      toast.success('Password reset link sent to your email!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-dark-bg">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-card p-8"
      >
        <AnimatePresence mode="wait">
          {!isResetMode ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <div className="text-center mb-6">
                <h1 className="text-3xl font-display font-bold text-white mb-2">
                  Welcome to <span className="text-primary">ELITESTAR</span>
                </h1>
                <p className="text-white/50 text-sm">Login to access tournaments, 3D avatars, and squads</p>
              </div>

              {/* 1-Click Google Sign-In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-white text-black font-bold text-sm flex items-center justify-center gap-3 hover:bg-white/90 transition-all shadow-lg disabled:opacity-50 mb-6"
              >
                <Chrome className="w-5 h-5 text-primary" />
                {googleLoading ? 'Connecting Google...' : 'Continue with Google (1-Click)'}
              </button>

              <div className="relative flex py-2 items-center mb-6">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-widest text-white/30">
                  Or Email &amp; Password
                </span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Email Address</label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                    placeholder="your@email.com"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-white/70">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetMode(true);
                        setResetSent(false);
                      }}
                      className="text-xs text-primary font-bold hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input
                    {...register('password')}
                    type="password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                    placeholder="••••••••"
                  />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full neon-button disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Logging in...' : 'Login with Email'}
                </button>
              </form>

              <p className="text-center mt-8 text-white/50 text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary font-bold hover:underline">
                  Register Now
                </Link>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="reset"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <button
                type="button"
                onClick={() => setIsResetMode(false)}
                className="flex items-center gap-1.5 text-xs font-bold text-white/50 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </button>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center mx-auto">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-display font-bold text-white">Reset Password</h2>
                <p className="text-xs text-white/50">
                  Enter your registered email and we will send you a password recovery link.
                </p>
              </div>

              {resetSent ? (
                <div className="p-5 rounded-2xl bg-green-500/10 border border-green-500/30 text-center space-y-3">
                  <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto" />
                  <p className="text-sm font-bold text-green-400">Recovery Email Sent!</p>
                  <p className="text-xs text-white/60">
                    Check your inbox (and spam folder) for <span className="text-white font-mono">{resetEmail}</span> to set a new password.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsResetMode(false)}
                    className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider"
                  >
                    Return to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-white/50 mb-1.5">Registered Email</label>
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary transition-all outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full neon-button py-3 disabled:opacity-50"
                  >
                    {resetLoading ? 'Sending Link...' : 'Send Recovery Link'}
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Login;
