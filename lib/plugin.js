import { fetchAndCompress } from "./helpers";

const plugin = {
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

        let successCount = 0,
          failCount = 0;

        const noteHandle = { uuid: noteUUID };
        const images = await app.getNoteImages(noteHandle);

        for (const image of images) {
          try {
            const corsURL = `https://amplenote-plugins-cors-anywhere.onrender.com/${image.src}`;

            const compressedURL = await fetchAndCompress(corsURL, maxSizeKB);
            const fileURL = await app.attachNoteMedia(
              noteHandle,
              compressedURL,
            );

            await app.updateNoteImage(noteHandle, image, { src: fileURL });
            successCount++;
          } catch (err) {
            failCount++;
            console.error(`Failed to compress image: ${image.src}`, err);
          }
        }

        app.alert(
          `Optimized ${successCount} of ${images.length} image${images.length === 1 ? "" : "s"}\n ${failCount} failed - check console for details.`,
        );
      },
    },
  },
};

export default plugin;
