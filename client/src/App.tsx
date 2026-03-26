import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/auth/AuthContext';
import { PostsProvider } from './context/posts/PostsContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import FeedPage from './pages/FeedPage';
import CreatePostPage from './pages/CreatePostPage';
import ProfilePage from './pages/ProfilePage';
import CommentsPage from './pages/CommentsPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <PostsProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            <Route path="/" element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
              <Route index element={<Navigate to="/feed" replace />} />
              <Route path="feed" element={<FeedPage />} />
              <Route path="create" element={<CreatePostPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="profile/:userId" element={<ProfilePage />} />
              <Route path="posts/:postId/comments" element={<CommentsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PostsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
