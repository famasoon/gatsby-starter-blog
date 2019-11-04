---
title: About NSE scripts
date: "2019-11-01"
---

## What is NSE
Network Script Engine(NSE) can be able to write for automation network scan.

### About NSE
NSE is written by Lua.
In Linux, Script locate `/usr/local/share/nmap/scripts`, and library locate `/usr/local/share/nmap/nselib`.

## How to enable NSE
Add `-sC` option run default category NSE option.

`--script` option run the specified directory or script is executed by NSE.

## Tutorial
Run nmap with NSE

```sh
$ nmap -sC example.com
```

Result

```sh

# nmap -sC example.com
Starting Nmap 7.80 ( https://nmap.org ) at 2019-11-01 12:20 EDT
Nmap scan report for example.com (93.184.216.34)
Host is up (0.033s latency).
Other addresses for example.com (not scanned): 2606:2800:220:1:248:1893:25c8:1946
Not shown: 996 filtered ports
PORT     STATE  SERVICE
80/tcp   open   http
|_http-title: Example Domain
443/tcp  open   https
|_http-title: Example Domain
| ssl-cert: Subject: commonName=www.example.org/organizationName=Internet Corporation for Assigned Names and Numbers/stateOrProvinceName=California/countryName=US
| Subject Alternative Name: DNS:www.example.org, DNS:example.com, DNS:example.edu, DNS:example.net, DNS:example.org, DNS:www.example.com, DNS:www.example.edu, DNS:www.example.net
| Not valid before: 2018-11-28T00:00:00
|_Not valid after:  2020-12-02T12:00:00
|_ssl-date: TLS randomness does not represent time
| tls-alpn: 
|   h2
|_  http/1.1
| tls-nextprotoneg: 
|   h2
|   http/1.1
|_  http/1.0
1119/tcp closed bnetgame
1935/tcp closed rtmp

Nmap done: 1 IP address (1 host up) scanned in 14.74 seconds
```

Run nmap with NSE espesially vuln script

```sh
$ nmap -sC --script=vuln example.com
```

Result

```sh
Nmap scan report for example.com (93.184.216.34)
Host is up (0.028s latency).
Other addresses for example.com (not scanned): 2606:2800:220:1:248:1893:25c8:1946
Not shown: 996 filtered ports
PORT     STATE  SERVICE
80/tcp   open   http
|_clamav-exec: ERROR: Script execution failed (use -d to debug)
|_http-csrf: Couldn't find any CSRF vulnerabilities.
|_http-dombased-xss: Couldn't find any DOM based XSS.
|_http-stored-xss: Couldn't find any stored XSS vulnerabilities.
443/tcp  open   https
|_clamav-exec: ERROR: Script execution failed (use -d to debug)
|_http-csrf: Couldn't find any CSRF vulnerabilities.
|_http-dombased-xss: Couldn't find any DOM based XSS.
|_http-stored-xss: Couldn't find any stored XSS vulnerabilities.
|_sslv2-drown: 
1119/tcp closed bnetgame
1935/tcp closed rtmp
```

If you need run all NSE scripts, run the bellow command.

```
nmap --script all example.com
```
