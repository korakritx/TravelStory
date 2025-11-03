import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient.js"; 
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

// 👑👑👑 ADMIN CONFIGURATION 👑👑👑
// 🚨🚨🚨 สำคัญ: เปลี่ยน Email นี้เป็น Email จริงของแอดมินใน Supabase 🚨🚨🚨
const ADMIN_EMAIL = "admin@1"; 

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 1. ฟังก์ชันดึงข้อมูลโปรไฟล์พร้อม plan_level
  const fetchUserProfile = async (sessionUser) => {
    if (!sessionUser) return null;

    try {
      const { data, error, status } = await supabase
        .from("profiles")
        .select("username, plan_level") 
        .eq("id", sessionUser.id)
        .single();

      if (error && status !== 406) throw error;
      return { ...sessionUser, ...data };
    } catch (error) {
      console.error("Error fetching user profile:", error.message);
      return sessionUser;
    }
  };

  // 2. ฟังก์ชันสำหรับรีเฟรชข้อมูลผู้ใช้
  const refreshUserProfile = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const sessionUser = session?.user || null;

      if (sessionUser) {
        const profileUser = await fetchUserProfile(sessionUser);
        setUser(profileUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error refreshing user profile:", error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []); 

  // 3. จัดการสถานะการเข้าสู่ระบบ
  useEffect(() => {
    refreshUserProfile(); 
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
          refreshUserProfile(); 
        } else {
          setUser(session?.user || null);
          setLoading(false);
        }

        if (event === "SIGNED_OUT") {
          navigate("/");
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, [navigate, refreshUserProfile]); 

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // ✅ การตรวจสอบสิทธิ์ที่ส่งออก
  const isPremium = user?.plan_level === "premium"; 
  const userPlanLevel = user?.plan_level || "free";
  // 🚀🚀 ตรวจสอบสิทธิ์ Admin ด้วย Email
  const isAdmin = user?.email === ADMIN_EMAIL; 

  const value = {
    user,
    loading,
    signOut,
    isPremium,
    userPlanLevel,
    isAdmin, 
    refreshUserProfile, 
  };

  // ⏳ Loading UI
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-2xl text-green-600 font-semibold animate-pulse">
          กำลังโหลดข้อมูลผู้ใช้...
        </p>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};