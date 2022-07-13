import { Component, OnInit } from '@angular/core';
import {ApiService} from "../shared/services/api.service";
import {Observable, Subscription} from "rxjs";
import {BreakpointObserver, Breakpoints} from "@angular/cdk/layout";
import {map} from "rxjs/operators";
import { io } from "socket.io-client";
import {environment} from "../../environments/environment";

@Component({
  selector: 'app-counter',
  templateUrl: './counter.component.html',
  styleUrls: ['./counter.component.css']
})
export class CounterComponent implements OnInit {

  socket = io(environment.apiUrl, {transports: ['websocket', 'polling', 'flashsocket']});
  countValue = 0;
  gameName = environment.games[0];
  gameCard:any = {};
  cardForHandset: any = {};
  cardForWeb: any = {};


  subscriptions: Subscription[] = [];
  isHandset:boolean = false;
  isHandsetObserver = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => {
      return matches;
    })
  );

  constructor(private breakpointObserver: BreakpointObserver,
              public apiService: ApiService) {
    console.log('Constructing counter component');
    /*this.socket.emit('startCount', this.gameName);
    console.log(`Constructor : Counter component : event startCount sent with game name ${this.gameName}`);*/
  }

  ngOnInit(): void {
    console.log('CounterComponent NgOnInit called');
    console.log(`NgOnInit : Counter component : sending event startCount with game name ${this.gameName}`);
    this.socket.emit('startCount', this.gameName);
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
                this.cardForWeb.box_art_url.replace("{width}", "500").replace("{height}", "500");
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
    let counterObservable =  new Observable(observer => {
      this.socket.on(`updateCount${this.gameName}`, (count) => {
        observer.next(count);
      });
    });
    this.subscriptions
      .push(
        counterObservable.subscribe((count) => {
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
    this.socket.emit('stopCount', this.gameName);
    console.log(`CounterComponent event stopCount sent for ${this.gameName}`);
  }

}
