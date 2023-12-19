# repom

> CLI for manager git repositories easily, Inspiration by [projj](https://github.com/popomore/projj)

[![NPM version](https://img.shields.io/npm/v/repom)](https://www.npmjs.com/package/repom)
![GitHub Action Status](https://img.shields.io/github/actions/workflow/status/lhz960904/repom/ci.yml)

## Overview

`repom` provide a structure storage repository

```
.$BASE_DIR
├── github.com (optional)
│  └── vuejs (optional)
│       ├── core
│       └── docs
├── gitlab.com
│   └── owner
│       ├── repoA
│       └── repoB
```

And you can use command to manager your repositories.

## Install

```bash
npm install -g repom
```

## Usage

### Initialize

```bash
repom init
```

![init screen shot](./img/init.png)

Set base directory which repositories will be cloned to, default  `~/Users/Documents/Code`.

You can change base directory in `~/.repom/config.json`.

### Add repository

```bash
repom add https://github.com/lhz960904/repom.git
```

![add screen shot](./img/add.png)

You can add `-o` option if you register `code` command, will auto open repo by VSCode

### Remove repository

```bash
repom remove <name>
```

![remove screen shot](./img/remove.png)

Support  fuzzy match. Multiple selections can be made if multiple matches are found

### Find repository

```bash
repom find <name>
```
![remove screen shot](./img/find.png)

You can add `-o` option if you register `code` command, will auto open repo by VSCode

### 🚨 Clean up exist dircatory

> the command will clean up existed directories to base dir, **can't roll back** .

```bash
repom clean-up <dir>
```

![clean up screen shot](./img/clean_up.png)

## Config

- `baseDir` : Repositories will be cloned to, default  `~/Users/Documents/Code`.
- `groupBy` : Group according to the following option
  - `source` : git remote url. e.g.  `https://github.com/lhz960904/repom.git`  match to  `github.com`
  - `owner` : repository owner. e.g.  `https://github.com/lhz960904/repom.git`  match to  `lhz960904`
