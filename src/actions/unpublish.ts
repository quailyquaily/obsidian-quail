import { App, Notice } from 'obsidian';
import { QuailPluginSettings } from '../interface';
import { LoadingModal, ErrorModal } from '../modals';
import util from '../util';
import { t, english } from 'src/i18n';
import type { Client } from 'quail-js';


export default function unpublish(app: App, client: Client, settings: QuailPluginSettings) {
  let name = english('actions.unpublish');
  if (!settings.useEnglishCmds) {
    name = t('actions.unpublish');
  }

  return {
    id: 'unpublish',
    name: name,
    callback: async () => {
      const { frontmatter, err } = await util.getActiveFileContent(app);
      if (err != null) {
        new ErrorModal(app, new Error(err)).open();
        return;
      }

      const loadingModal = new LoadingModal(app)
      loadingModal.open();

      try {
        await client.unpublishPost(settings.listID, frontmatter?.slug);
        new Notice(t('notices.unpublish_success'));
      } catch (e) {
        loadingModal.close();
        new ErrorModal(app, e).open();
      } finally {
        loadingModal.close();
      }
    }
  };
}
