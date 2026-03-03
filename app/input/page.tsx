"use client"
import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import Link from "next/link"

export default function InputPage() {
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`

  const [month, setMonth] = useState(defaultMonth)
  const [amount, setAmount] = useState("")
  const [memo, setMemo] = useState("")
  const [category, setCategory] = useState("コンビニ")
  const [budget, setBudget] = useState("")

  const categories = ["コンビニ", "外食", "デート", "衝動買い", "その他"]

  // 予算取得
  useEffect(() => {
    const fetchBudget = async () => {
      const { data } = await supabase
        .from("budgets")
        .select("*")
        .eq("month", month)
        .single()

      if (data) setBudget(String(data.amount))
      else setBudget("")
    }

    fetchBudget()
  }, [month])

  // 予算保存
  const saveBudget = async () => {
    await supabase
      .from("budgets")
      .upsert({ month, amount: Number(budget) }, { onConflict: "month" })

    alert("予算を保存しました")
  }

  // 支出追加
  const addExpense = async () => {
    if (!amount) return

    await supabase.from("expenses").insert([
      {
        amount: Number(amount),
        memo,
        category,
        month,
      },
    ])

    setAmount("")
    setMemo("")
    alert("支出を追加しました")
  }

  return (
    <div style={container}>
      <header style={header}>
        <h2>支出入力</h2>
        <Link href="/view">閲覧へ</Link>
      </header>

      {/* 月選択 */}
      <div style={card}>
        <h3>📅 月選択</h3>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={input}
        />
      </div>

      {/* 予算設定 */}
      <div style={card}>
        <h3>💰 今月の予算</h3>
        <input
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="例：30000"
          style={input}
        />
        <button style={primaryButton} onClick={saveBudget}>
          予算を保存
        </button>
      </div>

      {/* 支出入力 */}
      <div style={card}>
        <h3>✍ 支出入力</h3>

        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="金額"
          style={input}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={input}
        >
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="メモ"
          style={input}
        />

        <button style={primaryButton} onClick={addExpense}>
          支出を追加
        </button>
      </div>
    </div>
  )
}

/* ===== スタイル ===== */

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
  padding: 10,
  marginTop: 10,
  borderRadius: 6,
  border: "1px solid #ccc",
  fontSize: 14,
}

const primaryButton = {
  width: "100%",
  marginTop: 15,
  padding: 10,
  borderRadius: 6,
  border: "none",
  backgroundColor: "#4CAF50",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
}