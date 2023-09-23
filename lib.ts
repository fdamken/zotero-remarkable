declare const Zotero: any
/*
declare const Components: any
const {
  classes: Cc,
  interfaces: Ci,
  utils: Cu,
} = Components
*/

Zotero.reMarkable = new class {
  log(msg) {
    Zotero.debug(`reMarkable Integration for Zotero: ${  msg}`)
  }

  foo() {
    // Global properties are included automatically in Zotero 7
    const host = new URL('https://foo.com/path').host
    this.log(`Host is ${host}`)

    this.log(`Intensity is ${Zotero.Prefs.get('extensions.zotero-remarkable.intensity', true)}`)

    const parser = new DOMParser()
    const doc = parser.parseFromString('<foo><bar/></foo>', 'text/xml')
    this.log(doc.documentElement.outerHTML)
  }

  toggleGreen(enabled) {
    Zotero.getMainWindow().document.documentElement
      .toggleAttribute('data-green-instead', enabled)
  }
}
