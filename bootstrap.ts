declare const Zotero: any
declare const Services: any

var stylesheetID = 'zotero-remarkable-stylesheet'
var ftlID = 'zotero-remarkable-ftl'
var menuitemID = 'make-it-green-instead'
var addedElementIDs = [stylesheetID, ftlID, menuitemID]

function log(msg) {
  Zotero.debug(`reMarkable Integration for Zotero: ${msg}`)
}

export function install() {
  log('Installed')
}

export async function startup({ id, version, rootURI }) {
  log('Starting')

  // Add a stylesheet to the main Zotero pane
  var zp = Zotero.getActiveZoteroPane()
  if (zp) {
    const doc = zp.document
    const link1 = doc.createElement('link')
    link1.id = stylesheetID
    link1.type = 'text/css'
    link1.rel = 'stylesheet'
    link1.href = `${rootURI}style.css`
    doc.documentElement.appendChild(link1)

    const link2 = doc.createElement('link')
    link2.id = ftlID
    link2.rel = 'localization'
    link2.href = 'zotero-remarkable.ftl'
    doc.documentElement.appendChild(link2)

    const menuitem = doc.createXULElement('menuitem')
    menuitem.id = menuitemID
    menuitem.setAttribute('type', 'checkbox')
    menuitem.setAttribute('data-l10n-id', 'make-it-green-instead')
    // MozMenuItem#checked is available in Zotero 7
    menuitem.addEventListener('command', () => Zotero.reMarkable.toggleGreen(menuitem.checked))
    doc.getElementById('menu_viewPopup').appendChild(menuitem)
  }

  Services.scriptloader.loadSubScript(`${rootURI}lib.js`)
  Zotero.reMarkable.foo()
}

export function shutdown() {
  log('Shutting down')

  // Remove stylesheet
  var zp = Zotero.getActiveZoteroPane()
  if (zp) {
    for (const id of addedElementIDs) {
      zp.document.getElementById(id)?.remove()
    }
  }

  Zotero.reMarkable = undefined
}

export function uninstall() {
  log('Uninstalled')
}
