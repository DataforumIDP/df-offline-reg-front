#!/usr/bin/env node

/**
 * Автоматическое версионирование: X.X.Y-B
 * - X.X - меняются вручную (major.minor)
 * - Y - увеличивается на 1 при каждом коммите (patch)
 * - B - литера ветки (a=alpha/develop, b=beta, m=main/master, f=feature, h=hotfix)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Маппинг веток на литеры
const BRANCH_LETTERS = {
  main: 'm',
  master: 'm',
  develop: 'a',
  dev: 'a',
  alpha: 'a',
  beta: 'b',
  release: 'r',
  hotfix: 'h',
  feature: 'f',
  fix: 'x',
  desctop: 'dt',
};

function getBranchLetter(branchName) {
  // Проверяем точное совпадение
  if (BRANCH_LETTERS[branchName]) {
    return BRANCH_LETTERS[branchName];
  }

  // Проверяем префиксы (feature/*, hotfix/*, etc.)
  for (const [prefix, letter] of Object.entries(BRANCH_LETTERS)) {
    if (branchName.startsWith(`${prefix}/`) || branchName.startsWith(`${prefix}-`)) {
      return letter;
    }
  }

  // По умолчанию - 'd' (dev/other)
  return 'd';
}

function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

function parseVersion(version) {
  // Парсим версию формата X.X.Y-B или X.X.Y
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-z]+))?$/i);
  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    branchLetter: match[4] || '',
  };
}

function bumpVersion(packageJsonPath) {
  const fullPath = path.resolve(packageJsonPath);

  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  const currentVersion = packageJson.version;

  const branch = getCurrentBranch();
  const branchLetter = getBranchLetter(branch);

  const parsed = parseVersion(currentVersion);

  // Увеличиваем patch версию
  const newVersion = `${parsed.major}.${parsed.minor}.${parsed.patch + 1}-${branchLetter}`;

  packageJson.version = newVersion;

  fs.writeFileSync(fullPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');

  console.log(`Version bumped: ${currentVersion} → ${newVersion} (branch: ${branch})`);

  // Добавляем изменённый package.json в коммит
  try {
    execSync(`git add "${fullPath}"`, { stdio: 'inherit' });
  } catch {
    // Игнорируем ошибки git add
  }

  return newVersion;
}

// Получаем пути к package.json из аргументов или используем дефолтные
const args = process.argv.slice(2);
const packagePaths = args.length > 0 ? args : ['./package.json'];

for (const pkgPath of packagePaths) {
  if (fs.existsSync(path.resolve(pkgPath))) {
    bumpVersion(pkgPath);
  }
}
