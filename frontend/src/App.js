import AppLayout from "./components/AppLayout";
import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Task from "./components/Task";
import Login from "./components/Login";
import Signup from "./components/Signup";
import AdminDashboard from "./components/AdminDashboard";
import UserDashboard from "./components/UserDashboard";
import AuthModal from "./components/AuthModal";
import ProjectsHome from "./components/ProjectsHome";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { setAuthFailureHandler } from "./api";

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { loading, handleAuthFailure } = useAuth();

  // Set up auth failure handler for API interceptor
  useEffect(() => {
    setAuthFailureHandler(handleAuthFailure);
  }, [handleAuthFailure]);

  if (loading) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center">
        <div className="surface-card-soft flex h-32 w-32 items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#e86a33] border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '14px',
            border: '1px solid #d8e3c9',
            background: '#ffffff',
            color: '#24352a'
          }
        }}
      />
      <AuthModal />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin" element={
          <AppLayout>
            <AdminDashboard />
          </AppLayout>
        } />
        <Route path="/dashboard" element={
          <AppLayout>
            <UserDashboard />
          </AppLayout>
        } />
        <Route path="/:projectId" element={
          <AppLayout>
            <Task />
          </AppLayout>
        } />
        <Route path="/" element={
          <AppLayout>
            <ProjectsHome />
          </AppLayout>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
