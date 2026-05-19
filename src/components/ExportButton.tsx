"use client";

import { useState } from "react";
import { Memory } from "@/lib/db";

export default function ExportButton() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/memories");
      const memories: Memory[] = await res.json();
      if (memories.length === 0) {
        alert("还没有回忆记录可以导出");
        setExporting(false);
        return;
      }

      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 16;
      let y = 20;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(244, 63, 94);
      doc.text("我们的回忆", pageW / 2, y, { align: "center" });
      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(156, 163, 175);
      doc.text(`共 ${memories.length} 条回忆 · ${new Date().toLocaleDateString("zh-CN")} 导出`, pageW / 2, y, { align: "center" });
      y += 12;
      doc.setDrawColor(244, 63, 94);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageW - margin, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      for (const m of memories) {
        const contentLines = doc.splitTextToSize(m.content || "(无文字)", pageW - margin * 2);
        const itemH = 6 + contentLines.length * 5 + (m.images.length > 0 ? 40 : 0) + 6 + 4;

        if (y + itemH > pageH - 20) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(11);
        doc.setTextColor(244, 63, 94);
        doc.setFont("helvetica", "bold");
        doc.text(`${m.date}   ${m.author === "我" ? "💙 我" : "💗 她"}`, margin, y);
        y += 6;

        doc.setFontSize(10);
        doc.setTextColor(55, 65, 81);
        doc.setFont("helvetica", "normal");
        for (const line of contentLines) {
          doc.text(line, margin, y);
          y += 5;
        }

        if (m.images.length > 0) {
          y += 2;
          const imgSize = 30;
          const imgsPerRow = Math.floor((pageW - margin * 2) / (imgSize + 4));
          for (let i = 0; i < Math.min(m.images.length, imgsPerRow); i++) {
            const img = m.images[i];
            try {
              const ext = img.split(".").pop()?.toLowerCase() || "jpeg";
              const format = ext === "png" ? "PNG" : "JPEG";
              doc.addImage(img, format, margin + i * (imgSize + 4), y, imgSize, imgSize);
            } catch {
              // skip images that can't be loaded
            }
          }
          y += imgSize + 4;
        }

        if (m.tags.length > 0) {
          doc.setFontSize(8);
          doc.setTextColor(244, 63, 94);
          doc.text(m.tags.map((t) => `#${t}`).join("  "), margin, y);
          y += 4;
        }

        doc.setDrawColor(229, 231, 235);
        doc.line(margin, y, pageW - margin, y);
        y += 6;
      }

      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(`生成时间: ${new Date().toLocaleString("zh-CN")}`, margin, pageH - 10);

      doc.save(`我们的回忆_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("导出失败:", err);
      alert("导出失败，请重试");
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition-colors disabled:opacity-50"
    >
      {exporting ? "📦 正在导出..." : "📦 导出回忆为 PDF"}
    </button>
  );
}
