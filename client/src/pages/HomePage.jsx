// ✅ src/pages/HomePage.jsx (ฉบับแก้ไข: ค้นหาด้วยสถานที่)
import React, { useEffect, useState, useCallback } from "react";
import Navbar from "../components/Navbar.jsx";
import { supabase } from "../supabaseClient.js"; 
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx"; 
import { User, Search } from "lucide-react"; 

export default function HomePage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true); 
  const { loading: authLoading } = useAuth(); 
  
  // State สำหรับแถบค้นหา
  const [searchTerm, setSearchTerm] = useState(''); 

  // ฟังก์ชันดึงข้อมูลทริป พร้อมรองรับการค้นหา
  const fetchTrips = useCallback(async (searchQuery = '') => {
    setLoading(true);
    
    // เริ่มต้น Query
    let query = supabase
      .from("trips")
      .select(`
        id, title, description, photo_url, location_name, created_at, user_id,
        profiles ( username )
      `);
      
    // 🚨 การเปลี่ยนแปลงสำคัญ: กรองตาม location_name แทน title
    if (searchQuery.trim()) {
        // ใช้ .ilike เพื่อค้นหาแบบไม่สนใจตัวพิมพ์เล็ก/ใหญ่ ในคอลัมน์ location_name
        query = query.ilike('location_name', `%${searchQuery.trim()}%`);
    }

    // สั่ง Query และเรียงลำดับ
    const { data, error } = await query
      .order("created_at", { ascending: false });

    if (error) {
      console.error("fetchTrips error:", error);
      setTrips([]);
    } else {
        // จัดการข้อมูลเพื่อให้ดึง username ได้อย่างถูกต้อง
        const formattedTrips = data.map(trip => {
            const profileData = Array.isArray(trip.profiles) 
                ? trip.profiles[0]
                : trip.profiles;

            return {
                ...trip,
                username: profileData?.username || 'ไม่ระบุ'
            };
        });
        setTrips(formattedTrips);
    }
    
    setLoading(false);
  }, []); 

  // เรียกข้อมูลครั้งแรกและเมื่อ searchTerm เปลี่ยน
  useEffect(() => {
    if (!authLoading) {
        fetchTrips(searchTerm);
    }
    
    // Realtime subscription (ใช้โค้ดเดิมของคุณ)
    const subscription = supabase
        .channel('public:trips')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
            fetchTrips(searchTerm); 
        })
        .subscribe();
        
    return () => {
        supabase.removeChannel(subscription);
    };
  }, [authLoading, searchTerm, fetchTrips]); 

  // ฟังก์ชันจัดการการค้นหาเมื่อมีการพิมพ์
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Loading state สำหรับ Auth
  if (authLoading) {
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
        <h1 className="text-4xl font-extrabold text-green-800 mb-8 text-center">
          ค้นพบการผจญภัยครั้งต่อไปของคุณ 🌍
        </h1>

        {/* แถบค้นหา UI */}
        <div className="mb-10 max-w-xl mx-auto">
          <div className="relative">
            <input
              type="text"
              // 🚨 เปลี่ยน Placeholder ให้สื่อถึงการค้นหาสถานที่
              placeholder="ค้นหาทริปจากชื่อสถานที่..." 
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full py-3 pl-12 pr-4 border-2 border-green-300 rounded-full shadow-lg focus:outline-none focus:ring-green-500 focus:border-green-500 transition duration-150 text-lg"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-green-500" />
          </div>
        </div>
        
        {/* ส่วนแสดงผลทริป */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-xl text-gray-600">กำลังโหลดทริป...</p>
          </div>
        ) : trips.length === 0 ? (
          <p className="text-gray-600 text-center text-lg mt-10">
            {/* 🚨 เปลี่ยนข้อความเมื่อไม่พบผลลัพธ์ */}
            {searchTerm ? `ไม่พบสถานที่ตรงกับคำว่า "${searchTerm}"` : "ยังไม่มีข้อมูลทริปเลย ลองเพิ่มทริปแรกของคุณสิ!"}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {trips.map((t) => (
              <div key={t.id} className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-[1.02] transition duration-300">
                <Link to={`/trip/${t.id}`}>
                  <img 
                    src={t.photo_url || "https://placehold.co/600x400/10B981/ffffff?text=No+Image"} 
                    alt={t.title} 
                    className="w-full h-48 object-cover" 
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/10B981/ffffff?text=No+Image"; }}
                  />
                  <div className="p-4 flex flex-col justify-between h-[120px]">
                    <h2 className="text-xl font-bold text-black-700 line-clamp-2">{t.title}</h2>
                    <div className="text-sm text-gray-500 mt-2 flex items-center">
                      <User className="w-4 h-4 mr-1 text-green-500" />
                      <span className="font-medium text-green-600">โดย: {t.username}</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}