import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Board from "./pages/Board"; // 👈 1. Ajoute cet import

function App() {
  return (
    <Router>
      {/* Notifications stylées pour les points de feedback */}
      <ToastContainer position="top-right" autoClose={3000} />
      
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* 👈 2. Ajoute la route dynamique pour le détail du tableau */}
        <Route path="/board/:id" element={<Board />} />
        
        {/* Par défaut, on va sur le login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;