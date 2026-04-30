"use client"
import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { CSSProperties } from "react"
import Header from "../components/Header"

export default function InputPage() {
  
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`

  const [month, setMonth] = useState(defaultMonth)
  const [amount, setAmount] = useState("")
  const [memo, setMemo] = useState("")
  const [budget, setBudget] = useState("")
  const [isWaste, setIsWaste] = useState(false)
  const [fixedName, setFixedName] = useState("")
  const [fixedAmount, setFixedAmount] = useState("")
  const [fixedCosts, setFixedCosts] = useState<any[]>([])

  const [categories, setCategories] = useState<any[]>([])
  // 変更点：category → categoryId
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  )

  // 予算取得
  useEffect(() => {
    const fetchAll = async () => {
      // 予算
      const { data: budgetData } = await supabase
        .from("budgets")
        .select("*")
        .eq("month", month)
        .single()

      if (budgetData) setBudget(String(budgetData.amount))
      else setBudget("")

      // カテゴリ
      const { data: catData } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })

      if (catData) {
        setCategories(catData)
        if (catData.length > 0) setCategoryId(catData[0].id)
      }

      // 固定費
      const { data: fixed } = await supabase
        .from("fixed_costs")
        .select("*")

      setFixedCosts(fixed || [])

      // 固定費をexpensesに反映
      for (const f of fixed || []) {
        // 月条件
        if (f.start_month > month) continue
        if (f.end_month && f.end_month < month) continue
        
        const { data: existing } = await supabase
          .from("expenses")
          .select("id")
          .eq("month", month)
          .eq("fixed_cost_id", f.id)

        if (!existing || existing.length === 0) {
          await supabase.from("expenses").insert({
            amount: f.amount,
            memo: f.name,
            month,
            is_waste: false,
            is_fixed: true,
            date: `${month}-01`,
            category_id: null,
            fixed_cost_id: f.id
          })
        }
      }
    }

    fetchAll()
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
    if (!amount || !categoryId) return

    const { error } = await supabase.from("expenses").insert([
      {
        amount: Number(amount),
        memo,
        category_id: categoryId,
        month,
        is_waste: isWaste,
        is_fixed: false,
        date
      },
    ])

    if (error) {
      console.error(error)
      alert(error.message)
      return
    }

    setAmount("")
    setMemo("")
    alert("支出を追加しました")
  }

  // 固定費自動追加
  const addFixedCost = async () => {
    await supabase.from("fixed_costs").insert([
      {
        name: fixedName,
        amount: Number(fixedAmount)
      }
    ])

    alert("固定費を追加しました")
    setFixedName("")
    setFixedAmount("")
    fetchFixedCosts()
  }

  // 固定費停止
  const stopFixedCost = async (id: number) => {
     if (!confirm("停止しますか？")) return
    await supabase
      .from("fixed_costs")
      .update({ end_month: month })
      .eq("id", id)

    alert("固定費を停止しました")
    fetchFixedCosts()
  }

  const fetchFixedCosts = async () => {
    const { data } = await supabase
      .from("fixed_costs")
      .select("*")
      .is("end_month", null)

    if (data) setFixedCosts(data)
  }

  return (
    <div>
      <Header />

    <div style={container}>

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

        <div style={field}>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="金額"
            style={input}
          />
        </div>

        <div style={field}>
          <select
            value={isWaste ? "true" : "false"}
            onChange={(e) => setIsWaste(e.target.value === "true")}
            style={input}
          >
            <option value="false">通常支出</option>
            <option value="true">無駄支出</option>
          </select>
        </div>

        <div style={field}>
          <select
            value={categoryId ?? ""}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            style={input}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div style={field}>
          <input
            style={inputStyle}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div style={field}>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="メモ"
            style={input}
          />
        </div>

        <button style={primaryButton} onClick={addExpense}>
          支出を追加
        </button>
      </div>

      <div style={cardStyle}>
        <h3>📌 固定費登録</h3>

        <input
          style={inputStyle}
          type="text"
          placeholder="名前（例：家賃）"
          value={fixedName}
          onChange={(e) => setFixedName(e.target.value)}
        />

        <input
          style={inputStyle}
          type="number"
          placeholder="金額"
          value={fixedAmount}
          onChange={(e) => setFixedAmount(e.target.value)}
        />

        <button style={primaryButton} onClick={addFixedCost}>
          固定費を追加
        </button>
      </div>

      <div style={cardStyle}>
        <h4>登録済み固定費</h4>

        {fixedCosts.map((f) => (
          <div
            key={f.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px"
            }}
          >
            <span>{f.name} {f.amount}円</span>

            <button
              style={deleteButtonStyle}
              onClick={() => stopFixedCost(f.id)}
            >
              停止
            </button>
          </div>
        ))}
      </div>

    </div>
    </div>
  )
}

/* ===== スタイル ===== */

const inputStyle : CSSProperties = {
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  marginBottom: "8px",
  width: "100%",
  appearance: "none",
  WebkitAppearance: "none"
}

const buttonStyle = {
  padding: "8px",
  borderRadius: "6px",
  border: "none",
  background: "#22c55e",
  color: "white",
  width: "100%",
  cursor: "pointer"
}

const container = {
  maxWidth: 500,
  margin: "0 auto",
  padding: 20,
  paddingBottom: "100px"
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

const cardStyle = {
  background: "white",
  padding: "16px",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  marginBottom: "16px"
}

const editButtonStyle = {
  background: "#3b82f6",
  color: "white",
  padding: "6px 12px",
  borderRadius: "8px",
  border: "none"
}

const deleteButtonStyle = {
  background: "#ef4444",
  color: "white",
  padding: "6px 12px",
  borderRadius: "8px",
  border: "none"
}

const field = {
  marginTop: 12
}