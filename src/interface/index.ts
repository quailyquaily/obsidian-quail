import type { Client, AuxiliaClient } from 'quail-js';
import type { App } from 'obsidian';

export interface QuailUser {
	id: string | number;
	name: string;
	email?: string;
	[key: string]: unknown;
}

export interface QuailList {
	id: string | number;
	slug: string;
	title: string;
	[key: string]: unknown;
}

export interface QuailPluginSettings {
	listID: string;
	listSlug: string;

	accessToken: string;
	refreshToken: string;
	tokenExpiry: string;

	me: QuailUser | null;
	lists: QuailList[];

	strictLineBreaks: boolean;
	useEnglishCmds: boolean;
	useFirstImageAsCover: boolean;
}

export interface QuailImageItem {
	pathname: string;
	formalized_pathname: string;
	name: string;
	data: ArrayBuffer;
	mimeType: string;
}

export interface QuailPlugin {
	settings: QuailPluginSettings;
	client: Client;
	auxiliaClient: AuxiliaClient;
	app: App;

	onload(): Promise<void>;
	onunload(): void;
	getClients(): void;
	loadActions(): Promise<void>;
	loadSettings(): Promise<void>;
	saveSettings(): Promise<void>;
	updateChannels(): Promise<void>;
	login(): Promise<void>;
	refreshToken(): Promise<void>;
	clearTokens(reloadActions?: boolean): Promise<void>;
	isLogged(): boolean;
	updateToken(): Promise<void>;
}
