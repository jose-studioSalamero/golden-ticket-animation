import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AlreadyPlayed } from "./pages/AlreadyPlayed";
import { Landing } from "./pages/Landing";
import { Play } from "./pages/Play";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/play" element={<Play />} />
        <Route path="/already-played" element={<AlreadyPlayed />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
