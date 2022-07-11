import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private _http:HttpClient) {

  }

  getTopGames(): Observable<any> {
    return this._http.get(`/server_api/top_games`);
  }

  getGame(gameName:string): Observable<any> {
    return this._http.get(`/server_api/game/${gameName}`);
  }

  getGameStreams(gameId:string): Observable<any> {
    return this._http.get(`/server_api/gameStreams/${gameId}`);
  }

  getGameNextStreams(pagination:string): Observable<any> {
    return this._http.get(`/server_api/gameStreams/after/${pagination}`);
  }

}
