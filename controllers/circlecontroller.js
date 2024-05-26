const axios = require('axios');

const re_api_url = process.env.re_api_url;

exports.getCircle = async (req, res) => {
    const radius = parseFloat(req.params.radius_nmi);

    if (radius > 250) {
        return res.status(400).json({ error: 'Radius must not be more than 250 nautical miles' });
    }

    try {
        const response = await axios.get(`${re_api_url}/?circle=${req.params.lat},${req.params.lon},${radius}&jv2`);
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
};
