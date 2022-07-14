import { Injectable } from '@angular/core';
import {io, Socket} from "socket.io-client";
import {environment} from "../../../environments/environment";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  private socket: Socket;

  constructor() {
    console.log('Constructing WebSocketService');
    console.log('Connecting Socket');
    this.socket = io(environment.apiUrl, {transports: ['websocket', 'polling', 'flashsocket']});
    console.table(this.socket);
  }

  sendEvent(event: string, args: any) {
    console.log(`Sending event ${event} with arguments : `);
    console.table(args);
    this.socket.emit(event, args);
    console.log(`Event ${event} sent with arguments : `);
    console.table(args);
  }

  onNewEvent(event: string) {
    console.log(`Receiving event ${event}`);
    return new Observable(observer => {
      this.socket.on(event, (data: Number | string) =>{
        observer.next(data);
      });
    });
  }
}
