import {mergeAttributes, Node} from '@tiptap/core'
import {ReactNodeViewRenderer} from "@tiptap/react";
import {FreeTextAnswerComponent} from "../FreeText/FreeTextAnswerComponent.tsx";
import {MCChoiceAnswerComponent} from "../MC/MCChoiceAnswerComponent.tsx";
import {GeoGebraAnswerNodeView} from "../GeoGebra/GeoGebraAnswerNodeView.tsx";
import {FreeTextInlineAnswerComponent} from "../FreeText/FreeTextInlineAnswerComponent.tsx";
import {NumericAnswerComponent} from "../Numeric/NumericAnswerComponent.tsx";
import {SingleChoiceAnswerComponent} from "../SC/SingleChoiceAnswerComponent.tsx";
import {LineEquationAnswerComponent} from "../LineEquation/LineEquationAnswerComponent.tsx";
import {GeoGebraSlopeAnswerNodeView} from "../GeoGebra/SlopeTriangle/GeoGebraSlopeAnswerNodeView.tsx";
import {AlgebraAnswerComponent} from "../Algebra/AlgebraAnswerComponent.tsx";

export const FreeText = Node.create({
    name: 'freeText',
    group: 'block',
    content: 'inline*',
    addAttributes() {
        return {
            id: { default: null },
            value: { default: '', parseHTML: el => el.getAttribute('data-value') || '', renderHTML: attrs => ({ 'data-value': attrs.value }) },
        }
    },
    parseHTML: () => [{ tag: 'div.free-text' }],
    renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes({ class: 'free-text' }, HTMLAttributes), 0],
    addNodeView() {
        return ReactNodeViewRenderer(FreeTextAnswerComponent)
    },
})

export const FreeTextInline = Node.create({
    name: 'freeTextInline',
    group: 'inline',
    inline: true,
    atom: true,
    selectable: true,
    addAttributes() {
        return {
            id: { default: null },
            value: { default: '', parseHTML: el => el.getAttribute('data-value') || '', renderHTML: attrs => ({ 'data-value': attrs.value }) },
            placeholder: { default: 'Antwort...' },
        }
    },
    parseHTML() {
        return [{ tag: 'span[data-type="freeTextInline"]' }]
    },
    renderHTML({ HTMLAttributes }) {
        return [
            'span',
            mergeAttributes(HTMLAttributes, { 'data-type': 'freeTextInline', class: 'free-text-inline' }),
            HTMLAttributes.value || HTMLAttributes.placeholder || ''
        ]
    },
    addNodeView() {
        return ReactNodeViewRenderer(FreeTextInlineAnswerComponent)
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
            maxPoints: {default: 0},
            maxLines: { default: 0 },
            variant: {
                default: 'points',
                parseHTML: el => el.getAttribute('data-variant') || 'points',
                renderHTML: attrs => ({ 'data-variant': attrs.variant }),
            },
            value: {
                default: [],
            },
            answer: {
                default: null
            },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="geoGebra"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'geoGebra' })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(GeoGebraAnswerNodeView);
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
            value: {
                default: null,
            },
            answer: {
                default: null
            },
        };
    },
    parseHTML() {
        return [{ tag: 'div[data-type="geoGebraSlope"]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'geoGebraSlope' })];
    },
    addNodeView() {
        return ReactNodeViewRenderer(GeoGebraSlopeAnswerNodeView);
    },
});

export const MCChoice = Node.create({
    name: "mcChoice",
    group: "inline",
    inline: true,
    atom: false,
    content: "block+",
    addAttributes() {
        return {
            id: { default: null },
            groupId: { default: null },
            selected: { default: false },
        };
    },
    parseHTML() {
        return [{ tag: "div[data-type='mcChoice']" }];
    },
    renderHTML({ HTMLAttributes }) {
        return [
            "div",
            mergeAttributes(HTMLAttributes, { "data-type": "mcChoice", class: "mc-choice" }),
            0,
        ];
    },
    addNodeView() {
        return ReactNodeViewRenderer(MCChoiceAnswerComponent);
    },
});

export const SingleChoice = Node.create({
    name: "singleChoice",
    group: "inline",
    inline: true,
    atom: false,
    content: "block+",
    addAttributes() {
        return {
            id: { default: null },
            groupId: { default: null },
            selected: { default: false },
        };
    },
    parseHTML() {
        return [{ tag: "div[data-type='singleChoice']" }];
    },
    renderHTML({ HTMLAttributes }) {
        return [
            "div",
            mergeAttributes(HTMLAttributes, { "data-type": "singleChoice", class: "single-choice" }),
            0,
        ];
    },
    addNodeView() {
        return ReactNodeViewRenderer(SingleChoiceAnswerComponent);
    },
});


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
            value: {
                default: '',
                parseHTML: element => element.getAttribute('data-value') || '',
                renderHTML: attributes => ({
                    'data-value': attributes.value,
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
        return ReactNodeViewRenderer(NumericAnswerComponent)
    },
})

export const LineEquation = Node.create({
    name: 'lineEquation',

    group: 'inline',
    inline: true,
    atom: true,
    selectable: true,

    addAttributes() {
        return {
            id: {
                default: null,
            },
            value: {
                default: '',
                parseHTML: element => element.getAttribute('data-value') || '',
                renderHTML: attributes => ({
                    'data-value': attributes.value,
                }),
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-type="line-equation"]',
            },
        ]
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
        return ReactNodeViewRenderer(LineEquationAnswerComponent)
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
            id: {
                default: null,
            },
            value: {
                default: '',
                parseHTML: element => element.getAttribute('data-value') || '',
                renderHTML: attributes => ({
                    'data-value': attributes.value,
                }),
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-type="algebra"]',
            },
        ]
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
        return ReactNodeViewRenderer(AlgebraAnswerComponent)
    },
})
