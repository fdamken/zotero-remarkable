declare const Services: any
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

  // Copied from Zotfile.
  getSelectedAttachments() {
    const win = Services.wm.getMostRecentWindow("navigator:browser");
    let attachments = win.ZoteroPane.getSelectedItems()
        .map((item: any) => item.isRegularItem() ? item.getAttachments() : item)
        .reduce((a: any, b: any) => a.concat(b), [])
        .map((item: any) => typeof item == 'number' ? Zotero.Items.get(item) : item)
        .filter((item: any) => item.isAttachment())
        .filter((att: any) => att.attachmentLinkMode !== Zotero.Attachments.LINK_MODE_LINKED_URL)
        .map((att: any) => att.id)
    // remove duplicate elements
    if(attachments.length > 0) {
      attachments = Zotero.Utilities.arrayUnique(attachments)
    }
    return attachments;
  };

  // Insipired from Zotfile.
  getSelectedPdfs() {
    return Zotero.Items.get(this.getSelectedAttachments())
        .filter((attachment: any) => {
          const attachmentFileName = attachment.attachmentFilename
          const pos = attachmentFileName.lastIndexOf('.')
          const filetype = pos == -1 ? '' : attachmentFileName.substring(pos + 1).toLowerCase()
          return filetype == "pdf";
        })
  }

  pushToReMakable() {
    const selectedPdfs = this.getSelectedPdfs()
    this.log(`Pushing to reMarkable: ${selectedPdfs}`)
  }
}
