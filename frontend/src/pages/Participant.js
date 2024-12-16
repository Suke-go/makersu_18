import React, {useEffect,useState} from 'react';
import {socket} from '../utils/socket';

export default function Participant(){
  const [question,setQuestion]=useState(null);
  const [time,setTime]=useState(0);
  const [votes,setVotes]=useState(0);
  const [connections,setConnections]=useState(0);
  const [stamp,setStamp]=useState('');
  const [voteLeft,setVoteLeft]=useState(3);

  useEffect(()=>{
    socket.on('init',(data)=>{
      setQuestion(data.question);
      setTime(data.time);
      setVotes(data.votes);
    });
    socket.on('questionUpdate',(q)=>{
      setQuestion(q);
      setVoteLeft(3); // 質問変わったら投票数リセット想定(サーバで管理だがUI側も合わせる)
    });
    socket.on('timeUpdate',(t)=>setTime(t));
    socket.on('voteUpdate',({votes})=>{setVotes(votes);});
    socket.on('connectionsUpdate',(c)=>setConnections(c));

    return ()=>{
      socket.off('init');
      socket.off('questionUpdate');
      socket.off('timeUpdate');
      socket.off('voteUpdate');
      socket.off('connectionsUpdate');
    };
  },[]);

  function sendStamp(type){
    socket.emit('sendStamp',{type});
    setStamp(type);
    setTimeout(()=>setStamp(''),1500);
  }

  function sendVote(){
    if(voteLeft>0){
      socket.emit('sendVote');
      setVoteLeft(voteLeft-1);
    }
  }

  return (
    <div className="p-4 text-center">
      <h1 className="text-2xl font-bold mb-4 text-accent">参加者画面</h1>
      <div className="mb-4">
        <div className="text-xl mb-2">{question?question.text:"質問待ち..."}</div>
        <div className="text-lg">残り時間: {time}s</div>
        <div className="text-sm text-gray-600">参加者数: {connections}</div>
      </div>
      <div className="mb-4">
        <button onClick={()=>sendStamp('like')} className="mx-2 text-2xl">👍</button>
        <button onClick={()=>sendStamp('wow')} className="mx-2 text-2xl">😲</button>
        <button onClick={()=>sendStamp('agree')} className="mx-2 text-2xl">🗳️</button>
        <button onClick={()=>sendStamp('question')} className="mx-2 text-2xl">❓</button>
      </div>
      <div className="mb-4">
        <button onClick={sendVote} className="bg-accent text-white px-4 py-2 rounded">もっと聞きたい！</button>
        <div className="text-sm mt-2">残り投票: {voteLeft}票</div>
      </div>
      {stamp && (
        <div className="fixed top-1/2 left-1/2 text-5xl animate-bounce">
          {stamp==='like'?'👍': stamp==='wow'?'😲': stamp==='agree'?'🗳️':'❓'}
        </div>
      )}
    </div>
  );
}
