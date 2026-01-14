import { Plugin } from 'obsidian';
import { getActions } from './src/actions';
import { QuailPluginSettings } from './src/interface';
import { Client, AuxiliaClient } from 'quail-js';
import { startLoginElectron, refreshToken } from './src/oauth/oauth';
import QuailSettingTab from './src/setting';

const DEFAULT_SETTINGS: QuailPluginSettings = {
	listID: '',
	listSlug: '',
	strictLineBreaks: true,
	useEnglishCmds: false,
	useFirstImageAsCover: false,
	// tokens
	accessToken: '',
	refreshToken: '',
	tokenExpiry: '',
	// user info
	me: null,
	lists: [],
}

export default class QuailPlugin extends Plugin implements QuailPlugin {
	settings: QuailPluginSettings;
	client: Client;
	auxiliaClient: AuxiliaClient;

	private parseTokenExpiry(value: string): Date | null {
		const trimmed = value.trim();
		if (!trimmed) return null;

		const parsed = Date.parse(trimmed);
		if (!Number.isNaN(parsed)) return new Date(parsed);

		// Some servers return RFC3339 with >3 fractional second digits (JS Date parsing is inconsistent across runtimes).
		const normalized = trimmed.replace(
			/(\.\d{3})\d+(Z|[+-]\d{2}:\d{2})$/,
			"$1$2"
		);
		const parsedNormalized = Date.parse(normalized);
		if (!Number.isNaN(parsedNormalized)) return new Date(parsedNormalized);

		return null;
	}

	async onload() {
		await this.loadSettings();

		await this.updateToken();

		this.getClients();

		if (this.isLogged()) {
			const q = [
				this.updateChannels(),
				this.updateMe(),
			];

			await Promise.all(q);

			await this.saveSettings();
			}

			await this.loadActions();

			// Settings tab
			this.addSettingTab(new QuailSettingTab(this.app, this));
		}

	onunload() {
	}

	getClients() {
		this.client = new Client({
			access_token: this.settings.accessToken,
			apibase: 'https://api.quail.ink',
			debug: false,
		});
		this.auxiliaClient = new AuxiliaClient({
			access_token: this.settings.accessToken,
			apibase: 'https://api.quail.ink',
			debug: false,
		});
	}

	async loadActions() {
		const actions = getActions(this);
		if (actions.length === 0) {
			console.error("quaily.loadActions: no actions found");
			return;
		} else if (actions.length === 1 && actions[0].id === 'quail-login') {
			this.addCommand(actions[0]);
		} else {
			(this.app as any).commands.removeCommand('quail-login');
			for (let ix = 0; ix < actions.length; ix++) {
				const action:any = actions[ix];
				this.addCommand(action);
			}
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async updateChannels() {
		if (!this.settings.me) {
			this.settings.lists = [];
			this.settings.listID = '';
			this.settings.listSlug = '';
			return;
		}

		const lists = await this.client.getUserLists(this.settings.me.id);
		this.settings.lists = lists;
		let found = false;
		for (let ix = 0; ix < lists.length; ix++) {
			const list = lists[ix];
			if (`${list.id}` === this.settings.listID || list.slug === this.settings.listSlug) {
				found = true;
				this.settings.listID = `${list.id}`;
				this.settings.listSlug = list.slug;
				break;
			}
		}
		if (!found) {
			if (lists.length > 0) {
				this.settings.listID = `${lists[0].id}`;
				this.settings.listSlug = lists[0].slug;
			} else {
				this.settings.listID = '';
				this.settings.listSlug = '';
			}
		}
	}

		async updateMe() {
			try {
				const me = await this.client.getMe();
				this.settings.me = me;
			} catch (err) {
				await this.clearTokens();
				return
			}
		}

	async login() {
		try {
			console.log("quaily.login: oauth flow start");
			// Start the login flow in a popup
			const token = await startLoginElectron();
			// if your auth server is at localhost:8080
			console.log("quaily.login: token expiry:", token.expiry);
			this.settings.accessToken = token.access_token;
			this.settings.refreshToken = token.refresh_token;
			this.settings.tokenExpiry = token.expiry;

			// update the client
			this.getClients();

			// get user info
			const me = await this.client.getMe();
			this.settings.me = me;

			// get lists
			await this.updateChannels();

			await this.saveSettings();

			await this.loadActions();
			// store them somewhere safe (e.g. Obsidian plugin storage)
		} catch (err) {
			console.error("quaily.login: oauth flow error:", err);
		}
	}

		async refreshToken() {
			try {
				console.log("quaily.refreshToken: refresh flow start");
				// Start the login flow in a popup
				const token = await refreshToken(this.settings.refreshToken)
				// if your auth server is at localhost:8080
				console.log("quaily.refreshToken: access token expiry:", token.expiry);
				this.settings.accessToken = token.access_token;
				this.settings.refreshToken = token.refresh_token;
				this.settings.tokenExpiry = token.expiry;
				await this.saveSettings();
				this.getClients();
			} catch (err) {
				console.error("quaily.refreshToken: refresh token flow error:", err);
			}
		}

		async clearTokens(reloadActions = true) {
			console.log("quaily.clearTokens: clear tokens");
			this.settings.accessToken = '';
			this.settings.refreshToken = '';
			this.settings.tokenExpiry = '';
			await this.saveSettings();
			if (reloadActions) {
				await this.loadActions();
			}
		}

	isLogged () {
		if (this.settings.accessToken === ''
			|| this.settings.refreshToken === ''
			|| this.settings.tokenExpiry === ''
			|| this.settings.me === null
			|| this.settings.lists?.length === 0
		) {
			return false;
		}
		return true
	}

		async updateToken() {
			const tokenExpiry = this.settings.tokenExpiry?.trim() || "";
			const refresh = this.settings.refreshToken?.trim() || "";

			if (!tokenExpiry || !refresh) {
				console.log("quaily.updateToken: missing token data, clear tokens");
				await this.clearTokens(false);
				return;
			}

			const expiry = this.parseTokenExpiry(tokenExpiry);
			if (!expiry) {
				console.log("quaily.updateToken: invalid token expiry, clear tokens", tokenExpiry);
				await this.clearTokens(false);
				return;
			}

			const nowMs = Date.now();
			const msUntilExpiry = expiry.getTime() - nowMs;
			const refreshIfWithinMs = 12 * 3600 * 1000;

			if (msUntilExpiry <= 0) {
				console.log("quaily.updateToken: access token expired, refresh token", expiry);
				await this.refreshToken();
				return;
			}

			if (msUntilExpiry <= refreshIfWithinMs) {
				console.log("quaily.updateToken: access token near expiry, refresh token", expiry);
				await this.refreshToken();
				return;
			}

			console.log("quaily.updateToken: token is still valid, nothing to do");
		}
	}
