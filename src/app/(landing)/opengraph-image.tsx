import { ImageResponse } from "next/og";
import { platformName } from "@/lib/platform";

export const alt = `${platformName} — Organize suas aulas particulares`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        padding: 90,
        background: "#FBF7F0",
        borderTop: "18px solid #E59D2C",
        color: "#2F4366",
      }}
    >
      <div
        style={{
          display: "flex",
          alignSelf: "flex-start",
          padding: "10px 22px",
          borderRadius: 40,
          background: "#F3D58D",
          fontSize: 32,
          fontWeight: 700,
        }}
      >
        {platformName}
      </div>
      <div
        style={{
          marginTop: 28,
          fontSize: 68,
          fontWeight: 700,
          color: "#8B3B08",
        }}
      >
        Sua rotina de aulas particulares organizada em um só lugar
      </div>
      <div style={{ marginTop: 32, fontSize: 32 }}>
        Alunos, agenda, planejamento e cobranças
      </div>
    </div>,
    size,
  );
}
