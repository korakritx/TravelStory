// ✅ src/pages/TripDetailPage.jsx (ฉบับแก้ไข)
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom"; 
import Navbar from "../components/Navbar";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { MapPin, User, Calendar, Edit, Trash2, Globe, AlertTriangle, CheckCircle } from 'lucide-react';

// ✅ Modal ยืนยันการลบ
const DeleteConfirmationModal = ({ isVisible, onClose, onConfirm, tripTitle }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full text-center">
                <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">ยืนยันการลบทริป</h2>
                <p className="text-gray-600 mb-6">
                    โปรดยืนยันการลบรายการ:
                    <span className="font-semibold text-red-600 block mt-1">"{tripTitle}"</span>
                    การกระทำนี้ไม่สามารถย้อนกลับได้
                </p>
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition flex items-center justify-center space-x-2"
                    >
                        <Trash2 className="w-5 h-5" />
                        <span>ยืนยันการลบ</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// ✅ Modal แสดงความสำเร็จหลังลบ
const SuccessDeleteModal = ({ isVisible, onClose }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full text-center">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">ลบสำเร็จ!</h2>
                <p className="text-gray-600 mb-6">ทริปของคุณถูกลบออกจากระบบเรียบร้อยแล้ว</p>
                <button
                    onClick={onClose}
                    className="w-full py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
                >
                    กลับสู่หน้าหลัก
                </button>
            </div>
        </div>
    );
};

export default function TripDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    // 🚨 แก้ไข: ดึง user และ userPlanLevel มาใช้งาน
    const { user, userPlanLevel } = useAuth(); 

    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [username, setUsername] = useState('กำลังโหลด...'); 

    const placeholderImage = 'https://placehold.co/800x600/34D399/FFFFFF?text=Trip+Image';

    // ✅ ฟังก์ชันโหลดข้อมูลโปรไฟล์ผู้โพสต์
    const fetchUsername = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', userId)
                .single();
            
            if (error) throw error;
            return data.username || 'ไม่ระบุชื่อ';
        } catch (err) {
            console.error("Error fetching username:", err.message);
            return 'ไม่ระบุชื่อ (ข้อผิดพลาด)';
        }
    };


    useEffect(() => {
        if (showSuccessModal) return;

        async function fetchTrip() {
            setLoading(true);
            setError(null);

            try {
                // ดึงข้อมูลทริปอย่างเดียวเพื่อลดโอกาสเกิดปัญหา Join/RLS
                const { data, error } = await supabase
                    .from('trips')
                    .select(`
                        id,
                        title,
                        description,
                        location_name,
                        latitude,
                        longitude,
                        photo_url,
                        user_id,
                        created_at
                    `)
                    .eq('id', id)
                    .maybeSingle();

                if (error) throw error;
                if (!data) throw new Error("Trip not found");

                setTrip(data);
                
                // ดึงชื่อผู้ใช้แยกต่างหาก
                const fetchedUsername = await fetchUsername(data.user_id);
                setUsername(fetchedUsername);


            } catch (err) {
                console.error("Error fetching trip detail:", err);
                setError("ไม่พบข้อมูลทริปนี้ หรือเกิดข้อผิดพลาดในการดึงข้อมูล: " + err.message); 
            } finally {
                setLoading(false);
            }
        }

        fetchTrip();
    }, [id, showSuccessModal]);

    // 🚨 แก้ไข handleConfirmDelete ให้ใช้ trip.user_id เป็นเงื่อนไขการลบ 
    // เพื่อให้แอดมินลบได้ (โดยอาศัย RLS ที่เราตั้งค่าไว้)
    const handleConfirmDelete = async () => {
        setShowDeleteModal(false);

        // 💡 กำหนดเงื่อนไขการลบ:
        // ถ้าเป็นเจ้าของ (isOwner) ใช้ user.id
        // ถ้าเป็นแอดมิน (isAdmin) ใช้ trip.user_id ของโพสต์นั้น
        // แต่เพื่อความง่ายและปลอดภัยในการส่งคำสั่ง DELETE ไป Supabase เราจะใช้ trip.user_id เสมอ
        // (เพราะ Supabase RLS จะตรวจสอบเองว่าผู้ใช้ปัจจุบันมีสิทธิ์ลบโพสต์นี้หรือไม่)
        const deleteUserId = trip.user_id; 

        try {
            // ลบรูปใน Storage ถ้ามี
            if (trip.photo_url) {
                const pathSegments = trip.photo_url.split('/trip-images/');
                if (pathSegments.length > 1) {
                    const filePath = pathSegments[1];
                    const { error: storageError } = await supabase
                        .storage
                        .from('trip-images')
                        .remove([filePath]);
                    if (storageError)
                        console.warn("Warning: Could not delete image:", storageError.message);
                }
            }

            // ลบข้อมูลในตาราง trips
            const { error: deleteError } = await supabase
                .from('trips')
                .delete()
                .eq('id', id)
                .eq('user_id', deleteUserId); // 🚨 ใช้ user_id ของโพสต์ ไม่ใช่ user.id ของผู้ลบ

            if (deleteError) throw deleteError;

            setTrip(null);
            setShowSuccessModal(true);
        } catch (err) {
            console.error("Error deleting trip:", err);
            // Supabase จะตอบกลับด้วย 403 (Forbidden) หากไม่มีสิทธิ์
            setError("เกิดข้อผิดพลาดในการลบทริป (อาจไม่มีสิทธิ์): " + err.message);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        navigate('/home');
    };


    const formattedDate = trip?.created_at
        ? new Date(trip.created_at).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : 'ไม่ทราบวันที่';

    // 🚨 1. ตรวจสอบสิทธิ์ Admin
    const isOwner = user?.id === trip?.user_id;
    const isAdmin = userPlanLevel === 'admin';
    const canEditOrDelete = isOwner || isAdmin; // แอดมินหรือเจ้าของสามารถลบ/แก้ไขได้
    
    if (showSuccessModal) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <SuccessDeleteModal isVisible={true} onClose={handleSuccessClose} />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-xl text-green-600">กำลังโหลดรายละเอียดทริป...</p>
            </div>
        );
    }

    if (error || !trip) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-4xl mx-auto mt-20 p-6 text-center">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-lg">
                        {error || 'ไม่พบข้อมูลทริป'}
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-5xl mx-auto mt-20 p-6">
                <div className="mb-8 rounded-xl overflow-hidden shadow-2xl">
                    <img
                        src={trip.photo_url || placeholderImage}
                        alt={trip.title}
                        className="w-full h-96 object-cover"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = placeholderImage;
                        }}
                    />
                </div>

                <div className="bg-white p-8 rounded-xl shadow-lg">
                    <div className="flex justify-between items-start mb-6">
                        <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
                            {trip.title}
                        </h1>

                        {/* 🚨 แก้ไข: ปุ่มแก้ไข/ลบ สำหรับเจ้าของทริป *หรือ* แอดมิน */}
                        {canEditOrDelete && (
                            <div className="flex space-x-3">
                                {isOwner && ( // อนุญาตให้เจ้าของแก้ไขเท่านั้น
                                    <Link 
                                        to={`/trip/edit/${trip.id}`}
                                        className="p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition shadow-md"
                                        title="แก้ไขทริป"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </Link>
                                )}
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition shadow-md"
                                    title="ลบทริป"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-sm text-gray-600">
                        <p className="flex items-center">
                            <User className="w-4 h-4 mr-2 text-green-500" /> โพสต์โดย:
                            <span className="font-medium text-gray-800 ml-1">
                                {username} 
                            </span>
                        </p>
                        <p className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-red-500" /> สถานที่:
                            <span className="font-medium text-gray-800 ml-1">
                                {trip.location_name || 'ไม่ระบุ'}
                            </span>
                        </p>
                        <p className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-blue-500" /> วันที่โพสต์:
                            <span className="font-medium text-gray-800 ml-1">{formattedDate}</span>
                        </p>
                    </div>

                    <div className="prose max-w-none text-gray-700 leading-relaxed">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">
                            รายละเอียดทริป
                        </h2>
                        <p className="whitespace-pre-wrap">{trip.description}</p>
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-200">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                            <Globe className="w-6 h-6 mr-2 text-blue-500" />
                            พิกัดแผนที่
                        </h3>

                        {trip.latitude && trip.longitude ? (
                            <div className="h-80 w-full rounded-xl overflow-hidden shadow-xl">
                                <iframe
                                    // 🚀 แก้ไขไวยากรณ์และ URL ของแผนที่ให้ถูกต้อง (บรรทัดที่ 215)
                                    src={`https://maps.google.com/maps?q=${trip.latitude},${trip.longitude}&z=14&ie=UTF8&iwloc=&output=embed`}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title={`Map of ${trip.location_name || trip.title}`}
                                ></iframe>
                            </div>
                        ) : (
                            <div className="bg-gray-100 p-4 rounded-lg text-gray-600 text-center">
                                <p>ทริปนี้ไม่ได้ระบุพิกัดแผนที่</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <DeleteConfirmationModal
                isVisible={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleConfirmDelete}
                tripTitle={trip?.title || 'รายการนี้'}
            />
        </div>
    );
}