import { App } from 'obsidian';
import { LoadingModal, MessageModal, ErrorModal } from '../modals';
import util from '../util';
import type { QuailImageItem, QuailPlugin, QuailPluginSettings } from '../interface';
import fm from "../frontmatter";
import aigen from './aigen';
import save from './save';
import preview from './preview';
import publish from './publish';
import unpublish from './unpublish';
import send from './send';
import setChannel from './set-channel';
import insertMetadata from './insert-metadata';
import { t } from 'src/i18n';
import type { AuxiliaClient, Client } from 'quail-js';

async function uploadAttachment(client: Client, image: QuailImageItem) {
  const formData = new FormData();
  const picArray = new Uint8Array(image.data).buffer;

  formData.append('file', new Blob([picArray], { type: image.mimeType }), image.name);

  const resp = await client.uploadAttachment(formData);
  return resp.view_url
}

async function arrangeArticle(app: App, client: Client, auxiliaClient: AuxiliaClient, settings: QuailPluginSettings) {
  const { title, content, frontmatter: frontmatterO, images, err } = await util.getActiveFileContent(app);
  if (err != null) {
    new ErrorModal(app, new Error(err.toString())).open();
    return { frontmatter: null, content: null};
  }

  const frontmatter = fm.replaceFields(frontmatterO);

  const { verified, reason } = fm.verifyFrontmatter(frontmatter)
  if (!verified) {
    new MessageModal(app, {
      title: t('message_modal.failed_to_verify_meta.title'),
      message: reason,
      icon: "🤖",
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
    }).open();

    return { frontmatter: null, content: null, };
  }

  // upload images
  const oldUrls:string[] = [];
  const newUrls:string[] = [];
  for (let ix = 0; ix < images.length; ix++) {
    const img = images[ix];
    if (img) {
      try {
        const viewUrl = await uploadAttachment(client, img)
        newUrls.push(viewUrl)
        oldUrls.push(img.pathname)
        console.log(`quaily.upload image: ${img.pathname}, new url: ${viewUrl}`)
      } catch (e) {
        console.log("quaily.upload image error: ", e)
        new ErrorModal(app, new Error(e)).open();
        return { frontmatter: null, content: null};
      }
    }
  }

  // upload cover image
  if (frontmatter?.cover_image) {
    try {
      const viewUrl = await uploadAttachment(client, frontmatter.cover_image)
      frontmatter.cover_image_url = viewUrl;
      console.log(`quaily.upload cover: ${frontmatter.cover_image.pathname}, new url: ${viewUrl}`)
    } catch (e) {
      console.log("quaily.upload cover error: ", e)
      new ErrorModal(app, new Error(e)).open();
      return { frontmatter: null, content: null};
    }
  }

  // replace image urls
  let newContent = '';
  let imageUrls: string[] = [];
  try {
    const ret:any = util.replaceImageUrls(content, oldUrls, newUrls);
    newContent = ret.content.trim() || '';
    imageUrls = ret.image_urls.filter((url: string) => {
      return url.startsWith('https://') || url.startsWith('http://') || url.startsWith('//')
    })
  } catch (e) {
    new ErrorModal(app, e as Error).open();
    return { frontmatter: null, content: null};
  }
  const fmt = fm.formalizeFrontmatter(frontmatter, newContent);

  if (frontmatter.cover_image === null && frontmatter.cover_image_url === '') {
    // if the cover image is empty, use the first image as cover
    if (settings.useFirstImageAsCover && imageUrls.length > 0) {
      fmt.cover_image_url = imageUrls[0];
    }
  }

  return {
    title: title,
    frontmatter: fmt,
    content: newContent,
  }
}


export async function savePost(app: App, client: Client, auxiliaClient: AuxiliaClient, settings: QuailPluginSettings) {
  const { title, frontmatter, content } = await arrangeArticle(app, client, auxiliaClient, settings);
  if (content == null || title == null) {
    return;
  }


  const checkMetadata = (fm: any) => {
    const fields = ['slug', 'summary', 'tags'];
    for (let i = 0; i < fields.length; i++) {
      if (fm[fields[i]] === '' || fm[fields[i]] === null || fm[fields[i]] === undefined) {
        return false;
      }
    }
    return true
  }

  if (!checkMetadata(frontmatter)) {
    const file = app.workspace.getActiveFile();
    if (file) {
      // try to generate metadata
      const fmc:any = await fm.suggestFrontmatter(auxiliaClient, title, content, [])
      const proc = (frontmatter:any) => {
        if (file) {
          const loadingModal = new LoadingModal(app)
          loadingModal.open();
          try {
            for (const key in fmc) {
              if (Object.prototype.hasOwnProperty.call(fmc, key)) {
                if (frontmatter[key] === '' || frontmatter[key] === null || frontmatter[key] === undefined) {
                  console.log(`quaily.savePost: update metadata: ${key} = ${fmc[key]}`)
                  frontmatter[key] = fmc[key];
                }
              }
            }
          } catch (e) {
            loadingModal.close();
            new ErrorModal(app, e).open();
          } finally {
            loadingModal.close();
          }
        }
      }
      app.fileManager.processFrontMatter(file, proc);
    } else {
      return ;
    }
  }

  let newContent = content;
  if (!settings.strictLineBreaks) {
    // \n -> \n\n
    newContent = newContent.replace(/\n/g, '\n\n');
  }

  const payload = {
    slug: frontmatter.slug,
    title: frontmatter.title || title,
    cover_image_url: frontmatter.cover_image_url,
    summary: frontmatter.summary,
    content: newContent,
    tags: frontmatter.tags,
    theme: frontmatter.theme,
    first_published_at: frontmatter.datetime,
  }

  let resp:any = null;
  try {
    resp = await client.createPost(settings.listID, payload);
  } catch (e) {
    new ErrorModal(app, e).open();
    return;
  } finally {
    //
  }

  return resp;
}

export function getActions(plugin: QuailPlugin) {
  const app = plugin.app;
  const settings = plugin.settings;
  const client = plugin.client;
  const auxiliaClient = plugin.auxiliaClient;

  const loginAction = [
    {
      id: 'quail-login',
      name: 'Login',
      callback: async () => {
        await plugin.login();
      }
    }
  ];

  // check token status and expiry
  if (settings.accessToken === '' || settings.refreshToken === '' || settings.tokenExpiry === '') {
    return loginAction;
  }

  return [
    publish(app, client, auxiliaClient, settings),
    unpublish(app, client, settings),
    save(app, client, auxiliaClient, settings),
    preview(app, client, auxiliaClient, settings),
    send(app, client, settings),
    aigen(app, auxiliaClient, settings),
    setChannel(app, settings, plugin.saveSettings.bind(plugin)),
    insertMetadata(app, auxiliaClient, settings),
  ];
}
