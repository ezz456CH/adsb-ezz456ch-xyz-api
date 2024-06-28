const axios = require('axios');
const fs = require('node:fs');

const airports = require('../data/airports.json');

exports.getStats = async (req, res) => {
    try {
        const ip = req.ip;

        let beastdata = null;
        let mlatdata = null;

        if (process.env.use_json_url === "true") {
            let beastjsontimeout = false
            let mlatjsontimeout = false

            try {
                const beastdataresponse = await axios.get(process.env.beast_clients_json_url);
                beastdata = beastdataresponse.data;
            } catch (err) {
                console.error(err);
                if (err.code === 'ETIMEDOUT' || err.response?.status === 504) {
                    beastjsontimeout = true;
                }
            }

            try {
                const mlatdataresponse = await axios.get(process.env.mlat_clients_json_url);
                mlatdata = mlatdataresponse.data;
            } catch (err) {
                console.error(err);
                if (err.code === 'ETIMEDOUT' || err.response?.status === 504) {
                    mlatjsontimeout = true;
                }
            }

            if (beastjsontimeout && mlatjsontimeout) {
                res.status(504).json({ error: 'Gateway Timeout' });
                return;
            }
        } else {
            let beastreadfilefailed = false
            let mlatreadfilefailed = false

            try {
                const beast_clients_json = fs.readFileSync(process.env.beast_clients_json, 'utf8');
                beastdata = JSON.parse(beast_clients_json);
            } catch (err) {
                console.error(err);
                beastreadfilefailed = true
            }

            try {
                const mlat_clients_json = fs.readFileSync(process.env.mlat_clients_json, 'utf8');
                mlatdata = JSON.parse(mlat_clients_json);
            } catch (err) {
                console.error(err);
                mlatreadfilefailed = true
            }

            if (beastreadfilefailed && mlatreadfilefailed) {
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
        }

        let beaststats = null;
        if (beastdata && beastdata.clients) {
            beaststats = beastdata.clients.find(client => client[1].includes(ip));
        }

        let mlatstats = null;
        if (mlatdata) {
            mlatstats = Object.values(mlatdata).find(client => client.source_ip === ip);
        }

        let closestairport = null;

        if (mlatstats && mlatstats.lat && mlatstats.lon) {
            const airportsArray = Object.values(airports);
            closestairport = airportsArray
                .map(airport => ({
                    icao: airport.icao,
                    iata: airport.iata,
                    name: airport.name,
                    country: airport.country,
                    tz: airport.tz,
                    distance: Math.sqrt(
                        Math.pow(mlatstats.lat - airport.lat, 2) +
                        Math.pow(mlatstats.lon - airport.lon, 2)
                    )
                }))
                .reduce((prev, curr) => (prev.distance < curr.distance ? prev : curr), {});
        }

        if (beaststats || mlatstats) {
            const stats = {
                clients: {
                    beast: beaststats ? [
                        {
                            conn_time_s: beaststats[3],
                            ip: ip,
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
                },
                closest_airport: closestairport ? [
                    {
                        icao: closestairport.icao,
                        iata: closestairport.iata,
                        name: closestairport.name,
                        country: closestairport.country,
                        tz: closestairport.tz
                    }
                ] : null
            };
            res.json(stats);
        } else {
            res.status(404).json({ message: 'Not found' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};