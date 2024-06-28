# adsb.ezz456ch.xyz API

Just a simple API written on Node.js & Express.

The same API that used to get ADS-B, MLAT, or Mode-S data from adsb.ezz456ch.xyz.

## Endpoints

### /api/v2/all

Receive all aircraft data.

### /api/v2/all_with_pos

Receive all aircraft data with position.

### /api/v2/callsign

Receive aircraft data by callsign.

### /api/v2/circle

Receive nearby aircraft data by latitude and longitude.

### /api/v2/closest

Receive nearest aircraft data by latitude and longitude.

### /api/v2/hex

Receive aircraft data by hex.

### /api/v2/reg

Receive aircraft data by registration (reg).

### /api/stats

Receive data and status of your ADS-B receiver.

## Usage (if you want to use it with your readsb server/decoder)

If you want to run this API, I recommend using pm2. You can install it by

```
npm i pm2 -g
```

For ADS-B, MLAT, or Mode-S data, it is designed to work with readsb --net-api-port. You might need to edit /etc/default/readsb as follows:

```
NET_OPTIONS="[...] --net-api-port unix:/run/readsb/api.sock"
```

or use port instead

```
NET_OPTIONS="[...] --net-api-port xxxx"
```

## Example .env file for API:

First, copy .env_example to .env:

```
cp .env_example .env
```

And then edit .env something like this

```
# if false use local json path and if true use url instead
use_json_url="false"

# local json path
beast_clients_json="/run/readsb/clients.json"
mlat_clients_json="/run/mlat-server/clients.json"

# json url
beast_clients_json_url="http://127.0.0.1/data/clients.json"
mlat_clients_json_url="http://127.0.0.1/mlat/clients.json"

# readsb re-api url or readsb api port
re_api_url="http://127.0.0.1/re-api/"
```

If you want to use with --net-api-port xxxx you need to change re_api_url to

```
# readsb re-api url or readsb api port
re_api_url="http://127.0.0.1:XXXX/"
```

You may also need to edit the web server configuration to get JSON files for clients.json from /run/mlat-server/ if you will using url instead of local json path.

## Example web server configuration to allow specific IP access for clients.json from /run/mlat-server/ and data/clients.json from readsb:

### lighttpd example

```
# If you want to allow more IP access you can use | to add more IPs
# In this example, data/aircraft.json, data/clients.json, and every .json file in /mlat would be accessible by allowed IPs
$HTTP["URL"] =~ "^/(data/aircraft\.json|data/clients\.json|mlat/.*\.json)$" {
    $HTTP["remoteip"] !~ "^(127.0.0.1|123.123.123.123)$" {
        url.access-deny = ("")
    }
}

alias.url += (
    "/mlat/" => "/run/mlat-server/"
)
```

### nginx example

```
server {
        listen 127.0.0.1:80;

        server_name localhost;

        location /mlat/ {
                alias /run/mlat-server/;
        }
}
```

And if you are already using unix socket on localhost you can add /mlat/ to server block like this

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

        location /mlat/ {
                alias /run/mlat-server/;
        }
}
```

Finally, run the API with pm2:

```
pm2 start index.js --name 'adsb-ezz456ch-xyz-api'
```

## In case you want to proxy the API port with nginx:

By default nginx configuration file is at /etc/nginx/sites-enabled/default

```
server {
        listen 80;
        listen [::]:80;

        server_name api.example.com;

        location /api/ {
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

Also, don't forget to add readsb re-api to nginx if you gonna use unix sockets (and we will listen to requests only from 127.0.0.1):

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

## Or proxy the API port on lighttpd

First add mod_proxy and mod_deflate to server.modules on lighttpd config(lighttpd config file can be found at /etc/lighttpd/lighttpd.conf)

```
server.modules = (
        "mod_indexfile",
        "mod_access",
        "mod_alias",
        "mod_redirect",
        "mod_proxy",
        "mod_deflate",
        "mod_setenv",
)
```

than add proxy config

```
$HTTP["host"] =~ "api.example.com" {
    proxy.server  = (
        "" => (
            (
                "host" => "127.0.0.1",
                "port" => 3001
            )
        )
    )

    setenv.add-request-header  = (
        "X-Real-IP"            => "%{REMOTE_ADDR}",
        "X-Forwarded-For"      => "%{REMOTE_ADDR}",
        "X-Forwarded-Proto"    => "http",
        "Host"                 => "api.example.com"
    )
}
```

Also, don't forget to add readsb re-api to lighttpd if you gonna use unix sockets:

```
$HTTP["host"] =~ "127.0.0.1" {
    $HTTP["url"] =~ "^/re-api/" {
        proxy.server = (
            "" => (
                (
                    "socket" => "/run/readsb/api.sock"
                )
            )
        )

        setenv.add-request-header = (
            "Connection"      => "upgrade",
            "X-Real-IP"       => "%{REMOTE_ADDR}",
            "X-Forwarded-For" => "%{REMOTE_ADDR}",
            "X-Forwarded-Proto" => "http"
        )

        setenv.add-response-header = (
            "Connection" => "keep-alive"
        )

        deflate.mimetypes = (
            "application/json",
            "text/html",
            "text/plain",
            "text/css",
            "application/javascript"
        )
    }
}
```