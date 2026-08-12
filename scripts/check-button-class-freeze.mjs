import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIR, "..");
const BASELINE_PATH = path.join(SCRIPT_DIR, "button-class-baseline.json");
const SOURCE_DIRECTORIES = ["common", "pages"];
const SOURCE_EXTENSIONS = new Set([".css", ".html", ".js"]);
const INTERACTIVE_TAG_PATTERN = /<(button|a|input|select|option|label)\b[^>]*>/gis;
const CONTROL_CLASS_PATTERN = /(?:^|_)(?:button|btn|cta|action|trigger|toggle|option|choice|chip|swatch|select|tab|link|pin|day|time)(?:_|$)/i;
const CLASS_TOKEN_PATTERN = /^[A-Za-z_][A-Za-z0-9_-]*$/;

function walkFiles(directoryPath) {
  if (!fs.existsSync(directoryPath)) return [];

  return fs.readdirSync(directoryPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) return walkFiles(entryPath);
    return SOURCE_EXTENSIONS.has(path.extname(entry.name)) ? [entryPath] : [];
  });
}

function addClass(classOrigins, className, filePath) {
  const normalizedClassName = className.trim();
  if (!CLASS_TOKEN_PATTERN.test(normalizedClassName)) return;

  const relativePath = path.relative(REPOSITORY_ROOT, filePath).replaceAll("\\", "/");
  if (!classOrigins.has(normalizedClassName)) classOrigins.set(normalizedClassName, new Set());
  classOrigins.get(normalizedClassName).add(relativePath);
}

function addClassList(classOrigins, value, filePath) {
  value.split(/\s+/).forEach((className) => addClass(classOrigins, className, filePath));
}

function addControlClassList(classOrigins, value, filePath) {
  value.split(/\s+/).forEach((className) => {
    if (CONTROL_CLASS_PATTERN.test(className)) addClass(classOrigins, className, filePath);
  });
}

function extractCssClasses(classOrigins, source, filePath) {
  const sourceWithoutComments = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const classPattern = /\.([A-Za-z_][A-Za-z0-9_-]*)/g;

  for (const match of sourceWithoutComments.matchAll(classPattern)) {
    if (CONTROL_CLASS_PATTERN.test(match[1])) addClass(classOrigins, match[1], filePath);
  }
}

function extractHtmlInteractiveClasses(classOrigins, source, filePath) {
  for (const tagMatch of source.matchAll(INTERACTIVE_TAG_PATTERN)) {
    const classMatch = tagMatch[0].match(/\bclass\s*=\s*(["'])(.*?)\1/is);
    if (classMatch) addClassList(classOrigins, classMatch[2], filePath);
  }
}

function extractQuotedValues(value) {
  return [...value.matchAll(/(["'`])([^"'`]*?)\1/gs)].map((match) => match[2]);
}

function extractJavaScriptClasses(classOrigins, source, filePath) {
  const classListCallPattern = /\.classList\.(?:add|remove|toggle|replace|contains)\s*\(([^)]*)\)/gs;
  const classNameAssignmentPattern = /\.className\s*=\s*(["'`])([^"'`]*?)\1/gs;
  const setClassAttributePattern = /\.setAttribute\(\s*(["'])class\1\s*,\s*(["'`])([^"'`]*?)\2\s*\)/gs;

  for (const match of source.matchAll(classListCallPattern)) {
    extractQuotedValues(match[1]).forEach((value) => addControlClassList(classOrigins, value, filePath));
  }

  for (const match of source.matchAll(classNameAssignmentPattern)) {
    addControlClassList(classOrigins, match[2], filePath);
  }

  for (const match of source.matchAll(setClassAttributePattern)) {
    addControlClassList(classOrigins, match[3], filePath);
  }
}

function collectTrackedClasses() {
  const classOrigins = new Map();
  const sourceFiles = SOURCE_DIRECTORIES.flatMap((directory) =>
    walkFiles(path.join(REPOSITORY_ROOT, directory)),
  );

  sourceFiles.forEach((filePath) => {
    const source = fs.readFileSync(filePath, "utf8");
    const extension = path.extname(filePath);

    if (extension === ".css") extractCssClasses(classOrigins, source, filePath);
    if (extension === ".html") extractHtmlInteractiveClasses(classOrigins, source, filePath);
    if (extension === ".js") extractJavaScriptClasses(classOrigins, source, filePath);
  });

  return classOrigins;
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right, "en"));
}

function updateBaseline(classOrigins) {
  const baseline = {
    schemaVersion: 1,
    description: "Interactive control classes allowed before the shared button-system migration.",
    classes: sorted(classOrigins.keys()),
  };

  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`, "utf8");
  console.log(`Updated ${path.relative(REPOSITORY_ROOT, BASELINE_PATH)} (${baseline.classes.length} classes).`);
}

function checkBaseline(classOrigins) {
  if (!fs.existsSync(BASELINE_PATH)) {
    console.error("Button class baseline is missing. Run with --update-baseline after design-system review.");
    process.exitCode = 1;
    return;
  }

  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
  const allowedClasses = new Set(baseline.classes);
  const currentClasses = new Set(classOrigins.keys());
  const addedClasses = sorted([...currentClasses].filter((className) => !allowedClasses.has(className)));
  const removedClasses = sorted([...allowedClasses].filter((className) => !currentClasses.has(className)));

  if (addedClasses.length > 0) {
    console.error("Button class freeze failed. New interactive control classes were found:\n");
    addedClasses.forEach((className) => {
      const origins = sorted(classOrigins.get(className) ?? []);
      console.error(`- ${className}: ${origins.join(", ")}`);
    });
    console.error("\nReuse an approved class or follow docs/BUTTON_SYSTEM.md to change the baseline deliberately.");
    process.exitCode = 1;
    return;
  }

  console.log(`Button class freeze passed (${currentClasses.size} tracked classes).`);
  if (removedClasses.length > 0) {
    console.log(`Migration progress: ${removedClasses.length} baseline classes are no longer used.`);
  }
}

const classOrigins = collectTrackedClasses();

if (process.argv.includes("--update-baseline")) {
  updateBaseline(classOrigins);
} else {
  checkBaseline(classOrigins);
}
