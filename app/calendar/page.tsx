"use client"
//
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Header from "../components/Header"

export default function CalendarPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [month, setMonth] = useState(
    new Date().toISOString().slice(0, 7)
  )
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editAmount, setEditAmount] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editMemo, setEditMemo] = useState("")
  
  const [fade, setFade] = useState(true)
  const [direction, setDirection] = useState(0)

  const [budget, setBudget] = useState(0)

  useEffect(() => {
    fetchData()
  }, [month])

  const fetchData = async () => {
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .eq("month", month)

    if (data) setExpenses(data)
    
    const { data: budgetData } = await supabase
      .from("budgets")
      .select("*")
      .eq("month", month)
      .single()

    if (budgetData) {
      setBudget(budgetData.amount)
    } else {
      setBudget(0)
    }
  }

  // ===== 月移動 =====
  const changeMonth = (diff: number) => {
    setDirection(diff)
    setFade(false)

    setTimeout(() => {
      const d = new Date(month + "-01")
      d.setMonth(d.getMonth() + diff)
      setMonth(d.toISOString().slice(0, 7))
      setSelectedDate(null)
      setFade(true)
    }, 150)
  }

  // ===== 日別合計 =====
  const dailyTotals: { [key: string]: number } = {}

  expenses.forEach((e) => {
    if (e.is_fixed) return
    if (!e.date) return

    if (!dailyTotals[e.date]) dailyTotals[e.date] = 0
    dailyTotals[e.date] += e.amount
  })

  const year = Number(month.slice(0, 4))
  const monthNum = Number(month.slice(5, 7))

  const firstDay = new Date(year, monthNum - 1, 1).getDay()
  const daysInMonth = new Date(year, monthNum, 0).getDate()
  const today = new Date().toISOString().slice(0, 10)

  // ===== 週配列生成（ここが最重要） =====
  const weeks: (number | null)[][] = []
  let week: (number | null)[] = []

  for (let i = 0; i < firstDay; i++) {
    week.push(null)
  }

  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d)

    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }

  if (week.length > 0) {
    while (week.length < 7) {
      week.push(null)
    }
    weeks.push(week)
  }

  const selectedExpenses = expenses.filter(
    (e) => e.date === selectedDate && !e.is_fixed
  )

  const deleteExpense = async (id: number) => {
     if (!confirm("削除しますか？")) return
    await supabase.from("expenses").delete().eq("id", id)
    fetchData()
  }

  const updateExpense = async (id: number) => {
    await supabase
      .from("expenses")
      .update({
        amount: Number(editAmount),
        date: editDate,
        memo: editMemo,
        month: editDate.slice(0, 7)
      })
      .eq("id", id)

    setEditingId(null)
    fetchData()
  }

  // 月合計
  const wasteTotal = expenses.reduce((sum, e) => {
    if (e.is_fixed) return sum
    if (!e.is_waste) return sum
    return sum + e.amount
  }, 0)

  return (
    <div>
      <Header />
    <div style={{ padding: "16px", paddingBottom: "100px" }}>
      
      {/* ===== 月ヘッダー ===== */}
      <div style={monthHeader}>

        <button onClick={() => changeMonth(-1)}>←</button>

        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={monthInput}
        />

        <button onClick={() => changeMonth(1)}>→</button>
      </div>

      <div style={budgetBox}>
          <div style={budgetText}>
            {wasteTotal} / {budget}円
          </div>

          <div style={budgetBarBg}>
            <div
              style={{
                ...budgetBar,
                width: `${budget ? Math.min((wasteTotal / budget) * 100, 100) : 0}%`,
                background:
                  wasteTotal > budget ? "#ef4444" : "#22c55e"
              }}
            />
          </div>
        </div>

      {/* ===== 曜日 ===== */}
      <div style={weekHeader}>
        {["日", "月", "火", "水", "木", "金", "土"].map((d, i) => (
          <div
            key={d}
            style={{
              ...weekDay,
              color:
                i === 0 ? "#ef4444" : i === 6 ? "#3b82f6" : "#666"
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* ===== カレンダー ===== */}
      <div
        style={{
          opacity: fade ? 1 : 0,
          transform: fade
            ? "translateX(0)"
            : direction === 1
            ? "translateX(-30px)"
            : "translateX(30px)",
          transition: "all 0.2s ease"
        }}
      >
        {weeks.map((week, wIndex) => (
          <div key={wIndex} style={weekRow}>
            {week.map((day, dIndex) => {
              if (!day) return <div key={dIndex} style={emptyCell} />

              const dateStr = `${month}-${String(day).padStart(2, "0")}`
              const isToday = dateStr === today

              return (
                <div
                  key={dIndex}
                  style={{
                    ...cell,
                    background:
                      selectedDate === dateStr
                        ? "#bbf7d0"
                        : isToday
                        ? "#e0f2fe"
                        : "white",
                    transform:
                      selectedDate === dateStr ? "scale(0.95)" : "scale(1)",
                    transition: "0.15s"
                  }}
                  onClick={() => setSelectedDate(dateStr)}
                >
                  <div
                    style={{
                      ...dayNumber,
                      color:
                        dIndex === 0
                          ? "#ef4444"
                          : dIndex === 6
                          ? "#3b82f6"
                          : "black"
                    }}
                  >
                    {day}
                  </div>

                  <div style={amountText}>
                    {dailyTotals[dateStr]
                      ? `${dailyTotals[dateStr]}円`
                      : ""}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* ===== 詳細 ===== */}
      {selectedDate && (
        <div style={detailBox}>
          <h3>{selectedDate} の支出</h3>

          {selectedExpenses.length === 0 && <p>なし</p>}

          {selectedExpenses.map((e) => (
            <div key={e.id} style={expenseRow}>
              <div>
                <div>{e.amount}円</div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    marginTop: "2px"
                  }}
                >
                  {new Date(e.date).toISOString().split("T")[0]}
                  {e.memo ? `：${e.memo}` : ""}
                </div>
              </div>

              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  style={editBtn}
                  onClick={() => {
                    setEditingId(e.id)
                    setEditAmount(String(e.amount))
                    setEditDate(e.date ?? "")
                    setEditMemo(e.memo || "")
                  }}
                >
                  編集
                </button>

                <button
                  style={deleteBtn}
                  onClick={() => deleteExpense(e.id)}
                >
                  削除
                </button>
              </div>

              {editingId === e.id && (
                <div style={{ marginTop: "8px" }}>
                  <input
                    style={input}
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                  />
                  <input
                    style={{
                      ...input,
                      appearance: "none"
                    }}
                    type="date"
                    value={editDate}
                    onChange={(ev) => setEditDate(ev.target.value)}
                  />
                  <input
                    style={input}
                    type="text"
                    value={editMemo}
                    placeholder="メモ"
                    onChange={(e) => setEditMemo(e.target.value)}
                  />
                  <button
                    style={saveBtn}
                    onClick={() => updateExpense(e.id)}
                  >
                    保存
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
  )
}

/* ===== スタイル ===== */

const monthHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px"
}

const monthInput = {
  border: "none",
  fontSize: "16px",
  textAlign: "center" as const
}

const weekHeader = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)"
}

const weekDay = {
  textAlign: "center" as const,
  fontSize: "12px"
}

const weekRow = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: "4px",
  marginBottom: "4px"
}

const emptyCell = {
  minHeight: "70px"
}

const cell = {
  minHeight: "70px",
  borderRadius: "10px",
  padding: "6px",
  border: "1px solid #ddd",
  cursor: "pointer"
}

const dayNumber = {
  fontSize: "12px",
  fontWeight: "bold"
}

const amountText = {
  fontSize: "12px",
  marginTop: "4px"
}

const detailBox = {
  marginTop: "20px",
  background: "white",
  padding: "12px",
  borderRadius: "10px"
}

const expenseRow = {
  borderBottom: "1px solid #eee",
  padding: "8px 0"
}

const editBtn = {
  background: "#3b82f6",
  color: "white",
  border: "none",
  padding: "4px 8px",
  borderRadius: "6px"
}

const deleteBtn = {
  background: "#ef4444",
  color: "white",
  border: "none",
  padding: "4px 8px",
  borderRadius: "6px"
}

const saveBtn = {
  marginTop: "6px",
  background: "#22c55e",
  color: "white",
  border: "none",
  padding: "6px",
  borderRadius: "6px"
}

const input = {
  width: "100%",
  marginTop: "4px",
  padding: "6px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  boxSizing: "border-box" as const,
  fontSize: "16px",
  background: "white"
}

const budgetBox = {
  marginTop: "10px",
  marginBottom: "12px"
}

const budgetText = {
  fontSize: "12px",
  marginBottom: "4px"
}

const budgetBarBg = {
  width: "100%",
  height: "10px",
  background: "#eee",
  borderRadius: "6px",
  overflow: "hidden"
}

const budgetBar = {
  height: "100%",
  background: "#22c55e",
  transition: "width 0.3s ease"
}
