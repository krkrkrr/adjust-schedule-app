# adjust-schedule-app

use google form.

## 概要 Overview

予定調整を google フォームで行うためのツールです。

- 日程を期間で設定
- 結果の閲覧ページ

## 必要要件 Requirement

- [google clasp](https://github.com/google/clasp)
- 任意の google アカウント

## 使い方 Usage

1. [google Apps Script API](https://script.google.com/home/usersettings)
   の設定をオンにする。

1. `$ git clone` する。

1. `$ clasp login` で、任意の google アカウントにログインする。

1. `$ clasp create` を実行し、 `forms` を選択する。

1. `$ clasp push` を実行し、このコード群を上書きする。

1. 作成した google フォームから、スクリプトエディタを開き、 `main.gs` の `onInstall` 関数を実行する。

1. google フォームのメニューにアドオンが追加されていたら、設定は完了です。
