import { App, Notice } from 'obsidian';
import { LoadingModal, ErrorModal, PublishResultModal } from '../modals';
import { QuailPluginSettings } from '../interface';
import { savePost } from './index';
import { t, english } from 'src/i18n';
import type { AuxiliaClient, Client } from 'quail-js';
export default function save(app: App, client: Client, auxiliaClient: AuxiliaClient, settings: QuailPluginSettings) {
  let name = english('actions.save');
  if (!settings.useEnglishCmds) {
    name = t('actions.save');
  }

  return {
    id: 'save',
    name: name,
    callback: async () => {
      const loadingModal = new LoadingModal(app)
      loadingModal.open();

      let pt: any = null;
      try {
        pt = await savePost(app, client, auxiliaClient, settings);
      } catch (e) {
        new ErrorModal(app, e).open();
        loadingModal.close();
        return;
      } finally {
        loadingModal.close();
      }

      const slug = pt?.slug || '';
      if (slug) {
        if (pt?.published_at !== null) {
          const payload:any = {
            title: pt.title,
            summary: pt.summary,
            coverImageUrl: pt.cover_image_url,
            url: `https://quaily.com/${settings.listSlug}/p/${slug}`
          }
          new PublishResultModal(app, client, payload).open();
        } else {
          new Notice(t('notices.post_saved'));
        }
      }
    }
  };
}
