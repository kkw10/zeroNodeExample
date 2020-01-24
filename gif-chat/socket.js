const WebSocket = require('ws');

module.exports = (server) => { // server = express server
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    const ip = req.headers['x-forwarded-for'] // 프록시 거치기 전의 원래 아이피 
    || req.connection.remoteAddress; // 그냥 원래의 아아피

    console.log('클라이언트 접속');

    ws.on('message', (message) => {
      console.log(message, ip);
    });

    ws.on('error', (error) => {
      console.log(error, ip);
    });

    ws.on('close', () => {
      console.log('클라이언트 접속 해제', ip);
      clearInterval(ws.interval);
    });

    const interval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        // ws.CONNECTING : 연결 중
        // ws.OPEN : 연결 수립
        // ws.CLOSING : 종료 중
        // ws.CLOSED : 종료
        ws.send('서버에서 클라이언트로 메시지를 보낸다.')
      }
    }, 3000);

    ws.interval = interval;
  });
};

// 프록시 : 중계서버 ( 클라이언트와 서버 중간에 존재하는 서버 )