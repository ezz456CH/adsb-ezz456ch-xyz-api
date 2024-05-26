const axios = require('axios');

const re_api_url = process.env.re_api_url;

exports.getReg = async (req, res) => {
    try {
        const response = await axios.get(`${re_api_url}}/?find_reg=${req.params.reg}&jv2`);
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
}