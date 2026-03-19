import { useState } from "react";
import { AdminParadasTab } from "./AdminParadasTab";
import { AdminLinhasTab } from "./AdminLinhasTab";
import dataParadas from "../../data/paradas";
import dataLinhas from "../../data/linhas";
import { Parada, CategoriaLinhas } from "../../types/data.types";

export function AdminLayout() {
  const [activeTab, setActiveTab] = useState<"paradas" | "linhas">("paradas");
  const [paradasState, setParadasState] = useState<Parada[]>(
    dataParadas.paradas,
  );
  const [linhasState, setLinhasState] = useState<CategoriaLinhas>(dataLinhas);

  const downloadTsFile = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: "text/typescript" });
    const fileUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(fileUrl);
  };

  const handleExportAll = () => {
    // Export Paradas
    const paradasStr = `import { Parada } from "../types/data.types";\n\nconst dataParadas: { paradas: Parada[] } = {\n  paradas: ${JSON.stringify(paradasState, null, 2)}\n};\n\nexport default dataParadas;\n`;
    downloadTsFile("paradas.ts", paradasStr);

    // Export Linhas
    const linhasStr = `import { CategoriaLinhas } from "../types/data.types";\n\nconst data: CategoriaLinhas = ${JSON.stringify(linhasState, null, 2)};\n\nexport default data;\n`;
    downloadTsFile("linhas.ts", linhasStr);
  };

  return (
    <div className="flex flex-row h-screen w-screen overflow-hidden bg-background text-text-primary">
      {/* Sidebar container isolated here. The tabs will render the full layout (Sidebar + Map). */}
      {activeTab === "paradas" ? (
        <AdminParadasTab
          paradas={paradasState}
          setParadas={setParadasState}
          linhasData={linhasState}
          setActiveTab={setActiveTab}
          onExport={handleExportAll}
        />
      ) : (
        <AdminLinhasTab
          linhasData={linhasState}
          setLinhasData={setLinhasState}
          paradas={paradasState}
          setActiveTab={setActiveTab}
          onExport={handleExportAll}
        />
      )}
    </div>
  );
}
