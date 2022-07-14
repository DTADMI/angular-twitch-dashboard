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
You are encouraged to submit all of your work at the end of the 1 week period even if it is not complete.
 
- document your API design (routes + payload)
- document your code only if needed
- document the steps required to run your project or to run tests
- use Markdown to share your documentation inside this code repository

Good luck, be creative and have fun :)


## Resolution

### Server

The node server is so far ready to deploy locally on port 3000, with the command line "nodemon server.js"
The route that are accessible are :
 - /server_api/token
 - /server_api/top_games
 - /server_api/game/:game_name
 - /server_api/gameStreams/:game_id
 - /server_api/gameStreams/after/:pagination

### Frontend

An angular application with:
 * A dashboard as the home page 
 * A Navigation Bar 
 * A page with the counter of views for Rainbow Six
 * A page with the comparative line chart 

ng serve to deploy on localhost:4200

The counter tab gives the total viewers count for Rainbow Six Siege every 8 seconds. Local tests show it's a rate at which the number limit of requests (800 requests per 60 seconds) is never reached because balanced by the refilling of the rate limit bucket refill at 1 every 75ms.
The websocket stays open even when the tab is switched and is only killed if the oauth token changes.
One of the games' names that was given as information was wrong on Twitch. It should have been : "Assassin's Creed: Odyssey" and not "Assassin’s Creed Odyssey".
The Line Chart Comparison is updating every 8 seconds too. It's using a websocket, the same one used for the count but updated to take an array as input and give back either a count or a table of object containing name and count, depending on the number of elements in the input array.
We're using highcharts for Angular, which might have some dependencies issues but it works so far.
The design of the Counter page could be remade : we'll get to it if we get some time.
We'll also get the some Unit testing and e2e tests if we get some time for that.
