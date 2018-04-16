import CachingWriter from 'broccoli-caching-writer';
import Hyde from 'mr-hyde';

import { readFile, outputFile, outputJSON } from 'fs-extra';
import { join, extname } from 'path';

export default class HydeCompiler extends CachingWriter {
  constructor(inputNode, options) {
    super([inputNode], {
      annotation: options && options.annotation,
      name: "broccoli-hyde-compiler",
      persistentOutput: true,
    });

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
        let content = await readFile(fullpath, 'utf8')
        let filepath = fullpath.slice(this.inputPaths[0].length);
        let outputPath = join(...[
          this.outputPath,
          hyde.name,
          filepath
        ]);

        await outputFile(outputPath, content);
      }
    }

    for (let item of hyde.items) {
      let filepath = join(this.outputPath, item.id);

      await outputFile(`${filepath}.md`, item.markdown);
      await outputJSON(`${filepath}.json`, hyde.serialize(item));
    }

    for (let collection of hyde.collections) {
      let filepath = join(this.outputPath, collection.id);

      await outputJSON(`${filepath}.json`, hyde.serialize(collection));
    }
  }
}
