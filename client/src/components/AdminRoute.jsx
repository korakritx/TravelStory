import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx'; // ✅ แก้ Path

export default function AdminRoute({ children }) {
    const { user, loading, isAdmin } = useAuth(); 

    // 1. แสดง Loading ขณะรอข้อมูล
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-xl text-blue-600">กำลังตรวจสอบสิทธิ์ Admin...</p>
            </div>
        );
    }
    
    // 2. ถ้าไม่ใช่ Admin (หรือไม่ได้ล็อกอิน) ให้ Redirect
    if (!user || !isAdmin) {
        // Redirect ไปหน้า Home พร้อมแทนที่ History
        console.warn('Access denied: User is not an Admin or not logged in.');
        return <Navigate to="/home" replace />; 
    }

    // 3. อนุญาตให้เข้าถึงหน้า Admin
    return children;
}