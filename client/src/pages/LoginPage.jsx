import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext"; // 💡 นำเข้า useAuth
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // 💡 ดึง refreshUserProfile มาใช้เมื่อล็อคอินสำเร็จ
  const { refreshUserProfile } = useAuth(); 

  const signIn = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // 🚨 แสดงข้อความแจ้งเตือนข้อผิดพลาด
      alert(`❌ ข้อผิดพลาดในการล็อคอิน: ${error.message}`);
      setLoading(false);
      return;
    }

    // 💡 ถ้าล็อคอินสำเร็จ
    if (data.user) {
        // 🚀 เรียกใช้ refreshUserProfile เพื่อโหลดข้อมูล User + Profile
        await refreshUserProfile(data.user); 
        
        // 🚨 แสดงข้อความแจ้งเตือนความสำเร็จ
        alert("✅ ล็อคอินสำเร็จ! ยินดีต้อนรับ.");
        
        // 🚨 นำทางไปยังหน้า home
        navigate("/home"); 
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-green-600 mb-6 flex items-center justify-center">
            <LogIn className="w-6 h-6 mr-2" /> เข้าสู่ระบบ
        </h2>
        
        <form onSubmit={signIn} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              อีเมล
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="youremail@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              รหัสผ่าน
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ยังไม่มีบัญชี?{" "}
            <Link to="/register" className="font-medium text-green-600 hover:text-green-500">
              สร้างบัญชีใหม่
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}