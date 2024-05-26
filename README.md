# adsb.ezz456ch.xyz API

Just a simple API written on Node.js & Express.

The same API that used to get ADS-B, MLAT, or Mode-S data from adsb.ezz456ch.xyz.

## Endpoints

### /api/v2/all

Receive all aircraft data.

### /api/v2/all_with_pos

Receive all aircraft data with position.

### /api/v2/callsign

Receive aircraft data by Callsign.

### /api/v2/closest

Receive nearest aircraft data by latitude and longitude.

### /api/v2/hex

Receive aircraft data by Hex.

### /api/stats

Receive data and status of your ADS-B receiver.

## Usage (if you want to use it with your readsb server)

For ADS-B or Mode-S data, it is designed to work with readsb --net-api-port. You might need to edit /etc/default/readsb as follows:

```
NET_OPTIONS="[...] --net-api-port unix:/run/readsb/api.sock"
```

If you want to run this API, I recommend using pm2. I won't go into detail here.

You may also need to edit the web server configuration to get JSON files for clients.json from /run/mlat-server/.

## Example for lighttpd config for clients.json from /run/mlat-server/ and data/clients.json from readsb:

```
# If you want to allow more IP access you can use | to add more IP access
# In this example data/aircraft.json, data/clients.json and every .json file in /mlat would be needed to access by allowed IP
$HTTP["URL"] =~ "^/(data/aircraft\.json|data/clients\.json|mlat/.*\.json)$" {
    $HTTP["remoteip"] !~ "^(127.0.0.1|123.123.123.123)$" {
        url.access-deny = ("")
    }
}

# /mlat-map/ and /sync/ are just used for mlat-coverage-map remove them if you didn't use

alias.url += (
    "/mlat-map/" => "/opt/table/syncmap/",
    "/sync/" => "/opt/table/synctable/",
    "/mlat/" => "/run/mlat-server/"
)
```

## Example .env for API:

First copy .env_example to .env

```
cp .env_example .env
```

```                
beast_clients_json_url="http://example.com(or IP)/data/clients.json"
mlat_clients_json_url="http://example.com(or IP)/mlat/clients.json"

# readsb re-api
re_api_url="http://127.0.0.1/re-api/"
```

Finally, run the API with pm2.

```
pm2 start index.js --name 'adsb-ezz456ch-xyz-api'
```

## in case you want to proxy the API port with nginx:

```
server {
        listen 80;
        listen [::]:80;

        server_name api.example.com;

        location / {
                proxy_pass http://localhost:3001;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
                proxy_cache_bypass $http_upgrade;
        }
}
```

Also don't forget to add readsb re-api to nginx(we will listen only from 127.0.0.1)

```
server {
        listen 127.0.0.1:80;

        server_name localhost;

        location /re-api/ {
                gzip on;
                proxy_http_version 1.1;
                proxy_max_temp_file_size 0;
                proxy_set_header Connection $http_connection;
                proxy_set_header Host $http_host;
                proxy_pass http://unix:/run/readsb/api.sock:/$is_args$args;
        }
}
```