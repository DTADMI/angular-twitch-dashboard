import { Component, OnInit } from '@angular/core';
import {ApiService} from "../../shared/services/api.service";
import {Subscription} from "rxjs";
import {environment} from "../../../environments/environment";
import {WebsocketService} from "../../shared/services/websocket.service";

@Component({
  selector: 'app-counter',
  templateUrl: './counter.component.html',
  styleUrls: ['./counter.component.css']
})
export class CounterComponent implements OnInit {

  countValue = 0;
  gameName = environment.games[0];
  gameCard: {
    id: string,
    name: string,
    box_art_url: string
  } = {
    id: '',
    name: '',
    box_art_url: ''
  };

  subscriptions: Subscription[] = [];
  rowHeight: number = window.innerHeight / 4;
  fetchingTimeInterval: number = 10;

  constructor(public apiService: ApiService,
              public websocketService: WebsocketService) {
    console.log('Constructing counter component');
  }



  ngOnInit(): void {
    console.log('CounterComponent NgOnInit called');
    console.log(`NgOnInit : Counter component : sending event startCount with game name ${this.gameName}`);
    this.websocketService.sendEvent('startCount', {games : [this.gameName], frequency : this.fetchingTimeInterval});
    console.log(`NgOnInit : Counter component : event startCount sent with game name ${this.gameName}`);

    this.subscriptions
      .push(
        this.apiService.getGame(this.gameName)
          .subscribe(
            {
              next: (response) => {
                console.table(response);
                this.gameCard = response.data[0];
                this.gameCard.box_art_url.replace("{width}", String(window.innerWidth)).replace("{height}", String(window.innerHeight));
              },
              error: (err: any) => {
                console.error(`Error while fetching the top games : ${err.message}`);
                alert(`Error while fetching the top games : ${err.message}`);
              },
              complete: () => {
              }
            }
          )
      );

    console.log(`CounterComponent Receiving event updateCount${this.gameName}`);
    let counterObservable = this.websocketService.onNewEvent(`updateCount${this.gameName}`);
    this.subscriptions
      .push(
        counterObservable.subscribe((count: any) => {
          if (typeof count === "number") {
            this.countValue =  count;
            console.log(`CounterComponent count updated for ${this.gameName} to ${count}`);
          }
        })
      );
  }

  ngOnDestroy(){
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.websocketService.sendEvent('stopCount', [this.gameName]);
    console.log(`CounterComponent event stopCount sent for ${this.gameName}`);
  }

}
