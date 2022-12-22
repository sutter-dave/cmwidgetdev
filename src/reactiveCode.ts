import {syntaxTree} from "@codemirror/language"
import {WidgetType, EditorView, Decoration} from "@codemirror/view"
import type { EditorState, Extension, Range, ChangeSet } from '@codemirror/state'
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
    readonly from: number
    readonly to: number
    readonly codeText: string

    constructor(from: number,to: number,codeText: string) {
        this.from = from
        this.to = to
        this.codeText = codeText
    }
}

class CellState {
    readonly cells: CellInfo[] = []
    readonly decorationSet: RangeSet<Decoration>

    constructor(cells: CellInfo[], decorationSet: RangeSet<Decoration>) {
        this.cells = cells
        this.decorationSet = decorationSet
    }
}

type CellUpdateInfo = {
    cellInfo: CellInfo
    changed: boolean
    newStart: number
    newEnd?: number //don't record the new end if theobject was changed. We might not know it.
}

class CellTransitionInfo {
    readonly cellMap: Record<number,CellUpdateInfo> = {}
    readonly cellsToDelete: CellInfo[] = []

    constructor(cellMap: Record<number,CellUpdateInfo>,cellsToDelete: CellInfo[]) {
        this.cellMap = cellMap
        this.cellsToDelete = cellsToDelete
    }

    getCellUpdateInfo(from: number): CellUpdateInfo | undefined {
        return this.cellMap[from]
    }
}

/** This method processes a new or updated editor state */
function processUpdate(editorState: EditorState, cellState: CellState | null, changes: ChangeSet | null): CellState {
    let cellTransInfo: CellTransitionInfo | null = null
    if((cellState !== null)&&(changes !== null)) {
        cellTransInfo = getCellTransitionInfo(cellState!,changes!)
    }

    return updateCellState(editorState, cellTransInfo)
}

//cycle through the old cell state
// - for cells with no changes - they will be remapped
// - for cells with changes starting after beginning and ending before or after end - they will be updated
// - for cells with changed starting before beginning and ending before or after the end - they will be deleted
function getCellTransitionInfo(cellState: CellState, changes: ChangeSet): CellTransitionInfo {
    return new CellTransitionInfo({},[])
}

/** This function create a new cell display decoration object. */
function createCellDisplayObject(codeText: string, pos: number): Range<Decoration> {
    return Decoration.widget({
        widget: new CellDisplay(codeText),
        block: true,
        side: 1
    }).range(pos)
}

//cycle through the new syntax tree, processing each code block:
// - lookup transition cell info using the new start position
//   - for cells found in transition info
//     - unchanged - remap the decoration and cell info
//     - changed - crete the new decoration and cell info (with a hook to send an update command)
//   - fpr cells not found in the transition info
//     - create new decdoration and cell info (with a hook to send create command)
// - leave a hook to send delete commands for cells that should be deleted
function updateCellState(editorState: EditorState, cellTransInfo: CellTransitionInfo | null) { 
    const widgets: Range<Decoration>[] = []
    const cells: CellInfo[] = []

    syntaxTree(editorState).iterate({
        enter: (node) => {
            if (node.name == "CodeBlock") {

                let fromPos = node.from
                let toPos = node.to
                let codeText = editorState.doc.sliceString(fromPos,toPos+1)
                //I should annotate the name,assignOp,body within the code block

                let newCellInfo: CellInfo | null = null
                let newDecoObj: Range<Decoration> | null = null

                //try to look up if this is an existing cell
                let cellUpdateInfo: CellUpdateInfo | undefined = undefined
                if(cellTransInfo !== null) {
                    cellUpdateInfo = cellTransInfo.getCellUpdateInfo(fromPos)
                }

                if(cellUpdateInfo !== undefined) {
                    if(cellUpdateInfo!.changed) {
                        //update to a cell
                        //let oldCellInfo = cellUpdateInfo!.cellInfo
                        
                        //for now just create from scratch
                        newCellInfo = new CellInfo(fromPos,toPos,codeText)
                        newDecoObj = createCellDisplayObject(codeText,toPos)
                    }
                    else {
                        //no change to a cell
                        //let oldCellInfo = cellUpdateInfo!.cellInfo
                        //do I want to verify the code text did not change?

                        //for now just create from scratch
                        newCellInfo = new CellInfo(fromPos,toPos,codeText)
                        newDecoObj = createCellDisplayObject(codeText,toPos)
                    }
                }
                else {
                    //create new objects
                    newCellInfo = new CellInfo(fromPos,toPos,codeText)
                    newDecoObj = createCellDisplayObject(codeText,toPos)
                }

                cells.push(newCellInfo!)
                widgets.push(newDecoObj!)
            }
        }
    })

    let decorationSet = widgets.length > 0 ? RangeSet.of(widgets) : Decoration.none
    return new CellState(cells,decorationSet)
}
    

/** This is the extension to interface with the reactive model and display the output in the editor */
export const reactiveCode = (): Extension => {

    const ReactiveCodeField = StateField.define<CellState>({
        create(editorState) {
            return processUpdate(editorState,null,null)
        },
        update(cellState, transaction) {
            if (transaction.docChanged) {
                return processUpdate(transaction.state,cellState,transaction.changes)
            }
            else {
                //I need to process changes to the selection - to detect saves

                return cellState
            }
        },
        provide(cellState) {
            return EditorView.decorations.from(cellState,cellState => cellState.decorationSet)
        },
    })

    return [
        ReactiveCodeField,
    ]
}



    //             ///////////////////////////
    //             //type safety and remapping example
    //             if((cellState != null)&&(changes != null)) {
    //                 let cells = cellState!.cells

    //                 if(cells.length > 0) {
    //                     let cell = cells[0]
    //                     cell.from
    //                     cell.to

    //                     //get the new positions if we hav a cell we can remap - meaning no change to the cell
    //                     let newFrom = changes!.mapPos(cell.from)
    //                     let newTo = changes!.mapPos(cell.to)

    //                     //remap the decoration 
    //                     let oldDecoration = decoration  //this is just to get a decoration
    //                     let newDecoration = oldDecoration.range(newTo)

    //                     //cellState!.decorations.map(changes)  YES!

    //                 }
    //             }
    //             ///////////////////////////
    //         }  
    //     }
    // } )
