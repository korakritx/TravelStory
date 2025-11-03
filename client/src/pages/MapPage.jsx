import React, { useState, useEffect } from 'react';
import Navbar from "../components/Navbar";
import { Map, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';

// 🚨 Constants สำหรับ Google Maps
const libraries = ["places"]; 
const mapContainerStyle = {
    width: '100%',
    height: '80vh'
};
const defaultCenter = { lat: 13.736717, lng: 100.523186 }; // กรุงเทพฯ (จุดศูนย์กลางเริ่มต้น)

export default function MapPage() {
    const [trips, setTrips] = useState([]);
    const [center, setCenter] = useState(defaultCenter); 
    const navigate = useNavigate();

    // 🚨 โหลด Script และใช้ API Key จาก Environment Variable
    // **สำคัญ:** VITE_GOOGLE_MAPS_API_KEY ต้องอยู่ในไฟล์ .env ของคุณ!
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "", // ใช้คีย์จาก .env
        libraries,
    });

    useEffect(() => {
        const fetchTrips = async () => {
            const { data, error } = await supabase
                .from('trips')
                .select('id, title, latitude, longitude')
                // กรองเฉพาะรายการที่มีพิกัดเพื่อแสดงบนแผนที่
                .not('latitude', 'is', null) 
                .not('longitude', 'is', null);

            if (error) {
                console.error("Error fetching trips for map:", error);
            } else {
                setTrips(data);
                
                // หากมีทริป ให้ตั้งศูนย์กลางแผนที่เป็นทริปแรก
                if (data.length > 0) {
                    setCenter({ 
                        lat: parseFloat(data[0].latitude), 
                        lng: parseFloat(data[0].longitude) 
                    });
                }
            }
        };

        fetchTrips();
    }, []);
    
    // 🚨 แสดง Loading State / Error State
    if (loadError) return (
        <div className="text-center p-10 mt-16 text-red-600">
            <h2 className="text-2xl font-bold mb-4">❌ Google Maps โหลดล้มเหลว: {loadError.message}</h2>
            <p className="text-gray-600">ข้อผิดพลาด: **The provided API key is invalid.**</p>
            <p className="text-gray-600">กรุณาตรวจสอบ **VITE_GOOGLE_MAPS_API_KEY** ในไฟล์ **.env** ของคุณ และเปิดใช้งาน **Maps JavaScript API** ใน Google Cloud Console</p>
        </div>
    );
    if (!isLoaded) return (
        <div className="min-h-screen flex flex-col items-center justify-center pt-20">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            <p className="mt-2 text-gray-600">กำลังโหลดแผนที่...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto mt-20 p-6 sm:p-8">
                <h1 className="text-4xl font-extrabold text-green-800 mb-8 flex items-center">
                    <Map className="w-9 h-9 mr-2 text-green-600" />
                    แผนที่การเดินทาง (Map View)
                </h1>
                
                <div className="h-[80vh] w-full rounded-xl overflow-hidden shadow-lg">
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={center}
                        zoom={6} 
                    >
                        {/* 4. แสดง Marker สำหรับแต่ละทริปที่มีพิกัด */}
                        {trips.map(trip => (
                            <Marker
                                key={trip.id}
                                position={{ lat: parseFloat(trip.latitude), lng: parseFloat(trip.longitude) }}
                                title={trip.title}
                                onClick={() => {
                                    // นำทางไปยังหน้ารายละเอียดทริปเมื่อคลิก Marker
                                    navigate(`/trip/${trip.id}`);
                                }}
                            />
                        ))}
                    </GoogleMap>
                </div>

                <p className="mt-4 text-sm text-gray-600">
                    แสดงตำแหน่งของทริปที่บันทึกพิกัดไว้ทั้งหมด ({trips.length} ตำแหน่ง)
                </p>
            </div>
        </div>
    );
}