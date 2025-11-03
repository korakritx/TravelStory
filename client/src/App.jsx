import React from "react";
// 💡 แก้ไข: Import Link ด้วย เพื่อให้ NotFoundPage ใช้งานได้
import { Routes, Route, Link } from "react-router-dom"; 

import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import MapPage from "./pages/MapPage.jsx";
import TripPostPage from "./pages/TripPostPage.jsx";
import TripDetailPage from "./pages/TripDetailPage.jsx";
import TripEditPage from "./pages/TripEditPage.jsx"; 
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PremiumSignupPage from "./pages/PremiumSignupPage.jsx";

// 🚨 นำเข้าคอมโพเนนต์ Admin
import AdminRoute from "./components/AdminRoute.jsx"; 
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx"; 
import MyTripsPage from "./pages/MyTripsPage.jsx"; 


export default function App() {
  return (
    
    <Routes>
      {/* 🟢 Public */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      

      {/* 🔒 Protected Routes (User ต้อง Login) */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-trips"
        element={
          <ProtectedRoute>
            <MyTripsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/premium-signup"
        element={
          <ProtectedRoute>
            <PremiumSignupPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/map"
        element={
          <ProtectedRoute>
            <MapPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trip/post"
        element={
          <ProtectedRoute>
            <TripPostPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trip/:id"
        element={
          <ProtectedRoute>
            <TripDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trip/edit/:id"
        element={
          <ProtectedRoute>
            <TripEditPage />
          </ProtectedRoute>
        }
      />
      
      {/* 👑 Admin Protected Route */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        }
      />

      {/* ❌ 404 Route */}
      <Route path="*" element={<NotFoundPage />} /> 

    </Routes>
  );
}

// คอมโพเนนต์ NotFoundPage ที่ใช้ Link
function NotFoundPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <h1 className="text-6xl font-extrabold text-red-500">404</h1>
            <p className="text-xl text-gray-700 mt-2 mb-6">ไม่พบหน้าที่คุณกำลังมองหา</p>
            <Link to="/home" className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition font-medium">กลับหน้าหลัก</Link>
        </div>
    );
}