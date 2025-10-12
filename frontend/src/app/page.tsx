"use client";
import React, { useRef, useState } from "react";
import { Box, Button, Typography, Paper, CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import * as pdfjs from "pdfjs-dist";
import { useImagesUpload } from "@/services/qrcode";

const workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string>("");


  const { mutate } = useImagesUpload();
  const readFileData = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // reader.result will be a string when readAsDataURL is used
        const result = reader.result;
        if (typeof result === "string") {
          resolve(result);
        } else {
          reject(new Error("Unexpected file reader result type"));
        }
      };
      reader.onerror = (err) => {
        reject(err);
      };
      reader.readAsDataURL(file);
    });
  };

  const convertPdfToImages = async (
    file: File
  ): Promise<{ images: string[]; pageCount: number }> => {
    const images: string[] = [];
    const data = await readFileData(file);

    // Use the imported pdfjs instance consistently
    const loadingTask = pdfjs.getDocument(data);
    const pdf = await loadingTask.promise;

    const canvas = document.createElement("canvas");
    for (let i = 0; i < pdf.numPages; i++) {
      const page = await pdf.getPage(i + 1);
      const viewport = page.getViewport({ scale: 1 });

      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not get canvas 2D context");

      canvas.height = viewport.height;
      canvas.width = viewport.width;
      // Render into the canvas element directly (pdfjs types require a canvas)
      await page.render({ canvasContext: context, canvas, viewport }).promise;
      images.push(canvas.toDataURL());
    }
    canvas.remove();
    return { images, pageCount: pdf.numPages };
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setMessage("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setMessage("");
    try {
      // First, convert the PDF to images and verify completeness
      const { images, pageCount } = await convertPdfToImages(selectedFile);
      if (images.length !== pageCount) {
        setMessage(
          `Conversion incomplete: expected ${pageCount} pages but got ${images.length} images.`
        );
        setUploading(false);
        return;
      }
      console.log("All pages converted successfully:", images);
      mutate(images, {
        onSuccess: () => {
          setMessage("Upload successful!");
        }
      });
      // If conversion succeeded for all pages, proceed to upload the original file
      // const formData = new FormData();
      // formData.append("file", selectedFile);
      // // Replace with your backend endpoint
      // const response = await fetch("/api/upload", {
      //   method: "POST",
      //   body: formData,
      // });
      // if (response.ok) {
      //   setMessage("Upload successful!");
      // } else {
      //   setMessage("Upload failed.");
      // }
    } catch (err) {
      console.error(err);
      setMessage("Error converting or uploading file.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Typography
        variant="h2"
        align="center"
        gutterBottom
        sx={{ fontWeight: 700, mt: 10 }}
      >
        PDF QR Code Scanner
      </Typography>
      <Typography
        variant="h6"
        align="center"
        color="text.secondary"
        sx={{ mb: 4 }}
      >
        Upload a PDF and this app will scan for QR codes, return their values,
        and check for errors in the process.
      </Typography>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="70vh"
        bgcolor="background.default"
      >
        <Paper elevation={3} sx={{ p: 4, minWidth: 320 }}>
          <Typography variant="h5" gutterBottom>
            Upload PDF
          </Typography>
          <input
            type="file"
            accept="application/pdf"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => fileInputRef.current?.click()}
            sx={{ mb: 2 }}
          >
            Choose PDF
          </Button>
          {selectedFile ? (
            <Typography variant="body2" sx={{ mb: 2 }}>
              Selected: {selectedFile.name}
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ mb: 2 }}>
              No file selected
            </Typography>
          )}
          <Button
            variant="contained"
            color="success"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
          {message && (
            <Typography variant="body2" color="secondary" sx={{ mt: 2 }}>
              {message}
            </Typography>
          )}
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
