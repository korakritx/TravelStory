// ✅ src/pages/AdminDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
// 💡 เพิ่ม Search icon
import { BarChart3, Trash2, X, AlertTriangle, Check, Eye, Search, Loader2 } from 'lucide-react'; 
import { Link, Navigate } from 'react-router-dom';

// 🚨 Component: Modal ยืนยันการลบ
const DeleteConfirmationModal = ({ isVisible, onClose, onConfirm, tripTitle }) => {
    if (!isVisible) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full text-center">
                <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">ยืนยันการลบทริป</h2>
                <p className="text-gray-600 mb-6">
                    คุณต้องการลบทริป <span className="font-semibold text-red-600">"{tripTitle}"</span> นี้หรือไม่?
                </p>
                <div className="flex justify-between space-x-4">
                    <button onClick={onClose} className="w-full py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition">
                        ยกเลิก
                    </button>
                    <button onClick={onConfirm} className="w-full py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition flex items-center justify-center space-x-1">
                        <Check className="w-5 h-5" />
                        <span>ยืนยัน</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function AdminDashboardPage() {
    const { isAdmin, loading: authLoading } = useAuth();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [tripToDelete, setTripToDelete] = useState(null);
    // 🚀 State ใหม่สำหรับแถบค้นหา
    const [searchTerm, setSearchTerm] = useState('');

    // 💡 ฟังก์ชันดึงข้อมูลทริปทั้งหมด (พร้อมการค้นหา)
    const fetchAllTrips = async (searchQuery = '') => {
        setLoading(true);
        setError(null);
        
        let query = supabase
            .from("trips")
            .select(`
                id, title, created_at, 
                profiles ( username ) 
            `)
            .order("created_at", { ascending: false });

        // 🚀 ถ้ามีคำค้นหา ให้ทำการค้นหาจากชื่อผู้ใช้ (username)
        // Note: การค้นหาแบบนี้ใน Supabase/Postgres อาจต้องใช้ RLS และ Indexing ช่วย
        // แต่เพื่อความเรียบง่ายในโค้ด React เราจะดึงข้อมูลมาทั้งหมดก่อนแล้ว Filter ด้วย JS
        // (สำหรับการใช้งานจริง ควรปรับ query ให้ Supabase กรองข้อมูลให้)

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching trips:", error);
            setError("ไม่สามารถโหลดข้อมูลทริปทั้งหมดได้");
        } else {
            // 🚀 ทำการกรองด้วย JavaScript (ถ้ามีคำค้นหา)
            const filteredData = data.filter(trip => {
                const username = trip.profiles?.username?.toLowerCase() || '';
                const title = trip.title?.toLowerCase() || '';
                const search = searchQuery.toLowerCase();
                
                // ค้นหาจากชื่อผู้ใช้ หรือ ชื่อทริป
                return username.includes(search) || title.includes(search);
            });

            setTrips(filteredData);
        }
        setLoading(false);
    };

    useEffect(() => {
        // 🚨 เช็คสถานะแอดมินก่อนเรียก API
        if (!authLoading && isAdmin) {
            // เรียก fetchAllTrips โดยไม่มีคำค้นหาครั้งแรก
            fetchAllTrips();
        }
    }, [authLoading, isAdmin]);

    // 🚀 ฟังก์ชันเรียกค้นหาเมื่อ Search Term เปลี่ยน
    useEffect(() => {
        // Debounce หรือเรียกทันทีก็ได้
        const handler = setTimeout(() => {
            if (isAdmin) {
                // เรียก API อีกครั้งเมื่อ searchTerm เปลี่ยน
                fetchAllTrips(searchTerm); 
            }
        }, 300); // ดีเลย์ 300ms เพื่อลดการเรียก API ถี่เกินไป

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm, isAdmin]);

    // 💡 การจัดการลบทริป
    const handleDeleteClick = (trip) => {
        setTripToDelete(trip);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!tripToDelete) return;

        setShowDeleteModal(false);
        setLoading(true); // แสดงสถานะโหลดระหว่างลบ

        // ✅ การลบข้อมูลจริงจาก Supabase
        const { error } = await supabase
            .from('trips')
            .delete()
            .eq('id', tripToDelete.id);

        if (error) {
            console.error("Error deleting trip:", error);
            alert("❌ เกิดข้อผิดพลาดในการลบทริป: " + error.message);
        } else {
            // อัปเดตรายการทริปใหม่ทันทีด้วยคำค้นหาปัจจุบัน
            fetchAllTrips(searchTerm); 
            alert("✅ ลบทริปสำเร็จ!");
        }
        setTripToDelete(null);
        setLoading(false);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl text-green-600">กำลังตรวจสอบสิทธิ์แอดมิน...</p>
            </div>
        );
    }

    // 🚨 หากไม่ใช่แอดมิน (AdminRoute ควรจะ Redirect ไปแล้ว แต่ใส่เผื่อไว้)
    if (!isAdmin) return <Navigate to="/home" replace />; 

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto p-6 pt-20">
                <h1 className="text-4xl font-extrabold text-blue-800 mb-8 flex items-center">
                    <BarChart3 className="w-8 h-8 mr-2 text-blue-600" />
                    แผงควบคุมแอดมิน
                </h1>
                
                {/* 🚀 แถบค้นหา */}
                <div className="mb-6 flex items-center bg-white p-3 rounded-lg shadow-md border">
                    <Search className="w-5 h-5 text-gray-400 mr-2" />
                    <input
                        type="text"
                        placeholder="ค้นหาทริปจากชื่อผู้โพสต์ หรือชื่อทริป..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full text-lg p-1 focus:outline-none"
                    />
                </div>

                <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                    รายการโพสต์ทั้งหมด ({trips.length} โพสต์)
                </h2>
                
                {loading ? (
                    <div className="text-center py-10">
                        <Loader2 className="w-8 h-8 text-blue-500 mx-auto animate-spin" />
                        <p className="mt-2 text-gray-600">กำลังโหลด/ค้นหารายการทริป...</p>
                    </div>
                ) : trips.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-lg shadow-md">
                         <p className="text-gray-500">ไม่พบรายการทริปที่ตรงกับคำค้นหา "{searchTerm}"</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto bg-white shadow-xl rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-blue-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                                        ชื่อทริป
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                                        ผู้โพสต์
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                                        วันที่โพสต์
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">
                                        จัดการ
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {trips.map((trip) => (
                                    <tr key={trip.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 max-w-[100px] truncate">
                                            {trip.id.substring(0, 8)}...
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            <Link to={`/trip/${trip.id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                                                {trip.title}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {trip.profiles?.username || 'ไม่ระบุ'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(trip.created_at).toLocaleDateString('th-TH')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-center space-x-2">
                                            {/* 🚀 ปุ่มดูรายละเอียดโพสต์ (Eye icon) */}
                                            <Link 
                                                to={`/trip/${trip.id}`}
                                                target="_blank" 
                                                className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition"
                                                title="ดูรายละเอียดโพสต์"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </Link>
    
                                            {/* ปุ่มลบทริป */}
                                            <button 
                                                onClick={() => handleDeleteClick(trip)}
                                                className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition"
                                                title="ลบทริป"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal ยืนยันการลบ */}
            <DeleteConfirmationModal
                isVisible={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleConfirmDelete}
                tripTitle={tripToDelete?.title || 'รายการนี้'}
            />
        </div>
    );
}