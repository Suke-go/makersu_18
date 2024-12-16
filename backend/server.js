// backend/server.js
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
  origin: FRONTEND_URL,
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
let userVotes = {}; // userId -> votesLeft
let stampCounts = {
  like: 0, wow: 0, agree: 0, question: 0
};

let currentSpeaker = speakers[0] || { name: "No Speaker", topic: "No Topic" };
let currentQuestionStartTime = null;

// 管理者ログインAPI
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
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
    time: remainingTime,
    votes,
    stampCounts,
    connections: connectionsCount,
    speaker: currentSpeaker
  });
});

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: FRONTEND_URL, // フロントエンドのURLを指定
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
  io.emit('connectionsUpdate', connectionsCount);

  // ユーザー個別に投票数初期化
  userVotes[socket.id] = maxVotesPerUser;

  socket.emit('init', {
    question: currentQuestion,
    time: remainingTime,
    votes,
    stampCounts,
    speaker: currentSpeaker
  });

  socket.on('adminSelectQuestion', (qId) => {
    const q = questions.find(x => x.id === qId);
    if (q) {
      currentQuestion = q;
      votes = 0;
      stampCounts = { like: 0, wow: 0, agree: 0, question: 0 };
      for (let uid in userVotes) {
        userVotes[uid] = maxVotesPerUser;
      }
      io.emit('questionUpdate', currentQuestion);
      startTimer(q.timeLimit);
      currentQuestionStartTime = Date.now();
    }
  });

  socket.on('adminExtendTime', (sec) => {
    remainingTime += sec;
    io.emit('timeUpdate', remainingTime);
    // 延長音再生指示
    io.emit('timeExtended', sec);
  });

  socket.on('sendStamp', (data) => {
    // data:{type:'like', userId:socket.id}
    if (stampCounts[data.type] !== undefined) {
      stampCounts[data.type]++;
      io.emit('stampUpdate', { stampCounts });
      // スタンプアニメーション更新
      io.emit('stampAnimation', { type: data.type, icon: stamps.find(s => s.type === data.type)?.icon || "❓" });
    }
  });

  socket.on('sendVote', () => {
    // もっと聞きたい投票
    if (userVotes[socket.id] > 0) {
      userVotes[socket.id]--;
      votes++;
      io.emit('voteUpdate', { votes });
      // 一定割合超えたら自動延長 (例:2/3超えたら+10秒)
      let ratio = votes / connectionsCount;
      if (ratio > (2 / 3) && timerInterval) {
        remainingTime += 10;
        io.emit('timeUpdate', remainingTime);
        io.emit('timeExtended', 10);
      }
    }
  });

  socket.on('disconnect', () => {
    connectionsCount--;
    delete userVotes[socket.id];
    io.emit('connectionsUpdate', connectionsCount);
  });
});

server.listen(SERVER_PORT, () => {
  console.log(`Server running on port ${SERVER_PORT}`);
});
