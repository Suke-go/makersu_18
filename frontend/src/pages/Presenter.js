// frontend/src/pages/Presenter.js
import React, { useEffect, useState } from 'react';
import { socket } from '../utils/socket'; // Socket.IOクライアントのインスタンス

export default function Presenter() {
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [time, setTime] = useState(0);
  const [maxTime, setMaxTime] = useState(120); // maxTime を状態として追加
  const [votes, setVotes] = useState(0);
  const [stampCounts, setStampCounts] = useState({ like: 0, wow: 0, agree: 0, question: 0 });
  const [connections, setConnections] = useState(0);
  const [stamp, setStamp] = useState('');
  

  useEffect(() => {
    // 初期データの受信
    socket.on('init', (data) => {
      setCurrentSpeaker(data.speaker);
      setCurrentQuestion(data.question);
      setTime(data.time);
      setMaxTime(data.maxTime || data.time); // maxTime を設定（サーバーから送信される場合）
      setVotes(data.votes);
      setStampCounts(data.stampCounts);
      setConnections(data.connections);
      console.log('Initial data received:', data);
    });

    // スピーカー更新イベントのリスニング
    socket.on('speakerUpdate', (speaker) => {
      setCurrentSpeaker(speaker);
      console.log(`Speaker updated to: ${speaker.name}`);
    });

    // 質問更新イベントのリスニング
    socket.on('questionUpdate', (question) => {
      setCurrentQuestion(question);
      setTime(question.time); // 質問に応じた時間を設定
      setMaxTime(question.maxTime || question.time); // maxTime を設定
      console.log(`Question updated to: ${question.text}`);
    });

    // 残り時間更新イベントのリスニング
    socket.on('timeUpdate', (t) => {
      setTime(t);
      console.log('Time updated:', t);
    });

    // 投票数更新イベントのリスニング
    socket.on('voteUpdate', ({ votes }) => {
      setVotes(votes);
      console.log('Votes updated:', votes);
    });

    // スタンプ集計更新イベントのリスニング
    socket.on('stampUpdate', ({ stampCounts }) => {
      setStampCounts(stampCounts);
      console.log('Stamp counts updated:', stampCounts);
    });

    // 接続数更新イベントのリスニング
    socket.on('connectionsUpdate', (c) => {
      setConnections(c);
      console.log('Connections updated:', c);
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

  const votePercentage = connections > 0 ? ((votes / connections) * 100).toFixed(2) : 0;


  // スタンプ送信関数
  const sendStamp = (type) => {
    socket.emit('sendStamp', { type });
    setStamp(type);
    setTimeout(() => setStamp(''), 1500);
  };

  // スタンプ送信時のアニメーション用のスタイル
  const stampPopupStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '4rem',
    animation: 'bounce 1s forwards',
    zIndex: 1000,
    color: '#ffffff',
  };

  return (
    <div style={styles.container}>
      {/* 内部スタイルシート */}
      <style>
        {`
          @keyframes bounce {
            0% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 1;
            }
            50% {
              transform: translate(-50%, -60%) scale(1.5);
              opacity: 0.8;
            }
            100% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0;
            }
          }

          @media (min-width: 768px) {
            .main-content {
              grid-template-columns: 1fr 1fr;
            }
          }

          /* タイマー表示用スタイル */
          .timer-text {
            font-size: 3rem;
            font-weight: bold;
            color: #333333;
            text-align: center;
          }
        `}
      </style>

      {/* ヘッダー */}
      <header style={styles.header}>
        <h1 style={styles.title}>田川ゼミ:晴れ曇り雨</h1>
      </header>

      {/* メインコンテンツ */}
      <main className="main-content" style={styles.main}>
        {/* 現在の質問カード */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>現在の質問</h2>
          <p style={styles.cardContent}>{currentQuestion ? currentQuestion.text : "質問が選択されていません。"}</p>
        </div>

        {/* 現在のスピーカーカード */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>現在のスピーカー</h2>
          <p style={styles.cardContent}>{currentSpeaker ? `${currentSpeaker.name} - ${currentSpeaker.topic}` : "スピーカーが選択されていません。"}</p>
        </div>

        {/* 残り時間表示 */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>残り時間</h2>
          <p className="timer-text">{time}秒</p>
        </div>

        {/* 投票数とスタンプ集計カード */}
        <div style={{ ...styles.card, ...styles.voteStampCard }}>
        {/* 投票数 */}
        <div style={styles.voteSection}>
          <span style={styles.iconThumbsUp}>👍</span>
          <div style={styles.voteInfo}>
            <h3 style={styles.infoTitle}>投票数</h3>
            <p style={styles.infoCount}>
              {votes} ({votePercentage}%)
            </p>
          </div>
        </div>

          {/* スタンプ集計 */}
          <div style={styles.stampSection}>
            <h3 style={styles.infoTitle}>スタンプ集計</h3>
            <div style={styles.stampItems}>
              <div style={styles.stampItem}>
                <span style={styles.stampIcon}>👍</span>
                <span style={styles.stampCount}>{stampCounts.like}</span>
              </div>
              <div style={styles.stampItem}>
                <span style={styles.stampIcon}>😲</span>
                <span style={styles.stampCount}>{stampCounts.wow}</span>
              </div>
              <div style={styles.stampItem}>
                <span style={styles.stampIcon}>🗳️</span>
                <span style={styles.stampCount}>{stampCounts.agree}</span>
              </div>
              <div style={styles.stampItem}>
                <span style={styles.stampIcon}>❓</span>
                <span style={styles.stampCount}>{stampCounts.question}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* スタンプ表示 */}
      {stamp && (
        <div style={stampPopupStyle}>
          {stamp === 'like' ? '👍' : stamp === 'wow' ? '😲' : stamp === 'agree' ? '🗳️' : '❓'}
        </div>
      )}
    </div>
  );
}

// インラインスタイルの定義
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(to right, #ffcccc, #ff9966)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    boxSizing: 'border-box',
    fontFamily: 'Arial, sans-serif',
    overflow: 'hidden', // スクロールを防止
  },
  header: {
    width: '100%',
    maxWidth: '1200px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  title: {
    fontSize: '3rem', // フォントサイズを大きく設定
    fontWeight: '800',
    color: '#ffffff',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
  },
  main: {
    width: '100%',
    maxWidth: '1200px',
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '20px',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.85)',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    borderRadius: '12px',
    padding: '20px', // パディングを減らしてスクロールを防止
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: '2rem', // フォントサイズを大きく設定
    fontWeight: '700',
    color: '#cc0000',
    marginBottom: '10px', // マージンを減らす
    textAlign: 'center',
  },
  cardContent: {
    fontSize: '1.75rem', // フォントサイズを大きく設定
    color: '#333333',
    textAlign: 'center',
    margin: '0', // マージンをリセット
  },
  timerCard: {
    // タイマーバーの削除に伴い不要
  },
  voteStampCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  voteSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '10px', // マージンを減らす
  },
  iconThumbsUp: {
    fontSize: '3rem',
    color: '#cc0000',
    marginRight: '10px', // マージンを減らす
  },
  voteInfo: {
    textAlign: 'center',
  },
  infoTitle: {
    fontSize: '1.75rem', // フォントサイズを大きく設定
    fontWeight: '700',
    color: '#cc0000',
    marginBottom: '5px', // マージンを減らす
  },
  infoCount: {
    fontSize: '2.5rem', // フォントサイズを大きく設定
    fontWeight: 'bold',
    color: '#333333',
    margin: '0', // マージンをリセット
  },
  stampSection: {
    textAlign: 'center',
    width: '100%',
  },
  stampItems: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: '10px', // ギャップを減らす
    marginTop: '10px',
  },
  stampItem: {
    display: 'flex',
    alignItems: 'center',
  },
  stampIcon: {
    fontSize: '2rem',
    marginRight: '5px', // マージンを減らす
  },
  stampCount: {
    fontSize: '1.75rem',
    color: '#333333',
  },
  connectionCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconUsers: {
    fontSize: '3rem',
    color: '#ff8000',
    marginRight: '10px', // マージンを減らす
  },
  connectionInfo: {
    textAlign: 'center',
  },
  infoTitle: {
    fontSize: '1.75rem', // フォントサイズを大きく設定
    fontWeight: '700',
    color: '#cc0000',
    marginBottom: '5px', // マージンを減らす
  },
  infoCount: {
    fontSize: '2.5rem', // フォントサイズを大きく設定
    fontWeight: 'bold',
    color: '#333333',
    margin: '0', // マージンをリセット
  },
  footer: {
    width: '100%',
    maxWidth: '1200px',
    marginTop: '20px', // マージンを減らす
    textAlign: 'center',
    color: '#666666',
    fontSize: '1.25rem',
  },
  connectionCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // メディアクエリのための追加スタイル
  '@media (min-width: 768px)': {
    main: {
      gridTemplateColumns: '1fr 1fr',
    },
    voteStampCard: {
      gridTemplateColumns: '1fr 1fr',
      gap: '20px', // ギャップを調整
    },
    stampItems: {
      justifyContent: 'flex-start',
    },
  },
};
