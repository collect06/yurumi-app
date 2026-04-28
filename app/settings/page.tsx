"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function SettingsPage() {
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
    alert("カテゴリ追加")
  }

  const deleteCategory = async (id: string) => {
    await supabase.from("categories").delete().eq("id", id)
    fetchCategories()
    alert("削除しました")
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>⚙️ 設定</h2>

      <h3>カテゴリ管理</h3>

      <input
        value={newCategory}
        onChange={(e) => setNewCategory(e.target.value)}
        placeholder="カテゴリ名"
        style={{ width: "100%", padding: 8 }}
      />

      <button onClick={addCategory}>
        追加
      </button>

      <div style={{ marginTop: 20 }}>
        {categories.map((c) => (
          <div key={c.id} style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10
          }}>
            <span>{c.name}</span>

            <button onClick={() => deleteCategory(c.id)}>
              削除
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}