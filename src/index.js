import CachingWriter from 'broccoli-caching-writer';
import Hyde from 'mr-hyde';

import { defaults, defaultsDeep } from 'lodash';
import { join, extname } from 'path';
import { readFile, readJSON, outputFile, outputJSON } from 'fs-extra';
import { safeLoad } from 'js-yaml';

export default class HydeCompiler extends CachingWriter {
  constructor(inputNode, options) {
    super([inputNode], defaults({ name: 'broccoli-hyde-compiler' }, options, {
      persistentOutput: true
    }));

    this.hyde = new Hyde(options && options.name);
  }

  async build() {
    let { hyde, outputPath } = this;

    for (let fullpath of this.listFiles()) {
      let ext = extname(fullpath);
      let id = fullpath
        .replace(new RegExp(`(.)*/hyde/${this.hyde.name}/`), '')
        .replace(new RegExp(`${ext}$`), '');

      if (await hyde.parseFile(fullpath, { id }) === undefined) {
        switch (ext) {
          case '.yml':
            let yaml = await tryReadYAML(fullpath);
            let yamlPath = join(outputPath, `${id}.yml`);
            let jsonPath = join(outputPath, `${id}.json`);

            if (yaml !== null) {
              await outputFile(yamlPath, await readFile(fullpath));
              await outputJSON(jsonPath, defaultsDeep(...[
                await tryReadJSON(fullpath.replace(/\.yml$/, '.json')),
                yaml,
                await tryReadJSON(outputPath)
              ]));
            }

            break;
          case '.json':
            await outputJSON(join(outputPath, `${id}.json`), defaultsDeep(...[
              await tryReadJSON(fullpath),
              await tryReadJSON(outputPath)
            ]));

            break;
        }
      }
    }

    for (let item of hyde.items) {
      let filepath = join(outputPath, `${item.id}${item.ext}`);
      let jsonFilepath = join(outputPath, `${item.id}.json`);
      let json = await tryReadJSON(jsonFilepath);
      let yaml = await tryReadYAML(join(outputPath, `${item.id}.yml`));

      await outputFile(filepath, item.markdown);
      await outputJSON(jsonFilepath, defaultsDeep(...[
        json || {},
        yaml || {},
        hyde.serialize(item)
      ]));
    }

    for (let collection of hyde.collections) {
      let filepath = join(outputPath, `${collection.id}.json`);
      let json = await tryReadJSON(filepath);

      await outputJSON(filepath, defaultsDeep(...[
        json || {},
        hyde.serialize(collection)
      ]));
    }
  }
}

async function tryReadJSON(filepath) {
  try {
    return await readJSON(filepath);
  } catch (err) {
    return null;
  }
}

async function tryReadYAML(filepath) {
  try {
    return safeLoad(await readFile(filepath, 'utf-8'));
  } catch (err) {
    return null;
  }
}
