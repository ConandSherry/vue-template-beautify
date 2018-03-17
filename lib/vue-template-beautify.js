'use babel';

import VueTemplateBeautifyView from './vue-template-beautify-view';
import { CompositeDisposable } from 'atom';
import prettydiff from 'prettydiff2';

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
        let editor, newTextArr, self, text;
        self = this;
        editor = atom.workspace.getActiveTextEditor();
        text = editor.getText();
        newTextArr = [];
        ['html', 'js', 'css'].forEach(function(type) {
            let newText;
            newText = self.replaceText(text, type);
            return newTextArr.push(newText);
        });
        return editor.setText(newTextArr.join('\n'));
    },
    replaceText: function(text, type) {
        let annotationRex, beautifiedText, beautify, contentRex, regObj, typeArr, typeContent, typeText, typeTextCon;
        regObj = {
            html: /(<!--\s*)?<template(\s|\S)*>(\s|\S)*<\/template>(\s*-->)?/gi,
            css: /(<!--\s*)?<style(\s|\S)*>(\s|\S)*<\/style>(\s*-->)?/gi,
            js: /(<!--\s*)?<script(\s|\S)*>(\s|\S)*<\/script>(\s*-->)?/gi
        };
        beautify = {
            html: prettydiff
        };
        if (!regObj[type].exec(text)) {
            return '';
        }
        regObj[type].lastIndex = 0;
        typeText = regObj[type].exec(text)[0];
        if (!typeText) {
            return '';
        }
        contentRex = />(\s|\S)*<\//g;
        typeTextCon = contentRex.exec(typeText)[0];
        typeContent = typeTextCon.substring(1).substr(0, typeTextCon.length - 3);
        typeArr = typeText.split(typeContent);
        if (type === 'html') {
            annotationRex = /^(<!--)(\s|\S)*(-->)$/gi;
            if (annotationRex.test(typeText)) {
                return typeText;
            }
            beautifiedText = beautify[type]({
                source: typeContent,
                quoteConvert: atom.config.get('vue-template-beautify.quoteConvert'),
                wrap: atom.config.get('vue-template-beautify.wrap'),
                force_attribute: atom.config.get('vue-template-beautify.force_attribute'),
                mode: 'beautify'
            });
            return typeArr[0] + '\n' + beautifiedText + '\n' + typeArr[1];
        } else {
            return typeText;
        }
    }
};
