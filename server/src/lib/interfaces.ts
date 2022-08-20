import * as WebSocket from 'ws';

// Alias string with UUID type for readability purpose.
// It hint that the message correlation ID
// is not an arbitrary string, but represents a particular data format.
export type UUID = string;

export interface ClientSession {
  counter: number;
  timer: NodeJS.Timer;
  client: WebSocket;
}

export interface Message {
  correlationId: UUID;
  type: string;
  payload?: any;
}

export enum MessageTypesToClient {
  ClientsAmount = 'ClientsAmount',
  Data = 'Data',
}


export enum MessageTypesToServer {
  Start = 'Start',
  Continue = 'Continue',
  Pause = 'Pause',
  Reset = 'Reset',
}