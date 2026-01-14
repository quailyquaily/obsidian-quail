import { App, PluginSettingTab, Setting } from 'obsidian';
import { QuailPlugin } from '../interface';
import manifest from '../../manifest.json';
import { ErrorModal, LoadingModal, MessageModal, PublishResultModal } from 'src/modals';
import { t } from 'src/i18n';

class QuailSettingTab extends PluginSettingTab {
	plugin: QuailPlugin;
  app: App;
	showDebugCounter = 0;
	showDebugSection = false;
	constructor(app: App, plugin: QuailPlugin) {
		super(app, plugin as never); // Type assertion to fix type mismatch
		this.plugin = plugin;
    this.app = app;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

			containerEl.createEl("h5", { text: "Quaily" });

			const me = this.plugin.settings.me;
			if (this.plugin.isLogged() && me) {
				new Setting(containerEl)
					.setHeading()
					.setName(t('settings.account.logged.title', {name: me.name}))
					.setDesc(t('settings.account.logged.desc', {email: me.email || ''}))
					.addButton(button => button
						.setButtonText(t('common.logout'))
	          .setWarning()
						.onClick(async () => {
						await this.plugin.clearTokens();
						this.display();
					})
				)
		} else {
			new Setting(containerEl)
        .setHeading()
        .setName(t('settings.account.need_to_login.title'))
        .setDesc(t('settings.account.need_to_login.desc'))
        .addButton(button => button
          .setCta()
          .setButtonText(t('common.login'))
          .onClick(async () => {
            await this.plugin.login();
            this.display();
          })
        )
		}

		const chSec = new Setting(containerEl)
			.setName(t('settings.channel.title'))
			.setDesc(t('settings.channel.desc'))
		if (this.plugin.settings.lists?.length !== 0) {
			chSec.addDropdown(dropdown => {
				if (this.plugin.settings.lists?.length === 0) {
					dropdown.addOption('none', t('settings.channel.empty'));
					} else {
						for (let ix = 0; ix < this.plugin.settings.lists.length; ix++) {
							const list = this.plugin.settings.lists[ix];
							dropdown.addOption(`${list.id}`, list.title);
						}
					}
					dropdown.setValue(this.plugin.settings.listID);
					dropdown.onChange(async (value) => {
						this.plugin.settings.listID = value;
						this.plugin.settings.listSlug = this.plugin.settings.lists.find((list) => `${list.id}` === value)?.slug || '';
						await this.plugin.saveSettings();
					});
				})
		} else {
			chSec.addButton(button => button
				.setCta()
				.setButtonText(t('settings.channel.create'))
				.onClick(async () => {
					window.open('https://quaily.com/dashboard', '_blank');
				})
			)
		}

		containerEl.createEl("h6", { text: t('settings.behavior') });

		new Setting(containerEl)
			.setName(t('settings.behavior.use_english_cmds.title'))
			.setDesc(t('settings.behavior.use_english_cmds.desc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useEnglishCmds)
				.onChange(async (value) => {
					this.plugin.settings.useEnglishCmds = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(t('settings.behavior.use_first_image_as_cover.title'))
			.setDesc(t('settings.behavior.use_first_image_as_cover.desc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useFirstImageAsCover)
				.onChange(async (value) => {
					this.plugin.settings.useFirstImageAsCover = value;
					await this.plugin.saveSettings();
				}));


		containerEl.createEl("h6", { text: t('settings.editor') });

		new Setting(containerEl)
			.setName(t('settings.editor.strict_line_breaks.title'))
			.setDesc(t('settings.editor.strict_line_breaks.desc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.strictLineBreaks)
				.onChange(async (value) => {
					this.plugin.settings.strictLineBreaks = value;
					await this.plugin.saveSettings();
				}));

		const version = containerEl.createDiv({
			cls: "setting-item",
		});

		version.innerText = `version: ${manifest.version}`;
		version.style.fontSize = "0.8em";
		version.style.width = "100%";
		version.style.textAlign = "left";
		version.style.color = "gray";
		version.onclick = () => {
			if (this.showDebugCounter === 4) {
				this.showDebugSection = !this.showDebugSection;
				this.showDebugCounter = 0;
				this.display();
			}
			this.showDebugCounter++;
		}

		if (this.showDebugSection) {
			// debug section
			containerEl.createEl("h6", { text: "Debug" });

			const textareaContainer = containerEl.createDiv({
				cls: "setting-item",
			});

			const textarea = textareaContainer.createEl("textarea", {
				cls: "setting-item-control",
				attr: { placeholder: "Enter your settings here...", disabled: "true" },
			});

			textarea.style.width = "100%";
			textarea.style.height = "200px";
			textarea.style.textAlign = "left";
			textarea.value = `list id: ${this.plugin.settings.listID}
list slug: ${this.plugin.settings.listSlug}
access token: ${this.plugin.settings.accessToken}
refresh token: ${this.plugin.settings.refreshToken}
token expiry: ${this.plugin.settings.tokenExpiry}`;

      const buttonsSec = new Setting(containerEl)
      .setName('Dialog Test')
      buttonsSec.addButton(button => button
        .setButtonText('Publish')
        .onClick(async () => {
          new PublishResultModal(this.app, null, {
						url: "https://quaily.com",
						title: "This is a test title",
						summary: "This is a test summary. The gray fox jumps over the lazy dog.",
						coverImageUrl: "https://quaily.com/portal-images/illustration/finance-you-0.webp"
					}).open();
        })
      )
      buttonsSec.addButton(button => button
        .setButtonText('Message')
        .onClick(async () => {
          new MessageModal(this.app, { title: 'Test', message: 'This is a test message.', icon: '🤖', iconColor: 'blue' }).open();
        })
      )
      buttonsSec.addButton(button => button
        .setButtonText('Loading')
        .onClick(async () => {
          new LoadingModal(this.app).open();
        })
      )
      buttonsSec.addButton(button => button
        .setButtonText('Error')
        .onClick(async () => {
          new ErrorModal(this.app, new Error('This is a test error.')).open();
        })
      )
			buttonsSec.addButton(button => button
				.setButtonText('expire token')
				.onClick(async () => {
					this.plugin.settings.tokenExpiry = '2025-03-15T00:00:00Z';
					await this.plugin.saveSettings();
				})
			)
		}
	}
}

export default QuailSettingTab;
