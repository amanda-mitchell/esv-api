const baseUrl = 'https://api.esv.org/v3';

module.exports.copyrightNotifications = Object.freeze({
  allQuotations:
    'Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved. You may not copy or download more than 500 consecutive verses of the ESV Bible or more than one half of any book of the ESV Bible.',
  markedQuotations:
    'Scripture quotations marked “ESV” are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved. You may not copy or download more than 500 consecutive verses of the ESV Bible or more than one half of any book of the ESV Bible.',
  unmarkedQuotations:
    'Unless otherwise indicated, all Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved. You may not copy or download more than 500 consecutive verses of the ESV Bible or more than one half of any book of the ESV Bible.',
});

const passageTextEndpoint = defineEndpoint({
  url: 'passage/text',
  availableOptions: {
    'include-passage-references': Boolean,
    'include-verse-numbers': Boolean,
    'include-first-verse-numbers': Boolean,
    'include-footnotes': Boolean,
    'include-footnote-body': Boolean,
    'include-headings': Boolean,
    'include-short-copyright': Boolean,
    'include-copyright': Boolean,
    'include-passage-horizontal-lines': Boolean,
    'horizontal-line-length': nonNegativeInteger,
    'include-selahs': Boolean,
    'indent-using': createEnum('space', 'tab'),
    'indent-paragraphs': nonNegativeInteger,
    'indent-poetry': Boolean,
    'indent-poetry-lines': nonNegativeInteger,
    'indent-declares': nonNegativeInteger,
    'indent-psalm-doxology': nonNegativeInteger,
    'line-length': nonNegativeInteger,
  },
});

const passageHtmlEndpoint = defineEndpoint({
  url: 'passage/html',
  availableOptions: {
    'include-passage-references': Boolean,
    'include-verse-numbers': Boolean,
    'include-first-verse-numbers': Boolean,
    'include-footnotes': Boolean,
    'include-footnote-body': Boolean,
    'include-headings': Boolean,
    'include-short-copyright': Boolean,
    'include-copyright': Boolean,
    'include-css-link': Boolean,
    'inline-styles': Boolean,
    'wrapping-div': Boolean,
    'div-classes': x => x,
    'paragraph-tag': x => x,
    'include-book-titles': Boolean,
    'include-verse-anchors': Boolean,
    'include-chapter-numbers': Boolean,
    'include-crossrefs': Boolean,
    'include-subheadings': 'Boolean',
    'include-surrounding-chapters': Boolean,
    'include-surrounding-chapters-below': Boolean,
    'link-url': x => x,
    'crossref-url': x => x,
    'preface-url': x => x,
    'include-audio-link': Boolean,
    'attach-audio-link-to': Boolean,
  },
});

const passageAudioEndpoint = defineEndpoint({
  url: 'passage/audio',
  availableOptions: {},
});

const passageSearchEndpoint = defineEndpoint({
  url: 'passage/search',
  availableOptions: {
    'page-size': nonNegativeInteger,
    page: nonNegativeInteger,
  },
});

module.exports.createEsvApiClient = function ({ apiKey, fetch }) {
  const fetchOptions = {
    method: 'GET',
    headers: { Authorization: `Token ${apiKey}` },
  };

  function createRequestGenerator(endpoint, responseHandler) {
    return async (query, options = {}) => {
      const response = await fetch(endpoint(query, options), fetchOptions);

      if (!response.ok) {
        return Promise.reject(response);
      }

      return Promise.resolve(responseHandler(response));
    };
  }

  return {
    passageText: createRequestGenerator(passageTextEndpoint, response =>
      response.json()
    ),
    passageHtml: createRequestGenerator(passageHtmlEndpoint, response =>
      response.json()
    ),
    passageAudio: createRequestGenerator(passageAudioEndpoint, response =>
      response.blob()
    ),
    passageSearch: createRequestGenerator(passageSearchEndpoint, response =>
      response.json()
    ),
  };
};

function createEnum(...allowedValues) {
  const map = Object.fromEntries(allowedValues.map(x => [x, true]));
  const valueList = allowedValues.join(', ');

  return value => {
    if (!map[value]) {
      throw new Error(`value ${value} must be one of ${valueList}`);
    }

    return value;
  };
}

function nonNegativeInteger(value) {
  const coercedValue = Number(value);
  if (!(coercedValue >= 0)) {
    throw new Error(`value ${value} must be a non-negative integer.`);
  }

  return coercedValue;
}

function defineEndpoint({ url, availableOptions }) {
  const convertOption = createOptionConverter(
    defineEndpointAvailableOptions(availableOptions)
  );

  return (query, options) =>
    `${baseUrl}/${url}?${convertOptions(query, options, convertOption)}`;
}

function convertOptions(query, options, convertOption) {
  return renderQueryString({
    ...Object.fromEntries(Object.entries(options).map(convertOption)),
    q: query,
  });
}

function createOptionConverter(availableOptions) {
  return ([parameterName, value]) => {
    const handler = availableOptions[parameterName];
    if (!handler) {
      throw new Error(
        `Option ${parameterName} does not exist for this endpoint. Available options are ${Object.keys(
          availableOptions
        ).join(', ')}`
      );
    }

    return [handler.apiName, handler.coerceValue(value)];
  };
}

function renderQueryString(queryParameters) {
  return Object.entries(queryParameters)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join('&');
}

function defineEndpointAvailableOptions(options) {
  return Object.assign(
    {},
    ...Object.entries(options).map(([key, value]) =>
      createParameter(key, value)
    )
  );
}

function createParameter(parameterName, coerceValue) {
  return {
    [convertParameterName(parameterName)]: {
      apiName: parameterName,
      coerceValue,
    },
  };
}

function convertParameterName(parameterName) {
  return parameterName
    .split('-')
    .map((segment, index) => {
      if (index === 0) {
        return segment;
      }

      return segment[0].toUpperCase() + segment.substr(1);
    })
    .join('');
}
