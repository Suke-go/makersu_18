// frontend/src/pages/AdminDashboard.js
import React, { useEffect, useState } from 'react';
import { socket } from '../utils/socket';

export default function AdminDashboard() { // デフォルトエクスポート
  const [questions, setQuestions] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [time, setTime] = useState(0);
  const [votes, setVotes] = useState(0);
  const [connections, setConnections] = useState(0);
  const [stampCounts, setStampCounts] = useState({ like: 0, wow: 0, agree: 0, question: 0 });
  const [loading, setLoading] = useState(false); // ローディング状態
  const [error, setError] = useState(null); // エラーメッセージ

  // データ取得関数
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [questionsRes, speakersRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_BACKEND_URL}/admin/questions`),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/admin/speakers`)
      ]);

      if (!questionsRes.ok || !speakersRes.ok) {
        throw new Error('データの取得に失敗しました');
      }

      const questionsData = await questionsRes.json();
      const speakersData = await speakersRes.json();

      setQuestions(questionsData.questions);
      setSpeakers(speakersData.speakers);
    } catch (err) {
      console.error(err);
      setError(err.message || '不明なエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Socket.IOイベントのリスナー設定
    socket.on('questionUpdate', (q) => {
      setCurrentQuestion(q);
    });
    socket.on('timeUpdate', (t) => setTime(t));
    socket.on('voteUpdate', ({ votes }) => setVotes(votes));
    socket.on('connectionsUpdate', (c) => setConnections(c));
    socket.on('stampUpdate', ({ stampCounts }) => setStampCounts(stampCounts));

    socket.on('init', (data) => {
      setCurrentQuestion(data.question);
      setTime(data.time);
      setVotes(data.votes);
      setStampCounts(data.stampCounts);
    });

    // クリーンアップ
    return () => {
      socket.off('questionUpdate');
      socket.off('timeUpdate');
      socket.off('voteUpdate');
      socket.off('connectionsUpdate');
      socket.off('stampUpdate');
      socket.off('init');
    };
  }, []);

  function selectQuestion(qid) {
    socket.emit('adminSelectQuestion', qid);
  }

  function extendTime(sec) {
    socket.emit('adminExtendTime', sec);
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-primary mb-4">管理者ダッシュボード</h1>

      {/* リフレッシュボタン */}
      <div className="mb-4">
        <button
          onClick={fetchData}
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? '更新中...' : 'データを更新'}
        </button>
      </div>

      {/* エラーメッセージの表示 */}
      {error && (
        <div className="mb-4 text-red-600">
          {error}
        </div>
      )}

      <div className="flex space-x-8">
        {/* 質問選択セクション */}
        <div>
          <h2 className="font-bold">質問選択</h2>
          {loading ? (
            <p>読み込み中...</p>
          ) : (
            <ul>
              {questions.map(q => (
                <li key={q.id} className="my-2">
                  <button
                    className="bg-accent text-white px-4 py-1 rounded"
                    onClick={() => selectQuestion(q.id)}
                  >
                    {q.text}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 現在の質問セクション */}
        <div>
          <h2 className="font-bold mb-2">現在の質問</h2>
          <div className="mb-2">{currentQuestion ? currentQuestion.text : "未選択"}</div>
          <div className="mb-2">残り時間: {time}s</div>
          <div className="flex space-x-2 mb-2">
            <button className="bg-green-500 text-white px-3 py-1 rounded" onClick={() => extendTime(10)}>+10秒</button>
            <button className="bg-green-500 text-white px-3 py-1 rounded" onClick={() => extendTime(30)}>+30秒</button>
          </div>
          <div className="mb-2">投票数: {votes}</div>
          <div className="mb-2">接続数: {connections}</div>
          <h3 className="font-bold">スタンプ集計</h3>
          <ul>
            <li>👍: {stampCounts.like}</li>
            <li>😲: {stampCounts.wow}</li>
            <li>🗳️: {stampCounts.agree}</li>
            <li>❓: {stampCounts.question}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
