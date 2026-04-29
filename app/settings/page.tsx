"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const router = useRouter()

  const [categories, setCategories] = useState<any[]>([])
  const [newCategory, setNewCategory] = useState("")

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*")
    if (data) setCategories(data)
  }

  const addCategory = async () => {
    if (!newCategory) return

    await supabase.from("categories").insert({
      name: newCategory
    })

    setNewCategory("")
    fetchCategories()
  }

  const deleteCategory = async (id: string) => {
    await supabase.from("categories").delete().eq("id", id)
    fetchCategories()
  }

  return (
    <div style={container}>

      {/* 🔙 戻るボタン */}
      <button style={backBtn} onClick={() => router.back()}>
        ← 戻る
      </button>

      <h2>⚙️ 設定</h2>

      <div style={card}>
        <h3>カテゴリ管理</h3>

        <input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="カテゴリ名"
          style={input}
        />

        <button style={addBtn} onClick={addCategory}>
          ＋ 追加
        </button>
      </div>

      <div style={card}>
        {categories.map((c) => (
          <div key={c.id} style={row}>
            <span>{c.name}</span>

            <button
              style={deleteBtn}
              onClick={() => deleteCategory(c.id)}
            >
              削除
            </button>
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