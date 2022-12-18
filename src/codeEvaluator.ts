import {syntaxTree} from "@codemirror/language"
import {WidgetType, EditorView, Decoration, DecorationSet} from "@codemirror/view"


import type { EditorState, Extension, Range } from '@codemirror/state'
import { RangeSet, StateField } from '@codemirror/state'


class ResultCell extends WidgetType {
    code: string

    constructor(code: string) { 
        super() 
        this.code = code
    }

    eq(other: ResultCell) { return other.code == this.code }

    toDOM() {
        let wrap = document.createElement("div")
        wrap.style.backgroundColor = "cyan"
        wrap.style.border = "1px solid black"
        wrap.innerHTML = this.code
        return wrap
    }

    ignoreEvent() { return true }
}


export const codeEvaluator = (): Extension => {

    const decorate = (state: EditorState) => {
        const widgets: Range<Decoration>[] = []

        syntaxTree(state).iterate({
//            from, to,
            enter: (node) => {
                //if (node.name == "FencedCode") {
                if (node.name == "CodeBlock") {
                    //this is the content:
                    //Note - we visit this every change in the doc
                    //view.state.doc.sliceString(node.from, node.to+1)
                    let deco = Decoration.widget({
                        widget: new ResultCell(state.doc.sliceString(node.from, node.to+1)),
                        block: true,
                        side: 1
                    })
                    widgets.push(deco.range(node.to))
                }  
            }
        } )
        return widgets.length > 0 ? RangeSet.of(widgets) : Decoration.none
    }

    const resultCellField = StateField.define<DecorationSet>({
        create(state) {
            return decorate(state)
        },
        update(resultCells, transaction) {
            if (transaction.docChanged)
                return decorate(transaction.state)

            return resultCells.map(transaction.changes)
        },
        provide(field) {
            return EditorView.decorations.from(field)
        },
    })

    return [
        resultCellField,
    ]
}
