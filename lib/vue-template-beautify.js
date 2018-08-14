'use babel';

import VueTemplateBeautifyView from './vue-template-beautify-view';
import { CompositeDisposable } from 'atom';
import prettydiff from 'prettydiff2';
const compiler = require('vue-template-compiler');

export default {
    vueTemplateBeautifyView: null,
    modalPanel: null,
    subscriptions: null,

    activate(state) {
        this.vueTemplateBeautifyView = new VueTemplateBeautifyView(state.vueTemplateBeautifyViewState);
        this.modalPanel = atom.workspace.addModalPanel({
            item: this.vueTemplateBeautifyView.getElement(),
            visible: false
        });

        // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
        this.subscriptions = new CompositeDisposable();

        // Register command that toggles this view
        this.subscriptions.add(
            atom.commands.add('atom-workspace', {
                'vue-template-beautify:toggle': () => this.beautify()
            })
        );
    },

    config: {
        wrap: {
            type: 'integer',
            title: 'wrap',
            description: `This option sets how many columns wide text content may be before wrapping onto a new line.
             The value 0 disables text wrapping.`,
            default: '160',
            minimum: 0,
            order: 1
        },
        force_attribute: {
            type: 'boolean',
            title: 'force_attribute',
            description: 'Forces all markup attributes to be indented each on their own line of code.',
            default: false,
            order: 2
        },
        quoteConvert: {
            type: 'string',
            title: 'quoteConvert',
            description: `Convert the quote characters delimiting strings from either double or single quotes to the other.`,
            default: 'none',
            enum: [
                { value: 'double', description: 'double quote' },
                { value: 'single', description: 'single quote' },
                { value: 'none', description: 'default' }
            ],
            order: 3
        }
    },
    deactivate() {
        this.modalPanel.destroy();
        this.subscriptions.dispose();
        this.vueTemplateBeautifyView.destroy();
    },

    serialize() {
        return {
            vueTemplateBeautifyViewState: this.vueTemplateBeautifyView.serialize()
        };
    },

    beautify() {
        let editor, text, cursorPosition, parse, beautifiedText;
        editor = atom.workspace.getActiveTextEditor();
        text = editor.getText();
        cursorPosition = editor.cursors[0].getScreenPosition();
        parse = compiler.parseComponent(text);
        beautifiedText = prettydiff({
            source: parse.template.content,
            quoteConvert: atom.config.get('vue-template-beautify.quoteConvert'),
            wrap: atom.config.get('vue-template-beautify.wrap'),
            force_attribute: atom.config.get('vue-template-beautify.force_attribute'),
            mode: 'beautify'
        });
        text = text.slice(0, parse.template.start) + '\n' + beautifiedText + '\n' + text.slice(parse.template.end);
        editor.setText(text);
        editor.cursors[0].setScreenPosition(cursorPosition, { autoscroll: true });
        return;
    }
};
