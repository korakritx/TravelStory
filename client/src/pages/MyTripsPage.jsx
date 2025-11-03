import React, { useState, useEffect, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom'; 
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { ListOrdered, Edit, Trash2, AlertTriangle } from 'lucide-react'; 

// 🚨🚨🚨 คอมโพเนนต์ Modal สำหรับยืนยันการลบ 🚨🚨🚨
const DeleteConfirmationModal = ({ isVisible, onClose, onConfirm, tripTitle }) => {
    if (!isVisible) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full text-center transform transition-all duration-300 scale-100">
                <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">ยืนยันการลบทริป</h2>
                <p className="text-gray-600 mb-6">
                    คุณแน่ใจหรือไม่ที่จะลบทริป <span className="font-semibold text-red-600">"{tripTitle}"</span>? การดำเนินการนี้ไม่สามารถยกเลิกได้
                </p>
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
                    >
                        ยืนยันการลบ
                    </button>
                </div>
            </div>
        </div>
    );
};

// 🚨🚨🚨 คอมโพเนนต์ TripCard 🚨🚨🚨
const TripCard = ({ trip, onDelete }) => {
    const placeholderImage = 'https://placehold.co/400x300/34D399/FFFFFF?text=No+Image';
    const formattedDate = new Date(trip.created_at).toLocaleDateString('th-TH');

    return (
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden relative">
            <Link to={`/trip/${trip.id}`} className="block">
                <img 
                    src={trip.photo_url || placeholderImage} 
                    alt={trip.title} 
                    className="w-full h-48 object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
                />
            </Link>
            
            <div className="p-4">
                <Link to={`/trip/${trip.id}`}>
                    <h3 className="text-xl font-semibold text-gray-800 truncate mb-2 hover:text-green-600 transition-colors">{trip.title}</h3>
                </Link>
                <p className="text-sm text-gray-500">โพสต์เมื่อ: {formattedDate}</p>
                
                {/* ปุ่มจัดการ: แก้ไขและลบ */}
                <div className="mt-4 flex space-x-2">
                    <Link 
                        to={`/trip/edit/${trip.id}`}
                        className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg text-blue-600 border border-blue-600 hover:bg-blue-50 transition-colors"
                    >
                        <Edit className="w-4 h-4 mr-1" /> แก้ไข
                    </Link>
                    <button
                        onClick={() => onDelete(trip.id, trip.title, trip.photo_url)}
                        className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg text-red-600 border border-red-600 hover:bg-red-50 transition-colors"
                    >
                        <Trash2 className="w-4 h-4 mr-1" /> ลบ
                    </button>
                </div>
            </div>
        </div>
    );
};


// ----------------------------------------------------
// เริ่มต้นคอมโพเนนต์หลัก MyTripsPage
// ----------------------------------------------------

export default function MyTripsPage() {
    // 💡 ดึง user และ authLoading
    const { user, authLoading } = useAuth(); 
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true); // Loading สำหรับการดึงข้อมูลทริป
    const [error, setError] = useState(null);
    
    // สถานะสำหรับ Modal การลบ
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [tripToDeleteId, setTripToDeleteId] = useState(null);
    const [tripTitleToDelete, setTripTitleToDelete] = useState('');
    const [tripPhotoUrlToDelete, setTripPhotoUrlToDelete] = useState(null);


    // 1. ฟังก์ชันดึงข้อมูลทริป (ใช้ useCallback)
    const fetchMyTrips = useCallback(async (userId) => {
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('trips')
                .select('*')
                .eq('user_id', userId) 
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            setTrips(data || []);

        } catch (err) {
            console.error("Error fetching my trips:", err);
            setError("ไม่สามารถดึงข้อมูลทริปของคุณได้ โปรดลองอีกครั้ง");
            setTrips([]);
        } finally {
            setLoading(false);
        }
    }, []); // ไม่มี dependency

    // 2. useEffect สำหรับเรียกข้อมูลทริป
    useEffect(() => {
        // 🚨🚨🚨 เงื่อนไขสำคัญ: รัน fetchMyTrips เมื่อ user มีค่า และ authLoading เป็น false
        if (user && !authLoading) {
            // โค้ดที่บรรทัดนี้คือบรรทัดที่ 22 เดิม ที่แก้ไขแล้ว
            fetchMyTrips(user.id); 
            
            // 💡 Realtime Subscription 
            const channel = supabase.channel(`mytrips_${user.id}`)
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'trips', filter: `user_id=eq.${user.id}` },
                    () => fetchMyTrips(user.id) 
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        } else if (!authLoading && !user) {
            // กรณีโหลด Auth เสร็จแล้วแต่ไม่มีผู้ใช้ (ถูก ProtectedRoute ส่งออกไป แต่ก็ป้องกันไว้)
            setLoading(false); 
        }

    }, [user, authLoading, fetchMyTrips]); 
    
    // 3. ฟังก์ชันจัดการการลบทริป
    const handleDeleteClick = (tripId, tripTitle, photoUrl) => {
        setTripToDeleteId(tripId);
        setTripTitleToDelete(tripTitle);
        setTripPhotoUrlToDelete(photoUrl);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!tripToDeleteId || !user?.id) return;

        setShowDeleteModal(false);
        setLoading(true); 

        try {
            // ลบรายการทริป
            const { error: deleteTripError } = await supabase
                .from('trips')
                .delete()
                .eq('id', tripToDeleteId)
                .eq('user_id', user.id); 

            if (deleteTripError) throw deleteTripError;

            // ลบรูปภาพที่เกี่ยวข้องด้วย (ถ้ามี)
            if (tripPhotoUrlToDelete) {
                const filePath = tripPhotoUrlToDelete.split('trip_photos/')[1];
                await supabase.storage.from('trip_photos').remove([filePath]);
            }

            // อัปเดต State (Realtime จะทำหน้าที่นี้ แต่เราอัปเดตเองเลยก็ได้)
            setTrips(prev => prev.filter(t => t.id !== tripToDeleteId));

        } catch (err) {
            console.error("Error deleting trip:", err);
            setError("❌ ลบทริปไม่สำเร็จ: " + (err.message || 'เกิดข้อผิดพลาด'));
        } finally {
            setLoading(false);
            setTripToDeleteId(null);
            setTripTitleToDelete('');
            setTripPhotoUrlToDelete(null);
        }
    };


    // 🚨🚨🚨 Guard Clause (สำคัญที่สุด) 🚨🚨🚨
    // 1. ถ้า AuthContext ยังโหลดอยู่ ให้แสดง Loading
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-xl text-green-600">กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</p>
            </div>
        );
    }
    
    // 2. ถ้าโหลดเสร็จแล้วแต่ไม่มีผู้ใช้ (กรณี ProtectedRoute ล้มเหลว)
    if (!user) {
        return <Navigate to="/" replace />;
    }
    // 🚨 จบ Guard Clauses 🚨


    // 4. แสดงหน้าหลัก
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
                <div className="flex justify-between items-center mb-8 border-b pb-4">
                    <h1 className="text-3xl font-bold text-green-800 flex items-center">
                        <ListOrdered className="w-6 h-6 mr-2 text-green-600" />
                        ทริปของคุณ ({trips.length})
                    </h1>
                    <Link
                        to="/trip/post"
                        className="flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors"
                    >
                        + เพิ่มข้อมูลการท่องเที่ยว
                    </Link>
                </div>

                {/* แสดง Loading สำหรับการดึงทริป */}
                {loading && (
                    <div className="text-center py-10 text-lg text-green-600">กำลังโหลดทริปของคุณ...</div>
                )}

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-lg text-center">
                        {error}
                    </div>
                )}

                {!loading && !error && trips?.length === 0 && (
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-8 rounded-lg text-center mt-10">
                        <p className="text-xl font-semibold mb-2">คุณยังไม่มีทริปที่โพสต์</p>
                        <p>ไปเริ่มต้นแชร์เรื่องราวการเดินทางของคุณเลย!</p>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-10">
                    {trips?.map((trip) => (
                        <TripCard 
                            key={trip.id} 
                            trip={trip} 
                            onDelete={handleDeleteClick} 
                        />
                    ))}
                </div>
            </div>

            {/* Modal ยืนยันการลบ */}
            <DeleteConfirmationModal
                isVisible={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleConfirmDelete}
                tripTitle={tripTitleToDelete}
            />
        </div>
    );
}