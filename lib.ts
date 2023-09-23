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
    Zotero.debug(`reMarkable Integration for Zotero: ${msg}`)
  }

  pushToReMakable() {
    this.log(`Pushing to reMarkable`)
  }
}
