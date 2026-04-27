"use client"
import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts"
import Link from "next/link"

const COLORS = ["#4CAF50", "#2196F3", "#FF9800", "#E91E63", "#9C27B0"]

export default function ViewPage() {
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`

  const [month, setMonth] = useState(defaultMonth)
  const [expenses, setExpenses] = useState<any[]>([])
  const [budget, setBudget] = useState(0)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editAmount, setEditAmount] = useState("")
  const [editMemo, setEditMemo] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [showWasteOnly, setShowWasteOnly] = useState(false)
  const [sortOrder, setSortOrder] = useState("desc")

  useEffect(() => {
    const init = async () => {
      await insertFixedCosts()
      await fetchData()
    }

    init()
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

    if (budgetData) setBudget(budgetData.amount)
    else setBudget(0)
  }

  const normalExpenses = expenses.filter(e => !e.is_fixed)
  const fixedExpenses = expenses.filter(e => e.is_fixed)

  const updateExpense = async (id: number) => {
    await supabase
      .from("expenses")
      .update({
        amount: Number(editAmount),
        memo: editMemo
      })
      .eq("id", id)

    setEditingId(null)
    fetchData()
  }

  // ✅ 削除機能
  const deleteExpense = async (id: number) => {
    if (!confirm("削除しますか？")) return

    await supabase.from("expenses").delete().eq("id", id)

    fetchData()
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)
  const wasteTotal = expenses
    .filter((e) => e.is_waste)
    .reduce((sum, e) => sum + e.amount, 0)
  const remaining = budget - wasteTotal

  const grouped = Object.values(
    expenses.reduce((acc: any, cur) => {
      if (!acc[cur.category])
        acc[cur.category] = { name: cur.category, value: 0 }
      acc[cur.category].value += cur.amount
      return acc
    }, {})
  )

  const insertFixedCosts = async () => {
    const { data: fixed } = await supabase.from("fixed_costs").select("*")

    for (const f of fixed || []) {
      const { data: existing } = await supabase
        .from("expenses")
        .select("id")
        .eq("month", month)
        .eq("memo", f.name)

      if (!existing || existing.length === 0) {
        await supabase.from("expenses").insert({
          amount: f.amount,
          category: f.category,
          memo: f.name,
          month,
          is_waste: false
        })
      }
    }
  }

  const filteredExpenses = expenses
    .filter((e) => {
      if (showWasteOnly && !e.is_waste) return false
      if (filterCategory !== "all" && e.category !== filterCategory) return false
      return true
    })
    .sort((a, b) => {
      return sortOrder === "desc" ? b.id - a.id : a.id - b.id
    })

  return (
    <div style={container}>
      <header style={header}>
        <h2>閲覧</h2>
        <Link href="/input">入力へ</Link>
      </header>

      <div style={card}>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={input}
        />

        <div style={{ marginTop: 15 }}>
          <p>無駄予算: <strong>{budget}円</strong></p>
          <p>総支出: {total}円</p>
          <p>無駄支出: <strong>{wasteTotal}</strong>円</p>
          <p style={{ color: remaining < 0 ? "red" : "green" }}>
            無駄支出残り: <strong>{remaining}円</strong>
          </p>
        </div>
      </div>

      <div style={card}>
        <h3>カテゴリ別グラフ</h3>
        <PieChart width={350} height={300}>
          <Pie
            data={grouped}
            dataKey="value"
            nameKey="name"
            outerRadius={100}
            label
          >
            {grouped.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </div>

      <h3>固定費</h3>

      {fixedExpenses.map((e) => (
        <div
          key={e.id}
          style={{
            borderBottom: "1px solid #eee",
            padding: "10px 0"
          }}
        >
          <div>{e.amount}円 [{e.category}]</div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {e.memo}
          </div>
        </div>
      ))}

      <select onChange={(e) => setFilterCategory(e.target.value)}>
        <option value="all">すべて</option>
        <option value="コンビニ">コンビニ</option>
        <option value="外食">外食</option>
        <option value="たばこ">たばこ</option>
        <option value="固定費">固定費</option>
      </select>

      <label>
        <input
          type="checkbox"
          checked={showWasteOnly}
          onChange={(e) => setShowWasteOnly(e.target.checked)}
        />
        無駄支出のみ
      </label>

      <select onChange={(e) => setSortOrder(e.target.value)}>
        <option value="desc">新しい順</option>
        <option value="asc">古い順</option>
      </select>

      <div style={card}>
        <h3>支出一覧</h3>

        {normalExpenses.map((e) => (
          <div
            key={e.id}
            style={{
              borderBottom: "1px solid #eee",
              padding: "10px 0"
            }}
          >
            {/* 上段：支出情報＋ボタン */}
            <div
              style={{
                display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}
    >
      {/* 左：支出情報 */}
      <div>
        <div>{e.amount}円 [{e.category}]</div>
        <div style={{ fontSize: "12px", color: "#666" }}>
          {e.memo}
        </div>
      </div>

      {/* 右：ボタン */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          style={editButton}
          onClick={() => {
            setEditingId(e.id)
            setEditAmount(String(e.amount))
            setEditMemo(e.memo || "")
          }}
        >
          編集
        </button>

        <button
          style={deleteButton}
          onClick={() => deleteExpense(e.id)}
        >
          削除
        </button>
      </div>
    </div>

    {/* 下段：編集フォーム */}
    {editingId === e.id && (
      <div style={{ marginTop: "8px" }}>
        <input
          style={input}
          type="number"
          value={editAmount}
          onChange={(ev) => setEditAmount(ev.target.value)}
        />

        <input
          style={input}
          type="text"
          value={editMemo}
          onChange={(ev) => setEditMemo(ev.target.value)}
        />

        <button
          style={buttonStyle}
          onClick={() => updateExpense(e.id)}
        >
          保存
        </button>
      </div>
    )}
  </div>
))}
      </div>
    </div>
  )
}

/* スタイル */

const container = {
  maxWidth: 500,
  margin: "0 auto",
  padding: 20,
}

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
}

const card = {
  background: "white",
  padding: 20,
  marginTop: 20,
  borderRadius: 10,
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
}

const input = {
  width: "100%",
  padding: 8,
  borderRadius: 5,
  border: "1px solid #ccc",
}

const listItem = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid #eee",
  padding: "10px 0",
}

const editButton = {
  backgroundColor: "#3b82f6",
  color: "white",
  border: "none",
  borderRadius: 5,
  padding: "5px 10px",
  cursor: "pointer",
}

const deleteButton = {
  backgroundColor: "#f44336",
  color: "white",
  border: "none",
  borderRadius: 5,
  padding: "5px 10px",
  cursor: "pointer",
}

const buttonStyle = {
  background: "#22c55e",
  color: "white",
  padding: "6px 10px",
  borderRadius: "6px",
  border: "none"
}