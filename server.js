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

const listenSocketConnection = () => {
    console.log(`Initializing listenSocketConnection`);
    //Whenever someone connects this gets executed
    io.sockets.on('connection', socket => {
        console.log('A user connected');

        updateViewerCount(socket);

        //Whenever someone disconnects this piece of code executed
        socket.on('disconnect',  () => {
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
let viewerCount = 0;
let displayedCount = 0;
const game_name = process.env.GAME_1;
console.log(`Viewer count: ${viewerCount}`);
console.log(`Displayed count: ${displayedCount}`);
const fetchGameViewersCount = async (game_id, page, after) => {
    /*console.log(`Initializing fetchAllStreams for game: ${game_id}, page: ${page} and after: ${after}`);*/
    page = page ? page : 0;
    fetchStreams(game_id, after)
        .then((res) => {
            /*console.log(`fetchStreams(${game_id}, ${after}) resolved`);*/
            let initialValue = 0;
            viewerCount += res.data.reduce((previousValue, currentValue) => {
                return previousValue + currentValue.viewer_count;
            }, initialValue);
            console.log(`fetchGameViewersCount Viewer count: ${viewerCount}`);
            if(res.hasOwnProperty('pagination') && res.pagination.hasOwnProperty('cursor')) {
                page++;
                if(page > limit) {
                    console.log(`fetchGameViewersCount! Limit passed! Returning viewerCount : ${viewerCount}`);
                    displayedCount = viewerCount;
                    console.log(`fetchGameViewersCount! Limit passed! Returning displayedCount : ${displayedCount}`);
                    return ;
                }
                fetchGameViewersCount(game_id, page, res.pagination.cursor);
            }

            console.log(`fetchGameViewersCount! viewerCount : ${viewerCount}`);
            displayedCount = viewerCount;
            console.log(`fetchGameViewersCount! displayedCount : ${displayedCount}`);

        }).catch(err => {
        console.error(err);
    });
}

const updateViewerCount = async (socket) => {
    /*console.log(`Initializing updateViewerCount for ${socket}`);*/
    viewerCount = 0;
    //Fetch Game data
    let gameData = {};

    fetchGame(game_name).then((res) => {
        /*console.log(`fetchGame ${game_name} resolved`);*/
        gameData = res.data[0];
        const game_id = gameData.id;
        console.log(`game_id: ${game_id}`);
        fetchGameViewersCount(game_id, 0, '')
            .then((res) => {
                /*console.log(`fetchAllStreams(${game_id} , 0, '') resolved`);*/
                gameData.viewerCount = viewerCount;

                console.log(`updateViewerCount! Viewer count: ${viewerCount}`);
                console.log(`updateViewerCount! Displayed count: ${displayedCount}`);
                socket.emit('updateCount', displayedCount);

                setTimeout(() => {
                    updateViewerCount(socket);
                }, 8000);
            }).catch(err => {
            console.error(err);
        });
    })
    .catch(err => {
        console.error(err);
    });
}

const LISTENING_PORT = process.env.SERVER_PORT || 3000;
server.listen(LISTENING_PORT, () => {
    console.log(`listening on port ${LISTENING_PORT}...`);
    initServer();
});
