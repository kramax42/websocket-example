import React, { useEffect, useState, useCallback } from 'react';
import { Message, MessageTypesToServer, MessageTypesToClient } from '../lib/interfaces';
import { WebsocketController } from '../lib/websocket-controller';

const server = new WebsocketController();

const App: React.FC = () => {
  const [counter, setCounter] = useState<number>(0);
  const [clientsAmount, setClientsAmount] = useState<number>(1);
  const [correlationId, setCorrelationId] = useState<string>('null');
  const [lastMsgToServer, setLastMsgToServer] = useState<MessageTypesToServer>(MessageTypesToServer.Reset);


  const handleData = useCallback((message: Message) => {
    setCounter(message.payload);
    setCorrelationId(message.correlationId);
  }, []);

  const handleClientsAmount = useCallback((message: Message) => {
    setClientsAmount(message.payload as number);
  }, []);

  const handleStart = () => {
    server.send({
      type: MessageTypesToServer.Start,
      correlationId: correlationId !== 'null' ? correlationId : undefined,
    });
    setLastMsgToServer(MessageTypesToServer.Start);
  }

  const handlePause = () => {
    server.send({
      type: MessageTypesToServer.Pause,
      correlationId
    });
    setLastMsgToServer(MessageTypesToServer.Pause);
  }

  const handleReset = () => {
    server.send({
      type: MessageTypesToServer.Reset,
      correlationId
    });
    setLastMsgToServer(MessageTypesToServer.Reset);
    setCounter(0);
  }

  const handleContinue = () => {
    server.send({
      type: MessageTypesToServer.Continue,
      correlationId
    });
    setLastMsgToServer(MessageTypesToServer.Continue);
  }

  const handleServerMessages = useCallback((message: Message) => {
    switch (message.type) {
      case MessageTypesToClient.Data: return handleData(message);
      case MessageTypesToClient.ClientsAmount: return handleClientsAmount(message);
      default: {
        console.log(`Received message of unknown type: "${message.type}"`);
      }
    }
  }, [
    handleData,
    handleClientsAmount,
  ]);

  useEffect(() => {
    async function initializeWsServer() {
      await server.connect(handleServerMessages);
    }
    initializeWsServer();

    return () => server.disconnect();
  }, [handleServerMessages]);


  return (
    <main>
      <div className='flexContainer'>
        <h1>Clients amount:</h1>
        <span className='badge'>{clientsAmount}</span>
      </div>
      <div className='flexContainer'>
        <h1>Your UUID:</h1>
        <span className='badge'>{correlationId}</span>
      </div>

      <h1 className='title'>WebSocket counter</h1>
      <div className='counter'>
        <span >{counter}</span>
      </div>

      <div className='flexContainer'>
        <button disabled={lastMsgToServer === MessageTypesToServer.Pause || lastMsgToServer === MessageTypesToServer.Start || lastMsgToServer === MessageTypesToServer.Continue} onClick={handleStart}>Start</button>
        <button disabled={lastMsgToServer !== MessageTypesToServer.Pause} onClick={handleContinue}>Continue</button>
        <button disabled={lastMsgToServer === MessageTypesToServer.Reset} onClick={handlePause}>Pause</button>
        <button disabled={lastMsgToServer === MessageTypesToServer.Reset} onClick={handleReset}>Reset</button>
      </div >
    </main >
  );
}

export default App;
