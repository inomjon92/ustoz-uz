import { ImageResponse } from "next/og";

export async function GET(_: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = (await params).size === "512" ? 512 : 192;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#2453e0", color: "white", fontSize: size * 0.55, fontWeight: 700 }}>
        U
      </div>
    ),
    { width: size, height: size },
  );
}
