import 'dotenv/config';
import fetch from 'node-fetch';
import { createEsvApiClient } from '../client.js';

describe('integration tests', () => {
  const apiKey = process.env['ESV_API_KEY']!;

  // We can't perform integration tests unless we have
  // an API key, which should not be stored in the repository.
  beforeAll(() => expect(apiKey).toBeDefined());

  function createClient() {
    return createEsvApiClient({ fetch, apiKey });
  }

  describe('passageText', () => {
    it('gets the text of Genesis 1:1', async () => {
      expect(await createClient().passageText('Gen 1:1')).toEqual({
        canonical: 'Genesis 1:1',
        parsed: [[1001001, 1001001]],
        passage_meta: [
          {
            canonical: 'Genesis 1:1',
            chapter_end: [1001001, 1001031],
            chapter_start: [1001001, 1001031],
            next_chapter: [1002001, 1002025],
            prev_chapter: null,
            next_verse: 1001002,
            prev_verse: null,
          },
        ],
        passages: [
          'Genesis 1:1\n\nThe Creation of the World\n\n  [1] In the beginning, God created the heavens and the earth. (ESV)',
        ],
        query: 'Genesis 1:1',
      });
    });

    it('respects options', async () => {
      expect(
        await createClient().passageText('Gen 1:1; Gen 2:1', {
          includePassageReferences: false,
        }),
      ).toEqual({
        canonical: 'Genesis 1:1; Genesis 2:1',
        parsed: [
          [1001001, 1001001],
          [1002001, 1002001],
        ],
        passage_meta: [
          {
            canonical: 'Genesis 1:1',
            chapter_end: [1001001, 1001031],
            chapter_start: [1001001, 1001031],
            next_chapter: [1002001, 1002025],
            prev_chapter: null,
            next_verse: 1001002,
            prev_verse: null,
          },
          {
            canonical: 'Genesis 2:1',
            chapter_end: [1002001, 1002025],
            chapter_start: [1002001, 1002025],
            next_chapter: [1003001, 1003024],
            prev_chapter: [1001001, 1001031],
            prev_verse: 1001031,
            next_verse: 1002002,
          },
        ],
        passages: [
          'The Creation of the World\n\n  [1] In the beginning, God created the heavens and the earth. (ESV)',
          'The Seventh Day, God Rests\n\n  [1] Thus the heavens and the earth were finished, and all the host of them. (ESV)',
        ],
        query: 'Genesis 1:1; Genesis 2:1',
      });
    });
  });

  describe('passageHtml', () => {
    it('gets the html of Genesis 1:1', async () => {
      expect(await createClient().passageHtml('Gen 1:1')).toEqual({
        canonical: 'Genesis 1:1',
        parsed: [[1001001, 1001001]],
        passage_meta: [
          {
            canonical: 'Genesis 1:1',
            chapter_end: [1001001, 1001031],
            chapter_start: [1001001, 1001031],
            next_chapter: [1002001, 1002025],
            prev_chapter: null,
            next_verse: 1001002,
            prev_verse: null,
          },
        ],
        passages: [
          `<h2 class="extra_text">Genesis 1:1 <small class="audio extra_text">(<a class="mp3link" href="https://audio.esv.org/david-cochran-heath/mq/01001001-01001001.mp3" title="Genesis 1:1" type="audio/mpeg">Listen</a>)</small></h2>
<h3 id="p01001001_01-1">The Creation of the World</h3>
<p id="p01001001_06-1" class="starts-chapter"><b class="chapter-num" id="v01001001-1">1:1&nbsp;</b>In the beginning, God created the heavens and the earth.</p>
<p>(<a href="http://www.esv.org" class="copyright">ESV</a>)</p>`,
        ],
        query: 'Genesis 1:1',
      });
    });

    it('respects options', async () => {
      expect(
        await createClient().passageHtml('Gen 1:1; Gen 2:1', {
          includePassageReferences: false,
          includeHeadings: false,
        }),
      ).toEqual({
        canonical: 'Genesis 1:1; Genesis 2:1',
        parsed: [
          [1001001, 1001001],
          [1002001, 1002001],
        ],
        passage_meta: [
          {
            canonical: 'Genesis 1:1',
            chapter_end: [1001001, 1001031],
            chapter_start: [1001001, 1001031],
            next_chapter: [1002001, 1002025],
            prev_chapter: null,
            next_verse: 1001002,
            prev_verse: null,
          },
          {
            canonical: 'Genesis 2:1',
            chapter_end: [1002001, 1002025],
            chapter_start: [1002001, 1002025],
            next_chapter: [1003001, 1003024],
            prev_chapter: [1001001, 1001031],
            prev_verse: 1001031,
            next_verse: 1002002,
          },
        ],
        passages: [
          `<p id="p01001001_06-1" class="starts-chapter"><b class="chapter-num" id="v01001001-1">1:1&nbsp;</b>In the beginning, God created the heavens and the earth.</p>
<p>(<a href="http://www.esv.org" class="copyright">ESV</a>)</p>`,
          `<p id="p01002001_06-2" class="starts-chapter"><b class="chapter-num" id="v01002001-1">2:1&nbsp;</b>Thus the heavens and the earth were finished, and all the host of them.</p>
<p>(<a href="http://www.esv.org" class="copyright">ESV</a>)</p>`,
        ],
        query: 'Genesis 1:1; Genesis 2:1',
      });
    });
  });

  describe('passageAudio', () => {
    it('gets audio for Genesis 1:1', async () => {
      const audio = await createClient().passageAudio('Gen 1:1');

      expect(audio.type).toEqual('audio/mpeg');
    });
  });

  describe('passageSearch', () => {
    it('gets search results', async () => {
      expect(
        await createClient().passageSearch('dog', { pageSize: 3 }),
      ).toEqual({
        page: 1,
        results: [
          {
            content:
              'But not a dog shall growl against any of the people of Israel, either man or beast, that you may know that the LORD makes a distinction between Egypt and Israel.’',
            reference: 'Exodus 11:7',
          },
          {
            content:
              'You shall not bring the fee of a prostitute or the wages of a dog into the house of the LORD your God in payment for any vow, for both of these are an abomination to the LORD your God.',
            reference: 'Deuteronomy 23:18',
          },
          {
            content:
              'So he brought the people down to the water. And the LORD said to Gideon, “Every one who laps the water with his tongue, as a dog laps, you shall set by himself. Likewise, every one who kneels down to drink.”',
            reference: 'Judges 7:5',
          },
        ],
        total_pages: 5,
        total_results: 15,
      });
    });

    it('supports paging', async () => {
      expect(
        await createClient().passageSearch('dog', { pageSize: 1, page: 2 }),
      ).toEqual({
        page: 2,
        results: [
          {
            content:
              'You shall not bring the fee of a prostitute or the wages of a dog into the house of the LORD your God in payment for any vow, for both of these are an abomination to the LORD your God.',
            reference: 'Deuteronomy 23:18',
          },
        ],
        total_pages: 15,
        total_results: 15,
      });
    });
  });
});
