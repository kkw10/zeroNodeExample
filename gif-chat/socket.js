const SocketIO = require('socket.io');
const axios = require('axios');

module.exports = (server, app, sessionMiddleware) => { // server = express server
  const io = SocketIO(server, { path: '/socket.io' });
  app.set('io', io); // 익스프레스의 변수 저장 방법

  // 네임스페이스
  // default : io.of('/')
  // 불필요한 실시간 데이터 통신을 막기 위해서 네임스페이스를 나눈다.
  const room = io.of('/room'); // 실시간으로 방목록 데이터를 가져온다.
  const chat = io.of('/chat'); // 실시간으로 채팅 데이터를 가져온다.

  // Socekt.IO에서도 미들웨어를 사용할 수 있다.
  io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res, next);
  });

  // Room Name Space
  room.on('connection', (socket) => {
    console.log('room 네임스페이스에 접속');

    const req = socket.request;
    const { headers: { referer } } = req; // req.headers.referer에 웹 주소가 들어있다.
    const roomId = referer
      .split('/')[referer.split('/').length - 1]
      .replace(/\?.+/, '');

    socket.on('disconnect', () => {
      console.log('room 네임스페이스 접속 해제');
      socket.leave(roomId);

      // 방에 인원이 하나도 없는 경우 방을 삭제한다.
      const currentRoom = socket.adapter.rooms[roomId];
      const userCount = currentRoom ? currentRoom.length : 0;

      if (userCount === 0) {
        axios.delete(`http://localhost:8005/room/${roomId}`)
          .then(() => {
            console.log('방 제거 요청 성공');
          })
          .catch((error) => {
            console.error(error);
          })
      } 
      else {
        socket.to(roomId).emit('exit', {
          user: 'system',
          chat: `${req.session.color}님이 퇴장하셨습니다.`,
        });
      }      
    })
  });

  // Chat Name Space
  chat.on('connection', (socket) => {
    console.log('chat 네임스페이스에 접속');

    const req = socket.request;
    const { headers: { referer } } = req; // req.headers.referer에 웹 주소가 들어있다.
    const roomId = referer
      .split('/')[referer.split('/').length - 1]
      .replace(/\?.+/, '');

    socket.join(roomId); // 방에 접속

    socket.to(roomId).emit('join', { // 그냥 emit은 모두에게 보내지만, to를 사용하면 해당 방에만 메세지를 보낸다.
      user: 'system',
      chat: `${req.session.color}님이 입장하셨습니다.`
    });

    socket.on('disconnect', () => {
      console.log('chat 네임스페이스 접속 해제');

      socket.leave(roomId); // 방에서 나가기
      const currentRoom = socket.adapter.rooms[roomId];
      const userCount = currentRoom ? currentRoom.length : 0;

      if (userCount === 0) {
        axios.delete(`http://localhost:8005/room/${roomId}`)
          .then(() => {
            console.log('방 제거 요청 성공');
          })
          .catch((error) => {
            console.error(error);
          })
      } 
      else {
        socket.to(roomId).emit('exit', {
          user: 'system',
          chat: `${req.session.color}님이 퇴장하셨습니다.`,
        });
      }
    })
  });

  // Default Name Space
  io.on('connection', (socket) => {
    const req = socket.request;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    console.log('새로운 클라이언트 접속!', ip, socket.id, req.ip);

    socket.on('disconnect', () => {
      console.log('클라이언트 접속 해제', ip, socket.id);
      clearInterval(socket.interval);
    });

    socket.on('error', (error) => {
      console.log(error);
    });

    socket.on('reply', (data) => {
      console.log(data);
    });

    socket.interval = setInterval(() => {
      socket.emit('news', 'Hello Socket.io');
    }, 3000)
  })
};

// 프록시 : 중계서버 ( 클라이언트와 서버 중간에 존재하는 서버 )