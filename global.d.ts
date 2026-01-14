declare module 'quail-js' {
	export interface QuailClientOptions {
		access_token: string;
		apibase?: string;
		debug?: boolean;
	}

	export interface QuailList {
		id: string | number;
		slug: string;
		title: string;
		[key: string]: unknown;
	}

	export interface QuailUser {
		id: string | number;
		name: string;
		email?: string;
		[key: string]: unknown;
	}

	export interface UploadAttachmentResponse {
		view_url: string;
		[key: string]: unknown;
	}

	export interface IssueEphemeralTokenResponse {
		ephemeral_token: string;
		[key: string]: unknown;
	}

	export interface GenerateFrontmatterResponse {
		slug: string;
		summary: string;
		tags: string;
		[key: string]: unknown;
	}

	export interface CreatePostPayload {
		slug: string;
		title: string;
		summary: string;
		content: string;
		tags?: string;
		cover_image_url?: string;
		theme?: string;
		first_published_at?: string;
		[key: string]: unknown;
	}

	export interface QuailPost {
		id: string | number;
		list_id: string | number;
		slug: string;
		title?: string;
		summary?: string;
		cover_image_url?: string;
		published_at?: string | null;
		[key: string]: unknown;
	}

	export class Client {
		constructor(options: QuailClientOptions);
		getMe(): Promise<QuailUser>;
		getUserLists(userId: string | number): Promise<QuailList[]>;
		uploadAttachment(formData: FormData): Promise<UploadAttachmentResponse>;
		createPost(listId: string | number, payload: CreatePostPayload): Promise<QuailPost>;
		publishPost(listId: string | number, slug: string): Promise<QuailPost>;
		unpublishPost(listId: string | number, slug: string): Promise<void>;
		deliverPost(listId: string | number, slug: string): Promise<void>;
		issueEphemeralToken(origin: string): Promise<IssueEphemeralTokenResponse>;
		getPostPreviewUrl(
			listId: string | number,
			postId: string | number,
			ephemeralToken: string
		): string;
	}

	export class AuxiliaClient {
		constructor(options: QuailClientOptions);
		generateFrontmatter(
			title: string,
			content: string,
			fields: Array<'slug' | 'summary' | 'tags' | string>
		): Promise<GenerateFrontmatterResponse>;
	}
}
