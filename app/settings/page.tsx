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
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState("")

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
      fetchCategories(userId)
    }
  
    init()
  }, [])

  const fetchCategories = async (userId: string) => {
    setLoading(true)
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })

    if (data) setCategories(data)
    setLoading(false)
  }

  const addCategory = async () => {
    if (!newCategory) return

    const { data: max } = await supabase
      .from("categories")
      .select("sort_order")
      .eq("user_id", userId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single()
    
    const nextOrder = (max?.sort_order ?? -1) + 1
    
    await supabase.from("categories").insert({
      name: newCategory,
      sort_order: nextOrder,
      is_active: true,
      user_id: userId
    })

    alert("追加しました")
    
    setNewCategory("")
    fetchCategories(userId)
  }

  const updateCategory = async (id: number) => {
    await supabase
      .from("categories")
      .update({ name: editName })
      .eq("id", id)
      .eq("user_id", userId)

    setEditingId(null)
    fetchCategories(userId)
  }

  const deleteCategory = async (id: number) => {
    if (!confirm("削除しますか？")) return

    const { error } = await supabase
      .from("categories")
      .update({ 
        is_active: false
      })
      .eq("id", id)
      .eq("user_id", userId)

      console.log(error)

      if (error) {
        alert(error.message)
        return
      }

        fetchCategories(userId)
      }

  const move = async (index: number, direction: number) => {
  const target = categories[index]
  const swap = categories[index + direction]

  if (!swap) return

  // 一時退避
  const tempOrder = 999999

  const result1 = await supabase
    .from("categories")
    .update({
      sort_order: tempOrder
    })
    .eq("id", target.id)
    .eq("user_id", userId)

  if (result1.error) {
    alert(result1.error.message)
    return
  }

  const result2 = await supabase
    .from("categories")
    .update({
      sort_order: target.sort_order
    })
    .eq("id", swap.id)
    .eq("user_id", userId)

  if (result2.error) {
    alert(result2.error.message)
    return
  }

  const result3 = await supabase
    .from("categories")
    .update({
      sort_order: swap.sort_order
    })
    .eq("id", target.id)
    .eq("user_id", userId)

  if (result3.error) {
    alert(result3.error.message)
    return
  }

  await fetchCategories(userId)
}

  const saveEdit = async (id: number) => {
    if (!editName) return
  
    const { error } = await supabase
      .from("categories")
      .update({ name: editName })
      .eq("id", id)
      .eq("user_id", userId)
  
    if (error) {
      console.error(error)
      alert("更新失敗")
      return
    }
  
    alert("更新しました")
  
    setEditingId(null)
    setEditName("")
    fetchCategories(userId)
  }

  if (loading) {
  return (
    <div style={loadingWrap}>
      <div style={loadingCard}>
        <div style={spinner}></div>
          <div style={loadingText}>
            読み込み中...
          </div>
        </div>
      </div>
    )
  }

  const logout = async () => {
    if (!confirm("ログアウトしますか？")) return
    await supabase.auth.signOut()
    router.push("/login")
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
        <h3 style={sectionTitle}>カテゴリ追加</h3>

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
        <h3 style={sectionTitle}>カテゴリ管理</h3>

        {categories.map((c, index) => (
          <div
            key={c.id}
            style={{
              marginBottom: editingId === c.id ? 12 : 2,
              padding: editingId === c.id ? 10 : 2,
              borderRadius: 10,
              background: editingId === c.id ? "#f0fdf4" : "transparent",
              transition: "0.2s",
              minHeight: 44,
              border: editingId === c.id ? "1px solid #bbf7d0" : "none"
            }}
          >

        {editingId === c.id ? (
          <>
            {/* 1段目 */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              minHeight: 36,
              gap: 8
            }}>
          
          <input
            style={{ ...input, flex: 1, marginRight: 10, marginTop: 0 }}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />

          <div style={{ display: "flex", gap: 6 }}>
            <button style={saveBtn} onClick={() => saveEdit(c.id)}>
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
        alignItems: "center",
        minHeight: 36,
        gap: 8
      }}>
        <span>{c.name}</span>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            style={editBtn}
            onClick={() => {
              setEditingId(c.id)
              setEditName(c.name)
              setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0)
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

      <button style={deleteBtn} onClick={logout}>
        ログアウト
      </button>
      
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
  padding: 8,
  borderRadius: 6,
  border: "1px solid #ccc",
  marginTop: 6
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
  padding: "8px 14px",
  fontSize: 14,
  borderRadius: 8,
  cursor: "pointer"
}

const editBtn = {
  background: "#3b82f6",
  color: "white",
  border: "none",
  padding: "8px 14px",
  fontSize: 14,
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

const saveBtn = {
  padding: "8px 14px",
  background: "#22c55e",
  color: "white",
  border: "none",
  fontSize: 14,
  borderRadius: 8,
  cursor: "pointer"
}

const sectionTitle = {
  fontSize: 20,
  fontWeight: "bold",
  marginBottom: 8
}

const loadingWrap = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#f9fafb"
}

const loadingCard = {
  background: "white",
  padding: "24px 32px",
  borderRadius: "16px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  gap: "16px"
}

const loadingText = {
  fontSize: "14px",
  color: "#666"
}

const spinner = {
  width: "36px",
  height: "36px",
  border: "4px solid #e5e7eb",
  borderTop: "4px solid #22c55e",
  borderRadius: "50%",
  animation: "spin 1s linear infinite"
}
