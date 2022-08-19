import * as WebSocket from 'ws';
import { MessageTypesToClient, UUID } from './messages';


export interface ClientSession {
  counter: number;
  timer: NodeJS.Timer;
  client: WebSocket;
}

export abstract class MessageServer<T> {

  protected clientSessions = new Map<UUID, ClientSession>();

  constructor(private readonly wsServer: WebSocket.Server) {
    this.wsServer.on('connection', this.subscribeToMessages);
    this.wsServer.on('error', this.cleanupDeadClients);
  }

  protected abstract handleMessage(sender: WebSocket, message: T): void;

  protected readonly subscribeToMessages = (ws: WebSocket): void => {
    ws.on('message', (data: WebSocket.Data) => {
      if (typeof data === 'string') {
        this.handleMessage(ws, JSON.parse(data));
      } else {
        console.log('Received data of unsupported type.');
      }
    });

    ws.on('error', this.cleanUpClientsWork.bind(this));
    ws.on('close', this.cleanUpClientsWork.bind(this));

  };

  private readonly cleanupDeadClients = (): void => {
    console.log('cleanupDeadClients')
    this.wsServer.clients.forEach(client => {
      if (this.isDead(client)) {
        this.wsServer.clients.delete(client);
      }
    });

  };

  private cleanUpClientsWork(): void {
    this.clientSessions.forEach((clientSession, uuid, map) => {
      if (!this.clients.has(clientSession.client)) {
        const timer = clientSession.timer;
        clearInterval(timer);
        map.delete(uuid);
      }
    })
  }

  protected broadcastExcept(currentClient: WebSocket, message: Readonly<T>): void {
    this.wsServer.clients.forEach(client => {
      if (this.isAlive(client) && client !== currentClient) {
        client.send(JSON.stringify(message));
      }
    });
  }

  protected broadcast(message: Readonly<T>): void {
    this.wsServer.clients.forEach(client => {
      client.send(JSON.stringify(message));
    });
  }

  protected replyTo(client: WebSocket, message: Readonly<T>): void {
    if (this.isAlive(client)) {
      client.send(JSON.stringify(message));
    }
  }

  protected get clients(): Set<WebSocket> {
    return this.wsServer.clients;
  }

  private isAlive(client: WebSocket): boolean {
    return !this.isDead(client);
  }

  private isDead(client: WebSocket): boolean {
    return (
      client.readyState === WebSocket.CLOSING ||
      client.readyState === WebSocket.CLOSED
    );
  }
}
