"use strict";
import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { HistoryCalendar } from "./components/HistoryCalendar";
import { HistoryNotes } from "./components/HistoryNotes";
import { RecordsView } from "./RecordsView";
import { Icons } from "../../components/icons/Icons";
import { triggerHaptic } from "../../core/utils";
import { useStore } from "../../store/useStore";
import { STORAGE_KEYS } from "../../core/constants";
export const HistoryHubView = ({ onStartSession }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const reindexDashboard = useStore((s) => s.reindexDashboard);
  const getTabFromURL = () => {
    const params = new URLSearchParams(location.search);
    return params.get("tab") || "calendar";
  };
  const initialTab = getTabFromURL();
  const [activeTab, setActiveTab] = useState(initialTab);
  useEffect(() => {
    const tab = getTabFromURL();
    if (tab && ["calendar", "records", "notes"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);
  useEffect(() => {
    if (activeTab === "records") {
      localStorage.setItem(STORAGE_KEYS.LAST_SEEN_PR, Date.now().toString());
      reindexDashboard();
    }
  }, [activeTab, reindexDashboard]);
  const handleTabChange = (tab) => {
    triggerHaptic("click");
    setActiveTab(tab);
    navigate(`?tab=${tab}`, { replace: true });
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-[calc(100vh-6rem)] animate-zoom-in pt-2", children: [
    /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-4 mb-4 flex-shrink-0", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center px-1", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black italic uppercase text-foreground", children: activeTab === "calendar" ? "Journal" : activeTab === "records" ? "Records" : "Carnet" }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface2/50 p-1 rounded-[1.2rem] border border-white/5 flex gap-1", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleTabChange("calendar"),
            className: `w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${activeTab === "calendar" ? "bg-primary text-black shadow-lg" : "text-secondary hover:text-foreground"}`,
            children: /* @__PURE__ */ jsx(Icons.Calendar, { size: 20 })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleTabChange("records"),
            className: `w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${activeTab === "records" ? "bg-primary text-black shadow-lg" : "text-secondary hover:text-foreground"}`,
            children: /* @__PURE__ */ jsx(Icons.Records, { size: 20 })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleTabChange("notes"),
            className: `w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${activeTab === "notes" ? "bg-primary text-black shadow-lg" : "text-secondary hover:text-foreground"}`,
            children: /* @__PURE__ */ jsx(Icons.Note, { size: 20 })
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-h-0 relative", children: [
      activeTab === "calendar" && /* @__PURE__ */ jsx(HistoryCalendar, { onStartSession }),
      activeTab === "records" && /* @__PURE__ */ jsx(RecordsView, {}),
      activeTab === "notes" && /* @__PURE__ */ jsx(HistoryNotes, {})
    ] })
  ] });
};
