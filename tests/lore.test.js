import { describe, it, expect } from 'vitest';
import {
  NameGenerator,
  HistoryGenerator,
  BookGenerator,
  LegendSystem,
  LoreGenerator,
  BOOK_TYPES,
  NAME_COMPONENTS,
} from '../core/jardvoxel-survival-lore.js';

describe('NameGenerator', () => {
  it('should generate village names', () => {
    const ng = new NameGenerator(12345);
    const name = ng.generateVillageName('forest');
    expect(name).toBeTypeOf('string');
    expect(name.length).toBeGreaterThan(3);
  });

  it('should generate biome-appropriate names', () => {
    const ng = new NameGenerator(100);
    const desertName = ng.generateVillageName('desert');
    const forestName = ng.generateVillageName('forest');
    expect(desertName).toBeTypeOf('string');
    expect(forestName).toBeTypeOf('string');
  });

  it('should generate unique names per instance', () => {
    const ng = new NameGenerator(42);
    const names = new Set();
    for (let i = 0; i < 10; i++) {
      names.add(ng.generateVillageName('plains'));
    }
    expect(names.size).toBeGreaterThan(5);
  });

  it('should generate character names', () => {
    const ng = new NameGenerator(99);
    const name = ng.generateCharacterName('male');
    expect(name).toBeTypeOf('string');
    expect(name.length).toBeGreaterThan(4);
  });

  it('should generate female character names', () => {
    const ng = new NameGenerator(99);
    const name = ng.generateCharacterName('female');
    expect(name).toBeTypeOf('string');
    expect(name.length).toBeGreaterThan(4);
  });

  it('should generate structure names', () => {
    const ng = new NameGenerator(77);
    const name = ng.generateStructureName('temple');
    expect(name).toBeTypeOf('string');
    expect(name.length).toBeGreaterThan(4);
  });

  it('should be deterministic with same seed', () => {
    const ng1 = new NameGenerator(123);
    const ng2 = new NameGenerator(123);
    expect(ng1.generateVillageName('plains')).toBe(ng2.generateVillageName('plains'));
  });

  it('should have name components for all biomes', () => {
    const biomes = ['desert', 'forest', 'plains', 'taiga', 'jungle', 'ocean', 'mountains', 'swamp'];
    for (const biome of biomes) {
      expect(NAME_COMPONENTS[biome]).toBeDefined();
      expect(NAME_COMPONENTS[biome].prefixes.length).toBeGreaterThan(0);
      expect(NAME_COMPONENTS[biome].suffixes.length).toBeGreaterThan(0);
    }
  });
});

describe('HistoryGenerator', () => {
  it('should generate history with founding, decline, and notable figure', () => {
    const hg = new HistoryGenerator(100);
    const history = hg.generate('village');
    expect(history.foundingEvent).toBeDefined();
    expect(history.declineEvent).toBeDefined();
    expect(history.notableFigure).toBeDefined();
  });

  it('should be deterministic with same seed', () => {
    const hg1 = new HistoryGenerator(200);
    const hg2 = new HistoryGenerator(200);
    expect(hg1.generate('temple')).toEqual(hg2.generate('temple'));
  });
});

describe('BookGenerator', () => {
  it('should generate lore books', () => {
    const bg = new BookGenerator(50);
    const book = bg.generate(BOOK_TYPES.LORE);
    expect(book.type).toBe('lore');
    expect(book.title).toBeTypeOf('string');
    expect(book.content).toBeTypeOf('string');
    expect(book.content.length).toBeGreaterThan(20);
  });

  it('should generate recipe books', () => {
    const bg = new BookGenerator(50);
    const book = bg.generate(BOOK_TYPES.RECIPE);
    expect(book.type).toBe('recipe');
    expect(book.content).toContain('Chapter');
  });

  it('should generate map books', () => {
    const bg = new BookGenerator(50);
    const book = bg.generate(BOOK_TYPES.MAP);
    expect(book.type).toBe('map');
    expect(book.content).toContain('Directions');
    expect(book.content).toContain('paces');
  });

  it('should generate journal books', () => {
    const bg = new BookGenerator(50);
    const book = bg.generate(BOOK_TYPES.JOURNAL);
    expect(book.type).toBe('journal');
    expect(book.content).toContain('Day');
  });

  it('should be deterministic with same seed', () => {
    const bg1 = new BookGenerator(300);
    const bg2 = new BookGenerator(300);
    expect(bg1.generate(BOOK_TYPES.LORE)).toEqual(bg2.generate(BOOK_TYPES.LORE));
  });

  it('should have 4 book types', () => {
    expect(Object.keys(BOOK_TYPES).length).toBe(4);
  });
});

describe('LegendSystem', () => {
  it('should generate 5-10 legends', () => {
    const ls = new LegendSystem(42);
    const count = ls.getLegendCount();
    expect(count).toBeGreaterThanOrEqual(5);
    expect(count).toBeLessThanOrEqual(10);
  });

  it('should generate legends with text', () => {
    const ls = new LegendSystem(42);
    const legends = ls.getLegends();
    for (const legend of legends) {
      expect(legend.text).toBeTypeOf('string');
      expect(legend.text.length).toBeGreaterThan(20);
    }
  });

  it('should reference real locations', () => {
    const ls = new LegendSystem(42);
    const legends = ls.getLegends();
    for (const legend of legends) {
      expect(legend.place).toBeDefined();
      expect(legend.place.length).toBeGreaterThan(3);
    }
  });

  it('should return random legend', () => {
    const ls = new LegendSystem(42);
    const legend = ls.getRandomLegend();
    expect(legend).toBeDefined();
    expect(legend.text).toBeDefined();
  });

  it('should filter legends by place', () => {
    const ls = new LegendSystem(42);
    const legends = ls.getLegends();
    if (legends.length > 0) {
      const place = legends[0].place;
      const filtered = ls.getLegendsByPlace(place);
      expect(filtered.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should be deterministic with same seed', () => {
    const ls1 = new LegendSystem(500);
    const ls2 = new LegendSystem(500);
    expect(ls1.getLegendCount()).toBe(ls2.getLegendCount());
    expect(ls1.getLegends()).toEqual(ls2.getLegends());
  });
});

describe('LoreGenerator', () => {
  it('should create all sub-generators', () => {
    const lg = new LoreGenerator(12345);
    expect(lg.nameGenerator).toBeInstanceOf(NameGenerator);
    expect(lg.historyGenerator).toBeInstanceOf(HistoryGenerator);
    expect(lg.bookGenerator).toBeInstanceOf(BookGenerator);
    expect(lg.legendSystem).toBeInstanceOf(LegendSystem);
  });

  it('should delegate to sub-generators', () => {
    const lg = new LoreGenerator(12345);
    expect(lg.generateVillageName('plains')).toBeTypeOf('string');
    expect(lg.generateCharacterName('male')).toBeTypeOf('string');
    expect(lg.generateStructureName('temple')).toBeTypeOf('string');
    const history = lg.generateHistory('village');
    expect(history.foundingEvent).toBeDefined();
    const book = lg.generateBook(BOOK_TYPES.LORE);
    expect(book.title).toBeDefined();
    expect(lg.getLegends().length).toBeGreaterThan(0);
    expect(lg.getLegendCount()).toBeGreaterThan(0);
  });

  it('should be deterministic with same world seed', () => {
    const lg1 = new LoreGenerator(999);
    const lg2 = new LoreGenerator(999);
    expect(lg1.generateVillageName('forest')).toBe(lg2.generateVillageName('forest'));
    expect(lg1.generateHistory('temple')).toEqual(lg2.generateHistory('temple'));
    expect(lg1.getLegendCount()).toBe(lg2.getLegendCount());
  });
});
