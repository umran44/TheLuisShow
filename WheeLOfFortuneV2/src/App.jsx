import { Routes, Route } from "react-router-dom";
import Host from "./pages/Host";
import Display from "./pages/Display";

export default function App() {
  return (
    <Routes>
      <Route path="/host" element={<Host />} />
      <Route path="/display" element={<Display />} />
    </Routes>
  );
}