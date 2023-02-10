import {syntaxTree} from "@codemirror/language"
import {EditorView, Decoration, DecorationSet} from "@codemirror/view"


import type { EditorState, Extension, Range } from '@codemirror/state'
import { RangeSet, StateField } from '@codemirror/state'


export const images = (): Extension => {

    const decorate = (state: EditorState) => {
        const widgets: Range<Decoration>[] = []

        console.log("---------------------")
        let stack: number[] = []
        let prevTo = 0
        syntaxTree(state).iterate({
            enter: (node) => {
                let inBetween = state.doc.sliceString(prevTo, node.from)
                 if(inBetween.indexOf("\n") >= 0) console.log("NEWLINE")
                prevTo = node.to

                while(stack.length > 0 && stack[stack.length - 1] < node.from) stack.pop()
                let indent = "   ".repeat(stack.length)
                stack.push(node.to)
                console.log(`${indent}${node.name} from ${node.from} to ${node.to}`)
            }
        })

        return widgets.length > 0 ? RangeSet.of(widgets) : Decoration.none
    }

    const imagesField = StateField.define<DecorationSet>({
        create(state) {
            return decorate(state)
        },
        update(images, transaction) {
            if (transaction.docChanged)
                return decorate(transaction.state)

            return images.map(transaction.changes)
        },
        provide(field) {
            return EditorView.decorations.from(field)
        },
    })

    return [
        imagesField,
    ]
}

  
/*
export const checkboxPlugin = ViewPlugin.fromClass(class {
    decorations: DecorationSet

    constructor(view: EditorView) {
        this.decorations = checkboxes(view)
    }

    update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged)
            this.decorations = checkboxes(update.view)
    }
}, {
    decorations: v => v.decorations,

    eventHandlers: {
        mousedown: (e, view) => {
            let target = e.target as HTMLElement
            if (target.nodeName == "INPUT" &&
                target.parentElement!.classList.contains("cm-boolean-toggle"))
                return toggleBoolean(view, view.posAtDOM(target))
        }
    }
})

function toggleBoolean(view: EditorView, pos: number) {
    let before = view.state.doc.sliceString(Math.max(0, pos - 5), pos)
    let change
    if (before == "false")
        change = { from: pos - 5, to: pos, insert: "true" }
    else if (before.endsWith("true"))
        change = { from: pos - 4, to: pos, insert: "false" }
    else
        return false
    view.dispatch({ changes: change })
    return true
}

*/
  
