declare const OS: any
declare const Services: any
declare const Zotero: any

declare const Components: any
const {
  utils: Cu,
} = Components

Cu.import("resource://gre/modules/osfile.jsm")

const PREF_DEVICE_TOKEN = "zotero-remarkable.device-token"
const PREF_ONE_TIME_CODE = "zotero-remarkable.one-time-code"
const PREF_PARENT_ID = "zotero-remarkable.parent-id"
const FIELD_EXTRA = "extra"
const FIELD_EXTRA_DOCID = "reMarkable-DocID"

let cachedClient = null

const extractExtraField = function(extra: string, fieldName: string): string {
  for (const line of extra.split("\n")) {
    const i = line.indexOf(":");
    const key = line.slice(0, i)
    const value = line.slice(i + 1)
    if (key.trim() === fieldName) {
      return value.trim()
    }
  }
  return null
}

class Progress {
  private win: any
  private progress: any
  private total: number
  private doneCounter: number

  constructor(total: number, message: string) {
    this.win = new Zotero.ProgressWindow({ closeOnClick: false })
    this.win.changeHeadline(`reMarkable: ${message}`)
    const icon = `chrome://zotero/skin/treesource-unfiled${Zotero.hiDPI ? '@2x' : ''}.png`
    this.progress = new this.win.ItemProgress(icon, message)

    this.total = total
    this.doneCounter = 0

    this.win.show()
  }

  next() {
    this.doneCounter++

    this.progress.setProgress((100 * this.doneCounter) / this.total)
  }

  status(message: string) {
    this.progress.setText(message)
  }

  done() {
    this.progress.setProgress(100)
    this.progress.setText('Done')
    this.win.startCloseTimer(500)
  }
}

class ReMarkable {
  deviceToken: string
  bearerToken: string

  async register(code: string) {
    this.log(`Registering with code ${code}`)
    // Make request
    const response = await fetch("https://webapp.cloud.remarkable.com/token/json/2/device/new", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: code,
        deviceDesc: "desktop-macos",
        deviceId: crypto.randomUUID(),
      }),
    })
    if (!response.ok) {
      throw new Error(`Device registration failed with status ${response.status} ${response.statusText}; body ${await response.text()}`)
    }
    const deviceToken = await response.text()
    this.deviceToken = deviceToken
    this.log(`Device registration successful, got device token ${deviceToken}`)
  }

  async refreshToken() {
    this.log("Refreshing device token")
    const response = await fetch("https://webapp.cloud.remarkable.com/token/json/2/user/new", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.deviceToken}`,
      },
    })
    if (!response.ok) {
      throw new Error(`Token refresh failed with status ${response.status} ${response.statusText}; body ${await response.text()}`)
    }
    const bearerToken = await response.text()
    this.bearerToken = bearerToken
    this.log(`Token refresh successful, got Bearer token ${bearerToken}`)
  }

  async uploadPdf(fileName: string, filePath: string, parentId?: string): Promise<string> {
    this.log(`Uploading PDF ${fileName} from ${filePath} to ${parentId}`)
    // The file content has to be wrapped in an file object, otherwise the
    // reMarkable cannot parse the PDF file. Figuring this out took ages as the
    // API does not return an error or so but silently accepts the data.
    const file = new File([await OS.File.read(filePath)], fileName)
    const response = await fetch("https://internal.cloud.remarkable.com/doc/v2/files", {
      method: "POST",
      body: file,
      headers: {
        "Authorization": `Bearer ${this.bearerToken}`,
        "Content-Type": "application/pdf",
        "rM-Meta": btoa(JSON.stringify({
          parent: parentId || "",
          file_name: fileName,
        })),
        "rM-Source": "WebLibrary",
      },
    });
    if (!response.ok) {
      throw new Error(`PDF upload failed with status ${response.status} ${response.statusText}; body ${await response.text()}`)
    }
    return (await response.json()).docID
  }

  setDeviceToken(deviceToken: string) {
    this.deviceToken = deviceToken
  }

  private log(message: string) {
    Zotero.debug(`reMarkable: ${message}`)
  }
}

Zotero.reMarkable = new class {
  progress: Progress

  log(message: string) {
    Zotero.debug(`reMarkable Integration for Zotero: ${message}`)
  }

  init() {
    // this resets the preference on every start, but that is fine---it is a one-time code, after all
    Zotero.Prefs.set(PREF_ONE_TIME_CODE, "INSERT ONE-TIME CODE FOR REMARKABLE HERE", true)
    if (!Zotero.Prefs.get(PREF_PARENT_ID, true)) {
      Zotero.Prefs.set(PREF_PARENT_ID, "", true)
    }
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

  async createReMarkableClient(): Promise<ReMarkable> {
    this.progress.status("Creating reMarkable client.")
    const client = new ReMarkable()
    const storedDeviceToken = Zotero.Prefs.get(PREF_DEVICE_TOKEN, true)
    if (storedDeviceToken) {
      this.log(`Fetched device token from preferences: ${storedDeviceToken}`)
      this.progress.status("Using stored device token.")
      client.setDeviceToken(storedDeviceToken)
    } else {
      // TODO: more user-friendly way of setting the code from https://my.remarkable.com/device/desktop/connect
      const code = Zotero.Prefs.get(PREF_ONE_TIME_CODE, true)
      this.progress.status(`Registering new client with one-time-code ${code}.`)
      await client.register(code)
      Zotero.Prefs.set(PREF_DEVICE_TOKEN, client.deviceToken, true)
    }
    this.progress.status("Refreshing token.")
    await client.refreshToken()
    return Promise.resolve(client)
  }

  async getReMarkableClient(): Promise<ReMarkable> {
    if (cachedClient) {
      this.progress.status("Using cached client.")
    } else {
      cachedClient = await this.createReMarkableClient()
    }
    return Promise.resolve(cachedClient)
  }

  async sendSingleAttachmentToReMarkable(attachment: any, client: ReMarkable, parentId?: string) {
    this.progress.status("Sending attachment.")
    const parentItem = Zotero.Items.get(attachment.parentItemID)
    const extra = parentItem.getField(FIELD_EXTRA)
    const existingId = extractExtraField(extra, FIELD_EXTRA_DOCID)
    const citationKey = Zotero.BetterBibTeX ? (Zotero.BetterBibTeX.KeyManager.get(parentItem.id) || {}).citationKey : null
    const fileNameWithExtension = citationKey || attachment.attachmentFilename
    const fileName = fileNameWithExtension.substring(0, fileNameWithExtension.lastIndexOf(".pdf")) || fileNameWithExtension
    const filePath = attachment.getFilePath()
    if (existingId) {
      this.log(`Attachment ${fileName} is already synced to reMarkable with ID ${existingId}`)
      this.progress.status("Attachment already uploaded.")
      return
    }
    this.progress.status(`Uploading PDF with file name ${fileName}.`)
    const id = await client.uploadPdf(fileName, filePath, parentId)
    this.log(`Upload of ${fileName} succeeded with document ID ${id}`)
    parentItem.setField(FIELD_EXTRA, `${extra}\n${FIELD_EXTRA_DOCID}: ${id}`)
  }

  async sendAttachmentstoReMarkable(attachments: any, parentId?: string) {
    this.progress.status("Getting client.")
    const client = await this.getReMarkableClient()
    for (const attachment of attachments) {
      await this.sendSingleAttachmentToReMarkable(attachment, client, parentId)
      this.progress.next()
    }
    this.progress.done()
  }

  pushToReMakable() {
    const selectedPdfs = this.getSelectedPdfs()
    const parentId = Zotero.Prefs.get(PREF_PARENT_ID, true)
    this.progress = new Progress(selectedPdfs.length, "Uploading Attachments")
    this.sendAttachmentstoReMarkable(selectedPdfs, parentId).then(() => this.log("Attachment upload successful"))
  }
}
