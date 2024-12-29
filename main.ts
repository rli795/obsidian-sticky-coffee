import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, TFile, normalizePath } from 'obsidian';

interface StickyNote {
	id: string;
	content: string;
	position: {
		x: number;
		y: number;
	};
	linkedFile: string;
}

interface StickyNotePluginSettings {
	notes: StickyNote[];
	defaultNoteColor: string;
	notesFolder: string;
}

const DEFAULT_SETTINGS: StickyNotePluginSettings = {
	notes: [],
	defaultNoteColor: '#ffffa5',
	notesFolder: 'sticky-notes'
}

export default class StickyNotePlugin extends Plugin {
	settings: StickyNotePluginSettings;
	activeNotes: Map<string, StickyNoteView> = new Map();
	activeEditors: Map<string, () => void> = new Map();

	async onload() {
		await this.loadSettings();

		// 添加文件菜单项
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				if (file instanceof TFile && file.extension === 'md') {
					menu.addItem((item) => {
						item
							.setTitle('Create Sticky Note')
							.setIcon('sticky-note')
							.onClick(async () => {
								await this.createStickyFromFile(file);
							});
					});
				}
			})
		);

		// 添加创建便签的命令
		this.addCommand({
			id: 'create-sticky-note',
			name: 'Create new sticky note',
			callback: () => {
				this.createNewNote();
			}
		});

		// 添加功能区图标
		this.addRibbonIcon('sticky-note', 'Create Sticky Note', (evt: MouseEvent) => {
			this.createNewNote();
		});

		// 添加设置选项卡
		this.addSettingTab(new StickyNoteSettingTab(this.app, this));

		// 监听编辑器变化
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', (leaf) => {
				this.handleActiveLeafChange(leaf);
			})
		);

		// 注册文件修改事件（作为备份机制）
		this.registerEvent(
			this.app.vault.on('modify', (file) => {
				if (file instanceof TFile) {
					this.handleFileModify(file);
				}
			})
		);

		// 恢复已保存的便签
		this.loadSavedNotes();
	}

	private handleActiveLeafChange(leaf: WorkspaceLeaf | null) {
		if (leaf) {
			const view = leaf.view;
			if (view instanceof MarkdownView && view.file) {
				const file = view.file;
				const note = this.settings.notes.find(n => n.linkedFile === file.path);
				if (note) {
					// 清除之前的编辑器事件监听
					const cleanup = this.activeEditors.get(note.id);
					if (cleanup) {
						cleanup();
						this.activeEditors.delete(note.id);
					}

					// 注册编辑器变化事件
					const editor = view.editor;
					
					// 注册键盘事件拦截器
					const keyHandler = (e: KeyboardEvent) => {
						// 如果焦点在便签上，阻止事件传播
						const stickyView = this.activeNotes.get(note.id);
						if (stickyView && stickyView.hasFocus()) {
							e.stopPropagation();
							return;
						}
					};

					// 注册编辑器变化事件
					this.registerEvent(
						this.app.workspace.on('editor-change', (changedEditor) => {
							if (changedEditor === editor) {
								const content = editor.getValue();
								const stickyView = this.activeNotes.get(note.id);
								if (stickyView && !stickyView.hasFocus()) {
									stickyView.updateContent(content, false);
								}
								note.content = content;
								this.saveSettings();
							}
						})
					);

					// 注册键盘事件监听
					this.registerDomEvent(document, 'keydown', keyHandler);
					this.registerDomEvent(document, 'keypress', keyHandler);
					this.registerDomEvent(document, 'keyup', keyHandler);

					// 保存清理函数（事件会在插件卸载时自动清理）
					this.activeEditors.set(note.id, () => {});
				}
			}
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async createNewNote() {
		const id = Date.now().toString();
		const date = new Date();
		const fileName = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;
		
		const note: StickyNote = {
			id,
			content: '',
			position: {
				x: window.innerWidth / 2 - 100,
				y: window.innerHeight / 2 - 75
			},
			linkedFile: `${this.settings.notesFolder}/${fileName}.md`
		};

		try {
			// 创建关联的 Markdown 文件
			await this.createNoteFile(note);

			// 创建便签视图
			const view = new StickyNoteView(this.app, this, note);
			this.activeNotes.set(id, view);
			
			// 保存便签信息
			this.settings.notes.push(note);
			await this.saveSettings();
		} catch (error) {
			console.error('Error creating new note:', error);
			new Notice(`Failed to create new note: ${error.message}`);
		}
	}

	async createNoteFile(note: StickyNote) {
		try {
			const folderPath = normalizePath(this.settings.notesFolder);
			const filePath = normalizePath(note.linkedFile);
			
			// 确保文件夹存在
			if (!(await this.app.vault.adapter.exists(folderPath))) {
				await this.app.vault.createFolder(folderPath);
				console.log(`Created folder: ${folderPath}`);
			}

			// 创建 Markdown 文件内容（不再添加标题）
			const content = note.content;
			
			try {
				// 尝试创建文件
				const file = await this.app.vault.create(filePath, content);
				console.log(`Successfully created file: ${filePath}`);
				new Notice(`Created note file: ${filePath}`);
				return file;
			} catch (fileError) {
				console.error('Error creating file:', fileError);
				// 检查文件是否已存在
				const existingFile = this.app.vault.getAbstractFileByPath(filePath);
				if (existingFile instanceof TFile) {
					// 如果文件已存在，则更新内容
					await this.app.vault.modify(existingFile, content);
					console.log(`Updated existing file: ${filePath}`);
					new Notice(`Updated existing note file: ${filePath}`);
					return existingFile;
				} else {
					throw fileError;
				}
			}
		} catch (error) {
			console.error('Error in createNoteFile:', error);
			new Notice(`Failed to create note file: ${error.message}`);
			throw error;
		}
	}

	async loadSavedNotes() {
		for (const note of this.settings.notes) {
			const view = new StickyNoteView(this.app, this, note);
			this.activeNotes.set(note.id, view);
		}
	}

	async updateNoteContent(noteId: string, content: string) {
		const note = this.settings.notes.find(n => n.id === noteId);
		if (note) {
			note.content = content;
			await this.saveSettings();

			// 更新关联的 Markdown 文件
			const file = this.app.vault.getAbstractFileByPath(note.linkedFile);
			if (file instanceof TFile) {
				await this.app.vault.modify(file, content);
			}
		}
	}

	async deleteNote(noteId: string) {
		// 删除视图
		const view = this.activeNotes.get(noteId);
		if (view) {
			view.destroy();
			this.activeNotes.delete(noteId);
		}

		// 删除设置中的记录
		const noteIndex = this.settings.notes.findIndex(n => n.id === noteId);
		if (noteIndex > -1) {
			this.settings.notes.splice(noteIndex, 1);
			await this.saveSettings();
		}
	}

	onunload() {
		// 清理所有活动的便签视图
		for (const view of this.activeNotes.values()) {
			view.destroy();
		}
		// 清理所有编辑器事件监听
		for (const cleanup of this.activeEditors.values()) {
			cleanup();
		}
	}

	// 处理文件修改事件
	async handleFileModify(file: TFile) {
		// 检查是否是便签关联的文件
		const note = this.settings.notes.find(n => n.linkedFile === file.path);
		if (note) {
			// 读取文件内容
			const content = await this.app.vault.read(file);
			
			// 更新便签内容
			const view = this.activeNotes.get(note.id);
			if (view) {
				view.updateContent(content, false); // false 表示不要触发回写文件
			}
			
			// 更新存储的内容
			note.content = content;
			await this.saveSettings();
		}
	}

	async createStickyFromFile(file: TFile) {
		// 检查是否已经有关联的便签
		const existingNote = this.settings.notes.find(n => n.linkedFile === file.path);
		if (existingNote) {
			// 如果已经有便签，恢复它
			const view = new StickyNoteView(this.app, this, existingNote);
			this.activeNotes.set(existingNote.id, view);
			new Notice('Restored existing sticky note');
			return;
		}

		// 创建新的便签
		const id = Date.now().toString();
		const content = await this.app.vault.read(file);
		const note: StickyNote = {
			id,
			content,  // 使用文件的完整内容
			position: {
				x: window.innerWidth / 2 - 100,
				y: window.innerHeight / 2 - 75
			},
			linkedFile: file.path
		};

		// 创建便签视图
		const view = new StickyNoteView(this.app, this, note);
		this.activeNotes.set(id, view);
		
		// 保存便签信息
		this.settings.notes.push(note);
		await this.saveSettings();

		// 立即触发 active-leaf-change 事件处理
		const activeLeaf = this.app.workspace.getActiveViewOfType(MarkdownView)?.leaf;
		if (activeLeaf) {
			this.handleActiveLeafChange(activeLeaf);
		}
	}
}

class StickyNoteView {
	private container: HTMLElement;
	private content: HTMLTextAreaElement;
	private isDragging: boolean = false;
	private dragStartX: number = 0;
	private dragStartY: number = 0;

	constructor(
		private app: App,
		private plugin: StickyNotePlugin,
		private note: StickyNote
	) {
		this.createNoteElement();
	}

	public hasFocus(): boolean {
		return document.activeElement === this.content;
	}

	private createNoteElement() {
		this.container = document.createElement('div');
		this.container.className = 'sticky-note';
		this.container.style.left = `${this.note.position.x}px`;
		this.container.style.top = `${this.note.position.y}px`;

		// 创建头部
		const header = document.createElement('div');
		header.className = 'sticky-note-header';
		
		// 添加拖动功能
		header.addEventListener('mousedown', this.handleDragStart.bind(this));
		document.addEventListener('mousemove', this.handleDragMove.bind(this));
		document.addEventListener('mouseup', this.handleDragEnd.bind(this));

		// 添加按钮
		const buttons = document.createElement('div');
		buttons.className = 'sticky-note-buttons';

		const deleteButton = document.createElement('button');
		deleteButton.className = 'sticky-note-button';
		deleteButton.innerHTML = '×';
		deleteButton.addEventListener('click', () => {
			this.plugin.deleteNote(this.note.id);
		});

		buttons.appendChild(deleteButton);
		header.appendChild(buttons);

		// 创建内容区域
		this.content = document.createElement('textarea');
		this.content.className = 'sticky-note-content';
		this.content.value = this.note.content;
		this.content.addEventListener('input', this.handleContentChange.bind(this));
		
		// 处理键盘事件
		this.content.addEventListener('keydown', (e: KeyboardEvent) => {
			// 阻止事件冒泡
			e.stopPropagation();
			e.stopImmediatePropagation();

			// 如果是回车键，手动插入换行符
			if (e.key === 'Enter') {
				const start = this.content.selectionStart;
				const end = this.content.selectionEnd;
				const value = this.content.value;
				
				// 在光标位置插入换行符
				this.content.value = value.substring(0, start) + '\n' + value.substring(end);
				
				// 将光标移动到换行符后
				this.content.selectionStart = this.content.selectionEnd = start + 1;
				
				// 触发内容更新
				this.handleContentChange();
				
				// 阻止默认行为
				e.preventDefault();
			}
		}, true);

		// 防止便签失去焦点
		this.content.addEventListener('blur', (e: FocusEvent) => {
			// 如果不是点击了删除按钮，就保持焦点
			if (!(e.relatedTarget instanceof HTMLElement && e.relatedTarget.classList.contains('sticky-note-button'))) {
				e.preventDefault();
				this.content.focus();
			}
		});

		// 确保便签创建后立即获得焦点
		this.content.addEventListener('mousedown', (e: MouseEvent) => {
			e.stopPropagation();
		});

		this.container.appendChild(header);
		this.container.appendChild(this.content);
		document.body.appendChild(this.container);
		
		// 立即聚焦到内容区域
		this.content.focus();
	}

	private handleDragStart(e: MouseEvent) {
		this.isDragging = true;
		this.dragStartX = e.clientX - this.note.position.x;
		this.dragStartY = e.clientY - this.note.position.y;
		e.preventDefault();
	}

	private handleDragMove(e: MouseEvent) {
		if (!this.isDragging) return;

		const newX = e.clientX - this.dragStartX;
		const newY = e.clientY - this.dragStartY;

		this.container.style.left = `${newX}px`;
		this.container.style.top = `${newY}px`;

		this.note.position = { x: newX, y: newY };
	}

	private handleDragEnd() {
		this.isDragging = false;
		this.plugin.saveSettings();
	}

	private handleContentChange() {
		const content = this.content.value;
		this.updateContent(content, true);
	}

	public updateContent(content: string, shouldSaveToFile: boolean) {
		// 更新文本区域
		if (this.content.value !== content) {
			this.content.value = content;
		}

		// 如果需要，保存到文件
		if (shouldSaveToFile) {
			this.plugin.updateNoteContent(this.note.id, content);
		}
	}

	destroy() {
		this.container.remove();
	}
}

class StickyNoteSettingTab extends PluginSettingTab {
	plugin: StickyNotePlugin;

	constructor(app: App, plugin: StickyNotePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Notes folder')
			.setDesc('The folder where markdown files for sticky notes will be stored')
			.addText(text => text
				.setPlaceholder('sticky-notes')
				.setValue(this.plugin.settings.notesFolder)
				.onChange(async (value) => {
					this.plugin.settings.notesFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Default note color')
			.setDesc('The default background color for new sticky notes')
			.addText(text => text
				.setPlaceholder('#ffffa5')
				.setValue(this.plugin.settings.defaultNoteColor)
				.onChange(async (value) => {
					this.plugin.settings.defaultNoteColor = value;
					await this.plugin.saveSettings();
				}));
	}
}
