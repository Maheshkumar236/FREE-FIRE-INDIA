import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { cn } from './lib/utils';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Matches from './pages/Matches';
import MatchDetails from './pages/MatchDetails';
import Wallet from './pages/Wallet';
import Leaderboard from './pages/Leaderboard';
import ChatList from './pages/ChatList';
import Chat from './pages/Chat';
import GlobalChat from './pages/GlobalChat';
import SearchPlayer from './pages/SearchPlayer';
import Notifications from './pages/Notifications';
import Support from './pages/Support';
import Announcements from './pages/Announcements';
import Squad from './pages/Squad';
import SquadChat from './pages/SquadChat';
import CompleteProfile from './pages/CompleteProfile';
import FFIndiaHubPage from './pages/FFIndiaHubPage';

// Admin Pages
import AdminDashboard from './admin/AdminDashboard';
import MatchManager from './admin/MatchManager';
import UserManager from './admin/UserManager';
import WalletManager from './admin/WalletManager';
import RoomControl from './admin/RoomControl';
import AdminLogs from './admin/AdminLogs';
import SupportTickets from './admin/SupportTickets';
import AnnouncementsManager from './admin/AnnouncementsManager';
import StaffDashboard from './admin/StaffDashboard';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, firebaseUser, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-primary">Loading ELITESTAR...</div>;
  
  // If not logged into Firebase Auth, go to login
  if (!firebaseUser) return <Navigate to="/login" />;
  
  // If logged in but no Firestore profile, go to complete-profile
  if (!user && window.location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" />;
  }
  
  if (user?.is_banned) return <div className="flex items-center justify-center h-screen text-red-500">Your account has been banned.</div>;
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user || (!user.is_admin && !user.is_staff)) return <Navigate to="/" />;
  return <>{children}</>;
};

const AppContent = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen pb-16 md:pb-0">
      {user && <Navbar className="hidden md:flex" />}
      <div className="flex flex-1 overflow-hidden">
        {user && <Sidebar className="hidden md:flex" />}
        <main className={cn("flex-1 overflow-y-auto p-4 md:p-8", !user && "p-0")}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/profile/:uid" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
            <Route path="/ff-india" element={<ProtectedRoute><FFIndiaHubPage /></ProtectedRoute>} />
            <Route path="/match/:id" element={<ProtectedRoute><MatchDetails /></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/squad" element={<ProtectedRoute><Squad /></ProtectedRoute>} />
            <Route path="/squad/chat/:id" element={<ProtectedRoute><SquadChat /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatList /></ProtectedRoute>} />
            <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/global-chat" element={<ProtectedRoute><GlobalChat /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><SearchPlayer /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
            <Route path="/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
            <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/matches" element={<AdminRoute><MatchManager /></AdminRoute>} />
            <Route path="/admin/wallet" element={<AdminRoute><WalletManager /></AdminRoute>} />
            <Route path="/admin/match/:id" element={<AdminRoute><RoomControl /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><UserManager /></AdminRoute>} />
            <Route path="/admin/logs" element={<AdminRoute><AdminLogs /></AdminRoute>} />
            <Route path="/admin/tickets" element={<AdminRoute><SupportTickets /></AdminRoute>} />
            <Route path="/admin/announcements" element={<AdminRoute><AnnouncementsManager /></AdminRoute>} />
            <Route path="/staff" element={<AdminRoute><StaffDashboard /></AdminRoute>} />
          </Routes>
        </main>
      </div>
      {user && <BottomNav />}
      <Toaster position="top-right" />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
