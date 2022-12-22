import {syntaxTree} from "@codemirror/language"
import {WidgetType, EditorView, Decoration, DecorationSet} from "@codemirror/view"


import type { EditorState, Extension, Range, Transaction, ChangeSet } from '@codemirror/state'
import { RangeSet, StateField } from '@codemirror/state'


class CellDisplay extends WidgetType {
    code: string

    constructor(code: string) { 
        super() 
        this.code = code
    }

    eq(other: CellDisplay) { return other.code == this.code }

    toDOM() {
        let wrap = document.createElement("div")
        wrap.style.backgroundColor = "cyan"
        wrap.style.border = "1px solid black"
        wrap.innerHTML = this.code
        return wrap
    }

    ignoreEvent() { return true }
}


class CellInfo {
    from: number
    to: number
    codeText: string

    constructor(from: number,to: number,codeText: string) {
        this.from = from
        this.to = to
        this.codeText = codeText
    }
}

class CellState {
    cells: CellInfo[] = []
    decorations: RangeSet<Decoration>

    constructor(cells: CellInfo[], decorations: RangeSet<Decoration>) {
        this.cells = cells
        this.decorations = decorations
    }
}

export const codeEvaluator = (): Extension => {

    const processUpdate = (cellState: CellState | null, editorState: EditorState, changes: ChangeSet | null) => {
        const widgets: Range<Decoration>[] = []
        const cells: CellInfo[] = []

        syntaxTree(editorState).iterate({
            enter: (node) => {
                if (node.name == "CodeBlock") {

                    //I want to do the following:
                    // - if a change set and cell state is passed in, check if a cell
                    // maps to a previous cell, and if so, does it need to be udpated
                    // or just remapped
                    // - delete cells that are deleted
                    //I will use the change set and the old cell state


                    let codeText = editorState.doc.sliceString(node.from, node.to+1)
                    //I should annotate the name,assignOp,body within the code block

                    let cellInfo: CellInfo | null = null
                    cellInfo = new CellInfo(node.from,node.to,codeText)
                    cells.push(cellInfo)

                    let decoration = Decoration.widget({
                        widget: new CellDisplay(codeText),
                        block: true,
                        side: 1
                    })

                    widgets.push(decoration.range(node.to))

                    ///////////////////////////
                    //type safety and remapping example
                    if((cellState != null)&&(changes != null)) {
                        let cells = cellState!.cells

                        if(cells.length > 0) {
                            let cell = cells[0]
                            cell.from
                            cell.to

                            //get the new positions if we hav a cell we can remap - meaning no change to the cell
                            let newFrom = changes!.mapPos(cell.from)
                            let newTo = changes!.mapPos(cell.to)

                            //remap the decoration 
                            let oldDecoration = decoration  //this is just to get a decoration
                            let newDecoration = oldDecoration.range(newTo)

                            //cellState!.decorations.map(changes)  YES!

                        }
                    }
                    ///////////////////////////
                }  
            }
        } )
        
        let decorations = widgets.length > 0 ? RangeSet.of(widgets) : Decoration.none
        return new CellState(cells,decorations)
    }

    const CellField = StateField.define<CellState>({
        create(state) {
            return processUpdate(null,state,null)
        },
        update(cellState, transaction) {
            if (transaction.docChanged) {
                return processUpdate(cellState,transaction.state,transaction.changes)
            }
            else {
                //I need to process changes to the selection - to detect saves

                return cellState
            }
        },
        provide(field) {
            return EditorView.decorations.from(field,f => f.decorations)
        },
    })

    return [
        CellField,
    ]
}
