import * as core from "@actions/core";
import * as github from "@actions/github";
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import * as fs from "fs";


/**
 * tagを更新リクエストのtypeです。
 */
type TagObject = RestEndpointMethodTypes["git"]["createTag"]["parameters"];

/**
 * Githb Actionsで .versionファイルからバージョンを
 */
async function run() {
  try {
    // .versionファイルから現在のバージョンを取得
    const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
    const dotVersionFile = core.getInput("dotnet_version_path") || ".version";
    const dotVersionFilePath = `${workspace}/${dotVersionFile}`;

    const version = fs.readFileSync(dotVersionFilePath, "utf8").trim();
    core.info(`Current version: ${version}`);

    // Githubのタグを更新
    const token = await core.getInput("github_token", { required: true });
    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;
    const tagName = `v${version}`;
    const tagMessage = `Release version ${version}`;
    const tagObject: TagObject = {
      owner,
      repo,
      tag: tagName,
      message: tagMessage,
      object: github.context.sha,
      type: "commit",
    };
    const tagResponse = await octokit.rest.git.createTag(tagObject)
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
    core.setOutput("version", version)
  } catch (error: any) {
    core.error(`Error reading version file: ${error.message}`);
    core.setFailed(error.message);
  }
}
run();
