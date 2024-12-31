/**
 * ASCII Art Converter
 * This module converts images to ASCII art using ImageMagick and custom BMP decoding.
 * It handles transparency and provides configurable output width.
 */

import {
  ImageMagick,
  type IMagickImage,
  initializeImageMagick,
  MagickColor,
  MagickFormat,
} from "@imagemagick/magick-wasm";

import { DenoDir } from "@deno/cache-dir";

// ASCII characters arranged from darkest to lightest for grayscale mapping
const ASCII_CHARS = "@%#*+=-:. ";

/**
 * Decodes BMP image data into RGB pixel information
 * Supports 24-bit and 32-bit BMP formats with BITMAPINFOHEADER
 */
class BMPDecoder {
  private data: Uint8Array;
  private pos = 0;

  constructor(data: Uint8Array) {
    this.data = data;
    if (!this.isValidBMP()) {
      throw new Error("Invalid BMP format");
    }
  }

  /**
   * Validates BMP file signature ('BM')
   */
  private isValidBMP(): boolean {
    return this.data[0] === 0x42 && this.data[1] === 0x4D;
  }

  /**
   * Reads a 32-bit unsigned integer from the current position
   */
  private readUint32(): number {
    const value = this.data[this.pos] |
      (this.data[this.pos + 1] << 8) |
      (this.data[this.pos + 2] << 16) |
      (this.data[this.pos + 3] << 24);
    this.pos += 4;
    return value >>> 0; // Convert to unsigned
  }

  /**
   * Reads a 16-bit unsigned integer from the current position
   */
  private readUint16(): number {
    const value = this.data[this.pos] | (this.data[this.pos + 1] << 8);
    this.pos += 2;
    return value;
  }

  /**
   * Extracts pixel data from BMP format into RGB array
   * Handles bottom-up storage and padding alignment
   */
  private readPixelData(
    width: number,
    height: number,
    bitsPerPixel: number,
    dataOffset: number,
  ): Uint8Array {
    const pixels = new Uint8Array(width * height * 3); // RGB format
    const bytesPerPixel = bitsPerPixel / 8;
    const padding = (4 - ((width * bytesPerPixel) % 4)) % 4; // BMP row padding
    let pixelIndex = 0;

    // Process rows bottom-to-top (BMP standard)
    for (let y = height - 1; y >= 0; y--) {
      const rowStart = dataOffset + (y * ((width * bytesPerPixel) + padding));
      for (let x = 0; x < width; x++) {
        const pixelStart = rowStart + (x * bytesPerPixel);

        // Convert BGR(A) to RGB
        if (bitsPerPixel === 24 || bitsPerPixel === 32) {
          pixels[pixelIndex] = this.data[pixelStart + 2]; // R
          pixels[pixelIndex + 1] = this.data[pixelStart + 1]; // G
          pixels[pixelIndex + 2] = this.data[pixelStart]; // B
        } else {
          throw new Error(`Unsupported bits per pixel: ${bitsPerPixel}`);
        }
        pixelIndex += 3;
      }
    }
    return pixels;
  }

  /**
   * Decodes BMP data into width, height, and RGB pixel array
   */
  decode(): { width: number; height: number; pixels: Uint8Array } {
    // Parse headers
    this.pos = 10; // Skip to data offset field
    const dataOffset = this.readUint32();
    const dibHeaderSize = this.readUint32();

    if (dibHeaderSize !== 40) { // BITMAPINFOHEADER size
      throw new Error("Only BITMAPINFOHEADER format is supported");
    }

    const width = this.readUint32();
    const height = this.readUint32();
    this.pos += 2; // Skip color planes
    const bitsPerPixel = this.readUint16();

    if (bitsPerPixel !== 24 && bitsPerPixel !== 32) {
      throw new Error("Only 24-bit and 32-bit BMP files are supported");
    }

    return {
      width,
      height,
      pixels: this.readPixelData(width, height, bitsPerPixel, dataOffset),
    };
  }
}

/**
 * Locates the ImageMagick WebAssembly file in the Deno cache
 * Uses Deno's package information commands to find the correct path
 */
function findMagickWasm(): string {
  // Construct wasm file path
  const denoDir = new DenoDir();

  return `${denoDir.root}/npm/registry.npmjs.org/@imagemagick/magick-wasm/0.0.32/dist/magick.wasm`;
}

/**
 * Converts an image file to ASCII art
 * @param filePath - Path to the input image file
 * @param width - Desired width of ASCII art output (height maintains aspect ratio)
 * @param transparentColor - RGB color to treat as transparent (defaults to white)
 * @returns Promise<string> - ASCII art representation of the image
 */
async function imageToAscii(
  filePath: string,
  width = 100,
  transparentColor: { r: number; g: number; b: number } = {
    r: 255,
    g: 255,
    b: 255,
  },
): Promise<string> {
  try {
    // Initialize ImageMagick with WebAssembly
    const wasm = await Deno.readFile(findMagickWasm());

    await initializeImageMagick(wasm);

    // Process image with ImageMagick
    let imgData: Uint8Array;
    const data = await Deno.readFile(filePath);

    ImageMagick.read(data, (img: IMagickImage) => {
      img.backgroundColor = new MagickColor("white");
      img.alpha(12); // Remove transparency
      img.alpha(9); // Alpha off
      img.write(MagickFormat.Bmp3, (data) => {
        imgData = data;
      });
    });

    // Decode BMP data
    const decoder = new BMPDecoder(imgData!);
    const { width: originalWidth, height: originalHeight, pixels } = decoder
      .decode();

    // Calculate dimensions maintaining aspect ratio
    const height = Math.round(width * (originalHeight / originalWidth));

    // Convert to ASCII art
    const rows: string[] = [];
    for (let y = 0; y < height; y++) {
      let row = "";
      for (let x = 0; x < width; x++) {
        // Map coordinates to original image
        const srcX = Math.floor((x / width) * originalWidth);
        const srcY = Math.floor((y / height) * originalHeight);
        const pixelIndex = (srcY * originalWidth + srcX) * 3;

        // Get RGB values
        const r = pixels[pixelIndex];
        const g = pixels[pixelIndex + 1];
        const b = pixels[pixelIndex + 2];

        // Handle transparency
        const tolerance = 5;
        const isTransparent = Math.abs(r - transparentColor.r) <= tolerance &&
          Math.abs(g - transparentColor.g) <= tolerance &&
          Math.abs(b - transparentColor.b) <= tolerance;

        if (isTransparent) {
          row += " ";
        } else {
          // Convert to grayscale and map to ASCII character
          const grayscale = r * 0.299 + g * 0.587 + b * 0.114;
          const charIndex = Math.floor(
            (grayscale / 255) * (ASCII_CHARS.length - 1),
          );
          row += ASCII_CHARS[charIndex];
        }
      }
      rows.push(row);
    }

    // Trim empty lines
    let startIndex = 0;
    let endIndex = rows.length - 1;

    while (startIndex < rows.length && rows[startIndex].trim() === "") {
      startIndex++;
    }
    while (endIndex >= 0 && rows[endIndex].trim() === "") {
      endIndex--;
    }

    return rows.slice(startIndex, endIndex + 1).join("\n");
  } catch (error) {
    throw new Error(
      `Failed to convert image to ASCII: ${
        error instanceof Error ? error.message : error
      }`,
    );
  }
}

// CLI handling
if (import.meta.main) {
  if (Deno.args.length < 1) {
    console.log("Usage: deno run ascii-converter.ts <image_file> [width]");
    Deno.exit(1);
  }

  try {
    const filePath = Deno.args[0];
    const width = Deno.args[1] ? parseInt(Deno.args[1]) : 100;
    const asciiArt = await imageToAscii(filePath, width);
    console.log(asciiArt);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    Deno.exit(1);
  }
}

export { imageToAscii };
