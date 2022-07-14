require('dotenv').config();
const express = require('express');
const axios = require('axios').default;
const cors = require('cors');
const request = require('request');
const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const LISTENING_PORT = process.env.SERVER_PORT || 3000;

app.use(cors());

let ACCESS_TOKEN='';

const getToken = async (url, callback) => {
    console.log(`Initializing getToken`);
    const options = {
        url: process.env.GET_TOKEN,
        json: true,
        body: {
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: 'client_credentials'
        }
    };

    request.post(options, (err, res, body) => {
        if(err){
            return console.error(err);
        }
        console.log(`Status: ${res.statusCode}`);
        callback(res);
    });
}

const initToken = async () => {
    console.log(`Initializing initToken`);
    if(!ACCESS_TOKEN) {
        await getToken(process.env.GET_TOKEN, (res) => {
            ACCESS_TOKEN = res.body.access_token;
            console.log(`initToken ACCESS_TOKEN : ${ACCESS_TOKEN}`);
        });
    }
    return ACCESS_TOKEN;
}

const fetchGame = async (gameName) => {
    console.log(`Initializing fetchGame for ${gameName}`);
    const result = await axios.get(process.env.GET_GAME,
        {
                headers: {
                    'Client-ID': process.env.CLIENT_ID,
                    'Authorization': `Bearer ${ACCESS_TOKEN}`
                 },
                params: {
                     name: gameName
                }
            }
    );
    result.data.fetchingName = gameName;
    return result.data;
}

const fetchStreams = async (gameId, after) => {
    /*console.log(`Initializing fetchStreams for ${gameId}, pagination ${after}`);*/
    const result = await axios.get(process.env.GET_GAME_STREAMS,
        {
            headers: {
                'Client-ID': process.env.CLIENT_ID,
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            },
            params: {
                first: 100,
                game_id: gameId,
                ...(after ? { after: after } : {})
            }
        }
    );
    return result.data;
}

const fetchGameStreams = async (gameId) => {
    console.log(`Initializing fetchGameStreams for ${gameId}`);
    const result = await axios.get(process.env.GET_GAME_STREAMS,
        {
            headers: {
                'Client-ID': process.env.CLIENT_ID,
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            },
            params: {
                game_id: gameId
            }
        }
    );
    return result.data;
}

const fetchMoreGameStreams = async (pagination) => {
    console.log(`Initializing fetchMoreGameStreams for ${pagination}`);
    const result = await axios.get(process.env.GET_GAME_STREAMS,
        {
            headers: {
                'Client-ID': process.env.CLIENT_ID,
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            },
            params: {
                after: pagination
            }
        }
    );
    return result.data;
}

const fetchTopGames = async () => {
    console.log(`Initializing fetchTopGames`);
    const result = await axios.get(process.env.GET_TOP_GAMES,
        {
                headers: {
                    'Client-ID': process.env.CLIENT_ID,
                    'Authorization': `Bearer ${ACCESS_TOKEN}`
                 }
            }
    );
    return result.data;
}

app.get('/server_api/token', (request, response) => {
    getToken(process.env.GET_TOKEN, (res) => {
        ACCESS_TOKEN = res.body.access_token;
        response.send(res.body.access_token);
    })
});

app.get('/server_api/top_games', (request, response) => {
    fetchTopGames().then((res) => {
        response.json(res);
    }).catch(err => {
        console.error(err);
        response.send(err);
    });
});

app.get('/server_api/game/:game_name', (request, response) => {
    const { game_name } = request.params;
    fetchGame(game_name).then((res) => {
        response.json(res);
    }).catch(err => {
        console.error(err);
        response.send(err);
    });
});

app.get('/server_api/streams/:game_id/:after', (request, response) => {
    const { game_id, after } = request.params;
    fetchStreams(game_id, after).then((res) => {
        response.json(res);
    }).catch(err => {
        console.error(err);
        response.send(err);
    });
});

app.get('/server_api/gameStreams/:game_id', (request, response) => {
    const { game_id } = request.params;
    fetchGameStreams(game_id).then((res) => {
        response.json(res);
    }).catch(err => {
        console.error(err);
        response.send(err);
    });
});

app.get('/server_api/gameStreams/after/:pagination', (request, response) => {
    const { pagination } = request.params;
    fetchMoreGameStreams(pagination).then((res) => {
        response.json(res);
    }).catch(err => {
        console.error(err);
        response.send(err);
    });
});

let counterRunning = false;
const listenSocketConnection = () => {
    console.log(`Initializing listenSocketConnection`);
    //Whenever someone connects this gets executed
    io.sockets.on('connection', socket => {
        console.log('A user connected');
        this.socket = socket;

        this.socket.on('startCount', (data) => {
            console.log(`Starting counter with data :`);
            console.table(data);
            let gameNames = data;
            console.log(`Counting viewers for games :`);
            console.table(gameNames);
            counterRunning = true;
            console.log(`Counter started`);
            console.log(`Starting the counter`);
            if(gameNames.length){
                updateViewerCount(gameNames);
            } else {
                console.error('No data received through startCount websocket connection');
            }
        });
        this.socket.on('stopCount', (data) => {
            console.log(`Stopping counter with data :`);
            console.table(data);
            data.forEach((gameName) => {
                console.log(`Viewers counting stopped for game ${gameName}`);
                counterRunning = false;
                console.log(`Counter stopped`);
            });
        });

        this.socket.on('endConnection', () => {
            this.socket.disconnect(0);
        });

        //Whenever someone disconnects this piece of code executed
        this.socket.on('disconnect',  () => {
            console.log('A user disconnected');
        });
    });
}

const initServer = async () => {
    console.log(`Initializing initServer`);
    await initToken();
    setTimeout(() => {
        console.log(`initServer ACCESS_TOKEN : ${ACCESS_TOKEN}`);
        listenSocketConnection();
    }, 1000);
}


const limit = 50;
let viewerCounts = [];
let displayedCounts = [];
console.log(`Viewer count: `);
console.table(viewerCounts);
console.log(`Displayed count: `);
console.table(displayedCounts);
const fetchGameViewersCount = async (gamesSearchInfo) => {
    /*return new Promise((resolve, reject) => {*/
        console.log(`Initializing fetchGameViewersCount : gamesSearchInfo : `);
        console.table(gamesSearchInfo);
        let funcEnded = false;
        let newGamesSearchInfo = [];
        if(gamesSearchInfo.length) {
            let promises = [];
            gamesSearchInfo.forEach(gameSearchInfo => {
                let game_id = gameSearchInfo.id;
                let page = gameSearchInfo.page;
                let after = gameSearchInfo.after;
                let gameName = gameSearchInfo.name;
                console.log(`Initializing fetchGameViewersCount for game: ${gameName} ${game_id}, page: ${page} and after: ${after}`);
                console.log(`fetchGameViewersCount : counterRunning : ${counterRunning}`);
                promises.push(fetchStreams(game_id, after));
            });

            let results = await Promise.all(promises);/*.then((results) => {*/
            console.log(`fetchGameViewersCount : fetchstream all promises Results : ${results.length} values in results`);
            /*console.table(results);*/
            if(results.length && results[0].data.length) {
                results.forEach(result => {
                    if(result.data.length) {
                        console.log(`fetchGameViewersCount : fetchstream resolved to Result : ${result.data.length} values in result.data`);
                        /*console.table(result.data);
                        console.table(result.data[0]);*/
                        let game_id = result.data[0].game_id;
                        console.log(`fetchGameViewersCount : fetchstream resolved : game_id ::  ${game_id}`);
                        let after = gamesSearchInfo.find(gameSearchInfo => gameSearchInfo.id.toString() === game_id.toString()).after;
                        let gameName = gamesSearchInfo.find(gameSearchInfo => gameSearchInfo.id.toString() === game_id.toString()).name;
                        let page = gamesSearchInfo.find(gameSearchInfo => gameSearchInfo.id.toString() === game_id.toString()).page;

                        console.log(`fetchStreams(${game_id}, ${after}) resolved for game ${gameName}`);
                        console.log(`fetchGameViewersCount : Viewer count: `);
                        console.table(viewerCounts);
                        let initialValue = 0;
                        let newCount = result.data.reduce((previousValue, currentValue) => {
                            return previousValue + currentValue.viewer_count;
                        }, initialValue);
                        let index = viewerCounts.findIndex(element => game_id.toString() === element.id.toString());

                        if (index !== -1) {
                            viewerCounts[index].count += newCount;
                        } else {
                            viewerCounts.push({id: game_id, name: gameName, count: newCount});
                            index = viewerCounts.length - 1;
                        }

                        console.log(`fetchGameViewersCount Viewer count: ${viewerCounts[index].count}`);
                        if (result.hasOwnProperty('pagination') && result.pagination.hasOwnProperty('cursor')) {
                            page++;
                            if (page > limit) {
                                console.log(`fetchGameViewersCount! Limit passed! Returning viewerCount : ${viewerCounts[index].count}`);
                                displayedCounts[index] = viewerCounts[index];
                                console.log(`fetchGameViewersCount! Limit passed! Returning displayedCount : ${displayedCounts[index]}`);
                                console.log('Limit reached Resolving fetchGameViewersCount with : ');
                                console.table(displayedCounts);
                                /*resolve(displayedCounts);*/
                                return displayedCounts;
                            } else {
                                newGamesSearchInfo.push({
                                    id: game_id,
                                    page,
                                    after: result.pagination.cursor,
                                    name: gameName
                                });
                            }
                        }
                    }
                });

                if(newGamesSearchInfo.length) {
                    console.log(`fetchGameViewersCount Looping back in to continue with: `);
                    console.table(newGamesSearchInfo);
                    let countsObject = await fetchGameViewersCount(newGamesSearchInfo);
                    console.log(`fetchGameViewersCount : countsObject: `);
                    console.table(countsObject);
                }
            } else {
                console.log('No more data was found while executing fetchGameViewersCount');
                displayedCounts = viewerCounts;
                console.log('No more data Resolving fetchGameViewersCount with : ');
                console.table(displayedCounts);
                /*resolve(displayedCounts);*/
                return displayedCounts;
            }

            /*}).catch(err => {
                console.error('An error occurred while executing fetchGameViewersCount', err);
                funcEnded = true;
            });*/

        }
            displayedCounts = viewerCounts;
            console.log('Final Resolving fetchGameViewersCount with : ');
            console.table(displayedCounts);
            /*resolve(displayedCounts);*/

            return displayedCounts;
    /*});*/
}

const loopOnFetchingViewersCount = async (gamesInfo) => {
        console.log(`Initializing loopOnFetchingViewersCount for games info`);
        console.table(gamesInfo);
        /*console.table(this.socket);*/
        console.log(`loopOnFetchingViewersCount : counterRunning : ${counterRunning}`);
        if(counterRunning) {
            let gamesSearchInfo = [];
            let index = 0;
            gamesInfo.forEach((gameInfo) => {
                console.log(`loopOnFetchingViewersCount : Viewer count: `);
                console.table(viewerCounts);
                index = viewerCounts.findIndex(element => gameInfo.id.toString() === element.id.toString());
                if(index !== -1) {
                    console.log(`loopOnFetchingViewersCount: index : ${index}`);
                    viewerCounts[index].count = 0;
                } else {
                    viewerCounts.push({id: gameInfo.id, name: gameInfo.fetchingName, count: 0});
                }
                console.log(`loopOnFetchingViewersCount : Viewer count: `);
                console.table(viewerCounts);
                gamesSearchInfo.push({id : gameInfo.id, page: 0, after: '', name: gameInfo.fetchingName});
            })

            let countsObject = await fetchGameViewersCount(gamesSearchInfo)
                /*.then((countsObject) => {*/
                    console.log(`loopOnFetchingViewersCount : fetchGameViewersCount : Viewer count: `);
                    console.table(viewerCounts);
                    console.log(`loopOnFetchingViewersCount : fetchGameViewersCount : countsObject: `);
                    console.table(countsObject);
                    console.log(`loopOnFetchingViewersCount : fetchGameViewersCount : Displayed count: `);
                    console.table(displayedCounts);
                    if(gamesInfo.length === 1) {
                        index = displayedCounts.findIndex(element => gamesInfo[0].id.toString() === element.id.toString());
                        this.socket.emit(`updateCount${gamesInfo[0].fetchingName}`, displayedCounts[index].count);
                    } else {
                        this.socket.emit(`updateAllCounts`, displayedCounts);
                    }

                    setTimeout(() => {
                        loopOnFetchingViewersCount(gamesInfo);
                    }, 8000);

                /*})
                .catch(err => {
                    console.error('An error occurred while executing loopOnFetchingViewersCount', err);
                });*/
        }
}

const updateViewerCount = async (gameNames) => {
    console.log(`Initializing updateViewerCount for ${this.socket}`);
    console.log(`UpdateViewerCount : counterRunning : ${counterRunning}`);
    //Fetch Game data
    let promises = [];
    gameNames.forEach(gameName => {
        promises.push(fetchGame(gameName));
    })

    let results = await Promise.all(promises);/*.then(async (results) => {*/
        console.log(`fetchGame resolved for`);
        console.table(gameNames);
        console.log(`UpdateViewerCount : fetchGame : counterRunning : ${counterRunning}`);
        if (results.length) {
            let gamesInfo = [];
            results.forEach((result) => {
                /*console.table(result.data);*/
                console.log(`All promises resolved with ${result.data.length} results`);
                gamesInfo.push({name: result.data[0].name, id: result.data[0].id, fetchingName: result.fetchingName});
                console.log(`games Info: `);
                console.table(gamesInfo);
            })
            await loopOnFetchingViewersCount(gamesInfo);
        } else {
            console.error('No data found while executing fetchGame');
        }


   /* })
    .catch(err => {
        console.error('An error occurred during updateViewerCount', err);
    });*/

}

server.listen(LISTENING_PORT, () => {
    console.log(`listening on port ${LISTENING_PORT}...`);
    initServer();
});
