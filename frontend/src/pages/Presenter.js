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
  const [stamp, setStamp] = useState('');

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

  // 残り時間をパーセンテージで計算
  const getTimePercentage = () => {
    const maxTime = 120; // 最大時間（秒）
    return Math.min((time / maxTime) * 100, 100);
  };

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

        {/* タイマーカード */}
        <div style={{ ...styles.card, ...styles.timerCard }}>
          <h2 style={styles.cardTitle}>残り時間</h2>
          <div style={styles.timerContainer}>
            <div style={styles.timerBar}>
              <div
                style={{ ...styles.timerProgress, width: `${getTimePercentage()}%` }}
              ></div>
            </div>
            <span style={styles.timerText}>{time}s</span>
          </div>
        </div>

        {/* 投票数とスタンプ集計カード */}
        <div style={{ ...styles.card, ...styles.voteStampCard }}>
          {/* 投票数 */}
          <div style={styles.voteSection}>
            <span style={styles.iconThumbsUp}>👍</span>
            <div style={styles.voteInfo}>
              <h3 style={styles.infoTitle}>投票数</h3>
              <p style={styles.infoCount}>{votes}</p>
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

        // {/* 接続数カード */}
        // <div style={{ ...styles.card, ...styles.connectionCard }}>
        //   <span style={styles.iconUsers} role="img" aria-label="ユーザー">👥</span>
        //   <div style={styles.connectionInfo}>
        //     <h3 style={styles.infoTitle}>接続数</h3>
        //     <p style={styles.infoCount}>{connections}</p>
        //   </div>
        // </div>
      </main>

      // {/* フッター */}
      // <footer style={styles.footer}>
      //   <p>&copy; {new Date().getFullYear()} Kosuke Shimizu. All rights reserved.</p>
      // </footer>

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
  },
  header: {
    width: '100%',
    maxWidth: '1200px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  title: {
    fontSize: '3rem',
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
    padding: '30px',
    boxSizing: 'border-box',
  },
  cardTitle: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#cc0000',
    marginBottom: '15px',
    textAlign: 'center',
  },
  cardContent: {
    fontSize: '1.75rem',
    color: '#333333',
    textAlign: 'center',
  },
  timerCard: {
    gridColumn: '1 / -1',
  },
  timerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBar: {
    flex: 1,
    background: '#e0e0e0',
    borderRadius: '20px',
    height: '25px',
    marginRight: '20px',
    overflow: 'hidden',
  },
  timerProgress: {
    background: '#ff8000',
    height: '100%',
    borderRadius: '20px 0 0 20px',
    transition: 'width 0.5s ease-in-out',
  },
  timerText: {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    color: '#333333',
  },
  voteStampCard: {
    display: 'flex',
    flexDirection: 'column',
  },
  voteSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  iconThumbsUp: {
    fontSize: '3rem',
    color: '#cc0000',
    marginRight: '20px',
  },
  voteInfo: {
    textAlign: 'center',
  },
  infoTitle: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#cc0000',
    marginBottom: '10px',
  },
  infoCount: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#333333',
  },
  stampSection: {
    textAlign: 'center',
  },
  stampItems: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: '20px',
    marginTop: '10px',
  },
  stampItem: {
    display: 'flex',
    alignItems: 'center',
  },
  stampIcon: {
    fontSize: '2rem',
    marginRight: '10px',
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
    marginRight: '20px',
  },
  connectionInfo: {
    textAlign: 'center',
  },
  footer: {
    width: '100%',
    maxWidth: '1200px',
    marginTop: '30px',
    textAlign: 'center',
    color: '#666666',
    fontSize: '1.25rem',
  },
  

  // メディアクエリのための追加スタイル
  '@media (min-width: 768px)': {
    main: {
      gridTemplateColumns: '1fr 1fr',
    },
    voteStampCard: {
      gridTemplateColumns: '1fr 1fr',
      gap: '40px',
    },
    stampItems: {
      justifyContent: 'flex-start',
    },
  },
};
