---
title: windbgとVirtualBox を用いた Windows カーネルデバッグ
date: "2019-10-12"
---

シリアルポート経由でカーネルデバッグした時に実施した手順です。

## VM側のWindowsで実施する手順
1. Windows上で管理者権限でPowershellを起動
2. 下記コマンドを入力

```powershell
bcdedit /debug on
bcdedit /dbgsettings serial debugport:1 baudrate:115200
```

3. Windowsをシャットダウン

## ホスト側のWinodwsで実施する手順
1. VirtualBoxでVMの設定を開き下記の画像のように設定
![](https://i.imgur.com/bJriTXo.png)

- "シリアルポートを有効化"にチェックを入れる
- "ポートモード"を"ホストにパイプ"にする
- "パス/アドレス"を"\\.\pipe\com1"にする

2. VMを起動する
3. [ストア](https://www.microsoft.com/ja-jp/p/windbg-preview/9pgjgd53tn86?activetab=pivot:overviewtab) からWinDbg Previewをインストールする(なぜか自分の環境ではWDKのWinDbgだとカーネルでバッグをしようにも"debuggee not connected"と表示され使えなかったためWinDbg Previewを使う)
4. WinDbg Preview を開いたら"ファイル"タブから"Attach to kernel"を選択し下記設定をする
- "Pipe"にチェックを入れる
- "Reconnect"にチェックを入れる
- "Port"を"\\.\pipe\com1"にする
5. VMを起動

これでカーネルでバッグが実施可能になる。