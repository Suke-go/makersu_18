// frontend/src/App.js
import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import AdminLogin from './pages/AdminLogin'; // デフォルトエクスポート
import AdminDashboard from './pages/AdminDashboard'; // デフォルトエクスポート
import Participant from './pages/Participant'; // デフォルトエクスポート
import Presenter from './pages/Presenter'; // デフォルトエクスポート
import QrPage from './pages/QrPage'; // デフォルトエクスポート

export default function App() {
  const [adminToken, setAdminToken] = useState(null);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/presenter" />} />
        <Route path="/admin" element={adminToken ? <AdminDashboard /> : <AdminLogin onLogin={setAdminToken} />} />
        <Route path="/participant" element={<Participant />} />
        <Route path="/presenter" element={<Presenter />} />
        <Route path="/qr" element={<QrPage />} />
      </Routes>
    </Router>
  );
}
