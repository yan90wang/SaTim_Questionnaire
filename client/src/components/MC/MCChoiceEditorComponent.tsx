import React, { useState } from 'react'
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react'

export const MCChoiceEditorComponent: React.FC<NodeViewProps> = ({
                                                                     node,
                                                                     updateAttributes,
                                                                     editor,
                                                                 }) => {
    const { groupId, allGroups } = node.attrs as { groupId?: string; allGroups?: string[] }
    const [newGroupName, setNewGroupName] = useState('')

    const collectedGroups: string[] = []
    editor.state.doc.descendants((n: any) => {
        if (n.type.name === 'mcChoice' && Array.isArray(n.attrs.allGroups)) {
            collectedGroups.push(...n.attrs.allGroups)
        }
    })

    const uniqueGroups = Array.from(new Set(collectedGroups))

    const updateAllMCChoiceNodes = (newGroupList: string[]) => {
        const tr = editor.state.tr
        editor.state.doc.descendants((node: any, pos: number) => {
            if (node.type.name === 'mcChoice') {
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, allGroups: newGroupList })
            }
        })
        editor.view.dispatch(tr)
    }

    const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateAttributes({ groupId: e.target.value })
    }

    const handleAddGroup = () => {
        const trimmed = newGroupName.trim()
        if (!trimmed) return

        const newGroupList = Array.from(new Set([...uniqueGroups, trimmed]))
        updateAllMCChoiceNodes(newGroupList)
        updateAttributes({ groupId: trimmed })
        setNewGroupName('')
    }

    return (
        <NodeViewWrapper
            className="mc-choice-wrapper"
            style={{display: 'inline-flex', flexDirection: 'row', alignItems: 'center', border: '1px solid black', borderRadius: '0.5rem', padding: '0.5rem 1rem', marginRight: '0.5rem', minHeight: '2.5rem', verticalAlign: 'top', gap: '0.5rem',}}
            data-group={groupId || ''}>
            <input type="checkbox" disabled className="w-5 h-5 cursor-not-allowed" style={{ flexShrink: 0 }}/>

            <NodeViewContent
                className="mc-choice-content"
                style={{display: 'flex', flexDirection: 'column', gap: '0.25rem', whiteSpace: 'pre-wrap',}}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginLeft: '0.5rem' }}>
                <select
                    value={groupId || ''}
                    onChange={handleGroupChange}
                    className="border rounded px-2 py-1 text-sm">
                    <option value="">— Gruppe wählen —</option>
                    {uniqueGroups.map((g) => (
                        <option key={g} value={g}>
                            {g}
                        </option>
                    ))}
                </select>

                <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <input
                        type="text"
                        placeholder="Neue Gruppe"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="border rounded px-1 py-0.5 text-sm w-24"
                    />
                    <button
                        onClick={handleAddGroup}
                        className="border rounded px-2 text-xs bg-gray-100 hover:bg-gray-200"
                        type="button">
                        +
                    </button>
                </div>
            </div>
        </NodeViewWrapper>
    )
}
