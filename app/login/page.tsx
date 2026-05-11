"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const login = async () => {
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    router.push("/")
  }

  const signup = async () => {
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    alert("登録しました")
  }

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "80px auto",
        padding: 20
      }}
    >
      <h1>ログイン</h1>

      <input
        type="email"
        placeholder="メールアドレス"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={input}
      />

      <input
        type="password"
        placeholder="パスワード"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={input}
      />

      <button style={button} onClick={login} disabled={loading}>
        ログイン
      </button>

      <button
        style={{
          ...button,
          background: "#3b82f6"
        }}
        onClick={signup}
        disabled={loading}
      >
        新規登録
      </button>
    </div>
  )
}

const input = {
  width: "100%",
  padding: 10,
  marginTop: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
  boxSizing: "border-box" as const
}

const button = {
  width: "100%",
  marginTop: 10,
  padding: 10,
  border: "none",
  borderRadius: 8,
  background: "#22c55e",
  color: "white",
  cursor: "pointer"
}
