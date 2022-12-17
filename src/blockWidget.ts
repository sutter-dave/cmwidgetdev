import {syntaxTree} from "@codemirror/language"
import {WidgetType, EditorView, Decoration, DecorationSet} from "@codemirror/view"


import type { EditorState, Extension, Range } from '@codemirror/state'
import { RangeSet, StateField } from '@codemirror/state'


/////////////////////////////////////////
// This code is from the codemirror examples https://codemirror.net/examples/decoration/
// the Boolean Toggle Widget
// I tried adding a block type widget, but it didn't work. That can not be a plugin (since it changes 
// vertical spacing). Anotehr example is Underlining command which is also not a plugin. I should
// try to udnerstan that one next time I work with this.


/*
class CheckboxWidget extends WidgetType {
    constructor(readonly checked: boolean) { super() }
  
    eq(other: CheckboxWidget) { return other.checked == this.checked }
  
    toDOM() {
      let wrap = document.createElement("span")
      wrap.setAttribute("aria-hidden", "true")
      wrap.className = "cm-boolean-toggle"
      let box = wrap.appendChild(document.createElement("input"))
      box.type = "checkbox"
      box.checked = this.checked
      return wrap
    }
  
    ignoreEvent() { return false }
  }
  */

class MyBlockWidget extends WidgetType {
    code: string

    constructor(code: string) { 
        super() 
        this.code = code
    }

    eq(other: MyBlockWidget) { return other.code == this.code }

    toDOM() {
        let wrap = document.createElement("div")
        wrap.style.backgroundColor = "cyan"
        wrap.style.border = "1px solid black"
        wrap.innerHTML = this.code
        return wrap
    }

    ignoreEvent() { return true }
}

/*
function blockWidgets(view: EditorView) {
    let widgets: any = []
    for (let { from, to } of view.visibleRanges) {
        syntaxTree(view.state).iterate({
            from, to,
            enter: (node) => {

                // if (node.name == "BooleanLiteral") {
                //     let isTrue = view.state.doc.sliceString(node.from, node.to) == "true"
                //     let deco = Decoration.widget({
                //         widget: new CheckboxWidget(isTrue),
                //         side: 1
                //     })
                //     widgets.push(deco.range(node.to))
                // }

                if (node.name == "ForStatement") {
                    let deco = Decoration.widget({
                        widget: new MyBlockWidget(),
                        block: true,
                        side: 1
                    })
                    widgets.push(deco.range(node.to))
                }  
            }
        })
    }
    return Decoration.set(widgets)
}
*/

export const images = (): Extension => {
/*
    const imageRegex = /!\[.*?\]\((?<url>.*?)\)/

    const imageDecoration = (imageWidgetParams: ImageWidgetParams) => Decoration.widget({
        widget: new ImageWidget(imageWidgetParams),
        side: -1,
        block: true,
    })
*/
    const decorate = (state: EditorState) => {
        const widgets: Range<Decoration>[] = []

        syntaxTree(state).iterate({
//            from, to,
            enter: (node) => {
/*
                if (node.name == "BooleanLiteral") {
                    let isTrue = view.state.doc.sliceString(node.from, node.to) == "true"
                    let deco = Decoration.widget({
                        widget: new CheckboxWidget(isTrue),
                        side: 1
                    })
                    widgets.push(deco.range(node.to))
                }
*/
                if (node.name == "ForStatement") {
                    //this is the content:
                    //Note - we visit this every change in the doc
                    //view.state.doc.sliceString(node.from, node.to+1)
                    let deco = Decoration.widget({
                        widget: new MyBlockWidget(state.doc.sliceString(node.from, node.to+1)),
                        block: true,
                        side: 1
                    })
                    widgets.push(deco.range(node.to))
                }  
            }
        })

/* images widget code:
        syntaxTree(state).iterate({
            enter: ({ type, from, to }) => {
                if (type.name === 'Image') {
                    const result = imageRegex.exec(state.doc.sliceString(from, to))

                    if (result && result.groups && result.groups.url)
                        widgets.push(imageDecoration({ url: result.groups.url }).range(state.doc.lineAt(from).from))
                }
            },
        })
*/
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
  
