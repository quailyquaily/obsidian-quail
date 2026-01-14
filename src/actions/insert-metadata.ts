import { App } from 'obsidian';
import { MessageModal } from '../modals';
import fm from '../frontmatter';
import { t, english } from 'src/i18n';
import aigen from './aigen';
import { QuailPluginSettings } from 'src/interface';
import type { AuxiliaClient } from 'quail-js';

export default function insertMetadata(app: App, auxiliaClient: AuxiliaClient, settings: QuailPluginSettings) {
  let name = english('actions.insert_metadata');
  if (!settings.useEnglishCmds) {
    name = t('actions.insert_metadata');
  }

  return {
    id: 'insert-metadata',
    name: name,
    callback: async () => {
      const file = app.workspace.getActiveFile();
      if (file) {
        const proc = (frontmatter: any) => {
          if (frontmatter === null || Object.values(frontmatter).length === 0) {
            const fmc:any = fm.emptyFrontmatter()
            for (const key in fmc) {
              if (Object.prototype.hasOwnProperty.call(fmc, key)) {
                frontmatter[key] = fmc[key];
              }
            }
          } else {
            const modal = new MessageModal(app, {
              title: t('message_modal.metadata_exists.title'),
              message: t('message_modal.metadata_exists.desc'),
              icon: "🔔",
              iconColor: "orange",
              actions: [{
                text: t('common.generate'),
                primary: true,
                click: (dialog: any) => {
                  aigen(app, auxiliaClient, settings).callback();
                  dialog.close();
                }
              },{
                text: t('common.cancel'),
                close: true,
              }]
            })
            modal.open();
          }
        }
        app.fileManager.processFrontMatter(file, proc);
      }
    }
  };
}
