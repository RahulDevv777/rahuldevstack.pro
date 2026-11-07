#!/usr/bin/env node
/**
 * Auto-deploy watcher.
 *
 * Watches the source tree. Whenever a file is saved it waits for the edits to
 * settle, checks that the project still builds, then commits everything and
 * pushes to `main`. Vercel picks the push up and publishes about a minute
 * later, so the live site follows the working tree with no manual step.
 *
 * Safety: a change that fails `npm run build` is never committed or pushed —
 * the site keeps serving the last good version.
 *
 *   npm run watch          start watching
 *   touch .no-autodeploy   pause (existing commits stop flowing)
 *   rm .no-autodeploy      resume
 *
 * Log: .auto-deploy.log
 */

import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, watch } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOG = join(ROOT, '.auto-deploy.log');
const PAUSE_FILE = join(ROOT, '.no-autodeploy');
const SETTLE_MS = 8_000; // wait for a burst of saves / formatter runs
const BRANCH = 'main';

// Only these paths can trigger a deploy.
const WATCHED = [
  'src',
  'public',
  'index.html',
  'package.json',
  'package-lock.json',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  '.oxlintrc.json',
  'README.md',
];

// Never react to these, even inside a watched directory.
const IGNORED = [
  /(^|\/)node_modules(\/|$)/,
  /(^|\/)dist(\/|$)/,
  /(^|\/)\.git(\/|$)/,
  /(^|\/)\.vercel(\/|$)/,
  /(^|\/)\.DS_Store$/,
  /(^|\/)\.auto-deploy\.log$/,
  /(^|\/)\.env/,
  /\.swp$|~$/,
];

let timer = null;
let running = false;
let queued = false;

const stamp = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

function log(message) {
  const line = `[${stamp()}] ${message}`;
  console.log(line);
  try {
    appendFileSync(LOG, line + '\n');
  } catch {
    /* logging must never break a deploy */
  }
}

function git(args, options = {}) {
  return spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', ...options });
}

function npm(args) {
  return spawnSync('npm', args, { cwd: ROOT, encoding: 'utf8', shell: false });
}

/** A merge, rebase or interrupted git operation owns the tree — stay out. */
function gitBusy() {
  const markers = ['MERGE_HEAD', 'rebase-merge', 'rebase-apply', 'CHERRY_PICK_HEAD', 'REVERT_HEAD'];
  const dir = git(['rev-parse', '--git-dir']).stdout?.trim() || '.git';
  return markers.some((m) => existsSync(join(ROOT, dir, m)));
}

function deploy(reason) {
  if (running) {
    queued = true;
    return;
  }
  running = true;

  try {
    if (existsSync(PAUSE_FILE)) {
      log(`paused (.no-autodeploy present) — skipped ${reason}`);
      return;
    }
    if (gitBusy()) {
      log('git operation in progress — skipping this round');
      return;
    }
    if (git(['branch', '--show-current']).stdout?.trim() !== BRANCH) {
      log(`not on ${BRANCH} — skipping`);
      return;
    }

    git(['add', '-A']);
    const staged = git(['diff', '--cached', '--quiet']);
    if (staged.status === 0) {
      log('nothing to commit');
      return;
    }

    log(`change: ${reason} — building`);

    // The gate: a broken tree never reaches GitHub or the live site.
    const build = npm(['run', 'build']);
    if (build.status !== 0) {
      const output = `${build.stdout ?? ''}\n${build.stderr ?? ''}`.trim().split('\n').slice(-12).join('\n');
      log(`BUILD FAILED — not committing, live site untouched\n${output}`);
      return;
    }

    const message = `auto: ${reason}`;
    const commit = git(['commit', '-m', message, '--no-verify']);
    if (commit.status !== 0) {
      log(`commit failed: ${(commit.stderr || commit.stdout || '').trim()}`);
      return;
    }
    log(`committed: ${git(['log', '-1', '--format=%h %s']).stdout?.trim()}`);

    for (let attempt = 1; attempt <= 3; attempt++) {
      const push = git(['push', 'origin', BRANCH]);
      if (push.status === 0) {
        log(`pushed to origin/${BRANCH} — Vercel is publishing`);
        return;
      }
      log(`push attempt ${attempt} failed: ${(push.stderr || '').trim().split('\n').slice(-2).join(' ')}`);
      if (attempt < 3) spawnSync('sleep', ['10']);
    }
    log('push gave up — commit kept locally, will retry on the next change');
  } finally {
    running = false;
    if (queued) {
      queued = false;
      schedule('queued change');
    }
  }
}

function schedule(reason) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    deploy(reason);
  }, SETTLE_MS);
}

const targets = WATCHED.filter((p) => existsSync(join(ROOT, p)));
for (const target of targets) {
  const abs = join(ROOT, target);
  try {
    watch(abs, { recursive: true }, (_event, filename) => {
      if (!filename) return schedule(target);
      const rel = relative(ROOT, join(abs, filename)).split('\\').join('/');
      if (IGNORED.some((rule) => rule.test(rel))) return;
      schedule(rel);
    });
  } catch (error) {
    log(`cannot watch ${target}: ${error.message}`);
  }
}

log(`watching ${targets.length} paths, ${SETTLE_MS / 1000}s settle, branch ${BRANCH}`);
log(`pause with: touch .no-autodeploy   ·   stop with: Ctrl-C`);

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    log('stopped');
    process.exit(0);
  });
}
