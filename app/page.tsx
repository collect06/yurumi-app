"use client"
//
import { useState } from "react"
import InputPage from "./input/page"
import ViewPage from "./view/page"
import CalendarPage from "./calendar/page"
import { CSSProperties } from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const [tab, setTab] = useState("input")
  const [expenses, setExpenses] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [userId, setUserId] = useState("")
  
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser()
  
      if (!user) return
  
      const userId = user.id
  
      setUserId(userId)
  
      const { data: expensesData } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", userId)
  
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("sort_order")
  
      setExpenses(expensesData || [])
      setCategories(categoriesData || [])
  
      setLoading(false)
    }
  
    init()
  }, [])

  return (
    <div style={{ paddingBottom: "100px"}}>
      {/* メイン表示 */}
      <div style={{ display: tab === "input" ? "block" : "none" }}>
        <InputPage />
      </div>
      
      <div style={{ display: tab === "view" ? "block" : "none" }}>
        <ViewPage />
      </div>
      
      <div style={{ display: tab === "calendar" ? "block" : "none" }}>
        <CalendarPage />
      </div>

      {/* 下タブ */}
      <div style={tabBarStyle}>
        <button
          style={tab === "input" ? activeTab : tabButton}
          onClick={() => setTab("input")}
        >
          ✏️
          <div style={label}>入力</div>
        </button>

        <button
          style={tab === "view" ? activeTab : tabButton}
          onClick={() => setTab("view")}
        >
          📋
          <div style={label}>確認</div>
        </button>

        <button
          style={tab === "calendar" ? activeTab : tabButton}
          onClick={() => setTab("calendar")}
        >
          📅
          <div style={label}>カレンダー</div>
        </button>
        
      </div>
    </div>
  )
}

const tabBarStyle : CSSProperties = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  height: "90px",
  paddingBottom: "env(safe-area-inset-bottom)",
  background: "white",
  borderTop: "1px solid #ddd",
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
  zIndex: 100,
  cursor: "pointer"
}

const tabButton = {
  flex: 1,
  background: "none",
  border: "none",
  fontSize: "24px",
  color: "#999",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center"
}

const activeTab = {
  ...tabButton,
  fontSize: "25px",
  background: "#e0f2fe",
  borderTop: "3px solid #22c55e",
  color: "#22c55e"
}

const label = {
  fontSize: "10px"
}
