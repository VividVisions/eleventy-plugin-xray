
import getRepoInfo from 'git-repo-info';
import os from 'node:os';
import { green, yellow } from 'colorette';

const
	__dirname = new URL('.', import.meta.url).pathname,
	gitInfo = getRepoInfo(__dirname);

/**
 * Mocha `beforeAll()` hook to print a bunch of information about the project and code.
 * Used to compare tests on different systems under different conditions.
 */
export const mochaHooks = {
	beforeAll() {
		console.log('');
		console.log(`Testing time: ${green(new Date().toISOString())}`);

		// Log info about application and environment.
		console.log(`Package     : ${green(process.env.npm_package_name)}`);
		console.log(`Version     : ${green(process.env.npm_package_version)}`);
		console.log(`NODE_ENV    : ${'NODE_ENV' in process.env ? green(process.env['NODE_ENV']) : yellow('-')}`);

		// Log info about Git branch, etc…
		console.log(`Git branch  : ${gitInfo.branch ? green(gitInfo.branch) : yellow('-')}`);
		if (gitInfo.sha) {
			console.log(`Git revision: ${green(gitInfo.sha.substr(0, 8))} (${gitInfo.sha})`);
		}
		else {
			console.log(`Git revision: ${yellow('-')}`);
		}

		// Log info about Node.js.
		console.log(`Node.js     : ${green(process.version)}`);

		// Log info about the machine.
		console.log(`OS          : ${green(os.type())} ${green(os.release())} (${green(os.platform())})`);
		console.log(`Hostname    : ${green(os.hostname())}`);
		console.log(`CPUs        : ${green(os.cpus().length)}`);
		console.log(`CPU arch    : ${green(os.arch())}`);
		console.log(`Memory total: ${green('GB ' + Number(os.totalmem() / 1073741824).toFixed(1))}`);
		console.log('');
	}
};
