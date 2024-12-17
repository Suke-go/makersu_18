// frontend/src/pages/Presenter.js
import React, { useEffect, useState } from 'react';
import { socket } from '../utils/socket'; // Socket.IOクライアントのインスタンス

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

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">プレゼンター画面</h1>

      <div className="mb-4">
        <h2 className="font-bold">現在の質問:</h2>
        <p>{currentQuestion ? currentQuestion.text : "未選択"}</p>
      </div>

      <div className="mb-4">
        <h2 className="font-bold">現在のスピーカー:</h2>
        <p>{currentSpeaker ? `${currentSpeaker.name} - ${currentSpeaker.topic}` : "未選択"}</p>
      </div>

      <div className="mb-4">
        <h2 className="font-bold">残り時間:</h2>
        <p>{time}s</p>
      </div>

      <div className="mb-4">
        <h2 className="font-bold">投票数:</h2>
        <p>{votes}</p>
      </div>

      <div className="mb-4">
        <h2 className="font-bold">スタンプ集計:</h2>
        <ul>
          <li>👍: {stampCounts.like}</li>
          <li>😲: {stampCounts.wow}</li>
          <li>🗳️: {stampCounts.agree}</li>
          <li>❓: {stampCounts.question}</li>
        </ul>
      </div>

      <div className="mb-4">
        <h2 className="font-bold">接続数:</h2>
        <p>{connections}</p>
      </div>
    </div>
  );
}
