# Ubisoft-DNA Full-Stack technical test

For this project, you will be fetching and displaying data from the Twitch API. You can find the documentation for the Twitch API [here](https://dev.twitch.tv/docs/api/)

**Please note that in order to access the Twitch API, you'll have to create a Twitch account.** More on this below.

## Objective

Your goal will be to build a simple web dashboard with the following 2 features:

1. You will need to create a Web Socket connection to display the number of viewers for Rainbow Six Siege that automatically updates a counter in real time (keep in mind the request throttling limit of the Twitch API).
2. We would like a line Chart that compares in real time the number of viewers for the following 3 games:
    - Rainbow Six Siege
https://www.twitch.tv/directory/game/Tom%20Clancy's%20Rainbow%20Six%3A%20Siege
    - Far Cry 5
https://www.twitch.tv/directory/game/Far%20Cry%205
    - Assassin’s Creed Odyssey
https://www.twitch.tv/directory/game/Assassin's%20Creed%20Odyssey

## Technologies

Front-end: **Ideally Angular/RxJS/Typescript to match the DNA stack** 
Back-end: **your choice**

## Signing up for Twitch

- Sign up for a Twitch account.
- Enable 2-factor authentication on your Twitch account.
- Go to the [Twitch Developer site](https://dev.twitch.tv/) to create a new App.
- Get your Client-ID and Client Secret by clicking on Manage App. You will need these to authenticate with the Twitch API.

### Authenticating with Twitch API

To get your Twitch API `access_token`, you will need to use:
`GET https://id.twitch.tv/oauth2/token?client_id=[YOUR-CLIENT-ID]&client_secret=[YOUR-SECRET]&grant_type=client_credentials`

### Twitch API Examples

To get the data for one game, you can use:
`GET https://api.twitch.tv/helix/games?name=Rainbow Six Siege`

To get a list of top games:
`GET https://api.twitch.tv/helix/games/top`

To get Streams for a game (which contains a viewer_count):
`GET https://api.twitch.tv/helix/streams?game_id=493057`

To get more Streams for a game:
`GET https://api.twitch.tv/helix/streams?after=[PAGINATION_CURSOR]`

The `after` value is the cursor that is returned from the first Streams endpoint. The cursor allows for forward pagination. Consult the [Get Streams](https://dev.twitch.tv/docs/api/reference#get-streams) reference to learn more about the query parameters.

For the requests above, you will need to pass the following headers: 
- Client-ID: [YOUR-CLIENT-ID]
- Authorization: Bearer [YOUR-ACCESS-TOKEN]

Consult the [Twitch API Reference](https://dev.twitch.tv/docs/api/reference) to learn more.

## Rules 

The project should not take more than 1 week.
To submit your project, please push the code in this repository (You'll have access to this repository for a week). 
Also, please have the project hosted online using a service such as Heroku and provide us with the link. 
You are encouraged to submit all of your work at the end of the 1-week period even if it is not complete.
 
- document your API design (routes + payload)
- document your code only if needed
- document the steps required to run your project or to run tests
- use Markdown to share your documentation inside this code repository

Good luck, be creative and have fun :)


## Resolution

### Server

The Nodejs server provides some http connection, to access the twitch API.
The (http) routes that are accessible are :
 - POST /server_api/token (to get the API token required for the connection to be established)
 - GET /server_api/top_games (to get an array of the information objects of the top games)
 - GET/server_api/game/:game_name (to get data about the game whose name is passed as parameter)
 - GET /server_api/gameStreams/:game_id (to get data about the streams of the game whose id is passed as parameter)
 - GET /server_api/gameStreams/after/:pagination  (to get the following data about the streams of the game whose pagination is passed as parameter)

The first route and the 2 last ones are not really used externally, but the server uses them internally, as well as a function to get directly the following pages by passing the id and pagination.

Any other route is redirected to the static Home page of the client.

The server also uses a websocket connection for the live data transfer.
It listens to the following events:

 - connection (it signals a user connection to the websocket)
 - startCount (it takes an array of names of games for which to get viewers count)
 - stopCount (it takes an array of names of games for which to stop the viewers count)
 - endConnection (it disconnects the socket)
 - disconnect (it signals a user disconnection from the websocket)

### Frontend

An angular application with:
 * A dashboard as the home page 
 * A Navigation Bar 
 * A page with the counter of views for Rainbow Six
 * A page with the comparative line chart 

ng serve to deploy on localhost:4200

## Components
The application consists in :
* A home page
* A Viewers Counter Page 
* A Line chart page

These 3 are connected through a responsive navigation bar on the right, that disappears as a menu icon on the top left, when on mobile size.


### Home page
The Home page is both a welcome page for the application and a way to get familiarized with the API, on a development standpoint. It displays the top N games, as a dashboard, in a grid.

The Home page has a dropdown to change the number of top games displayed. It starts at 4 minimum and only displays multiples of 4 games, with the maximum depending on the number of games returned by the API. It's a design choice to avoid dealing with ugly cards placements on the page.

### Counter page

The counter tab gives the total viewers count for Rainbow Six Siege every 8 seconds. Local tests show it's a rate at which the number limit of requests (800 requests per 60 seconds) is never reached because balanced by the refilling of the rate limit bucket refill at 1 every 75ms. Also, the values recuperated from the API for the viewers count don't change that much, even at that speed of a refreshing every 8 seconds.

The counter is centered on the page, with a caption underneath it. It is backgrounded by the image associated with the game on Twitch. Unfortunately, the image that Twitch gives back for Rainbow Six is the stock one, as if they don't have a proper one. We won't change it, as it's an API issue, in case they update their database.

### Live line chart page

The Line Chart Comparison is updating every 8 seconds too. It's using a websocket, the same one used for the counter page, but updated to take an array as input and give back either a count or a table of object containing name and count, depending on the number of elements in the input array.

We're using highcharts for Angular, which might have some dependencies issues, but it works so far.

## Services

the client uses 2 services to access the routes furnished by the server.

### The websocket service 

The websocket goes through a service that is used by both Counter and Charts.
The socket is hence single and doesn't need to be disconnected when switching component. 
The websocket stays open even when the tab is switched and is only killed if the oauth token changes.
The websocket service gives 2 methods :
 * sendEvent(event: string, args: any) : it allows the client to send commends to the server websocket. The payload is always an array but containing one or more game names.
 * onNewEvent(event: string) : it allows the client to listen to any server socket command. It is used to receive either "updateCount[gameName]" for the count of a singular game, in which case the result is a single number or updateAllCounts for a list of games, in which case the result is an array containing  name, id and count for each game passed as input.


### The api service

It uses a http client to communicate with the http routes given by the server. It serves : 

* getTopGames(): Observable<[{data: {
  id: string,
  name: string,
  box_art_url: string
  }}]>
* getGame(gameName:string): Observable<[{data : {
  id: string,
  name: string,
  box_art_url: string
  }}]> 
* getStreams(gameId:string, after?:string): Observable<any>
* getGameStreams(gameId:string): Observable<any>
* getGameNextStreams(pagination:string): Observable<any>

Les 3 derniers points d'accès n'ont finalement pas été utilisé pour cet exercice.


### Some functional difficulties
* One of the games' names that was given as information was wrong on Twitch. It should have been : "Assassin's Creed: Odyssey" and not "Assassin’s Creed Odyssey".

* Also, the names of the games differ from the games' information query to the streams one. We had to go around that, and it impacted the code strategy.


### Heroku deployment
The application is deployed on Heroku and accessible at  https://twitch-dashboard-test-ubisoft.herokuapp.com/home .


### Additional design

As mentioned previously, the home page is a bonus, out of the scope of this exercice but which gives a better design to the application.

We also change the favicon.ico to a multicolor Ubisoft logo.

As for the colors used on the application, we tried to use the Ubisoft palette available online : http://www.colorhunter.com/tag/ubisoft/1


## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.
