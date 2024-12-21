// frontend/src/pages/Presenter.js
import React, { useEffect, useState } from 'react';
import { socket } from '../utils/socket'; // Socket.IOクライアントのインスタンス
import { FaThumbsUp, FaQuestion, FaPoll, FaGrinWink } from 'react-icons/fa'; // スタンプアイコン
import { FiUsers } from 'react-icons/fi'; // 接続数アイコン

export default function Presenter() {
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [time, setTime] = useState(0);
  const [votes, setVotes] = useState(0);
  const [stampCounts, setStampCounts] = useState({ like: 0, wow: 0, agree: 0, question: 0 });
  const [connections, setConnections] = useState(0);

  useEffect(() => {
    // 初期データの受信
    socket.on('init', (data) => {
      setCurrentSpeaker(data.speaker);
      setCurrentQuestion(data.question);
      setTime(data.time);
      setVotes(data.votes);
      setStampCounts(data.stampCounts);
      setConnections(data.connections);
    });

    // スピーカー更新イベントのリスニング
    socket.on('speakerUpdate', (speaker) => {
      setCurrentSpeaker(speaker);
      console.log(`Speaker updated to: ${speaker.name}`);
    });

    // 質問更新イベントのリスニング
    socket.on('questionUpdate', (question) => {
      setCurrentQuestion(question);
      console.log(`Question updated to: ${question.text}`);
    });

    // 残り時間更新イベントのリスニング
    socket.on('timeUpdate', (t) => {
      setTime(t);
    });

    // 投票数更新イベントのリスニング
    socket.on('voteUpdate', ({ votes }) => {
      setVotes(votes);
    });

    // スタンプ集計更新イベントのリスニング
    socket.on('stampUpdate', ({ stampCounts }) => {
      setStampCounts(stampCounts);
    });

    // 接続数更新イベントのリスニング
    socket.on('connectionsUpdate', (c) => {
      setConnections(c);
    });

    // クリーンアップ
    return () => {
      socket.off('init');
      socket.off('speakerUpdate');
      socket.off('questionUpdate');
      socket.off('timeUpdate');
      socket.off('voteUpdate');
      socket.off('stampUpdate');
      socket.off('connectionsUpdate');
    };
  }, []);

  // 残り時間をパーセントで計算
  const getTimePercentage = () => {
    // 最大時間を設定（例: 120秒）
    const maxTime = 120;
    return Math.min((time / maxTime) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-red-100 to-orange-300 flex flex-col items-center p-4">
      {/* ヘッダー */}
      <header className="w-full max-w-5xl mb-8">
        <h1 className="text-5xl font-extrabold text-center text-red-800">プレゼンター画面</h1>
      </header>

      {/* メインコンテンツ */}
      <main className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 現在の質問カード */}
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h2 className="text-3xl font-semibold mb-4 text-red-700">現在の質問</h2>
          <p className="text-2xl text-gray-700">{currentQuestion ? currentQuestion.text : "質問が選択されていません。"}</p>
        </div>

        {/* 現在のスピーカーカード */}
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h2 className="text-3xl font-semibold mb-4 text-red-700">現在のスピーカー</h2>
          <p className="text-2xl text-gray-700">{currentSpeaker ? `${currentSpeaker.name} - ${currentSpeaker.topic}` : "スピーカーが選択されていません。"}</p>
        </div>

        {/* タイマーカード */}
        <div className="bg-white shadow-lg rounded-lg p-8 col-span-1 md:col-span-2">
          <h2 className="text-3xl font-semibold mb-4 text-red-700">残り時間</h2>
          <div className="flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-8 mr-4">
              <div
                className="bg-orange-500 h-8 rounded-full transition-all duration-500"
                style={{ width: `${getTimePercentage()}%` }}
              ></div>
            </div>
            <span className="text-2xl font-bold text-gray-800">{time}s</span>
          </div>
        </div>

        {/* 投票数とスタンプ集計カード */}
        <div className="bg-white shadow-lg rounded-lg p-8 col-span-1 md:col-span-2 grid grid-cols-2 gap-6">
          {/* 投票数 */}
          <div className="flex items-center space-x-4">
            <FaThumbsUp className="text-4xl text-red-500" />
            <div>
              <h3 className="text-2xl font-semibold text-red-700">投票数</h3>
              <p className="text-3xl font-bold text-gray-800">{votes}</p>
            </div>
          </div>

          {/* スタンプ集計 */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-2xl font-semibold text-red-700">スタンプ集計</h3>
            <div className="flex items-center space-x-3">
              <FaThumbsUp className="text-3xl text-green-500" />
              <span className="text-xl text-gray-800">👍: {stampCounts.like}</span>
            </div>
            <div className="flex items-center space-x-3">
              <FaGrinWink className="text-3xl text-yellow-500" />
              <span className="text-xl text-gray-800">😲: {stampCounts.wow}</span>
            </div>
            <div className="flex items-center space-x-3">
              <FaPoll className="text-3xl text-purple-500" />
              <span className="text-xl text-gray-800">🗳️: {stampCounts.agree}</span>
            </div>
            <div className="flex items-center space-x-3">
              <FaQuestion className="text-3xl text-red-500" />
              <span className="text-xl text-gray-800">❓: {stampCounts.question}</span>
            </div>
          </div>
        </div>

        {/* 接続数カード */}
        <div className="bg-white shadow-lg rounded-lg p-8 col-span-1 md:col-span-2 flex items-center space-x-4">
          <FiUsers className="text-4xl text-orange-500" />
          <div>
            <h3 className="text-2xl font-semibold text-red-700">接続数</h3>
            <p className="text-3xl font-bold text-gray-800">{connections}</p>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="w-full max-w-5xl mt-12">
        <p className="text-center text-gray-500">&copy; {new Date().getFullYear()} プレゼンターシステム. All rights reserved.</p>
      </footer>
    </div>
  );
}
