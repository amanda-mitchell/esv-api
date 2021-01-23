import type fetch from 'node-fetch';
import type { Response } from 'node-fetch';

const baseUrl = 'https://api.esv.org/v3';

type ReadablePassageReference = string;
type ReadablePassageReferences = string;
type NumericVerseReference = number;

type ParsedRange = [NumericVerseReference, NumericVerseReference];
type PassageMetadata = {
  canonical: ReadablePassageReference;
  chapter_start: ParsedRange;
  chapter_end: ParsedRange;
  prev_chapter: ParsedRange | null;
  next_chapter: ParsedRange | null;
  prev_verse: NumericVerseReference | null;
  next_verse: NumericVerseReference | null;
};

export interface PassageContentResult {
  canonical: ReadablePassageReferences;
  parsed: ParsedRange[];
  passage_meta: PassageMetadata[];
  passages: string[];
  query: string;
}

export interface SearchResult {
  page: number;
  total_pages: number;
  total_results: number;
  results: {
    content: string;
    reference: ReadablePassageReference;
  }[];
}

export const copyrightNotifications = {
  allQuotations:
    'Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved. You may not copy or download more than 500 consecutive verses of the ESV Bible or more than one half of any book of the ESV Bible.',
  markedQuotations:
    'Scripture quotations marked “ESV” are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved. You may not copy or download more than 500 consecutive verses of the ESV Bible or more than one half of any book of the ESV Bible.',
  unmarkedQuotations:
    'Unless otherwise indicated, all Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved. You may not copy or download more than 500 consecutive verses of the ESV Bible or more than one half of any book of the ESV Bible.',
} as const;

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
    'div-classes': (x: string) => x,
    'paragraph-tag': (x: string) => x,
    'include-book-titles': Boolean,
    'include-verse-anchors': Boolean,
    'include-chapter-numbers': Boolean,
    'include-crossrefs': Boolean,
    'include-subheadings': Boolean,
    'include-surrounding-chapters': Boolean,
    'include-surrounding-chapters-below': Boolean,
    'link-url': (x: string) => x,
    'crossref-url': (x: string) => x,
    'preface-url': (x: string) => x,
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

type EsvClientOptions = {
  apiKey: string;
  fetch: typeof fetch;
};

export function createEsvApiClient({ apiKey, fetch }: EsvClientOptions) {
  const fetchOptions = {
    method: 'GET',
    headers: { Authorization: `Token ${apiKey}` },
  };

  function createRequestGenerator<TOptions, TResult>(
    endpoint: (query: string, options: Partial<TOptions>) => string,
    responseHandler: (response: Response) => Promise<TResult>
  ) {
    return async (query: string, options?: Partial<TOptions>) => {
      const response = await fetch(
        endpoint(query, options || {}),
        fetchOptions
      );

      if (!response.ok) {
        return Promise.reject(response);
      }

      return await responseHandler(response);
    };
  }

  return {
    passageText: createRequestGenerator(
      passageTextEndpoint,
      response => response.json() as Promise<PassageContentResult>
    ),
    passageHtml: createRequestGenerator(
      passageHtmlEndpoint,
      response => response.json() as Promise<PassageContentResult>
    ),
    passageAudio: createRequestGenerator(passageAudioEndpoint, response =>
      response.blob()
    ),
    passageSearch: createRequestGenerator(
      passageSearchEndpoint,
      response => response.json() as Promise<SearchResult>
    ),
  };
}

function createEnum<T extends string[]>(...allowedValues: T) {
  const map = Object.fromEntries(allowedValues.map(x => [x, true]));
  const valueList = allowedValues.join(', ');

  return (value: T[number]) => {
    if (!map[value]) {
      throw new Error(`value ${value} must be one of ${valueList}`);
    }

    return value;
  };
}

function nonNegativeInteger(value: number) {
  const coercedValue = Number(value);
  if (!(coercedValue >= 0)) {
    throw new Error(`value ${value} must be a non-negative integer.`);
  }

  return coercedValue;
}

type AvailableOptions = {
  [ApiName: string]: (value: any) => any;
};

type EndpointDefinition<TOptionValidators extends AvailableOptions> = {
  url: string;
  availableOptions: TOptionValidators;
};

function defineEndpoint<TOptionValidators extends AvailableOptions>({
  url,
  availableOptions,
}: EndpointDefinition<TOptionValidators>) {
  const optionListing = defineEndpointAvailableOptions(availableOptions);

  const convertOption = createOptionConverter(optionListing);

  type EndpointOptions = {
    [Key in keyof typeof optionListing & string]?: ReturnType<
      typeof optionListing[Key]['coerceValue']
    >;
  };

  return (query: string, options: EndpointOptions) =>
    `${baseUrl}/${url}?${convertOptions(query, options, convertOption)}`;
}

type Entries<T> = {
  [Key in keyof T & string]: [Key, T[Key]];
}[keyof T & string];

type OptionConverters = {
  [apiOption: string]: (value: any) => any;
};

type OptionsListing<T extends OptionConverters> = {
  [Key in keyof T & string as KebabToCamelCase<Key>]: {
    apiName: Key;
    coerceValue: T[Key];
  };
};

type Options<T extends OptionConverters> = {
  [Key in keyof OptionsListing<T> & string]: ReturnType<
    OptionsListing<T>[Key]['coerceValue']
  >;
};

type KebabToCamelCase<
  T extends string
> = T extends `${infer Prefix}-${infer Suffix}`
  ? `${Prefix}${Capitalize<KebabToCamelCase<Suffix>>}`
  : T;

function convertOptions<T extends OptionConverters>(
  query: string,
  options: Partial<Options<T>>,
  convertOption: (tuple: Entries<Options<T>>) => any
) {
  const entries = Object.entries(options) as Entries<Options<T>>[];

  return renderQueryString({
    ...Object.fromEntries(entries.map(convertOption)),
    q: query,
  });
}

function createOptionConverter<T extends OptionConverters>(
  availableOptions: OptionsListing<T>
) {
  return ([parameterName, value]: Entries<Options<T>>) => {
    const handler = availableOptions[parameterName];
    if (!handler) {
      throw new Error(
        `Option ${parameterName} does not exist for this endpoint. Available options are ${Object.keys(
          availableOptions
        ).join(', ')}`
      );
    }

    return [handler.apiName, handler.coerceValue(value)] as const;
  };
}

function renderQueryString(queryParameters: { [key: string]: any }) {
  return Object.entries(queryParameters)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join('&');
}

function defineEndpointAvailableOptions<TOptions extends AvailableOptions>(
  options: TOptions
): OptionsListing<TOptions> {
  const entries = Object.entries(options) as Entries<TOptions>[];

  return Object.assign(
    {},
    ...entries.map(([key, value]) => createParameter(key, value))
  );
}

function createParameter<
  TName extends string,
  TParameter,
  TCoerce extends (value: any) => TParameter
>(parameterName: TName, coerceValue: TCoerce) {
  return {
    [convertParameterName(parameterName)]: {
      apiName: parameterName,
      coerceValue,
    },
  } as OptionsListing<{ [Key in TName]: TCoerce }>;
}

function convertParameterName<TName extends string>(parameterName: TName) {
  return parameterName
    .split('-')
    .map((segment, index) => {
      if (index === 0) {
        return segment;
      }

      return segment[0].toUpperCase() + segment.substr(1);
    })
    .join('') as KebabToCamelCase<TName>;
}
