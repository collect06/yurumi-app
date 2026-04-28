"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

export default function Header() {
  const router = useRouter()

  return (
    <div style={headerStyle}>
      <div>ゆるみ家計簿</div>
      <Link href="/settings">
        ⚙️
      </Link>
    </div>
  )
}

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px"
}

const gearBtn = {
  fontSize: "20px",
  cursor: "pointer",
  background: "none",
  border: "none"
}
