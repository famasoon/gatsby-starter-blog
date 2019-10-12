---
title: List up populer Tor hidden service with Tor2Web
date: "2019-10-12"
---

TL;DR: Access to `https://tor2web.tld/antanistaticmap/stats/yesterday`, you can collect Tor Hidden services URLs that has tor2web users accessed.


There is a thing called Tor Hidden Service that can publish service anonymously.

I have written an article in [Japanese](https://medium.com/gyoza-x/tor-hidden-service-%E3%81%A7%E3%82%A6%E3%82%A7%E3%83%96%E3%82%B5%E3%82%A4%E3%83%88%E3%82%92%E5%85%AC%E9%96%8B%E3%81%97%E3%81%A6%E3%81%BF%E3%82%8B-5eab0d968d10)  about how to publish Tor Hidden Service.

The Tor Hidden Service can not be accessed from a clear network, but can easily be accessed using a proxy called Tor2Web.
[Tor2Web](https://github.com/globaleaks/Tor2web)

The famous Tor2web example:
* https://tor2web.io/
* https://onion.to

Tor2web records how much access has been made to which Tor Hidden Service and publishes it.
[Source](https://github.com/globaleaks/Tor2web/wiki/OpenData)
This record can be easily obtained by sending an HTTP Get request to "Tor2web's domain" + "/antanistaticmap/stats/yesterday".

The following code gets the data and lists it in order of the number of accesses to Tor Hidden Service.

```python
import urllib.request
import json
import sys
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

# arg e.g. https://tor2web.io/ https://onion.to

TOR2WEB_DATA_URL = '/antanistaticmap/stats/yesterday'

req = urllib.request.Request(sys.argv[1] + TOR2WEB_DATA_URL)
with urllib.request.urlopen(req) as res:
    body = json.loads(res.read().decode('utf-8'))

services = body['hidden_services']
services.sort(key=lambda x: x['access_count'])
services.reverse()
for service in services:
    print("URL: {}.onion , Count: {}".format(service['id'], service['access_count']))
```