import { Component, OnInit } from '@angular/core';
import {ApiService} from "../shared/services/api.service";
import {Subscription} from "rxjs";
import {BreakpointObserver, Breakpoints} from "@angular/cdk/layout";
import {map} from "rxjs/operators";
import {environment} from "../../environments/environment";
import {WebsocketService} from "../shared/services/websocket.service";

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
  cardForHandset: {
    id: string,
    name: string,
    box_art_url: string
  } = {
    id: '',
    name: '',
    box_art_url: ''
  };
  cardForWeb: {
    id: string,
    name: string,
    box_art_url: string
  } = {
    id: '',
    name: '',
    box_art_url: ''
  };


  subscriptions: Subscription[] = [];
  isHandset:boolean = false;
  isHandsetObserver = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => {
      return matches;
    })
  );
  breakpoint: any ;
  rowHeight: number = window.innerHeight / 4;

  constructor(private breakpointObserver: BreakpointObserver,
              public apiService: ApiService,
              public websocketService: WebsocketService) {
    console.log('Constructing counter component');
  }


  onResize(event: any) {
    this.breakpoint = (event.target.innerWidth <= 400) ? 1 : 6;
  }

  ngOnInit(): void {
    this.breakpoint = (window.innerWidth <= 400) ? 1 : 6;
    console.log('CounterComponent NgOnInit called');
    console.log(`NgOnInit : Counter component : sending event startCount with game name ${this.gameName}`);
    this.websocketService.sendEvent('startCount', [this.gameName]);
    console.log(`NgOnInit : Counter component : event startCount sent with game name ${this.gameName}`);
    this.isHandsetObserver.subscribe(currentObservableValue => {
      this.isHandset = currentObservableValue;
      this.setCard();
    });

    this.subscriptions
      .push(
        this.apiService.getGame(this.gameName)
          .subscribe(
            {
              next: (response) => {
                console.table(response);
                this.cardForWeb = response.data[0];
                this.cardForWeb.box_art_url.replace("{width}", String(window.innerWidth)).replace("{height}", String(window.innerHeight));
                this.cardForHandset = this.cardForWeb;
                this.setCard();
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

  setCard() {
    this.gameCard = this.isHandset ? this.cardForHandset : this.cardForWeb;
  }

  ngOnDestroy(){
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.websocketService.sendEvent('stopCount', [this.gameName]);
    console.log(`CounterComponent event stopCount sent for ${this.gameName}`);
  }

}