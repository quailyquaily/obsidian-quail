export interface QuailPluginSettings {
	listID: string;
	listSlug: string;

	accessToken: string;
	refreshToken: string;
	tokenExpiry: string;

	me: any;
	lists: any;

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
	client: any;
	auxiliaClient: any;

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
