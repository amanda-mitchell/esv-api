# @amanda-mitchell/esv-api

![Release](https://github.com/amanda-mitchell/esv-api/workflows/Release/badge.svg)

This is a Javascript client for Crossway's [ESV API](https://api.esv.org/).

## Installation

```
yarn add @amanda-mitchell/esv-api
```

## Usage

```js
const esvApi = require('@amanda-mitchell/esv-api');

// This can be any method that is compatible with the Fetch interface.
const fetch = require('node-fetch');

const apiKey =
  'Go to https://api.esv.org/ to register an application and get an API key.';

const client = esvApi.createEsvApiClient({ apiKey, fetch });

client
  .content({
    passage: 'Genesis 1:1',
    format: 'txt',
    bible: 'leb',
  })
  .then(console.log)
  .catch(console.error);
```

## Available methods

Each of these methods takes two parameters: a `query` string, and an optional `options` hash containing the keys corresponding to the official API docs.
To make consumption in JS easier, each option has been converted to camel case.
For example, rather than `include-passage-references`, this client accepts an `includePassageReferences` key.

With the exception of `passageAudio`, each endpoint returns a Javascript object representing the parsed JSON of the response.

- [`passageText`](https://api.esv.org/docs/passage-text/): retrieve Bible text as plain text.
- [`passageHtml`](https://api.esv.org/docs/passage-html/): retrieve Bible text as html.
- [`passageAudio`](https://api.esv.org/docs/passage-audio/): retrieve Bible text as an MP3.
- [`passageSearch`](https://api.esv.org/docs/passage-search/): search for specific text in the Bible.
