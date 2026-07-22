import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// The editor pulls in Monaco, which is by far the largest dependency. Loading
// it lazily keeps it off the landing, login and signup pages.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const EditorRoom = lazy(() => import("./pages/EditorRoom"));

const RouteFallback = () => (
  <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 rounded-full border-2 border-white/10" />
      <div
        className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin"
        style={{ animationDuration: "0.8s" }}
      />
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/room/:roomId"
              element={
                <ProtectedRoute>
                  <EditorRoom />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
