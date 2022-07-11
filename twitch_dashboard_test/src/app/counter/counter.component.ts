import { Component, OnInit } from '@angular/core';
import {ApiService} from "../shared/services/api.service";
import {Subscription} from "rxjs";
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
  gameName = "Rainbow Six Siege";
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
              public apiService: ApiService) { }

  ngOnInit(): void {
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

      this.socket.on("updateCount", (count) => {
        this.countValue = count;
      });
  }

  setCard() {
    this.gameCard = this.isHandset ? this.cardForHandset : this.cardForWeb;
  }

  ngOnDestroy(){
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

}
