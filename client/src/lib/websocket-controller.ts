import { ConnectToWs, Message } from './interfaces';

export class WebsocketController {
  private websocket!: Promise<WebSocket>;
  private onMessage!: (messages: Message) => void;

  private get url(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const hostname = process.env.REACT_APP_WS_PROXY_HOSTNAME || window.location.host;
    return `${protocol}://${hostname}`;
  }

  connect({ onMessage, onWsOpen, onWsClose, onWsError }: ConnectToWs): Promise<WebSocket> {
    this.onMessage = onMessage;
    return this.websocket = new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url);
      ws.addEventListener('open', () => {
        onWsOpen();
        resolve(ws)
      });
      ws.addEventListener('error', err => {
        onWsError();
        reject(err);
      });

      ws.addEventListener('close', err => {
        onWsClose();
      });
      ws.addEventListener('message', this.onMessageReceived);
    });
  }

  disconnect() {
    this.websocket.then(ws => ws.close());
  }

  private readonly onMessageReceived = (event: MessageEvent) => {
    const message = JSON.parse(event.data) as Message;
    this.onMessage(message);
  }

  async send(message: Partial<Message>): Promise<Message> {
    return new Promise<Message>(async (resolve, reject) => {
      this.websocket.then(
        ws => ws.send(JSON.stringify(message)),
      );
    });
  }
}