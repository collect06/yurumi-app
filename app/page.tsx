"use client"

import { useState } from "react"
import InputPage from "./input/page"
import ViewPage from "./view/page"
import CalendarPage from "./calendar/page"
import { CSSProperties } from "react"

export default function Home() {
  const [tab, setTab] = useState("input")

  return (
    <div style={{ paddingBottom: "100px"}}>
      {/* メイン表示 */}
      {tab === "input" && <InputPage />}
      {tab === "view" && <ViewPage />}
      {tab === "calendar" && <CalendarPage />}

      {/* 下タブ */}
      <div style={tabBarStyle}>
        <button
          style={tab === "input" ? activeTab : tabButton}
          onClick={() => setTab("input")}
        >
          ✏️
          <div style={label}>入力</div>
        </button>

        <button
          style={tab === "view" ? activeTab : tabButton}
          onClick={() => setTab("view")}
        >
          📋
          <div style={label}>閲覧</div>
        </button>

        <button
          style={tab === "calendar" ? activeTab : tabButton}
          onClick={() => setTab("calendar")}
        >
          📅
          <div style={label}>カレンダー</div>
        </button>
        
      </div>
    </div>
  )
}

const tabBarStyle : CSSProperties = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  height: "100px",
  paddingBottom: "env(safe-area-inset-bottom)",
  background: "white",
  borderTop: "1px solid #ddd",
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
  zIndex: 100,
  cursor: "pointer"
}

const tabButton = {
  flex: 1,
  background: "none",
  border: "none",
  fontSize: "22px",
  color: "#999",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center"
}

const activeTab = {
  ...tabButton,
  color: "#22c55e"
}

const label = {
  fontSize: "10px"
}
