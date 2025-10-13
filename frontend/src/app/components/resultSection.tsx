import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { useCallback } from "react";

interface ScanResult {
  id: number;
  value: string;
  base64Image: string;
  status: string;
}

interface ResultSectionProps {
  data: ScanResult[];
  handleClose: () => void;
}

export default function ResultSection({
  data,
  handleClose,
}: ResultSectionProps) {
  const manipulateData = useCallback(() => {
    if (!data) return [];
    const existing: string[] = [];
    const manipulated = data.map((item) => {
      const ret = {
        id: item.id,
        value: item.value,
        status: item.status === "success" ? "Valid" : "Invalid",
        base64Image: item.base64Image,
      };
      if (item.value && existing.includes(item.value)) {
        ret.status = "Duplicate";
      }
      existing.push(item.value);
      return ret;
    });
    return manipulated;
  }, [data]);

  return (
    <div className="absolute bottom-0 left-0 w-full h-[70vh] bg-gray-800 flex flex-col">
      <div className="flex p-4 justify-end">
        <button
          className=" bg-red-500 text-white w-8 h-8 flex items-center justify-center rounded-md cursor-pointer"
          onClick={handleClose}
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
      {data && (
        <TableContainer component={Paper} className="h-full overflow-auto">
          <Table stickyHeader aria-label="scan results table">
            <TableHead>
              <TableRow>
                <TableCell>Id</TableCell>
                <TableCell>Image</TableCell>
                <TableCell>QR Code Value</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {manipulateData().map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.id + 1}</TableCell>
                  <TableCell>
                    <img
                      src={item.base64Image}
                      alt={`QR Code ${index}`}
                      className="w-32 h-32 object-contain"
                    />
                  </TableCell>
                  <TableCell>{item.value}</TableCell>
                  <TableCell>{item.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}
