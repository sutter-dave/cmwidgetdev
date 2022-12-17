import {syntaxTree} from "@codemirror/language"
import {WidgetType, EditorView, Decoration,ViewUpdate, ViewPlugin, DecorationSet} from "@codemirror/view"

/////////////////////////////////////////
// This code is from the codemirror examples https://codemirror.net/examples/decoration/
// the Boolean Toggle Widget
// I tried adding a block type widget, but it didn't work. That can not be a plugin (since it changes 
// vertical spacing). Anotehr example is Underlining command which is also not a plugin. I should
// try to udnerstan that one next time I work with this.

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
  
  /*
  class MyBlockWidget extends WidgetType {
    constructor() { super() }
  
    eq(other: MyBlockWidget) { return true }
  
    toDOM() {
      let wrap = document.createElement("div")
      wrap.innerHTML = "This is a sample!!!"
      return wrap
    }
  
    ignoreEvent() { return true }
  }
  */
  function checkboxes(view: EditorView) {
    let widgets: any = []
    for (let {from, to} of view.visibleRanges) {
      syntaxTree(view.state).iterate({
        from, to,
        enter: (node) => {
          if (node.name == "BooleanLiteral") {
            let isTrue = view.state.doc.sliceString(node.from, node.to) == "true"
            let deco = Decoration.widget({
              widget: new CheckboxWidget(isTrue),
              side: 1
            })
            widgets.push(deco.range(node.to))
          }
  //DOH! BElow doesn't work as a plugin. We need to provide this directly. See the underlineField example to try to figure
  //out how to do this.
  /*        else if (node.name == "ForStatement") {
            let deco = Decoration.widget({
              widget: new MyBlockWidget(),
              block: true,
              side: 1
            })
            widgets.push(deco.range(node.to))
          } */  
        }
      })
    }
    return Decoration.set(widgets)
  }
  /*
  function outDisplays(view: EditorView) {
    let widgets: any = []
    for (let {from, to} of view.visibleRanges) {
      syntaxTree(view.state).iterate({
        from, to,
        enter: (node) => {
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
  
  function toggleBoolean(view : EditorView, pos : number) {
    let before = view.state.doc.sliceString(Math.max(0, pos - 5), pos)
    let change
    if (before == "false")
      change = {from: pos - 5, to: pos, insert: "true"}
    else if (before.endsWith("true"))
      change = {from: pos - 4, to: pos, insert: "false"}
    else
      return false
    view.dispatch({changes: change})
    return true
  }
  

  
