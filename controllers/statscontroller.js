const axios = require('axios');

const beast_clients_json_url = process.env.beast_clients_json_url;
const mlat_clients_json_url = process.env.mlat_clients_json_url;

const airports = require('../data/airports.json');

exports.getStats = async (req, res) => {
    try {
        const beastdataresponse = await axios.get(beast_clients_json_url);
        const mlatdataresponse = await axios.get(mlat_clients_json_url);
        const beastdata = beastdataresponse.data;
        const mlatdata = mlatdataresponse.data;
        const beaststats = beastdata.clients.find(client => client[1].includes(req.ip));
        const mlatstats = Object.values(mlatdata).find(client => client.source_ip === req.ip);

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

        if (error.code === 'ETIMEDOUT' || error.response?.status === 504) {
            res.status(504).json({ error: 'Gateway Timeout' });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};