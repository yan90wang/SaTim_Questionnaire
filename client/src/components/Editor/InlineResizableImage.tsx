import { Node, mergeAttributes } from '@tiptap/core'
import type {CommandProps} from '@tiptap/core'

export const InlineResizableImage = Node.create({
    name: 'image',
    inline: true,
    group: 'inline',
    atom: true,
    draggable: true,
    selectable: true,

    addAttributes() {
        return {
            src: {
                default: null,
            },
            width: {
                default: 300,
            },
            height: {
                default: null,
            },
        }
    },

    parseHTML() {
        return [{ tag: 'img[src]' }]
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'span',
            {
                style: 'display:inline-block; position:relative;',
            },
            [
                'img',
                mergeAttributes(HTMLAttributes, {
                    style: `width:${HTMLAttributes.width}px; display:block;`,
                }),
            ],
        ]
    },
// @ts-ignore
    addCommands() {
        return {
            setImage:
                (options: { src: string; width?: number; height?: number }) =>
                    ({ commands }: CommandProps) => {
                        return commands.insertContent({
                            type: this.name,
                            attrs: options,
                        })
                    },
        }
    },

    addNodeView() {
        return ({ node, getPos, editor }) => {
            const span = document.createElement('span')
            span.style.display = 'inline-block'
            span.style.position = 'relative'

            const img = document.createElement('img')
            img.src = node.attrs.src
            img.style.width = node.attrs.width + 'px'
            img.style.display = 'block'

            const handle = document.createElement('div')
            handle.style.width = '12px'
            handle.style.height = '12px'
            handle.style.background = 'red'
            handle.style.position = 'absolute'
            handle.style.right = '0'
            handle.style.bottom = '0'
            handle.style.cursor = 'nwse-resize'
            handle.style.zIndex = '1000'

            span.appendChild(img)
            span.appendChild(handle)

            let startX = 0
            let startWidth = 0

            handle.addEventListener('mousedown', (event) => {
                event.preventDefault()
                event.stopPropagation()

                startX = event.clientX
                startWidth = img.offsetWidth

                const onMouseMove = (moveEvent: MouseEvent) => {
                    const newWidth = Math.max(
                        50,
                        startWidth + (moveEvent.clientX - startX)
                    )

                    img.style.width = newWidth + 'px'

                    const pos = getPos?.()
                    if (typeof pos !== 'number') return

                    editor.commands.command(({ tr }) => {
                        tr.setNodeMarkup(pos, undefined, {
                            ...node.attrs,
                            width: newWidth,
                        })
                        return true
                    })
                }

                const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove)
                    document.removeEventListener('mouseup', onMouseUp)
                }

                document.addEventListener('mousemove', onMouseMove)
                document.addEventListener('mouseup', onMouseUp)
            })

            return {
                dom: span,
                update(updatedNode) {
                    if (updatedNode.type.name !== 'image') return false
                    img.style.width = updatedNode.attrs.width + 'px'
                    return true
                },
            }
        }
    },
})