require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios').default;
const cors = require('cors');
const request = require('request');
const http = require('http');
const socketio = require('socket.io');
const cluster = require('cluster');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const LISTENING_PORT = process.env.PORT || 3000;
const numCpus = os.cpus().length;

app.use(cors());
app.use(express.static(path.join(__dirname + '/dist/technical-test-darryl-tadmi')));

let ACCESS_TOKEN='';
const numberMaxRetries = 5;
const timeBeforeRetry = 5000;

const getToken = (url, callback) => {
    console.log(`Initializing getToken in process ${process.pid}`);
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

const initToken = () => {
    console.log(`Initializing initToken in process ${process.pid}`);
    if(!ACCESS_TOKEN) {
        getToken(process.env.GET_TOKEN, (res) => {
            ACCESS_TOKEN = res.body.access_token;
            console.log(`initToken ACCESS_TOKEN : ${ACCESS_TOKEN}`);
        });
    }
    return ACCESS_TOKEN;
}

const simpleRetry = async (callback, args) => {
  return new Promise((resolve, reject) => {
    const retry = () => {
      initToken();
      setTimeout(() => {
        args = args ? args : [];
        callback.apply(this, args)
          .then((response) => {
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      }, timeBeforeRetry);
    }
    retry();
  });
};

const fetchAndRetryIfNecessary = async (callAPIFn, args) => {
  return new Promise((resolve, reject) => {
    let retryCount = 0;
    const caller = () => {
      args = args ? args : [];
      callAPIFn.apply(this, args)
        .then((response) => {
        resolve(response);
      })
        .catch((error) => {
          if(error.status && error.status === 429 && retryCount < numberMaxRetries) {
            retryCount++;
            setTimeout(caller, timeBeforeRetry);
          } else {
            reject(error);
          }
        });
    }
    retryCount = 1;
    caller();
  });
};


const handleError = (error, callback, args) => {
  if (error.response) {
    console.log(error.response.data);
    console.log(error.response.status);
    console.log(error.response.headers);
    if (error.response.status === 401) {
      simpleRetry(callback, args)
        .then((result) => {
          return result;
        }).catch(err => {
        console.error(err);
        throw err;
      });
    }
    throw error.response;
  }
  if (error.status === 401) {
    simpleRetry(callback, args)
      .then((result) => {
        return result;
      }).catch(err => {
      console.error(err);
      throw err;
    });
  }
  throw error;
}

const fetchGame = async (gameName) => {
    console.log(`Initializing fetchGame in process ${process.pid} for ${gameName}`);
    try {
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
      )
      result.data.fetchingName = gameName;
      return result.data;
    } catch (error) {
      return handleError(error, fetchGame, [gameName]);
    }
}

const fetchStreams = async (gameId, after) => {
    console.log(`Initializing fetchStreams in process ${process.pid} for ${gameId}, ${after}`);
    try {
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
    } catch (error) {
      return handleError(error, fetchStreams, [gameId, after]);
    }
}

const fetchGameStreams = async (gameId) => {
    console.log(`Initializing fetchGameStreams in process ${process.pid} for ${gameId}`);
    try {
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
    } catch (error) {
      return handleError(error, fetchGameStreams, [gameId]);
    }
}

const fetchMoreGameStreams = async (pagination) => {
    console.log(`Initializing fetchMoreGameStreams in process ${process.pid} for ${pagination}`);
    try {
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
    } catch (error) {
      return handleError(error, fetchMoreGameStreams, [pagination]);
    }
}

const fetchTopGames = async () => {
  console.log(`Initializing fetchTopGames in process ${process.pid}`);
  try {
    const result = await axios.get(process.env.GET_TOP_GAMES,
      {
        headers: {
          'Client-ID': process.env.CLIENT_ID,
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        }
      }
    );
    return result.data;
  } catch (error) {
    return handleError(error, fetchTopGames);
  }
}

app.get('/server_api/token', (request, response) => {
    getToken(process.env.GET_TOKEN, (res) => {
        ACCESS_TOKEN = res.body.access_token;
        response.send(res.body.access_token);
    })
});

app.get('/server_api/top_games', (request, response) => {
  fetchAndRetryIfNecessary(fetchTopGames)
    .then((res) => {
      console.log(`fetchTopGames resolved with : `);
      console.table(res);
        response.json(res);
    }).catch(err => {
        console.error(err);
        response.send(err);
    });
});

app.get('/server_api/game/:game_name', (request, response) => {
    const { game_name } = request.params;
  fetchAndRetryIfNecessary(fetchGame, [game_name])
    .then((res) => {
        response.json(res);
    }).catch(err => {
        console.error(err);
        response.send(err);
    });
});

app.get('/server_api/streams/:game_id/:after', (request, response) => {
    const { game_id, after } = request.params;
  fetchAndRetryIfNecessary(fetchStreams, [game_id, after])
    .then((res) => {
        response.json(res);
    }).catch(err => {
        console.error(err);
        response.send(err);
    });
});

app.get('/server_api/gameStreams/:game_id', (request, response) => {
    const { game_id } = request.params;
  fetchAndRetryIfNecessary(fetchGameStreams, [game_id])
    .then((res) => {
        response.json(res);
    }).catch(err => {
        console.error(err);
        response.send(err);
    });
});

app.get('/server_api/gameStreams/after/:pagination', (request, response) => {
    const { pagination } = request.params;
  fetchAndRetryIfNecessary(fetchMoreGameStreams, [pagination])
    .then((res) => {
        response.json(res);
    }).catch(err => {
        console.error(err);
        response.send(err);
    });
});

app.get('/*', function(req, res){
    res.sendFile(path.join(__dirname + '/dist/technical-test-darryl-tadmi/index.html'));
});

let counterRunning = false;
const limit = 50;
let viewerCounts = [];
let displayedCounts = [];
let gameNamesToFetch = [];

const fetchGameViewersCount = async (gamesSearchInfo) => {
    try {
        console.log(`Initializing fetchGameViewersCount in process ${process.pid} : gamesSearchInfo : `);
        console.table(gamesSearchInfo);
        let newGamesSearchInfo = [];
        if(gamesSearchInfo.length) {
            let promises = [];
            gamesSearchInfo.forEach(gameSearchInfo => {
                let game_id = gameSearchInfo.id;
                let page = gameSearchInfo.page;
                let after = gameSearchInfo.after;
                let gameName = gameSearchInfo.name;
                console.log(`Initializing fetchGameViewersCount in process ${process.pid} for game: ${gameName} ${game_id}, page: ${page} and after: ${after}`);
                promises.push(fetchAndRetryIfNecessary(fetchStreams, [game_id, after]));
            });

            let results = await Promise.all(promises);/*.then((results) => {*/
            console.log(`fetchGameViewersCount : fetchstream all promises Results : ${results.length} values in results`);
            if(results.length && results[0].data.length) {
                results.forEach(result => {
                    if(result.data.length) {
                        console.log(`fetchGameViewersCount : fetchstream resolved to Result : ${result.data.length} values in result.data`);
                        let game_id = result.data[0].game_id;
                        console.log(`fetchGameViewersCount : fetchstream resolved : game_id ::  ${game_id}`);
                        let after = gamesSearchInfo.find(gameSearchInfo => gameSearchInfo.id.toString() === game_id.toString()).after;
                        let gameName = gamesSearchInfo.find(gameSearchInfo => gameSearchInfo.id.toString() === game_id.toString()).name;
                        let page = gamesSearchInfo.find(gameSearchInfo => gameSearchInfo.id.toString() === game_id.toString()).page;

                        console.log(`fetchStreams(${game_id}, ${after}) resolved for game ${gameName}`);
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

                        if (result.hasOwnProperty('pagination') && result.pagination.hasOwnProperty('cursor')) {
                            page++;
                            if (page > limit) {
                                displayedCounts[index] = viewerCounts[index];
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
                return displayedCounts;
            }
        }
        displayedCounts = viewerCounts;
        return displayedCounts;
    } catch (err) {
        console.error('An error occurred while executing fetchGameViewersCount', err);
    }

}

const loopOnFetchingViewersCount = (gamesInfo, fetchingTimeInterval) => {
    try {
        console.log(`Initializing loopOnFetchingViewersCount in process ${process.pid} for games info`);
        console.table(gamesInfo);
        if(counterRunning) {
            let gamesSearchInfo = [];
            let index = 0;
            gamesInfo.forEach((gameInfo) => {
                index = viewerCounts.findIndex(element => gameInfo.id.toString() === element.id.toString());
                if(index !== -1) {
                    viewerCounts[index].count = 0;
                } else {
                    viewerCounts.push({id: gameInfo.id, name: gameInfo.fetchingName, count: 0});
                }
                gamesSearchInfo.push({id : gameInfo.id, page: 0, after: '', name: gameInfo.fetchingName});
            })

            fetchGameViewersCount(gamesSearchInfo)
                .then((countsObject) => {
                    if(gamesInfo.length === 1) {
                        index = displayedCounts.findIndex(element => gamesInfo[0].id.toString() === element.id.toString());
                        this.socket.emit(`updateCount${gamesInfo[0].fetchingName}`, displayedCounts[index].count);
                    } else {
                        this.socket.emit(`updateAllCounts`, displayedCounts);
                    }

                    setTimeout(() => {
                        loopOnFetchingViewersCount(gamesInfo, fetchingTimeInterval);
                    }, fetchingTimeInterval);
                })
                .catch (err => {
                    console.error(err)
                });
        }
    }catch (err) {
        console.error('An error occurred while executing loopOnFetchingViewersCount', err);
    }
}

const updateViewerCount = (gameNames, fetchingTimeInterval) => {
    try {
        console.log(`Initializing updateViewerCount in process ${process.pid}`);
        //Fetch Game data
        let promises = [];
        gameNames.forEach(gameName => {
            promises.push(fetchAndRetryIfNecessary(fetchGame, [gameName]));
        })

        Promise.all(promises).then((results) => {
            console.log(`fetchGame resolved for`);
            console.table(gameNames);
            if (results.length) {
                let gamesInfo = [];
                results.forEach((result) => {
                    gamesInfo.push({name: result.data[0].name, id: result.data[0].id, fetchingName: result.fetchingName});
                })
                loopOnFetchingViewersCount(gamesInfo, fetchingTimeInterval);
            } else {
                console.error('No data found while executing fetchGame');
            }
        }).catch ((err) => {
            console.error('An error occurred during updateViewerCount', err);
        });
    }catch (err) {
        console.error('An error occurred during updateViewerCount', err);
    }
}

const listenSocketConnection = () => {
    try {
        console.log(`Initializing listenSocketConnection in process ${process.pid}`);
        //Whenever someone connects this gets executed
        io.sockets.on('connection', socket => {
            console.log('A user connected');
            this.socket = socket;

            this.socket.on('startCount', (data) => {
                console.log(`Starting counter in process ${process.pid} with data :`);
                console.table(data);
                gameNamesToFetch = data.games;
                let fetchingTimeInterval = data.frequency*1000;
                console.log(`Counting viewers for games :`);
                console.table(gameNamesToFetch);
                counterRunning = true;
                console.log(`Counter started`);
                console.log(`Starting the counter`);
                if(gameNamesToFetch.length){
                    viewerCounts = [];
                    displayedCounts = [];
                    updateViewerCount(gameNamesToFetch, fetchingTimeInterval);
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
                gameNamesToFetch = [];
            });

            this.socket.on('endConnection', () => {
                this.socket.disconnect(0);
            });

            //Whenever someone disconnects this piece of code executed
            this.socket.on('disconnect',  () => {
                console.log('A user disconnected');
                gameNamesToFetch = [];
            });
        });
    } catch (err) {
        console.error('An error occurred while listening to websocket connection', err);
    }
}

const initServer = () => {
    console.log(`Initializing initServer for process ${process.pid}`);
    initToken();
    setTimeout(() => {
        console.log(`initServer for ${process.pid} ACCESS_TOKEN : ${ACCESS_TOKEN}`);
        listenSocketConnection();
    }, 1000);
}

if(cluster.isMaster) {
  for(let i = 0; i < numCpus; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} exited with code ${code} and signal ${signal}`);
    cluster.fork();
  })
} else {
  server.listen(LISTENING_PORT, () => {
    console.log(`listening server ${process.pid} on port ${LISTENING_PORT}...`);
    initServer();
  });
}
