import { io } from "socket.io-client";

// バックエンドURLは適宜変更
export const socket = io("http://localhost:4000", {transports:['websocket']});
