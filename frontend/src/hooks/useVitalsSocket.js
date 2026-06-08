import { useEffect, useRef, useState } from "react";

export function useVitalsSocket(patientId) {
  const [vitals,      setVitals]      = useState([]);
  const [prediction,  setPrediction]  = useState(null);
  const [cameraFrame, setCameraFrame] = useState(null);
  const [connected,   setConnected]   = useState(false);
  const ws = useRef(null);

  useEffect(() => {
    if (!patientId) return;

    const url = patientId === "clinician"
      ? `${import.meta.env.VITE_WS_URL}/ws/live/clinician`
      : `${import.meta.env.VITE_WS_URL}/ws/live/${patientId}`;

    ws.current = new WebSocket(url);

    ws.current.onopen  = () => setConnected(true);
    ws.current.onclose = () => setConnected(false);

    ws.current.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      setVitals((prev) => [...prev.slice(-80), msg.vitals]);
      setPrediction(msg.prediction);
      if (msg.camera_frame) setCameraFrame(msg.camera_frame);
    };

    return () => ws.current?.close();
  }, [patientId]);

  return { vitals, prediction, cameraFrame, connected };
}

export function useClinicianSocket() {
  const [feed,      setFeed]      = useState({}); // patient_id -> latest data
  const [connected, setConnected] = useState(false);
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(
      `${import.meta.env.VITE_WS_URL}/ws/live/clinician`
    );
    ws.current.onopen  = () => setConnected(true);
    ws.current.onclose = () => setConnected(false);
    ws.current.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.patient_id) {
        setFeed((prev) => ({ ...prev, [msg.patient_id]: msg }));
      }
    };
    return () => ws.current?.close();
  }, []);

  return { feed, connected };
}