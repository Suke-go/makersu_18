// frontend/src/pages/AdminDashboard.js
import React, { useEffect, useState } from 'react';
import { socket } from '../utils/socket';

export default function AdminDashboard() {
  const [questions, setQuestions] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [time, setTime] = useState(0);
  const [votes, setVotes] = useState(0);
  const [connections, setConnections] = useState(0);
  const [stampCounts, setStampCounts] = useState({ like: 0, wow: 0, agree: 0, question: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extendSeconds, setExtendSeconds] = useState(''); // 拡張秒数

  // データ取得関数
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [questionsRes, speakersRes, participantsRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_BACKEND_URL}/admin/questions`),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/admin/speakers`),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/admin/participants`)
      ]);

      if (!questionsRes.ok || !speakersRes.ok || !participantsRes.ok) {
        throw new Error('データの取得に失敗しました');
      }

      const questionsData = await questionsRes.json();
      const speakersData = await speakersRes.json();
      const participantsData = await participantsRes.json();

      setQuestions(questionsData.questions);
      setSpeakers(speakersData.speakers);
      setParticipants(participantsData.participants);
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
    socket.on('connectionsUpdate', (c) => {
      setConnections(c);
      // 接続数が変わったら参加者一覧を再取得
      fetch(`${process.env.REACT_APP_BACKEND_URL}/admin/participants`)
        .then(res => res.json())
        .then(data => {
          setParticipants(data.participants);
        })
        .catch(err => {
          console.error('参加者一覧の取得に失敗しました:', err);
        });
    });
    socket.on('stampUpdate', ({ stampCounts }) => setStampCounts(stampCounts));

    socket.on('init', (data) => {
      setCurrentQuestion(data.question);
      setTime(data.time);
      setVotes(data.votes);
      setStampCounts(data.stampCounts);
      setConnections(data.connections);
    });

    socket.on('allReset', () => {
      // リセット後の状態をフロントエンドで反映
      setCurrentQuestion(null);
      setTime(0);
      setVotes(0);
      setStampCounts({ like: 0, wow: 0, agree: 0, question: 0 });
      setSelectedParticipants([]);
      fetchData(); // 参加者一覧を再取得
    });

    socket.on('participantSelected', (selected) => {
      setSelectedParticipants(selected);
    });

    socket.on('participantIDs', (data) => {
      // 受信した参加者IDを表示または処理
      alert(`参加者IDが送信されました:\n${JSON.stringify(data, null, 2)}`);
      console.log('参加者ID:', data);
    });

    // クリーンアップ
    return () => {
      socket.off('questionUpdate');
      socket.off('timeUpdate');
      socket.off('voteUpdate');
      socket.off('connectionsUpdate');
      socket.off('stampUpdate');
      socket.off('init');
      socket.off('allReset');
      socket.off('participantSelected');
      socket.off('participantIDs');
    };
  }, []);

  // 質問選択関数
  function selectQuestion(qid) {
    socket.emit('adminSelectQuestion', qid);
  }

  // 時間延長関数
  function extendTime(sec) {
    socket.emit('adminExtendTime', sec);
  }

  // 時間延長の送信関数
  function handleExtendTime(e) {
    e.preventDefault();
    const sec = parseInt(extendSeconds, 10);
    if (!isNaN(sec) && sec > 0) {
      extendTime(sec);
      setExtendSeconds('');
    }
  }

  // 全てをリセットする関数
  function handleResetAll() {
    if (window.confirm('本当に全てをリセットしますか？')) {
      socket.emit('adminResetAll');
    }
  }

  // 参加者を選択する関数
  function handleSelectParticipant(socketId) {
    if (selectedParticipants.includes(socketId)) {
      socket.emit('adminUnselectParticipant', socketId);
    } else {
      socket.emit('adminSelectParticipant', socketId);
    }
  }

  // 参加者IDを送る関数
  function handleSendParticipantIDs() {
    socket.emit('adminSendParticipantIDs');
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
          {/* 任意の秒数を入力できるフォーム */}
          <form onSubmit={handleExtendTime} className="flex space-x-2 mb-2">
            <input
              type="number"
              value={extendSeconds}
              onChange={(e) => setExtendSeconds(e.target.value)}
              placeholder="秒数"
              className="border p-1 rounded"
              min="1"
              required
            />
            <button type="submit" className="bg-green-500 text-white px-3 py-1 rounded">
              +秒数を追加
            </button>
          </form>
          <div className="mb-2">投票数: {votes}</div>
          <div className="mb-2">接続数: {connections}</div>
          <h3 className="font-bold">スタンプ集計</h3>
          <ul>
            <li>👍: {stampCounts.like}</li>
            <li>😲: {stampCounts.wow}</li>
            <li>🗳️: {stampCounts.agree}</li>
            <li>❓: {stampCounts.question}</li>
          </ul>

          {/* 新しいボタンセクション */}
          <div className="mt-4">
            <button
              onClick={handleResetAll}
              className="bg-red-500 text-white px-4 py-2 rounded mr-2"
            >
              全てをリセット
            </button>
            <button
              onClick={handleSendParticipantIDs}
              className="bg-purple-500 text-white px-4 py-2 rounded"
            >
              参加者IDを送る
            </button>
          </div>
        </div>

        {/* 参加者選択セクション */}
        <div>
          <h2 className="font-bold mb-2">参加者選択</h2>
          {loading ? (
            <p>読み込み中...</p>
          ) : (
            <ul>
              {participants.map(p => (
                <li key={p.socketId} className="my-2 flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedParticipants.includes(p.socketId)}
                    onChange={() => handleSelectParticipant(p.socketId)}
                    className="mr-2"
                  />
                  <span>{p.participantID}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
