#!/usr/bin/env node

const fs = require('fs');
const pacote = require('pacote');
const {name} = require('./package.json');
const asyncPool = require('tiny-async-pool');

const [, , packageJsonPath, date] = process.argv;

async function getDepManifest(dependency) {
  const [depName, depVersion] = dependency;

  try {
    const manifest = await pacote.manifest(`${depName}@${depVersion}`, {
      fullMetadata: true,
      // preferOnline: true,
      before: new Date(date),
    });
    return manifest;
  } catch (err) {
    console.error(err.message);
    console.error(`Try specifying a later date or an earlier version.`);
    return Promise.resolve(null);
  }
}

async function processDeps(dependencies) {
  if (dependencies == null) {
    return;
  }
  const deps = Object.entries(dependencies);
  if (deps.length > 0) {
    // console.log(deps);
    const manifests = await asyncPool(5, deps, getDepManifest);
    const versions = manifests.filter(Boolean).map(manifest => {
      return `${manifest.name}@${manifest.version}`;
    });
    console.log(versions);
  }
}

async function main() {
  if (packageJsonPath == null || date == null) {
    console.log(`
Parse a package.json and list all the packages older than the given date.

Usage: ${name} </path/to/package.json> <date>
    `);
  } else {
    const packageString = await fs.promises.readFile(packageJsonPath);
    const pkg = JSON.parse(packageString);
    console.log(`Dependencies:`);
    await processDeps(pkg.dependencies);
    console.log(`Dev Dependencies:`);
    await processDeps(pkg.devDependencies);
  }
}

main().catch(err => console.error(err));
