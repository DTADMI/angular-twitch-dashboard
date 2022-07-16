import { Component } from '@angular/core';
import {map} from 'rxjs/operators';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import {ApiService} from "../../shared/services/api.service";
import {Subject, Subscription} from "rxjs";
import { NotifierService } from '../../shared/services/notifier.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  /** Based on the screen size, switch from standard to one column per row */

  cards: { image: string, title: string, cols: number, rows: number }[] = [];
  cardsForHandset: { image: string, title: string, cols: number, rows: number }[] = [];
  cardsForWeb: { image: string, title: string, cols: number, rows: number }[] = [];

  isFetching = true;

  subscriptions: Subscription[] = [];
  numberOfCardsSubject:Subject<number> = new Subject<number>();

  isHandset:boolean = false;
  isHandsetObserver = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => {
      return matches;
    })
  );
  numberOfCardsDisplayed: number = 4;
  minNumberOfCardsDisplayed: number = 4;
  maxNumberOfCardsDisplayed: number = 64;
  numberList:number[] = [];
  games: any[] = [];
  displayedGames: any[] = [];

  constructor(private breakpointObserver: BreakpointObserver,
              public apiService: ApiService,
              public notifiersService: NotifierService) {}

  ngOnInit(){
    this.isHandsetObserver.subscribe(currentObservableValue => {
      this.isHandset = currentObservableValue;
      this.loadCards();
    });

    this.subscriptions
      .push(
        this.apiService.getTopGames()
          .subscribe(
          {
            next: (response) => {
              this.games = response.data;
              this.maxNumberOfCardsDisplayed = this.games.length;
              this.numberList = Array.from({length: this.maxNumberOfCardsDisplayed}, (_, index) => index+1).filter((value:number) => value % 4 === 0 && value >= this.minNumberOfCardsDisplayed && value <= this.maxNumberOfCardsDisplayed);
              this.isFetching =false;
              this.filterCards();
            },
            error: (err:any) => {
              console.error(`Error while fetching the top games : ${err.message}`);
              /*alert(`Error while fetching the top games : ${err.message}`);*/
              this.notifiersService.showNotification(err.message, 'OK', 'error');
            },
            complete: () => {}
          }
        )
      );

    this.subscriptions
      .push(this.numberOfCardsSubject
          .subscribe(
          {
            next: (numberOfCards) => {
              this.numberOfCardsDisplayed = numberOfCards;
              this.filterCards();
            },
            error: (err:any) => {
              console.error(`Error while fetching the top games : ${err.message}`);
              alert(`Error while fetching the top games : ${err.message}`);
            },
            complete: () => {}
          }
        )
      );
  }

  filterCards = () => {
    this.displayedGames = this.games.slice(0, this.numberOfCardsDisplayed)
    this.cardsForHandset = this.displayedGames.map((game: { id: string; name: string; box_art_url: string; }) => {return { image: game.box_art_url.replace("{width}", "331").replace("{height}", "331"), title: game.name, cols: 2, rows: 1 }});
    this.cardsForWeb = this.displayedGames.map((game: { id: string; name: string; box_art_url: string; }) => {return { image: game.box_art_url.replace("{width}", "331").replace("{height}", "331"), title: game.name, cols: 1, rows: 1 }});
    this.loadCards();
  }

  loadCards(){
    this.cards = this.isHandset ? this.cardsForHandset : this.cardsForWeb;
  }

  ngOnDestroy(){
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onNumberChangeChange(obj:any) {
    this.numberOfCardsSubject.next(obj.value);
  }
}
