import { useEffect, useRef, useState } from "react";

export default function VoiceRecorder({ onRecordingComplete }) {
  const mediaRecRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    // Check for microphone access
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => setHasPermission(true))
      .catch(() => setHasPermission(false));
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        onRecordingComplete(file);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Recording failed:", err);
      alert("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecRef.current && isRecording) {
      mediaRecRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block font-medium">Record Voice Note</label>
      {hasPermission === false && (
        <p className="text-sm text-red-600">Microphone access is required.</p>
      )}
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-4 py-2 rounded ${
          isRecording ? "bg-red-600" : "bg-green-600"
        } text-white hover:opacity-90`}
        disabled={hasPermission === false}
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
      {isRecording && <p className="text-sm text-orange-500">Recording...</p>}
    </div>
  );
}
