import React, {useEffect, useState} from 'react';

export default function CountdownTimer({time}){
  const [color, setColor] = useState('text-green-600');

  useEffect(()=>{
    if(time<=5) setColor('text-red-600 font-bold animate-pulse');
    else if(time<=10) setColor('text-yellow-600 font-bold');
    else setColor('text-green-600');
  },[time]);

  return (
    <div className={`text-4xl ${color}`}>{time}s</div>
  );
}
