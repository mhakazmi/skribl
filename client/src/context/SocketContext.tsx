import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

const socket: Socket = io({ autoConnect: false });

const SocketContext = createContext<Socket>(socket);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [, setConnected] = useState(false);

  useEffect(() => {
    socket.connect();
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    return () => {
      socket.disconnect();
    };
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket(): Socket {
  return useContext(SocketContext);
}
