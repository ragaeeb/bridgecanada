import { describe, expect, test } from 'bun:test';

const projectFile = (path: string) => Bun.file(new URL(`../${path}`, import.meta.url));

describe('static site contract', () => {
  test('every local asset referenced by source files exists', async () => {
    const assetPaths: string[] = [];

    for await (const sourcePath of new Bun.Glob('src/**/*.{astro,css,ts}').scan('.')) {
      const source = await projectFile(sourcePath).text();
      assetPaths.push(
        ...[...source.matchAll(/(\/assets\/[^'"\s)]+)/g)].flatMap((match) => (match[1] ? [match[1]] : [])),
      );
    }

    expect(assetPaths.length).toBeGreaterThan(0);

    for (const assetPath of new Set(assetPaths)) {
      expect(await projectFile(`public${assetPath}`).exists()).toBe(true);
    }
  });

  test('documented production assets exist', async () => {
    const manifest = await projectFile('ASSET_MANIFEST.md').text();
    const documentedPaths = [...manifest.matchAll(/`(public\/assets\/[^`{}]+)`/g)].flatMap((match) =>
      match[1] ? [match[1]] : [],
    );

    expect(documentedPaths.length).toBeGreaterThan(0);

    for (const documentedPath of new Set(documentedPaths)) {
      expect(await projectFile(documentedPath).exists()).toBe(true);
    }

    for await (const assetPath of new Bun.Glob('public/assets/**/*').scan({ onlyFiles: true })) {
      expect(manifest).toContain(`\`${assetPath}\``);
    }
  });

  test('Cloudflare static routing support files are present', async () => {
    const requiredFiles = ['public/_headers', 'public/robots.txt', 'public/sitemap.xml', 'src/pages/404.astro'];

    for (const requiredFile of requiredFiles) {
      expect(await projectFile(requiredFile).exists()).toBe(true);
    }

    const headers = await projectFile('public/_headers').text();
    expect(headers).toContain("Content-Security-Policy: default-src 'self'");
    expect(headers).toContain('X-Content-Type-Options: nosniff');
    expect(headers).toContain('/_astro/*');

    const robots = await projectFile('public/robots.txt').text();
    expect(robots).toContain('Sitemap: https://bridgecanada.ca/sitemap.xml');

    const sitemap = await projectFile('public/sitemap.xml').text();
    expect(sitemap).toContain('<loc>https://bridgecanada.ca/</loc>');
  });

  test('home page declares canonical and social-sharing metadata', async () => {
    const source = await projectFile('src/pages/index.astro').text();

    expect(source).toContain('rel="canonical"');
    expect(source).toContain('property="og:image"');
    expect(source).toContain('name="twitter:card"');
    expect(source).toContain('sizes="42x42"');
  });

  test('folio index offset contract includes both header clearance and folio overhang', async () => {
    const styles = await projectFile('src/styles/global.css').text();

    expect(styles).toMatch(/\.folio\s*{[^}]*--folio-overhang:/s);
    expect(styles).toMatch(/\.folio\s*{[^}]*top:\s*calc\(-1\s*\*\s*var\(--folio-overhang\)\)/s);
    expect(styles).toMatch(
      /\.folio__index\s*{[^}]*top:\s*calc\(var\(--folio-overhang\)\s*\+\s*var\(--header-safe-top\)\)/s,
    );
  });

  test('touch rail, modal feedback, timeline docs, and async scene setup stay aligned', async () => {
    const styles = await projectFile('src/styles/global.css').text();
    const page = await projectFile('src/pages/index.astro').text();
    const cinematic = await projectFile('src/scripts/cinematic.ts').text();
    const timeline = await projectFile('TIMELINE.md').text();

    expect(styles).toMatch(/\.rail\s*{[^}]*touch-action:\s*pan-x pan-y pinch-zoom/s);
    expect(page).toMatch(/data-customizer-status[^>]*role="status"[^>]*aria-live="polite"/);
    expect(cinematic).toContain('threeController?.updateScroll(state.playhead)');
    expect(timeline).not.toContain('rangeProgress');
  });
});
