import { Component } from '@angular/core';
import {map, take} from 'rxjs/operators';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import {ApiService} from "../shared/services/api.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  /** Based on the screen size, switch from standard to one column per row */

  cards: any[] = [];
  cardsForHandset: any[] = [];
  cardsForWeb: any[] = [];

  isHandset:boolean = false;
  isHandsetObserver = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => {
      if (matches) {
        return true/*[
          { title: 'Card 1', cols: 2, rows: 1 },
          { title: 'Card 2', cols: 2, rows: 1 },
          { title: 'Card 3', cols: 2, rows: 1 },
          { title: 'Card 4', cols: 2, rows: 1 }
        ]*/;
      }

      return false/*[
        { title: 'Card 1', cols: 1, rows: 1 },
        { title: 'Card 2', cols: 1, rows: 1 },
        { title: 'Card 3', cols: 1, rows: 2 },
        { title: 'Card 4', cols: 1, rows: 1 }
      ]*/;
    })
  );

  constructor(private breakpointObserver: BreakpointObserver,
              public apiService: ApiService) {}

  ngOnInit(){
    this.isHandsetObserver.subscribe(currentObservableValue => {
      this.isHandset = currentObservableValue;
      this.loadCards();
    });

    this.apiService.getTopGames()
      .subscribe(
      {
        next: (response) => {
          console.table(response);
          let games = response.data.slice(0, 4)
          this.cardsForHandset = games.map((game: { id: string; name: string; box_art_url: string; }) => {return { title: game.name, cols: 2, rows: 1 }});
          this.cardsForWeb = games.map((game: { id: string; name: string; box_art_url: string; }) => {return { title: game.name, cols: 1, rows: 1 }});
          this.loadCards();
        },
        error: (err:any) => {},
        complete: () => {}
      }
    );
  }

  loadCards(){
    this.cards = this.isHandset ? this.cardsForHandset : this.cardsForWeb;
  }
}
