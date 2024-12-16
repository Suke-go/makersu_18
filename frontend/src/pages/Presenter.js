// frontend/src/pages/Presenter.js
import React, { useEffect, useState, useRef } from 'react';
import { socket } from '../utils/socket';
import CountdownTimer from '../components/CountdownTimer';
import VoteBar from '../components/VoteBar';
import StampAnimation from '../components/StampAnimation';

import beepSound from '../assets/beep.mp3';
import extendSound from '../assets/extend.mp3';

export default function Presenter() { // デフォルトエクスポート
  const [question, setQuestion] = useState(null);
  const [time, setTime] = useState(0);
  const [votes, setVotes] = useState(0);
  const [connections, setConnections] = useState(0);
  const [stampCounts, setStampCounts] = useState({ like: 0, wow: 0, agree: 0, question: 0 });
  const [speaker, setSpeaker] = useState(null);
  const [floatingStamp, setFloatingStamp] = useState(null);

  const beepAudioRef = useRef(null);
  const extendAudioRef = useRef(null);

  useEffect(() => {
    socket.on('init', (data) => {
      setQuestion(data.question);
      setTime(data.time);
      setVotes(data.votes);
      setStampCounts(data.stampCounts);
      setSpeaker(data.speaker);
    });
    socket.on('questionUpdate', (q) => setQuestion(q));
    socket.on('timeUpdate', (t) => setTime(t));
    socket.on('voteUpdate', ({ votes }) => setVotes(votes));
    socket.on('connectionsUpdate', (c) => setConnections(c));
    socket.on('stampUpdate', ({ stampCounts }) => setStampCounts(stampCounts));
    socket.on('stampAnimation', ({ type, icon }) => {
      setFloatingStamp(icon);
      setTimeout(() => setFloatingStamp(null), 1500);
    });
    socket.on('lastThreeSeconds', () => {
      if (beepAudioRef.current) beepAudioRef.current.play();
    });
    socket.on('timeExtended', (sec) => {
      if (extendAudioRef.current) extendAudioRef.current.play();
    });

    return () => {
      socket.off('init');
      socket.off('questionUpdate');
      socket.off('timeUpdate');
      socket.off('voteUpdate');
      socket.off('connectionsUpdate');
      socket.off('stampUpdate');
      socket.off('stampAnimation');
      socket.off('lastThreeSeconds');
      socket.off('timeExtended');
    };
  }, []);

  return (
    <div className="p-4">
      <audio ref={beepAudioRef} src={beepSound} />
      <audio ref={extendAudioRef} src={extendSound} />
      <h1 className="text-3xl font-bold text-primary mb-4">プレゼンテーション画面</h1>
      <div className="flex flex-col items-center">
        <div className="text-xl mb-2">{speaker ? `${speaker.name} - ${speaker.topic}` : ''}</div>
        <div className="text-2xl mb-4">{question ? question.text : "質問待ち..."}</div>
        <CountdownTimer time={time} />
        <div className="my-4">
          <VoteBar votes={votes} total={connections} />
        </div>
        <div className="my-4 text-lg">
          <div className="flex space-x-4">
            <div>👍 {stampCounts.like}</div>
            <div>😲 {stampCounts.wow}</div>
            <div>🗳️ {stampCounts.agree}</div>
            <div>❓ {stampCounts.question}</div>
          </div>
        </div>
        <div className="text-sm text-gray-500">参加者数: {connections}</div>
      </div>
      {floatingStamp && <StampAnimation icon={floatingStamp} />}
    </div>
  );
}
