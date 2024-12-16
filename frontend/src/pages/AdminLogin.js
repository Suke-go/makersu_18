// frontend/src/pages/AdminLogin.js
import React, { useState } from 'react';

export default function AdminLogin({ onLogin }) { // デフォルトエクスポート
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleLogin(e){
    e.preventDefault();
    try{
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if(data.success){
        onLogin(data.token);
      } else {
        setError('ログイン失敗');
      }
    } catch(err){
      setError('サーバーエラー');
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <form onSubmit={handleLogin} className="p-8 bg-gray-100 rounded shadow-md space-y-4">
        <h1 className="text-2xl font-bold text-primary">管理者ログイン</h1>
        {error && <div className="text-red-600">{error}</div>}
        <input
          className="border p-2 w-full"
          placeholder="ユーザー名"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          className="border p-2 w-full"
          placeholder="パスワード"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button className="bg-primary text-white p-2 w-full rounded">ログイン</button>
      </form>
    </div>
  );
}
