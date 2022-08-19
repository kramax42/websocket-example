import React, { useEffect, useState, useCallback } from 'react';
import { Message, MessageTypesToServer, MessageTypesToClient } from '../lib/messages';
import { WebsocketController } from '../lib/websocket-controller';

const server = new WebsocketController();

const App: React.FC = () => {
  const [counter, setCounter] = useState<number>(0);
  const [clientsAmount, setClientsAmount] = useState<number>(0);
  const [correlationId, setCorrelationId] = useState<string>('null');
  const [lastMsgToServer, setLastMsgToServer] = useState<MessageTypesToServer>(MessageTypesToServer.Stop);


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

  const handleContinue = () => {
    // setCounter(message.payload);
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
      // case MessageTypes.NewBlockAnnouncement: return handleNewBlockAnnouncement(message);
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

      <div className='paramLine'>
        <h1>Clients amount</h1>
        <span className='badge'>{clientsAmount}</span>
      </div>
      <div className='paramLine'>
        <h1>Your ID</h1>
        <span className='badge'>{correlationId}</span>
      </div>
      <h1>Counter</h1>
      <aside><p>{counter}</p></aside>
      <section>
        {lastMsgToServer === MessageTypesToServer.Pause
          ?
          <button onClick={handleContinue}>Continue</button>
          :
          <button onClick={handleStart}>Start</button>
        }
        <button onClick={handlePause}>Pause</button>
      </section>
    </main >
  );
}


export default App;
