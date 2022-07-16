import {Component, OnInit} from '@angular/core';
import * as Highcharts from 'highcharts';
import {environment} from "../../../environments/environment";
import {Subscription} from 'rxjs';
import {WebsocketService} from "../../shared/services/websocket.service";

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.css']
})
export class ChartsComponent implements OnInit {

  games = environment.games;
  subscriptions: Subscription[] = [];
  countValues: any = {};
  countersStatuses: any = {};
  numberChartValues = 8;
  timeInterval = 8;

  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {
    title: {
      text: 'Viewers Count live Comparison'
    },
    yAxis: {
      title: {
        text: 'Viewers count'
      }
    }
  };
  updateFlag = false;

  constructor(public websocketService: WebsocketService) {
    if(!this.chartOptions || !this.chartOptions.series || !this.chartOptions.series.length || !this.chartOptions.xAxis){
      this.initOptions();
    }
  }

  ngOnInit(): void {
    this.initOptions();
    this.websocketService.sendEvent('startCount', this.games);

    let counterObservable =  this.websocketService.onNewEvent(`updateAllCounts`);
    this.subscriptions
      .push(
        counterObservable.subscribe((countObjects:any) => {
          countObjects.forEach((countObject:any) => {
            let gameName = countObject.name;
            let count = countObject.count;
            if (typeof count === "number") {
              this.addNewCount({gameName, count});
              this.updateData();
            }
          })
        })
      );

  }

  initOptions() {
    this.chartOptions["series"] = [];
    let categories = [];
    categories[this.numberChartValues-1] = `now`;
    for(let i=0; i<=this.numberChartValues-2; i++) {
      categories[i] = `${this.timeInterval*(this.numberChartValues-i-1)} sec ago`;
    }
    this.chartOptions["xAxis"] =  {
      categories: categories,
      title: {
        text: 'Time'
      }
    };
    this.games.forEach((gameName) => {
      this.countersStatuses[gameName] = "on";
      this.countValues[gameName] = new Array(this.numberChartValues).fill(0);
      if (this.chartOptions.series) {
        this.chartOptions["series"].push({
          name: gameName,
          data: this.countValues[gameName],
          type: 'line'
        });
      }
    });
  }

  updateData = () => {
    this.games.forEach((gameName) => {
      // @ts-ignore
      this.chartOptions["series"].find( seriesSet => seriesSet.name === gameName).data = this.countValues[gameName];
    })
    this.updateFlag = true;
  }

  ngOnDestroy(){
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.websocketService.sendEvent('stopCount', this.games);
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
