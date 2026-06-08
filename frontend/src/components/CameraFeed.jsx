export default function CameraFeed({ frame }) {
  return (
    <div>
      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 10 }}>Camera feed</p>
      <div style={{
        background: "var(--surface2)",
        borderRadius: 8,
        aspectRatio: "16/9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        border: "1px solid var(--border)"
      }}>
        {frame ? (
          <img
            src={`data:image/jpeg;base64,${frame}`}
            alt="Camera"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ textAlign: "center", color: "var(--muted)" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
            <p style={{ fontSize: 13 }}>No camera feed</p>
            <p style={{ fontSize: 11, marginTop: 4 }}>Waiting for device...</p>
          </div>
        )}
      </div>
    </div>
  );
}