import CachingWriter from 'broccoli-caching-writer';
import Hyde from 'mr-hyde';

import { join, sep } from 'path';
import { readFile, outputFile, outputJSON } from 'fs-extra';

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
    const pathStartIndex = this.inputPaths[0].length;

    let hyde = this.hyde;

    this.outputPath = join(this.outputPath, 'hyde');

    for (let fullpath of this.listFiles()) {
      if (await hyde.parseFile(fullpath, this.inputPaths[0]) === undefined) {
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
