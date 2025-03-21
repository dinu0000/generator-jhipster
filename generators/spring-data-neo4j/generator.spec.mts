import { basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import { expect } from 'esmocha';
import lodash from 'lodash';

import { buildSamplesFromMatrix, buildServerMatrix, entitiesSimple as entities } from '../../test/support/index.mjs';
import { shouldSupportFeatures, testBlueprintSupport } from '../../test/support/tests.mjs';
import Generator from '../server/index.mjs';
import { defaultHelpers as helpers } from '../../test/support/helpers.mjs';

import { databaseTypes } from '../../jdl/jhipster/index.mjs';
import { mockedGenerators, shouldComposeWithSpringCloudStream, shouldComposeWithLiquibase } from '../server/__test-support/index.mjs';
import { GENERATOR_SERVER } from '../generator-list.mjs';

const { snakeCase } = lodash;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const generator = basename(__dirname);

const { NEO4J: databaseType } = databaseTypes;
const commonConfig = { databaseType, baseName: 'jhipster', nativeLanguage: 'en', languages: ['fr', 'en'] };

const testSamples = buildSamplesFromMatrix(buildServerMatrix(), { commonConfig });

describe(`generator - ${databaseType}`, () => {
  it('generator-list constant matches folder name', async () => {
    await expect((await import('../generator-list.mjs')).GENERATOR_SPRING_DATA_NEO4J).toBe(generator);
  });
  shouldSupportFeatures(Generator);
  describe('blueprint support', () => testBlueprintSupport(generator));

  it('samples matrix should match snapshot', () => {
    expect(testSamples).toMatchSnapshot();
  });

  Object.entries(testSamples).forEach(([name, sampleConfig]) => {
    const { authenticationType } = sampleConfig;

    describe(name, () => {
      let runResult;

      before(async () => {
        runResult = await helpers
          .runJHipster(GENERATOR_SERVER)
          .withJHipsterConfig(sampleConfig, entities)
          .withMockedGenerators(mockedGenerators);
      });

      after(() => runResult.cleanup());

      it('should match generated files snapshot', () => {
        expect(runResult.getStateSnapshot()).toMatchSnapshot();
      });
      it('contains correct authenticationType', () => {
        runResult.assertFileContent('.yo-rc.json', new RegExp(`"authenticationType": "${authenticationType}"`));
      });
      it('contains correct databaseType', () => {
        runResult.assertFileContent('.yo-rc.json', new RegExp(`"databaseType": "${databaseType}"`));
      });
      shouldComposeWithSpringCloudStream(sampleConfig, () => runResult);
      shouldComposeWithLiquibase(false, () => runResult);
    });
  });
});
