// ✅ src/pages/TripPostPage.jsx
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Upload, MapPin } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; // สำหรับสร้างชื่อไฟล์ที่ไม่ซ้ำกัน

// 🚨 ค่าจำกัด
const MAX_FREE_TRIPS = 1; // จำกัด 1 ทริปสำหรับ Free User

export default function TripPostPage() {
  // 🚨 แก้ไข: ใช้ Aliasing (เปลี่ยนชื่อ) จาก 'loading' เป็น 'authLoading'
  const { user, isPremium, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location_name, setLocationName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false); // โหลดการโพสต์
  const [message, setMessage] = useState("");
  const [userTripCount, setUserTripCount] = useState(0);
  const [loadingTripCount, setLoadingTripCount] = useState(true);

  // ✅ ดึงจำนวนทริปที่ผู้ใช้โพสต์แล้ว
  useEffect(() => {
    const fetchTripCount = async () => {
      if (!user) {
        setLoadingTripCount(false);
        return;
      }

      try {
        const { count, error } = await supabase
          .from("trips")
          .select("id", { count: "exact", head: true }) // นับจำนวน
          .eq("user_id", user.id);

        if (error) throw error;
        setUserTripCount(count || 0);
      } catch (err) {
        console.error("Error fetching trip count:", err.message);
        setMessage("❌ เกิดข้อผิดพลาดในการดึงข้อมูลทริป");
      } finally {
        setLoadingTripCount(false);
      }
    };
    
    if (!authLoading) {
        fetchTripCount();
    }
  }, [user, authLoading]); // 💡 ขึ้นอยู่กับ user และ authLoading

  // 💡 ตรรกะการโพสต์: โพสต์ได้ถ้าเป็น Premium หรือ Free และจำนวนทริปยังไม่เกิน 
  const canPost = isPremium || (userTripCount < MAX_FREE_TRIPS);

  // 💡 ตรวจสอบความถูกต้องของฟอร์มขั้นพื้นฐาน
  const isFormValid = title && description && location_name;
  
  // 💡 ฟังก์ชันอัปโหลดรูป
  const uploadPhoto = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('trip_photos') // สมมติว่าคุณมี Bucket ชื่อ 'trip_photos'
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // ดึง URL ที่สามารถเข้าถึงได้
    const { data: publicUrlData } = supabase.storage
      .from('trip_photos')
      .getPublicUrl(filePath);
      
    return publicUrlData.publicUrl;
  };


  const handlePost = async (e) => {
    e.preventDefault();
    setMessage("");
    
    if (!user || !canPost) {
        setMessage("❌ คุณไม่มีสิทธิ์โพสต์ทริปเพิ่มเติม โปรดอัปเกรดเป็น Premium");
        return;
    }

    if (!isFormValid) {
        setMessage("❌ กรุณากรอกข้อมูลให้ครบถ้วน: ชื่อ, คำอธิบาย, และสถานที่");
        return;
    }

    setLoading(true);
    let photoUrl = "";

    try {
      // 1. อัปโหลดรูปภาพ (ถ้ามี)
      if (photo) {
        photoUrl = await uploadPhoto(photo);
      }

      // 2. โพสต์ข้อมูลทริปไปยังตาราง 'trips'
      const { error: insertError } = await supabase
        .from("trips")
        .insert([
          {
            title,
            description,
            location_name,
            latitude: latitude || null, // เก็บเป็น null ถ้าไม่ได้กรอก
            longitude: longitude || null, // เก็บเป็น null ถ้าไม่ได้กรอก
            photo_url: photoUrl,
            user_id: user.id,
          },
        ]);

      if (insertError) throw insertError;

      setMessage("✅ โพสต์ทริปสำเร็จ!");
      // นำทางไปหน้า MyTrips หรือ Home
      setTimeout(() => {
        navigate("/my-trips"); 
      }, 1500);

    } catch (err) {
      console.error("Post error:", err.message);
      setMessage(`❌ โพสต์ไม่สำเร็จ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loadingTripCount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl text-green-600">กำลังตรวจสอบสถานะ...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-2xl animate-fadeIn">
          <h1 className="text-3xl font-extrabold text-green-800 mb-6 flex items-center">
            <Upload className="w-8 h-8 mr-2" /> โพสต์ทริปใหม่
          </h1>
          
          {/* 💡 แสดงสถานะสมาชิกและการจำกัด */}
          <div className={`p-4 rounded-lg mb-6 ${isPremium ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 'bg-green-100 text-green-700 border-green-300'}`}>
            <p className="font-semibold">
              สถานะ: <span className="font-bold">{isPremium ? "Premium ⭐" : "Free"}</span>
            </p>
            {isPremium ? (
                <p className="text-sm">คุณสามารถโพสต์ทริปได้ไม่จำกัด</p>
            ) : (
                <p className="text-sm">คุณโพสต์แล้ว {userTripCount} จาก {MAX_FREE_TRIPS} ทริป <Link to="/premium-signup" className="text-yellow-600 underline font-semibold">อัปเกรด Premium</Link></p>
            )}
          </div>
          
          {/* ❌ ข้อความแจ้งเตือนเมื่อโพสต์ไม่ได้ */}
          {!canPost && !isPremium && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 font-medium">
              <p>คุณโพสต์ครบตามขีดจำกัดแล้ว ({MAX_FREE_TRIPS} ทริป) กรุณาอัปเกรดเป็น Premium เพื่อโพสต์เพิ่มเติม</p>
            </div>
          )}

          <form onSubmit={handlePost} className="space-y-6">
            
            {/* 1. ชื่อทริป */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">ชื่อทริป <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-400"
                placeholder="ทริป 3 วัน 2 คืน ที่เชียงใหม่"
                required
              />
            </div>

            {/* 2. คำอธิบาย */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">คำอธิบาย <span className="text-red-500">*</span></label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="5"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-400"
                placeholder="สรุปแผนการเดินทาง ไฮไลท์ และเคล็ดลับ"
                required
              ></textarea>
            </div>

            {/* 3. สถานที่หลัก */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center">
                <MapPin className="w-5 h-5 mr-1" /> ชื่อสถานที่ (เช่น เชียงใหม่, ญี่ปุ่น) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={location_name}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-400"
                placeholder="ชื่อจังหวัด หรือประเทศ"
                required
              />
            </div>
            
            {/* 4. พิกัดแผนที่ (ละติจูด/ลองจิจูด) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">ละติจูด (Latitude)</label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-400"
                  placeholder="13.7563"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">ลองจิจูด (Longitude)</label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-400"
                  placeholder="100.5018"
                />
              </div>
            </div>

            {/* 5. รูปภาพ */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                รูปภาพหลัก (ไม่เกิน 5MB)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files[0])}
                className="w-full"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !canPost || !isFormValid} // 💡 ปิดการใช้งานปุ่มถ้าโพสต์ไม่ได้
              className={`w-full py-3 rounded-lg font-semibold text-white transition ${
                (loading || !canPost || !isFormValid) ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {loading ? "กำลังโพสต์..." : "โพสต์ทริป"}
            </button>

            {message && (
              <p
                className={`text-center mt-4 font-medium ${
                  message.includes("สำเร็จ") ? "text-green-600" : "text-red-600"
                }`}
              >
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}