// ✅ src/components/Navbar.jsx (ฉบับปรับปรุงดีไซน์)
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
// 💡 เพิ่ม Globe icon สำหรับ Logo
import { Star, LogOut, X, Crown, CheckCircle2, Globe, Mountain, Map, Home, BookOpen } from "lucide-react"; 

// 🚨🚨🚨 คอมโพเนนต์ Modal สำหรับแสดงสิทธิประโยชน์ Premium 🚨🚨🚨
const PremiumBenefitsModal = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    // 1. Backdrop
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4 animate-fadeIn">
      {/* 2. Modal Content */}
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg w-full relative transform transition-all duration-300 scale-100">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition p-1 rounded-full hover:bg-gray-100"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <Crown className="w-14 h-14 mx-auto text-yellow-500 mb-3 fill-current" />
          <h2 className="text-3xl font-extrabold text-gray-800">สิทธิประโยชน์ <span className="text-yellow-600">Premium</span></h2>
        </div>
        
        <ul className="space-y-4 text-lg text-gray-700">
          <li className="flex items-start">
            <CheckCircle2 className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
            <span>โพสต์ทริปได้ไม่จำกัด: แชร์ประสบการณ์ได้มากเท่าที่คุณต้องการ</span>
          </li>
          <li className="flex items-start">
            <CheckCircle2 className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
            <span>ไม่มีโฆษณา: เพลิดเพลินกับการใช้งานที่ลื่นไหลและไม่มีสะดุด</span>
          </li>
          <li className="flex items-start">
            <CheckCircle2 className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
            <span>เข้าถึงฟีเจอร์ใหม่ก่อนใคร: ได้ลองใช้ฟังก์ชันพิเศษที่กำลังพัฒนา</span>
          </li>
        </ul>
        
        <button 
          onClick={onClose} 
          className="w-full mt-8 py-3 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 transition shadow-lg"
        >
          ยอดเยี่ยม!
        </button>
      </div>
    </div>
  );
};

export default function Navbar() {
  const { user, signOut, isPremium, isAdmin } = useAuth(); 
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [showBenefitsModal, setShowBenefitsModal] = useState(false); 

  useEffect(() => {
    const fetchUsername = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();
        if (!error && data) setUsername(data.username);
      } else {
        setUsername("");
      }
    };
    // ดึงข้อมูล username ล่าสุดจาก user context หากมี
    if (user && user.username) {
        setUsername(user.username);
    } else {
        fetchUsername();
    }
  }, [user]);

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 bg-white shadow-xl py-4 px-6 md:px-12 flex justify-between items-center">
        <Link to="/home" className="text-2xl font-extrabold text-green-700 flex items-center hover:text-green-800 transition">
             {/* 💡 Logo ที่โดดเด่นขึ้น */}
             <Globe className="w-7 h-7 mr-2 text-blue-500" /> 
             TravelStorys
        </Link>

        <div className="flex items-center space-x-4 md:space-x-8">
          
            {/* 🚨 เมนูหลักพร้อมไอคอน */}
          <Link to="/home" className="hidden sm:flex items-center text-gray-700 hover:text-green-600 font-medium transition">
                <Home className="w-4 h-4 mr-1"/> หน้าหลัก
            </Link>
          <Link to="/my-trips" className="hidden sm:flex items-center text-gray-700 hover:text-green-600 font-medium transition">
                <BookOpen className="w-4 h-4 mr-1"/> ทริปของฉัน
            </Link>
          <Link to="/trip/post" className="hidden sm:flex items-center text-gray-700 hover:text-green-600 font-medium transition">
                <Mountain className="w-4 h-4 mr-1"/> โพสต์ทริป
            </Link>
          <Link to="/map" className="hidden sm:flex items-center text-gray-700 hover:text-green-600 font-medium transition">
                <Map className="w-4 h-4 mr-1"/> แผนที่
            </Link>
          
          {/* 🚨 ลิงก์ Admin Dashboard - ปรับปรุงสีและขอบ */}
          {isAdmin && ( 
            <Link 
                to="/admin" 
                className="text-white bg-blue-600 px-3 py-1.5 rounded-full font-bold shadow-md hover:bg-blue-700 transition flex items-center text-sm"
            >
              🔑 แอดมิน
            </Link>
          )}

          {user && !isPremium && (
            <Link 
                to="/premium-signup" 
                className="bg-yellow-500 text-white px-4 py-2 rounded-full hover:bg-yellow-600 transition font-bold shadow-lg flex items-center text-sm"
            >
              <Crown className="w-4 h-4 mr-1 fill-current" /> อัปเกรด Premium
            </Link>
          )}

          {user && (
            <div className="flex items-center gap-4">
              {/* ชื่อผู้ใช้ - เน้นสีเขียว */}
              <span className="font-bold text-gray-700 hidden lg:inline">สวัสดี <span className="text-green-600 hover:text-green-800 transition cursor-pointer">{username || "ผู้ใช้"}</span></span>

              {isPremium && (
                <button
                  onClick={() => setShowBenefitsModal(true)} 
                  className="flex items-center bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-full font-bold text-sm shadow-inner hover:bg-yellow-100 transition"
                >
                  <Star className="w-4 h-4 mr-1 text-yellow-500 fill-current" /> 
                  Premium
                </button>
              )}

                {/* ปุ่มออกจากระบบ - เน้นสีแดงให้เด่นชัด */}
              <button 
                  onClick={signOut} 
                  className="bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition flex items-center space-x-1 font-bold shadow"
                >
                <LogOut className="w-4 h-4" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          )}
        </div>
      </nav>
      {/* 🚨 แสดง Modal */}
      <PremiumBenefitsModal 
        isVisible={showBenefitsModal} 
        onClose={() => setShowBenefitsModal(false)} 
      />
    </>
  );
}