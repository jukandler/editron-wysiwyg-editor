/* global document, MediumEditor */
const m = require("mithril");
const Label = require("mithril-material-forms").label;
const EditorDefaultOptions = require("./defaultOptions.json");
const isEmptyHTML = require("./isEmptyHTML");
// const _ = require("../../i18n").translate;

const HTMLView = require("./HTMLView");
const OverlayService = require("editron-core/services/OverlayService");


const View = {

    createEditor($textarea, attrs) {
        const options = Object.assign(EditorDefaultOptions, {
            placeholder: {
                text: attrs.placeholder,
                hideOnClick: true
            }
        });
        // merge toolbar options (buttons)
        options.toolbar = Object.assign(options.toolbar, attrs.mediumEditorOptions);

        this.editor = new MediumEditor($textarea, options);

        if (this.editor.getContent == null) {
            // version 5.16.1 - where paste (cmd+v) does work as expected
            this.editor.getContent = () => this.editor.elements[0].innerHTML;
        }

        this.editor.subscribe("blur", () => {
            const value = this.editor.getContent();
            this.blur(value);
            attrs.onblur(value);
        });

        this.editor.subscribe("focus", () => {
            this.focus();
            attrs.onfocus();
        });
    },

    destroyEditor() {
        this.editor.destroy();
    },

    showHTMLMarkup(attrs) {
        // we need a DOM-Node for the Overlay-Service
        const $dialog = document.createElement("div");

        OverlayService.open($dialog, {
            ok: true,
            save: false,
            onAbort: () => m.render($dialog, m("i")) // destroy the editor
        });

        // render the html editor, when the parent node is within the dom. Or else no content will be drawn
        m.render($dialog, m(HTMLView, {
            value: this.editor.getContent(),
            onchange: (value) => {
                this.blur(value);
                attrs.onblur(value);
            }
        }));
    },

    setValue(value) {
        // value = isEmptyHTML(value) ? "" : value;
        if (this.editor) {
            this.editor.setContent(value);
        }
        if (this.htmlEditor) {
            this.htmlEditor.setValue(value);
        }
    },

    focus() {
        this.$element.classList.remove("hasNoFocus");
        this.$element.classList.add("hasFocus");
    },

    blur(value) {
        this.$element.classList.remove("hasFocus");
        this.$element.classList.add("hasNoFocus");
        this.updateClasses(value);
    },

    updateClasses(value) {
        const isEmpty = isEmptyHTML(value);
        this.$element.classList.remove(isEmpty ? "isNotEmpty" : "isEmpty");
        this.$element.classList.add(isEmpty ? "isEmpty" : "isNotEmpty");
    },

    onupdate(vnode) {
        this.setValue(vnode.attrs.value);
    },

    oncreate(vnode) {
        this.$element = vnode.dom;
    },

    view(vnode) {
        const attrs = Object.assign({
            id: null,
            title: "",
            value: "",
            errors: [],
            mediumEditorOptions: {},
            description: "",
            placeholder: "",
            onblur: Function.prototype,
            onfocus: Function.prototype
        }, vnode.attrs);

        return m(".editron-wysiwig-editor.mmf-form",
            {
                // eslint-disable-next-line max-len
                "class": `hasNoFocus ${attrs.errors.length > 0 ? "hasError" : "hasNoError"} ${isEmptyHTML(attrs.value) ? "isEmpty" : "isNotEmpty"}`
            },
            m(".editron-wysiwig-editor__actions",
                m(".editron-container__controls.editron-container__controls--child",
                    m("i.mmf-icon",
                        {
                            // title: _("wysiwyg:edithtml:tooltip"),
                            onclick: () => this.showHTMLMarkup(attrs)
                        },
                        "code"
                    )
                )
            ),
            m(Label, attrs),
            m("textarea", {
                rows: 1,
                id: attrs.id,
                value: attrs.value,
                oncreate: (node) => this.createEditor(node.dom, attrs),
                onbeforeremove: () => this.destroyEditor()
            }),
            m("ul", attrs.errors.map((error) =>
                m("li", error)
            )),
            m(".mmf-meta",
                attrs.description
            )
        );
    }
};


module.exports = View;