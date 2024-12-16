// 投票割合を表示するバーグラフ
import React from 'react';

export default function VoteBar({votes, total}){
  const ratio = total>0 ? (votes/total)*100 : 0;
  return (
    <div className="flex flex-col items-start w-64">
      <div className="mb-1 text-sm">もっと聞きたい！({votes}/{total})</div>
      <div className="vote-bar-bg">
        <div className="vote-bar-fill" style={{width: ratio+'%'}}></div>
      </div>
    </div>
  );
}
