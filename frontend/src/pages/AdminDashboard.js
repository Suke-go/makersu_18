// frontend/src/pages/AdminDashboard.js
import React, { useEffect, useState } from 'react';
import { socket } from '../utils/socket';

export default function AdminDashboard() {
  const [questions, setQuestions] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
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
      const [questionsRes, speakersRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_BACKEND_URL}/admin/questions`),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/admin/speakers`)
      ]);

      console.log('Questions response status:', questionsRes.status);
      console.log('Speakers response status:', speakersRes.status);

      if (!questionsRes.ok || !speakersRes.ok) {
        throw new Error('データの取得に失敗しました');
      }

      const questionsData = await questionsRes.json();
      const speakersData = await speakersRes.json();

      console.log('Questions data:', questionsData);
      console.log('Speakers data:', speakersData);

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
    socket.on('speakerUpdate', (speaker) => {
      setCurrentSpeaker(speaker);
    });
    socket.on('timeUpdate', (t) => setTime(t));
    socket.on('voteUpdate', ({ votes }) => setVotes(votes));
    socket.on('connectionsUpdate', (c) => setConnections(c));
    socket.on('stampUpdate', ({ stampCounts }) => setStampCounts(stampCounts));

    socket.on('init', (data) => {
      setCurrentQuestion(data.question);
      setCurrentSpeaker(data.speaker);
      setTime(data.time);
      setVotes(data.votes);
      setStampCounts(data.stampCounts);
      setConnections(data.connections);
    });

    // 管理者からのリセット確認
    socket.on('allReset', () => {
      setCurrentQuestion(null);
      setCurrentSpeaker(null);
      setTime(0);
      setVotes(0);
      setStampCounts({ like: 0, wow: 0, agree: 0, question: 0 });
    });

    // クリーンアップ
    return () => {
      socket.off('questionUpdate');
      socket.off('speakerUpdate');
      socket.off('timeUpdate');
      socket.off('voteUpdate');
      socket.off('connectionsUpdate');
      socket.off('stampUpdate');
      socket.off('init');
      socket.off('allReset');
    };
  }, []);

  // 質問選択関数
  function selectQuestion(qid) {
    socket.emit('adminSelectQuestion', qid);
  }

  // スピーカー選択関数
  function selectSpeaker(speakerId) {
    socket.emit('adminSelectSpeaker', speakerId);
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

  // 参加者IDを送る関数（不要な場合は削除）
  // function handleSendParticipantIDs() {
  //   socket.emit('adminSendParticipantIDs');
  // }

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

        {/* スピーカー選択セクション */}
        <div>
          <h2 className="font-bold">スピーカー選択</h2>
          {loading ? (
            <p>読み込み中...</p>
          ) : (
            <ul>
              {speakers.map(s => (
                <li key={s.id} className="my-2">
                  <button
                    className={`px-4 py-1 rounded ${currentSpeaker && currentSpeaker.id === s.id ? 'bg-green-500 text-white' : 'bg-gray-300 text-black'}`}
                    onClick={() => selectSpeaker(s.id)}
                  >
                    {s.name} - {s.topic}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 現在の状態セクション */}
        <div>
          <h2 className="font-bold mb-2">現在の状態</h2>
          <div className="mb-2">質問: {currentQuestion ? currentQuestion.text : "未選択"}</div>
          <div className="mb-2">スピーカー: {currentSpeaker ? `${currentSpeaker.name} - ${currentSpeaker.topic}` : "未選択"}</div>
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
            {/* <button
              onClick={handleSendParticipantIDs}
              className="bg-purple-500 text-white px-4 py-2 rounded"
            >
              参加者IDを送る
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
}
