// frontend/src/pages/Participant.js
import React, { useEffect, useState } from 'react';
import { socket } from '../utils/socket'; // Socket.IOクライアントのインスタンス

export default function Participant() {
  const [question, setQuestion] = useState(null);
  const [time, setTime] = useState(0);
  const [votes, setVotes] = useState(0);
  const [connections, setConnections] = useState(0);
  const [stamp, setStamp] = useState('');
  const [voteLeft, setVoteLeft] = useState(1); // 初期値を1に設定
  const [voteMessage, setVoteMessage] = useState(''); // フィードバックメッセージ用

  useEffect(() => {
    // 初期データの受信
    socket.on('init', (data) => {
      setQuestion(data.question);
      setTime(data.time);
      setVotes(data.votes);
      setConnections(data.connections);
      setVoteLeft(1); // 初期化時にvoteLeftを1にリセット
    });

    // 質問更新イベントのリスニング
    socket.on('questionUpdate', (q) => {
      setQuestion(q);
      setVoteLeft(1); // 質問が変わったらvoteLeftを1にリセット
      setVoteMessage('新しい質問が表示されました。投票してください。');
      setTimeout(() => setVoteMessage(''), 5000); // メッセージを5秒後に消す
    });

    // 残り時間更新イベントのリスニング
    socket.on('timeUpdate', (t) => setTime(t));

    // 投票数更新イベントのリスニング
    socket.on('voteUpdate', ({ votes }) => {
      setVotes(votes);
    });

    // 接続数更新イベントのリスニング
    socket.on('connectionsUpdate', (c) => setConnections(c));

    // クリーンアップ
    return () => {
      socket.off('init');
      socket.off('questionUpdate');
      socket.off('timeUpdate');
      socket.off('voteUpdate');
      socket.off('connectionsUpdate');
    };
  }, []);

  // スタンプ送信関数
  const sendStamp = (type) => {
    socket.emit('sendStamp', { type });
    setStamp(type);
    setTimeout(() => setStamp(''), 1500);
  };

  // 投票送信関数
  const sendVote = () => {
    if (voteLeft > 0) {
      socket.emit('sendVote');
      setVoteLeft(voteLeft - 1); // voteLeftを1減らす
      setVoteMessage('投票が完了しました。ありがとうございます！');
      setTimeout(() => setVoteMessage(''), 3000); // メッセージを3秒後に消す
    }
  };

  // 残り時間をパーセンテージで計算
  const getTimePercentage = () => {
    const maxTime = 120; // 最大時間（秒）
    return Math.min((time / maxTime) * 100, 100);
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

          button:hover {
            transform: scale(1.05);
          }

          button:disabled {
            opacity: 0.6;
          }
        `}
      </style>

      {/* ヘッダー */}
      <header style={styles.header}>
        <h1 style={styles.title}>Voting</h1>
      </header>

      {/* メインコンテンツ */}
      <main className="main-content" style={styles.main}>
        {/* 現在の質問 */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>現在の質問</h2>
          <p style={styles.cardContent}>{question ? question.text : "質問待ち..."}</p>
        </div>

        {/* 残り時間表示 */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>残り時間</h2>
          <p style={styles.timerText}>{time}秒</p>
        </div>


        {/* スタンプボタン */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>スタンプを送る</h2>
          <p style={styles.cardContent}>スタンプを送って場を盛り上げよう</p>
          <div style={styles.stampButtons}>
            <button
              onClick={() => sendStamp('like')}
              style={styles.stampButton}
              aria-label="いいね"
            >
              👍
            </button>
            <button
              onClick={() => sendStamp('wow')}
              style={styles.stampButton}
              aria-label="驚き"
            >
              😲
            </button>
            <button
              onClick={() => sendStamp('agree')}
              style={styles.stampButton}
              aria-label="同意"
            >
              🗳️
            </button>
            <button
              onClick={() => sendStamp('question')}
              style={styles.stampButton}
              aria-label="質問"
            >
              ❓
            </button>
          </div>
        </div>

        {/* 投票ボタン */}
        <div style={styles.card}>
          <p style={styles.cardContent}>みんながもっと聞きたいと投票したら時間が増えます</p>
          <button
            onClick={sendVote}
            style={{
              ...styles.voteButton,
              backgroundColor: voteLeft > 0 ? '#cc0000' : '#e0e0e0',
              cursor: voteLeft > 0 ? 'pointer' : 'not-allowed',
            }}
            disabled={voteLeft === 0}
          >
            もっと聞きたい！
          </button>
          <div style={styles.voteLeft}>残り投票: {voteLeft}票</div>
          {voteMessage && <div style={styles.voteMessage}>{voteMessage}</div>}
        </div>
      </main>

      {/* フッター */}
      <footer style={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Kosuke Shimizu. All rights reserved.</p>
      </footer>

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
    padding: '30px',
    boxSizing: 'border-box',
  },
  timerText: {
    fontSize: '2rem', // フォントサイズを大きく設定
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: '2rem', // フォントサイズを大きく設定
    fontWeight: '700',
    color: '#cc0000',
    marginBottom: '15px',
    textAlign: 'center',
  },
  cardContent: {
    fontSize: '1.75rem', // フォントサイズを大きく設定
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
    fontSize: '1.75rem', // フォントサイズを大きく設定
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
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
    fontSize: '1.75rem', // フォントサイズを大きく設定
    fontWeight: '700',
    color: '#cc0000',
    marginBottom: '10px',
  },
  infoCount: {
    fontSize: '2.5rem', // フォントサイズを大きく設定
    fontWeight: 'bold',
    color: '#333333',
  },
  stampSection: {
    textAlign: 'center',
  },
  stampButtons: {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: '20px',
  },
  stampButton: {
    fontSize: '2rem', // フォントサイズを大きく設定
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 0.2s, color 0.2s',
  },
  voteButton: {
    width: '100%',
    padding: '15px 0',
    borderRadius: '8px',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '1.25rem', // フォントサイズを大きく設定
    transition: 'background-color 0.3s, cursor 0.3s',
  },
  voteLeft: {
    marginTop: '10px',
    fontSize: '1rem',
    color: '#333333',
    textAlign: 'center',
  },
  voteMessage: {
    marginTop: '10px',
    fontSize: '1.25rem',
    color: '#28a745',
    textAlign: 'center',
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
};
