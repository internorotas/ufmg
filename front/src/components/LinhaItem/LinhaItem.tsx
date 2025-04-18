import React from "react";

interface LinhaItemProps {
  numero: string;
  nome: string;
  destino: string;
  onClick?: () => void;
}

const LinhaItem: React.FC<LinhaItemProps> = ({
  numero,
  nome,
  destino,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "16px",
        margin: "8px 0",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f9f9f9",
      }}
    >
      <h3 style={{ margin: "0", color: "#333" }}>
        {numero} - {nome}
      </h3>
      <p style={{ margin: "4px 0", color: "#666" }}>Destino: {destino}</p>
    </div>
  );
};

export default LinhaItem;
