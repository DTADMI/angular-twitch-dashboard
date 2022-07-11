require('dotenv').config();
const express = require('express');
const axios = require('axios').default;
const cors = require('cors');
const request = require('request');

const app = express();

app.use(cors());

let ACCESS_TOKEN='';

const getToken = (url, callback) => {

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
        console.table(body);

        callback(res);
    });
}

const initServer = () => {
    getToken(process.env.GET_TOKEN, (res) => {
        ACCESS_TOKEN = res.body.access_token;
        console.log(`ACCESS_TOKEN : ${ACCESS_TOKEN}`);
    });
}

initServer();

const fetchGame = async (access_token, gameName) => {
    console.log(`access_token : ${access_token}`)
    const result = await axios.get(process.env.GET_GAME,
        {
                headers: {
                    'Client-ID': process.env.CLIENT_ID,
                    'Authorization': `Bearer ${access_token}`
                 },
                params: {
                     name: gameName
                }
            }
    );
    console.table(result.data);
    return result.data;
}

const fetchGameStreams = async (access_token, gameId) => {
    console.log(`access_token : ${access_token}`)
    const result = await axios.get(process.env.GET_GAME_STREAMS,
        {
            headers: {
                'Client-ID': process.env.CLIENT_ID,
                'Authorization': `Bearer ${access_token}`
            },
            params: {
                game_id: gameId
            }
        }
    );
    console.table(result.data);
    return result.data;
}

const fetchMoreGameStreams = async (access_token, pagination) => {
    console.log(`access_token : ${access_token}`)
    const result = await axios.get(process.env.GET_GAME_STREAMS,
        {
            headers: {
                'Client-ID': process.env.CLIENT_ID,
                'Authorization': `Bearer ${access_token}`
            },
            params: {
                after: pagination
            }
        }
    );
    console.table(result.data);
    return result.data;
}

const fetchTopGames = async (access_token) => {
    console.log(`access_token : ${access_token}`)
    const result = await axios.get(process.env.GET_TOP_GAMES,
        {
                headers: {
                    'Client-ID': process.env.CLIENT_ID,
                    'Authorization': `Bearer ${access_token}`
                 }
            }
    );
    console.table(result.data);
    return result.data;
}

app.get('/server_api/token', (request, response) => {
    getToken(process.env.GET_TOKEN, (res) => {
        ACCESS_TOKEN = res.body.access_token;
        response.send(res.body.access_token);
    })
});

app.get('/server_api/top_games', (request, response) => {
    if(!ACCESS_TOKEN) {
        initServer();
    }

    console.log(`ACCESS_TOKEN : ${ACCESS_TOKEN}`);
    fetchTopGames(ACCESS_TOKEN).then((res) => {
        console.table(res.data);
        response.json(res);
    }).catch(err => {
        console.error(err);
        response.send(err);
    });

});

app.get('/server_api/game/:game_name', (request, response) => {
    if(!ACCESS_TOKEN) {
        initServer();
    }

    console.log(`ACCESS_TOKEN : ${ACCESS_TOKEN}`);
    const { game_name } = request.params;
    fetchGame(ACCESS_TOKEN, game_name).then((res) => {
        console.table(res.data);
        response.json(res);
    }).catch(err => {
        console.error(err);
        response.send(err);
    });

});

app.get('/server_api/gameStreams/:game_id', (request, response) => {
    if(!ACCESS_TOKEN) {
        initServer();
    }

    console.log(`ACCESS_TOKEN : ${ACCESS_TOKEN}`);
    const { game_id } = request.params;
    fetchGameStreams(ACCESS_TOKEN, game_id).then((res) => {
        console.table(res.data);
        response.json(res);
    }).catch(err => {
        console.error(err);
        response.send(err);
    });

});

app.get('/server_api/gameStreams/after/:pagination', (request, response) => {
    if(!ACCESS_TOKEN) {
        initServer();
    }

    console.log(`ACCESS_TOKEN : ${ACCESS_TOKEN}`);
    const { pagination } = request.params;
    fetchMoreGameStreams(ACCESS_TOKEN, pagination).then((res) => {
        console.table(res.data);
        response.json(res);
    }).catch(err => {
        console.error(err);
        response.send(err);
    });

});

const LISTENING_PORT = process.env.SERVER_PORT || 3000;
app.listen(LISTENING_PORT, () => {
    console.log(`listening on port ${LISTENING_PORT}...`)
});
