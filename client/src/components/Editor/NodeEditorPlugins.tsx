import {mergeAttributes, Node} from '@tiptap/core'
import {ReactNodeViewRenderer} from "@tiptap/react";
import {FreeTextEditorComponent} from "../FreeText/FreeTextEditorComponent.tsx";
import {MCChoiceEditorComponent} from "../MC/MCChoiceEditorComponent.tsx";
import {GeoGebraEditorComponent} from "../GeoGebra/GeoGebraEditorComponent.tsx";
import {FreeTextInlineEditorComponent} from "../FreeText/FreeTextInlineEditorComponent.tsx";
import {NumericEditorComponent} from "../Numeric/NumericEditorComponent.tsx";
import {LaTeXComponent} from "../LaTeX/LaTeXComponent.tsx";
import {SingleChoiceEditorComponent} from "../SC/SingleChoiceEditorComponent.tsx";
import {LineEquationEditorComponent} from "../LineEquation/LineEquationEditorComponent.tsx";
import {GeoGebraSlopeEditorComponent} from "../GeoGebra/SlopeTriangle/GeoGebraSlopeEditorComponent.tsx";
import {AlgebraEditorComponent} from "../Algebra/AlgebraEditorComponent.tsx";

export const MCChoice = Node.create({
    name: 'mcChoice',
    group: 'inline',
    inline: true,
    atom: false,
    content: 'block+',

    addAttributes() {
        return {
            id: { default: null },
            groupId: { default: null },
            checked: { default: false },
            allGroups: { default: [] },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="mcChoice"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(HTMLAttributes, {
                'data-type': 'mcChoice',
                class: 'mc-choice',
            }),
            0,
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(MCChoiceEditorComponent);
    },
});

export const SingleChoice = Node.create({
    name: 'singleChoice',
    group: 'inline',
    inline: true,
    atom: false,
    content: 'block+',

    addAttributes() {
        return {
            id: { default: null },
            groupId: { default: null },
            checked: { default: false },
            allGroups: { default: [] },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="singleChoice"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(HTMLAttributes, {
                'data-type': 'singleChoice',
                class: 'mc-choice',
            }),
            0,
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(SingleChoiceEditorComponent);
    },
});

export const FreeText = Node.create({
    name: 'freeText',
    group: 'block',
    content: 'inline*',
    addAttributes() {
        return {
            id: { default: null },
        }
    },
    parseHTML: () => [{ tag: 'div.free-text' }],
    renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes({ class: 'free-text' }, HTMLAttributes), 0],
    addNodeView() {
        return ReactNodeViewRenderer(FreeTextEditorComponent)
    },
})

export const GeoGebra = Node.create({
    name: 'geoGebra',
    group: 'block',
    atom: true,

    addAttributes() {
        return {
            id: { default: null },
            materialId: { default: '' },
            width: { default: '800' },
            height: { default: '600' },

            variant: {
                default: 'points', // 'points' | 'lines'
                parseHTML: element => element.getAttribute('data-variant') || 'points',
                renderHTML: attributes => ({
                    'data-variant': attributes.variant,
                }),
            },

            maxPoints: { default: 0 },
            maxLines: { default: 0 },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="geoGebra"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(HTMLAttributes, { 'data-type': 'geoGebra' }),
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(GeoGebraEditorComponent);
    },
});

export const GeoGebraSlopeNode = Node.create({
    name: 'geoGebraSlope',
    group: 'block',
    atom: true,

    addAttributes() {
        return {
            id: { default: null },
            materialId: { default: '' },
            width: { default: '800' },
            height: { default: '600' },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="geoGebraSlope"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(HTMLAttributes, { 'data-type': 'geoGebraSlope' }),
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(GeoGebraSlopeEditorComponent);
    },
});

export const FreeTextInline = Node.create({
    name: 'freeTextInline',
    group: 'inline',
    inline: true,
    atom: true,

    addAttributes() {
        return {
            id: { default: null },
            placeholder: { default: 'Freitext Antwort' },
        }
    },

    parseHTML() {
        return [{ tag: 'span[data-type="freeTextInline"]' }]
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'span',
            mergeAttributes(HTMLAttributes, {
                'data-type': 'freeTextInline',
                class: 'free-text-inline',
            }),
            HTMLAttributes.placeholder || '',
        ]
    },

    addNodeView() {
        return ReactNodeViewRenderer(FreeTextInlineEditorComponent)
    },
})

export const NumericInput = Node.create({
    name: 'numericInput',
    group: 'inline',
    inline: true,
    atom: true,
    selectable: true,

    addAttributes() {
        return {
            id: { default: null },
            size: {
                default: 'l',
            },
            mode: {
                default: 'numeric',
                parseHTML: element => element.getAttribute('data-mode') || 'numeric',
                renderHTML: attributes => ({
                    'data-mode': attributes.mode,
                }),
            },
        }
    },

    parseHTML() {
        return [{ tag: 'span[data-type="numeric-input"]' }]
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'span',
            mergeAttributes(HTMLAttributes, { 'data-type': 'numeric-input' }),
        ]
    },

    addNodeView() {
        return ReactNodeViewRenderer(NumericEditorComponent)
    },
});

export const LatexDisplay = Node.create({
    name: 'latex',

    group: 'inline',
    inline: true,
    atom: true,

    addAttributes() {
        return {
            latex: {
                default: '',
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-latex]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', { ...HTMLAttributes, 'data-latex': HTMLAttributes.latex }];
    },

    addNodeView() {
        return ReactNodeViewRenderer(LaTeXComponent);
    },
});

export const LineEquation = Node.create({
    name: 'lineEquation',

    group: 'inline',
    inline: true,
    atom: true,
    selectable: true,

    addAttributes() {
        return {
            id: { default: null },
            placeholder: { default: 'Geradengleichung Eingabe' },
        }
    },

    parseHTML() {
        return [{ tag: 'span[data-type="line-equation"]' }]
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'span',
            mergeAttributes(HTMLAttributes, {
                'data-type': 'line-equation',
                class: 'line-equation',
            }),
        ]
    },

    addNodeView() {
        return ReactNodeViewRenderer(LineEquationEditorComponent)
    },
})

export const Algebra = Node.create({
    name: 'algebra',
    group: 'inline',
    inline: true,
    atom: true,
    selectable: true,
    addAttributes() {
        return {
            id: { default: null },
            placeholder: { default: 'Algebra Eingabe' },
        }
    },
    parseHTML() {
        return [{ tag: 'span[data-type="algebra"]' }]
    },
    renderHTML({ HTMLAttributes }) {
        return [
            'span',
            mergeAttributes(HTMLAttributes, {
                'data-type': 'algebra',
                class: 'algebra',
            }),
        ]
    },
    addNodeView() {
        return ReactNodeViewRenderer(AlgebraEditorComponent)
    },
})
