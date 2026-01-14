import { App } from 'obsidian';
import { LoadingModal, ErrorModal, PublishResultModal } from '../modals';
import { QuailPluginSettings } from '../interface';
import { savePost } from './index';
import { t, english } from 'src/i18n';
import type { AuxiliaClient, Client } from 'quail-js';
export default function publish(app: App, client: Client, auxiliaClient: AuxiliaClient, settings: QuailPluginSettings) {
  let name = english('actions.publish');
  if (!settings.useEnglishCmds) {
    name = t('actions.publish');
  }

  return {
    id: 'quail-publish',
    name: name,
    callback: async () => {
      const file = app.workspace.getActiveFile();
      if (file !== null) {
        const loadingModal = new LoadingModal(app)
        loadingModal.open();

        let pt:any = null;
        try {
          pt = await savePost(app, client, auxiliaClient, settings);
        } catch (e) {
          new ErrorModal(app, e).open();
          loadingModal.close();
          return;
        }

        try {
          pt = await client.publishPost(settings.listID, pt.slug);
        } catch (e) {
          new ErrorModal(app, e).open();
          loadingModal.close();
          return;
        } finally {
          loadingModal.close();
        }

        const slug = pt.slug || '';
        if (slug) {
          const viewUrl = `https://quaily.com/${settings.listSlug}/p/${slug}`;
          new PublishResultModal(app, client, {
            url: viewUrl, title: pt.title, summary: pt.summary, coverImageUrl: pt.cover_image_url
          }).open();
        } else {
          new ErrorModal(app, new Error("resp.slug is empty.")).open();
        }
      }
    }
  };
}
