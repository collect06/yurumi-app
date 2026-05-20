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
  const [fixedCosts, setFixedCosts] = useState<any[]>([])
  const [budget, setBudget] = useState(0)
  const [loading, setLoading] = useState(true)

  const [month, setMonth] = useState(
    new Date().toISOString().slice(0, 7)
  )

  const [userId, setUserId] = useState("")
  
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser()
  
      if (!user) {
        router.push("/login")
        return
      }
  
      const userId = user.id
  
      setUserId(userId)

      await fetchAll(userId, month)
  
      setLoading(false)
    }
  
    init()
  }, [])

  useEffect(() => {
    if (!userId) return

    fetchAll(userId, month)
  }, [month])

  const fetchAll = async (
    userId: string,
    month: string
  ) => {
    // expenses
    const { data: expensesData } = await supabase
      .from("expenses")
      .select(`
        *,
        category:categories(id,name)
      `)
      .eq("user_id", userId)
      .eq("month", month)

    if (expensesData) {
      setExpenses(expensesData)
    }

    // categories
    const { data: categoriesData } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })

    if (categoriesData) {
      setCategories(categoriesData)
    }

    // fixed_costs
    const { data: fixedCostsData } = await supabase
      .from("fixed_costs")
      .select("*")
      .eq("user_id", userId)

    if (fixedCostsData) {
      setFixedCosts(fixedCostsData)
    }

    // budget
    const { data: budgetData } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", userId)
      .eq("month", month)
      .single()

    if (budgetData) {
      setBudget(budgetData.amount)
    } else {
      setBudget(0)
    }
  }

  if (loading) {
    return <div>読み込み中...</div>
  }
  

  return (
    <div style={{ paddingBottom: "100px"}}>
      {/* メイン表示 */}
      <div style={{ display: tab === "input" ? "block" : "none" }}>
        <InputPage
          expenses={expenses}
          categories={categories}
          fixedCosts={fixedCosts}
          budget={budget}
          fetchAll={() => fetchAll(userId, month)}
          userId={userId}
          month={month}
          setMonth={setMonth}
        />
      </div>

      <div style={{ display: tab === "view" ? "block" : "none" }}>
        <ViewPage
          expenses={expenses}
          categories={categories}
          fixedCosts={fixedCosts}
          budget={budget}
          fetchAll={() => fetchAll(userId, month)}
          userId={userId}
          month={month}
          setMonth={setMonth}
        />
      </div>

      <div style={{ display: tab === "calendar" ? "block" : "none" }}>
        <CalendarPage
          expenses={expenses}
          categories={categories}
          fixedCosts={fixedCosts}
          budget={budget}
          fetchAll={() => fetchAll(userId, month)}
          userId={userId}
          month={month}
          setMonth={setMonth}
        />
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
