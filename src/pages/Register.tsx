import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { auth, db, googleProvider } from '../firebase/firebaseConfig';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDocs, query, collection, limit } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { generateAppUID } from '../lib/utils';
import { getVipDesignByName } from '../lib/vipAssets';
import { motion } from 'motion/react';
import { Chrome } from 'lucide-react';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  phone: z.string().min(10, 'Invalid phone number'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  dob: z.string().refine((val) => {
    const birthDate = new Date(val);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 16;
  }, 'You must be at least 16 years old'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Account connected with Google! ₹10 bonus ready.');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Google Sign-In failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      const usersSnap = await getDocs(query(collection(db, 'users'), limit(1)));
      const isFirstUser = usersSnap.empty;
      const emailLower = data.email.toLowerCase();
      const isAdminEmail =
        emailLower === 'mkofficialforcollab@gmail.com' ||
        emailLower === 'maheshkumae8542@gmail.com';
      const vipDesign = getVipDesignByName(data.username);

      await setDoc(doc(db, 'users', user.uid), {
        username: data.username,
        email: data.email,
        phone: data.phone,
        dob: data.dob,
        app_uid: generateAppUID(),
        wallet_balance: 10,
        winnings: 0,
        deposits: 0,
        total_matches: 0,
        total_wins: 0,
        joined_at: serverTimestamp(),
        is_admin: isFirstUser || isAdminEmail,
        is_staff: isFirstUser || isAdminEmail,
        is_banned: false,
        avatar_url: vipDesign.avatarUrl,
        banner_url: vipDesign.bannerUrl,
      });

      await setDoc(doc(db, 'transactions', `signup_${user.uid}`), {
        user_id: user.uid,
        type: 'signup_bonus',
        amount: 10,
        status: 'completed',
        created_at: serverTimestamp(),
      });

      toast.success('Account created! ₹10 bonus added.');
      navigate('/');
    } catch (error: any) {
      if (error?.code === 'auth/operation-not-allowed') {
        toast.error('Please use "Continue with Google" above (or enable Email/Password in Firebase Console -> Authentication).');
      } else {
        toast.error(error.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-dark-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card p-8"
      >
        <div className="text-center mb-6">
          <h1 className="text-3xl font-display font-bold text-white mb-2">Join <span className="text-primary">ELITESTAR</span></h1>
          <p className="text-white/50 text-sm">Create your account and get ₹10 instant bonus</p>
        </div>

        <button
          type="button"
          onClick={handleGoogleRegister}
          disabled={googleLoading}
          className="w-full py-3.5 px-4 rounded-xl bg-white text-black font-bold text-sm flex items-center justify-center gap-3 hover:bg-white/90 transition-all shadow-lg disabled:opacity-50 mb-6"
        >
          <Chrome className="w-5 h-5 text-primary" />
          {googleLoading ? 'Connecting Google...' : 'Continue with Google (Instant ₹10 Bonus)'}
        </button>

        <div className="relative flex py-2 items-center mb-5">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-widest text-white/30">
            Or Register with Email
          </span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Username</label>
            <input
              {...register('username')}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
              placeholder="e.g. ShadowX"
            />
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Phone Number</label>
              <input
                {...register('phone')}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                placeholder="10-digit number"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Date of Birth</label>
              <input
                {...register('dob')}
                type="date"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
              />
              {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob.message}</p>}
            </div>
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Password</label>
              <input
                {...register('password')}
                type="password"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Confirm</label>
              <input
                {...register('confirmPassword')}
                type="password"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                placeholder="••••••••"
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full neon-button mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Register & Get ₹10 Bonus'}
          </button>
        </form>

        <p className="text-center mt-6 text-white/50 text-sm">
          Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Login</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
