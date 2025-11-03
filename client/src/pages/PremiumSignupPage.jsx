// ✅ src/pages/PremiumSignupPage.jsx (ฉบับแก้ไข)
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { Star, CheckCircle2, XCircle, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom"; 

export default function PremiumSignupPage() {
  // ✅ ดึง refreshUserProfile จาก useAuth
  const { user, userPlanLevel, refreshUserProfile } = useAuth();
  const navigate = useNavigate(); 
  const [username, setUsername] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ✅ โหลดข้อมูลโปรไฟล์ผู้ใช้
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setUsername(data?.username || "ไม่ระบุชื่อ");
      } catch (err) {
        console.error("Error fetching profile:", err.message);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [user]);

  // 🚀🚀🚀 ฟังก์ชันอัปเกรด (แก้ไขการจัดการ Error) 🚀🚀🚀
  const handleUpgrade = async () => {
    if (isUpgrading || !user) return;

    setIsUpgrading(true);
    setShowError(false);
    setErrorMessage("");

    try {
        // 1. อัปเดตสถานะในฐานข้อมูล (Supabase)
        const { error } = await supabase
            .from("profiles")
            .update({ plan_level: "premium" })
            .eq("id", user.id);

        // 🚨🚨🚨 ส่วนสำคัญ: ตรวจสอบ Error ทันที 🚨🚨🚨
        if (error) {
            console.error("Supabase Update Error:", error);
            // โยน Error เพื่อให้ถูกจับใน catch block ด้านล่าง
            throw new Error(error.message || "ไม่สามารถอัปเดตฐานข้อมูลได้");
        }

        // 2. ถ้าไม่มี Error: อัปเดตสถานะใน AuthContext 
        // 💡 โค้ดที่แก้ไขแล้วจะดึง 'premium' กลับมา
        await refreshUserProfile(); 

        // 3. แสดง Modal สำเร็จและนำทาง
        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
            navigate("/home");
        }, 2000);

    } catch (err) {
        // 4. จัดการ Error: แสดง Error Modal
        console.error("Upgrade Process Failed:", err.message);
        setErrorMessage(err.message);
        setShowError(true);
        // แสดง Error ชั่วคราว
        setTimeout(() => setShowError(false), 5000); 

    } finally {
        setIsUpgrading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl text-green-600">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  // ถ้าเป็น Premium อยู่แล้ว ให้นำทางไปหน้า Home เลย
  if (userPlanLevel === "premium") {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-xl text-yellow-600">สมัคร Premium สำเร็จ!! <a href="/home" className="text-green-600 underline">กลับสู่หน้าหลัก</a></p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Crown className="w-16 h-16 mx-auto text-yellow-500 mb-4" fill="currentColor" />
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
            อัปเกรดเป็น <span className="text-yellow-600">TravelShare Premium</span>
          </h1>
          <p className="text-xl text-gray-600">
            ปลดล็อกคุณสมบัติทั้งหมดเพื่อการเดินทางที่ไร้ขีดจำกัด!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* 🟢 Free Plan */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border-4 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Standard (Free)
            </h2>
            <p className="text-4xl font-extrabold text-green-600 mb-6">
              ฟรี!
            </p>
            <ul className="space-y-3 text-gray-700 text-left">
              <li className="flex items-center">
                <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                โพสต์ทริปได้สูงสุด 1 รายการ
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                ดูทริปอื่น ๆ ทั่วโลก
              </li>
              <li className="flex items-center text-red-500 line-through">
                <XCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                ไม่จำกัดจำนวนทริป
              </li>
            </ul>
            <button
              disabled
              className="mt-8 w-full py-3 rounded-xl bg-gray-300 text-gray-600 font-bold cursor-not-allowed"
            >
              แผนปัจจุบันของคุณ
            </button>
          </div>

          {/* 🌟 Premium Plan */}
          <div className="relative bg-yellow-50 p-8 rounded-2xl shadow-2xl border-4 border-yellow-500 scale-[1.03]">
            <Star className="w-6 h-6 text-yellow-500 absolute top-4 right-4 fill-current" />
            <h2 className="text-2xl font-bold text-yellow-800 mb-2">
              Premium
            </h2>
            <p className="text-4xl font-extrabold text-yellow-700 mb-6">
              ฿99<span className="text-xl font-normal text-yellow-700">/เดือน</span>
            </p>
            <ul className="space-y-3 text-gray-800 text-left">
              <li className="flex items-center font-semibold">
                <CheckCircle2 className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" />
                <span className="font-bold">โพสต์ทริปได้ไม่จำกัดจำนวน</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" />
                ดูทริปอื่น ๆ ทั่วโลก
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" />
                สิทธิพิเศษในอนาคต
              </li>
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className={`mt-8 w-full py-3 rounded-xl text-white font-bold transition-all transform shadow-lg ${
                isUpgrading
                  ? "bg-yellow-400 cursor-not-allowed"
                  : "bg-yellow-600 hover:bg-yellow-700 hover:scale-[1.01]"
              }`}
            >
              {isUpgrading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>กำลังอัปเกรด...</span>
                </div>
              ) : (
                "🚀 อัปเกรด Premium เลย!"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Modal Success */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full animate-fadeIn">
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              อัปเกรดสำเร็จ!
            </h2>
            <p className="text-gray-600 mb-4">
              คุณได้เป็นสมาชิก{" "}
              <span className="font-semibold text-green-600">Premium</span> แล้ว 🎉
            </p>
            <p className="text-sm text-gray-400">กำลังกลับไปหน้าแรก...</p>
          </div>
        </div>
      )}

      {/* ❌ Modal Error */}
      {showError && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full animate-fadeIn">
            <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              เกิดข้อผิดพลาด
            </h2>
            <p className="text-gray-600 mb-4">
              {errorMessage || "ไม่สามารถดำเนินการอัปเกรดได้ โปรดลองอีกครั้ง"}
            </p>
            <button 
              onClick={() => setShowError(false)}
              className="mt-4 w-full py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}