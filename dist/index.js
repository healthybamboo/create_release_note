"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const fs = __importStar(require("fs"));
/**
 * Githb Actionsで .versionファイルからバージョンを
 */
async function run() {
    try {
        // .versionファイルから現在のバージョンを取得
        const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
        const dotVersionFile = core.getInput("dotnet-version-path") || ".version";
        const dotVersionFilePath = `${workspace}/${dotVersionFile}`;
        const version = fs.readFileSync(dotVersionFilePath, "utf8").trim();
        core.info(`Current version: ${version}`);
        // Githubのタグを更新
        const octokit = github.getOctokit(core.getInput("github-token"));
        const { owner, repo } = github.context.repo;
        const tagName = `v${version}`;
        const tagMessage = `Release version ${version}`;
        const tagObject = {
            owner,
            repo,
            tag: tagName,
            message: tagMessage,
            object: github.context.sha,
            type: "commit",
        };
        const tagResponse = await octokit.rest.git.createTag(tagObject);
        core.info(`Tag created: ${tagResponse.data.tag}`);
        // タグを元にリリースノートを作成
        const releaseResponse = await octokit.rest.repos.createRelease({
            owner,
            repo,
            tag_name: tagName,
            name: tagName,
            body: `Release version ${version}`,
        });
        core.info(`Release created: ${releaseResponse.data.html_url}`);
        core.info(`Release URL: ${releaseResponse.data.html_url}`);
        // 処理が成功したことを通知
        core.info(`Version ${version} has been released successfully.`);
        core.setOutput("tag", tagName);
        core.setOutput("release", releaseResponse.data.html_url);
        core.setOutput("version", version);
    }
    catch (error) {
        core.error(`Error reading version file: ${error.message}`);
        core.setFailed(error.message);
    }
}
run();
