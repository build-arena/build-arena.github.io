const fs = require("fs");
const path = require("path");

const DATA_ROOT = process.env.BUILD_ARENA_DATA_ROOT
  || path.resolve(__dirname, "..", "..", "AI_Engineer_text", "datacache", "BuildArena_all_data_original");
const SOURCE_ROOT = process.env.BUILD_ARENA_RENDER_ROOT || path.join(DATA_ROOT, "render");
const THUMBNAIL_ROOT = process.env.BUILD_ARENA_THUMBNAIL_ROOT || path.join(DATA_ROOT, "thumbnail");
const REGISTRY_SOURCE_ROOT = "BuildArena_all_data_original/render";
const REGISTRY_THUMBNAIL_ROOT = "BuildArena_all_data_original/thumbnail";
const TARGET_ROOT = path.join(__dirname, "..", "assets", "construction_grid");
const REGISTRY_PATH = path.join(TARGET_ROOT, "webp_registry.json");
const WEBP_COUNT = 8;
const FORCED_VIEW_ID = "bsg_view_2";

const MODELS = [
  {
    source: "gpt-5",
    target: "gpt5",
  },
  {
    source: "grok-4-0709",
    target: "grok",
  },
  {
    source: "claude-sonnet-4-20250514",
    target: "claude",
  },
  {
    source: "deepseek-chat",
    target: "deepseek",
  },
  {
    source: "doubao-seed-1-6-250615",
    target: "doubao",
  },
  {
    source: "gemini-2-0-flash",
    target: "gemini",
  },
  {
    source: "gpt-4o",
    target: "gpt",
  },
  {
    source: "kimi-k2-turbo-preview",
    target: "kimi",
  },
  {
    source: "qwen-plus",
    target: "qwen",
  },
];

function getThumbnailFiles({ directory }) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...getThumbnailFiles({ directory: entryPath }));
      continue;
    }

    if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".webp") {
      files.push(entryPath);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function toPosixPath({ value }) {
  return value.split(path.sep).join("/");
}

function parseThumbnailFile({ thumbnailPath }) {
  const fileName = path.basename(thumbnailPath);
  const extension = path.extname(fileName);
  const fileNameWithoutExtension = path.basename(fileName, extension);
  const parts = fileNameWithoutExtension.split("__");

  if (parts.length < 8) {
    throw new Error(`Unexpected thumbnail filename: ${fileName}.`);
  }

  const [sourceModel, task, difficulty] = parts;
  const caseId = parts[4];
  const thumbnailViewId = parts[parts.length - 1];

  if (!sourceModel || !task || !difficulty || !caseId || !thumbnailViewId) {
    throw new Error(`Cannot parse thumbnail filename: ${fileName}.`);
  }

  return {
    sourceModel,
    task,
    difficulty,
    caseId,
    thumbnailFileName: fileName,
    thumbnailRelativePath: toPosixPath({ value: path.relative(THUMBNAIL_ROOT, thumbnailPath) }),
    thumbnailViewId,
  };
}

function getSourcePath({ metadata }) {
  return path.join(
    SOURCE_ROOT,
    metadata.sourceModel,
    metadata.task,
    metadata.difficulty,
    metadata.caseId,
    "render_steps",
    "bsg",
    "animations",
    `${FORCED_VIEW_ID}.webp`
  );
}

function getSourceRelativePath({ metadata }) {
  return toPosixPath({
    value: path.join(
      metadata.task,
      metadata.difficulty,
      metadata.caseId,
      "render_steps",
      "bsg",
      "animations",
      `${FORCED_VIEW_ID}.webp`
    ),
  });
}

function getSelectedThumbnailsBySourceModel() {
  const thumbnailsBySourceModel = new Map();

  getThumbnailFiles({ directory: THUMBNAIL_ROOT }).forEach((thumbnailPath) => {
    const metadata = parseThumbnailFile({ thumbnailPath });
    const existingThumbnails = thumbnailsBySourceModel.get(metadata.sourceModel) || [];

    existingThumbnails.push(metadata);
    thumbnailsBySourceModel.set(metadata.sourceModel, existingThumbnails);
  });

  thumbnailsBySourceModel.forEach((thumbnails) => {
    thumbnails.sort((left, right) => left.thumbnailFileName.localeCompare(right.thumbnailFileName));
  });

  return thumbnailsBySourceModel;
}

function copyModelWebps({ source, target, selectedThumbnails }) {
  const targetDirectory = path.join(TARGET_ROOT, target);
  const registryEntries = [];

  if (selectedThumbnails.length !== WEBP_COUNT) {
    throw new Error(`${source} has ${selectedThumbnails.length} selected thumbnails; expected ${WEBP_COUNT}.`);
  }

  fs.mkdirSync(targetDirectory, { recursive: true });

  selectedThumbnails.forEach((metadata, index) => {
    const sourcePath = getSourcePath({ metadata });
    const targetPath = path.join(targetDirectory, `${index}.webp`);
    const targetRelativePath = path.relative(path.join(__dirname, ".."), targetPath);

    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Missing forced view source: ${sourcePath}.`);
    }

    fs.copyFileSync(sourcePath, targetPath);
    console.log(`${metadata.sourceModel}/${getSourceRelativePath({ metadata })} -> ${toPosixPath({ value: targetRelativePath })}`);

    const originalFileId = `${source}:${metadata.task}/${metadata.difficulty}/${metadata.caseId}/${FORCED_VIEW_ID}`;

    registryEntries.push({
      index,
      targetPath: toPosixPath({ value: targetRelativePath }),
      sourceModel: source,
      targetModel: target,
      originalFileId,
      task: metadata.task,
      difficulty: metadata.difficulty,
      caseId: metadata.caseId,
      viewId: FORCED_VIEW_ID,
      sourceRelativePath: getSourceRelativePath({ metadata }),
      ...metadata,
    });
  });

  return registryEntries;
}

const registry = {
  schemaVersion: 1,
  sourceRoot: REGISTRY_SOURCE_ROOT,
  thumbnailRoot: REGISTRY_THUMBNAIL_ROOT,
  webpCountPerModel: WEBP_COUNT,
  selectionStrategy: {
    source: "thumbnail filenames",
    forcedViewId: FORCED_VIEW_ID,
  },
  models: {},
};

const selectedThumbnailsBySourceModel = getSelectedThumbnailsBySourceModel();

MODELS.forEach((model) => {
  const selectedThumbnails = selectedThumbnailsBySourceModel.get(model.source) || [];
  registry.models[model.target] = copyModelWebps({
    source: model.source,
    target: model.target,
    selectedThumbnails,
  });
});

fs.writeFileSync(REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
console.log(`Registry written to ${REGISTRY_PATH}`);
