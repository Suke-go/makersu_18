import { io } from "socket.io-client";

// バックエンドURLは適宜変更
export const socket = io("https://makersu-18.onrender.com", {transports:['websocket']});
