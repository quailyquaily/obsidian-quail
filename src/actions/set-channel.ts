import { App, Notice, SuggestModal } from 'obsidian';
import { MessageModal, ErrorModal } from '../modals';
import { QuailPluginSettings } from '../interface';
import { t, english } from 'src/i18n';
class ChannelSuggestModal extends SuggestModal<{title: string, id: string}> {
  channelList: Array<{title: string, id: string}>;
  onSelect: (item: {title: string, id: string}) => void;

  constructor(app: App, channelList: Array<{title: string, id: string}>, onSelect: (item: {title: string, id: string}) => void) {
    super(app);
    this.channelList = channelList;
    this.onSelect = onSelect;
    this.setPlaceholder(t('actions.set_channel.select_channel'));
  }

  getSuggestions(): Array<{title: string, id: string}> {
    return this.channelList;
  }

  renderSuggestion(item: {title: string, id: string}, el: HTMLElement) {
    el.createEl("div", { text: item.title });
  }

  onChooseSuggestion(item: {title: string, id: string}) {
    this.onSelect(item);
  }
}

export default function setChannel(app: App, settings: QuailPluginSettings, saveSettings: () => Promise<void>) {
  let name = english('actions.set_channel');
  if (!settings.useEnglishCmds) {
    name = t('actions.set_channel');
  }

  return {
    id: 'quail-set-channel',
    name: name,
    callback: async () => {
      try {
        const lists = settings.lists;
        if (!lists || lists.length === 0) {
          new MessageModal(app, {
            title: t('message_modal.no_channels_found.title'),
            message: t('message_modal.no_channels_found.desc'),
            icon: "⚠️",
            iconColor: "orange"
          }).open();
          return;
        }

        const channelList = lists.map((list: any) => ({
          title: list.title,
          id: `${list.id}`
        }));

        new ChannelSuggestModal(app, channelList, async (item) => {
          for (let ix = 0; ix < lists.length; ix++) {
            if (`${lists[ix].id}` === item.id) {
              settings.listID = `${lists[ix].id}`;
              settings.listSlug = lists[ix].slug;
              await saveSettings();
              new Notice(t('notices.set_channel_success', { title: item.title }));
              return;
            }
          }
        }).open();
      } catch (e) {
        new ErrorModal(app, e).open();
      }
    }
  };
}
