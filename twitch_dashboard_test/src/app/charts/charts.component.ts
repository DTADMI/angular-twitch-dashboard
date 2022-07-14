import { Component, OnInit } from '@angular/core';
import * as Highcharts from 'highcharts';
import {environment} from "../../environments/environment";
import {Observable, Subscription} from 'rxjs';
import {io} from "socket.io-client";
import {ApiService} from "../shared/services/api.service";

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.css']
})
export class ChartsComponent implements OnInit {

  socket = io(environment.apiUrl, {transports: ['websocket', 'polling', 'flashsocket']});
  games = environment.games;
  subscriptions: Subscription[] = [];
  observables: any = {};
  countValues: any = {};
  countersStatuses: any = {};
  numberChartValues = 3;

  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {
    title: {
      text: 'Viewers Count live Comparison'
    },
    xAxis: {
      categories: ["16 sec ago", "8 sec ago", "now",],
      title: {
        text: 'Time'
      }
    },
    yAxis: {
      title: {
        text: 'Viewers count'
      }
    },
    series: [
      {
        name: this.games[0],
        data: [0, 0, 0],
        type: 'line'
      },
      {
        name: this.games[1],
        data: [0, 0, 0],
        type: 'line'
      },
      {
        name: this.games[2],
        data: [0, 0, 0],
        type: 'line'
      }
    ]
  };
  updateFlag = false;

  constructor(public apiService: ApiService) {
    console.log('Constructing charts component');
  }

  ngOnInit(): void {
    console.log('ChartsComponent NgOnInit called');
    console.log(`NgOnInit : Charts component : sending event startCount with game names`);
    console.table(this.games);
    this.games.forEach((game) => {
      this.countersStatuses[game] = "on";
      this.countValues[game]=[0, 0, 0];
    })
    this.socket.emit('startCount', this.games);

    let counterObservable =  new Observable(observer => {
      this.socket.on(`updateAllCounts`, (countObjects) => {
        observer.next(countObjects);
      });
    });
    this.subscriptions
      .push(
        counterObservable.subscribe((countObjects:any) => {
          countObjects.forEach((countObject:any) => {
            let gameName = countObject.name;
            let count = countObject.count;
            if (typeof count === "number") {
              this.addNewCount({gameName, count});
              this.updateData();
              console.log(`ChartsComponent count updated for ${gameName} to ${count}`);
            }
          })

        })
      );

  }

  updateData = () => {
    this.chartOptions = {
      title: {
        text: 'Line chart live comparison'
      },
      xAxis: {
        categories: ["16 sec ago", "8 sec ago", "now",],
        title: {
          text: 'Time'
        }
      },
      yAxis: {
        title: {
          text: 'Viewers count'
        }
      },
      series: [
        {
          name: this.games[0],
          data: this.countValues[this.games[0]],
          type: 'line'
        },
        {
          name: this.games[1],
          data: this.countValues[this.games[1]],
          type: 'line'
        },
        {
          name: this.games[2],
          data: this.countValues[this.games[2]],
          type: 'line'
        }
      ]
    };
    this.updateFlag = true;
  }

  ngOnDestroy(){
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.socket.emit('stopCount', this.games);
    console.log(`ChartsComponent event stopCount sent for `);
    console.table(this.games);
  }

  addNewCount = (data: any) => {
    let {gameName, count} = data;
    if(this.countersStatuses[gameName] === "on") {
      this.countersStatuses[gameName] = "running";
      for(let i=0; i<this.numberChartValues; i++) {
        this.countValues[gameName][i] = count;
      }
    } else if(this.countersStatuses[gameName] === "running") {
      this.countValues[gameName].shift()
      this.countValues[gameName].push(count);
    }
  }

}
