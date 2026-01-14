import util from '../util';
import fm from "../frontmatter";
import { LoadingModal, ErrorModal } from '../modals';
import { App } from 'obsidian';
import { QuailPluginSettings } from 'src/interface';
import { t, english } from 'src/i18n';
import type { AuxiliaClient } from 'quail-js';

const aigen = function (app: App, auxiliaClient: AuxiliaClient, settings: QuailPluginSettings) {
  let name = english('actions.ai_gen_metadata');
  if (!settings.useEnglishCmds) {
    name = t('actions.ai_gen_metadata');
  }

  return {
    id: 'ai-gen-metadata',
    name: name,
    callback: async () => {
      const content = await util.getActiveFileMarkdown(app);
      const file = app.workspace.getActiveFile();
      const loadingModal = new LoadingModal(app)
      loadingModal.open();

      if (file) {
        const title = file.name.replace(/\.md$/, '');
        const fmc:any = await fm.suggestFrontmatter(auxiliaClient, title, content, [])
        const proc = (frontmatter: any) => {
          if (file) {
            try {
              for (const key in fmc) {
                if (Object.prototype.hasOwnProperty.call(fmc, key)) {
                  if (key === 'summary' || key === 'tags') {
                    // update `summary` and `tags`
                    frontmatter[key] = fmc[key];
                  } else {
                    // for other fields, only update if empty
                    if (frontmatter[key] === null || frontmatter[key] === undefined || frontmatter[key] === '') {
                      frontmatter[key] = fmc[key];
                    }
                  }
                }
              }
            } catch (e) {
              new ErrorModal(app, e).open();
            } finally {
              loadingModal.close();
            }
          }
        }
        app.fileManager.processFrontMatter(file, proc);
      } else {
        loadingModal.close();
      }
    }
  }
}

export default aigen;
