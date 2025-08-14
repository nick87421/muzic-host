// generate_firebase_json.mjs
import fs from "node:fs";
import path from "node:path";

/**
 * CONFIG — change these to match your repo
 */
const GITHUB_USER = "nick87421";
const REPO = "muzic-host";
const BRANCH = "main";          // or "master"
const ROOT_DIR = "albums";      // folder containing album subfolders

// Build safe raw GitHub URL
function rawUrl(...segments) {
  return `https://raw.githubusercontent.com/${GITHUB_USER}/${REPO}/${BRANCH}/${segments.map(s => encodeURIComponent(s)).join("/")}`;
}

// Capitalize nicely
function prettyTitle(s) {
  return s
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Find first image file in the album folder
function findCoverFile(albumPath) {
  const files = fs.readdirSync(albumPath, { withFileTypes: true })
    .filter(d => d.isFile())
    .map(d => d.name);

  return files.find(f => /\.(jpg|jpeg|png|webp)$/i.test(f)) || null;
}

// List album folders
function listAlbums(base) {
  return fs.readdirSync(base, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}

// List mp3 songs in a folder
function listSongs(albumPath) {
  return fs.readdirSync(albumPath, { withFileTypes: true })
    .filter(d => d.isFile() && /\.mp3$/i.test(d.name))
    .map(d => d.name);
}

function main() {
  if (!fs.existsSync(ROOT_DIR)) {
    console.error(`❌ Folder "${ROOT_DIR}" not found in this repo.`);
    process.exit(1);
  }

  const albumsOut = {};
  const albumNames = listAlbums(ROOT_DIR);

  albumNames.forEach(albumName => {
    const albumPath = path.join(ROOT_DIR, albumName);
    const coverFile = findCoverFile(albumPath);
    const songFiles = listSongs(albumPath);

    const songsOut = songFiles.map(file => ({
      title: prettyTitle(path.basename(file, path.extname(file))),
      url: rawUrl(ROOT_DIR, albumName, file)
    }));

    const coverUrl = coverFile
      ? rawUrl(ROOT_DIR, albumName, coverFile)
      : `https://picsum.photos/600/600?random=${Math.floor(Math.random() * 9999)}`;

    albumsOut[albumName] = {
      title: prettyTitle(albumName),
      artist: "Unknown",
      coverUrl,
      songs: songsOut
    };
  });

  const out = { albums: albumsOut };
  fs.writeFileSync("firebase_data.json", JSON.stringify(out, null, 2));
  console.log(`✅ Created firebase_data.json with ${Object.keys(albumsOut).length} album(s).`);
}

main();
