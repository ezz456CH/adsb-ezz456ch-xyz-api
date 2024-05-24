const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
var favicon = require('serve-favicon');
var path = require('path')
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(cors());
app.use(favicon(path.join(__dirname,'public','images','favicon.ico')));

const beast_clients_json_url = process.env.beast_clients_json_url;
const mlat_clients_json_url = process.env.mlat_clients_json_url;
const url = process.env.server_url;
const urlport = process.env.server_port;

app.set('trust proxy', true)

app.get('/api/stats', async (req, res) => {
    try {
        const beastdataresponse = await axios.get(beast_clients_json_url);
        const mlatdataresponse = await axios.get(mlat_clients_json_url);
        const beastdata = beastdataresponse.data;
        const mlatdata = mlatdataresponse.data;
        const beaststats = beastdata.clients.find(client => client[1].includes(req.ip));
        const mlatstats = Object.values(mlatdata).find(client => client.source_ip === req.ip);

        if (beaststats || mlatdata) {
            const stats = {
                clients: {
                    beast: beaststats ? [
                        {
                            conn_time_s: beaststats[3],
                            ip: req.ip,
                            kbps: beaststats[2],
                            msg_s: beaststats[4],
                            pos: beaststats[8],
                            pos_s: beaststats[5],
                            uuid: beaststats[0]
                        }
                    ] : [],
                    mlat: mlatstats ? [
                        {
                            bad_sync_timeout: mlatstats.bad_sync_timeout,
                            connection: mlatstats.connection,
                            outlier_percent: mlatstats.outlier_percent,
                            peer_count: mlatstats.peer_count,
                            privacy: mlatstats.privacy,
                            user: mlatstats.user
                        }
                    ] : []
                }
            };
            res.json(stats);
        } else {
            res.status(404).json({ message: 'Not found' }); 
        }
    } catch (error) {
        console.log(error);
        
        if (error.code === 'ETIMEDOUT' || error.response?.status === 504) {
            res.status(504).json({ error: 'Gateway Timeout' });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

app.get('/api/v2/all', async (req, res) => {
    try {
        const response = await axios.get(`${url}:${urlport}/?all&jv2`);
        const data = response.data;

        res.json(data);
    } catch (error) {
        console.log(error);
        
        if (error.code === 'ETIMEDOUT' || error.response?.status === 504) {
            res.status(504).json({ error: 'Gateway Timeout' });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

app.get('/api/v2/all_with_pos', async (req, res) => {
    try {
        const response = await axios.get(`${url}:${urlport}/?all_with_pos&jv2`);
        const data = response.data;

        res.json(data);
    } catch (error) {
        console.log(error);
        
        if (error.code === 'ETIMEDOUT' || error.response?.status === 504) {
            res.status(504).json({ error: 'Gateway Timeout' });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

app.get('/api/v2/callsign/:callsign', async (req, res) => {
    try {
        const response = await axios.get(`${url}:${urlport}/?find_callsign=${req.params.callsign}&jv2`);
        const data = response.data;

        res.json(data);
    } catch (error) {
        console.log(error);
        
        if (error.code === 'ETIMEDOUT' || error.response?.status === 504) {
            res.status(504).json({ error: 'Gateway Timeout' });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

app.get('/api/v2/closest/:lat/:lon/:radius_mni', async (req, res) => {
    try {
        const response = await axios.get(`${url}:${urlport}/?closest=${req.params.lat},${req.params.lon},${req.params.radius_mni}&jv2`);
        const data = response.data;

        res.json(data);
    } catch (error) {
        console.log(error);
        
        if (error.code === 'ETIMEDOUT' || error.response?.status === 504) {
            res.status(504).json({ error: 'Gateway Timeout' });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

app.get('/api/v2/hex/:hex', async (req, res) => {
    try {
        const response = await axios.get(`${url}:${urlport}/?find_hex=${req.params.hex}&jv2`);
        const data = response.data;

        res.json(data);
    } catch (error) {
        console.log(error);
        
        if (error.code === 'ETIMEDOUT' || error.response?.status === 504) {
            res.status(504).json({ error: 'Gateway Timeout' });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
