import * as WebSocket from 'ws';
import { uuid } from './lib/make-uuid';
import { ClientSession, MessageServer } from './message-server';
import { Message, MessageTypesToClient, MessageTypesToServer, UUID } from './messages';

export class CounterServer extends MessageServer<Message> {

    protected handleMessage(sender: WebSocket, message: Message): void {
        switch (message.type) {
            case MessageTypesToServer.Start: return this.start(sender, message);
            case MessageTypesToServer.Pause: return this.pause(sender, message);
            case MessageTypesToServer.Continue: return this.continue(sender, message);
            case MessageTypesToServer.Reset: return this.reset(sender, message);

            default: {
                console.log(`Received message of unknown type: "${message.type}"`);
            }
        }
    }

    protected startClientAmountInterval(): void {
        this.clientAmountInterval = setInterval(() => {
            this.broadcast({
                type: MessageTypesToClient.ClientsAmount,
                payload: this.clients.size,
                correlationId: 'serverId',
            })
        }, 2200)
    }

    protected stopClientAmountInterval(): void {
        clearInterval(this.clientAmountInterval);
    }

    private start(requestor: WebSocket, message: Message): void {
        let payload = 0;
        const correlationId = message.correlationId || uuid() as UUID;
        this.makeInterval(requestor, correlationId, payload);
    }

    private continue(requestor: WebSocket, message: Message): void {
        const correlationId = message.correlationId;
        let payload = 0;

        if (this.clientSessions.has(correlationId)) {
            payload = this.clientSessions.get(correlationId)!.counter;
        }

        this.makeInterval(requestor, correlationId, payload);
    }

    private makeInterval(requestor: WebSocket, correlationId: UUID, payload: any) {



        const timer = setInterval(() => {
            payload++;
            this.replyTo(requestor, {
                type: MessageTypesToClient.Data,
                correlationId,
                payload
            });

            if (this.clientSessions.has(correlationId)) {
                this.clientSessions.set(correlationId, {
                    timer: this.clientSessions.get(correlationId)!.timer,
                    client: this.clientSessions.get(correlationId)!.client,
                    counter: payload,
                });
            }
            console.log(correlationId, this.clientSessions.size);
        }, 150)


        const clientSession: ClientSession = {
            counter: payload,
            timer,
            client: requestor,
        }
        this.clientSessions.set(correlationId, clientSession);

    }


    private pause(requestor: WebSocket, message: Message): void {
        const id = message.correlationId;
        if (this.clientSessions.has(id)) {
            const timer = this.clientSessions.get(id)!.timer;
            clearInterval(timer);
            this.clientSessions.set(id, {
                timer,
                client: this.clientSessions.get(id)!.client,
                counter: this.clientSessions.get(id)!.counter,
            });

        }

    }

    private reset(requestor: WebSocket, message: Message): void {
        const id = message.correlationId;
        if (this.clientSessions.has(id)) {
            const timer = this.clientSessions.get(id)!.timer;
            clearInterval(timer);
            this.clientSessions.set(id, {
                timer,
                client: this.clientSessions.get(id)!.client,
                counter: 0,
            });
        }
    }

}

