// ✅ src/components/ProtectedRoute.jsx (ฉบับแก้ไข: ใช้ตัวแปร loading ที่ถูกต้อง)
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

export default function ProtectedRoute({ children }) {
    // 💡 ดึง user และ loading จาก useAuth() (เปลี่ยนชื่อตัวแปรจาก authLoading เป็น loading)
    const { user, loading } = useAuth(); 

    // 🚨 1. ถ้ากำลังโหลด 
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-xl text-green-600">กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</p>
            </div>
        );
    }
    
    // 🚨 2. ถ้าโหลดเสร็จสิ้น และไม่มีผู้ใช้ (user เป็น null)
    if (!user) {
        // Redirect ไปที่หน้า Login
        return <Navigate to="/" replace />; 
    }

    // 3. ถ้าโหลดเสร็จสิ้นและมีผู้ใช้ ให้อนุญาต
    return children;
}