# Zotero for reMarkable
This is a tiny extension that allows pushing PDFs from [Zotero](https://www.zotero.org/) to the [reMarkable](https://remarkable.com/) in a quick way.
It is still work-in-progress (see [the list of to-dos](TODO.md))!
Currently most features are really fragile and the extension is not at all user-friendly.
You can, of course, still use it (I do).

## Installation
**NOTE: This plugin is only compatible with Zotero 7. You must use the beta or wait for the release.**
1. Go to [Releases](https://github.com/fdamken/zotero-remarkable/releases) and download the latest `.xpi` file.
2. In Zotero, open the Add-ons by clicking Tools -> Add-ons.
3. Click on the cogwheel and select `Install Add-on From File...`
4. Select the downloaded `.xpi` file.

### Setup
**NOTE: This process will become a lot more user-friendly in future releases.**
1. Go to [My reMarkable](https://my.remarkable.com/device/desktop/connect) to obtain a one-time registration code.
2. Open the config editor: Edit -> Settings -> Advanced -> Config Editor (scroll down for this).
3. Confirm the security warning.
4. Search for `remarkable` in the search bar.
5. Double-click on the value `INSERT ONE-TIME CODE FOR REMARKABLE HERE` of the entry `zotero-remarkable.one-time-code`.
6. Insert the one-time registration code you obtained in step 1.
7. Click on the checkmark and close the config editor and settings.
8. Select any paper that has a PDF attachment and click on Tools -> Push to reMarkable. (This must be done while the code is still valid.)
The PDF should now appear on the root folder of your reMarkable, although it might take some time due to the initial registration).

### Setting a Parent Folder
If you want to put your papers in a subfolder, you can configure the ID of the parent folder as follows:
1. Find out the ID of the folder you want to place your papers in. This can be done in [My Files](https://my.remarkable.com/myfiles) and requires more technical knowledge.
2. Open the config editor: Edit -> Settings -> Advanced -> Config Editor (scroll down for this).
3. Confirm the security warning.
4. Search for `remarkable` in the search bar.
5. Double-click on the value of the entry `zotero-remarkable.parent-id`.
6. Insert the ID you obtained in step 1.
7. Click on the checkmark and close the config editor and settings.
PDFs pushed to your reMarkable now appear in the selected folder and not root anymore.

## Further Information
### De-Duplication (Quirks)
Once you push a file to your reMarkable, you cannot push it again.
This is to prevent duplicates.
If you really want to push it again, e.g., if you deleted the file, you have to edit the `Extra` field of the corresponding entry and remove the line starting with `reMarkable-DocID`.

### Naming
If [BetterBibTeX](https://retorque.re/zotero-better-bibtex/) is installed, the files pushed to the reMarkable are named `${citationKey}.pdf`.
Otherwise, the original PDF file name is retained.

### Basic Troubleshooting
If the synchronization does not work, you can always delete the preference `zotero-remarkable.device-token` in the configuration editor (see above).
You then have to register the device again by following the setup guide above.
Note that this will **not** stop the de-duplication from happening, so no information is lost.
