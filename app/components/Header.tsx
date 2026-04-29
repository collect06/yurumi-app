"use client"

import { CSSProperties } from "react"
import Link from "next/link"

export default function Header() {
  return (
    <div style={headerStyle}>
      <h2 style={{ margin: 0 }}>ゆるみ家計簿</h2>

      <Link href="/settings" style={gearBtn}>
        ⚙️
      </Link>
    </div>
  )
}

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 16px",
  background: "#4CAF50",
  color: "white",
  borderRadius: "0 0 12px 12px",
  position: "sticky",
  top: 0,
  zIndex: 10
}

const gearBtn: CSSProperties = {
  fontSize: "24px",
  textDecoration: "none",
  background: "white",
  color: "#4CAF50",
  borderRadius: "50%",
  width: "40px",
  height: "40px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
}