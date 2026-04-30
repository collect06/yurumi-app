"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const router = useRouter()

  const [categories, setCategories] = useState<any[]>([])
  const [newCategory, setNewCategory] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .is("is_active", true)
      .order("sort_order", { ascending: true })

    if (data) setCategories(data)
  }

  const addCategory = async () => {
    if (!newCategory) return

    const { data: max } = await supabase
      .from("categories")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .single()
    
    const nextOrder = (max?.sort_order ?? -1) + 1
    
    await supabase.from("categories").insert({
      name: newCategory,
      sort_order: nextOrder,
      is_active: true
    })

    setNewCategory("")
    fetchCategories()
  }

  const updateCategory = async (id: number) => {
    await supabase
      .from("categories")
      .update({ name: editName })
      .eq("id", id)

    setEditingId(null)
    fetchCategories()
  }

  const deleteCategory = async (id: number) => {
    await supabase
      .from("categories")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)

    fetchCategories()
  }

  const move = async (index: number, direction: number) => {
    const target = categories[index]
    const swap = categories[index + direction]
    if (!swap) return

    await Promise.all([
      supabase.from("categories").update({
        sort_order: swap.sort_order
      }).eq("id", target.id),
    
      supabase.from("categories").update({
        sort_order: target.sort_order
      }).eq("id", swap.id)
    ])

    await fetchCategories()
  }

  const saveEdit = async (id: number) => {
    if (!editName) return
  
    const { error } = await supabase
      .from("categories")
      .update({ name: editName })
      .eq("id", id)
  
    if (error) {
      console.error(error)
      alert("更新失敗")
      return
    }
  
    alert("更新しました")
  
    setEditingId(null)
    setEditName("")
    fetchCategories()
  }

  return (
    <div style={container}>

      {/* 戻る */}
      <button style={backBtn} onClick={() => router.push("/")}>
        ← 戻る
      </button>

      <h2>⚙️ 設定</h2>

      {/* カテゴリ追加 */}
      <div style={card}>
        <h3>カテゴリ追加</h3>

        <input
          style={input}
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="カテゴリ名"
        />

        <button style={addBtn} onClick={addCategory}>
          追加
        </button>
      </div>

      {/* カテゴリ一覧 */}
      <div style={card}>
        <h3>カテゴリ管理</h3>

        {categories.map((c, index) => (
  <div
    key={c.id}
    style={{
      marginBottom: 16,
      padding: 12,
      borderRadius: 10,
      background: editingId === c.id ? "#f0fdf4" : "transparent",
      transition: "0.2s",
      minHeight: 60,
      border: editingId === c.id ? "1px solid #bbf7d0" : "none"
    }}
  >

    {editingId === c.id ? (
      <>
        {/* 1段目 */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          
          <input
            style={{ ...input, flex: 1, marginRight: 10, marginTop: 0 }}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />

          <div style={{ display: "flex", gap: 6 }}>
            <button style={smallBtn} onClick={() => saveEdit(c.id)}>
              保存
            </button>

            <button style={deleteBtn} onClick={() => deleteCategory(c.id)}>
              削除
            </button>
          </div>
        </div>

        {/* 2段目（矢印） */}
        <div style={{
          display: "flex",
          gap: 10,
          marginTop: 6,
          paddingLeft: 4
        }}>
          <button style={arrowBtn} onClick={() => move(index, -1)}>
            ↑
          </button>
          <button style={arrowBtn} onClick={() => move(index, 1)}>
            ↓
          </button>
        </div>
      </>
    ) : (
      /* 通常表示 */
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <span>{c.name}</span>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            style={editBtn}
            onClick={() => {
              setEditingId(c.id)
              setEditName(c.name)
            }}
          >
            編集
          </button>

          <button
            style={deleteBtn}
            onClick={() => deleteCategory(c.id)}
          >
            削除
          </button>
        </div>
      </div>
    )}
  </div>
))}
      </div>
    </div>
  )
}

/* ===== スタイル ===== */

const container = {
  padding: 20,
  maxWidth: 500,
  margin: "0 auto"
}

const backBtn = {
  marginBottom: 10,
  background: "none",
  border: "none",
  fontSize: "14px",
  color: "#4CAF50",
  cursor: "pointer"
}

const card = {
  background: "white",
  padding: 16,
  borderRadius: 12,
  marginTop: 16,
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
}

const input = {
  width: "100%",
  padding: 10,
  borderRadius: 6,
  border: "1px solid #ccc",
  marginTop: 10
}

const addBtn = {
  width: "100%",
  marginTop: 10,
  padding: 10,
  background: "#4CAF50",
  color: "white",
  border: "none",
  borderRadius: 6
}

const row = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 10
}

const deleteBtn = {
  background: "#ef4444",
  color: "white",
  border: "none",
  padding: "6px 10px",
  borderRadius: 6
}

const editBtn = {
  background: "#3b82f6",
  color: "white",
  border: "none",
  padding: "6px 12px",
  borderRadius: 8,
  cursor: "pointer"
}

const arrowBtn = {
  width: 40,
  height: 40,
  borderRadius: 10,
  border: "1px solid #ddd",
  background: "#fafafa",
  fontSize: 18,
  cursor: "pointer",
  transition: "0.2s"
}

const arrowWrap = {
  display: "flex",
  gap: 6,
  marginTop: 8
}

const smallBtn = {
  padding: "8px 12px",
  background: "#4CAF50",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer"
}
