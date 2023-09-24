declare const Zotero: any
declare const Services: any

var ftlId = 'zotero-remarkable-ftl'
var menuItemId = 'push-to-remarkable'
var addedElementIDs = [ftlId, menuItemId]

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

    const linkFtl = doc.createElement('link')
    linkFtl.id = ftlId
    linkFtl.rel = 'localization'
    linkFtl.href = 'zotero-remarkable.ftl'
    doc.documentElement.appendChild(linkFtl)

    const menuItem = doc.createXULElement('menuitem')
    menuItem.id = menuItemId
    menuItem.setAttribute('data-l10n-id', 'push-to-remarkable')
    menuItem.addEventListener('command', () => Zotero.reMarkable.pushToReMakable())
    doc.getElementById('menu_viewPopup').appendChild(menuItem)
  }

  Services.scriptloader.loadSubScript(`${rootURI}lib.js`)
  Zotero.reMarkable.init()
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
