"use client"
import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts"
import Header from "../components/Header"
import { CSSProperties } from "react"

const COLORS = [
  "#4CAF50",
  "#2196F3",
  "#FF9800",
  "#E91E63",
  "#9C27B0",
  "#14b8a6",
  "#f59e0b",
  "#6366f1",
  "#ec4899",
  "#84cc16"
]

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
  
  const [filterCategoryId, setFilterCategoryId] = useState<number | "all">("all")
  
  const [showWasteOnly, setShowWasteOnly] = useState(false)
  const [sortOrder, setSortOrder] = useState("desc")

  const [categories, setCategories] = useState<any[]>([])

  const targetExpenses = expenses.filter(e => !e.is_fixed)

  const [editDate, setEditDate] = useState("")

  useEffect(() => {
    const init = async () => {
      await insertFixedCosts()
      await fetchData()
    }

    init()
    fetchCategories()
  }, [month])

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*")
    if (data) setCategories(data)
  }

  const fetchData = async () => {
    const { data } = await supabase
      .from("expenses")
      .select(`*,category:categories(id,name)`)
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

  // フィルター使用カテゴリ抽出
  const usedCategories = Array.from(
    new Map(
      expenses
        .filter(e => e.category_id && e.category)
        .map(e => [e.category_id, e.category])
    ).values()
  )
  
  const normalExpenses = expenses.filter(e => !e.is_fixed)

  const updateExpense = async (id: number) => {
    await supabase
      .from("expenses")
      .update({
        amount: Number(editAmount),
        memo: editMemo,
        date: editDate,
        month: editDate.slice(0, 7)
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
  const wasteTotal = targetExpenses
    .filter((e) => e.is_waste)
    .reduce((sum, e) => sum + e.amount, 0)
  const remaining = budget - wasteTotal

  const grouped =
    Object.values(
      expenses.reduce((acc: any, cur) => {
        const name = cur.category?.name ?? "固定費"
  
        if (!acc[name]) {
          acc[name] = {
            name,
            value: 0
          }
        }
  
        acc[name].value += Number(cur.amount || 0)
  
        return acc
      }, {})
    ) || []
  
  const insertFixedCosts = async () => {

  // ① fixed_costs取得
  const { data: fixed } = await supabase
    .from("fixed_costs")
    .select("*")

  // ② 今月有効なfixed_cost_id一覧
  const validIds = (fixed || [])
    .filter(f => {
      if (month < f.start_month) return false
      if (f.end_month && month >= f.end_month) return false
      return true
    })
    .map(f => f.id)

  // ③ 今月の固定費expenses取得
  const { data: currentFixedExpenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("month", month)
    .eq("is_fixed", true)

  // ④ 不要固定費削除
  for (const e of currentFixedExpenses || []) {
    if (!validIds.includes(e.fixed_cost_id)) {
      await supabase
        .from("expenses")
        .delete()
        .eq("id", e.id)
    }
  }

  // ⑤ 必要固定費をupsert
  for (const f of fixed || []) {

    // 対象月チェック
    if (month < f.start_month) continue
    if (f.end_month && month >= f.end_month) continue

    await supabase.from("expenses").upsert({
      amount: f.amount,
      memo: f.name,
      month,
      is_waste: false,
      is_fixed: true,
      fixed_cost_id: f.id,
      category_id: null,
      date: `${month}-01`
    }, {
      onConflict: "month,fixed_cost_id"
    })
  }
}
  const filteredExpenses = targetExpenses
    .filter((e) => {
      if (showWasteOnly && !e.is_waste) return false
  
      if (filterCategoryId !== "all" && e.category_id !== filterCategoryId) {
        return false
      }
  
      return true
    })
    .sort((a, b) =>
      sortOrder === "desc"
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime()
    )

  return (
    <div>
      <Header />
    <div style={container}>
     
      <div style={card}>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={input}
        />

        <div style={{ marginTop: 15, textAlign: "left" }}>
          <p>総支出: {total}円</p>
          <p>ゆるみ予算: <strong>{budget}円</strong></p>
          <p>ゆるみ支出: <strong>{wasteTotal}</strong>円</p>
          <p style={{ color: remaining < 0 ? "red" : "green" }}>
            ゆるみ支出残り: <strong>{remaining}円</strong>
          </p>
        </div>
      </div>

      <div style={{
        ...card,
        paddingBottom: 30
      }}>
        <h3>カテゴリ別グラフ</h3>
      
        <div style={{ display: "flex", justifyContent: "center" }}>
          <PieChart width={340} height={340}>
      
            <Pie
              data={grouped}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={105}
              paddingAngle={2}
            >
              {grouped.map((_: any, index: number) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
      
            {/* 中央テキスト */}
            <text
              x="50%"
              y="44%"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontSize: 12,
                fill: "#666"
              }}
            >
                総支出
              </text>
      
              <text
                x="50%"
                y="51%"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fontSize: 22,
                  fontWeight: "bold",
                  fill: "#111"
                }}
              >
                {total}円
              </text>
      
            <Tooltip
              formatter={(value: any, name: any) =>
                [`${value}円`, name]
              }
            />
      
            <Legend
              verticalAlign="bottom"
              formatter={(value, entry: any, index) => {
                const item = grouped[index] as {
                  name: string
                  value: number
                }
            
                return `${item.name} (${item.value}円)`
              }}
            />
      
          </PieChart>
        </div>
      
        {/* データ0件時 */}
        {grouped.length === 0 && (
          <div
            style={{
              textAlign: "center",
              marginTop: "-120px",
              color: "#888",
              fontSize: "14px"
            }}
          >
            データなし
          </div>
        )}
      </div>

      <select
        value={filterCategoryId}
        onChange={(e) =>
          setFilterCategoryId(
            e.target.value === "all" ? "all" : Number(e.target.value)
          )
        }
      >
        <option value="all">すべて</option>
        {usedCategories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
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

        {filteredExpenses.map((e) => (
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
              <div>{e.amount}円 [{e.category?.name ?? "固定費"}]</div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                {new Date(e.date).toISOString().split("T")[0]}：{e.memo}
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
                  setEditDate(e.date)
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
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
              
              <input
                style={input}
                type="text"
                value={editMemo}
                onChange={(ev) => setEditMemo(ev.target.value)}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
                <button
                  style={buttonStyle}
                  onClick={() => updateExpense(e.id)}
                >
                  保存
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      </div>
    </div>
    </div>
  )
}

/* スタイル */

const container = {
  maxWidth: 500,
  margin: "0 auto",
  padding: 20,
  paddingTop: 90,
}

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
}

const card: CSSProperties = {
  background: "white",
  padding: 20,
  marginTop: 20,
  borderRadius: 10,
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
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
