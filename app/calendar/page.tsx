"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function CalendarPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [month, setMonth] = useState(
    new Date().toISOString().slice(0, 7)
  )

  useEffect(() => {
    fetchData()
  }, [month])

  const fetchData = async () => {
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .eq("month", month)

    if (data) setExpenses(data)
  }

  // 日別合計
  const dailyTotals: { [key: string]: number } = {}

  expenses.forEach((e) => {
    //if (e.is_fixed) return
    if (!e.date) return

    if (!dailyTotals[e.date]) {
      dailyTotals[e.date] = 0
    }
    dailyTotals[e.date] += e.amount
  })

  const daysInMonth = new Date(
    Number(month.slice(0, 4)),
    Number(month.slice(5, 7)),
    0
  ).getDate()

  return (
    <div style={{ padding: "16px" }}>
      <h2>{month} カレンダー</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "4px"
        }}
      >
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = `${month}-${String(day).padStart(2, "0")}`

          return (
            <div
              key={day}
              style={{
                border: "1px solid #ccc",
                padding: "6px",
                minHeight: "60px"
              }}
            >
              <div style={{ fontSize: "12px" }}>{day}</div>
              <div style={{ color: "red", fontSize: "12px" }}>
                {dailyTotals[dateStr]
                  ? `${dailyTotals[dateStr]}円`
                  : ""}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}