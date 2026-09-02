import { fetchAndCompress } from "./helpers";

const plugin = {
  constants: {
    successCount: 0,
    failCount: 0,
    savedKB: 0,
  },

  noteOption: {
    "Optimize images": {
      check: async function () {
        return true;
      },
      run: async function (app, noteUUID) {
        let maxSizeKB = Number(
          await app.prompt("Enter max size in KB. (e.g. 500, 100, 200)"),
        );
        if (!Number.isInteger(maxSizeKB) || maxSizeKB <= 0) return;

        const noteHandle = { uuid: noteUUID };
        const images = await app.getNoteImages(noteHandle);

        if (images.length === 0) {
          await app.alert("No images found in this note.");
          return;
        }

        for (const image of images) {
          try {
            const corsURL = `https://amplenote-plugins-cors-anywhere.onrender.com/${image.src}`;

            const { compressedURL, savedKB } = await fetchAndCompress(
              corsURL,
              maxSizeKB,
            );
            const fileURL = await app.attachNoteMedia(
              noteHandle,
              compressedURL,
            );
            await app.updateNoteImage(noteHandle, image, { src: fileURL });

            this.constants.savedKB += savedKB;
            this.constants.successCount++;
          } catch (err) {
            this.constants.failCount++;
            console.error(`Failed to compress image: ${image.src}`, err);
          }
        }

        const summary = [
          `Optimized ${this.constants.successCount} of ${images.length} image${images.length === 1 ? "" : "s"} saving ${this.constants.savedKB}KBs of space`,
          failCount > 0
            ? `${failCount} failed — check console for details.`
            : null,
        ]
          .filter(Boolean)
          .join("\n");

        await app.alert(summary);
      },
    },
  },
};

export default plugin;
