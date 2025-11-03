import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. สร้างผู้ใช้ใหม่ใน auth.users
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      // 🚨 แสดงข้อความแจ้งเตือนข้อผิดพลาด
      alert(`❌ ข้อผิดพลาดในการสมัคร: ${authError.message}`);
      setLoading(false);
      return;
    }
    
    // 2. สร้างโปรไฟล์ผู้ใช้ในตาราง profiles
    const user = authData.user;
    if (user) {
      const { error: profileError } = await supabase.from("profiles").insert([
        { 
          id: user.id, 
          username: username,
          plan_level: "free" // กำหนดค่าเริ่มต้นเป็น free
        },
      ]);

      if (profileError) {
        // 🚨 แสดงข้อความแจ้งเตือนข้อผิดพลาด
        alert(`❌ ข้อผิดพลาดในการสร้างโปรไฟล์: ${profileError.message}`);
        // ควรพิจารณาลบผู้ใช้ที่สร้างไปแล้วด้วยในสถานการณ์จริง
        setLoading(false);
        return;
      }
    }

    // 🚀 ถ้าทุกอย่างสำเร็จ
    // 🚨 แสดงข้อความแจ้งเตือนความสำเร็จ
    alert("✅ สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยัน (ถ้าเปิดใช้งาน) และระบบจะนำคุณไปหน้า Home");

    setLoading(false);
    navigate("/home"); 
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-6 flex items-center justify-center">
            <UserPlus className="w-6 h-6 mr-2" /> สร้างบัญชีใหม่
        </h2>
        
        <form onSubmit={handleSignUp} className="space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              อีเมล
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="youremail@example.com"
            />
          </div>
          {/* Username Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              ชื่อผู้ใช้ (Username)
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="ชื่อที่คุณต้องการใช้แสดง"
            />
          </div>
          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              รหัสผ่าน
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
          >
            {loading ? "กำลังสร้างบัญชี..." : "สมัครสมาชิก"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            มีบัญชีอยู่แล้ว?{" "}
            <Link to="/" className="font-medium text-blue-600 hover:text-blue-500">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}