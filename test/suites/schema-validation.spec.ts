import { expect } from 'chai';
import { promises as fs } from 'fs';
import { Settings } from 'src/shared/models/settings.model';
import { Tests } from 'test/lib/tests';

describe('Schema validation', () => {
  describe('Generic (test with Settings)', () => {
    const genericTestCases = [
      {
        path: 'schema-validation/empty-file',
        describeTitle: 'Empty file',
        testTitle: 'should fix empty file',
        preTest: async (fileContent) => {
          expect(() => {
            JSON.parse(fileContent);
          }).to.throw('Unexpected end of JSON input');
        }
      },
      {
        path: 'schema-validation/null-content',
        describeTitle: 'Null content',
        testTitle: 'should fix null content',
        preTest: async (fileContent) => {
          expect(JSON.parse(fileContent)).to.equal(null);
        }
      },
      {
        path: 'schema-validation/empty-object',
        describeTitle: 'Empty object',
        testTitle: 'should fix empty object',
        preTest: async (fileContent) => {
          expect(JSON.parse(fileContent)).to.be.an('object');
        }
      },
      {
        path: 'schema-validation/corrupted-content',
        describeTitle: 'Corrupted content',
        testTitle: 'should fix corrupted content',
        preTest: async (fileContent) => {
          expect(JSON.parse(fileContent)).to.be.an('object');
        }
      }
    ];

    genericTestCases.forEach((genericTestCase) => {
      describe(genericTestCase.describeTitle, () => {
        const tests = new Tests(genericTestCase.path, true, true, false);

        it(genericTestCase.testTitle, async () => {
          const fileContent = (
            await fs.readFile('./tmp/storage/settings.json')
          ).toString();

          genericTestCase.preTest(fileContent);

          await tests.helpers.waitForAutosave();

          await tests.helpers.verifyObjectPropertyInFile(
            './tmp/storage/settings.json',
            'welcomeShown',
            false
          );
        });
      });
    });
  });

  describe('Settings', () => {
    const tests = new Tests('schema-validation-settings', true, true, false);

    it('should verify initial properties (missing, invalid, unknown)', async () => {
      const fileContent: Settings = JSON.parse(
        (await fs.readFile('./tmp/storage/settings.json')).toString()
      );

      expect(fileContent.logsMenuSize).to.be.undefined;
      expect(fileContent.bannerDismissed).to.be.undefined;
      expect((fileContent as any).unknown).to.equal(true);
      expect(fileContent.environments).to.include.members([null, 'unknown']);
      expect(fileContent.environments[2]).to.include({
        uuid: '',
        path: '/home/username/file1.json'
      });
    });

    it('should verify saved properties (missing, invalid, unknown)', async () => {
      await tests.helpers.waitForAutosave();
      const fileContent: Settings = JSON.parse(
        (await fs.readFile('./tmp/storage/settings.json')).toString()
      );

      // add missing properties with default
      expect(fileContent.logsMenuSize).to.equal(150);
      expect(fileContent.bannerDismissed)
        .to.be.an('array')
        .that.have.lengthOf(0);

      // remove unknown values
      expect((fileContent as any).unknown).to.be.undefined;
      // remove invalid values
      expect(fileContent.environments).to.be.an('array').that.have.lengthOf(0);
    });
  });
});
