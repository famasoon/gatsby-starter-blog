---
title: How to use crashwalk
date: "2020-04-02"
---

How to use crashwalk
===

[crashwalk](https://github.com/bnagy/crashwalk) can check to quickly determine which crashes may lead to exploitable or not.

## Install

1. Install `gdb` and `golang` by apt
2. Download [exploitable.py](https://github.com/jfoote/exploitable)
3. Install `crashwalk`

```sh
$ sudo apt install gdb golang
$ mkdir ~/src
$ cd ~/src
$ git clone https://github.com/jfoote/exploitable
$ go get -u github.com/bnagy/crashwalk/cmd/...
```

## Usage
`crashwalk` can be used immediately if there is a path of AFL crash outputs.

For example, I will show using `crashwalk` on `./target`.

```sh
$ cwtriage -root ./output/crashes -match id -- ./target @@
```

`crashwalk` will output crash result to `crashwalk.db`.

If you want to output to txt file, you can use the following command.

```sh
$ cwtriage -root ./output/crashes -match id -- ./target @@ > result.txt
```

### How to read crashwalk.db
`crashwalk` built-in `cwdump`. This tool get a summary of the crashes on `crashwalk.db`.

```sh
$ cwdump ./crashwalk.db
```

---

Happy fuzzing!

###### tags: `Fuzzing`