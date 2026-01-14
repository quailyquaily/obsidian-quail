import { App, Notice } from 'obsidian';
import { ErrorModal, LoadingModal } from '../modals';
import { QuailPluginSettings } from '../interface';
import { PreviewModal } from '../modals';
import { t, english } from 'src/i18n';
import type { AuxiliaClient, Client } from 'quail-js';
export default function preview(app: App, client: Client, auxiliaClient: AuxiliaClient, settings: QuailPluginSettings) {
  let name = english('actions.preview');
  if (!settings.useEnglishCmds) {
    name = t('actions.preview');
  }

  return {
    id: 'quail-preview',
    name: name,
    callback: async () => {
      const loadingModal = new LoadingModal(app);
      loadingModal.open();

      try {
        const activeFile = app.workspace.getActiveFile();
        if (!activeFile) {
          new Notice('No active file');
          return;
        }

        // First save the post to ensure we have the latest version
        const { savePost } = await import('./index');
        const post = await savePost(app, client, auxiliaClient, settings);

        if (!post || !post.id || !post.list_id) {
          new Notice('Failed to save post or get post details');
          return;
        }

        // Get origin for the token request
        const origin = window.location.origin;

        // Issue ephemeral token
        const resp = await client.issueEphemeralToken(origin);
        if (!resp || !resp.ephemeral_token) {
          throw new Error('Failed to generate preview token');
        }

        if (resp.ephemeral_token) {
          // Generate preview URL
          const previewUrl = client.getPostPreviewUrl(post.list_id, post.id, resp.ephemeral_token);
          // Open modal with QR code and button instead of opening URL directly
          new PreviewModal(app, previewUrl).open();
        }

      } catch (error) {
        new ErrorModal(app, error).open();
      } finally {
        loadingModal.close();
      }
    }
  };
}
