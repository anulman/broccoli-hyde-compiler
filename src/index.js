import CachingWriter from 'broccoli-caching-writer';
import Hyde from 'mr-hyde';

import { defaults, defaultsDeep } from 'lodash';
import { join, extname } from 'path';
import { outputFile, outputJSON } from 'fs-extra';
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
        // nop
        // todo: consider adding config'able include / exclude globs?
      }
    }

    for (let model of hyde.models) {
      let jsonFilepath = join(outputPath, `${model.id}.json`);

      await outputJSON(jsonFilepath, hyde.serialize(model));

      if (model.markdown) {
        let contentFilepath = join(outputPath, `${model.id}${model.ext}`);

        await outputFile(contentFilepath, model.markdown);
      }
    }
  }
}
