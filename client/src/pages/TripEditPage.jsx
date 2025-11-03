import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom"; // ✅ เพิ่ม Navigate และ useParams
// ✅ แก้ไข: เพิ่ม .jsx, .js เพื่อให้การนำเข้าทำงานได้อย่างถูกต้อง
import Navbar from "../components/Navbar.jsx";
import { supabase } from "../supabaseClient.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Edit, Image as ImageIcon, MapPin, Globe, CheckCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; 

// 🚨🚨🚨 คอมโพเนนต์ SuccessModal 🚨🚨🚨
const SuccessModal = ({ isVisible, onClose, tripId }) => {
  if (!isVisible) return null;

  return (
    // Backdrop
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300">
      {/* Modal Container */}
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full text-center transform transition-all duration-300 scale-100">
        <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">แก้ไขสำเร็จ!</h2>
        <p className="text-gray-600 mb-6">ทริปของคุณได้รับการอัปเดตเรียบร้อยแล้ว</p>
        <button
          onClick={onClose} 
          className="w-full py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
        >
          ไปยังหน้าทริป
        </button>
      </div>
    </div>
  );
};

// 🚨🚨🚨 คอมโพเนนต์ TripEditPage 🚨🚨🚨
export default function TripEditPage() {
  const { id } = useParams(); // ดึง ID ของทริปที่ต้องการแก้ไข
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(null); // URL รูปเดิม
  const [imageFile, setImageFile] = useState(null); // ไฟล์รูปใหม่
  const [isUpdating, setIsUpdating] = useState(false);
  const [loadingTrip, setLoadingTrip] = useState(true); // โหลดข้อมูลทริปเดิม
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [tripUserId, setTripUserId] = useState(null); // เก็บ user_id ของทริป

  // ตรวจสอบความสมบูรณ์ของฟอร์ม
  const isFormValid = title && description && locationName && !isUpdating;


  // 1. ดึงข้อมูลทริปเดิมมาแสดงในฟอร์ม
  useEffect(() => {
    if (!id || authLoading) return;

    const fetchTrip = async () => {
      setLoadingTrip(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("trips")
          .select(`id, title, description, location_name, latitude, longitude, photo_url, user_id`)
          .eq("id", id)
          .single();

        if (error) throw error;
        if (!data) throw new Error("ไม่พบข้อมูลทริปนี้");

        // กำหนดค่าเริ่มต้นให้ฟอร์ม
        setTitle(data.title);
        setDescription(data.description);
        setLocationName(data.location_name);
        setLatitude(data.latitude || "");
        setLongitude(data.longitude || "");
        setCurrentPhotoUrl(data.photo_url);
        setTripUserId(data.user_id); // บันทึก user_id ของทริป

      } catch (err) {
        console.error("Error fetching trip for edit:", err);
        setError("ไม่สามารถดึงข้อมูลทริปเพื่อแก้ไขได้");
      } finally {
        setLoadingTrip(false);
      }
    };

    fetchTrip();
  }, [id, authLoading]); // อิงตาม id ของทริปและสถานะ Auth


  // Handler สำหรับจัดการการเลือกไฟล์ใหม่
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("ไฟล์ภาพมีขนาดใหญ่เกิน 5MB กรุณาเลือกไฟล์อื่น");
        setImageFile(null);
        e.target.value = null; 
      } else {
        setImageFile(file);
      }
    }
  };

  // Handler การอัปเดตทริป
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!user || !isFormValid || user.id !== tripUserId) return; // ป้องกันการอัปเดตถ้าไม่ใช่เจ้าของ

    setIsUpdating(true);
    setError(null);
    let newPhotoUrl = currentPhotoUrl; // ใช้ URL เดิมเป็นค่าเริ่มต้น
    let shouldDeleteOldImage = false;

    try {
        // 1. อัปโหลดรูปภาพใหม่ (ถ้ามีการเลือกไฟล์ใหม่)
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${user.id}/${uuidv4()}.${fileExt}`; 
            
            // อัปโหลดไฟล์ใหม่
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('photos')
                .upload(`trip_photos/${fileName}`, imageFile, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            // ดึง Public URL ของรูปภาพใหม่
            const { data: publicUrlData } = supabase.storage
                .from('photos')
                .getPublicUrl(uploadData.path); 
            
            newPhotoUrl = publicUrlData.publicUrl;
            shouldDeleteOldImage = currentPhotoUrl && currentPhotoUrl !== newPhotoUrl;
        }

        // 2. อัปเดตข้อมูลทริปในฐานข้อมูล (Postgres)
        const updatedTrip = {
            title: title,
            description: description,
            location_name: locationName,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            photo_url: newPhotoUrl,
        };

        const { error: updateError } = await supabase
            .from('trips')
            .update(updatedTrip)
            .eq('id', id)
            .eq('user_id', user.id); // ป้องกันการแก้ไขโดยไม่ใช่เจ้าของ

        if (updateError) throw updateError;
        
        // 3. ลบรูปภาพเก่าออกจาก Storage ถ้ามีไฟล์ใหม่ถูกอัปโหลด
        if (shouldDeleteOldImage) {
            try {
                // แยกชื่อไฟล์จาก URL รูปภาพเก่า
                const pathParts = currentPhotoUrl.split('/');
                const fileNameWithFolder = pathParts.slice(pathParts.indexOf('trip_photos')).join('/');

                const { error: storageError } = await supabase.storage
                    .from('photos')
                    .remove([fileNameWithFolder]);

                if (storageError) {
                    console.error("Storage delete error (non-critical):", storageError);
                    // ไม่ต้อง throw error เพราะข้อมูลหลักถูกอัปเดตแล้ว
                }
            } catch (storageErr) {
                console.warn("Could not delete old storage file:", storageErr);
            }
        }

        // 4. แสดง Modal สำเร็จ
        setCurrentPhotoUrl(newPhotoUrl); // อัปเดต URL รูปภาพใน state
        setImageFile(null); // ล้างไฟล์ที่เลือกใหม่
        setShowSuccessModal(true);

    } catch (err) {
        console.error("Update Trip Error:", err);
        setError(`ไม่สามารถอัปเดตทริปได้: ${err.message || 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ'}`);
    } finally {
        setIsUpdating(false);
    }
  };

  // Handler เมื่อ Modal ถูกปิด
  const handleModalClose = () => {
    setShowSuccessModal(false);
    navigate(`/trip/${id}`); // นำทางไปหน้า Detail Page
  };


  // 🚨 Logic การป้องกันเส้นทางและสถานะโหลด
  if (authLoading || loadingTrip) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-16">
            <Navbar />
            <p className="text-xl text-green-600">กำลังโหลดข้อมูลทริป...</p>
        </div>
    );
  }
    
  // ถ้าไม่มีผู้ใช้ หรือผู้ใช้ไม่ใช่เจ้าของทริป ให้ redirect ไปหน้าหลัก
  if (!user || user.id !== tripUserId) {
      if (tripUserId) {
        // ถ้าทริปมีอยู่แต่ไม่ใช่เจ้าของ
        alert("คุณไม่มีสิทธิ์แก้ไขทริปนี้");
        return <Navigate to={`/trip/${id}`} replace />; 
      }
      // ถ้าไม่มี user เลย (Protected Route)
      return <Navigate to="/" replace />; 
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Navbar /> 
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-2xl">
          <h1 className="text-3xl font-extrabold text-gray-800 mb-6 border-b-4 border-blue-500 pb-2 flex items-center">
            <Edit className="w-7 h-7 mr-2 text-blue-600" />
            แก้ไขทริป: {title}
          </h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-6">
            
            {/* 1. Title */}
            <div>
              <label htmlFor="title" className="block text-lg font-medium text-gray-700 mb-2">ชื่อทริป*</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น: สำรวจธรรมชาติที่เขาใหญ่"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                required
              />
            </div>

            {/* 2. Description */}
            <div>
              <label htmlFor="description" className="block text-lg font-medium text-gray-700 mb-2">รายละเอียดทริป*</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="6"
                placeholder="เล่าเรื่องราวการเดินทางของคุณอย่างละเอียด..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                required
              ></textarea>
            </div>
            
            {/* 3. Location Name */}
            <div>
              <label htmlFor="locationName" className="block text-lg font-medium text-gray-700 mb-2 flex items-center">
                <MapPin className="w-5 h-5 mr-1 text-blue-500" /> สถานที่สำคัญ*
              </label>
              <input
                id="locationName"
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="เช่น: อุทยานแห่งชาติเขาใหญ่"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                required
              />
            </div>

            {/* 4. Latitude & Longitude (Optional) */}
            <div className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                <h3 className="text-xl font-semibold text-gray-700 mb-3 flex items-center">
                    <Globe className="w-5 h-5 mr-2 text-blue-500" /> พิกัดแผนที่ (ไม่บังคับ)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Latitude */}
                    <div>
                        <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">ละติจูด (Latitude)</label>
                        <input
                            id="latitude"
                            type="number"
                            step="any"
                            value={latitude}
                            onChange={(e) => setLatitude(e.target.value)}
                            placeholder="เช่น: 14.5678"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    {/* Longitude */}
                    <div>
                        <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">ลองจิจูด (Longitude)</label>
                        <input
                            id="longitude"
                            type="number"
                            step="any"
                            value={longitude}
                            onChange={(e) => setLongitude(e.target.value)}
                            placeholder="เช่น: 101.2345"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* 5. Image File Upload & Current Image */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-700 flex items-center"><ImageIcon className="w-5 h-5 mr-1 text-blue-500" /> รูปภาพหลัก (เลือกไฟล์ใหม่หากต้องการเปลี่ยน)</h3>
                
                {/* แสดงรูปภาพปัจจุบัน */}
                {currentPhotoUrl && !imageFile && (
                    <div className="w-48 h-32 overflow-hidden rounded-lg shadow-md border border-gray-200">
                        <img 
                            src={currentPhotoUrl} 
                            alt="Current Trip Photo" 
                            className="w-full h-full object-cover" 
                        />
                        <p className="text-xs text-gray-500 mt-1">รูปภาพปัจจุบัน</p>
                    </div>
                )}

                {/* Input สำหรับเลือกไฟล์ใหม่ */}
                <input 
                    id="imageFile" 
                    type="file" 
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                    onChange={handleFileChange} 
                    accept="image/*" 
                />
                {imageFile && (
                    <p className="mt-2 text-sm text-blue-600">ไฟล์ใหม่ที่เลือก: **{imageFile.name}** ({Math.round(imageFile.size / 1024)} KB)</p>
                )}
            </div>

            {/* 6. ปุ่มอัปเดต */}
            <button
              type="submit"
              disabled={isUpdating || !isFormValid}
              className={`w-full py-3 mt-4 rounded-xl text-white font-bold transition-all transform shadow-lg flex items-center justify-center space-x-2 
                ${ (isUpdating || !isFormValid) ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 hover:scale-[1.01]" }`}
            >
              {isUpdating ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <Edit className="w-5 h-5" />
              )}
              <span>{isUpdating ? 'กำลังอัปเดต...' : 'อัปเดตทริป'}</span>
            </button>
            <button
                type="button"
                onClick={() => navigate(`/trip/${id}`)}
                className="w-full py-2 mt-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-semibold"
            >
                ยกเลิก
            </button>
          </form>
        </div>
      </div>
      
      {/* 7. Modal สำหรับแจ้งความสำเร็จ */}
      <SuccessModal
        isVisible={showSuccessModal}
        onClose={handleModalClose}
        tripId={id}
      />
    </div>
  );
}