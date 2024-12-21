// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { ADMIN_USERNAME, ADMIN_PASSWORD, SERVER_PORT, FRONTEND_URL } = require('./config');
const { questions, speakers } = require('./questions');
const { stamps } = require('./stamps');

const app = express();

// CORS設定をフロントエンドのURLに限定
app.use(cors({
  origin: FRONTEND_URL, // フロントエンドのベースURLのみ
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// インメモリ状態管理
let currentQuestion = null;
let remainingTime = 0;
let timerInterval = null;
let connectionsCount = 0;
let votes = 0;
let maxVotesPerUser = 3;
let userVotes = {}; // socketId -> votesLeft
let stampCounts = {
  like: 0, wow: 0, agree: 0, question: 0
};

let currentSpeaker = speakers[0] || { name: "No Speaker", topic: "No Topic" };
let currentQuestionStartTime = null;

// 新しく追加するフラグ
let hasExtendedTime = false;

// 管理者ログインAPI
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // 実際のアプリケーションでは、JWTやセッションを使用してください
    return res.json({ success: true, token: "dummy-jwt" });
  }
  return res.status(401).json({ success: false, message: "Invalid credentials" });
});

// 質問一覧取得
app.get('/admin/questions', (req, res) => {
  res.json({ questions });
});

// スピーカー一覧取得
app.get('/admin/speakers', (req, res) => {
  res.json({ speakers });
});

// 現在の状態取得(プレゼン等用)
app.get('/status', (req, res) => {
  res.json({
    question: currentQuestion,
    speaker: currentSpeaker,
    time: remainingTime,
    votes,
    stampCounts,
    connections: connectionsCount
  });
});

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: FRONTEND_URL, // フロントエンドのベースURLのみ
    methods: ["GET", "POST"],
    credentials: true
  }
});

// タイマー制御関数
function startTimer(seconds) {
  stopTimer();
  remainingTime = seconds;
  timerInterval = setInterval(() => {
    remainingTime--;
    if (remainingTime <= 0) {
      remainingTime = 0;
      stopTimer();
    }
    io.emit('timeUpdate', remainingTime);
    if (remainingTime === 3) {
      // 3秒前になったらクライアントにサウンド再生指示
      io.emit('lastThreeSeconds');
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// Socket接続
io.on('connection', (socket) => {
  connectionsCount++;
  io.emit('connectionsUpdate', connectionsCount); // 接続数を全クライアントに送信

  // ユーザー個別に投票数初期化
  userVotes[socket.id] = maxVotesPerUser;

  // 初期状態を送信
  socket.emit('init', {
    question: currentQuestion,
    speaker: currentSpeaker,
    time: remainingTime,
    votes,
    stampCounts,
    connections: connectionsCount
  });

  // 管理者が質問を選択
  socket.on('adminSelectQuestion', (qId) => {
    if (socket.handshake.query.role !== 'admin') return; // 管理者のみ実行可能

    const q = questions.find(x => x.id === qId);
    if (q) {
      currentQuestion = q;
      votes = 0;
      stampCounts = { like: 0, wow: 0, agree: 0, question: 0 };
      hasExtendedTime = false; // 新しい質問時にフラグをリセット
      for (let uid in userVotes) {
        userVotes[uid] = maxVotesPerUser;
      }
      io.emit('questionUpdate', currentQuestion);
      io.emit('voteUpdate', { votes }); 
      startTimer(q.timeLimit);
      currentQuestionStartTime = Date.now();
    }
  });

  // 管理者がスピーカーを選択
  socket.on('adminSelectSpeaker', (speakerId) => {
    if (socket.handshake.query.role !== 'admin') return; // 管理者のみ実行可能

    const speaker = speakers.find(s => s.id === speakerId);
    if (speaker) {
      currentSpeaker = speaker;
      io.emit('speakerUpdate', currentSpeaker); // 全クライアントに送信
      console.log(`Speaker updated to: ${speaker.name}`);
    }
  });

  // 管理者が時間を延長
  socket.on('adminExtendTime', (sec) => {
    if (socket.handshake.query.role !== 'admin') return; // 管理者のみ実行可能

    if (typeof sec === 'number' && sec > 0) {
      remainingTime += sec;
      io.emit('timeUpdate', remainingTime);
      // 延長音再生指示
      io.emit('timeExtended', sec);
    }
  });

  // ユーザーがスタンプを送信
  socket.on('sendStamp', (data) => {
    if (socket.handshake.query.role !== 'participant') return; // 参加者のみ実行可能

    // data:{type:'like', userId:socket.id}
    if (stampCounts[data.type] !== undefined) {
      stampCounts[data.type]++;
      io.emit('stampUpdate', { stampCounts });
      // スタンプアニメーション更新
      io.emit('stampAnimation', { type: data.type, icon: stamps.find(s => s.type === data.type)?.icon || "❓" });
      console.log(`Stamp received: ${data.type}. Count: ${stampCounts[data.type]}`);
    }
  });

  // ユーザーが投票を送信
  socket.on('sendVote', () => {
    if (socket.handshake.query.role !== 'participant') return; // 参加者のみ実行可能

    if (userVotes[socket.id] > 0) {
      userVotes[socket.id]--;
      votes++;
      io.emit('voteUpdate', { votes });
      console.log('Vote received. Total votes:', votes);

      // 一定割合超えたら自動延長 (例:3/5超えたら+10秒)
      let ratio = votes / connectionsCount;
      if (ratio > (3 / 5) && !hasExtendedTime && timerInterval) {
        remainingTime += 10;
        io.emit('timeUpdate', remainingTime);
        io.emit('timeExtended', 10);
        hasExtendedTime = true; // 一度だけ延長
        console.log('Time extended by 10 seconds.');
      }
    }
  });

  // 管理者が全てをリセット
  socket.on('adminResetAll', () => {
    if (socket.handshake.query.role !== 'admin') return; // 管理者のみ実行可能

    currentQuestion = null;
    currentSpeaker = null;
    remainingTime = 0;
    votes = 0;
    stampCounts = { like: 0, wow: 0, agree: 0, question: 0 };
    hasExtendedTime = false; // リセット時にフラグをリセット
    for (let uid in userVotes) {
      userVotes[uid] = maxVotesPerUser;
    }
    stopTimer();
    io.emit('allReset');
    io.emit('voteUpdate', { votes }); // 投票数リセットを全クライアントに送信
    console.log('All settings have been reset.');
  });

  // Socket切断時
  socket.on('disconnect', () => {
    connectionsCount--;
    delete userVotes[socket.id];
    io.emit('connectionsUpdate', connectionsCount);
    console.log(`Socket ${socket.id} disconnected. Connections: ${connectionsCount}`);
  });
});

server.listen(SERVER_PORT, () => {
  console.log(`Server running on port ${SERVER_PORT}`);
});
